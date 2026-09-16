"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  MapPin,
  Clock,
  Radio,
  Edit,
  Trash2,
  Users,
  CheckCircle,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showConfirm } from "@/lib/swal";
import { SiteQRCodeModal } from "@/components/qr/SiteQRCodeModal";

interface Site {
  id: string;
  code: string;
  name: string;
  location: string | null;
  lat: number | null;
  lng: number | null;
  radius: number;
  workStart: number;
  workEnd: number;
  _count?: { employees: number };
}

export default function AdminSitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [selectedQrSite, setSelectedQrSite] = useState<Site | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: "",
    name: "",
    location: "",
    lat: "12.6800",
    lng: "101.1700",
    radius: "200",
    workStart: "7",
    workEnd: "16",
  });

  const fetchSites = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sites");
      const data = await res.json();
      if (res.ok) {
        setSites(data.sites || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleOpenModal = (site?: Site) => {
    if (site) {
      setEditingSite(site);
      setForm({
        code: site.code,
        name: site.name,
        location: site.location || "",
        lat: site.lat ? site.lat.toString() : "12.6800",
        lng: site.lng ? site.lng.toString() : "101.1700",
        radius: site.radius.toString(),
        workStart: site.workStart.toString(),
        workEnd: site.workEnd.toString(),
      });
    } else {
      setEditingSite(null);
      setForm({
        code: `SITE-${Math.floor(10 + Math.random() * 90)}`,
        name: "",
        location: "",
        lat: "12.6800",
        lng: "101.1700",
        radius: "200",
        workStart: "7",
        workEnd: "16",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingSite ? `/api/sites/${editingSite.id}` : "/api/sites";
      const method = editingSite ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowModal(false);
        showSuccess(editingSite ? "แก้ไขไซต์งานสำเร็จ!" : "เพิ่มไซต์งานใหม่สำเร็จ!", "อัปเดตพิกัดและข้อมูล Geofence เรียบร้อยแล้ว");
        fetchSites();
      } else {
        showError("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลไซต์งานได้");
      }
    } catch (e) {
      showError("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await showConfirm(
      "ยืนยันการลบไซต์งาน",
      "คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลไซต์งานนี้ออกจากระบบ?",
      "ลบไซต์งาน",
      "ยกเลิก"
    );

    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/sites/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("ลบเรียบร้อย!", "ลบข้อมูลไซต์งานสำเร็จแล้ว");
        fetchSites();
      } else {
        showError("เกิดข้อผิดพลาด", "ไม่สามารถลบไซต์งานได้");
      }
    } catch (e) {
      showError("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-teal-300 text-xs font-semibold uppercase tracking-widest">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Geofence & Site Management</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">จัดการโรงงาน & นิคมอุตสาหกรรม</h1>
          <p className="text-sm text-teal-100">
            ตั้งค่าพิกัด GPS, รัศมี Geofence และกำหนดเวลาเข้า-ออกงานมาตรฐานของแต่ละพื้นที่
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center space-x-2 bg-white text-teal-900 font-bold px-5 py-3 rounded-2xl hover:bg-teal-50 shadow-md transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 text-teal-700" />
          <span>+ เพิ่มไซต์งานใหม่</span>
        </button>
      </div>

      {/* Sites Grid List */}
      {loading ? (
        <div className="py-16 text-center text-content-muted animate-pulse">
          กำลังโหลดข้อมูลไซต์งานและ Geofence...
        </div>
      ) : sites.length === 0 ? (
        <div className="bg-surface-card border border-surface-border rounded-3xl p-12 text-center space-y-2">
          <Building2 className="w-12 h-12 mx-auto text-content-muted/40" />
          <p className="font-bold text-sm text-content-primary">ยังไม่มีข้อมูลไซต์งานในระบบ</p>
          <p className="text-xs text-content-muted">กดปุ่ม "+ เพิ่มไซต์งานใหม่" เพื่อสร้างพิกัด Geofence แรก</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sites.map((site) => (
            <div
              key={site.id}
              className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-start justify-between border-b border-surface-border pb-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                    {site.code}
                  </span>
                  <h3 className="font-bold text-content-primary text-base">{site.name}</h3>
                  <p className="text-xs text-content-muted">{site.location || "นิคมอุตสาหกรรมระยอง"}</p>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setSelectedQrSite(site)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 rounded-xl text-xs font-bold transition-all shadow-sm"
                    title="สร้างป้าย QR Code พิมพ์ติดหน้างาน"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR Code</span>
                  </button>
                  <button
                    onClick={() => handleOpenModal(site)}
                    className="p-1.5 hover:bg-surface-subtle text-content-secondary hover:text-brand-600 rounded-xl"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(site.id)}
                    className="p-1.5 hover:bg-rose-50 text-content-secondary hover:text-rose-600 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Site Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-surface-subtle p-3 rounded-2xl border border-surface-border/60 space-y-1">
                  <span className="text-content-muted flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    พิกัด GPS Geofence
                  </span>
                  <p className="font-mono font-bold text-content-primary">
                    {site.lat?.toFixed(4)}, {site.lng?.toFixed(4)}
                  </p>
                  <span className="inline-block text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    รัศมี {site.radius} เมตร
                  </span>
                </div>

                <div className="bg-surface-subtle p-3 rounded-2xl border border-surface-border/60 space-y-1">
                  <span className="text-content-muted flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-brand-600" />
                    เวลาปฏิบัติงาน
                  </span>
                  <p className="font-bold text-content-primary">
                    {site.workStart}:00 น. - {site.workEnd}:00 น.
                  </p>
                  <span className="inline-block text-[10px] text-content-muted">เข้าสายหลัง {site.workStart}:00 น.</span>
                </div>
              </div>

              {/* Employee Count Footer */}
              <div className="flex items-center justify-between pt-2 text-xs font-semibold text-content-secondary">
                <span className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-brand-600" />
                  <span>พนักงานในไซต์นี้:</span>
                </span>
                <span className="text-brand-700 font-bold bg-brand-50 px-3 py-1 rounded-full">
                  {site._count?.employees || 0} คน
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Site Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-lg font-bold text-content-primary">
                {editingSite ? "แก้ไขไซต์งาน & Geofence" : "เพิ่มไซต์งานใหม่"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-content-muted hover:text-content-primary font-bold text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-content-secondary mb-1">รหัสไซต์งาน</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-content-secondary mb-1">ชื่อโรงงาน / นิคมอุตสาหกรรม</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น โรงงาน AAM นิคมฯ มาบตาพุด"
                  className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-content-secondary mb-1">ละติจูด (Latitude)</label>
                  <input
                    type="text"
                    value={form.lat}
                    onChange={(e) => setForm({ ...form, lat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg font-mono text-content-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">ลองจิจูด (Longitude)</label>
                  <input
                    type="text"
                    value={form.lng}
                    onChange={(e) => setForm({ ...form, lng: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg font-mono text-content-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-content-secondary mb-1">รัศมี (เมตร)</label>
                  <input
                    type="number"
                    value={form.radius}
                    onChange={(e) => setForm({ ...form, radius: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">เวลาเข้างาน</label>
                  <input
                    type="number"
                    value={form.workStart}
                    onChange={(e) => setForm({ ...form, workStart: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">เวลาออกงาน</label>
                  <input
                    type="number"
                    value={form.workEnd}
                    onChange={(e) => setForm({ ...form, workEnd: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-content-secondary hover:bg-surface-subtle"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-teal-700 text-white font-bold hover:bg-teal-800 shadow-md disabled:opacity-50"
                >
                  {submitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Site QR Code Modal */}
      {selectedQrSite && (
        <SiteQRCodeModal
          site={selectedQrSite}
          onClose={() => setSelectedQrSite(null)}
        />
      )}
    </div>
  );
}
