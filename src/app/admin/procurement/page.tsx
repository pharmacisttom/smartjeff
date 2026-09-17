"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  ShoppingCart,
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  DollarSign,
  Send,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { showSuccess, showError } from "@/lib/swal";

export default function ProcurementDashboardPage() {
  const [activeTab, setActiveTab] = useState<"PR" | "PO" | "SUPPLIERS">("PR");
  const [prs, setPrs] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierMetrics, setSupplierMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPrModal, setShowPrModal] = useState(false);
  const [showPoModal, setShowPoModal] = useState(false);

  const [newPr, setNewPr] = useState({
    requesterId: "หัวหน้าฝ่ายช่าง",
    projectId: "",
    requiredDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    priority: "NORMAL",
    reason: "จัดหาพัสดุสำหรับโครงการ",
    description: "",
    quantity: 1,
    estimatedUnitPrice: 500,
  });

  const [newPo, setNewPo] = useState({
    supplierId: "",
    projectId: "",
    expectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    description: "",
    quantity: 1,
    unitPrice: 500,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prRes, poRes, supRes, supMetRes] = await Promise.all([
        fetch("/api/procurement/purchase-requests"),
        fetch("/api/procurement/purchase-orders"),
        fetch("/api/procurement/suppliers"),
        fetch("/api/procurement/suppliers?metrics=true"),
      ]);

      const [prData, poData, supData, supMetData] = await Promise.all([
        prRes.json(),
        poRes.json(),
        supRes.json(),
        supMetRes.json(),
      ]);

      if (prData.success) setPrs(prData.data);
      if (poData.success) setPos(poData.data);
      if (supData.success) setSuppliers(supData.data);
      if (supMetData.success) setSupplierMetrics(supMetData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprovePR = async (prId: string) => {
    try {
      const res = await fetch(`/api/procurement/purchase-requests/${prId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: "ผู้จัดการโครงการ", status: "APPROVED" }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("อนุมัติ PR เรียบร้อย", "พร้อมสำหรับการเปิด RFQ หรือออก PO");
        fetchData();
      } else {
        showError("เกิดข้อผิดพลาด", data.error);
      }
    } catch (err: any) {
      showError("เกิดข้อผิดพลาด", err.message);
    }
  };

  const handleApprovePO = async (poId: string) => {
    try {
      const res = await fetch(`/api/procurement/purchase-orders/${poId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: "ผู้อำนวยการจัดซื้อ" }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("อนุมัติ PO เรียบร้อย", "บันทึกภาระผูกพันต้นทุน (Committed Cost) เข้าโครงการแล้ว");
        fetchData();
      } else {
        showError("เกิดข้อผิดพลาด", data.error);
      }
    } catch (err: any) {
      showError("เกิดข้อผิดพลาด", err.message);
    }
  };

  const handleCreatePR = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/procurement/purchase-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: newPr.requesterId,
          projectId: newPr.projectId || undefined,
          requiredDate: new Date(newPr.requiredDate),
          priority: newPr.priority,
          reason: newPr.reason,
          items: [
            {
              description: newPr.description,
              quantity: Number(newPr.quantity),
              estimatedUnitPrice: Number(newPr.estimatedUnitPrice),
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("ส่งใบขอซื้อ (PR) เรียบร้อย", `เลขที่: ${data.data.prNo}`);
        setShowPrModal(false);
        fetchData();
      } else {
        showError("เกิดข้อผิดพลาด", data.error);
      }
    } catch (err: any) {
      showError("เกิดข้อผิดพลาด", err.message);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const subtotal = Number(newPo.quantity) * Number(newPo.unitPrice);
      const tax = Math.round(subtotal * 0.07 * 100) / 100;
      const total = subtotal + tax;

      const res = await fetch("/api/procurement/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: newPo.supplierId || suppliers[0]?.id,
          projectId: newPo.projectId || undefined,
          expectedDeliveryDate: new Date(newPo.expectedDeliveryDate),
          subtotal,
          tax,
          total,
          createdBy: "เจ้าหน้าที่จัดซื้อ",
          items: [
            {
              description: newPo.description,
              quantity: Number(newPo.quantity),
              unitPrice: Number(newPo.unitPrice),
              tax,
              total,
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("สร้างใบสั่งซื้อ (PO) เรียบร้อย", `เลขที่: ${data.data.poNo}`);
        setShowPoModal(false);
        fetchData();
      } else {
        showError("เกิดข้อผิดพลาด", data.error);
      }
    } catch (err: any) {
      showError("เกิดข้อผิดพลาด", err.message);
    }
  };

  const pendingPrCount = prs.filter((p) => p.status === "SUBMITTED" || p.status === "UNDER_REVIEW").length;
  const openPoCount = pos.filter((p) => p.status !== "CLOSED" && p.status !== "CANCELLED").length;
  const totalPoValue = pos.reduce((sum, p) => sum + (p.total || 0), 0);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  ระบบบริหารงานจัดซื้อ (Procurement Operations)
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  SmartJeff Phase 16 — ใบขอซื้อ (PR), ใบสั่งซื้อ (PO), ประเมินผู้จำหน่าย และผูก Committed Cost เข้าโครงการ
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPrModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium transition-all"
            >
              <FileText className="w-4 h-4" />
              สร้างใบขอซื้อ (PR)
            </button>
            <button
              onClick={() => setShowPoModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              เปิดใบสั่งซื้อ (PO)
            </button>
            <button
              onClick={fetchData}
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
                  ใบขอซื้อรออนุมัติ (Pending PR)
                </p>
                <h3 className="text-3xl font-bold text-amber-400 mt-2">{pendingPrCount}</h3>
                <p className="text-xs text-slate-400 mt-1">จากทั้งหมด {prs.length} ใบขอซื้อ</p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  ใบสั่งซื้อเปิดอยู่ (Open POs)
                </p>
                <h3 className="text-3xl font-bold text-blue-400 mt-2">{openPoCount}</h3>
                <p className="text-xs text-slate-400 mt-1">รอส่งมอบ / กำลังตรวจรับ</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  มูลค่า PO สะสม (Committed)
                </p>
                <h3 className="text-3xl font-bold text-emerald-400 mt-2">
                  ฿{totalPoValue.toLocaleString()}
                </h3>
                <p className="text-xs text-slate-400 mt-1">ภาระผูกพันต้นทุนจัดซื้อ</p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  ส่งมอบตรงเวลา (On-time Delivery)
                </p>
                <h3 className="text-3xl font-bold text-indigo-400 mt-2">
                  {supplierMetrics?.onTimeRate ?? 100}%
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  ล่าช้าเฉลี่ย: {supplierMetrics?.avgDelayDays ?? 0} วัน
                </p>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                <Truck className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab("PR")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "PR"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            ใบขอซื้อ (Purchase Requests) ({prs.length})
          </button>
          <button
            onClick={() => setActiveTab("PO")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "PO"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            ใบสั่งซื้อ (Purchase Orders) ({pos.length})
          </button>
          <button
            onClick={() => setActiveTab("SUPPLIERS")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "SUPPLIERS"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            ทะเบียนผู้จำหน่าย (Suppliers) ({suppliers.length})
          </button>
        </div>

        {/* PR Content */}
        {activeTab === "PR" && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 bg-slate-950/60 uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">เลขที่ PR</th>
                    <th className="px-6 py-4">รายการสินค้า</th>
                    <th className="px-6 py-4">ผู้ขอซื้อ / เหตุผล</th>
                    <th className="px-6 py-4 text-right">จำนวน</th>
                    <th className="px-6 py-4 text-right">ยอดประเมิน</th>
                    <th className="px-6 py-4">สถานะ</th>
                    <th className="px-6 py-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {prs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        ไม่พบใบขอซื้อ
                      </td>
                    </tr>
                  ) : (
                    prs.map((pr) => (
                      <tr key={pr.id} className="hover:bg-slate-800/30 transition-all">
                        <td className="px-6 py-4 font-mono font-medium text-blue-400">{pr.prNo}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-200">
                            {pr.items?.[0]?.description || "รายการพัสดุ"}
                          </div>
                          <div className="text-xs text-slate-500">
                            กำหนดส่ง: {new Date(pr.requiredDate).toLocaleDateString("th-TH")}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-300">{pr.requesterId}</div>
                          <div className="text-xs text-slate-500">{pr.reason}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-200">
                          {pr.items?.[0]?.quantity || 0} {pr.items?.[0]?.unitName || "ชิ้น"}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-emerald-400">
                          ฿{(pr.items?.[0]?.estimatedTotal || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 text-xs rounded-full border font-medium ${
                              pr.status === "APPROVED"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : pr.status === "REJECTED"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {pr.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {pr.status === "SUBMITTED" && (
                            <button
                              onClick={() => handleApprovePR(pr.id)}
                              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium transition-all"
                            >
                              อนุมัติ PR
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PO Content */}
        {activeTab === "PO" && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 bg-slate-950/60 uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">เลขที่ PO</th>
                    <th className="px-6 py-4">ผู้จำหน่าย (Supplier)</th>
                    <th className="px-6 py-4">โครงการ</th>
                    <th className="px-6 py-4 text-right">ยอดรวมสุทธิ</th>
                    <th className="px-6 py-4">กำหนดส่งมอบ</th>
                    <th className="px-6 py-4">สถานะ</th>
                    <th className="px-6 py-4 text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        ไม่พบใบสั่งซื้อ
                      </td>
                    </tr>
                  ) : (
                    pos.map((po) => (
                      <tr key={po.id} className="hover:bg-slate-800/30 transition-all">
                        <td className="px-6 py-4 font-mono font-medium text-blue-400">{po.poNo}</td>
                        <td className="px-6 py-4 font-medium text-slate-200">
                          {po.supplier?.name || "ไม่ระบุผู้จำหน่าย"}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {po.project?.name || "ส่วนกลาง"}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                          ฿{(po.total || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(po.expectedDeliveryDate).toLocaleDateString("th-TH")}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 text-xs rounded-full border font-medium ${
                              po.status === "APPROVED" || po.status === "RECEIVED"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : po.status === "PENDING_APPROVAL"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}
                          >
                            {po.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {po.status === "PENDING_APPROVAL" && (
                            <button
                              onClick={() => handleApprovePO(po.id)}
                              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium transition-all"
                            >
                              อนุมัติ PO
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Suppliers Content */}
        {activeTab === "SUPPLIERS" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {suppliers.map((sup) => (
              <div
                key={sup.id}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-100">{sup.name}</h3>
                    <p className="text-xs font-mono text-blue-400">{sup.code}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    {sup.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800 pt-4">
                  <div className="flex justify-between">
                    <span>ผู้ติดต่อ:</span>
                    <span className="text-slate-200">{sup.contactName || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>เบอร์โทร:</span>
                    <span className="text-slate-200">{sup.phone || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>เงื่อนไขการชำระเงิน:</span>
                    <span className="text-slate-200">{sup.paymentTerms || "Credit 30 วัน"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>จำนวน PO ทั้งหมด:</span>
                    <span className="font-semibold text-blue-400">
                      {sup._count?.orders || 0} ใบสั่งซื้อ
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* PR Modal */}
      {showPrModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">สร้างใบขอซื้อ (Purchase Request)</h3>
            <form onSubmit={handleCreatePR} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">รายการพัสดุ / บริการที่ต้องการ</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ท่อเหล็กกัลวาไนซ์ 2 นิ้ว"
                  value={newPr.description}
                  onChange={(e) => setNewPr({ ...newPr, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">จำนวน</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPr.quantity}
                    onChange={(e) => setNewPr({ ...newPr, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">ราคาประมาณการ/หน่วย (฿)</label>
                  <input
                    type="number"
                    value={newPr.estimatedUnitPrice}
                    onChange={(e) => setNewPr({ ...newPr, estimatedUnitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">กำหนดวันที่ต้องใช้</label>
                  <input
                    type="date"
                    required
                    value={newPr.requiredDate}
                    onChange={(e) => setNewPr({ ...newPr, requiredDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">ระดับความเร่งด่วน</label>
                  <select
                    value={newPr.priority}
                    onChange={(e) => setNewPr({ ...newPr, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">เหตุผลและความจำเป็น</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ซ่อมบำรุงโครงสร้างอาคารไซต์ B"
                  value={newPr.reason}
                  onChange={(e) => setNewPr({ ...newPr, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPrModal(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium"
                >
                  ส่งใบขอซื้อ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO Modal */}
      {showPoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">เปิดใบสั่งซื้อใหม่ (Purchase Order)</h3>
            <form onSubmit={handleCreatePO} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">เลือกผู้จำหน่าย (Supplier)</label>
                <select
                  required
                  value={newPo.supplierId}
                  onChange={(e) => setNewPo({ ...newPo, supplierId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                >
                  <option value="">-- กรุณาเลือกผู้จำหน่าย --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">รายการสินค้า</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เหล็กเส้นกลม SR24 9มม."
                  value={newPo.description}
                  onChange={(e) => setNewPo({ ...newPo, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">จำนวน</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPo.quantity}
                    onChange={(e) => setNewPo({ ...newPo, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">ราคาต่อหน่วย (฿)</label>
                  <input
                    type="number"
                    required
                    value={newPo.unitPrice}
                    onChange={(e) => setNewPo({ ...newPo, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">กำหนดส่งมอบสินค้า</label>
                <input
                  type="date"
                  required
                  value={newPo.expectedDeliveryDate}
                  onChange={(e) => setNewPo({ ...newPo, expectedDeliveryDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPoModal(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium"
                >
                  ออกใบสั่งซื้อ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
