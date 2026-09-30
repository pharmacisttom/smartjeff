"use client";

import React, { useState } from "react";
import { SmartLongdoMap } from "./SmartLongdoMap";
import { Search, MapPin, Check, X, Compass, Loader2 } from "lucide-react";
import { LongdoAddressResult } from "@/lib/longdo/types";

interface SiteMapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (data: {
    lat: number;
    lng: number;
    address: string;
    subdistrict?: string;
    district?: string;
    province?: string;
    postcode?: string;
  }) => void;
  initialLat?: number;
  initialLng?: number;
  initialRadius?: number;
}

export function SiteMapPickerModal({
  isOpen,
  onClose,
  onSelectLocation,
  initialLat = 13.0039,
  initialLng = 101.1668,
  initialRadius = 200,
}: SiteMapPickerModalProps) {
  const [selectedCoords, setSelectedCoords] = useState({ lat: initialLat, lng: initialLng });
  const [radius, setRadius] = useState(initialRadius);
  const [addressData, setAddressData] = useState<LongdoAddressResult | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  if (!isOpen) return null;

  const handleMapClick = async (coords: { lat: number; lng: number }) => {
    setSelectedCoords(coords);
    setIsLoadingAddress(true);
    try {
      const res = await fetch(`/api/map/reverse-geocode?lat=${coords.lat}&lng=${coords.lng}`);
      if (res.ok) {
        const data = await res.json();
        setAddressData(data);
      }
    } catch (_) {
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleConfirm = () => {
    onSelectLocation({
      lat: selectedCoords.lat,
      lng: selectedCoords.lng,
      address: addressData?.formattedAddress || `พิกัด ${selectedCoords.lat.toFixed(5)}, ${selectedCoords.lng.toFixed(5)}`,
      subdistrict: addressData?.subdistrict,
      district: addressData?.district,
      province: addressData?.province,
      postcode: addressData?.postcode,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-card border border-surface-border rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-surface-border bg-surface-subtle flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-brand-600 text-white">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-content-primary text-base">เลือกตำแหน่งสถานที่บนแผนที่ Longdo</h3>
              <p className="text-xs text-content-muted">คลิกเลือกพิกัดเพื่อ Reverse Geocode ที่อยู่อัตโนมัติ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-border text-content-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Body */}
        <div className="relative flex-1 min-h-[350px]">
          <SmartLongdoMap
            center={selectedCoords}
            zoom={14}
            height="h-[400px]"
            markers={[
              {
                id: "picked_site",
                lat: selectedCoords.lat,
                lng: selectedCoords.lng,
                title: "ตำแหน่งสถานที่ที่เลือก",
                subtitle: addressData?.formattedAddress,
                color: "#10b981",
              },
            ]}
            circles={[
              {
                id: "site_radius",
                lat: selectedCoords.lat,
                lng: selectedCoords.lng,
                radius: radius,
                color: "#10b981",
                title: `รัศมี Geofence ${radius}m`,
              },
            ]}
            onMapClick={handleMapClick}
          />
        </div>

        {/* Bottom Details Footer */}
        <div className="p-4 border-t border-surface-border bg-surface-subtle space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-surface-card border border-surface-border rounded-xl">
              <span className="text-[10px] text-content-muted font-bold block">ละติจูด / ลองจิจูด</span>
              <strong className="text-content-primary font-mono">{selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}</strong>
            </div>

            <div className="p-2.5 bg-surface-card border border-surface-border rounded-xl sm:col-span-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-content-muted font-bold block">ที่อยู่แปลงจาก Longdo</span>
                {isLoadingAddress ? (
                  <span className="flex items-center gap-1.5 text-brand-600 font-bold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังค้นหาที่อยู่...
                  </span>
                ) : (
                  <strong className="text-content-primary truncate block max-w-sm">
                    {addressData?.formattedAddress || "คลิกบนแผนที่เพื่อระบุที่อยู่"}
                  </strong>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2 text-xs font-bold">
              <span className="text-content-muted">รัศมี Geofence:</span>
              {[50, 100, 200, 500, 1000].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`px-2.5 py-1 rounded-lg border transition-all ${
                    radius === r ? "bg-brand-600 text-white border-brand-600" : "bg-surface-card border-surface-border text-content-secondary"
                  }`}
                >
                  {r}m
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-surface-card border border-surface-border text-content-secondary font-bold text-xs hover:bg-surface-subtle"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirm}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ยืนยันตำแหน่งนี้</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
