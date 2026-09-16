"use client";

import { useState, useEffect, useCallback } from "react";
import { getQueueStats } from "@/lib/offline-db";

export function useQueueStats() {
  const [stats, setStats] = useState({
    pending: 0,
    failed: 0,
    syncing: 0,
    synced: 0,
    total: 0,
  });

  const refreshStats = useCallback(async () => {
    try {
      const res = await getQueueStats();
      setStats(res);
    } catch (e) {
      // Ignore
    }
  }, []);

  useEffect(() => {
    refreshStats();

    const handleQueued = () => refreshStats();
    const handleSyncComplete = () => refreshStats();

    if (typeof window !== "undefined") {
      window.addEventListener("smarto:queued", handleQueued);
      window.addEventListener("smarto:sync-complete", handleSyncComplete);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("smarto:queued", handleQueued);
        window.removeEventListener("smarto:sync-complete", handleSyncComplete);
      }
    };
  }, [refreshStats]);

  return { ...stats, refresh: refreshStats };
}
