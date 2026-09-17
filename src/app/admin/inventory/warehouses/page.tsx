"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  Warehouse,
  Plus,
  Building,
  MapPin,
  Package,
  Activity,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { showSuccess, showError } from "@/lib/swal";

export default function WarehousesAdminPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "CENTRAL",
    location: "",
    status: "ACTIVE",
  });

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/warehouses");
      const data = await res.json();
      if (data.success) setWarehouses(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("สร้างคลังสินค้าสำเร็จ", `รหัสคลัง: ${data.data.code}`);
        setShowModal(false);
        fetchWarehouses();
      } else {
        showError("เกิดข้อผิดพลาด", data.error);
      }
    } catch (err: any) {
      showError("เกิดข้อผิดพลาด", err.message);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/admin/inventory"
              className="inline-flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับหน้าภาพรวมคลังสินค้า
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
              <Warehouse className="w-8 h-8 text-orange-500" />
              จัดการคลังสินค้า (Warehouse Management)
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              บริหารคลังส่วนกลาง (Central), คลังหน้าไซต์ (Site), และคลังชั่วคราว (Temporary/Vehicle)
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-orange-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            เพิ่มคลังสินค้าใหม่
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{wh.name}</h3>
                    <p className="text-xs font-mono text-orange-400 mt-0.5">{wh.code}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    {wh.type}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-400 mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span>{wh.location || "ไม่ได้ระบุสถานที่ตั้ง"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-500" />
                    <span>{wh.site?.name || "คลังสินค้าส่วนกลาง"}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">จำนวน SKU</span>
                  <span className="text-base font-bold text-slate-200">
                    {wh._count?.balances || 0} รายการ
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">ประวัติการเคลื่อนไหว</span>
                  <span className="text-base font-bold text-slate-200">
                    {wh._count?.movements || 0} ครั้ง
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">สร้างคลังสินค้าใหม่</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">รหัสคลัง (Warehouse Code)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น WH-CENTRAL, WH-SITE-A"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">ชื่อคลังสินค้า</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น คลังพัสดุหลักระยอง"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">ประเภทคลัง</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                >
                  <option value="CENTRAL">CENTRAL (คลังส่วนกลาง)</option>
                  <option value="SITE">SITE (คลังหน้างาน)</option>
                  <option value="TEMPORARY">TEMPORARY (คลังชั่วคราว)</option>
                  <option value="VEHICLE">VEHICLE (คลังติดยานพาหนะ)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">สถานที่ตั้ง / หมายเหตุ</label>
                <input
                  type="text"
                  placeholder="นิคมฯ มาบตาพุด จ.ระยอง"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm bg-orange-600 hover:bg-orange-500 text-white font-medium"
                >
                  บันทึกคลัง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
