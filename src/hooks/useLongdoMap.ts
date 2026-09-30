"use client";

import { useEffect, useState } from "react";
import { loadLongdoMapSdk, LongdoClientLoadOptions } from "@/lib/longdo/client";

export function useLongdoMap(options?: LongdoClientLoadOptions) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadLongdoMapSdk(options)
      .then(() => {
        if (mounted) setIsLoaded(true);
      })
      .catch((err) => {
        console.error("useLongdoMap load error:", err);
        if (mounted) setIsError(true);
      });

    return () => {
      mounted = false;
    };
  }, [options?.apiVersion]);

  return { isLoaded, isError };
}
