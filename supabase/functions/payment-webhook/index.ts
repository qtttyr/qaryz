// Qaryz — Database Webhook for payments INSERT
// Triggers when a payment is made on a debt.
// Sends a push notification to the other party.
// Requires VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY in Supabase secrets.
//
// Configure in Supabase Dashboard:
//   Database → Webhooks → Create
//   Table: payments, Events: INSERT
//   HTTP URL: <project>.functions.supabase.co/payment-webhook
//   HTTP Method: POST
//   Auth header: Service role key

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

interface PaymentRecord {
  id: string;
  user_id: string;
  debt_id: string;
  amount: number;
  note: string | null;
  type: "partial" | "full";
  created_at: string;
}

interface DebtRow {
  id: string;
  user_id: string;
  person_id: string;
  direction: "owed_to_me" | "i_owe";
  amount: number;
  description: string | null;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: PaymentRecord;
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
    tag: "qaryz-payment",
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
    tag: "qaryz-payment",
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

// Fetch the person's name associated with a debt
const getPersonName = async (personId: string): Promise<string> => {
  const adminClient = getAdminClient();
  const { data } = await adminClient
    .from("persons")
    .select("name")
    .eq("id", personId)
    .single();
  return data?.name ?? "Кто-то";
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
    const adminClient = getAdminClient();

    const payload: WebhookPayload = await req.json();

    if (payload.type !== "INSERT" || !payload.record) {
      return new Response(JSON.stringify({ error: "Unsupported event" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payment = payload.record;

    // Look up the debt to know direction and debtor
    const { data: debt, error: debtError } = await adminClient
      .from("debts")
      .select("id, user_id, person_id, direction, amount, description")
      .eq("id", payment.debt_id)
      .single();

    if (debtError || !debt) {
      console.error(`Debt ${payment.debt_id} not found`);
      return new Response(JSON.stringify({ error: "Debt not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amountFormatted = payment.amount.toLocaleString("ru-RU", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    const personName = await getPersonName(debt.person_id);
    const userName = await getUserName(payment.user_id);

    let notifyUserId: string;
    let title: string;
    let body: string;

    if (debt.direction === "owed_to_me") {
      title = `Платёж получен от ${personName}`;
      body =
        `${amountFormatted} ₸ — ${payment.type === "full" ? "полный расчёт" : "частичная оплата"}`;
      notifyUserId = debt.user_id;
    } else {
      title = `Вы заплатили ${personName} ${amountFormatted} ₸`;
      body = payment.note
        ? `${payment.type === "full" ? "Полный расчёт" : "Частичная оплата"}: ${payment.note}`
        : payment.type === "full"
          ? "Полный расчёт"
          : "Частичная оплата";
      notifyUserId = debt.user_id;
    }

    // For shared debts (friend-to-friend), also notify the other system user
    if (debt.description?.includes("🔗 shared:")) {
      const { data: sharedDebt } = await adminClient
        .from("shared_debts")
        .select("from_user_id, to_user_id")
        .eq("id", payment.debt_id)
        .single();

      if (sharedDebt) {
        const otherUserId = sharedDebt.from_user_id === payment.user_id
          ? sharedDebt.to_user_id
          : sharedDebt.from_user_id;

        const paymentType =
          payment.type === "full" ? "полный расчёт" : "частичная оплата";
        const otherTitle = `${userName} отметил(а) платёж ${amountFormatted} ₸`;
        const otherBody = `${paymentType}${payment.note ? `: ${payment.note}` : ""}`;

        await sendPush(otherUserId, otherTitle, otherBody, {
          url: "/",
          paymentId: payment.id,
          debtId: payment.debt_id,
          type: "payment_received",
        });
      }
    }

    // Always send to the debt owner
    await sendPush(notifyUserId, title, body, {
      url: "/",
      paymentId: payment.id,
      debtId: payment.debt_id,
      type: "payment_recorded",
    });

    return new Response(
      JSON.stringify({ success: true, notifiedUserId: notifyUserId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("payment-webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
