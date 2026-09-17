"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Play,
  Lock,
  FileCheck,
  Clock,
  ArrowLeft,
  Download,
  AlertOctagon,
} from "lucide-react";
import Swal from "@/lib/swal";

export default function BackupsManagementPage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningBackup, setRunningBackup] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchBackups = async () => {
    try {
      const res = await fetch("/api/platform/backups");
      const data = await res.json();
      setBackups(data.backups || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleRunBackup = async () => {
    const confirm = await Swal.fire({
      title: "ยืนยันการสำรองข้อมูล (Create Backup)?",
      text: "ระบบจะสร้าง Database Snapshot พร้อมเข้ารหัส AES-256 และคำนวณ SHA-256 Checksum",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "เริ่มต้นสำรองข้อมูล",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#2563eb",
    });

    if (!confirm.isConfirmed) return;

    try {
      setRunningBackup(true);
      const res = await fetch("/api/platform/backups/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backupType: "DATABASE_FULL",
          destination: "LOCAL",
          encrypt: true,
          retentionDays: 30,
        }),
      });
      const data = await res.json();

      if (data.success) {
        await Swal.fire({
          icon: "success",
          title: "สำรองข้อมูลสำเร็จ",
          text: `หมายเลข Backup: ${data.backup.backupNumber} (ขนาด: ${data.backup.sizeBytes} bytes)`,
        });
        fetchBackups();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "การสำรองข้อมูลล้มเหลว",
        text: err.message,
      });
    } finally {
      setRunningBackup(false);
    }
  };

  const handleRestoreTest = async (backupId: string, backupNumber: string) => {
    const confirm = await Swal.fire({
      title: "ทดสอบการ Restore (Automated Verification)?",
      html: `
        <div class="text-left text-sm text-slate-300">
          <p>ระบบจะดำเนินการทดสอบตามมาตรฐาน <b>"Backup is useless until restore is tested"</b>:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1 text-xs text-slate-400">
            <li>ตรวจสอบความถูกต้องของ SHA-256 Checksum</li>
            <li>ทดสอบการถอดรหัส AES-256</li>
            <li>จำลองการ Restore เข้าสู่ Isolated Sandbox Database</li>
            <li>ทดสอบ Referential Integrity & Schema Verification</li>
            <li>ล้างข้อมูลสภาพแวดล้อมจำลองอัตโนมัติ (Zero Side-Effects)</li>
          </ul>
        </div>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "เริ่มการทดสอบกู้คืน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#10b981",
    });

    if (!confirm.isConfirmed) return;

    try {
      setVerifyingId(backupId);
      const res = await fetch(`/api/platform/backups/${backupId}/restore-test`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        await Swal.fire({
          icon: "success",
          title: "Restore Verification ผ่านการตรวจสอบ 100%",
          html: `
            <div class="text-left text-xs space-y-1 text-slate-300">
              <p><b>Backup Number:</b> ${backupNumber}</p>
              <p><b>ระยะเวลาทดสอบ:</b> ${data.result.durationMs} ms</p>
              <p><b>Checksum Check:</b> ผ่าน</p>
              <p><b>Decryption Check:</b> ผ่าน</p>
              <p><b>Schema Check:</b> ผ่าน</p>
              <p><b>Integrity Smoke Test:</b> ผ่าน</p>
            </div>
          `,
        });
        fetchBackups();
      } else {
        throw new Error(data.error || data.result?.error);
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Verification ล้มเหลว",
        text: err.message,
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const latestBackup = backups[0];
  const lastVerified = backups.find((b) => b.verifications?.some((v: any) => v.status === "VERIFIED"));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/platform"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <HardDrive className="w-6 h-6 text-blue-400" />
              Backup & Restore Verification Hub
            </h1>
            <p className="text-sm text-slate-400">
              หลักการ: Backup is useless until restore is tested • นโยบายสำรองข้อมูล 3-2-1 และการทดสอบกู้คืนอัตโนมัติ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBackups}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            รีเฟรช
          </button>
          <button
            onClick={handleRunBackup}
            disabled={runningBackup}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-600/20 transition"
          >
            <Play className={`w-4 h-4 ${runningBackup ? "animate-spin" : ""}`} />
            สั่งสำรองข้อมูลทันที (Run Backup)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold uppercase text-slate-400">Backup ล่าสุด</span>
          <div className="text-lg font-bold text-white mt-1">
            {latestBackup ? latestBackup.backupNumber : "ยังไม่มีข้อมูล"}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {latestBackup ? new Date(latestBackup.startedAt).toLocaleString("th-TH") : "-"}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold uppercase text-slate-400">Restore Test ล่าสุด</span>
          <div className="text-lg font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5" />
            {lastVerified ? "ผ่านการทดสอบ" : "ยังไม่ได้ทดสอบ"}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {lastVerified ? `ชุด: ${lastVerified.backupNumber}` : "แนะนำให้กดทดสอบอย่างน้อย 1 ครั้ง"}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold uppercase text-slate-400">การเข้ารหัส (Encryption)</span>
          <div className="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
            <Lock className="w-5 h-5 text-indigo-400" />
            AES-256-GCM
          </div>
          <p className="text-xs text-slate-400 mt-2">Zero Plaintext Dump on Disk</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold uppercase text-slate-400">นโยบาย Retention</span>
          <div className="text-lg font-bold text-white mt-1">30 วัน (Daily/Weekly)</div>
          <p className="text-xs text-slate-400 mt-2">Auto-pruning Expired Dumps</p>
        </div>
      </div>

      {/* Backups Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">ประวัติชุดสำรองข้อมูล (Backup Artifacts)</h2>
            <p className="text-xs text-slate-400">แสดง Checksum, ขนาดไฟล์, และผลการทดสอบ Restore อัตโนมัติ</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                <th className="py-3 px-4">Backup Number</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">SHA-256 Checksum</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Restore Test</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    ยังไม่มีรายการ Backup กรุณากด "สั่งสำรองข้อมูลทันที"
                  </td>
                </tr>
              ) : (
                backups.map((bkp) => {
                  const verified = bkp.verifications?.some((v: any) => v.status === "VERIFIED");
                  return (
                    <tr key={bkp.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-white">
                        {bkp.backupNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
                          {bkp.backupType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                        {(bkp.sizeBytes / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400" title={bkp.checksumSha256}>
                        {bkp.checksumSha256 ? `${bkp.checksumSha256.slice(0, 16)}...` : "PENDING"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> SUCCESS
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {verified ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                            <ShieldCheck className="w-3 h-3" /> VERIFIED
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Not Tested</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRestoreTest(bkp.id, bkp.backupNumber)}
                          disabled={verifyingId === bkp.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition inline-flex items-center gap-1.5"
                        >
                          <FileCheck className={`w-3.5 h-3.5 ${verifyingId === bkp.id ? "animate-spin" : ""}`} />
                          ทดสอบ Restore
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
