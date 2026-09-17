"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  KeyRound,
  Building2,
  Sparkles,
  TrendingUp,
  Copy,
  PlusCircle,
  Calendar,
  DollarSign,
  CheckCircle2,
  RefreshCw,
  FileSignature,
  Users,
  ShieldAlert,
  ArrowUpRight,
  Send,
  Cpu,
  Lock,
  User,
  Eye,
  EyeOff,
  LogOut,
  Bot,
  UserCheck,
  Binary,
} from "lucide-react";
import { showSuccess, showError, showLoading, closeSwal } from "@/lib/swal";

const DEV_USERNAME = "tomvis";
const DEV_PASSWORD = "35601009741710830856460";

export default function TomvisVendorConsolePage() {
  // Anti-AI / Human Screening State
  const [isHumanVerified, setIsHumanVerified] = useState(false);
  const [mathNum1, setMathNum1] = useState(7);
  const [mathNum2, setMathNum2] = useState(5);
  const [userMathAnswer, setUserMathAnswer] = useState("");
  const [isHumanCheckbox, setIsHumanCheckbox] = useState(false);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Dashboard State
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTenants: 3,
    activeTenants: 2,
    totalMrr: 37000,
    totalEmployeesManaged: 273,
  });

  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantCode, setSelectedTenantCode] = useState("J2K");
  const [selectedPlan, setSelectedPlan] = useState("PRO");
  const [durationYears, setDurationYears] = useState(1);
  const [customQuota, setCustomQuota] = useState(100);
  const [generatedKey, setGeneratedKey] = useState("");

  const generateMathPuzzle = () => {
    const n1 = Math.floor(Math.random() * 15) + 3;
    const n2 = Math.floor(Math.random() * 12) + 2;
    setMathNum1(n1);
    setMathNum2(n2);
    setUserMathAnswer("");
  };

  useEffect(() => {
    generateMathPuzzle();
    const humanVerified = sessionStorage.getItem("tomvis_human_verified");
    if (humanVerified === "true") {
      setIsHumanVerified(true);
    }

    const session = sessionStorage.getItem("tomvis_authenticated");
    if (session === "true") {
      setIsAuthenticated(true);
      fetchVendorData();
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleHumanVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = mathNum1 + mathNum2;
    if (!isHumanCheckbox) {
      showError("การคัดกรองล้มเหลว", "กรุณาคลิกยืนยันว่าคุณคือมนุษย์ ไม่ใช่ AI หรือบอทอัตโนมัติ");
      return;
    }
    if (parseInt(userMathAnswer.trim(), 10) !== expected) {
      showError("คำตอบไม่ถูกต้อง!", `ผลบวกของ ${mathNum1} + ${mathNum2} ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง`);
      generateMathPuzzle();
      return;
    }

    sessionStorage.setItem("tomvis_human_verified", "true");
    setIsHumanVerified(true);
    showSuccess("ผ่านการคัดกรองมนุษย์! 🤖❌", "ยืนยันสำเร็จ: คุณคือผู้พัฒนาโปรแกรมมนุษย์ (Non-AI Human)");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim() === DEV_USERNAME && passwordInput.trim() === DEV_PASSWORD) {
      sessionStorage.setItem("tomvis_authenticated", "true");
      setIsAuthenticated(true);
      showSuccess("เข้าสู่ระบบผู้พัฒนาสำเร็จ! 🔐", "ต้อนรับผู้พัฒนาโปรแกรมเข้าสู่ Tomvis Master Console");
      fetchVendorData();
    } else {
      showError("รหัสผ่านไม่ถูกต้อง", "กรุณาตรวจสอบ Username และ Password สำหรับผู้พัฒนา");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("tomvis_authenticated");
    sessionStorage.removeItem("tomvis_human_verified");
    setIsAuthenticated(false);
    setIsHumanVerified(false);
    setUsernameInput("");
    setPasswordInput("");
    setIsHumanCheckbox(false);
    generateMathPuzzle();
    showSuccess("ออกจากระบบแล้ว", "ออกจากระบบ Vendor Admin Portal เรียบร้อยแล้ว");
  };

  const fetchVendorData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/licenses");
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
        setTenants(data.tenants);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    showLoading("กำลังสร้าง License Key...", "คำนวณ HMAC-SHA256 Checksum และ Fingerprint");

    try {
      const res = await fetch("/api/vendor/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantCode: selectedTenantCode,
          planCode: selectedPlan,
          durationYears: Number(durationYears),
          customQuota: Number(customQuota),
        }),
      });

      const data = await res.json();
      closeSwal();

      if (res.ok && data.success) {
        setGeneratedKey(data.licenseKey);
        await showSuccess(
          "สร้าง License Key สำเร็จ! 🎉",
          `รหัสสัญญาใหม่: ${data.licenseKey} (ขยายสัญญาให้ ${data.tenant?.name || selectedTenantCode})`
        );
        fetchVendorData();
      } else {
        showError("สร้างรหัสไม่สำเร็จ", data.message);
      }
    } catch (err: any) {
      closeSwal();
      showError("เกิดข้อผิดพลาด", err.message || "ไม่สามารถเชื่อมต่อ License Generator ได้");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("คัดลอกรหัสแล้ว!", `คัดลอก ${text} ลงใน คลิปบอร์ดเรียบร้อยแล้ว`);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  // STEP 1: Non-AI Human Verification Screening Screen
  if (!isHumanVerified) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-brand-500 selection:text-white">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-2">
            <div className="inline-flex p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-2">
              <Bot className="w-7 h-7" />
            </div>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase block w-fit mx-auto">
              HUMAN / ANTI-AI VERIFICATION
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">ระบบคัดกรองยืนยันตัวตนมนุษย์</h1>
            <p className="text-xs text-slate-400">
              กรุณายืนยันว่าคุณคือมนุษย์ผู้พัฒนาโปรแกรม (Non-AI Bot) ก่อนเข้าสู่ระบบผู้พัฒนา Tomvis
            </p>
          </div>

          <form onSubmit={handleHumanVerify} className="space-y-5">
            {/* Interactive Math Challenge */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                  <Binary className="w-4 h-4 text-brand-400" />
                  <span>โจทย์ทดสอบสมองมนุษย์:</span>
                </span>
                <button
                  type="button"
                  onClick={generateMathPuzzle}
                  className="text-[11px] text-brand-400 hover:underline"
                >
                  เปลี่ยนโจทย์
                </button>
              </div>

              <div className="flex items-center justify-center space-x-3 text-lg font-black text-amber-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span>{mathNum1}</span>
                <span>+</span>
                <span>{mathNum2}</span>
                <span>=</span>
                <input
                  type="number"
                  required
                  placeholder="คำตอบ"
                  value={userMathAnswer}
                  onChange={(e) => setUserMathAnswer(e.target.value)}
                  className="w-20 bg-slate-950 border border-amber-500/50 rounded-lg px-2 py-1 text-center text-white text-base focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Human Verification Checkbox */}
            <label className="flex items-center space-x-3 bg-slate-950 border border-slate-800 p-3.5 rounded-2xl cursor-pointer hover:border-slate-700 transition-all">
              <input
                type="checkbox"
                checked={isHumanCheckbox}
                onChange={(e) => setIsHumanCheckbox(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-200 select-none">
                ข้าพเจ้ายืนยันว่าเป็นมนุษย์ผู้พัฒนา ไม่ใช่ AI หรือ บอทอัตโนมัติ 🤖❌
              </span>
            </label>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-brand-600 hover:from-amber-500 hover:to-brand-500 text-white font-bold text-xs rounded-2xl shadow-xl transition-all active:scale-98 flex items-center justify-center space-x-2"
            >
              <UserCheck className="w-4 h-4 text-amber-300" />
              <span>ยืนยันสิทธิ์มนุษย์เพื่อไปต่อ</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // STEP 2: Developer Password Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-brand-500 selection:text-white">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 mb-2">
              <Lock className="w-7 h-7" />
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="bg-brand-500/20 text-brand-300 border border-brand-500/30 px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase">
                TOMVIS VENDOR PORTAL
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-black">
                ผ่านการคัดกรองมนุษย์แล้ว ✅
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">เข้าสู่ระบบผู้พัฒนาโปรแกรม</h1>
            <p className="text-xs text-slate-400">
              กรอก Username และ Password ผู้พัฒนาเพื่อควบคุม License System
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Username ผู้พัฒนา</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="กรอก tomvis"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-semibold transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Password ยืนยันสิทธิ์</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="กรอกรหัสผ่านผู้พัฒนา"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono font-semibold transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-xl transition-all active:scale-98 flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>เข้าสู่ระบบ Tomvis Master Console</span>
            </button>
          </form>

          <div className="text-center border-t border-slate-800 pt-4">
            <span className="text-[11px] text-slate-500">
              SMARTO Master License System v2.6 | Protected by AES-256
            </span>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: Developer Master Console
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-brand-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Developer Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 border border-slate-800 p-6 rounded-3xl shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  VENDOR ADMIN PORTAL (TOMVIS)
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  Non-AI Human Verified ✅
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-1">
                ระบบผู้พัฒนาโปรแกรม (SMARTO Developer & License Console)
              </h1>
              <p className="text-xs text-slate-400">
                ยินดีต้อนรับผู้พัฒนา (<strong className="text-white">U: tomvis</strong>) | ออกสัญญา License Key และควบคุมค่าบริการ
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchVendorData}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl border border-slate-700 transition-all active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>อัปเดตข้อมูล</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs px-4 py-2.5 rounded-2xl transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>

        {/* Vendor KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>รายได้ต่อเดือน (MRR)</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              ฿{stats.totalMrr.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400">รายได้หมุนเวียนคงที่ทุกเดือน</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>ลูกค้าทั้งหมด (Tenants)</span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.totalTenants} บริษัท</div>
            <p className="text-[11px] text-emerald-400 font-bold">เปิดใช้งานปกติ {stats.activeTenants} ไซต์</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>ผู้ใช้งานรวม (Employees)</span>
              <Users className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.totalEmployeesManaged} คน</div>
            <p className="text-[11px] text-slate-400">พนักงานที่สแกนหน้างานระบบ</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>ความปลอดภัยสัญญา</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">HMAC-SHA256</div>
            <p className="text-[11px] text-slate-400">เข้ารหัสล็อกเครื่อง Fingerprint</p>
          </div>
        </div>

        {/* Main 2 Column Section: Key Generator & Active Tenants */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Key Generator Panel (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="font-bold text-white text-base">เครื่องมือสร้าง License Key (Generator)</h2>
                <p className="text-xs text-slate-400">ออกรหัสต่อสัญญาใหม่สำหรับลูกค้าโดยผู้พัฒนาโปรแกรม</p>
              </div>
            </div>

            <form onSubmit={handleGenerateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">เลือกลูกค้า (Tenant)</label>
                <select
                  value={selectedTenantCode}
                  onChange={(e) => setSelectedTenantCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
                >
                  <option value="J2K">J2K Housekeeping Service (ระยอง)</option>
                  <option value="AAM-MAP">โรงงาน AAM นิคมฯ มาบตาพุด</option>
                  <option value="AMATA-CLEAN">อมตะ ซิตี้ เซอร์วิส Hub</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">เลือกแพ็กเกจสัญญา (Plan)</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
                >
                  <option value="TRIAL">TRIAL (ทดลองใช้ฟรี 14 วัน)</option>
                  <option value="STARTER">STARTER (พนักงานสูงสุด 50 คน)</option>
                  <option value="PRO">PRO (พนักงานสูงสุด 100 คน)</option>
                  <option value="ENT">ENTERPRISE (พนักงานไม่จำกัด)</option>
                  <option value="PERP">PERPETUAL (ซื้อขาดตลอดชีพ)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">ระยะเวลาต่อสัญญา</label>
                  <select
                    value={durationYears}
                    onChange={(e) => setDurationYears(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
                  >
                    <option value={1}>1 ปี (365 วัน)</option>
                    <option value={2}>2 ปี (730 วัน)</option>
                    <option value={3}>3 ปี (ส่วนลด 15%)</option>
                    <option value={5}>5 ปี (Enterprise)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">โควต้าพนักงานสูงสุด</label>
                  <input
                    type="number"
                    value={customQuota}
                    onChange={(e) => setCustomQuota(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all active:scale-98 flex items-center justify-center space-x-2"
              >
                <KeyRound className="w-4 h-4 text-amber-300" />
                <span>สร้าง License Key และอัปเดตสัญญา</span>
              </button>
            </form>

            {/* Display Generated Key Result */}
            {generatedKey && (
              <div className="bg-slate-950 border border-brand-500/40 p-4 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider block">
                  รหัส License Key ล่าสุดที่สร้าง:
                </span>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono font-bold text-emerald-400 break-all">
                    {generatedKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(generatedKey)}
                    className="p-2 rounded-xl bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Tenants License Table (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="font-bold text-white text-base">รายการสัญญาและ License ของลูกค้า</h2>
                <p className="text-xs text-slate-400">ตรวจสอบวันหมดอายุและสถานะการชำระเงินของแต่ละ Tenant</p>
              </div>
              <span className="text-xs font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full">
                {tenants.length} ไซต์ในระบบ
              </span>
            </div>

            <div className="space-y-3">
              {tenants.map((t) => (
                <div
                  key={t.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                          {t.code}
                        </span>
                        <h3 className="font-bold text-white text-sm">{t.name}</h3>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {t.legalName} | เลขภาษี: {t.taxId}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        t.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {t.status === "ACTIVE" ? "สัญญาปกติ ✅" : "ใกล้หมดอายุ ⚠️"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-400 block">รหัสสัญญา:</span>
                      <code className="font-mono text-slate-200 font-semibold truncate block">
                        {t.licenseKey}
                      </code>
                    </div>

                    <div>
                      <span className="text-slate-400 block">วันหมดสัญญา:</span>
                      <strong className="text-indigo-300">{t.expiryDate}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block">โควต้าพนักงาน:</span>
                      <strong className="text-emerald-400">
                        {t.currentEmployees} / {t.maxEmployees} คน
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-400 font-semibold">
                      ค่าบริการ: <strong className="text-white">฿{t.monthlyPrice.toLocaleString()}/เดือน</strong>
                    </span>

                    <button
                      onClick={() => {
                        setSelectedTenantCode(t.code);
                        setSelectedPlan(t.plan.startsWith("PRO") ? "PRO" : t.plan);
                        setCustomQuota(t.maxEmployees);
                      }}
                      className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center space-x-1"
                    >
                      <span>จัดการสัญญา</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
