import webpush from "npm:web-push";
import { createClient } from "@supabase/supabase-js";

// Configure VAPID keys from environment
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const vapidSubject =
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@qaryz.app";

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

// Create admin client for database access (service_role)
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

interface SendPushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sourceType?: string;
  sourceId?: string;
}

Deno.serve(async (req) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload: SendPushPayload = await req.json();

    if (!payload.userId || !payload.title || !payload.body) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: userId, title, body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get all subscriptions for this user
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh_key, auth_key")
      .eq("user_id", payload.userId);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          sent: 0,
          total: 0,
          message: "No subscriptions found",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Insert notification history
    await supabaseAdmin.from("notifications").insert({
      user_id: payload.userId,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? null,
      source_type: payload.sourceType ?? null,
      source_id: payload.sourceId ?? null,
    });

    // Send push to each subscription
    let sent = 0;
    const expiredIds: string[] = [];

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key,
          },
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: "/Q.png",
            badge: "/Q.png",
            data: payload.data ?? {},
          }),
        );
        sent++;
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        // Subscription expired or invalid — remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          expiredIds.push(sub.id);
        } else {
          console.error(
            `Error sending to subscription ${sub.id}:`,
            error.message,
          );
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .in("id", expiredIds);
    }

    return new Response(
      JSON.stringify({
        sent,
        total: subscriptions.length,
        expired: expiredIds.length,
        message: `${sent} of ${subscriptions.length} notifications sent`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Error processing request:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
