"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Printer,
  Download,
  Building,
  User,
  Search,
  CheckSquare,
  Square,
  ShieldCheck,
  Calendar,
  Phone,
  CreditCard,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/swal";

interface Site {
  id: string;
  code: string;
  name: string;
  location: string | null;
  estateName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

interface Employee {
  id: string;
  code: string;
  prefix: string | null;
  firstName: string;
  lastName: string;
  position: string;
  siteId: string;
  site: Site | null;
  startDate: string | null;
  birthDate: string | null;
  gender: string;
  nationality: string;
  idCardNo: string | null;
  phone: string | null;
  bankAccount: string | null;
  bankName: string | null;
  hospital: string | null;
  education?: string | null;
}

export default function DispatchDocumentPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [docDate, setDocDate] = useState<string>(
    new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );
  const [loading, setLoading] = useState(true);

  // Additional customizable fields
  const [maritalStatus, setMaritalStatus] = useState<"SINGLE" | "MARRIED" | "OTHER">("SINGLE");
  const [emergencyName, setEmergencyName] = useState<string>("-");
  const [emergencyRelation, setEmergencyRelation] = useState<string>("ญาติ");
  const [emergencyPhone, setEmergencyPhone] = useState<string>("-");
  const [supervisorName, setSupervisorName] = useState<string>("นายปณิธาน ลานทองกุล");

