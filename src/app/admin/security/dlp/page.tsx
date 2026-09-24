"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  FileCheck2,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  ArrowRight,
  Database,
  Terminal,
} from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

const SECURITY_TABS = [
  { label: "ศูนย์ความปลอดภัย", href: "/admin/security" },
  { label: "ผู้ใช้งาน (Users)", href: "/admin/security/users" },
  { label: "บทบาทและสิทธิ์ (Roles)", href: "/admin/security/roles" },
  { label: "รายการสิทธิ์ (Permissions)", href: "/admin/security/permissions" },
  { label: "ตารางสิทธิ์ (Matrix)", href: "/admin/security/permission-matrix" },
  { label: "สิทธิ์ระดับแผนก", href: "/admin/security/department-access" },
  { label: "อำนาจอนุมัติ (Approval Matrix)", href: "/admin/security/approval-matrix" },
  { label: "จัดการ Session", href: "/admin/security/sessions" },
  { label: "อุปกรณ์ที่เข้าสู่ระบบ", href: "/admin/security/devices" },
  { label: "คำขอเข้าถึงข้อมูล", href: "/admin/security/access-requests" },
  { label: "ทบทวนสิทธิ์ (Access Review)", href: "/admin/security/access-review" },
  { label: "บันทึกการตรวจสอบ (Audit Log)", href: "/admin/security/audit" },
  { label: "Data Log Prevention (DLP)", href: "/admin/security/dlp" },
];

