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
  subscribe: () => Promise<void>;
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

  const subscribe = useCallback(async () => {
    if (!supported || !user) return;
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
        return;
      }

      // 2. Get service worker registration
      const reg = await navigator.serviceWorker.ready;

      // 3. Subscribe to push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      // 4. Store subscription in Supabase
      const subJSON = sub.toJSON();
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subJSON.endpoint!,
          p256dh_key: subJSON.keys!.p256dh,
          auth_key: subJSON.keys!.auth,
        },
        { onConflict: "user_id, endpoint" },
      );

      if (error) {
        console.error("Failed to save push subscription:", error);
        await sub.unsubscribe();
        setLoading(false);
        return;
      }

      setSubscribed(true);
    } catch (err) {
      console.error("Push subscribe error:", err);
    }

    setLoading(false);
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

      // Remove from DB
      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to remove push subscription:", error);
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
