// Qaryz — Nudge Push Notification
// Client-callable function. Sends a push notification when someone gets "poked".
//
// Requires VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY in Supabase secrets.
//
// Usage from client:
//   supabase.functions.invoke("nudge", { body: { targetUserId } })

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // CORS preflight
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
    // ── Auth: verify the caller ──
    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${authHeader}` } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Parse request ──
    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "Missing targetUserId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Don't notify yourself
    if (targetUserId === user.id) {
      return new Response(JSON.stringify({ skipped: true, reason: "self-nudge" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Get sender's name ──
    const { data: senderProfile } = await supabaseClient
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    const senderName = senderProfile?.name || "Кто-то";

    // ── Setup VAPID ──
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

    // ── Get target user's push subscriptions ──
    const adminClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: subscriptions, error: subError } = await adminClient
      .from("push_subscriptions")
      .select("id, endpoint, p256dh_key, auth_key")
      .eq("user_id", targetUserId);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, total: 0, message: "No subscriptions" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ── Send push to all devices ──
    const payload = JSON.stringify({
      title: "👆 Тебя тыкнули!",
      body: `${senderName} тыкнул(а) тебя в Qaryz`,
      icon: "/Q.png",
      badge: "/Q.png",
      data: { url: "/", type: "nudge" },
    });

    let sent = 0;
    const expiredIds: string[] = [];

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
        };

        await webpush.sendNotification(pushSubscription, payload, {
          TTL: 86400,
          urgency: "low",
        });
        sent++;
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        if (error.statusCode === 410 || error.statusCode === 404) {
          expiredIds.push(sub.id);
        } else {
          console.error(
            `Error sending nudge to subscription ${sub.id}:`,
            error.message,
          );
        }
      }
    }

    // ── Clean up expired subscriptions ──
    if (expiredIds.length > 0) {
      await adminClient
        .from("push_subscriptions")
        .delete()
        .in("id", expiredIds);
    }

    // ── Log notification ──
    await adminClient.from("notifications").insert({
      user_id: targetUserId,
      title: "👆 Тебя тыкнули!",
      body: `${senderName} тыкнул(а) тебя в Qaryz`,
      data: { type: "nudge", nudgedBy: user.id },
      tag: "qaryz-nudge",
      delivered: sent > 0,
    });

    return new Response(
      JSON.stringify({
        sent,
        total: subscriptions.length,
        expired: expiredIds.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("nudge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
