import Link from "next/link";
import { Home, ArrowLeft, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            404 NOT FOUND
          </span>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-3">
            ไม่พบหน้าที่คุณต้องการ
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            หน้าเว็บนี้อาจถูกย้าย ลบ หรือไม่มีอยู่ในระบบ SMARTO กรุณาใช้ปุ่มด้านล่างเพื่อกลับสู่หน้าแรก
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/admin/dashboard"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>กลับหน้าแรก (Dashboard)</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>หน้าหลักระบบ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
