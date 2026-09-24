"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Calendar,
  Eye,
  Copy,
  Check,
  ExternalLink,
  Shield,
  HeartPulse,
  GraduationCap,
  Clock,
  Sparkles,
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showConfirm } from "@/lib/swal";

interface Employee {
  id: string;
  code: string;
  prefix: string | null;
  firstName: string;
  lastName: string;
  fullName?: string;
  position: string;
  siteId: string;
  site?: { id: string; name: string; code?: string };
  salaryType: "MONTHLY" | "DAILY";
  baseSalary: number;
  dailyRate: number;
  phone: string | null;
  nationality: string;
  idCardNo: string | null;
  birthDate: string | null;
  age: number | null;
  startDate: string | null;
  gender: "MALE" | "FEMALE";
  bankName?: string | null;
  bankAccount?: string | null;
  hospital?: string | null;
  insurance?: string | null;
  education?: string | null;
  hometown?: string | null;
  isActive: boolean;
  isCodeMasked?: boolean;
  isPhoneMasked?: boolean;
  isSalaryMasked?: boolean;
  isIdCardMasked?: boolean;
  salaryMaskedDisplay?: string;
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [nationalityFilter, setNationalityFilter] = useState<string>("ALL");
  const [siteFilter, setSiteFilter] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Import Modal States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [updateDuplicates, setUpdateDuplicates] = useState(true);
  const [importSummary, setImportSummary] = useState<any>(null);

  // Form State
  const [form, setForm] = useState({
    code: "",
    prefix: "นาย",
    firstName: "",
    lastName: "",
    position: "แม่บ้าน",
    siteId: "",
    phone: "",
    nationality: "ไทย",
    idCardNo: "",
    birthDate: "",
    startDate: "",
    gender: "FEMALE",
    hospital: "",
    insurance: "ปกส.",
    bankAccount: "",
    bankName: "ไทยพานิชย์",
    salaryType: "MONTHLY",
    baseSalary: "12000",
    dailyRate: "400",
  });

  const fetchEmployees = useCallback(async () => {
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
  }, [search]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Unique sites for filter
  const uniqueSites = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => {
      if (e.site?.id && e.site?.name) {
        map.set(e.site.id, e.site.name);
      }
    });
    return Array.from(map.entries());
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Nationality filter
      if (nationalityFilter !== "ALL") {
        if (nationalityFilter === "THAI" && emp.nationality !== "ไทย") return false;
        if (nationalityFilter === "CAMBODIA" && emp.nationality !== "กัมพูชา") return false;
        if (nationalityFilter === "MYANMAR" && emp.nationality !== "พม่า") return false;
      }

      // Site filter
      if (siteFilter !== "ALL" && emp.siteId !== siteFilter) {
        return false;
      }

      // Search keyword
      if (search.trim()) {
        const q = search.toLowerCase();
        const code = (emp.code || "").toLowerCase();
        const name = `${emp.prefix || ""} ${emp.firstName} ${emp.lastName}`.toLowerCase();
        const phone = (emp.phone || "").toLowerCase();
        const idCard = (emp.idCardNo || "").toLowerCase();
        const pos = (emp.position || "").toLowerCase();
        const site = (emp.site?.name || "").toLowerCase();
        return (
          code.includes(q) ||
          name.includes(q) ||
          phone.includes(q) ||
          idCard.includes(q) ||
          pos.includes(q) ||
          site.includes(q)
        );
      }

