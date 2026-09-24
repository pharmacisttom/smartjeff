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
  Search,
  Phone,
  Mail,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showConfirm } from "@/lib/swal";
import { SiteQRCodeModal } from "@/components/qr/SiteQRCodeModal";

interface Site {
  id: string;
  code: string;
  name: string;
  location: string | null;
  estateName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  lat: number | null;
  lng: number | null;
  radius: number;
  workStart: number;
  workEnd: number;
  otStart?: number | null;
  otEnd?: number | null;
  _count?: { employees: number };
}

export default function AdminSitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [selectedQrSite, setSelectedQrSite] = useState<Site | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEstate, setSelectedEstate] = useState("ALL");

  const [form, setForm] = useState({
    code: "",
    name: "",
    location: "",
    estateName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    lat: "12.6841",
    lng: "101.1476",
    radius: "200",
    workStart: "7",
    workEnd: "16",
    otStart: "16",
    otEnd: "17",
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
        estateName: site.estateName || "",
        contactName: site.contactName || "",
        contactEmail: site.contactEmail || "",
        contactPhone: site.contactPhone || "",
        lat: site.lat ? site.lat.toString() : "12.6841",
        lng: site.lng ? site.lng.toString() : "101.1476",
        radius: site.radius.toString(),
        workStart: site.workStart.toString(),
        workEnd: site.workEnd.toString(),
        otStart: site.otStart ? site.otStart.toString() : "16",
        otEnd: site.otEnd ? site.otEnd.toString() : "17",
      });
    } else {
      setEditingSite(null);
      setForm({
        code: `SITE-${Math.floor(10 + Math.random() * 90)}`,
        name: "",
        location: "",
        estateName: "นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (ระยอง)",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        lat: "12.6841",
        lng: "101.1476",
        radius: "200",
        workStart: "7",
        workEnd: "16",
        otStart: "16",
        otEnd: "17",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const url = editingSite ? `/api/sites/${editingSite.id}` : "/api/sites";
      const method = editingSite ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        showSuccess("บันทึกสำเร็จ!", data.message || "บันทึกข้อมูลโรงงาน/นิคมฯ เรียบร้อยแล้ว");
        setShowModal(false);
        fetchSites();
      } else {
        showError("เกิดข้อผิดพลาด", data.message || "ไม่สามารถบันทึกข้อมูลได้");
      }
    } catch (e) {
      showError("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      "ยืนยันการลบไซต์งาน",
      "คุณต้องการลบข้อมูลโรงงานนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้",
      "ลบข้อมูล",
      "ยกเลิก"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/sites/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        showSuccess("ลบสำเร็จ", "ลบไซต์งานออกจากระบบเรียบร้อยแล้ว");
        fetchSites();
      } else {
        showError("ไม่สามารถลบได้", data.message || "เกิดข้อผิดพลาด");
      }
    } catch (e) {
      showError("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  // Distinct Estates
  const distinctEstates = Array.from(
    new Set(sites.map((s) => s.estateName).filter(Boolean))
  ) as string[];

  // Filtered Sites
  const filteredSites = sites.filter((s) => {
    const name = s.name.toLowerCase();
    const code = s.code.toLowerCase();
    const contact = (s.contactName || "").toLowerCase();
    const estate = (s.estateName || "").toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesQuery = name.includes(q) || code.includes(q) || contact.includes(q) || estate.includes(q);
    const matchesEstate = selectedEstate === "ALL" || s.estateName === selectedEstate;

    return matchesQuery && matchesEstate;
  });

  const formatHours = (h?: number | null) => {
    if (h === undefined || h === null) return "-";
    const str = h.toFixed(2);
    if (str.endsWith(".30")) return `${Math.floor(h)}:30 น.`;
    return `${Math.floor(h)}:00 น.`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-teal-300 text-xs font-semibold uppercase tracking-widest">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Customer Sites & Shift Schedule (J2K)</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">จัดการโรงงานลูกค้า & ตารางเวลาเข้า-ออก</h1>
          <p className="text-sm text-teal-100">
            ระบบฐานข้อมูลโรงงานคู่ค้า {sites.length} แห่ง ผู้ประสานงานลูกค้า และตารางเวลาเข้า-ออกงาน / กะโอที
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center space-x-2 bg-white text-teal-900 font-bold px-5 py-3 rounded-2xl hover:bg-teal-50 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5 text-teal-700" />
          <span>+ เพิ่มโรงงานลูกค้าใหม่</span>
        </button>
      </div>

      {/* Control Bar: Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-card border border-surface-border p-4 rounded-3xl shadow-sm">
        {/* Search */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-bold text-content-secondary flex items-center gap-1">
            <Search className="w-3.5 h-3.5 text-brand-600" />
            ค้นหาชื่อโรงงาน, รหัสตัวย่อ, หรือชื่อลูกค้าผู้ติดต่อ
          </label>
          <input
            type="text"
            placeholder="ค้นหา เช่น AAM, NIKKO, Misumi, คุณแวว, นิคมอมตะ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none focus:border-brand-500"
          />
        </div>

        {/* Estate Filter */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-content-secondary flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-brand-600" />
            กรองตามนิคมอุตสาหกรรม
          </label>
          <select
            value={selectedEstate}
            onChange={(e) => setSelectedEstate(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-surface-bg text-content-primary font-bold outline-none focus:border-brand-500"
          >
            <option value="ALL">ทุกนิคมอุตสาหกรรม ({sites.length} ไซต์)</option>
            {distinctEstates.map((est) => (
              <option key={est} value={est}>
                {est}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sites Grid List */}
      {loading ? (
        <div className="py-16 text-center text-content-muted animate-pulse">
          กำลังโหลดข้อมูลไซต์งานและข้อมูลลูกค้า...
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="bg-surface-card border border-surface-border rounded-3xl p-12 text-center space-y-2">
          <Building2 className="w-12 h-12 mx-auto text-content-muted/40" />
          <p className="font-bold text-sm text-content-primary">ไม่พบข้อมูลโรงงานที่ตรงกับการค้นหา</p>
          <p className="text-xs text-content-muted">ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองนิคมฯ อื่น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              {/* Site Header */}
              <div className="flex items-start justify-between border-b border-surface-border pb-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded-md">
                    CODE: {site.code}
                  </span>
                  <h3 className="font-bold text-content-primary text-base leading-snug">{site.name}</h3>
                  <p className="text-xs text-content-muted font-medium">
                    {site.estateName || site.location || "นิคมอุตสาหกรรมในจังหวัดระยอง/ชลบุรี"}
                  </p>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setSelectedQrSite(site)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    title="สร้างป้าย QR Code พิมพ์ติดหน้างาน"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR</span>
                  </button>
                  <button
                    onClick={() => handleOpenModal(site)}
                    className="p-1.5 hover:bg-surface-subtle text-content-secondary hover:text-brand-600 rounded-xl cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(site.id)}
                    className="p-1.5 hover:bg-rose-50 text-content-secondary hover:text-rose-600 rounded-xl cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Customer Contact Card (From Customer Sheet) */}
              <div className="bg-surface-subtle/50 p-3 rounded-2xl border border-surface-border/60 text-xs space-y-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block">
                  👤 ผู้ติดต่อลูกค้า (Customer Contact)
                </span>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-content-primary font-bold">{site.contactName || "ฝ่ายบุคคล / ผู้ว่าจ้าง"}</span>
                  {site.contactPhone && (
                    <span className="flex items-center gap-1 text-brand-600 font-mono">
                      <Phone className="w-3 h-3" />
                      {site.contactPhone}
                    </span>
                  )}
                </div>
                {site.contactEmail && (
                  <p className="flex items-center gap-1 text-content-muted text-[11px] font-mono">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {site.contactEmail}
                  </p>
                )}
              </div>

              {/* Shift Hours & Geofence Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Standard Shift */}
                <div className="bg-surface-subtle p-3 rounded-2xl border border-surface-border/60 space-y-1">
                  <span className="text-content-muted flex items-center font-bold">
                    <Clock className="w-3.5 h-3.5 mr-1 text-brand-600" />
                    เวลากะทำงานปกติ
                  </span>
                  <p className="font-bold text-content-primary">
                    {formatHours(site.workStart)} - {formatHours(site.workEnd)}
                  </p>
                  <span className="inline-block text-[10px] text-content-muted">เวลาเข้าสายหลัง {formatHours(site.workStart)}</span>
                </div>

                {/* Overtime Shift */}
                <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 space-y-1">
                  <span className="text-amber-800 dark:text-amber-300 flex items-center font-bold">
                    <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                    เวลากะโอที (OT)
                  </span>
                  <p className="font-bold text-amber-700 dark:text-amber-400">
                    {formatHours(site.otStart || 16)} - {formatHours(site.otEnd || 17)}
                  </p>
                  <span className="inline-block text-[10px] text-amber-600">กะโอทีมาตรฐาน 1.5 ชม.</span>
                </div>
              </div>

              {/* Employee Count Footer */}
              <div className="flex items-center justify-between pt-2 text-xs font-semibold text-content-secondary">
                <span className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-brand-600" />
                  <span>พนักงานประจำไซต์นี้:</span>
                </span>
                <span className="text-brand-700 font-bold bg-brand-50 dark:bg-brand-950/40 px-3 py-1 rounded-full">
                  {site._count?.employees || 0} คน
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT SITE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-surface-card border border-surface-border text-content-primary rounded-3xl max-w-xl w-full p-6 shadow-2xl relative my-8">
            <h2 className="text-lg font-bold border-b border-surface-border pb-3">
              {editingSite ? "แก้ไขข้อมูลโรงงานลูกค้า & กะเวลา" : "เพิ่มโรงงานลูกค้าใหม่"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">รหัสตัวย่อ (Code)</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">นิคมอุตสาหกรรม</label>
                  <input
                    type="text"
                    value={form.estateName}
                    onChange={(e) => setForm({ ...form, estateName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">ชื่อเต็มโรงงานลูกค้า</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold block mb-1">ชื่อผู้ติดต่อลูกค้า</label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">อีเมล</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 bg-surface-subtle p-3 rounded-2xl">
                <div>
                  <label className="font-bold block mb-1">เวลาเข้างาน</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.workStart}
                    onChange={(e) => setForm({ ...form, workStart: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-surface-border bg-surface-bg"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">เวลาออกงาน</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.workEnd}
                    onChange={(e) => setForm({ ...form, workEnd: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-surface-border bg-surface-bg"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">เข้าโอที</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.otStart}
                    onChange={(e) => setForm({ ...form, otStart: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-surface-border bg-surface-bg"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">ออกโอที</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.otEnd}
                    onChange={(e) => setForm({ ...form, otEnd: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-surface-border bg-surface-bg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-surface-border hover:bg-surface-subtle font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQrSite && (
        <SiteQRCodeModal
          site={selectedQrSite}
          onClose={() => setSelectedQrSite(null)}
        />
      )}
    </div>
  );
}
