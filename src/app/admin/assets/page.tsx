"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  Wrench,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  ShieldAlert,
  ArrowRightLeft,
  Building,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/swal";

export default function AssetsAdminPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const [newAsset, setNewAsset] = useState({
    assetCode: "",
    name: "",
    category: "POWER_TOOL",
    serialNo: "",
    purchaseCost: 5000,
  });

  const [assignForm, setAssignForm] = useState({
    employeeId: "",
    issuedBy: "หัวหน้าคลังพัสดุ",
    expectedReturnAt: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
  });

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assets");
      const data = await res.json();
      if (data.success) setAssets(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAsset),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("เพิ่มทรัพย์สินสำเร็จ", `รหัสทรัพย์สิน: ${data.data.assetCode}`);
        setShowAssetModal(false);
        fetchAssets();
      } else {
        showError("เกิดข้อผิดพลาด", data.error);
      }
    } catch (err: any) {
      showError("เกิดข้อผิดพลาด", err.message);
    }
  };

  const handleAssignTool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/assets/tool-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: selectedAsset.id,
          employeeId: assignForm.employeeId,
          issuedBy: assignForm.issuedBy,
          expectedReturnAt: new Date(assignForm.expectedReturnAt),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("ยืมเครื่องมือสำเร็จ", `บันทึกการส่งมอบให้พนักงานเรียบร้อย`);
        setShowAssignModal(false);
        fetchAssets();
      } else {
        showError("เกิดข้อผิดพลาด", data.error);
      }
    } catch (err: any) {
      showError("เกิดข้อผิดพลาด", err.message);
    }
  };

  const handleReturnTool = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/assets/tool-assignments/${assignmentId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receivedCondition: "GOOD" }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("คืนเครื่องมือสำเร็จ", "ปรับสถานะทรัพย์สินเป็นพร้อมใช้งาน (AVAILABLE)");
        fetchAssets();
      } else {
        showError("เกิดข้อผิดพลาด", data.error);
      }
    } catch (err: any) {
      showError("เกิดข้อผิดพลาด", err.message);
    }
  };

  const filteredAssets = assets.filter((ast) => {
    const matchCat = categoryFilter === "ALL" || ast.category === categoryFilter;
    const matchSearch =
      ast.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ast.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ast.serialNo && ast.serialNo.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const availableCount = assets.filter((a) => a.status === "AVAILABLE").length;
  const inUseCount = assets.filter((a) => a.status === "IN_USE").length;
  const maintenanceCount = assets.filter((a) => a.status === "MAINTENANCE" || a.status === "DAMAGED").length;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-teal-500/20">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  เครื่องมือและทรัพย์สิน (Tools & Asset Operations)
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  SmartJeff Phase 16 — ทะเบียนทรัพย์สิน การยืม-คืนเครื่องมือ ตรวจสภาพ และสแกน QR Code ประจำอุปกรณ์
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAssetModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-teal-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              ลงทะเบียนทรัพย์สินใหม่
            </button>
            <button
              onClick={fetchAssets}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  ทรัพย์สินทั้งหมด (Total Assets)
                </p>
                <h3 className="text-3xl font-bold text-slate-100 mt-2">{assets.length}</h3>
                <p className="text-xs text-slate-400 mt-1">เครื่องมือและอุปกรณ์ประจำระบบ</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  พร้อมใช้งาน (Available)
                </p>
                <h3 className="text-3xl font-bold text-emerald-400 mt-2">{availableCount}</h3>
                <p className="text-xs text-slate-400 mt-1">อยู่ในคลังพร้อมส่งมอบ</p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  กำลังใช้งาน (In Use)
                </p>
                <h3 className="text-3xl font-bold text-blue-400 mt-2">{inUseCount}</h3>
                <p className="text-xs text-slate-400 mt-1">พนักงานหรือไซต์กำลังครอบครอง</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  ซ่อมบำรุง / ชำรุด (Maintenance)
                </p>
                <h3 className="text-3xl font-bold text-rose-400 mt-2">{maintenanceCount}</h3>
                <p className="text-xs text-rose-400/80 mt-1">รอการตรวจสอบหรือส่งซ่อม</p>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Asset Table */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="ค้นหารหัสทรัพย์สิน, ชื่อเครื่องมือ, Serial No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300"
              >
                <option value="ALL">ทุกหมวดหมู่</option>
                <option value="POWER_TOOL">POWER_TOOL</option>
                <option value="HAND_TOOL">HAND_TOOL</option>
                <option value="HEAVY_EQUIPMENT">HEAVY_EQUIPMENT</option>
                <option value="SAFETY">SAFETY</option>
                <option value="IT_HARDWARE">IT_HARDWARE</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 bg-slate-950/60 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">รหัสทรัพย์สิน</th>
                  <th className="px-6 py-4">ชื่ออุปกรณ์ / Serial No</th>
                  <th className="px-6 py-4">หมวดหมู่</th>
                  <th className="px-6 py-4">ผู้ครอบครอง / สถานะการยืม</th>
                  <th className="px-6 py-4">สถานะ</th>
                  <th className="px-6 py-4 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      ไม่พบรายการทรัพย์สิน
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((ast) => {
                    const activeAssignment = ast.toolAssignments?.[0];
                    return (
                      <tr key={ast.id} className="hover:bg-slate-800/30 transition-all">
                        <td className="px-6 py-4 font-mono font-bold text-teal-400">
                          {ast.assetCode}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-200">{ast.name}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            SN: {ast.serialNo || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {ast.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {activeAssignment ? (
                            <div>
                              <span className="text-slate-200 font-medium">
                                {activeAssignment.employee?.firstName} {activeAssignment.employee?.lastName}
                              </span>
                              <div className="text-xs text-amber-400">
                                กำหนดคืน:{" "}
                                {activeAssignment.expectedReturnAt
                                  ? new Date(activeAssignment.expectedReturnAt).toLocaleDateString("th-TH")
                                  : "-"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 text-xs rounded-full border font-medium ${
                              ast.status === "AVAILABLE"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : ast.status === "IN_USE"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}
                          >
                            {ast.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {ast.status === "AVAILABLE" ? (
                            <button
                              onClick={() => {
                                setSelectedAsset(ast);
                                setShowAssignModal(true);
                              }}
                              className="px-3 py-1.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 border border-teal-500/30 rounded-lg text-xs font-medium transition-all"
                            >
                              ยืมเครื่องมือ
                            </button>
                          ) : activeAssignment ? (
                            <button
                              onClick={() => handleReturnTool(activeAssignment.id)}
                              className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium transition-all"
                            >
                              คืนเครื่องมือ
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">ลงทะเบียนทรัพย์สินและเครื่องมือใหม่</h3>
            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">รหัสทรัพย์สิน (Asset Code)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น AST-TOOL-001"
                    value={newAsset.assetCode}
                    onChange={(e) => setNewAsset({ ...newAsset, assetCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">หมวดหมู่</label>
                  <select
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  >
                    <option value="POWER_TOOL">POWER_TOOL (เครื่องมือไฟฟ้า)</option>
                    <option value="HAND_TOOL">HAND_TOOL (เครื่องมือช่าง)</option>
                    <option value="HEAVY_EQUIPMENT">HEAVY_EQUIPMENT (เครื่องจักรกล)</option>
                    <option value="SAFETY">SAFETY (อุปกรณ์ความปลอดภัย)</option>
                    <option value="IT_HARDWARE">IT_HARDWARE (อุปกรณ์ IT)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">ชื่อเครื่องมือ / อุปกรณ์</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สว่านโรตารี่ Bosch GBH 2-26, กล้องระดับ Sokkia"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Serial Number</label>
                  <input
                    type="text"
                    placeholder="SN-98213812"
                    value={newAsset.serialNo}
                    onChange={(e) => setNewAsset({ ...newAsset, serialNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">ราคาจัดซื้อ (฿)</label>
                  <input
                    type="number"
                    value={newAsset.purchaseCost}
                    onChange={(e) => setNewAsset({ ...newAsset, purchaseCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm bg-teal-600 hover:bg-teal-500 text-white font-medium"
                >
                  บันทึกทรัพย์สิน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Tool Modal */}
      {showAssignModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold mb-1">ยืมเครื่องมือประจำไซต์</h3>
            <p className="text-xs text-slate-400 mb-4">
              {selectedAsset.assetCode} - {selectedAsset.name}
            </p>

            <form onSubmit={handleAssignTool} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">รหัสพนักงานผู้ขอยืม (Employee ID)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น รหัสพนักงาน หรือ ID"
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">กำหนดส่งคืน</label>
                <input
                  type="date"
                  required
                  value={assignForm.expectedReturnAt}
                  onChange={(e) => setAssignForm({ ...assignForm, expectedReturnAt: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">ผู้ส่งมอบ</label>
                <input
                  type="text"
                  required
                  value={assignForm.issuedBy}
                  onChange={(e) => setAssignForm({ ...assignForm, issuedBy: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm bg-teal-600 hover:bg-teal-500 text-white font-medium"
                >
                  ยืนยันการยืม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
