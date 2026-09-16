import { getPendingCheckIns, markCheckInStatus, cleanupSyncedRecords } from "./offline-db";

let isSyncing = false;

export interface SyncResult {
  successCount: number;
  failCount: number;
  errors: string[];
}

/**
 * Execute sync process for all pending offline items
 */
export async function syncAll(): Promise<SyncResult> {
  if (isSyncing) {
    return { successCount: 0, failCount: 0, errors: ["Sync is already in progress"] };
  }

  if (typeof window !== "undefined" && !navigator.onLine) {
    return { successCount: 0, failCount: 0, errors: ["No internet connection"] };
  }

  isSyncing = true;
  let successCount = 0;
  let failCount = 0;
  const errors: string[] = [];

  try {
    const pendingItems = await getPendingCheckIns();

    if (pendingItems.length === 0) {
      isSyncing = false;
      return { successCount: 0, failCount: 0, errors: [] };
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("smarto:sync-start", { detail: { count: pendingItems.length } }));
    }

    for (const item of pendingItems) {
      if (!item.id) continue;

      await markCheckInStatus(item.id, "syncing");

      try {
        const formData = new FormData();
        formData.append("localId", item.localId);
        formData.append("employeeId", item.employeeId);
        formData.append("type", item.type);
        formData.append("timestamp", String(item.timestamp));
        formData.append("lat", String(item.lat));
        formData.append("lng", String(item.lng));
        formData.append("accuracy", String(item.accuracy));
        formData.append("photoHash", item.photoHash);
        formData.append("deviceInfo", item.deviceInfo || "Mobile PWA");
        if (item.note) formData.append("note", item.note);

        if (item.photoBlob) {
          formData.append("photo", item.photoBlob, `checkin_${item.localId}.webp`);
        }

        const response = await fetch("/api/checkin/sync", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          await markCheckInStatus(item.id, "synced");
          successCount++;
        } else {
          const errJson = await response.json().catch(() => ({ message: "Sync API request failed" }));
          const errMsg = errJson.message || `Server error: ${response.status}`;
          await markCheckInStatus(item.id, "failed", errMsg);
          failCount++;
          errors.push(errMsg);
        }
      } catch (e: any) {
        const errMsg = e.message || "Network error during sync";
        await markCheckInStatus(item.id, "failed", errMsg);
        failCount++;
        errors.push(errMsg);
      }
    }

    // Clean up old synced records
    await cleanupSyncedRecords();

  } finally {
    isSyncing = false;
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("smarto:sync-complete", {
          detail: { successCount, failCount, errors },
        })
      );
    }
  }

  return { successCount, failCount, errors };
}

/**
 * Setup automatic sync triggers (online event, visibility change, polling interval)
 */
export function setupAutoSync() {
  if (typeof window === "undefined") return;

  // Trigger 1: Network online event
  window.addEventListener("online", () => {
    setTimeout(() => {
      syncAll();
    }, 2000);
  });

  // Trigger 2: Tab visibility change
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      syncAll();
    }
  });

  // Trigger 3: Periodic polling interval (every 5 minutes)
  setInterval(() => {
    if (navigator.onLine) {
      syncAll();
    }
  }, 5 * 60 * 1000);

  // Trigger 4: Initial sync after app mount if online
  if (navigator.onLine) {
    setTimeout(() => {
      syncAll();
    }, 3000);
  }
}
