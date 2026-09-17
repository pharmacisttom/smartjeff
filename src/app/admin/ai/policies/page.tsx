"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Filter,
  Play,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import Swal from "@/lib/swal";

export default function AIPoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");

  // Simulator state
  const [simDomain, setSimDomain] = useState<string>("WORKFORCE");
  const [simAction, setSimAction] = useState<string>("DRAFT_SCHEDULE");
  const [simAmount, setSimAmount] = useState<number>(0);
  const [simRole, setSimRole] = useState<string>("MANAGER");
  const [simResult, setSimResult] = useState<any>(null);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/policies");
      const data = await res.json();
      setPolicies(data.policies || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const domains = ["ALL", "WORKFORCE", "PROCUREMENT", "FLEET", "PROJECT", "CRM", "QHSE", "FINANCE", "SECURITY_PLATFORM"];

  const filteredPolicies = selectedDomain === "ALL"
    ? policies
    : policies.filter((p) => p.domain === selectedDomain);

  const handleTogglePolicy = async (p: any) => {
    const updated = !p.enabled;
    try {
      await fetch("/api/ai/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: p.domain,
          actionType: p.actionType,
          riskLevel: p.riskLevel,
          confirmationMode: p.confirmationMode,
          allowedRoles: p.allowedRoles,
          enabled: updated,
        }),
      });
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `อัปเดตนโยบาย ${p.actionType} สำเร็จ`,
        showConfirmButton: false,
        timer: 1500,
      });
      fetchPolicies();
    } catch (err: any) {
      Swal.fire("ข้อผิดพลาด", err.message, "error");
    }
  };

  const runPolicySimulation = () => {
    // Evaluate simulated action against current policies
    const match = policies.find(
      (p) => p.domain === simDomain && p.actionType === simAction
    );

    let riskLevel = match ? match.riskLevel : "MEDIUM";
    let confirmationMode = match ? match.confirmationMode : "CONFIRM";

    // Value threshold checks
    if (simAmount > 500000 && riskLevel !== "CRITICAL") {
      riskLevel = "HIGH";
      confirmationMode = "APPROVAL_WORKFLOW";
    }

    const isCritical = riskLevel === "CRITICAL" || confirmationMode === "FORBIDDEN";
    const allowedRoles = match?.allowedRoles || ["ADMIN", "MANAGER", "EXECUTIVE"];
    const roleAuthorized = allowedRoles.includes(simRole) || simRole === "SUPER_ADMIN";

    setSimResult({
      evaluatedAt: new Date().toLocaleTimeString("th-TH"),
      domain: simDomain,
      actionType: simAction,
      riskLevel,
      confirmationMode,
      roleAuthorized,
      isCriticalForbidden: isCritical,
      requiredAction: isCritical
        ? "FORBIDDEN: การกระทำนี้ถูกห้ามมิให้ AI ดำเนินการโดยเด็ดขาด ต้องทำผ่านระบบ Human Workflow"
        : confirmationMode === "APPROVAL_WORKFLOW"
        ? "APPROVAL REQUIRED: ต้องผ่านการอนุมัติ 2 ลำดับชั้นจากผู้มีอำนาจและยืนยัน MFA"
        : confirmationMode === "CONFIRM"
        ? "CONFIRMATION REQUIRED: แสดงผลกระทบและ Diff ให้มนุษย์กดยืนยันก่อนประมวลผล"
        : "AUTOMATIC: สามารถดำเนินการได้ทันทีตามสิทธิ์",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/admin/ai/governance" className="hover:underline flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-emerald-600" /> AI Governance
            </Link>
            <span>/</span>
            <span>Policy Matrix & Sandbox</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            AI Action Policy Matrix & Safety Simulator
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            กำหนดเพดานความเสี่ยง (Risk Ceiling), ระดับการขออนุมัติ (Confirmation Policy) และทดสอบประเมินสิทธิ์ (Policy Sandbox)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPolicies}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/admin/ai/actions"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-xl hover:bg-indigo-100 transition text-sm"
          >
            <Layers className="w-4 h-4" /> Action Catalog
          </Link>
        </div>
      </div>

      {/* Simulator Sandbox Section */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-6 rounded-2xl shadow-lg border border-indigo-500/20">
        <div className="flex items-center justify-between pb-4 border-b border-indigo-800/50 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Policy Sandbox & Dry-Run Evaluator</h2>
              <p className="text-xs text-indigo-200">ทดสอบประเมินระดับความเสี่ยงและการบังคับใช้นโยบายแบบจำลอง (Zero side-effects)</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-mono">
            SANDBOX ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="text-xs text-indigo-200 block mb-1">Domain</label>
            <select
              value={simDomain}
              onChange={(e) => setSimDomain(e.target.value)}
              className="w-full bg-slate-800/80 border border-indigo-700/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="WORKFORCE">WORKFORCE</option>
              <option value="PROCUREMENT">PROCUREMENT</option>
              <option value="FLEET">FLEET</option>
              <option value="PROJECT">PROJECT</option>
              <option value="CRM">CRM</option>
              <option value="QHSE">QHSE</option>
              <option value="FINANCE">FINANCE</option>
              <option value="SECURITY_PLATFORM">SECURITY_PLATFORM</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-indigo-200 block mb-1">Action Type</label>
            <input
              type="text"
              value={simAction}
              onChange={(e) => setSimAction(e.target.value)}
              className="w-full bg-slate-800/80 border border-indigo-700/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. DRAFT_SCHEDULE"
            />
          </div>
          <div>
            <label className="text-xs text-indigo-200 block mb-1">Monetary / Count Factor (฿)</label>
            <input
              type="number"
              value={simAmount}
              onChange={(e) => setSimAmount(Number(e.target.value))}
              className="w-full bg-slate-800/80 border border-indigo-700/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-indigo-200 block mb-1">Simulated User Role</label>
            <select
              value={simRole}
              onChange={(e) => setSimRole(e.target.value)}
              className="w-full bg-slate-800/80 border border-indigo-700/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="STAFF">STAFF</option>
              <option value="SUPERVISOR">SUPERVISOR</option>
              <option value="MANAGER">MANAGER</option>
              <option value="EXECUTIVE">EXECUTIVE</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={runPolicySimulation}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm shadow-md transition"
          >
            <Play className="w-4 h-4" /> Run Simulation Test
          </button>
        </div>

        {simResult && (
          <div className="mt-4 p-4 rounded-xl bg-slate-800/90 border border-indigo-500/30">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs text-indigo-300 font-mono">Evaluation at {simResult.evaluatedAt}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-md font-bold ${
                  simResult.riskLevel === "CRITICAL" ? "bg-rose-500/30 text-rose-300 border border-rose-500/40" :
                  simResult.riskLevel === "HIGH" ? "bg-amber-500/30 text-amber-300 border border-amber-500/40" :
                  simResult.riskLevel === "MEDIUM" ? "bg-blue-500/30 text-blue-300 border border-blue-500/40" :
                  "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                }`}>
                  RISK: {simResult.riskLevel}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-md font-bold ${
                  simResult.confirmationMode === "FORBIDDEN" ? "bg-rose-500/30 text-rose-300 border border-rose-500/40" :
                  simResult.confirmationMode === "APPROVAL_WORKFLOW" ? "bg-purple-500/30 text-purple-300 border border-purple-500/40" :
                  "bg-cyan-500/30 text-cyan-300 border border-cyan-500/40"
                }`}>
                  MODE: {simResult.confirmationMode}
                </span>
              </div>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-lg text-sm font-sans space-y-1">
              <p className="text-slate-200"><strong>ผลการประเมิน:</strong> {simResult.requiredAction}</p>
              <p className="text-slate-400 text-xs">
                <strong>การตรวจสอบสิทธิ์บทบาท:</strong> {simResult.roleAuthorized ? "✅ สิทธิ์ผ่านเกณฑ์" : "❌ บทบาทปัจจุบันไม่มีสิทธิ์ใน Action นี้"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Domain Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
        {domains.map((dom) => (
          <button
            key={dom}
            onClick={() => setSelectedDomain(dom)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
              selectedDomain === dom
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {dom}
          </button>
        ))}
      </div>

      {/* Policy Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            Active Policy Matrix Rules ({filteredPolicies.length})
          </h3>
          <span className="text-xs text-slate-500">
            ระบบตรวจสอบและบังคับใช้ก่อนสร้าง Action Proposal เสมอ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                <th className="p-4">Domain</th>
                <th className="p-4">Action Type</th>
                <th className="p-4">Risk Level</th>
                <th className="p-4">Confirmation Mode</th>
                <th className="p-4">Allowed Roles</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPolicies.map((p, idx) => {
                const isCrit = p.riskLevel === "CRITICAL" || p.confirmationMode === "FORBIDDEN";
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-mono font-medium text-slate-900">{p.domain}</td>
                    <td className="p-4 font-mono text-indigo-700 font-semibold">{p.actionType}</td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          p.riskLevel === "CRITICAL"
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : p.riskLevel === "HIGH"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : p.riskLevel === "MEDIUM"
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {p.riskLevel}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          p.confirmationMode === "FORBIDDEN"
                            ? "bg-rose-100 text-rose-800"
                            : p.confirmationMode === "APPROVAL_WORKFLOW"
                            ? "bg-purple-100 text-purple-800"
                            : p.confirmationMode === "CONFIRM"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {p.confirmationMode}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {(p.allowedRoles || []).map((r: string) => (
                          <span key={r} className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {p.enabled ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {p.enabled ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleTogglePolicy(p)}
                        disabled={isCrit}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                          isCrit
                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                            : p.enabled
                            ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {isCrit ? "Locked" : p.enabled ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
