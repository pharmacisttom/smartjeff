"use client";

import { useState, useEffect, useCallback } from "react";

export type NetworkStatus = "online" | "offline" | "slow" | "unknown";

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>("online");
  const [isOnline, setIsOnline] = useState(true);

  const checkPing = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!navigator.onLine) {
      setStatus("offline");
      setIsOnline(false);
      return;
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch("/api/ping", {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const duration = Date.now() - start;
      if (res.ok) {
        if (duration > 3000) {
          setStatus("slow");
        } else {
          setStatus("online");
        }
        setIsOnline(true);
      } else {
        setStatus("slow");
      }
    } catch (e) {
      // If server doesn't respond or network drops
      if (!navigator.onLine) {
        setStatus("offline");
        setIsOnline(false);
      } else {
        setStatus("slow");
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkPing();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    checkPing();

    // Heartbeat ping every 30s
    const interval = setInterval(checkPing, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [checkPing]);

  return { status, isOnline, isOffline: !isOnline, isSlow: status === "slow", recheck: checkPing };
}
