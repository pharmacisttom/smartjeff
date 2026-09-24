"use client";

import { useState } from "react";
import { User, ShieldCheck, ArrowRight, KeyRound, Eye, EyeOff, CheckSquare, Globe } from "lucide-react";
import { showSuccess, showError, showLoading, closeSwal } from "@/lib/swal";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";

export default function LoginPage() {
  const { t, locale } = useLanguage();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      showError(
        locale === "my" ? "အချက်အလက်မပြည့်စုံပါ" : locale === "km" ? "ព័ត៌មានមិនគ្រប់គ្រាន់" : "ข้อมูลไม่ครบถ้วน",
        locale === "my" ? "ကျေးဇူးပြု၍ ဝန်ထမ်းကုဒ်နှင့် စကားဝှက်ကို ဖြည့်သွင်းပါ" : locale === "km" ? "សូមបញ្ចូលលេខកូដ និងពាក្យសម្ងាត់" : "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน"
      );
      return;
    }

    setLoading(true);
    showLoading(t("login.logging_in"), t("login.subtitle"));

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password.trim(),
          humanToken: "dev-human-token-ok",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Session is securely managed via HttpOnly cookies and Server-side context

        // Verify session cookie via Session API before redirecting
        const sessionRes = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
        });

        closeSwal();

        if (sessionRes.ok) {
          const target = data.redirectTo || "/check-in";
          showSuccess(
            locale === "my" ? "ဝင်ရောက်မှု အောင်မြင်ပါသည်!" : locale === "km" ? "ចូលប្រព័ន្ធជោគជ័យ!" : "เข้าสู่ระบบสำเร็จ!",
            locale === "my" ? "စနစ်အတွင်းသို့ ပို့ဆောင်နေပါသည်..." : locale === "km" ? "កំពុងបញ្ជូនទៅប្រព័ន្ធ..." : "กำลังนำท่านเข้าสู่ระบบ..."
          );
          setTimeout(() => {
            window.location.assign(target);
          }, 600);
        } else {
          showError("Error", "Session error. Please try again.");
        }
      } else {
        closeSwal();
        const errorMsg = data.error?.message || data.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
        showError(t("common.confirm"), errorMsg);
      }
    } catch (err) {
      closeSwal();
      showError(t("common.confirm"), "Cannot connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Logo & Title Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-2xl border border-white/20">
            S
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{t("login.title")}</h1>
            <p className="text-xs text-brand-300 uppercase tracking-widest font-semibold mt-1">
              SmartJeff Operations Platform (J2K)
            </p>
          </div>
        </div>

        {/* 3-Language Selector Bar (Thai, Myanmar, Khmer) */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-3 shadow-2xl text-center space-y-2">
          <div className="flex items-center justify-center space-x-1.5 text-xs text-brand-200 font-semibold">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>{t("login.select_language")}</span>
          </div>
          <LanguageSwitcher variant="cards" />
        </div>

        {/* Login Form Glassmorphism Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-base font-bold text-white flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-emerald-400" />
              {t("login.subtitle")}
            </h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Identifier Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t("login.identifier")}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@j2k.co.th / 210993"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/15 bg-white/5 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white/10 placeholder-slate-400 transition-all font-mono"
                  required
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t("login.password")}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 rounded-2xl border border-white/15 bg-white/5 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white/10 placeholder-slate-400 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Hint for Employees */}
            <div className="p-3 rounded-2xl border border-brand-500/20 bg-brand-500/10 text-brand-200 text-xs leading-relaxed">
              💡 {t("login.employee_hint")}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span>{loading ? t("login.logging_in") : t("login.button")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
