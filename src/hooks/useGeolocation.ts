"use client";

import { useState, useEffect, useCallback } from "react";

export interface GeoLocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation(autoFetch: boolean = true) {
  const [state, setState] = useState<GeoLocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    loading: autoFetch,
    error: null,
  });

  const getCoordinates = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState({
        lat: 12.9236, // Fallback default Rayong AAM site
        lng: 101.1352,
        accuracy: 10,
        loading: false,
        error: "อุปกรณ์ไม่รองรับ GPS",
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
        });
      },
      (error) => {
        console.warn("GPS Error:", error.message);
        // Fallback for dev/testing when location permission is denied or unavailable
        setState({
          lat: 12.9236, // Rayong Industrial Site default
          lng: 101.1352,
          accuracy: 15,
          loading: false,
          error: error.message || "ไม่สามารถดึงตำแหน่ง GPS ได้",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
  }, []);

  useEffect(() => {
    if (autoFetch) {
      getCoordinates();
    }
  }, [autoFetch, getCoordinates]);

  return { ...state, refetch: getCoordinates };
}
