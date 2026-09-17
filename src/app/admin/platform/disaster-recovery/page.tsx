"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  Activity,
  Layers,
  Award,
} from "lucide-react";
import Swal from "@/lib/swal";

export default function DisasterRecoveryDashboard() {
  const [exercises, setExercises] = useState([
    {
      id: "dr-1",
      exerciseNumber: "DR-DRILL-2026-001",
      scenario: "VPS_LOSS (Total Server Loss Simulation)",
      participants: "SRE Commander, Lead DevOps, Security Officer",
      targetRtoMinutes: 60,
      actualRtoMinutes: 42,
      targetRpoMinutes: 15,
      actualRpoMinutes: 8,
      result: "PASS",
      executedAt: "2026-09-15T10:00:00.000Z",
    },
  ]);

  const rpoRtoServices = [
    {
      name: "Identity & Authentication",
      criticality: "CRITICAL",
      targetRpo: "15 นาที",
      targetRto: "30 นาที",
      priority: 1,
      status: "COMPLIANT",
    },
    {
      name: "PostgreSQL Primary Database",
      criticality: "CRITICAL",
      targetRpo: "15 นาที",
      targetRto: "45 นาที",
      priority: 2,
      status: "COMPLIANT",
    },
    {
      name: "Core Operations & Project Tracking",
      criticality: "CRITICAL",
      targetRpo: "30 นาที",
      targetRto: "60 นาที",
      priority: 3,
      status: "COMPLIANT",
    },
    {
      name: "Finance, Billing & Ledger Control",
      criticality: "CRITICAL",
      targetRpo: "15 นาที",
      targetRto: "60 นาที",
      priority: 4,
      status: "COMPLIANT",
    },
    {
      name: "BullMQ Job Workers & Outbox Queue",
      criticality: "HIGH",
      targetRpo: "60 นาที",
      targetRto: "15 นาที",
      priority: 5,
      status: "COMPLIANT",
    },
    {
      name: "External Gateways (LINE, Telegram, Email)",
      criticality: "MEDIUM",
      targetRpo: "120 นาที",
      targetRto: "15 นาที",
      priority: 6,
      status: "COMPLIANT",
    },
    {
      name: "Analytics & Data Warehouse Marts",
      criticality: "LOW",
      targetRpo: "24 ชม.",
      targetRto: "4 ชม.",
      priority: 7,
      status: "COMPLIANT",
    },
  ];

  const handleSimulateDrill = async () => {
    const { value: formValues } = await Swal.fire({
      title: "บันทึกผลการซ้อมแผน DR (Disaster Recovery Drill)",
      html: `
        <div class="space-y-3 text-left text-sm">
          <div>
            <label class="text-xs text-slate-400 font-medium">Scenario</label>
            <select id="swal-scenario" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1">
              <option value="DATABASE_CORRUPTION">DATABASE_CORRUPTION (ฐานข้อมูลเสียหาย/Corruption)</option>
              <option value="VPS_LOSS">VPS_LOSS (เครื่องแม่ข่ายล่มทั้งหมด)</option>
              <option value="STORAGE_OUTAGE">STORAGE_OUTAGE (Object Storage ขัดข้อง)</option>
              <option value="REDIS_FAILURE">REDIS_FAILURE (Redis ล่ม)</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-slate-400 font-medium">ผู้ร่วมฝึกซ้อม (Participants)</label>
            <input id="swal-participants" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1" value="SRE Lead, DevOps On-Call" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs text-slate-400 font-medium">เวลาที่ใช้จริง RTO (นาที)</label>
              <input id="swal-rto" type="number" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1" value="35" />
            </div>
            <div>
              <label class="text-xs text-slate-400 font-medium">ข้อมูลที่สูญหายจริง RPO (นาที)</label>
              <input id="swal-rpo" type="number" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1" value="5" />
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึกผลการทดสอบ",
      cancelButtonText: "ยกเลิก",
      preConfirm: () => {
        return {
          scenario: (document.getElementById("swal-scenario") as HTMLSelectElement).value,
          participants: (document.getElementById("swal-participants") as HTMLInputElement).value,
          actualRtoMinutes: parseInt((document.getElementById("swal-rto") as HTMLInputElement).value),
          actualRpoMinutes: parseInt((document.getElementById("swal-rpo") as HTMLInputElement).value),
        };
      },
    });

    if (formValues) {
      const newEx = {
        id: `dr-${Date.now()}`,
        exerciseNumber: `DR-DRILL-2026-00${exercises.length + 1}`,
        scenario: formValues.scenario,
        participants: formValues.participants,
        targetRtoMinutes: 60,
        actualRtoMinutes: formValues.actualRtoMinutes,
        targetRpoMinutes: 15,
        actualRpoMinutes: formValues.actualRpoMinutes,
        result: formValues.actualRtoMinutes <= 60 ? "PASS" : "PARTIAL",
        executedAt: new Date().toISOString(),
      };
      setExercises([newEx, ...exercises]);
      Swal.fire({
        icon: "success",
        title: "บันทึกผลสำเร็จ",
        text: `ผลการทดสอบ: ${newEx.result} (RTO: ${newEx.actualRtoMinutes} นาที)`,
      });
    }
  };

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
              <ShieldAlert className="w-6 h-6 text-amber-400" />
              Disaster Recovery (DR) & RPO / RTO Command Center
            </h1>
            <p className="text-sm text-slate-400">
              ข้อกำหนด RPO / RTO ประจำแต่ละบริการ, ลำดับความสำคัญในการกู้คืน (Recovery Sequence) และบันทึกการซ้อมแผน
            </p>
          </div>
        </div>

        <button
          onClick={handleSimulateDrill}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-amber-600/20 transition"
        >
          <Award className="w-4 h-4" />
          บันทึกการฝึกซ้อม (DR Drill)
        </button>
      </div>

      {/* RPO / RTO Target Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">RPO & RTO Service Targets and Recovery Sequence</h2>
            <p className="text-xs text-slate-400">ลำดับการฟื้นฟูระบบตาม Business Criticality</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Service Name</th>
                <th className="py-3 px-4">Criticality</th>
                <th className="py-3 px-4">Target RPO (Max Data Loss)</th>
                <th className="py-3 px-4">Target RTO (Max Recovery Time)</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rpoRtoServices.map((svc) => (
                <tr key={svc.priority} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold inline-flex items-center justify-center">
                      #{svc.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white">{svc.name}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        svc.criticality === "CRITICAL"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : svc.criticality === "HIGH"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {svc.criticality}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-300">{svc.targetRpo}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-300">{svc.targetRto}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> {svc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DR Drills & Exercises History */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">บันทึกประวัติการซ้อมแผนกู้คืนภัยพิบัติ (Disaster Recovery Drills)</h2>
          <p className="text-xs text-slate-400">เปรียบเทียบ Target vs Actual RTO/RPO จากการซ้อมจริง</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                <th className="py-3 px-4">Exercise Number</th>
                <th className="py-3 px-4">Scenario</th>
                <th className="py-3 px-4">Target vs Actual RTO</th>
                <th className="py-3 px-4">Target vs Actual RPO</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Participants</th>
                <th className="py-3 px-4">Executed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {exercises.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-mono font-medium text-white">{ex.exerciseNumber}</td>
                  <td className="py-3.5 px-4 text-slate-300 font-medium">{ex.scenario}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-emerald-400">
                    {ex.actualRtoMinutes}m / {ex.targetRtoMinutes}m
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-emerald-400">
                    {ex.actualRpoMinutes}m / {ex.targetRpoMinutes}m
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> {ex.result}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">{ex.participants}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">
                    {new Date(ex.executedAt).toLocaleDateString("th-TH")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
