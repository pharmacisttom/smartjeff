"use client";

import { useState, useEffect } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";

export function useDeviceType() {
  const [deviceType, setDeviceType] = useState<DeviceType>("mobile");
  const [isMobile, setIsMobile] = useState(true);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType("mobile");
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width >= 768 && width < 1024) {
        setDeviceType("tablet");
        setIsMobile(false);
        setIsTablet(true);
        setIsDesktop(false);
      } else {
        setDeviceType("desktop");
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { deviceType, isMobile, isTablet, isDesktop };
}