      return true;
    });
  }, [employees, nationalityFilter, siteFilter, search]);

  // Counts
  const counts = useMemo(() => {
    let thai = 0;
    let cambodia = 0;
    let myanmar = 0;
    employees.forEach((e) => {
      if (e.nationality === "ไทย") thai++;
      else if (e.nationality === "กัมพูชา") cambodia++;
      else if (e.nationality === "พม่า") myanmar++;
    });
    return { total: employees.length, thai, cambodia, myanmar };
  }, [employees]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Format ID card for Thai nationals
  const formatIdCardDisplay = (idCard: string | null | undefined, nationality: string) => {
    if (!idCard) return "-";
    const clean = idCard.replace(/\D/g, "");
    if (nationality === "ไทย" && clean.length === 13) {
      return `${clean.slice(0, 1)}-${clean.slice(1, 5)}-${clean.slice(5, 10)}-${clean.slice(10, 12)}-${clean.slice(12)}`;
    }
    return idCard;
  };

  // Format date display
  const formatDateDisplay = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

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
        phone: emp.phone || "",
        nationality: emp.nationality || "ไทย",
        idCardNo: emp.idCardNo || "",
        birthDate: emp.birthDate ? emp.birthDate.slice(0, 10) : "",
        startDate: emp.startDate ? emp.startDate.slice(0, 10) : "",
        gender: emp.gender || "FEMALE",
        hospital: emp.hospital || "",
        insurance: emp.insurance || "ปกส.",
        bankAccount: emp.bankAccount || "",
        bankName: emp.bankName || "ไทยพานิชย์",
        salaryType: emp.salaryType,
        baseSalary: emp.baseSalary ? emp.baseSalary.toString() : "12000",
        dailyRate: emp.dailyRate ? emp.dailyRate.toString() : "400",
      });
    } else {
      setEditingEmployee(null);
      setForm({
        code: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        prefix: "นาย",
        firstName: "",
        lastName: "",
        position: "แม่บ้าน",
        siteId: uniqueSites[0]?.[0] || "",
        phone: "",
        nationality: "ไทย",
        idCardNo: "",
        birthDate: "",
        startDate: new Date().toISOString().slice(0, 10),
        gender: "FEMALE",
        hospital: "รพ.ระยอง",
        insurance: "ปกส.",
        bankAccount: "",
        bankName: "ไทยพานิชย์",
        salaryType: "MONTHLY",
        baseSalary: "12000",
        dailyRate: "400",
      });
    }
    setShowModal(true);
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
        showSuccess(
          editingEmployee ? "แก้ไขพนักงานสำเร็จ!" : "เพิ่มพนักงานสำเร็จ!",
          "บันทึกข้อมูลพนักงานเรียบร้อยแล้ว"
        );
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

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await showConfirm(
      "ยืนยันการลบพนักงาน",
      `คุณต้องการลบข้อมูลพนักงาน "${name}" ออกจากระบบใช่หรือไม่?`,
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

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      showError("กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls)");
      return;
    }

    try {
      setImporting(true);
      setImportSummary(null);
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("updateDuplicates", updateDuplicates ? "true" : "false");

      const res = await fetch("/api/employees/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
      }

      setImportSummary(data.summary);
      showSuccess("นำเข้าสำเร็จ!", data.message || "นำเข้าข้อมูลพนักงานเรียบร้อยแล้ว");
      fetchEmployees();
    } catch (err: any) {
      showError("เกิดข้อผิดพลาด", err.message || "ไม่สามารถนำเข้าข้อมูลได้");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-brand-700 via-brand-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-brand-800/40">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 text-brand-200 text-xs font-semibold uppercase tracking-widest">
            <Users className="w-4 h-4 text-brand-300" />
            <span>Smart Workforce Directory (J2K Housekeeping)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            ระบบจัดการฐานข้อมูลพนักงาน
          </h1>
          <p className="text-xs sm:text-sm text-brand-100 max-w-2xl leading-relaxed">
            ตรวจสอบข้อมูลพนักงาน เบอร์โทรศัพท์ติดต่องาน บัตรประชาชน/พาสปอร์ต วันเกิด สัญชาติ อัตราค่าจ้าง และไซต์งานประจำ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Download Standard Template Button */}
          <a
            href="/api/employees/template"
            download="employee_import_template.xlsx"
            className="flex items-center space-x-2 bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-2xl shadow-md transition-all active:scale-95 text-xs cursor-pointer border border-emerald-400/30"
            title="ดาวน์โหลดไฟล์แม่แบบ Excel สำหรับกรอกรายชื่อพนักงาน"
          >
            <Download className="w-4 h-4 text-emerald-100" />
            <span>ดาวน์โหลดแม่แบบ Excel</span>
          </a>

          {/* Import Excel Button */}
          <button
            onClick={() => {
              setImportFile(null);
              setImportSummary(null);
              setShowImportModal(true);
            }}
            className="flex items-center space-x-2 bg-blue-600/90 hover:bg-blue-600 text-white font-bold px-4 py-2.5 rounded-2xl shadow-md transition-all active:scale-95 text-xs cursor-pointer border border-blue-400/30"
            title="นำเข้ารายชื่อพนักงานจากไฟล์ Excel"
          >
            <Upload className="w-4 h-4 text-blue-100" />
            <span>นำเข้าข้อมูล (Excel)</span>
          </button>

          {/* Add Employee Button */}
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 bg-white text-brand-700 font-bold px-4 py-2.5 rounded-2xl hover:bg-brand-50 shadow-md transition-all active:scale-95 text-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-brand-600" />
            <span>+ เพิ่มพนักงาน</span>
          </button>
        </div>
      </div>

      {/* Nationality Statistic Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total */}
        <div
          onClick={() => setNationalityFilter("ALL")}
          className={cn(
            "p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between shadow-sm",
            nationalityFilter === "ALL"
              ? "bg-brand-500/10 border-brand-500 ring-2 ring-brand-500/20"
              : "bg-surface-card border-surface-border hover:border-brand-500/30"
          )}
        >
          <div>
            <p className="text-xs text-content-muted font-semibold">พนักงานทั้งหมด</p>
            <p className="text-2xl font-black text-content-primary mt-0.5">{counts.total} คน</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-brand-500/15 text-brand-600 flex items-center justify-center font-bold">
            👥
          </div>
        </div>

        {/* Thai */}
        <div
          onClick={() => setNationalityFilter("THAI")}
          className={cn(
            "p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between shadow-sm",
            nationalityFilter === "THAI"
              ? "bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20"
              : "bg-surface-card border-surface-border hover:border-blue-500/30"
          )}
        >
          <div>
            <p className="text-xs text-content-muted font-semibold">สัญชาติไทย 🇹🇭</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{counts.thai} คน</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-600 flex items-center justify-center text-xl">
            🇹🇭
          </div>
        </div>

        {/* Cambodia */}
        <div
          onClick={() => setNationalityFilter("CAMBODIA")}
          className={cn(
            "p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between shadow-sm",
            nationalityFilter === "CAMBODIA"
              ? "bg-red-500/10 border-red-500 ring-2 ring-red-500/20"
              : "bg-surface-card border-surface-border hover:border-red-500/30"
          )}
        >
          <div>
            <p className="text-xs text-content-muted font-semibold">สัญชาติกัมพูชา 🇰🇭</p>
            <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-0.5">{counts.cambodia} คน</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-red-500/15 text-red-600 flex items-center justify-center text-xl">
            🇰🇭
          </div>
        </div>

        {/* Myanmar */}
        <div
          onClick={() => setNationalityFilter("MYANMAR")}
          className={cn(
            "p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between shadow-sm",
            nationalityFilter === "MYANMAR"
              ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20"
              : "bg-surface-card border-surface-border hover:border-amber-500/30"
          )}
        >
          <div>
            <p className="text-xs text-content-muted font-semibold">สัญชาติพม่า 🇲🇲</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{counts.myanmar} คน</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center text-xl">
            🇲🇲
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-surface-card border border-surface-border p-4 rounded-3xl shadow-sm">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-content-muted absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ, รหัสพนักงาน, เบอร์โทร, เลขบัตรประชาชน, ไซต์งาน..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-surface-border bg-surface-subtle text-content-primary text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
          />
        </div>

        {/* Site Filter Dropdown */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-content-muted whitespace-nowrap">
            <Building className="w-4 h-4 text-brand-500" />
            <span>ไซต์งาน:</span>
          </div>
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="w-full md:w-48 px-3 py-2 rounded-2xl border border-surface-border bg-surface-subtle text-content-primary text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="ALL">ทุกไซต์งาน ({uniqueSites.length} ไซต์)</option>
            {uniqueSites.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          <span className="text-xs text-content-muted whitespace-nowrap pl-2 border-l border-surface-border hidden lg:inline">
            แสดง: <strong className="text-content-primary">{filteredEmployees.length}</strong> / {employees.length} คน
          </span>
        </div>
      </div>

      {/* Employees Datatable */}
      <div className="bg-surface-card border border-surface-border rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-content-muted animate-pulse font-medium">
            กำลังโหลดข้อมูลพนักงาน...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-20 text-center text-content-muted space-y-3">
            <Users className="w-12 h-12 mx-auto text-content-muted/40" />
            <p className="font-bold text-base text-content-primary">ไม่พบข้อมูลพนักงานที่ตรงกับเงื่อนไข</p>
            <p className="text-xs text-content-muted max-w-sm mx-auto">
              ลองเปลี่ยนคำค้นหา หรือเลือกสัญชาติเป็น &quot;พนักงานทั้งหมด&quot;
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-surface-border text-content-muted font-bold uppercase bg-surface-subtle/60 text-[11px] tracking-wider">
                  <th className="py-3.5 px-4">พนักงาน (รหัส & ชื่อ)</th>
                  <th className="py-3.5 px-3 text-center">สัญชาติ</th>
                  <th className="py-3.5 px-4 font-black text-brand-700 dark:text-brand-300">
                    เบอร์โทรศัพท์ (โทรออก)
                  </th>
                  <th className="py-3.5 px-4">เลขบัตร ปชช. / พาสปอร์ต</th>
                  <th className="py-3.5 px-3">วันเกิด / อายุ</th>
                  <th className="py-3.5 px-4">ไซต์งาน & ตำแหน่ง</th>
                  <th className="py-3.5 px-3">สิทธิรักษา / รพ.</th>
                  <th className="py-3.5 px-3">ค่าจ้าง</th>
                  <th className="py-3.5 px-3 text-center">สถานะ</th>
                  <th className="py-3.5 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredEmployees.map((emp) => {
                  const isThai = emp.nationality === "ไทย";
                  const isCambodia = emp.nationality === "กัมพูชา";
                  const isMyanmar = emp.nationality === "พม่า";

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-surface-subtle/50 transition-colors group cursor-pointer"
                      onClick={() => setDetailEmployee(emp)}
                    >
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm border",
                              emp.gender === "MALE"
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                : "bg-pink-500/10 text-pink-600 border-pink-500/20"
                            )}
                          >
                            {emp.gender === "MALE" ? "👨" : "👩"}
                          </div>
                          <div>
                            <p className="font-bold text-content-primary text-xs leading-tight">
                              {emp.prefix || ""} {emp.firstName} {emp.lastName}
                            </p>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span className="font-mono text-[11px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-1.5 py-0.2 rounded border border-brand-500/20">
                                {emp.code}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(emp.code, `code-${emp.id}`);
                                }}
                                title="คัดลอกรหัสพนักงาน"
                                className="text-content-muted hover:text-content-primary"
                              >
                                {copiedId === `code-${emp.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Nationality */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center space-x-1 px-2 py-0.5 rounded-full font-bold text-[10px] border whitespace-nowrap",
                            isThai
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                              : isCambodia
                              ? "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                          )}
                        >
                          <span>{isThai ? "🇹🇭" : isCambodia ? "🇰🇭" : "🇲🇲"}</span>
                          <span>{emp.nationality}</span>
                        </span>
                      </td>

                      {/* Phone Number [Most Important] */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        {emp.phone ? (
                          <div className="flex items-center space-x-1.5">
                            <a
                              href={`tel:${emp.phone.replace(/\D/g, "")}`}
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs border border-emerald-500/20 transition-all active:scale-95 shadow-xs"
                              title="แตะเพื่อโทรออกทันที"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
                              <span>{emp.phone}</span>
                            </a>
                            <button
                              onClick={() => handleCopy(emp.phone!, `phone-${emp.id}`)}
                              title="คัดลอกเบอร์โทร"
                              className="p-1 rounded hover:bg-surface-subtle text-content-muted hover:text-content-primary"
                            >
                              {copiedId === `phone-${emp.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-content-muted font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* ID Card / Passport No. */}
                      <td className="py-3.5 px-4">
                        {emp.idCardNo ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-xs font-semibold text-content-primary block">
                              {formatIdCardDisplay(emp.idCardNo, emp.nationality)}
                            </span>
                            <span className="text-[10px] text-content-muted block">
                              {isThai ? "บัตรประจำตัวประชาชน" : "พาสปอร์ต / บัตรต่างด้าว"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-content-muted font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Birth Date & Age */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="text-content-primary text-xs font-medium block">
                            {formatDateDisplay(emp.birthDate)}
                          </span>
                          {emp.age !== null ? (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-surface-subtle border border-surface-border text-content-secondary font-bold text-[10px]">
                              อายุ {emp.age} ปี
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Site & Position */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-content-primary text-xs truncate max-w-[180px]">
                          {emp.site?.name || "ไม่ระบุ"}
                        </p>
                        <span className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                          {emp.position}
                        </span>
                      </td>

                      {/* Hospital & Health Rights */}
                      <td className="py-3.5 px-3 max-w-[140px] truncate">
                        <span className="text-content-secondary text-[11px] block truncate">
                          {emp.hospital || emp.insurance || "-"}
                        </span>
                        {emp.insurance && emp.insurance !== emp.hospital && (
                          <span className="text-[10px] text-content-muted font-mono block">
                            ({emp.insurance})
                          </span>
                        )}
                      </td>

                      {/* Salary / Wage */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {emp.isSalaryMasked ? (
                          <span className="font-mono text-xs text-slate-400">••••••</span>
                        ) : (
                          <span className="font-bold text-brand-600 dark:text-brand-400">
                            {emp.salaryType === "MONTHLY"
                              ? `${Number(emp.baseSalary).toLocaleString()} ฿`
                              : `${Number(emp.dailyRate).toLocaleString()} ฿/วัน`}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {emp.isActive ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-bold text-[10px] border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3" />
                            <span>ทำงาน</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full font-bold text-[10px] border border-rose-500/20">
                            <XCircle className="w-3 h-3" />
                            <span>พ้นสภาพ</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setDetailEmployee(emp)}
                          title="ดูรายละเอียดข้อมูลพนักงาน"
                          className="p-1.5 hover:bg-surface-subtle text-content-secondary hover:text-brand-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(emp)}
                          title="แก้ไขข้อมูลพนักงาน"
                          className="p-1.5 hover:bg-surface-subtle text-content-secondary hover:text-brand-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, `${emp.firstName} ${emp.lastName}`)}
                          title="ลบพนักงาน"
                          className="p-1.5 hover:bg-rose-50 text-content-secondary hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal (Full view of all Excel columns) */}
      {detailEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-surface-border pb-4">
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border",
                    detailEmployee.gender === "MALE"
                      ? "bg-blue-500/10 border-blue-500/20"
                      : "bg-pink-500/10 border-pink-500/20"
                  )}
                >
                  {detailEmployee.gender === "MALE" ? "👨" : "👩"}
                </div>
                <div>
                  <h2 className="text-lg font-black text-content-primary">
                    {detailEmployee.prefix || ""} {detailEmployee.firstName} {detailEmployee.lastName}
                  </h2>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded border border-brand-500/20">
                      รหัส: {detailEmployee.code}
                    </span>
                    <span className="text-xs text-content-muted font-semibold">
                      {detailEmployee.position} • {detailEmployee.site?.name}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDetailEmployee(null)}
                className="w-8 h-8 rounded-full bg-surface-subtle hover:bg-surface-border flex items-center justify-center text-content-muted hover:text-content-primary text-base font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Contact Box [Phone - Most Important] */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    เบอร์โทรศัพท์ติดต่อด่วน
                  </p>
                  <p className="text-lg font-mono font-black text-content-primary">
                    {detailEmployee.phone || "ยังไม่ได้ระบุเบอร์โทร"}
                  </p>
                </div>
              </div>

              {detailEmployee.phone && (
                <a
                  href={`tel:${detailEmployee.phone.replace(/\D/g, "")}`}
                  className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                  <span>กดโทรออกทันที</span>
                </a>
              )}
            </div>

            {/* Comprehensive Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Personal Info */}
              <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-2.5">
                <p className="font-bold text-content-primary flex items-center space-x-1.5 border-b border-surface-border pb-1.5">
                  <Users className="w-4 h-4 text-brand-500" />
                  <span>ข้อมูลส่วนบุคคลและสัญชาติ</span>
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-content-muted">สัญชาติ:</span>
                    <span className="font-bold text-content-primary">
                      {detailEmployee.nationality === "ไทย"
                        ? "🇹🇭 ไทย"
                        : detailEmployee.nationality === "กัมพูชา"
                        ? "🇰🇭 กัมพูชา"
                        : "🇲🇲 พม่า"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">เลขบัตร ปชช. / พาสปอร์ต:</span>
                    <span className="font-mono font-bold text-content-primary">
                      {formatIdCardDisplay(detailEmployee.idCardNo, detailEmployee.nationality)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">วันเกิด:</span>
                    <span className="font-semibold text-content-primary">
                      {formatDateDisplay(detailEmployee.birthDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">อายุ:</span>
                    <span className="font-bold text-brand-600">
                      {detailEmployee.age ? `${detailEmployee.age} ปี` : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">เพศ:</span>
                    <span className="font-semibold text-content-primary">
                      {detailEmployee.gender === "MALE" ? "ชาย" : "หญิง"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Health & Insurance */}
              <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-2.5">
                <p className="font-bold text-content-primary flex items-center space-x-1.5 border-b border-surface-border pb-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  <span>สิทธิการรักษาและประกันสังคม</span>
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-content-muted">สิทธิการรักษา:</span>
                    <span className="font-bold text-content-primary">
                      {detailEmployee.insurance || "ปกส."}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">โรงพยาบาลคู่สัญญา:</span>
                    <span className="font-semibold text-content-primary">
                      {detailEmployee.hospital || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">การศึกษา:</span>
                    <span className="font-semibold text-content-primary">
                      {detailEmployee.education || "มัธยมศึกษา"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">ภูมิลำเนา:</span>
                    <span className="font-semibold text-content-primary">
                      {detailEmployee.hometown || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Employment & Worksite */}
              <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-2.5">
                <p className="font-bold text-content-primary flex items-center space-x-1.5 border-b border-surface-border pb-1.5">
                  <Building className="w-4 h-4 text-indigo-500" />
                  <span>สังกัดไซต์งานและการทำงาน</span>
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-content-muted">ไซต์งาน / โรงงาน:</span>
                    <span className="font-bold text-content-primary">{detailEmployee.site?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">รหัสไซต์:</span>
                    <span className="font-mono font-bold text-content-secondary">
                      {detailEmployee.site?.code || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">ตำแหน่งงาน:</span>
                    <span className="font-semibold text-content-primary">
                      {detailEmployee.position}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">วันที่เริ่มงาน:</span>
                    <span className="font-semibold text-content-primary">
                      {formatDateDisplay(detailEmployee.startDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payroll & Bank */}
              <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-2.5">
                <p className="font-bold text-content-primary flex items-center space-x-1.5 border-b border-surface-border pb-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <span>บัญชีธนาคารและค่าจ้าง</span>
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-content-muted">รูปแบบค่าจ้าง:</span>
                    <span className="font-bold text-brand-600">
                      {detailEmployee.salaryType === "MONTHLY" ? "รายเดือน (Monthly)" : "รายวัน (Daily)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">อัตราเงินเดือน / ค่าจ้าง:</span>
                    <span className="font-mono font-bold text-content-primary">
                      {detailEmployee.salaryType === "MONTHLY"
                        ? `${Number(detailEmployee.baseSalary).toLocaleString()} บาท/เดือน`
                        : `${Number(detailEmployee.dailyRate).toLocaleString()} บาท/วัน`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">ธนาคาร:</span>
                    <span className="font-semibold text-content-primary">
                      {detailEmployee.bankName || "ไทยพาณิชย์"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">เลขบัญชี:</span>
                    <span className="font-mono font-bold text-content-primary">
                      {detailEmployee.bankAccount || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-surface-border">
              <button
                type="button"
                onClick={() => {
                  const emp = detailEmployee;
                  setDetailEmployee(null);
                  handleOpenModal(emp);
                }}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                ✏️ แก้ไขข้อมูลพนักงาน
              </button>
              <button
                type="button"
                onClick={() => setDetailEmployee(null)}
                className="px-5 py-2.5 rounded-xl bg-surface-subtle hover:bg-surface-border text-content-secondary font-bold text-xs transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <div>
                <h2 className="text-lg font-black text-content-primary">
                  {editingEmployee ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
                </h2>
                <p className="text-xs text-content-muted mt-0.5">
                  กรอกข้อมูลประจำตัว เบอร์โทรศัพท์ และไซต์งานให้ครบถ้วน
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-surface-subtle hover:bg-surface-border flex items-center justify-center text-content-muted hover:text-content-primary text-base font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Row 1: Code, Prefix, First Name, Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-content-secondary mb-1">รหัสพนักงาน *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary font-mono outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">คำนำหน้า</label>
                  <select
                    value={form.prefix}
                    onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">ชื่อจริง *</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">นามสกุล</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Row 2: Phone [Important!], Nationality, ID Card/Passport */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <div>
                  <label className="block font-black text-emerald-800 dark:text-emerald-300 mb-1 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>เบอร์โทรศัพท์ (สำคัญที่สุด) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 098-451-3766"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-500/30 bg-surface-card text-content-primary font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">สัญชาติ</label>
                  <select
                    value={form.nationality}
                    onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-card text-content-primary outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="ไทย">🇹🇭 ไทย</option>
                    <option value="กัมพูชา">🇰🇭 กัมพูชา</option>
                    <option value="พม่า">🇲🇲 พม่า</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">
                    เลขบัตร ปชช. / พาสปอร์ต
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 3-4904-00109-28-1 หรือ เลขพาสปอร์ต"
                    value={form.idCardNo}
                    onChange={(e) => setForm({ ...form, idCardNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-card text-content-primary font-mono outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Row 3: Birth Date, Start Date, Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-content-secondary mb-1">วันเกิด</label>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">วันที่เริ่มงาน</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">เพศ</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="FEMALE">หญิง</option>
                    <option value="MALE">ชาย</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Site, Position, Hospital */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-content-secondary mb-1">ไซต์งานที่สังกัด *</label>
                  <select
                    required
                    value={form.siteId}
                    onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">เลือกไซต์งาน</option>
                    {uniqueSites.map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">ตำแหน่งงาน *</label>
                  <input
                    type="text"
                    required
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">
                    โรงพยาบาลคู่สัญญา
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น รพ.ระยอง หรือ ชำระเงินเอง"
                    value={form.hospital}
                    onChange={(e) => setForm({ ...form, hospital: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Row 5: Salary Type, Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-content-secondary mb-1">รูปแบบเงินเดือน</label>
                  <select
                    value={form.salaryType}
                    onChange={(e) => setForm({ ...form, salaryType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="MONTHLY">รายเดือน (Monthly)</option>
                    <option value="DAILY">รายวัน (Daily)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">
                    {form.salaryType === "MONTHLY" ? "เงินเดือนพื้นฐาน (บาท)" : "ค่าจ้างรายวัน (บาท)"}
                  </label>
                  <input
                    type="number"
                    value={form.salaryType === "MONTHLY" ? form.baseSalary : form.dailyRate}
                    onChange={(e) => {
                      if (form.salaryType === "MONTHLY") {
                        setForm({ ...form, baseSalary: e.target.value });
                      } else {
                        setForm({ ...form, dailyRate: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary font-mono outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-content-secondary mb-1">เลขบัญชีธนาคาร</label>
                  <input
                    type="text"
                    placeholder="เช่น 4360151024"
                    value={form.bankAccount}
                    onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary font-mono outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-surface-subtle hover:bg-surface-border text-content-secondary font-bold text-xs transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "กำลังบันทึก..." : editingEmployee ? "บันทึกการแก้ไข" : "บันทึกพนักงานใหม่"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-card border border-surface-border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-content-primary">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-surface-border bg-surface-subtle/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-content-primary">
                    นำเข้ารายชื่อพนักงานจาก Excel
                  </h3>
                  <p className="text-xs text-content-muted">
                    รองรับไฟล์นามสกุล .xlsx และ .xls ตามรูปแบบมาตรฐานของระบบ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="w-8 h-8 rounded-full bg-surface-subtle hover:bg-surface-border flex items-center justify-center text-content-muted hover:text-content-primary transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleImportSubmit} className="p-6 space-y-5">
              {/* Template Download Prompt */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center space-x-2.5">
                  <Download className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">ต้องการไฟล์แม่แบบมาตรฐาน?</p>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                      มีคอลัมน์ครบถ้วน (เบอร์โทร, เลขบัตร/พาสปอร์ต, วันเกิด, สัญชาติ, ไซต์งาน)
                    </p>
                  </div>
                </div>
                <a
                  href="/api/employees/template"
                  download="employee_import_template.xlsx"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm whitespace-nowrap cursor-pointer transition-all active:scale-95"
                >
                  ดาวน์โหลดไฟล์แม่แบบ (.xlsx)
                </a>
              </div>

              {/* File Dropzone */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-content-secondary">
                  เลือกไฟล์ Excel ที่ต้องการนำเข้า *
                </label>
                <div className="border-2 border-dashed border-surface-border hover:border-brand-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-surface-subtle/30 relative">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImportFile(e.target.files[0]);
                        setImportSummary(null);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    {importFile ? (
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-brand-600 dark:text-brand-400">
                          {importFile.name}
                        </p>
                        <p className="text-[11px] text-content-muted">
                          ขนาดไฟล์: {(importFile.size / 1024).toFixed(1)} KB (คลิกเพื่อเปลี่ยนไฟล์)
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-content-primary">
                          คลิกหรือลากไฟล์ Excel มาวางที่นี่
                        </p>
                        <p className="text-[11px] text-content-muted">
                          รองรับไฟล์ .xlsx หรือ .xls (ขนาดไม่เกิน 15 MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-medium text-content-primary">
                  <input
                    type="checkbox"
                    checked={updateDuplicates}
                    onChange={(e) => setUpdateDuplicates(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 rounded-md"
                  />
                  <span>
                    <strong>อัปเดตข้อมูลเดิม (Upsert)</strong>: หากพบรหัสพนักงานซ้ำกับในระบบ ให้ทำการปรับปรุงข้อมูลล่าสุดแทนการข้าม
                  </span>
                </label>
              </div>

              {/* Import Summary Results */}
              {importSummary && (
                <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 space-y-2.5 text-xs">
                  <div className="flex items-center space-x-2 font-bold text-brand-700 dark:text-brand-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>สรุปผลการนำเข้าข้อมูล:</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-surface-card rounded-xl border border-surface-border">
                      <p className="text-[10px] text-content-muted">แถวทั้งหมด</p>
                      <p className="font-bold text-sm text-content-primary">{importSummary.totalRows}</p>
                    </div>
                    <div className="p-2 bg-surface-card rounded-xl border border-surface-border">
                      <p className="text-[10px] text-emerald-600 font-semibold">เพิ่มใหม่</p>
                      <p className="font-bold text-sm text-emerald-600">{importSummary.created}</p>
                    </div>
                    <div className="p-2 bg-surface-card rounded-xl border border-surface-border">
                      <p className="text-[10px] text-blue-600 font-semibold">อัปเดตเดิม</p>
                      <p className="font-bold text-sm text-blue-600">{importSummary.updated}</p>
                    </div>
                    <div className="p-2 bg-surface-card rounded-xl border border-surface-border">
                      <p className="text-[10px] text-amber-600 font-semibold">ข้าม/ผิดพลาด</p>
                      <p className="font-bold text-sm text-amber-600">{importSummary.skipped + importSummary.errorCount}</p>
                    </div>
                  </div>

                  {importSummary.errors && importSummary.errors.length > 0 && (
                    <div className="mt-2 p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 text-red-600 text-[11px] max-h-32 overflow-y-auto space-y-1">
                      <p className="font-bold">รายการที่ไม่สามารถนำเข้าได้:</p>
                      {importSummary.errors.map((err: any, i: number) => (
                        <p key={i}>
                          แถวที่ {err.row}: {err.code ? `[${err.code}] ` : ""}{err.reason}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-surface-subtle hover:bg-surface-border text-content-secondary font-bold text-xs transition-colors cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  type="submit"
                  disabled={importing || !importFile}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{importing ? "กำลังนำเข้าข้อมูล..." : "เริ่มนำเข้าข้อมูล"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
