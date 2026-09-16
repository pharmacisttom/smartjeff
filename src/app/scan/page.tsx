"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QrCode, CheckCircle2, MapPin, Building, ShieldCheck, ArrowRight } from "lucide-react";
import { showSuccess, showError, showLoading, closeSwal } from "@/lib/swal";

function ScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteCode = searchParams.get("siteCode") || "AAM";
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAndRedirect = async () => {
      try {
        setLoading(true);
        showLoading("กำลังตรวจสอบจุดเช็คอิน QR Code...", `รหัสจุดสแกน: ${siteCode}`);

        const res = await fetch("/api/sites");
        const data = await res.json();
        closeSwal();

        if (res.ok && data.sites) {
          const matchedSite = data.sites.find((s: any) => s.code.toUpperCase() === siteCode.toUpperCase());
          if (matchedSite) {
            setSite(matchedSite);
            
            // Store scanned site checkpoint details in localStorage & Cookie
            localStorage.setItem("smarto_scanned_site", JSON.stringify({
              code: matchedSite.code,
              name: matchedSite.name,
              scannedAt: new Date().toISOString(),
            }));
            document.cookie = `smarto_scanned_site=${matchedSite.code}; path=/; max-age=86400`;

            await showSuccess(
              "สแกนจุดเช็คอินสำเร็จ! ✅",
              `ระบุตำแหน่งจุดสแกนหน้างาน: ${matchedSite.name} (${matchedSite.code})`
            );

            router.push(`/check-in?siteCode=${matchedSite.code}`);
            return;
          }
        }

        showError("ไม่พบจุดเช็คอิน", `ไม่พบข้อมูลไซต์งานรหัส [${siteCode}] ในระบบ`);
      } catch (e) {
        closeSwal();
        showError("ข้อผิดพลาด", "ไม่สามารถตรวจสอบข้อมูลจุดสแกนได้");
      } finally {
        setLoading(false);
      }
    };

    verifyAndRedirect();
  }, [siteCode, router]);

  return (
    <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
      <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg animate-pulse">
        <QrCode className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          CHECKPOINT QR CODE SCANNED
        </span>
        <h1 className="text-2xl font-black tracking-tight">ยืนยันการสแกนจุดเช็คอินหน้างาน</h1>
        <p className="text-xs text-slate-300">
          ระบบทำการดักจับจุดสแกน QR Code ({siteCode}) พร้อมบันทึกพิกัด GPS และ IP Address
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">รหัสจุดสแกน:</span>
          <span className="font-bold text-emerald-400 font-mono">{siteCode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">สถานะ:</span>
          <span className="font-bold text-emerald-400">ผ่านการยืนยัน ✅</span>
        </div>
      </div>

      <button
        onClick={() => router.push(`/check-in?siteCode=${siteCode}`)}
        className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
      >
        <span>เข้าสู่หน้าลงเวลาปฏิบัติงาน</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ScanLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 text-white flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="text-center text-sm text-slate-400 animate-pulse">
          กำลังประมวลผลการสแกน QR Code...
        </div>
      }>
        <ScanContent />
      </Suspense>
    </div>
  );
}
