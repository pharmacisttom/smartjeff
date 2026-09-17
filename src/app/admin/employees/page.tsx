"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Building,
  Edit2,
  Trash2,
  Phone,
  CreditCard,
  CheckCircle,
  XCircle,
  Upload,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showConfirm } from "@/lib/swal";

interface Employee {
  id: string;
  code: string;
  prefix: string | null;
  firstName: string;
  lastName: string;
  position: string;
  siteId: string;
  site?: { name: string };
  salaryType: "MONTHLY" | "DAILY";
  baseSalary: number;
  dailyRate: number;
  phone: string | null;
  nationality: string;
  idCardNo: string | null;
  isActive: boolean;
}

interface SiteOption { id: string; code: string; name: string }
interface ImportError { row: number; code?: string; message: string }

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);

  // Modal Form State
  const [form, setForm] = useState({
    code: "",
    prefix: "นาย",
    firstName: "",
    lastName: "",
    position: "พนักงานทำความสะอาด",
    siteId: "",
    salaryType: "MONTHLY",
    baseSalary: "12000",
    dailyRate: "400",
    phone: "",
    nationality: "ไทย",
    idCardNo: "",
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/employees${search ? `?search=${search}` : ""}`);
      const data = await res.json();
      if (res.ok) {
        setEmployees(data.employees || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search]);

  useEffect(() => {
    fetch("/api/sites")
      .then((response) => response.json())
      .then((body) => setSites(body.sites || []))
      .catch(() => setSites([]));
  }, []);

  const handleOpenModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmployee(emp);
      setForm({
        code: emp.code,
        prefix: emp.prefix || "นาย",
        firstName: emp.firstName,
        lastName: emp.lastName,
        position: emp.position,
        siteId: emp.siteId,
        salaryType: emp.salaryType,
        baseSalary: emp.baseSalary.toString(),
        dailyRate: emp.dailyRate.toString(),
        phone: emp.phone || "",
        nationality: emp.nationality || "ไทย",
        idCardNo: emp.idCardNo || "",
      });
    } else {
      setEditingEmployee(null);
      setForm({
        code: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        prefix: "นาย",
        firstName: "",
        lastName: "",
        position: "พนักงานทำความสะอาด",
        siteId: sites[0]?.id || "",
        salaryType: "MONTHLY",
        baseSalary: "12000",
        dailyRate: "400",
        phone: "",
        nationality: "ไทย",
        idCardNo: "",
      });
    }
    setShowModal(true);
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    setImporting(true);
    setImportErrors([]);
    try {
      const upload = async (url: string) => {
        const payload = new FormData();
        payload.append("file", file);
        const response = await fetch(url, { method: "POST", body: payload });
        return { response, body: await response.json() };
      };

      const validation = await upload("/api/employees/import?validateOnly=true");
      if (!validation.response.ok) {
        setImportErrors(validation.body.errors || []);
        showError("ตรวจสอบไฟล์ไม่ผ่าน", validation.body.message || "กรุณาตรวจสอบข้อมูลในไฟล์");
        return;
      }

      const confirmed = await showConfirm(
        "ยืนยันการนำเข้าพนักงาน",
        `ทั้งหมด ${validation.body.total} รายการ: เพิ่มใหม่ ${validation.body.created}, อัปเดต ${validation.body.updated}, สร้างไซต์ ${validation.body.sitesToCreate}`,
        "นำเข้าข้อมูล",
        "ยกเลิก"
      );
      if (!confirmed) return;

      const imported = await upload("/api/employees/import");
      if (!imported.response.ok) {
        setImportErrors(imported.body.errors || []);
        showError("นำเข้าไฟล์ไม่สำเร็จ", imported.body.message || "กรุณาตรวจสอบข้อมูลในไฟล์");
        return;
      }
      showSuccess("นำเข้าพนักงานสำเร็จ", `เพิ่มใหม่ ${imported.body.created} รายการ และอัปเดต ${imported.body.updated} รายการ`);
      await fetchEmployees();
    } catch {
      showError("นำเข้าไฟล์ไม่สำเร็จ", "ไม่สามารถอ่านหรือส่งไฟล์ไปยังเซิร์ฟเวอร์ได้");
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : "/api/employees";
      const method = editingEmployee ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowModal(false);
        showSuccess(editingEmployee ? "แก้ไขพนักงานสำเร็จ!" : "เพิ่มพนักงานสำเร็จ!", "บันทึกข้อมูลพนักงานเรียบร้อยแล้ว");
        fetchEmployees();
      } else {
        showError("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้");
      }
    } catch (e) {
      showError("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await showConfirm(
      "ยืนยันการลบข้อมูลพนักงาน",
      "คุณแน่ใจหรือไม่ว่าต้องการลบรายชื่อพนักงานคนนี้ออกจากระบบ? ข้อมูลการลงเวลาและวันลาจะถูกลบไปด้วย",
      "ลบข้อมูล",
      "ยกเลิก"
    );

    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("ลบเรียบร้อย!", "ลบข้อมูลพนักงานออกจากระบบแล้ว");
        fetchEmployees();
      } else {
        showError("เกิดข้อผิดพลาด", "ไม่สามารถลบข้อมูลพนักงานได้");
      }
    } catch (e) {
      showError("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-brand-700 via-brand-800 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-brand-200 text-xs font-semibold uppercase tracking-widest">
            <Users className="w-4 h-4 text-brand-300" />
            <span>Employee Directory Management</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">จัดการข้อมูลพนักงาน</h1>
          <p className="text-sm text-brand-100">
            เพิ่ม แก้ไข ค้นหาข้อมูลพนักงาน อัตราค่าจ้าง และการสังกัดโรงงาน/นิคมฯ
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href="/api/employees/import"
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
          >
            <Download className="h-4 w-4" />
            <span>แม่แบบ Excel</span>
          </a>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20">
            <Upload className="h-4 w-4" />
            <span>{importing ? "กำลังนำเข้า..." : "นำเข้า Excel"}</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              disabled={importing}
              onChange={(event) => {
                void handleImport(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center space-x-2 bg-white text-brand-700 font-bold px-5 py-3 rounded-2xl hover:bg-brand-50 shadow-md transition-all active:scale-95"
          >
            <UserPlus className="w-5 h-5 text-brand-600" />
            <span>+ เพิ่มพนักงานใหม่</span>
          </button>
        </div>
      </div>

      {importErrors.length > 0 && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
          <div className="mb-3 flex items-center gap-2 font-bold"><FileSpreadsheet className="h-5 w-5" />รายการที่ต้องแก้ไขในไฟล์</div>
          <div className="max-h-48 space-y-1 overflow-y-auto text-sm">
            {importErrors.map((error, index) => (
              <div key={`${error.row}-${error.code || index}`}>แถว {error.row || "-"}{error.code ? ` (${error.code})` : ""}: {error.message}</div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-card border border-surface-border p-4 rounded-3xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-content-muted absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ, รหัสพนักงาน, ตำแหน่ง..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-surface-border bg-surface-bg text-content-primary text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <span className="text-xs text-content-muted font-medium whitespace-nowrap">
            พนักงานรวม: <strong className="text-content-primary">{employees.length} คน</strong>
          </span>
        </div>
      </div>

      {/* Employees Datatable */}
      <div className="bg-surface-card border border-surface-border rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-content-muted animate-pulse">
            กำลังโหลดรายชื่อพนักงาน...
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center text-content-muted space-y-2">
            <Users className="w-12 h-12 mx-auto text-content-muted/40" />
            <p className="font-bold text-sm">ไม่พบข้อมูลพนักงาน</p>
            <p className="text-xs">กดปุ่ม "+ เพิ่มพนักงานใหม่" เพื่อเพิ่มรายชื่อ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-xs text-content-muted font-bold uppercase bg-surface-subtle">
                  <th className="py-3.5 px-4">รหัส & ชื่อพนักงาน</th>
                  <th className="py-3.5 px-4">ตำแหน่ง</th>
                  <th className="py-3.5 px-4">สังกัดไซต์งาน</th>
                  <th className="py-3.5 px-4">รูปแบบเงินเดือน</th>
                  <th className="py-3.5 px-4">เบอร์โทรศัพท์</th>
                  <th className="py-3.5 px-4 text-center">สถานะ</th>
                  <th className="py-3.5 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-content-primary">
                        {emp.prefix || ""} {emp.firstName} {emp.lastName}
                      </div>
                      <span className="text-[11px] text-content-muted font-mono">{emp.code}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-content-secondary">{emp.position}</td>
                    <td className="py-3.5 px-4 text-content-secondary">{emp.site?.name || "ไม่ระบุ"}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded-md">
                        {emp.salaryType === "MONTHLY"
                          ? `${Number(emp.baseSalary).toLocaleString()} ฿/เดือน`
                          : `${Number(emp.dailyRate).toLocaleString()} ฿/วัน`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-content-muted">{emp.phone || "-"}</td>
                    <td className="py-3.5 px-4 text-center">
                      {emp.isActive ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">
                          <CheckCircle className="w-3 h-3" />
                          <span>ปฏิบัติงาน</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full font-bold">
                          <XCircle className="w-3 h-3" />
                          <span>พ้นสภาพ</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(emp)}
                        className="p-1.5 hover:bg-surface-subtle text-content-secondary hover:text-brand-600 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-1.5 hover:bg-rose-50 text-content-secondary hover:text-rose-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-lg font-bold text-content-primary">
                {editingEmployee ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-content-muted hover:text-content-primary font-bold text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-content-secondary mb-1">รหัสพนักงาน</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">คำนำหน้า</label>
                  <select
                    value={form.prefix}
                    onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="081-xxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-content-secondary mb-1">ชื่อ</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">นามสกุล</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-content-secondary mb-1">ตำแหน่งงาน</label>
                  <input
                    type="text"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">ไซต์งาน</label>
                  <select
                    value={form.siteId}
                    onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none"
                    required
                  >
                    <option value="">เลือกไซต์งาน</option>
                    {sites.map((site) => <option key={site.id} value={site.id}>{site.code} — {site.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-content-secondary mb-1">สัญชาติ</label>
                  <input
                    type="text"
                    list="nationality-options"
                    value={form.nationality}
                    onChange={(e) => setForm({ ...form, nationality: e.target.value, idCardNo: e.target.value.trim().toLowerCase() === "ไทย" ? form.idCardNo : form.idCardNo })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none"
                    required
                  />
                  <datalist id="nationality-options">
                    <option value="ไทย" />
                    <option value="กัมพูชา" />
                    <option value="เมียนมา" />
                    <option value="ลาว" />
                  </datalist>
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">
                    เลขบัตรประชาชน {form.nationality.trim().toLowerCase() === "ไทย" && <span className="text-rose-600">* 13 หลัก</span>}
                  </label>
                  <input
                    type="text"
                    inputMode={form.nationality.trim().toLowerCase() === "ไทย" ? "numeric" : "text"}
                    value={form.idCardNo}
                    onChange={(e) => setForm({ ...form, idCardNo: form.nationality.trim().toLowerCase() === "ไทย" ? e.target.value.replace(/\D/g, "").slice(0, 13) : e.target.value.slice(0, 30) })}
                    minLength={form.nationality.trim().toLowerCase() === "ไทย" ? 13 : undefined}
                    maxLength={form.nationality.trim().toLowerCase() === "ไทย" ? 13 : 30}
                    pattern={form.nationality.trim().toLowerCase() === "ไทย" ? "[0-9]{13}" : undefined}
                    required={form.nationality.trim().toLowerCase() === "ไทย"}
                    placeholder={form.nationality.trim().toLowerCase() === "ไทย" ? "เลขบัตรประชาชน 13 หลัก" : "ไม่บังคับสำหรับต่างชาติ"}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-content-secondary mb-1">รูปแบบเงินเดือน</label>
                  <select
                    value={form.salaryType}
                    onChange={(e) => setForm({ ...form, salaryType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none"
                  >
                    <option value="MONTHLY">รายเดือน (Monthly)</option>
                    <option value="DAILY">รายวัน (Daily)</option>
                  </select>
                </div>
                <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-[11px] text-brand-800">
                  คนไทยต้องระบุเลขบัตร 13 หลักและผ่านการตรวจสอบเลขควบคุม ส่วนพนักงานต่างชาติสามารถเว้นว่างหรือใช้เลขเอกสารประจำตัวได้
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-content-secondary mb-1">ฐานเงินเดือน (บาท)</label>
                  <input
                    type="number"
                    value={form.baseSalary}
                    onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">ค่าแรงรายวัน (บาท)</label>
                  <input
                    type="number"
                    value={form.dailyRate}
                    onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
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
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-md disabled:opacity-50"
                >
                  {submitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
