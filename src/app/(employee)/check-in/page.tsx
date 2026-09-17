"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, CheckCircle2, AlertCircle, Camera, ShieldCheck, RefreshCw, AlertTriangle, QrCode } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useHaptic } from "@/hooks/useHaptic";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { formatThaiDate, formatTime } from "@/lib/utils";
import { haversineDistance, isWithinGeofence, formatDistance } from "@/lib/geo";
import { CameraCapture } from "@/components/camera/CameraCapture";
import { PhotoPreview } from "@/components/camera/PhotoPreview";
import { queueCheckIn } from "@/lib/offline-db";
import { showSuccess, showWarning, showError } from "@/lib/swal";

// Mock Site Coordinates: AAM Rayong (12.9236, 101.1352)
const AAM_SITE = {
  name: "บริษัท เอเอเอ็ม อินดัสเตรียล จำกัด (AAM)",
  lat: 12.9236,
  lng: 101.1352,
  radius: 200,
};

export default function CheckInPage() {
  const { lat, lng, accuracy, loading: geoLoading, error: geoError, refetch } = useGeolocation();
  const { triggerHaptic } = useHaptic();
  const { isOffline } = useNetworkStatus();

  const [time, setTime] = useState<Date | null>(null);
  const [selectedType, setSelectedType] = useState<"CHECK_IN" | "CHECK_OUT" | "OT_IN" | "OT_OUT" | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedData, setCapturedData] = useState<{ blob: Blob; dataUrl: string; hash: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute live geofence distance
  const currentLat = lat || AAM_SITE.lat;
  const currentLng = lng || AAM_SITE.lng;
  const distanceMeters = haversineDistance(currentLat, currentLng, AAM_SITE.lat, AAM_SITE.lng);
  const withinGeofence = isWithinGeofence(distanceMeters, AAM_SITE.radius);

  const handleStartCheckIn = (type: "CHECK_IN" | "CHECK_OUT" | "OT_IN" | "OT_OUT") => {
    triggerHaptic(50);
    setSelectedType(type);
    setShowCamera(true);
  };

  const handleCaptured = (result: { blob: Blob; dataUrl: string; hash: string }) => {
    setCapturedData(result);
    setShowCamera(false);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedType || !capturedData) return;
    setSubmitting(true);
    triggerHaptic(60);

    const localId = crypto.randomUUID();
    const payload = {
      localId,
      employeeId: "emp-demo-1",
      type: selectedType,
      timestamp: Date.now(),
      lat: currentLat,
      lng: currentLng,
      accuracy: accuracy || 10,
      distance: distanceMeters,
      isWithinGeofence: withinGeofence,
      photoBlob: capturedData.blob,
      photoDataUrl: capturedData.dataUrl,
      photoHash: capturedData.hash,
      deviceInfo: navigator.userAgent || "Mobile PWA",
    };

    try {
      if (isOffline) {
        // Local-First: Queue to IndexedDB when offline
        await queueCheckIn(payload);
        showWarning("บันทึกข้อมูลออฟไลน์", "ระบบบันทึกข้อมูลเข้าคิวในอุปกรณ์แล้ว และจะซิงค์ให้อัตโนมัติเมื่อมีสัญญาณ");
      } else {
        // Online Direct API Post
        const formData = new FormData();
        formData.append("localId", localId);
        formData.append("employeeId", "emp-demo-1");
        formData.append("type", selectedType);
        formData.append("timestamp", String(payload.timestamp));
        formData.append("lat", String(currentLat));
        formData.append("lng", String(currentLng));
        formData.append("accuracy", String(accuracy || 10));
        formData.append("photoHash", capturedData.hash);
        formData.append("deviceInfo", payload.deviceInfo);
        formData.append("photo", capturedData.blob, `checkin_${localId}.webp`);

        const res = await fetch("/api/checkin/sync", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          showSuccess("ลงเวลาสำเร็จ!", `บันทึกรายการ [${selectedType}] และซิงค์ข้อมูลเรียบร้อยแล้ว`);
        } else {
          // Fallback to offline queue if server fails
          await queueCheckIn(payload);
          showWarning("เซิร์ฟเวอร์ขัดข้อง", "ระบบบันทึกข้อมูลลงคิวในอุปกรณ์เรียบร้อยแล้ว");
        }
      }
    } catch (e: any) {
      await queueCheckIn(payload);
      showWarning("บันทึกลงคิวในอุปกรณ์แล้ว", e.message || "ระบบจัดเก็บข้อมูลไว้และจะลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
      setCapturedData(null);
      setSelectedType(null);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto md:max-w-4xl">
      {/* Photo Preview Modal if captured */}
      {capturedData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
          <PhotoPreview
            dataUrl={capturedData.dataUrl}
            metadata={{
              siteName: AAM_SITE.name,
              employeeName: "คุณพัดมา วงค์คำ",
              timestamp: time || new Date(),
              lat: currentLat,
              lng: currentLng,
              isWithinGeofence: withinGeofence,
            }}
            onConfirm={handleConfirmSubmit}
            onRetake={() => {
              setCapturedData(null);
              setShowCamera(true);
            }}
            loading={submitting}
          />
        </div>
      )}

      {/* Camera Fullscreen Capture */}
      {showCamera && (
        <CameraCapture
          metadata={{
            employeeName: "คุณพัดมา วงค์คำ",
            siteName: AAM_SITE.name,
            timestamp: time || new Date(),
            lat: currentLat,
            lng: currentLng,
          }}
          onCapture={handleCaptured}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Employee Greeting Card */}
      <div className="bg-surface-bg rounded-2xl p-4 md:p-6 shadow-sm border border-surface-border">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
              ปฏิบัติงานประจำวัน
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-content-primary mt-1">
              สวัสดี, คุณพัดมา วงค์คำ
            </h1>
            <p className="text-xs md:text-sm text-content-secondary mt-0.5" suppressHydrationWarning>
              {time ? formatThaiDate(time) : formatThaiDate(new Date())}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1.5 text-xl md:text-2xl font-bold font-mono text-brand-600">
              <Clock className="w-5 h-5 text-brand-500 animate-pulse" />
              <span suppressHydrationWarning>{time ? formatTime(time) : formatTime(new Date())}</span>
            </div>
            <span className="text-[10px] text-content-muted">เวลามาตรฐานประเทศไทย</span>
          </div>
        </div>
      </div>

      {/* GPS & Location Geofence Status */}
      <div className="bg-surface-bg rounded-2xl p-4 shadow-sm border border-surface-border space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 mt-0.5">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-content-muted">สถานที่ลงเวลาปฏิบัติงาน</p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center">
                  <QrCode className="w-3 h-3 mr-1 text-emerald-600" />
                  สแกน QR Code หน้างานแล้ว (AAM)
                </span>
              </div>
              <h2 className="text-sm md:text-base font-semibold text-content-primary leading-tight">
                {AAM_SITE.name}
              </h2>
              <p className="text-xs text-content-secondary mt-1">
                ห่างจากจุดเช็คอิน:{" "}
                <span className="font-semibold text-brand-600">{formatDistance(distanceMeters)}</span> (รัศมี {AAM_SITE.radius} ม.)
              </p>
            </div>
          </div>
          <div>
            {withinGeofence ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ในพื้นที่ ✅</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>นอกพื้นที่</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-surface-border text-xs text-content-muted">
          <div className="flex items-center space-x-2">
            <span>GPS: {currentLat.toFixed(4)}, {currentLng.toFixed(4)}</span>
            {accuracy && <span className="text-[10px]"> (ความแม่นยำ ±{Math.round(accuracy)}m)</span>}
          </div>
          <a
            href="/scan?siteCode=AAM"
            className="flex items-center space-x-1 text-brand-600 hover:text-brand-700 font-bold active-press bg-brand-50 px-2.5 py-1 rounded-lg"
          >
            <QrCode className="w-3.5 h-3.5 text-brand-600" />
            <span>สแกน QR หน้างาน</span>
          </a>
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => handleStartCheckIn("CHECK_IN")}
          className="flex flex-col items-center justify-center min-h-[68px] p-3 rounded-2xl bg-brand-500 text-white font-bold shadow-md hover:bg-brand-600 active-press transition-all"
        >
          <span className="text-lg">🟢 ลงเวลาเข้างาน</span>
          <span className="text-[11px] font-normal opacity-90">เวลาเข้างานปกติ 07:00-08:00 น.</span>
        </button>

        <button
          onClick={() => handleStartCheckIn("CHECK_OUT")}
          className="flex flex-col items-center justify-center min-h-[68px] p-3 rounded-2xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 active-press transition-all"
        >
          <span className="text-lg">🔵 ลงเวลาออกงาน</span>
          <span className="text-[11px] font-normal opacity-90">เวลาเลิกงานปกติ 16:00 น.</span>
        </button>

        <button
          onClick={() => handleStartCheckIn("OT_IN")}
          className="flex flex-col items-center justify-center min-h-[56px] p-3 rounded-2xl bg-amber-500 text-white font-bold shadow-md hover:bg-amber-600 active-press transition-all"
        >
          <span className="text-base">🟠 เริ่ม OT (ล่วงเวลา)</span>
        </button>

        <button
          onClick={() => handleStartCheckIn("OT_OUT")}
          className="flex flex-col items-center justify-center min-h-[56px] p-3 rounded-2xl bg-slate-700 text-white font-bold shadow-md hover:bg-slate-800 active-press transition-all"
        >
          <span className="text-base">🔴 จบ OT</span>
        </button>
      </div>

      {/* Offline Guarantee Banner */}
      <div className="flex items-center space-x-2 text-xs text-content-muted bg-surface-subtle p-3 rounded-xl border border-surface-border">
        <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <span>ระบบ Offline-First รองรับการบันทึกข้อมูลแม้ขณะไม่มีสัญญาณอินเทอร์เน็ต</span>
      </div>
    </div>
  );
}
