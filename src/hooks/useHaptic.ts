"use client";

import { useCallback } from "react";

export function useHaptic() {
  const triggerHaptic = useCallback((ms: number = 50) => {
    if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
      try {
        navigator.vibrate(ms);
      } catch (e) {
        // Ignore if vibration is not supported or permitted
      }
    }
  }, []);

  return { triggerHaptic };
}
