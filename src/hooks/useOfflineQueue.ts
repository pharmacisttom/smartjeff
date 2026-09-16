"use client";

import { useState, useEffect, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { offlineDB, type PendingCheckIn } from "@/lib/offline-db";
import { syncAll } from "@/lib/sync-manager";

export function useOfflineQueue() {
  const pendingItems = useLiveQuery(() => offlineDB.pendingCheckIns.toArray()) || [];
  const [isSyncing, setIsSyncing] = useState(false);

  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await syncAll();
      return res;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const removeItem = useCallback(async (id: number) => {
    await offlineDB.pendingCheckIns.delete(id);
  }, []);

  return {
    pendingItems,
    isSyncing,
    syncNow,
    removeItem,
    totalCount: pendingItems.length,
    pendingCount: pendingItems.filter((i) => i.status === "pending").length,
    failedCount: pendingItems.filter((i) => i.status === "failed").length,
  };
}
