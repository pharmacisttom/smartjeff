"use client";

import { useState } from "react";
import {
  KeyRound,
  Plus,
  ShieldCheck,
  Copy,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Eye,
  Terminal,
} from "lucide-react";
import { showSuccess, showError, showLoading, closeSwal } from "@/lib/swal";
import { generateApiKey } from "@/lib/apikey/generator";

export default function ApiKeysManagementPage() {
  const [keys, setKeys] = useState([
    {
      id: "key-1",
      name: "LINE Messaging Webhook Key",
      type: "SECRET",
      prefix: "sk_live_",
      last4: "89A0",
      scopes: ["employee.read", "attendance.checkin"],
      status: "ACTIVE",
      lastUsedAt: "วันนี้ 10:15 น.",
    },
    {
      id: "key-2",
      name: "Payroll Software Export Integration",
      type: "SECRET",
      prefix: "sk_live_",
      last4: "F2E1",
      scopes: ["payroll.read.all", "payroll.export"],
      status: "ACTIVE",
      lastUsedAt: "เมื่อวานนี้ 18:00 น.",
    },
    {
      id: "key-3",
      name: "System Master Superadmin Key",
      type: "SYSTEM",
      prefix: "smto_live_",
      last4: "99X1",
      scopes: ["* (Full Superadmin Scope)"],
      status: "ACTIVE",
      lastUsedAt: "วันนี้ 09:00 น.",
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyType, setKeyType] = useState<"PUBLIC" | "SECRET" | "SYSTEM">("SECRET");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["employee.read", "attendance.checkin"]);

  // Reveal Modal State
  const [revealedFullKey, setRevealedFullKey] = useState<string | null>(null);

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      showError("กรุณากรอกชื่อ API Key", "ป้อนชื่อสำหรับอ้างอิงการใช้งานระบบภายนอก");
      return;
    }

    const generated = generateApiKey(keyType);

    const newRecord = {
      id: `key-${Date.now()}`,
      name: keyName,
      type: keyType,
      prefix: generated.prefix,
      last4: generated.last4,
      scopes: selectedScopes,
      status: "ACTIVE" as const,
      lastUsedAt: "ยังไม่เคยใช้",
    };

    setKeys([...keys, newRecord]);
    setShowCreateModal(false);
    setRevealedFullKey(generated.fullKey);
    setKeyName("");
  };

  const revokeKey = (id: string) => {
    setKeys(keys.filter((k) => k.id !== id));
    showSuccess("ยกเลิก API Key แล้ว", "รหัส Key ถูกระงับการเชื่อมต่อจากระบบทันที");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("คัดลอกรหัสแล้ว!", "คัดลอก API Key ลงในคลิปบอร์ดเรียบร้อยแล้ว");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 p-6 rounded-3xl text-white shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
            <KeyRound className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">SUPERADMIN CONSOLE</span>
            <h1 className="text-2xl font-black tracking-tight">การจัดการ API Keys (API Key Governance)</h1>
            <p className="text-xs text-slate-300">
              สร้าง คัดลอก และควบคุมสิทธิ์ API Keys สำหรับเชื่อมต่อระบบภายนอก (HRIS, Payroll, Line Bot)
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-lg transition-all active:scale-95 self-start md:self-center"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>สร้าง API Key ใหม่</span>
        </button>
      </div>

      {/* Keys Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <h2 className="text-base font-bold text-content-primary">รายการ API Keys ในระบบ</h2>
          <span className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
            {keys.length} Active Keys
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-border text-xs text-content-muted font-bold uppercase bg-surface-subtle">
                <th className="py-3 px-4">ชื่อ API Key</th>
                <th className="py-3 px-4">ประเภท Key</th>
                <th className="py-3 px-4">รหัส Key Prefix</th>
                <th className="py-3 px-4">สิทธิ์ (Scopes)</th>
                <th className="py-3 px-4">ใช้งานล่าสุด</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-xs">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-surface-subtle transition-colors">
                  <td className="py-3.5 px-4 font-bold text-content-primary">{k.name}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        k.type === "SYSTEM"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : k.type === "SECRET"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {k.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-content-secondary">
                    {k.prefix}••••{k.last4}
                  </td>
                  <td className="py-3.5 px-4 text-content-muted font-mono">{k.scopes.join(", ")}</td>
                  <td className="py-3.5 px-4 font-medium text-content-secondary">{k.lastUsedAt}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => revokeKey(k.id)}
                      className="text-rose-600 hover:text-rose-700 font-bold flex items-center space-x-1 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ยกเลิก Key</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single-Time Reveal Key Modal */}
      {revealedFullKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface-card border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-amber-600 font-bold text-base">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <span>⚠️ สำคัญมาก: เก็บ API Key นี้ไว้ทันที!</span>
            </div>

            <p className="text-xs text-content-muted">
              รหัสเต็มนี้จะปรากฏให้คุณเห็นเพียงครั้งเดียวเท่านั้น ระบบจะไม่บันทึกรหัสเต็มนี้ในฐานข้อมูลเพื่อความปลอดภัย
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider block">
                FULL API KEY:
              </span>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono font-bold text-emerald-400 break-all">
                  {revealedFullKey}
                </code>
                <button
                  onClick={() => copyToClipboard(revealedFullKey)}
                  className="p-2 rounded-xl bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 transition-colors shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={() => setRevealedFullKey(null)}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all"
            >
              เข้าใจแล้ว ปิดหน้าต่างนี้
            </button>
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-card border border-surface-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-content-primary text-base">สร้าง API Key ใหม่</h3>

            <form onSubmit={handleCreateKey} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-content-primary mb-1">ชื่อ API Key</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น LINE Messaging Webhook Key"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full bg-surface-subtle border border-surface-border rounded-2xl px-3 py-2 text-content-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-content-primary mb-1">ประเภท Key</label>
                <select
                  value={keyType}
                  onChange={(e) => setKeyType(e.target.value as any)}
                  className="w-full bg-surface-subtle border border-surface-border rounded-2xl px-3 py-2 text-content-primary font-semibold"
                >
                  <option value="SECRET">Secret (sk_live_) — Server-side Integration</option>
                  <option value="PUBLIC">Public (pk_live_) — Client-side Integration</option>
                  <option value="SYSTEM">System (smto_live_) — Superadmin Only</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-surface-border rounded-2xl font-bold text-content-muted"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-md"
                >
                  สร้าง Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