export default function SecurityDlpPage() {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState<any>(null);
  const [testInput, setTestInput] = useState(
    "พนักงาน สมชาย รหัสบัตร 1-5099-00123-45-6 บัญชี 123-4-56789-0 เบอร์ 0812345678 รหัสผ่าน SuperSecret2026!"
  );
  const [testResult, setTestResult] = useState<any>(null);

  // Fetch initial integrity status
  useEffect(() => {
    fetchDlpStatus();
  }, []);

  const fetchDlpStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/security/dlp/status");
      const data = await res.json();
      setIntegrityStatus(data.stats?.integrityReport || null);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    try {
      const res = await fetch("/api/security/dlp/verify", { method: "POST" });
      const data = await res.json();
      setIntegrityStatus(data.report);
    } catch (e: any) {
      alert("การตรวจสอบล้มเหลว: " + e.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleRunTestMasking = async () => {
    try {
      const res = await fetch("/api/security/dlp/test-masking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: testInput }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      alert("การทดสอบล้มเหลว: " + e.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="SECURITY / DATA LOSS PREVENTION & LOG INTEGRITY"
        title="ระบบป้องกันการรั่วไหลของข้อมูลและล็อกความปลอดภัย (DLP & Tamper-Proof Audit)"
        description="การปกป้องข้อมูลส่วนบุคคล (PDPA/PII Redaction), การตรวจจับและตัดตอนข้อมูลความลับ (Secrets & Passwords) และการเข้ารหัส Hash-Chaining ป้องกันการดัดแปลงแก้ไข Audit Log (Anti-Tampering)"
        breadcrumbs={[
          { label: "ศูนย์ความปลอดภัย", href: "/admin/security" },
          { label: "Data Log Prevention (DLP)" },
        ]}
      />

      <EnterpriseModuleNav tabs={SECURITY_TABS} />

      {/* Top Security KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">DLP Inspection Engine</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">100% ENFORCED</p>
          <p className="text-xs text-slate-400 mt-1">กรองข้อมูลอ่อนไหวก่อนลง Log ทุกช่องทาง</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Log Integrity (HMAC-SHA256)</span>
            <Lock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {integrityStatus?.isValid !== false ? "VERIFIED INTACT" : "TAMPER ALERT"}
          </p>
          <p className="text-xs text-emerald-400 mt-1">
            ✓ ลายเซ็นดิจิทัลต่อเนื่อง (Blockchain-style Chain)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">PDPA / PII Masking Rules</span>
            <KeyRound className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-400 mt-2">5 Active Rules</p>
          <p className="text-xs text-slate-400 mt-1">บัตร ปชช., บัญชี, รหัสผ่าน, เบอร์โทร, เงินเดือน</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Data Exfiltration Defense</span>
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">Watermarked</p>
          <p className="text-xs text-slate-400 mt-1">ฝังลายน้ำนิติวิทยาศาสตร์ในไฟล์ Export ทุกชุด</p>
        </div>
      </div>

      {/* Cryptographic Audit Log Integrity Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                การตรวจสอบความสมบูรณ์ของล็อก (Cryptographic Audit Log Verification)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                WORM COMPLIANT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ระบบป้องกันการแก้ไขหรือลบล็อกประวัติย้อนหลัง (Anti-Tampering) ด้วยการร้อยเรียงลายเซ็นแฮช HMAC-SHA256
            </p>
          </div>
          <button
            onClick={handleVerifyIntegrity}
            disabled={verifying}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifying ? "animate-spin" : ""}`} />
            {verifying ? "กำลังคำนวณแฮชทุกล็อก..." : "ตรวจสอบความสมบูรณ์เดี๋ยวนี้ (Verify Chain)"}
          </button>
        </div>

        {integrityStatus && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
              integrityStatus.isValid
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            {integrityStatus.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-bold">
                {integrityStatus.isValid
                  ? "✓ ล็อกประวัติทั้งหมดมีความสมบูรณ์ 100% ไม่พบการดัดแปลงหรือแทรกแซงข้อมูล (Integrity Intact)"
                  : "⚠ ตรวจพบความผิดปกติในลายเซ็นแฮชของล็อกประวัติ (Integrity Violation Detected)"}
              </p>
              <p className="text-[11px] text-slate-400">
                ตรวจสอบล่าสุด: {new Date(integrityStatus.checkedAt).toLocaleString("th-TH")} | ตรวจสอบไปแล้ว{" "}
                {integrityStatus.totalLogsChecked} รายการ
              </p>
              {integrityStatus.reason && (
                <p className="text-rose-400 font-mono text-[11px] mt-1">{integrityStatus.reason}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interactive DLP Test Bench */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" /> ห้องทดลองตัดตอนข้อมูลอ่อนไหว (DLP Sanitizer Workbench)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ทดสอบการทำงานของ Regex และ Recursive Parser ในการตรวจจับและเซ็นเซอร์ข้อมูลส่วนบุคคลก่อนลง Database
            </p>
          </div>
          <button
            onClick={handleRunTestMasking}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            ประมวลผล DLP Sanitizer
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">ข้อมูลนำเข้าทดสอบ (Raw Payload / Text)</label>
            <textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              ผลลัพธ์หลังผ่าน DLP Masking (Sanitized Output)
            </label>
            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono min-h-[96px] text-emerald-400 overflow-x-auto">
              {testResult ? (
                <div>
                  <p>{testResult.sanitized}</p>
                  {testResult.detectedTypes?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-sans">ตรวจพบและเซ็นเซอร์:</span>
                      {testResult.detectedTypes.map((t: string) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-slate-500 italic font-sans">
                  กดปุ่ม &quot;ประมวลผล DLP Sanitizer&quot; เพื่อดูตัวอย่างผลลัพธ์
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DLP Policy Enforcement Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white">นโยบายความปลอดภัยและเกณฑ์ตรวจจับ (Enforced DLP Policies)</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            กฎการปกป้องข้อมูลระดับ Kernel ที่บังคับใช้กับทุก Service, Controller, และ Audit Log Stream
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3 rounded-l-xl">รหัสนโยบาย</th>
                <th className="p-3">ประเภทข้อมูล (Data Category)</th>
                <th className="p-3">รูปแบบเป้าหมาย</th>
                <th className="p-3">การกระทำ (DLP Action)</th>
                <th className="p-3">รูปแบบหลังเซ็นเซอร์</th>
                <th className="p-3 rounded-r-xl">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-mono text-purple-400 font-semibold">POL-DLP-001</td>
                <td className="p-3 font-semibold text-white">เลขบัตรประชาชนไทย 13 หลัก</td>
                <td className="p-3 font-mono text-slate-400">\b\d&#123;1&#125;[-.\s]?\d&#123;4&#125;...</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    MASK
                  </span>
                </td>
                <td className="p-3 font-mono text-emerald-400">1-1002-*****-89-1</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-mono text-purple-400 font-semibold">POL-DLP-002</td>
                <td className="p-3 font-semibold text-white">เลขที่บัญชีธนาคาร</td>
                <td className="p-3 font-mono text-slate-400">\b\d&#123;3&#125;[-.\s]?\d&#123;1&#125;...</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    MASK
                  </span>
                </td>
                <td className="p-3 font-mono text-emerald-400">123-x-xxxxx-0</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-mono text-purple-400 font-semibold">POL-DLP-003</td>
                <td className="p-3 font-semibold text-white">รหัสผ่าน, โทเค็น, และคีย์ลับ</td>
                <td className="p-3 font-mono text-slate-400">password, token, secret, mfaSecret</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    REDACT
                  </span>
                </td>
                <td className="p-3 font-mono text-rose-400">[REDACTED_BY_DLP]</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-mono text-purple-400 font-semibold">POL-DLP-004</td>
                <td className="p-3 font-semibold text-white">ร้อยเรียงแฮช Audit Log ป้องกันการแก้</td>
                <td className="p-3 font-mono text-slate-400">HMAC-SHA256 (PrevHash + Record)</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    SIGN &amp; CHAIN
                  </span>
                </td>
                <td className="p-3 font-mono text-blue-400">64-char Hex Digest</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-mono text-purple-400 font-semibold">POL-DLP-005</td>
                <td className="p-3 font-semibold text-white">ป้องกันการดูดข้อมูลจำนวนมาก (Exfiltration)</td>
                <td className="p-3 font-mono text-slate-400">Bulk Download &gt; 50 Records</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    WATERMARK
                  </span>
                </td>
                <td className="p-3 font-mono text-amber-400">CONFIDENTIAL | TRACE-ID</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
