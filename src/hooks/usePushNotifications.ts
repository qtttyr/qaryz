import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "";

/**
 * Converts a base64 string to Uint8Array (required by PushManager.subscribe).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export type PushPermissionState =
  | "prompt"
  | "granted"
  | "denied"
  | "unsupported";

interface UsePushNotificationsReturn {
  permission: PushPermissionState;
  subscribed: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<void>;
  loading: boolean;
  supported: boolean;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const user = useAuthStore((s) => s.user);
  const [permission, setPermission] = useState<PushPermissionState>("prompt");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const supported =
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  // Check current permission + subscription on mount
  useEffect(() => {
    if (!supported || !user) return;

    setPermission(Notification.permission as PushPermissionState);

    const checkSubscription = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      } catch {
        setSubscribed(false);
      }
    };

    checkSubscription();
  }, [supported, user]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!supported || !user) return false;
    setLoading(true);

    try {
      // 1. Request permission
      let perm = Notification.permission;
      if (perm === "default") {
        perm = await Notification.requestPermission();
      }
      setPermission(perm as PushPermissionState);

      if (perm !== "granted") {
        setLoading(false);
        return false;
      }

      // 2. Get service worker registration
      const reg = await navigator.serviceWorker.ready;

      // 3. Subscribe to push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      // 4. Store subscription in Supabase via RPC (bypasses RLS)
      const subJSON = sub.toJSON();
      const { error: rpcError } = await supabase.rpc(
        "upsert_push_subscription",
        {
          p_endpoint: subJSON.endpoint!,
          p_p256dh_key: subJSON.keys!.p256dh,
          p_auth_key: subJSON.keys!.auth,
        },
      );

      if (rpcError) {
        // Fallback: try direct upsert in case RPC doesn't exist (old migration)
        console.warn("RPC upsert failed, trying direct insert:", rpcError);
        const { error: directError } = await supabase
          .from("push_subscriptions")
          .upsert(
            {
              user_id: user.id,
              endpoint: subJSON.endpoint!,
              p256dh_key: subJSON.keys!.p256dh,
              auth_key: subJSON.keys!.auth,
            },
            { onConflict: "user_id, endpoint" },
          );

        if (directError) {
          console.error("Direct upsert also failed:", directError);
          await sub.unsubscribe();
          setLoading(false);
          return false;
        }
      }

      setSubscribed(true);
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Push subscribe error:", err);
      setLoading(false);
      return false;
    }
  }, [supported, user]);

  const unsubscribe = useCallback(async () => {
    if (!supported || !user) return;
    setLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
      }

      // Remove from DB via RPC
      const { error: rpcError } = await supabase.rpc(
        "remove_push_subscription",
        { p_endpoint: null },
      );

      if (rpcError) {
        // Fallback: direct delete
        console.warn("RPC remove failed, trying direct delete:", rpcError);
        const { error: directError } = await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id);

        if (directError) {
          console.error("Direct delete also failed:", directError);
        }
      }

      setSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe error:", err);
    }

    setLoading(false);
  }, [supported, user]);

  return {
    permission,
    subscribed,
    subscribe,
    unsubscribe,
    loading,
    supported,
  };
}
