// Qaryz — Database Webhook for shared_debts INSERT
// Triggers when a new shared debt is created.
// Sends a push notification to the other party.
// Requires VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY in Supabase secrets.
//
// Configure in Supabase Dashboard:
//   Database → Webhooks → Create
//   Table: shared_debts, Events: INSERT
//   HTTP URL: <project>.functions.supabase.co/debt-webhook
//   HTTP Method: POST
//   Auth header: Service role key

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

interface SharedDebtRecord {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  description: string | null;
  created_by: string;
  created_at: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: SharedDebtRecord;
  old_record: Record<string, unknown> | null;
}

// Service-role client for DB queries (bypasses RLS)
const getAdminClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, serviceRoleKey);
};

// Setup VAPID
const setupVapid = () => {
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error("VAPID keys not configured");
  }
  webpush.setVapidDetails(
    "mailto:support@qaryz.app",
    vapidPublicKey,
    vapidPrivateKey,
  );
};

// Send push notification to all devices of a user
const sendPush = async (
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) => {
  const adminClient = getAdminClient();

  const { data: subscriptions, error: subError } = await adminClient
    .from("push_subscriptions")
    .select("endpoint, p256dh_key, auth_key")
    .eq("user_id", userId);

  if (subError || !subscriptions || subscriptions.length === 0) {
    console.log(`No push subscription for user ${userId}`);
    return;
  }

  const payload = JSON.stringify({
    title,
    body,
    tag: "qaryz-debt",
    data: { url: "/", ...(data ?? {}) },
  });

  let delivered = false;

  for (const sub of subscriptions) {
    try {
      const subscription: webpush.PushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
      };

      const result = await webpush.sendNotification(subscription, payload, {
        TTL: 86400,
        urgency: "normal",
      });

      if (result.statusCode === 201) {
        delivered = true;
      }
    } catch (err) {
      console.error(`Failed to send push to subscription:`, err);
    }
  }

  // Log to notifications table
  await adminClient.from("notifications").insert({
    user_id: userId,
    title,
    body,
    data: data ?? {},
    tag: "qaryz-debt",
    delivered,
  });
};

// Fetch user's display name
const getUserName = async (userId: string): Promise<string> => {
  const adminClient = getAdminClient();
  const { data } = await adminClient
    .from("profiles")
    .select("name")
    .eq("id", userId)
    .single();
  return data?.name ?? "Пользователь";
};

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    setupVapid();

    const payload: WebhookPayload = await req.json();

    if (payload.type !== "INSERT" || !payload.record) {
      return new Response(JSON.stringify({ error: "Unsupported event" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const debt = payload.record;

    // Determine who to notify: the other party (not the creator)
    let notifyUserId: string;
    let direction: string;

    if (debt.created_by === debt.from_user_id) {
      // Creator is the borrower → notify the lender (to_user_id)
      notifyUserId = debt.to_user_id;
      direction = "lent";
    } else {
      // Creator is the lender → notify the borrower (from_user_id)
      notifyUserId = debt.from_user_id;
      direction = "borrowed";
    }

    // Don't notify yourself
    if (notifyUserId === debt.created_by) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "self-debt" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get the creator's name for the notification text
    const creatorName = await getUserName(debt.created_by);

    const amountFormatted = debt.amount.toLocaleString("ru-RU", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    let title: string;
    let body: string;

    if (direction === "lent") {
      title = `${creatorName} должен вам ${amountFormatted} ₸`;
      body = debt.description
        ? `За: ${debt.description}`
        : `Новый долг от ${creatorName}`;
    } else {
      title = `Вы должны ${creatorName} ${amountFormatted} ₸`;
      body = debt.description
        ? `За: ${debt.description}`
        : `${creatorName} записал(а) ваш долг`;
    }

    await sendPush(notifyUserId, title, body, {
      url: "/",
      debtId: debt.id,
      type: "shared_debt_created",
    });

    return new Response(
      JSON.stringify({ success: true, notifiedUserId: notifyUserId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("debt-webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