  const [hasIdCardCopy, setHasIdCardCopy] = useState(true);
  const [hasWorkPermit, setHasWorkPermit] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(true);
  const [hasMedicalCert, setHasMedicalCert] = useState(true);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/dispatch");
        const data = await res.json();
        if (res.ok) {
          setEmployees(data.employees || []);
          setSites(data.sites || []);
          if (data.employees && data.employees.length > 0) {
            setSelectedEmpId(data.employees[0].id);
            if (data.employees[0].siteId) {
              setSelectedSiteId(data.employees[0].siteId);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId) || employees[0];
  const targetSite = sites.find((s) => s.id === selectedSiteId) || selectedEmployee?.site;

  const handleSelectEmployee = (empId: string) => {
    setSelectedEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp && emp.siteId) {
      setSelectedSiteId(emp.siteId);
    }
    // Set default work permit checkbox for migrant workers
    if (emp && emp.nationality && emp.nationality !== "ไทย") {
      setHasWorkPermit(true);
    } else {
      setHasWorkPermit(false);
    }
  };

  const calculateAge = (birthDateStr: string | null) => {
    if (!birthDateStr) return "-";
    const birth = new Date(birthDateStr);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? `${age} ปี` : "-";
  };

  const formatDisplayDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.prefix || ""} ${emp.firstName} ${emp.lastName}`.toLowerCase();
    const code = emp.code.toLowerCase();
    const siteName = (emp.site?.name || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return fullName.includes(q) || code.includes(q) || siteName.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Header Banner - Hidden in Print */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Official Dispatch Letter Generator</span>
          </div>
          <h1 className="text-2xl font-black mt-1">ระบบออกเอกสารส่งตัวพนักงาน (J2K Referral Letter)</h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            สร้างและพิมพ์แบบฟอร์มเอกสารส่งตัวพนักงานไปยังโรงงาน/นิคมอุตสาหกรรมลูกค้า ตามรูปแบบมาตรฐาน J2K
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์เอกสาร (Print A4)</span>
          </button>
        </div>
      </div>

      {/* Control Panel: Employee & Customer Selector - Hidden in Print */}
      <div className="print:hidden grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-card border border-surface-border p-5 rounded-3xl shadow-sm">
        {/* Employee Search & Select */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-content-secondary flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-brand-600" />
            เลือกพนักงาน (ทั้งหมด {employees.length} ท่าน)
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัส, ไซต์งาน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none focus:border-brand-500"
            />
            <Search className="w-4 h-4 text-content-muted absolute left-3 top-2.5" />
          </div>
          <select
            value={selectedEmpId}
            onChange={(e) => handleSelectEmployee(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-surface-bg text-content-primary font-medium outline-none focus:border-brand-500"
          >
            {filteredEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.code} - {emp.prefix || ""} {emp.firstName} {emp.lastName} ({emp.site?.code || "HQ"})
              </option>
            ))}
          </select>
        </div>

        {/* Customer Site Select */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-content-secondary flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-brand-600" />
            ส่งตัวไปยังบริษัทลูกค้า / โรงงาน
          </label>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-surface-bg text-content-primary font-medium outline-none focus:border-brand-500 mt-7"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.code} - {site.name} ({site.estateName || site.location || "ระยอง"})
              </option>
            ))}
          </select>
          {targetSite?.contactName && (
            <p className="text-[11px] text-content-muted">
              ผู้ประสานงานลูกค้า: {targetSite.contactName} {targetSite.contactPhone ? `(${targetSite.contactPhone})` : ""}
            </p>
          )}
        </div>

        {/* Document Date & Signer */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-content-secondary flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-600" />
            วันที่เอกสาร & ผู้มีอำนาจลงนาม
          </label>
          <input
            type="text"
            value={docDate}
            onChange={(e) => setDocDate(e.target.value)}
            placeholder="วันที่เอกสาร"
            className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-surface-bg text-content-primary font-medium outline-none focus:border-brand-500"
          />
          <input
            type="text"
            value={supervisorName}
            onChange={(e) => setSupervisorName(e.target.value)}
            placeholder="ชื่อหัวหน้างาน / ผู้มีอำนาจลงชื่อ"
            className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-surface-bg text-content-primary font-medium outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* PRINTABLE DOCUMENT CONTAINER */}
      <div
        ref={printRef}
        className="bg-white text-slate-900 p-8 md:p-12 rounded-3xl shadow-xl border border-slate-200 max-w-4xl mx-auto print:p-0 print:border-none print:shadow-none print:max-w-none print:rounded-none"
      >
        {/* Official Header */}
        <div className="text-center border-b-2 border-slate-800 pb-5 space-y-1">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-700 text-white font-black text-2xl flex items-center justify-center shadow">
              J2K
            </div>
            <div className="text-left">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                บริษัท เจทูเค เฮ้าส์คีพปิ้ง เซอร์วิส จำกัด
              </h2>
              <p className="text-xs font-semibold text-slate-600 tracking-wide">
                J2K Housekeeping Service Co., Ltd.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 pt-1">
            235 หมู่ที่ 4 ตำบลปลวกแดง อำเภอปลวกแดง จังหวัดระยอง 21140 โทรศัพท์ 097-253-9456
          </p>
        </div>

        {/* Title Bar */}
        <div className="text-center my-6">
          <h3 className="text-xl font-bold text-slate-900 tracking-wider inline-block border-b-2 border-slate-900 pb-1 uppercase">
            เอกสารส่งตัวพนักงาน
          </h3>
        </div>

        {/* Meta Info: Date, Code, Customer */}
        <div className="grid grid-cols-2 gap-4 text-xs md:text-sm font-medium pb-4 border-b border-slate-200">
          <div>
            <span className="font-bold text-slate-700">วันที่: </span>
            <span className="font-semibold underline decoration-dotted decoration-slate-400 underline-offset-4">
              {docDate}
            </span>
          </div>
          <div className="text-right">
            <span className="font-bold text-slate-700">รหัสพนักงาน: </span>
            <span className="font-bold font-mono text-base px-2 py-0.5 bg-slate-100 rounded border border-slate-300">
              {selectedEmployee?.code || "-"}
            </span>
          </div>
          <div className="col-span-2 pt-1">
            <span className="font-bold text-slate-700">เรียน: </span>
            <span className="underline decoration-dotted decoration-slate-400 underline-offset-4 font-semibold">
              ผู้จัดการฝ่ายบุคคล / ผู้ว่าจ้างประจำ {targetSite?.name || "บริษัทคู่ค้า"}
            </span>
          </div>
        </div>

        {/* Employee Particulars Grid */}
        <div className="py-4 space-y-3.5 text-xs md:text-sm">
          {/* Row 1: Name, Age, Gender */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-6 flex items-center">
              <span className="font-bold text-slate-700 whitespace-nowrap mr-2">ชื่อ - นามสกุล:</span>
              <span className="font-bold flex-1 border-b border-dotted border-slate-400 pb-0.5">
                {selectedEmployee?.prefix || ""} {selectedEmployee?.firstName} {selectedEmployee?.lastName}
              </span>
            </div>
            <div className="col-span-3 flex items-center">
              <span className="font-bold text-slate-700 whitespace-nowrap mr-2">อายุ:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5">
                {calculateAge(selectedEmployee?.birthDate)}
              </span>
            </div>
            <div className="col-span-3 flex items-center">
              <span className="font-bold text-slate-700 whitespace-nowrap mr-2">เพศ:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5">
                {selectedEmployee?.gender === "MALE" ? "ชาย" : "หญิง"}
              </span>
            </div>
          </div>

          {/* Row 2: Company, Position, Hospital */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-6 flex items-center">
              <span className="font-bold text-slate-700 whitespace-nowrap mr-2">พนักงานบริษัท:</span>
              <span className="font-semibold flex-1 border-b border-dotted border-slate-400 pb-0.5">
                เจทูเค เฮ้าส์คีพปิ้ง เซอร์วิส จำกัด
              </span>
            </div>
            <div className="col-span-6 flex items-center">
              <span className="font-bold text-slate-700 whitespace-nowrap mr-2">ตำแหน่ง:</span>
              <span className="font-bold flex-1 border-b border-dotted border-slate-400 pb-0.5">
                {selectedEmployee?.position || "พนักงานทำความสะอาด"}
              </span>
            </div>
          </div>

          {/* Row 3: DOB, Race, Nationality */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-5 flex items-center">
              <span className="font-bold text-slate-700 whitespace-nowrap mr-2">วัน/เดือน/ปี เกิด:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5">
                {formatDisplayDate(selectedEmployee?.birthDate)}
              </span>
            </div>
            <div className="col-span-3 flex items-center">
              <span className="font-bold text-slate-700 whitespace-nowrap mr-2">เชื้อชาติ:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5">
                {selectedEmployee?.nationality || "ไทย"}
              </span>
            </div>
            <div className="col-span-4 flex items-center">
              <span className="font-bold text-slate-700 whitespace-nowrap mr-2">สัญชาติ:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5">
                {selectedEmployee?.nationality || "ไทย"}
              </span>
            </div>
          </div>

          {/* Row 4: ID Card / Passport */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-8 flex items-center">
              <span className="font-bold text-slate-700 whitespace-nowrap mr-2">
                บัตรประจำตัวประชาชนหรือหนังสือเดินทางเลขที่:
              </span>
              <span className="font-bold font-mono tracking-wider flex-1 border-b border-dotted border-slate-400 pb-0.5">
                {selectedEmployee?.idCardNo || "รอดำเนินการตรวจสอบ"}
              </span>
            </div>
            <div className="col-span-4 flex items-center">
              <span className="font-bold text-slate-700 whitespace-nowrap mr-2">โทรศัพท์:</span>
              <span className="font-semibold flex-1 border-b border-dotted border-slate-400 pb-0.5">
                {selectedEmployee?.phone || "-"}
              </span>
            </div>
          </div>

          {/* Row 5: Current Address */}
          <div className="flex items-center">
            <span className="font-bold text-slate-700 whitespace-nowrap mr-2">ที่อยู่ปัจจุบัน:</span>
            <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5">
              {targetSite?.location || "จังหวัดระยอง / ชลบุรี"}
            </span>
          </div>

          {/* Row 6: Marital Status */}
          <div className="flex items-center gap-6 pt-1">
            <span className="font-bold text-slate-700">สถานภาพ:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="marital"
                checked={maritalStatus === "SINGLE"}
                onChange={() => setMaritalStatus("SINGLE")}
                className="w-4 h-4 text-blue-600"
              />
              <span>โสด</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="marital"
                checked={maritalStatus === "MARRIED"}
                onChange={() => setMaritalStatus("MARRIED")}
                className="w-4 h-4 text-blue-600"
              />
              <span>สมรส</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="marital"
                checked={maritalStatus === "OTHER"}
                onChange={() => setMaritalStatus("OTHER")}
                className="w-4 h-4 text-blue-600"
              />
              <span>อื่นๆ</span>
            </label>
          </div>

          {/* Row 7: Emergency Contact */}
          <div className="grid grid-cols-12 gap-2 items-center pt-1">
            <div className="col-span-6 flex items-center">
              <span className="font-bold text-slate-700 whitespace-nowrap mr-2">
                ผู้ที่ติดต่อได้กรณีฉุกเฉิน:
              </span>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="ชื่อ-นามสกุล ผู้ติดต่อฉุกเฉิน"
                className="flex-1 border-b border-dotted border-slate-400 outline-none pb-0.5 text-xs bg-transparent"
              />
            </div>
            <div className="col-span-3 flex items-center">
              <span className="font-bold text-slate-700 whitespace-nowrap mr-2">ความสัมพันธ์:</span>
              <input
                type="text"
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value)}
                className="flex-1 border-b border-dotted border-slate-400 outline-none pb-0.5 text-xs bg-transparent"
              />
            </div>
            <div className="col-span-3 flex items-center">
              <span className="font-bold text-slate-700 whitespace-nowrap mr-2">โทร:</span>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="flex-1 border-b border-dotted border-slate-400 outline-none pb-0.5 text-xs bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* Declarations Box */}
        <div className="my-5 p-4 rounded-xl border border-slate-300 bg-slate-50/50 space-y-1.5 text-xs leading-relaxed text-slate-700">
          <p className="flex items-start">
            <span className="font-bold mr-1.5">•</span>
            <span>
              ข้าพเจ้ายินยอมให้ตรวจสอบประวัติอาชญากรรม โดยการพิมพ์ลายนิ้วมือ เมื่อทางบริษัท เจทูเค เฮ้าส์คีพปิ้ง เซอร์วิส จำกัด หรือสถานประกอบการลูกค้าต้องการตรวจสอบ
            </span>
          </p>
          <p className="flex items-start">
            <span className="font-bold mr-1.5">•</span>
            <span>
              และข้าพเจ้าขอรับรองว่าข้อความและข้อมูลที่ระบุข้างต้นเป็นความจริงทุกประการ หากมีข้อมูลอันเป็นเท็จ ข้าพเจ้ายินยอมรับผิดชอบทุกประการ
            </span>
          </p>
        </div>

        {/* Attachment Checklist */}
        <div className="my-4 text-xs space-y-1.5">
          <span className="font-bold text-slate-800">เอกสารประกอบแนบส่งตัว:</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasIdCardCopy}
                onChange={(e) => setHasIdCardCopy(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span>สำเนาบัตรประชาชน</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasWorkPermit}
                onChange={(e) => setHasWorkPermit(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span>ใบอนุญาตทำงาน (ต่างด้าว)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasPhoto}
                onChange={(e) => setHasPhoto(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span>รูปถ่ายขนาด 1 นิ้ว</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasMedicalCert}
                onChange={(e) => setHasMedicalCert(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span>ใบรับรองแพทย์</span>
            </label>
          </div>
        </div>

        {/* Signature Area */}
        <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-300 text-center text-xs">
          <div className="space-y-4">
            <div className="h-14 flex items-end justify-center">
              <span className="text-slate-400 italic">...........................................................................</span>
            </div>
            <div>
              <p className="font-bold text-slate-800">
                ( {selectedEmployee?.prefix || ""} {selectedEmployee?.firstName} {selectedEmployee?.lastName} )
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">ลายมือชื่อพนักงาน</p>
              <p className="text-[10px] text-slate-400 mt-1">วันที่ ...... / ...... / ............</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-14 flex items-end justify-center">
              <span className="text-slate-400 italic">...........................................................................</span>
            </div>
            <div>
              <p className="font-bold text-slate-800">( {supervisorName} )</p>
              <p className="text-[11px] text-slate-600 mt-0.5">ลายมือชื่อหัวหน้างาน / ผู้มีอำนาจลงนาม J2K</p>
              <p className="text-[10px] text-slate-400 mt-1">วันที่ ...... / ...... / ............</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
