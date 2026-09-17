"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin, CheckCircle2, AlertCircle, Camera } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { haversineDistance } from "@/lib/geo";
import { CameraCapture } from "@/components/camera/CameraCapture";
import { PhotoPreview } from "@/components/camera/PhotoPreview";
import { queueCheckIn } from "@/lib/offline-db";
import { showError, showSuccess, showWarning } from "@/lib/swal";

type AttendanceType = "CHECK_IN" | "CHECK_OUT" | "OT_IN" | "OT_OUT";
interface Context { employee: { id: string; code: string; name: string }; site: { id: string; name: string; lat: number | null; lng: number | null; radius: number } }

export default function CheckInPage() {
  const geo = useGeolocation();
  const { isOffline } = useNetworkStatus();
  const [context, setContext] = useState<Context | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [type, setType] = useState<AttendanceType | null>(null);
  const [camera, setCamera] = useState(false);
  const [photo, setPhoto] = useState<{ blob: Blob; dataUrl: string; hash: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetch("/api/auth/session").then(async (response) => {
    const body = await response.json();
    if (!response.ok || !body.employee || !body.site) throw new Error("บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงานและไซต์");
    setContext(body);
  }).catch((error) => setContextError(error.message)); }, []);

  const distance = useMemo(() => {
    if (!context?.site || context.site.lat == null || context.site.lng == null || geo.lat == null || geo.lng == null) return null;
    return haversineDistance(geo.lat, geo.lng, context.site.lat, context.site.lng);
  }, [context, geo.lat, geo.lng]);
  const within = distance != null && context != null && distance <= context.site.radius;

  const begin = (nextType: AttendanceType) => {
    if (!context || context.site.lat == null || context.site.lng == null) return showError("ไม่พบ Geofence", "กรุณาให้ผู้ดูแลกำหนดพิกัดไซต์ก่อนลงเวลา");
    if (geo.lat == null || geo.lng == null) return showError("ไม่พบ GPS", "กรุณาเปิด Location และลองใหม่");
    setType(nextType); setCamera(true);
  };
  const submit = async () => {
    if (!context || !type || !photo || geo.lat == null || geo.lng == null || distance == null) return;
    setSubmitting(true);
    const localId = crypto.randomUUID();
    const payload = { localId, employeeId: context.employee.id, type, timestamp: Date.now(), lat: geo.lat, lng: geo.lng,
      accuracy: geo.accuracy ?? 999, distance, isWithinGeofence: within, photoBlob: photo.blob, photoDataUrl: photo.dataUrl,
      photoHash: photo.hash, deviceInfo: navigator.userAgent };
    try {
      if (isOffline) {
        await queueCheckIn(payload);
        showWarning("บันทึกออฟไลน์แล้ว", "ข้อมูลจะถูกส่งเมื่อกลับมาออนไลน์");
      } else {
        const data = new FormData();
        Object.entries(payload).forEach(([key, value]) => { if (!["photoBlob", "photoDataUrl"].includes(key)) data.append(key, String(value)); });
        data.append("photo", photo.blob, `${localId}.webp`);
        const response = await fetch("/api/checkin/sync", { method: "POST", body: data });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "ลงเวลาไม่สำเร็จ");
        showSuccess("ลงเวลาสำเร็จ", within ? "บันทึกและอนุมัติอัตโนมัติแล้ว" : "บันทึกแล้วและรอผู้ดูแลอนุมัติ");
      }
      setPhoto(null); setType(null);
    } catch (error) { showError("ลงเวลาไม่สำเร็จ", error instanceof Error ? error.message : "เกิดข้อผิดพลาด"); }
    finally { setSubmitting(false); }
  };

  if (contextError) return <div className="p-5 rounded-2xl bg-red-50 text-red-700">{contextError}</div>;
  if (!context) return <div className="p-8 text-center">กำลังโหลดข้อมูลพนักงานและไซต์...</div>;
  return <div className="space-y-4 max-w-4xl mx-auto">
    {camera && <CameraCapture metadata={{ employeeName: context.employee.name, siteName: context.site.name, timestamp: new Date(), lat: geo.lat!, lng: geo.lng! }} onCapture={(result) => { setPhoto(result); setCamera(false); }} onClose={() => setCamera(false)} />}
    {photo && <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><PhotoPreview dataUrl={photo.dataUrl} metadata={{ siteName: context.site.name, employeeName: context.employee.name, timestamp: new Date(), lat: geo.lat!, lng: geo.lng!, isWithinGeofence: within }} onConfirm={submit} onRetake={() => { setPhoto(null); setCamera(true); }} loading={submitting} /></div>}
    <div className="p-5 rounded-2xl bg-surface-bg border border-surface-border flex justify-between"><div><div className="text-sm text-content-muted">{context.employee.code}</div><h1 className="text-2xl font-bold">{context.employee.name}</h1></div><Clock className="text-brand-600" /></div>
    <div className="p-5 rounded-2xl bg-surface-bg border border-surface-border"><div className="flex gap-3"><MapPin className="text-brand-600" /><div><h2 className="font-bold">{context.site.name}</h2><p className="text-sm text-content-secondary">{distance == null ? "กำลังอ่าน GPS..." : `ระยะ ${Math.round(distance)} เมตร / รัศมี ${context.site.radius} เมตร`}</p></div></div><div className={`mt-3 flex items-center gap-2 ${within ? "text-emerald-600" : "text-amber-600"}`}>{within ? <CheckCircle2 /> : <AlertCircle />}{within ? "อยู่ในพื้นที่" : "อยู่นอกพื้นที่—รายการจะรออนุมัติ"}</div></div>
    <div className="grid grid-cols-2 gap-3">{(["CHECK_IN", "CHECK_OUT", "OT_IN", "OT_OUT"] as AttendanceType[]).map((item) => <button key={item} onClick={() => begin(item)} disabled={geo.loading} className="p-4 rounded-2xl bg-brand-600 text-white font-bold disabled:opacity-50"><Camera className="w-4 h-4 inline mr-2" />{item}</button>)}</div>
  </div>;
}
