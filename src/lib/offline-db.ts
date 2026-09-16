import Dexie, { type Table } from "dexie";

export interface PendingCheckIn {
  id?: number;
  localId: string;              // crypto.randomUUID()
  employeeId: string;
  type: "CHECK_IN" | "CHECK_OUT" | "OT_IN" | "OT_OUT";
  timestamp: number;
  lat: number;
  lng: number;
  accuracy: number;
  distance?: number;
  isWithinGeofence?: boolean;
  photoBlob?: Blob;
  photoDataUrl?: string;
  photoHash: string;            // SHA-256 for idempotency
  note?: string;
  deviceInfo: string;
  status: "pending" | "syncing" | "synced" | "failed";
  syncAttempts: number;
  lastSyncError?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PendingLeave {
  id?: number;
  localId: string;
  employeeId: string;
  type: "SICK" | "PERSONAL" | "VACATION" | "OT";
  startDate: string;
  endDate: string;
  reason?: string;
  status: "pending" | "syncing" | "synced" | "failed";
  createdAt: number;
}

export interface CachedEmployee {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  siteId: string;
  cachedAt: number;
}

export interface CachedSite {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  cachedAt: number;
}

export interface SyncLog {
  id?: number;
  localId: string;
  status: "synced" | "failed";
  error?: string;
  timestamp: number;
}

export class SmartoOfflineDB extends Dexie {
  pendingCheckIns!: Table<PendingCheckIn, number>;
  pendingLeaves!: Table<PendingLeave, number>;
  employees!: Table<CachedEmployee, string>;
  sites!: Table<CachedSite, string>;
  syncLogs!: Table<SyncLog, number>;

  constructor() {
    super("smarto-offline");
    this.version(1).stores({
      pendingCheckIns: "++id, localId, employeeId, status, createdAt",
      pendingLeaves: "++id, localId, employeeId, status, createdAt",
      employees: "id, code, siteId, cachedAt",
      sites: "id, code, cachedAt",
      syncLogs: "++id, localId, status, timestamp",
    });
  }
}

export const offlineDB = new SmartoOfflineDB();

/**
 * Helper to queue a new check-in into IndexedDB
 */
export async function queueCheckIn(
  data: Omit<PendingCheckIn, "id" | "status" | "syncAttempts" | "createdAt" | "updatedAt">
): Promise<number> {
  const now = Date.now();
  const record: PendingCheckIn = {
    ...data,
    status: "pending",
    syncAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };

  const id = await offlineDB.pendingCheckIns.add(record);

  // Dispatch custom event for reactive UI updates across components
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("smarto:queued", { detail: { localId: data.localId } }));
  }

  return id;
}

/**
 * Get all pending check-in items ready for sync
 */
export async function getPendingCheckIns(): Promise<PendingCheckIn[]> {
  return await offlineDB.pendingCheckIns.where("status").equals("pending").toArray();
}

/**
 * Mark a check-in status in IndexedDB
 */
export async function markCheckInStatus(
  id: number,
  status: "pending" | "syncing" | "synced" | "failed",
  error?: string
) {
  const updateData: Partial<PendingCheckIn> = {
    status,
    updatedAt: Date.now(),
  };

  if (error) {
    updateData.lastSyncError = error;
  }

  if (status === "syncing") {
    const current = await offlineDB.pendingCheckIns.get(id);
    if (current) {
      updateData.syncAttempts = (current.syncAttempts || 0) + 1;
    }
  }

  await offlineDB.pendingCheckIns.update(id, updateData);
}

/**
 * Remove synced records older than 7 days to manage storage quota
 */
export async function cleanupSyncedRecords() {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  await offlineDB.pendingCheckIns
    .where("createdAt")
    .below(sevenDaysAgo)
    .and((item) => item.status === "synced")
    .delete();
}

/**
 * Get overall offline queue statistics
 */
export async function getQueueStats() {
  const pending = await offlineDB.pendingCheckIns.where("status").equals("pending").count();
  const failed = await offlineDB.pendingCheckIns.where("status").equals("failed").count();
  const syncing = await offlineDB.pendingCheckIns.where("status").equals("syncing").count();
  const synced = await offlineDB.pendingCheckIns.where("status").equals("synced").count();

  return { pending, failed, syncing, synced, total: pending + failed + syncing };
}
