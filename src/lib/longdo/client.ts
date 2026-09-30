/**
 * Longdo Map Browser Client JS Integration Helper
 * SmartOP / SmartJeff Enterprise Operations Platform
 */

import { LONGDO_CONFIG } from "./config";

const LONGDO_SCRIPT_ID = "longdo-map-api-script";

export interface LongdoClientLoadOptions {
  apiVersion?: "v2" | "v3";
  language?: "th" | "en";
}

export function loadLongdoMapSdk(options?: LongdoClientLoadOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Longdo Map JS SDK can only be loaded in browser environment"));
      return;
    }

    if ((window as any).longdo) {
      resolve((window as any).longdo);
      return;
    }

    const apiKey = LONGDO_CONFIG.browserKey;
    if (!apiKey) {
      console.warn("[Longdo Map] Public API key (NEXT_PUBLIC_LONGDO_MAP_KEY) is missing.");
    }

    const existingScript = document.getElementById(LONGDO_SCRIPT_ID);
    if (existingScript) {
      const interval = setInterval(() => {
        if ((window as any).longdo) {
          clearInterval(interval);
          resolve((window as any).longdo);
        }
      }, 100);
      return;
    }

    const version = options?.apiVersion || "v3";
    const baseUrl =
      version === "v3"
        ? LONGDO_CONFIG.endpoints.scriptSdkV3
        : LONGDO_CONFIG.endpoints.scriptSdkV2;

    const script = document.createElement("script");
    script.id = LONGDO_SCRIPT_ID;
    script.src = `${baseUrl}?key=${apiKey}`;
    script.async = true;

    script.onload = () => {
      const interval = setInterval(() => {
        if ((window as any).longdo) {
          clearInterval(interval);
          resolve((window as any).longdo);
        }
      }, 100);
    };

    script.onerror = (err) => {
      console.error("[Longdo Map] Failed to load Longdo Map JavaScript SDK", err);
      // Fallback attempt to v2 if v3 fails
      if (version === "v3") {
        console.log("[Longdo Map] Retrying script load with Map API 2 fallback...");
        script.remove();
        const fallbackScript = document.createElement("script");
        fallbackScript.id = LONGDO_SCRIPT_ID;
        fallbackScript.src = `${LONGDO_CONFIG.endpoints.scriptSdkV2}?key=${apiKey}`;
        fallbackScript.async = true;
        fallbackScript.onload = () => {
          const interval = setInterval(() => {
            if ((window as any).longdo) {
              clearInterval(interval);
              resolve((window as any).longdo);
            }
          }, 100);
        };
        fallbackScript.onerror = (e) => reject(e);
        document.head.appendChild(fallbackScript);
      } else {
        reject(err);
      }
    };

    document.head.appendChild(script);
  });
}
