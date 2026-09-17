"use client";

import React, { useState, useEffect } from "react";
import {
  PieChart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRightLeft,
  History,
  CheckCircle2,
  Plus,
  RefreshCw,
  Sliders,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import Swal from "sweetalert2";

export default function BudgetPlanningPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [planDetail, setPlanDetail] = useState<any>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);

  // Transfer Form State
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferReason, setTransferReason] = useState("");

  // Revision Form State
  const [revisionReason, setRevisionReason] = useState("MANAGEMENT_DECISION");
  const [revisionNotes, setRevisionNotes] = useState("");

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/finance/budgets");
      const data = await res.json();
      if (data.success && data.plans.length > 0) {
        setPlans(data.plans);
        const targetId = selectedPlanId || data.plans[0].id;
        setSelectedPlanId(targetId);
        fetchPlanDetail(targetId);
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire({ icon: "error", title: "ผิดพลาด", text: "ไม่สามารถดึงข้อมูลแผนงบประมาณได้" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanDetail = async (planId: string) => {
    try {
      const res = await fetch(`/api/finance/budgets?id=${planId}`);
      const data = await res.json();
      if (data.success) {
        setPlanDetail(data.detail);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedPlanId(id);
    fetchPlanDetail(id);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFrom || !transferTo || !transferAmount || !transferReason) {
      Swal.fire({ icon: "warning", title: "กรุณากรอกข้อมูลให้ครบถ้วน" });
      return;
    }

    try {
      const res = await fetch("/api/finance/budget/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromBudgetLineId: transferFrom,
          toBudgetLineId: transferTo,
          amount: parseFloat(transferAmount),
          reason: transferReason,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Auto approve for demonstration if admin
      await fetch("/api/finance/budget/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE",
          transferId: data.transfer.id,
        }),
      });

      Swal.fire({ icon: "success", title: "โอนงบประมาณสำเร็จ", timer: 1800, showConfirmButton: false });
      setTransferModalOpen(false);
      setTransferAmount("");
      setTransferReason("");
      fetchPlanDetail(selectedPlanId);
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ไม่สามารถโอนงบได้", text: err.message });
    }
  };

  const handleRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/finance/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REVISE",
          planId: selectedPlanId,
          reasonCategory: revisionReason,
          notes: revisionNotes,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      Swal.fire({ icon: "success", title: "สร้าง Revision สำเร็จ", timer: 1800, showConfirmButton: false });
      setRevisionModalOpen(false);
      setRevisionNotes("");
      fetchPlans();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ผิดพลาด", text: err.message });
    }
  };

  const currentPlan = planDetail?.plan;
  const lines = planDetail?.lines || [];
  const revisions = planDetail?.revisions || [];

  const totalAllocated = lines.reduce((s: number, l: any) => s + l.allocatedAmount, 0);
  const totalConsumed = lines.reduce((s: number, l: any) => s + l.consumedAmount, 0);
  const totalCommitted = lines.reduce((s: number, l: any) => s + l.committedAmount, 0);
  const totalAvailable = lines.reduce((s: number, l: any) => s + l.availableAmount, 0);
  const overallBurnRate = totalAllocated > 0 ? Math.round(((totalConsumed + totalCommitted) / totalAllocated) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
              Phase 21 — Enterprise Budget Control
            </span>
            <span className="text-xs text-slate-500">Commitment & Allocation</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2.5">
            <PieChart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            การวางแผนและควบคุมงบประมาณองค์กร (Budget Control)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ควบคุมงบประมาณระดับโครงการ แผนก และองค์กร พร้อมระบบ Commitment Pre-check และการโยกงบประมาณ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowRightLeft className="w-4 h-4" />
            โอนย้ายงบ (Budget Transfer)
          </button>
          <button
            onClick={() => setRevisionModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow transition"
          >
            <History className="w-4 h-4" />
            ปรับปรุงงบ (Revision)
          </button>
        </div>
      </div>

      {/* Plan Selector & Quick Info */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            เลือกแผนงบประมาณ:
          </label>
          <select
            value={selectedPlanId}
            onChange={handlePlanChange}
            className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium w-full md:w-96"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.planNo}] {p.name} (v{p.version} - {p.status})
              </option>
            ))}
          </select>
        </div>

        {currentPlan && (
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>สถานะ: <strong className="text-emerald-600 font-bold">{currentPlan.status}</strong></span>
            <span>•</span>
            <span>ปีงบประมาณ: <strong>{currentPlan.fiscalYear}</strong></span>
            <span>•</span>
            <span>เวอร์ชัน: <strong>v{currentPlan.version}</strong></span>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            งบประมาณที่ได้รับอนุมัติ (Allocated)
          </div>
          <div className="text-2xl font-black mt-2 text-slate-900 dark:text-white">
            ฿{totalAllocated.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500">กรอบงบประมาณประจำปีทั้งหมด</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            ใช้จริงแล้ว (Actual Consumed)
          </div>
          <div className="text-2xl font-black mt-2 text-rose-600 dark:text-rose-400">
            ฿{totalConsumed.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500">ค่าจ้าง, เคมีภัณฑ์, ค่าน้ำมัน, ค่าใช้จ่าย</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            ผูกพันรอจ่าย (Committed)
          </div>
          <div className="text-2xl font-black mt-2 text-amber-600 dark:text-amber-400">
            ฿{totalCommitted.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500">PO อนุมัติแล้ว, สัญญาบริการที่ผูกพัน</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            งบคงเหลือพร้อมใช้ (Available)
          </div>
          <div className="text-2xl font-black mt-2 text-emerald-600 dark:text-emerald-400">
            ฿{totalAvailable.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            อัตราการใช้งาน: <strong className="text-blue-600">{overallBurnRate}%</strong>
          </div>
        </div>
      </div>

      {/* Formula Info Banner */}
      <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs flex items-center justify-between text-blue-900 dark:text-blue-200">
        <span className="font-semibold">
          สูตรควบคุมงบประมาณ: Available Budget = Allocated Budget - Consumed (Actual) - Committed Outflows
        </span>
        <span className="text-[11px] opacity-80">โหมดการควบคุม: WARNING / HARD_BLOCK</span>
      </div>

      {/* Budget Lines Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="font-bold text-base">รายการจัดสรรงบประมาณแยกตามหมวดหมู่ (Budget Lines)</h2>
          <span className="text-xs text-slate-500">{lines.length} หมวดค่าใช้จ่าย</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">หมวดงบประมาณ</th>
                <th className="py-3 px-4">รอบเวลา</th>
                <th className="py-3 px-4 text-right">งบจัดสรร (Allocated)</th>
                <th className="py-3 px-4 text-right">ใช้จริง (Consumed)</th>
                <th className="py-3 px-4 text-right">ผูกพัน (Committed)</th>
                <th className="py-3 px-4 text-right">คงเหลือ (Available)</th>
                <th className="py-3 px-4 text-center">สัดส่วนการใช้</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {lines.map((l: any) => {
                const totalUsed = l.consumedAmount + l.committedAmount;
                const burnRate = l.allocatedAmount > 0 ? Math.round((totalUsed / l.allocatedAmount) * 100) : 0;
                const isOver = l.availableAmount < 0;

                return (
                  <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{l.category}</div>
                      <div className="text-[11px] text-slate-500">{l.department || "Operations"}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{l.period}</td>
                    <td className="py-3.5 px-4 text-right font-semibold">
                      ฿{l.allocatedAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-600 dark:text-rose-400">
                      ฿{l.consumedAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-amber-600 dark:text-amber-400">
                      ฿{l.committedAmount.toLocaleString()}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-extrabold ${
                        isOver ? "text-rose-600" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      ฿{l.availableAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-32 mx-auto space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                          <span>{burnRate}%</span>
                          {isOver && <span className="text-rose-500">เกินงบ</span>}
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              burnRate > 90 ? "bg-rose-500" : burnRate > 75 ? "bg-amber-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${Math.min(100, burnRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revision History */}
      {revisions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-sm">ประวัติการปรับปรุงงบประมาณ (Revision Audit Trail)</h3>
          <div className="space-y-2">
            {revisions.map((rev: any) => (
              <div
                key={rev.id}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-bold">{rev.revisionNo}</span>: ปรับปรุงจาก v{rev.fromVersion} เป็น v{rev.toVersion} (เหตุผล: {rev.reasonCategory})
                  <div className="text-slate-500 mt-0.5">{rev.notes}</div>
                </div>
                <div className="text-slate-400 text-right">
                  {new Date(rev.createdAt).toLocaleDateString("th-TH")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold">โอนย้ายงบประมาณ (Budget Transfer)</h3>
              <button onClick={() => setTransferModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">จากหมวดงบประมาณ (ต้นทาง)</label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  required
                >
                  <option value="">-- เลือกหมวดต้นทาง --</option>
                  {lines.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.category} (คงเหลือ ฿{l.availableAmount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">ไปยังหมวดงบประมาณ (ปลายทาง)</label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  required
                >
                  <option value="">-- เลือกหมวดปลายทาง --</option>
                  {lines.map((l: any) => (
                    <option key={l.id} value={l.id} disabled={l.id === transferFrom}>
                      {l.category} (ปัจจุบัน ฿{l.allocatedAmount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">จำนวนเงินที่ต้องการโอน (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  placeholder="เช่น 50000"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">เหตุผลความจำเป็นในการโอนงบ</label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  placeholder="ระบุเหตุผลในการปรับแผนงบ..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow"
                >
                  ยืนยันการโอนงบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {revisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold">สร้าง Budget Revision (เวอร์ชันใหม่)</h3>
              <button onClick={() => setRevisionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleRevisionSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">เหตุผลหลักในการปรับงบ</label>
                <select
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                >
                  <option value="SCOPE_CHANGE">การเปลี่ยนแปลงขอบเขตงาน (Scope Change)</option>
                  <option value="CONTRACT_CHANGE">การปรับเปลี่ยนสัญญาจ้าง (Contract Change)</option>
                  <option value="OPERATIONAL_CHANGE">การปรับเปลี่ยนการปฏิบัติการ (Operational Change)</option>
                  <option value="MANAGEMENT_DECISION">มติคณะผู้บริหาร (Management Decision)</option>
                  <option value="OTHER">อื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">บันทึกรายละเอียดการปรับปรุง</label>
                <textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  placeholder="รายละเอียดเพิ่มเติมสำหรับการตรวจสอบ..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow"
                >
                  บันทึก Revision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
