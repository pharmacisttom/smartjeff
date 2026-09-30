"use client";

import { useEffect, useState } from "react";

const LONGDO_API_KEY = "a17a7f79ad9e58f7897adb8a2896c7bb";
const LONGDO_SCRIPT_ID = "longdo-map-api";

export function useLongdoMap() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already loaded
    if ((window as any).longdo) {
      setIsLoaded(true);
      return;
    }

    // Prevent duplicate script injection
    if (document.getElementById(LONGDO_SCRIPT_ID)) {
      const interval = setInterval(() => {
        if ((window as any).longdo) {
          setIsLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }

    const script = document.createElement("script");
    script.id = LONGDO_SCRIPT_ID;
    script.src = `https://api.longdo.com/map/?key=${LONGDO_API_KEY}`;
    script.async = true;
    script.onload = () => {
      const interval = setInterval(() => {
        if ((window as any).longdo) {
          setIsLoaded(true);
          clearInterval(interval);
        }
      }, 100);
    };
    script.onerror = () => setIsError(true);
    document.head.appendChild(script);
  }, []);

  return { isLoaded, isError };
}
