"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, KeyRound, CheckCircle2, Lock, ArrowRight, LogOut } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasMinLength = newPassword.length >= 12;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      }

      setSuccess("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว กำลังนำท่านเข้าสู่ระบบ...");
      setTimeout(() => {
        router.push(data.redirectTo || "/admin/dashboard");
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100 font-sans">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/30">
            <KeyRound className="h-7 w-7 text-brand-400" />
          </div>
          <h1 className="text-2xl font-black text-white">เปลี่ยนรหัสผ่าน SmartJeff</h1>
          <p className="text-xs text-slate-400">
            นโยบายความปลอดภัยบังคับเปลี่ยนรหัสผ่านทุก 90 วัน เพื่อความปลอดภัยของข้อมูลองค์กร
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl bg-rose-500/10 p-4 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <div className="whitespace-pre-line">{error}</div>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>{success}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">รหัสผ่านปัจจุบัน</label>
            <div className="relative">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="กรอกรหัสผ่านปัจจุบัน"
              />
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">รหัสผ่านใหม่ (อย่างน้อย 12 ตัวอักษร)</label>
            <div className="relative">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="กรอกรหัสผ่านใหม่"
              />
              <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">ยืนยันรหัสผ่านใหม่</label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="ยืนยันรหัสผ่านใหม่"
              />
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

          {/* Password strength checks */}
          <div className="rounded-2xl bg-slate-800/50 p-4 space-y-2 border border-slate-800 text-[11px]">
            <p className="font-semibold text-slate-400">ข้อกำหนดความปลอดภัยของรหัสผ่าน:</p>
            <div className="grid grid-cols-2 gap-1.5 text-slate-400">
              <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-400" : ""}`}>
                <CheckCircle2 className="h-3.5 w-3.5" /> ความยาวอย่างน้อย 12 ตัว
              </div>
              <div className={`flex items-center gap-1.5 ${hasUpper ? "text-emerald-400" : ""}`}>
                <CheckCircle2 className="h-3.5 w-3.5" /> ตัวพิมพ์ใหญ่ (A-Z)
              </div>
              <div className={`flex items-center gap-1.5 ${hasLower ? "text-emerald-400" : ""}`}>
                <CheckCircle2 className="h-3.5 w-3.5" /> ตัวพิมพ์เล็ก (a-z)
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-400" : ""}`}>
                <CheckCircle2 className="h-3.5 w-3.5" /> ตัวเลข (0-9)
              </div>
              <div className={`flex items-center gap-1.5 ${hasSpecial ? "text-emerald-400" : ""}`}>
                <CheckCircle2 className="h-3.5 w-3.5" /> อักขระพิเศษ
              </div>
              <div className={`flex items-center gap-1.5 ${isMatch ? "text-emerald-400" : ""}`}>
                <CheckCircle2 className="h-3.5 w-3.5" /> รหัสผ่านตรงกัน
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:from-brand-500 hover:to-blue-500 disabled:opacity-50"
          >
            {loading ? "กำลังบันทึกรหัสผ่าน..." : "ยืนยันการเปลี่ยนรหัสผ่าน"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="pt-2 text-center border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
}
