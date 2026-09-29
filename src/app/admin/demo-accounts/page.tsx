"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Printer, RefreshCw, ShieldCheck, Users } from "lucide-react";

type Candidate = { id: string; email: string; displayName: string | null; roles: string[] };
type Account = {
  id: string; demoRole: string; isEnabled: boolean; label: string | null;
  user: { id: string; email: string; displayName: string | null; isActive: boolean; isLocked: boolean; mfaEnabled: boolean; activationPinActive: boolean; passwordReady: boolean; lastLoginAt: string | null; site: string | null; preferredLanguage: string | null; roles: string[] };
  readiness: "READY" | "WARNING" | "NOT_READY";
};
type Payload = { accounts: Account[]; candidates: Candidate[]; roleOptions: Record<string, string[]> };

const roles = [
  ["ADMIN", "ผู้ดูแลระบบ"], ["EXECUTIVE", "ผู้บริหาร"], ["HR_PAYROLL", "HR / เงินเดือน"],
  ["COORDINATOR", "ผู้ประสานงาน"], ["SITE_SUPERVISOR", "หัวหน้างานไซต์"], ["EMPLOYEE", "พนักงาน"],
] as const;

export default function DemoAccountsPage() {
  const [data, setData] = useState<Payload>({ accounts: [], candidates: [], roleOptions: {} });
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [pin, setPin] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/demo-accounts", { cache: "no-store" });
    if (!response.ok) throw new Error("ไม่สามารถโหลดข้อมูลบัญชี Demo ได้");
    setData(await response.json());
  }, []);
  useEffect(() => { load().catch((error) => setMessage(error.message)); }, [load]);

  const run = async (body: Record<string, unknown>, key = String(body.action)) => {
    setBusy(key); setMessage(""); setPin("");
    try {
      const response = await fetch("/api/admin/demo-accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "ดำเนินการไม่สำเร็จ");
      if (result.activationPin) setPin(result.activationPin);
      setMessage("ดำเนินการสำเร็จ");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาด"); }
    finally { setBusy(""); }
  };

  const password = async (userId?: string) => {
    const value = window.prompt("กำหนดรหัสผ่านใหม่ (อย่างน้อย 10 ตัว มี A-Z, a-z, ตัวเลข และอักขระพิเศษ)");
    if (value) await run(userId ? { action: "password", userId, password: value } : { action: "passwordAll", password: value }, userId ? `password-${userId}` : "passwordAll");
  };
  const accountByRole = useMemo(() => new Map(data.accounts.map((account) => [account.demoRole, account])), [data.accounts]);
  const ready = data.accounts.filter((account) => account.readiness === "READY").length;

  return <main className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-2xl bg-gradient-to-r from-slate-950 to-indigo-900 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm text-indigo-200">Security Administration</p><h1 className="text-2xl font-bold">Demo Account Manager</h1><p className="mt-1 text-sm text-slate-300">จัดเตรียมบัญชีสาธิตอย่างปลอดภัย โดยไม่แสดงหรือจัดเก็บรหัสผ่าน</p></div>
          <div className="flex gap-2"><button onClick={() => run({ action: "prepare" })} disabled={!!busy} className="rounded-lg bg-emerald-500 px-4 py-2 font-medium disabled:opacity-50"><RefreshCw className="mr-2 inline h-4 w-4"/>เตรียมบัญชี</button><button onClick={() => window.print()} className="rounded-lg border border-white/30 px-4 py-2"><Printer className="mr-2 inline h-4 w-4"/>พิมพ์ใบเข้าสู่ระบบ</button></div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Summary icon={<Users/>} label="กำหนดแล้ว" value={`${data.accounts.length}/6`} />
        <Summary icon={<CheckCircle2/>} label="พร้อมใช้งาน" value={String(ready)} />
        <Summary icon={<CircleAlert/>} label="ต้องตรวจสอบ" value={String(data.accounts.length - ready)} />
      </section>
      {message && <div role="status" className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-800">{message}</div>}
      {pin && <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 text-center"><strong>Activation PIN (แสดงครั้งเดียว): <span className="font-mono text-2xl tracking-widest">{pin}</span></strong><p className="text-sm text-amber-800">คัดลอกก่อนออกจากหน้านี้ ระบบไม่สามารถเปิดดู PIN เดิมได้</p></div>}

      <section className="grid gap-4 lg:grid-cols-2">
        {roles.map(([code, title]) => {
          const account = accountByRole.get(code);
          const allowed = data.roleOptions[code] || [];
          const candidates = data.candidates.filter((candidate) => candidate.roles.some((role) => allowed.includes(role)));
          const userId = account?.user.id;
          return <article key={code} className="break-inside-avoid rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2"><div><h2 className="font-semibold">{title}</h2><p className="text-xs text-slate-500">{code} · {allowed.join(" / ")}</p></div><Status value={account?.readiness || "NOT_READY"}/></div>
            <div className="mt-4 flex gap-2 print:hidden"><select aria-label={`เลือกบัญชี ${title}`} className="min-w-0 flex-1 rounded-lg border p-2" value={selected[code] || userId || ""} onChange={(event) => setSelected({ ...selected, [code]: event.target.value })}><option value="">เลือกผู้ใช้ตาม Role</option>{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.displayName || candidate.email} ({candidate.email})</option>)}</select><button className="rounded-lg bg-indigo-600 px-3 text-white" disabled={!selected[code] && !userId} onClick={() => run({ action: "assign", demoRole: code, userId: selected[code] || userId }, `assign-${code}`)}>กำหนด</button></div>
            {account ? <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3"><p className="font-medium">{account.user.displayName || "ไม่ระบุชื่อ"}</p><p>{account.user.email}</p><p className="text-slate-500">ไซต์: {account.user.site || "-"} · Role: {account.user.roles.join(", ")}</p></div>
              <div className="grid grid-cols-2 gap-2 text-xs"><Flag ok={account.user.isActive} label="Active"/><Flag ok={!account.user.isLocked} label="Unlocked"/><Flag ok={account.user.passwordReady} label="Password ready"/><Flag ok={!account.user.mfaEnabled} label="MFA clear"/></div>
              <div className="flex flex-wrap gap-2 print:hidden">
                <Action label="ตั้งรหัสผ่าน" onClick={() => password(userId)}/><Action label="ปลดล็อก" onClick={() => run({ action: "unlock", userId })}/><Action label={account.user.isActive ? "ปิดใช้" : "เปิดใช้"} onClick={() => run({ action: account.user.isActive ? "disable" : "enable", userId })}/><Action label="Reset MFA" onClick={() => run({ action: "resetMfa", userId })}/><Action label="ออก PIN" onClick={() => run({ action: "activationPin", userId })}/><Action label="ล้าง PIN" onClick={() => run({ action: "resetPin", userId })}/><Action label="Logout ทุก Session" onClick={() => run({ action: "logout", userId })}/>
                {code === "EMPLOYEE" && <select className="rounded-md border px-2 py-1" value={account.user.preferredLanguage || "th"} onChange={(event) => run({ action: "language", userId, language: event.target.value })}><option value="th">ไทย</option><option value="km">ខ្មែរ</option><option value="my">မြန်မာ</option></select>}
              </div>
              <div className="hidden border-t pt-3 print:block"><p>Username: {account.user.email}</p><p>Password: ____________________</p><p>Activation PIN: ____________________</p></div>
            </div> : <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">ยังไม่ได้กำหนดบัญชีสำหรับบทบาทนี้</p>}
          </article>;
        })}
      </section>
      <div className="flex justify-end print:hidden"><button onClick={() => password()} className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-800">Reset รหัสผ่านทุกบัญชี Demo</button></div>
      <footer className="text-center text-xs text-slate-500"><ShieldCheck className="mr-1 inline h-4 w-4"/>ทุกการเปลี่ยนแปลงบันทึก Audit Log และการ reset credential จะยกเลิก session เดิม</footer>
    </div>
  </main>;
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm"><span className="text-indigo-600">{icon}</span><div><p className="text-xs text-slate-500">{label}</p><p className="text-xl font-bold">{value}</p></div></div>; }
function Status({ value }: { value: Account["readiness"] }) { const styles = value === "READY" ? "bg-emerald-100 text-emerald-800" : value === "WARNING" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"; return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${styles}`}>{value}</span>; }
function Flag({ ok, label }: { ok: boolean; label: string }) { return <span className={`rounded-md px-2 py-1 ${ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{ok ? "✓" : "✕"} {label}</span>; }
function Action({ label, onClick }: { label: string; onClick: () => void }) { return <button onClick={onClick} className="rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-50">{label}</button>; }
