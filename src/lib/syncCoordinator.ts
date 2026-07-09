/**
 * Sync Coordinator — debounces and deduplicates sync calls.
 *
 * Prevents multiple concurrent syncs and provides toast feedback on errors.
 */
import { showToast } from "@/components/shared/Toast";

type SyncKey = "debts" | "friends" | "shared-debts";

const inProgress = new Set<SyncKey>();
const pendingCalls = new Map<SyncKey, (() => Promise<void>)[]>();

/**
 * Execute a sync function with coordination:
 * - If a sync with the same key is already in progress, the call is queued
 * - On error, shows a toast notification
 * - Only one sync per key runs at a time
 */
export async function coordinatedSync(
  key: SyncKey,
  syncFn: () => Promise<void>,
  options?: { silent?: boolean }
): Promise<void> {
  // If already syncing, queue this call (last one wins)
  if (inProgress.has(key)) {
    const existing = pendingCalls.get(key) || [];
    existing.push(syncFn);
    // Keep only the latest queued call
    if (existing.length > 1) {
      existing.shift();
    }
    pendingCalls.set(key, existing);
    return;
  }

  inProgress.add(key);

  try {
    await syncFn();
  } catch (e) {
    console.error(`Sync failed [${key}]:`, e);
    if (!options?.silent) {
      showToast("Ошибка синхронизации. Попробуйте позже.", "error");
    }
  } finally {
    inProgress.delete(key);

    // Process queued calls
    const queued = pendingCalls.get(key) || [];
    pendingCalls.delete(key);
    if (queued.length > 0) {
      const next = queued[queued.length - 1];
      await coordinatedSync(key, next, options);
    }
  }
}

/** Check if a sync is currently running for the given key */
export function isSyncInProgress(key: SyncKey): boolean {
  return inProgress.has(key);
}
