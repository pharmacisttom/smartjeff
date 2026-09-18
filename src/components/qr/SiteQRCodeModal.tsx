"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { QrCode, Printer, Copy, Check, MapPin, Building, ShieldCheck, X } from "lucide-react";
import { showToast } from "@/lib/swal";

interface SiteQRCodeModalProps {
  site: {
    id: string;
    code: string;
    name: string;
    location?: string | null;
  };
  onClose: () => void;
}

export function SiteQRCodeModal({ site, onClose }: SiteQRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Generate full scan URL: e.g. http://domain/scan?siteCode=AAM
  const scanUrl = typeof window !== "undefined"
    ? `${window.location.origin}/scan?siteCode=${site.code}`
    : `http://localhost:3000/scan?siteCode=${site.code}`;

  useEffect(() => {
    QRCode.toDataURL(scanUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#0f172a", // slate-900
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code Error:", err));
  }, [scanUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(scanUrl);
    setCopied(true);
    showToast("คัดลอกลิงก์สแกน QR Code แล้ว", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200 print:shadow-none print:border-none print:p-0">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-surface-border pb-3 print:hidden">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-bold text-content-primary">ป้าย QR Code จุดเช็คอินหน้างาน</h3>
          </div>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content-primary p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Poster Area */}
        <div className="text-center space-y-4 p-4 border border-brand-500/20 bg-gradient-to-b from-brand-500/5 to-transparent rounded-2xl print:border-2 print:border-slate-900 print:p-8">
          {/* Company Branding Banner */}
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-brand-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SMARTO WORKFORCE CHECKPOINT</span>
            </div>
            <h2 className="text-xl font-black text-content-primary tracking-tight">{site.name}</h2>
            <p className="text-xs text-content-muted flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-brand-600 mr-1" />
              รหัสจุดเช็คอิน: <strong className="font-mono ml-1 text-brand-600">{site.code}</strong>
            </p>
          </div>

          {/* QR Code Canvas Frame */}
          <div className="bg-white p-4 rounded-2xl inline-block shadow-lg border border-slate-200">
            {qrDataUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={qrDataUrl} alt={`QR Code ${site.code}`} className="w-64 h-64 mx-auto" />
            ) : (
              <div className="w-64 h-64 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                กำลังสร้าง QR Code...
              </div>
            )}
          </div>

          <div className="space-y-1 text-xs text-content-secondary">
            <p className="font-bold text-brand-700 dark:text-brand-300">
              📷 สแกน QR Code นี้ผ่านกล้องมือถือ เพื่อเข้าสู่ระบบและเช็คอินหน้างาน
            </p>
            <p className="text-[11px] text-content-muted">
              ระบบจะบันทึกสถานที่สแกน ({site.code}) พร้อมพิกัด GPS และ IP Address โดยอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between pt-2 print:hidden">
          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-surface-border bg-surface-bg hover:bg-surface-subtle text-xs font-semibold text-content-primary shadow-sm transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-brand-600" />}
            <span>{copied ? "คัดลอกแล้ว!" : "คัดลอกลิงก์"}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-content-secondary hover:bg-surface-subtle"
            >
              ปิด
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ป้ายโปสเตอร์</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
