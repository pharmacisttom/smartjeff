"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  Package,
  Warehouse,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Boxes,
  DollarSign,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/swal";

export default function InventoryDashboardPage() {
  const [activeTab, setActiveTab] = useState<"ITEMS" | "WAREHOUSES" | "MOVEMENTS" | "COUNTS">("ITEMS");
  const [summary, setSummary] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [counts, setCounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // Form states
  const [newItem, setNewItem] = useState({
    code: "",
    name: "",
    categoryId: "",
    unitId: "",
    itemType: "MATERIAL",
    minimumStock: 5,
    reorderPoint: 10,
    standardCost: 100,
  });

  const [newIssue, setNewIssue] = useState({
    warehouseId: "",
    projectId: "",
    requestedBy: "โฟร์แมนหน้างาน",
    itemId: "",
    quantity: 1,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, itemsRes, whRes, movRes, countsRes] = await Promise.all([
        fetch("/api/inventory/stock?summary=true"),
        fetch("/api/inventory/items"),
        fetch("/api/inventory/warehouses"),
        fetch("/api/inventory/movements?limit=30"),
        fetch("/api/inventory/stock-counts"),
      ]);

      const [sumData, itemsData, whData, movData, countsData] = await Promise.all([
        sumRes.json(),
        itemsRes.json(),
        whRes.json(),
        movRes.json(),
        countsRes.json(),
      ]);

      if (sumData.success) setSummary(sumData.data);
      if (itemsData.success) setItems(itemsData.data);
      if (whData.success) setWarehouses(whData.data);
      if (movData.success) setMovements(movData.data);
      if (countsData.success) setCounts(countsData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create a default category and unit if needed
      const res = await fetch("/api/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newItem,
          categoryId: newItem.categoryId || "cat-default",
          unitId: newItem.unitId || "unit-pcs",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("สร้างสินค้าเรียบร้อย", `รหัสสินค้า: ${data.data.code}`);
        setShowItemModal(false);
        fetchData();
      } else {
        showError("เกิดข้อผิดพลาด", data.error);
      }
    } catch (err: any) {
      showError("เกิดข้อผิดพลาด", err.message);
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId: newIssue.warehouseId || warehouses[0]?.id,
          projectId: newIssue.projectId || "proj-default",
          requestedBy: newIssue.requestedBy,
          items: [
            {
              itemId: newIssue.itemId,
              requestedQty: Number(newIssue.quantity),
              issuedQty: Number(newIssue.quantity),
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("เบิกจ่ายสำเร็จ", `ตัดสต็อกและบันทึก Actual Cost เข้าโครงการแล้ว (${data.data.issueNo})`);
        setShowIssueModal(false);
        fetchData();
      } else {
        showError("เบิกจ่ายไม่สำเร็จ", data.error);
      }
    } catch (err: any) {
      showError("เกิดข้อผิดพลาด", err.message);
    }
  };

  const filteredItems = items.filter(
    (it) =>
      it.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-lg shadow-orange-500/20">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  ระบบคลังสินค้าและพัสดุ (Inventory Operations)
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  SmartJeff Phase 16 — บริหารยอดสต็อก บัญชีคุมพัสดุ (Stock Ledger) และตัดต้นทุนเข้าโครงการ
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowIssueModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-orange-500/25 transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              เบิกวัสดุเข้าโครงการ
            </button>
            <button
              onClick={() => setShowItemModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              เพิ่มสินค้าใหม่
            </button>
            <button
              onClick={fetchData}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  รายการสินค้าทั้งหมด (SKUs)
                </p>
                <h3 className="text-3xl font-bold text-white mt-2">
                  {summary?.totalSKUs ?? items.length}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  จำนวนชิ้นรวม: {(summary?.totalQuantity ?? 0).toLocaleString()} ชิ้น
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                <Package className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  มูลค่าสต็อกคงคลัง (Inventory Value)
                </p>
                <h3 className="text-3xl font-bold text-emerald-400 mt-2">
                  ฿{(summary?.totalInventoryValue ?? 0).toLocaleString()}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  ประเมินตาม Weighted Average Cost
                </p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  สินค้าใกล้หมด (Low Stock)
                </p>
                <h3 className="text-3xl font-bold text-amber-400 mt-2">
                  {summary?.lowStockCount ?? 0}
                </h3>
                <p className="text-xs text-amber-400/80 mt-1">
                  ต่ำกว่าเกณฑ์ Reorder Point
                </p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  สินค้าหมดคลัง (Out of Stock)
                </p>
                <h3 className="text-3xl font-bold text-rose-400 mt-2">
                  {summary?.outOfStockCount ?? 0}
                </h3>
                <p className="text-xs text-rose-400/80 mt-1">
                  พร้อมใช้เป็น 0 (ต้องการจัดซื้อด่วน)
                </p>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
                <Warehouse className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab("ITEMS")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "ITEMS"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            รายการสินค้าและยอดคงคลัง ({items.length})
          </button>
          <button
            onClick={() => setActiveTab("WAREHOUSES")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "WAREHOUSES"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            คลังสินค้า ({warehouses.length})
          </button>
          <button
            onClick={() => setActiveTab("MOVEMENTS")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "MOVEMENTS"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            ประวัติบัญชีคุมสต็อก (Stock Ledger)
          </button>
          <button
            onClick={() => setActiveTab("COUNTS")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "COUNTS"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            การตรวจนับสต็อก (Stock Count)
          </button>
        </div>

        {/* Tab Content: ITEMS */}
        {activeTab === "ITEMS" && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อสินค้า, รหัสสินค้า, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 bg-slate-950/60 uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">รหัสสินค้า</th>
                    <th className="px-6 py-4">ชื่อสินค้า</th>
                    <th className="px-6 py-4">ประเภท</th>
                    <th className="px-6 py-4 text-right">สต็อกคงเหลือ</th>
                    <th className="px-6 py-4 text-right">พร้อมใช้</th>
                    <th className="px-6 py-4 text-right">ต้นทุนเฉลี่ย</th>
                    <th className="px-6 py-4">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        ไม่พบรายการสินค้า
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const totalQty = item.balances?.reduce((sum: number, b: any) => sum + b.quantity, 0) || 0;
                      const availQty = item.balances?.reduce((sum: number, b: any) => sum + b.availableQuantity, 0) || 0;
                      const avgCost = item.balances?.[0]?.averageCost || item.standardCost;
                      const isLow = availQty <= item.reorderPoint && availQty > 0;
                      const isOut = availQty <= 0;

                      return (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition-all">
                          <td className="px-6 py-4 font-mono font-medium text-orange-400">{item.code}</td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-200">{item.name}</div>
                            {item.description && (
                              <div className="text-xs text-slate-500">{item.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {item.itemType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-slate-200">
                            {totalQty.toLocaleString()} {item.unit?.nameTh || "ชิ้น"}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-100">
                            {availQty.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-emerald-400">
                            ฿{avgCost.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            {isOut ? (
                              <span className="px-2.5 py-1 text-xs rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                                สินค้าหมด
                              </span>
                            ) : isLow ? (
                              <span className="px-2.5 py-1 text-xs rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                                ใกล้หมด
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                ปกติ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: WAREHOUSES */}
        {activeTab === "WAREHOUSES" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {warehouses.map((wh) => (
              <div
                key={wh.id}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      <Warehouse className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-100">{wh.name}</h3>
                      <p className="text-xs font-mono text-orange-400">{wh.code}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    {wh.type}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800 pt-4">
                  <div className="flex justify-between">
                    <span>จำนวน SKU ในคลัง:</span>
                    <span className="font-semibold text-slate-200">
                      {wh._count?.balances || 0} รายการ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>การเคลื่อนไหวสะสม:</span>
                    <span className="font-semibold text-slate-200">
                      {wh._count?.movements || 0} ครั้ง
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ไซต์งานที่ผูก:</span>
                    <span className="text-slate-300">{wh.site?.name || "คลังส่วนกลาง"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Content: MOVEMENTS */}
        {activeTab === "MOVEMENTS" && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-semibold text-slate-200 text-sm">
                บันทึกประวัติความเคลื่อนไหวสต็อก (Stock Movement Ledger)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 bg-slate-950/60 uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">วัน-เวลา</th>
                    <th className="px-6 py-4">คลัง</th>
                    <th className="px-6 py-4">สินค้า</th>
                    <th className="px-6 py-4">ประเภทการเคลื่อนไหว</th>
                    <th className="px-6 py-4 text-right">จำนวน</th>
                    <th className="px-6 py-4 text-right">ต้นทุน/หน่วย</th>
                    <th className="px-6 py-4 text-right">มูลค่ารวม</th>
                    <th className="px-6 py-4">เอกสารอ้างอิง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {movements.map((mov) => {
                    const isIncome = ["PURCHASE_RECEIPT", "RETURN", "TRANSFER_IN", "ADJUSTMENT_IN"].includes(mov.movementType);
                    return (
                      <tr key={mov.id} className="hover:bg-slate-800/30 transition-all">
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(mov.createdAt).toLocaleString("th-TH")}
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-sans">{mov.warehouse?.name}</td>
                        <td className="px-6 py-4 font-sans font-medium text-slate-200">
                          {mov.item?.name} ({mov.item?.code})
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full font-medium ${
                              isIncome
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {mov.movementType}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${isIncome ? "text-emerald-400" : "text-rose-400"}`}>
                          {isIncome ? `+${mov.quantity}` : `-${mov.quantity}`}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-300">฿{mov.unitCost}</td>
                        <td className="px-6 py-4 text-right text-slate-100 font-semibold">฿{mov.totalCost}</td>
                        <td className="px-6 py-4 text-slate-400 font-sans">
                          {mov.referenceType}: {mov.referenceId}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: COUNTS */}
        {activeTab === "COUNTS" && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-lg text-slate-100">รายการตรวจนับสินค้า (Physical Stock Count)</h3>
                <p className="text-xs text-slate-400">ตรวจนับสต็อกจริงและปรับปรุงผลต่าง (Variance) ผ่านการอนุมัติ</p>
              </div>
            </div>

            <div className="space-y-4">
              {counts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  ยังไม่มีประวัติการตรวจนับสต็อก
                </div>
              ) : (
                counts.map((sc) => (
                  <div
                    key={sc.id}
                    className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-orange-400">{sc.countNo}</span>
                        <span className="px-2.5 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300">
                          {sc.countType}
                        </span>
                        <span className="px-2.5 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {sc.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        คลัง: {sc.warehouse?.name} | ผู้ตรวจนับ: {sc.countedBy} | วันที่:{" "}
                        {new Date(sc.countedDate).toLocaleDateString("th-TH")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">เพิ่มสินค้าใหม่เข้า Item Master</h3>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">รหัสสินค้า (Code)</label>
                  <input
                    type="text"
                    required
                    placeholder="MAT-CON-001"
                    value={newItem.code}
                    onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">ประเภทสินค้า</label>
                  <select
                    value={newItem.itemType}
                    onChange={(e) => setNewItem({ ...newItem, itemType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  >
                    <option value="MATERIAL">MATERIAL</option>
                    <option value="CONSUMABLE">CONSUMABLE</option>
                    <option value="TOOL">TOOL</option>
                    <option value="EQUIPMENT">EQUIPMENT</option>
                    <option value="SPARE_PART">SPARE_PART</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">ชื่อสินค้า (Name)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ปูนซีเมนต์ปอร์ตแลนด์, สายไฟ THW 2.5"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Min Stock</label>
                  <input
                    type="number"
                    value={newItem.minimumStock}
                    onChange={(e) => setNewItem({ ...newItem, minimumStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Reorder Point</label>
                  <input
                    type="number"
                    value={newItem.reorderPoint}
                    onChange={(e) => setNewItem({ ...newItem, reorderPoint: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">ราคากลาง (฿)</label>
                  <input
                    type="number"
                    value={newItem.standardCost}
                    onChange={(e) => setNewItem({ ...newItem, standardCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm bg-orange-600 hover:bg-orange-500 text-white font-medium"
                >
                  บันทึกสินค้า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Material Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">เบิกวัสดุเข้าโครงการ (Material Issue)</h3>
            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">เลือกสินค้า</label>
                <select
                  required
                  value={newIssue.itemId}
                  onChange={(e) => setNewIssue({ ...newIssue, itemId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                >
                  <option value="">-- กรุณาเลือกสินค้า --</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.code} - {it.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">จำนวนที่เบิก</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newIssue.quantity}
                    onChange={(e) => setNewIssue({ ...newIssue, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">ผู้ขอเบิก</label>
                  <input
                    type="text"
                    required
                    value={newIssue.requestedBy}
                    onChange={(e) => setNewIssue({ ...newIssue, requestedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                เมื่อเบิกจ่าย ระบบจะตัดสต็อกคงเหลือ และบันทึกต้นทุนวัสดุเข้า Project Costing (Actual Material Cost) โดยอัตโนมัติ
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm bg-orange-600 hover:bg-orange-500 text-white font-medium"
                >
                  ยืนยันการเบิกจ่าย
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
