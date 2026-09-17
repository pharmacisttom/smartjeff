"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, User, ShieldCheck, Sparkles, ArrowRight, KeyRound, Cpu, ArrowUpRight } from "lucide-react";
import { showSuccess, showError, showLoading, closeSwal } from "@/lib/swal";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showError("ข้อมูลไม่ครบถ้วน", "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    setLoading(true);
    showLoading("กำลังเข้าสู่ระบบ...", "ตรวจสอบสิทธิ์การเข้าใช้งาน");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      closeSwal();

      if (res.ok && data.success) {
        // Store simple user session in localStorage
        localStorage.setItem("smarto_user", JSON.stringify(data.user));
        
        await showSuccess("เข้าสู่ระบบสำเร็จ!", data.message);
        router.push(data.redirectTo || "/check-in");
      } else {
        if (data.error?.code === "MFA_REQUIRED") {
          const otp = window.prompt("กรอกรหัส 6 หลักจาก Authenticator หรือ Recovery Code");
          if (otp) {
            const mfaResponse = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username, password, otp }),
            });
            const mfaData = await mfaResponse.json();
            if (mfaResponse.ok && mfaData.success) {
              localStorage.setItem("smarto_user", JSON.stringify(mfaData.user));
              router.push(mfaData.redirectTo || "/check-in");
              return;
            }
          }
        }
        showError("การเข้าสู่ระบบล้มเหลว", data.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (err) {
      closeSwal();
      showError("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  const clearCredentials = () => {
    setUsername("");
    setPassword("");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Logo Card & Title */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-2xl border border-white/20">
            S
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">SMARTO</h1>
            <p className="text-xs text-brand-300 uppercase tracking-widest font-semibold mt-0.5">
              J2K Housekeeping Management
            </p>
          </div>
        </div>

        {/* Login Form Glassmorphism Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-emerald-400" />
              เข้าสู่ระบบปฏิบัติงาน
            </h2>
            <button
              type="button"
              onClick={clearCredentials}
              className="text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full transition-all flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>ใส่รหัส Admin</span>
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                ชื่อผู้ใช้ / รหัสพนักงาน (Username)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น admin หรือ EMP001"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/15 bg-white/5 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white/10 placeholder-slate-400 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/15 bg-white/5 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white/10 placeholder-slate-400 transition-all"
                  required
                />
              </div>
            </div>

            {/* Quick Helper Banner for Admin Credentials */}
            <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-200 flex items-center justify-between">
              <span>ผู้ดูแลระบบ: <strong>admin</strong></span>
              <span>Password: <strong>not displayed</strong></span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span>{loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Developer Link Footer */}
          <div className="pt-2 text-center border-t border-white/10">
            <Link
              href="/tomvis"
              className="inline-flex items-center space-x-2 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 px-4 py-2 rounded-full transition-all active:scale-95"
            >
              <Cpu className="w-3.5 h-3.5 text-brand-400" />
              <span>พัฒนาโดย Tomvis (Developer Portal)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-brand-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
