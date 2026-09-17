"use client";

import { useState } from "react";
import { DollarSign, MapPin, Calendar, Plus, Send, CheckCircle2, FileText, Navigation } from "lucide-react";
import { showSuccess, showError, showLoading, closeSwal } from "@/lib/swal";
import { calculateTravelExpense } from "@/lib/expenses/calculate";

export default function EmployeeTravelExpensesPage() {
  const [expenses, setExpenses] = useState([
    { id: "1", date: "16/09/2026", route: "บ้าน → โรงงาน AAM มาบตาพุด", km: 12.5, cost: 62.5, status: "APPROVED" },
    { id: "2", date: "15/09/2026", route: "บ้าน → อมตะ ซิตี้ ระยอง", km: 18.2, cost: 91.0, status: "SUBMITTED" },
    { id: "3", date: "14/09/2026", route: "บ้าน → โรงงาน AAM มาบตาพุด", km: 12.4, cost: 62.0, status: "APPROVED" },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [routeDate, setRouteDate] = useState("2026-09-16");
  const [originName, setOriginName] = useState("บ้านพนักงาน (สุขุมวิท ระยอง)");
  const [destName, setDestName] = useState("โรงงาน AAM นิคมฯ มาบตาพุด");
  const [claimedKm, setClaimedKm] = useState("12.5");
  const [vehicleType, setVehicleType] = useState<"motorcycle" | "car">("car");

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const km = parseFloat(claimedKm);
    if (!km || km <= 0) {
      showError("กรุณากรอกระยะทาง", "ระยะทางกิโลเมตรต้องมากกว่า 0");
      return;
    }

    const calc = calculateTravelExpense({ distanceKm: km, vehicleType });

    const newExpense = {
      id: `exp-${Date.now()}`,
      date: routeDate,
      route: `${originName} → ${destName}`,
      km,
      cost: calc.totalCost,
      status: "SUBMITTED",
    };

    setExpenses([newExpense, ...expenses]);
    setShowForm(false);
    showSuccess("ยื่นขอเบิกค่าเดินทางสำเร็จ! 🚗", `ยื่นขอเบิกจำนวน ฿${calc.totalCost} เรียบร้อยแล้ว (รอ HR ตรวจสอบกับ GPS)`);
  };

  const totalAmount = expenses.reduce((acc, e) => acc + e.cost, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 font-sans p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 p-6 rounded-3xl text-white shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-black">ยื่นขอเบิกค่าเดินทาง (Travel Expense)</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>ยื่นขอเบิก</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs bg-white/10 p-3 rounded-2xl border border-white/10">
          <span>ยอดรวมขอเบิกเดือนนี้:</span>
          <span className="text-lg font-black text-emerald-400">฿{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Expenses History List */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-content-primary text-sm border-b border-surface-border pb-3">
          ประวัติการยื่นขอเบิกค่าเดินทาง
        </h3>

        <div className="space-y-3 text-xs">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-surface-subtle border border-surface-border p-3.5 rounded-2xl flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="text-[10px] text-content-muted font-mono">{exp.date}</span>
                <h4 className="font-bold text-content-primary">{exp.route}</h4>
                <p className="text-content-muted text-[11px]">ระยะทาง {exp.km} กม. (อัตรา ฿5/กม.)</p>
              </div>

              <div className="text-right space-y-1">
                <span className="text-sm font-black text-emerald-600 block">฿{exp.cost}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    exp.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-amber-50 text-amber-600 border border-amber-200"
                  }`}
                >
                  {exp.status === "APPROVED" ? "อนุมัติแล้ว" : "รอตรวจสอบ"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-card border border-surface-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-content-primary text-base">ยื่นขอเบิกค่าเดินทางใหม่</h3>

            <form onSubmit={handleSubmitExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-content-primary mb-1">วันที่เดินทาง</label>
                <input
                  type="date"
                  value={routeDate}
                  onChange={(e) => setRouteDate(e.target.value)}
                  className="w-full bg-surface-subtle border border-surface-border rounded-2xl px-3 py-2 text-content-primary font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-content-primary mb-1">จุดเริ่มต้น (Origin)</label>
                <input
                  type="text"
                  required
                  value={originName}
                  onChange={(e) => setOriginName(e.target.value)}
                  className="w-full bg-surface-subtle border border-surface-border rounded-2xl px-3 py-2 text-content-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-content-primary mb-1">ปลายทาง (Destination Site)</label>
                <input
                  type="text"
                  required
                  value={destName}
                  onChange={(e) => setDestName(e.target.value)}
                  className="w-full bg-surface-subtle border border-surface-border rounded-2xl px-3 py-2 text-content-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-content-primary mb-1">ระยะทาง (กม.)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={claimedKm}
                    onChange={(e) => setClaimedKm(e.target.value)}
                    className="w-full bg-surface-subtle border border-surface-border rounded-2xl px-3 py-2 text-content-primary font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-content-primary mb-1">ยานพาหนะ</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as any)}
                    className="w-full bg-surface-subtle border border-surface-border rounded-2xl px-3 py-2 text-content-primary font-semibold"
                  >
                    <option value="car">รถยนต์ (฿5/กม.)</option>
                    <option value="motorcycle">รถจักรยานยนต์ (฿4/กม.)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-surface-border rounded-2xl font-bold text-content-muted"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-md"
                >
                  ส่งขอเบิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
