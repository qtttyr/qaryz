import { useState, useEffect, useCallback } from "react";

interface UseSWUpdateReturn {
  needsRefresh: boolean;
  update: () => void;
  dismiss: () => void;
}

export function useSWUpdate(): UseSWUpdateReturn {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Only run if service workers are supported
    if (!("serviceWorker" in navigator)) return;

    const registerSW = async () => {
      const reg = await navigator.serviceWorker.getRegistration();

      if (!reg) return;

      // Check every 60 seconds for updates
      const interval = setInterval(() => {
        reg.update();
      }, 60_000);

      // When a new SW is found
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          // "installed" means the new SW has downloaded and is waiting to activate
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setNeedsRefresh(true);
            setWaitingWorker(newWorker);
          }
        });
      });

      return () => clearInterval(interval);
    };

    registerSW();
  }, []);

  const update = useCallback(() => {
    if (!waitingWorker) return;

    // Tell the waiting SW to skip waiting
    waitingWorker.postMessage({ type: "SKIP_WAITING" });

    // When it activates, reload all pages
    waitingWorker.addEventListener("statechange", () => {
      if (waitingWorker.state === "activated") {
        window.location.reload();
      }
    });

    setNeedsRefresh(false);
  }, [waitingWorker]);

  const dismiss = useCallback(() => {
    setNeedsRefresh(false);
  }, []);

  return { needsRefresh, update, dismiss };
}
