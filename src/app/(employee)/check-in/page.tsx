"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin, CheckCircle2, AlertCircle, Camera, Navigation, ArrowRight, ShieldCheck } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { haversineDistance } from "@/lib/geo";
import { CameraCapture } from "@/components/camera/CameraCapture";
import { PhotoPreview } from "@/components/camera/PhotoPreview";
import { queueCheckIn } from "@/lib/offline-db";
import { showError, showSuccess, showWarning } from "@/lib/swal";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { cn } from "@/lib/utils";

type AttendanceType = "CHECK_IN" | "CHECK_OUT" | "OT_IN" | "OT_OUT";
interface Context {
  employee: { id: string; code: string; name: string };
  site: { id: string; name: string; lat: number | null; lng: number | null; radius: number };
}

export default function CheckInPage() {
  const { t, locale } = useLanguage();
  const geo = useGeolocation();
  const { isOffline } = useNetworkStatus();
  const [context, setContext] = useState<Context | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [type, setType] = useState<AttendanceType | null>(null);
  const [camera, setCamera] = useState(false);
  const [photo, setPhoto] = useState<{ blob: Blob; dataUrl: string; hash: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.employee || !body.site) {
          throw new Error("บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงานและไซต์งาน");
        }
        setContext(body);
      })
      .catch((error) => setContextError(error.message));
  }, []);

  const distance = useMemo(() => {
    if (!context?.site || context.site.lat == null || context.site.lng == null || geo.lat == null || geo.lng == null) {
      return null;
    }
    return haversineDistance(geo.lat, geo.lng, context.site.lat, context.site.lng);
  }, [context, geo.lat, geo.lng]);

  const within = distance != null && context != null && distance <= context.site.radius;

  const getAttendanceTitle = (itemType: AttendanceType) => {
    switch (itemType) {
      case "CHECK_IN":
        return t("checkin.check_in");
      case "CHECK_OUT":
        return t("checkin.check_out");
      case "OT_IN":
        return t("checkin.ot_in");
      case "OT_OUT":
        return t("checkin.ot_out");
    }
  };

  const begin = (nextType: AttendanceType) => {
    if (!context || context.site.lat == null || context.site.lng == null) {
      return showError("ไม่พบ Geofence", "กรุณาให้ผู้ดูแลกำหนดพิกัดไซต์ก่อนลงเวลา");
    }
    if (geo.lat == null || geo.lng == null) {
      return showError("ไม่พบ GPS", "กรุณาเปิด Location ในมือถือและลองใหม่อีกครั้ง");
    }
    setType(nextType);
    setCamera(true);
  };

  const submit = async () => {
    if (!context || !type || !photo || geo.lat == null || geo.lng == null || distance == null) return;
    setSubmitting(true);
    const localId = crypto.randomUUID();
    const payload = {
      localId,
      employeeId: context.employee.id,
      type,
      timestamp: Date.now(),
      lat: geo.lat,
      lng: geo.lng,
      accuracy: geo.accuracy ?? 999,
      distance,
      isWithinGeofence: within,
      photoBlob: photo.blob,
      photoDataUrl: photo.dataUrl,
      photoHash: photo.hash,
      deviceInfo: navigator.userAgent,
    };

    try {
      if (isOffline) {
        await queueCheckIn(payload);
        showWarning(t("common.offline"), t("checkin.offline_queued"));
      } else {
        const data = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (!["photoBlob", "photoDataUrl"].includes(key)) {
            data.append(key, String(value));
          }
        });
        data.append("photo", photo.blob, `${localId}.webp`);
        const response = await fetch("/api/checkin/sync", { method: "POST", body: data });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "ลงเวลาไม่สำเร็จ");
        showSuccess(t("checkin.checkin_success"), within ? t("checkin.within_area") : t("checkin.outside_area"));
      }
      setPhoto(null);
      setType(null);
    } catch (error) {
      showError(t("common.confirm"), error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  if (contextError) {
    return (
      <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-center space-y-2">
        <AlertCircle className="w-8 h-8 mx-auto" />
        <p className="font-bold">{contextError}</p>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="p-12 text-center text-content-muted animate-pulse font-medium">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-12 font-sans">
      {/* Language Switcher Bar directly inside Check-in */}
      <div className="flex items-center justify-between bg-surface-card border border-surface-border p-3 rounded-2xl shadow-sm">
        <span className="text-xs font-bold text-content-secondary flex items-center space-x-1.5">
          <span>🌐</span>
          <span>{t("common.language")}</span>
        </span>
        <LanguageSwitcher variant="pills" />
      </div>

      {camera && (
        <CameraCapture
          metadata={{
            employeeName: context.employee.name,
            siteName: context.site.name,
            timestamp: new Date(),
            lat: geo.lat!,
            lng: geo.lng!,
          }}
          onCapture={(result) => {
            setPhoto(result);
            setCamera(false);
          }}
          onClose={() => setCamera(false)}
        />
      )}

      {photo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <PhotoPreview
            dataUrl={photo.dataUrl}
            metadata={{
              siteName: context.site.name,
              employeeName: context.employee.name,
              timestamp: new Date(),
              lat: geo.lat!,
              lng: geo.lng!,
              isWithinGeofence: within,
            }}
            onConfirm={submit}
            onRetake={() => {
              setPhoto(null);
              setCamera(true);
            }}
            loading={submitting}
          />
        </div>
      )}

      {/* Employee Header Profile */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-brand-300 font-bold border border-white/10">
            {context.employee.code}
          </span>
          <h1 className="text-xl font-black tracking-tight">{context.employee.name}</h1>
          <p className="text-xs text-slate-300 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            <span>{t("checkin.title")}</span>
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10">
          <Clock className="w-6 h-6 text-brand-400" />
        </div>
      </div>

      {/* Site Geofence & GPS Information Card */}
      <div className="p-5 rounded-3xl bg-surface-card border border-surface-border shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-brand-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-content-muted uppercase">
                {t("checkin.site_name")}
              </p>
              <h2 className="text-base font-bold text-content-primary leading-snug">
                {context.site.name}
              </h2>
              <p className="text-xs text-content-secondary mt-1 flex items-center space-x-1">
                <Navigation className="w-3 h-3 text-brand-500" />
                <span>
                  {distance == null
                    ? t("checkin.locating_gps")
                    : `${t("checkin.distance_meters")} ${Math.round(distance)} ${t("checkin.meters")} (${t("checkin.meters")} ${context.site.radius})`}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Geofence Status Badge */}
        <div
          className={cn(
            "p-3 rounded-2xl border flex items-center space-x-2.5 text-xs font-bold transition-all",
            within
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
          )}
        >
          {within ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          )}
          <span>{within ? t("checkin.within_area") : t("checkin.outside_area")}</span>
        </div>
      </div>

      {/* 4 Big Action Punch Clock Buttons with Multi-language Labels */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* CHECK IN */}
        <button
          onClick={() => begin("CHECK_IN")}
          disabled={geo.loading}
          className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black shadow-lg shadow-emerald-600/25 flex flex-col items-center justify-center space-y-2 text-center transition-all active:scale-[0.97] disabled:opacity-50 min-h-[110px]"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm tracking-tight leading-tight">{t("checkin.check_in")}</span>
          <span className="text-[10px] text-emerald-100 font-semibold opacity-90 uppercase">CHECK-IN</span>
        </button>

        {/* CHECK OUT */}
        <button
          onClick={() => begin("CHECK_OUT")}
          disabled={geo.loading}
          className="p-5 rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 text-white font-black shadow-lg shadow-slate-900/25 flex flex-col items-center justify-center space-y-2 text-center transition-all active:scale-[0.97] disabled:opacity-50 min-h-[110px]"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm tracking-tight leading-tight">{t("checkin.check_out")}</span>
          <span className="text-[10px] text-slate-300 font-semibold opacity-90 uppercase">CHECK-OUT</span>
        </button>

        {/* OT IN */}
        <button
          onClick={() => begin("OT_IN")}
          disabled={geo.loading}
          className="p-5 rounded-3xl bg-gradient-to-br from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white font-black shadow-lg shadow-amber-600/25 flex flex-col items-center justify-center space-y-2 text-center transition-all active:scale-[0.97] disabled:opacity-50 min-h-[110px]"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm tracking-tight leading-tight">{t("checkin.ot_in")}</span>
          <span className="text-[10px] text-amber-100 font-semibold opacity-90 uppercase">OT START</span>
        </button>

        {/* OT OUT */}
        <button
          onClick={() => begin("OT_OUT")}
          disabled={geo.loading}
          className="p-5 rounded-3xl bg-gradient-to-br from-indigo-700 to-violet-800 hover:from-indigo-600 hover:to-violet-700 text-white font-black shadow-lg shadow-indigo-700/25 flex flex-col items-center justify-center space-y-2 text-center transition-all active:scale-[0.97] disabled:opacity-50 min-h-[110px]"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm tracking-tight leading-tight">{t("checkin.ot_out")}</span>
          <span className="text-[10px] text-indigo-100 font-semibold opacity-90 uppercase">OT END</span>
        </button>
      </div>
    </div>
  );
}
