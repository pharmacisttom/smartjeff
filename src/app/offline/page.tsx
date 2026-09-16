import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";

export default function OfflineFallbackPage() {
  return (
    <div className="min-h-screen bg-surface-subtle flex flex-col items-center justify-center p-6 text-center safe-pt safe-pb">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 animate-pulse">
        <WifiOff className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-bold text-content-primary mb-2">คุณกำลังใช้งานโหมดออฟไลน์</h1>
      <p className="text-xs text-content-secondary max-w-sm mb-6 leading-relaxed">
        หน้านี้ยังไม่ได้ถูกบันทึกไว้ในแคช แต่คุณยังสามารถลงเวลาเข้า-ออกงานและตรวจสอบคิวข้อมูลที่รอซิงค์ได้ตามปกติ
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
        <Link
          href="/check-in"
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-brand-500 text-white font-bold shadow hover:bg-brand-600 active-press transition-all text-xs"
        >
          <Home className="w-4 h-4" />
          <span>ไปหน้าลงเวลา</span>
        </Link>

        <Link
          href="/pending"
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border border-surface-border bg-surface-bg text-content-primary font-semibold hover:bg-surface-subtle active-press transition-all text-xs"
        >
          <RefreshCw className="w-4 h-4" />
          <span>ดูคิวรอซิงค์ข้อมูล</span>
        </Link>
      </div>
    </div>
  );
}
