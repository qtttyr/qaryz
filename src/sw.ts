/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

declare let self: ServiceWorkerGlobalScope;

// Clean old caches and precache app assets
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

// Push event — show notification
self.addEventListener("push", (event) => {
  let data: {
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
  } = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: "Qaryz", body: event.data.text() };
    }
  }

  const options: NotificationOptions = {
    body: data.body || "Новое уведомление",
    icon: data.icon || "/Q.png",
    badge: data.badge || "/Q.png",
    data: data.data || {},
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Qaryz", options),
  );
});

// Notification click — focus or open app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = new URL("/", self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If already open, focus it
        for (const client of windowClients) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});
