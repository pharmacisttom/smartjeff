"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  TrendingUp,
  FileCheck,
  AlertTriangle,
  Award,
  Users,
  Kanban,
  ArrowRight,
  Plus,
  RefreshCw,
  Compass,
} from "lucide-react";

export default function CRMDashboardPage() {
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pipeRes, tndRes] = await Promise.all([
        fetch("/api/crm/pipeline"),
        fetch("/api/tenders"),
      ]);
      const pipeJson = await pipeRes.json();
      const tndJson = await tndRes.json();

      if (pipeJson.success) setPipelineData(pipeJson.data);
      if (tndJson.success) setTenders(tndJson.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stages = [
    { key: "DISCOVERY", label: "ค้นพบ (Discovery)", color: "bg-blue-500" },
    { key: "QUALIFICATION", label: "คุณสมบัติ (Qualification)", color: "bg-indigo-500" },
    { key: "SITE_SURVEY", label: "สำรวจพื้นที่ (Survey)", color: "bg-purple-500" },
    { key: "ESTIMATION", label: "ประมาณการต้นทุน (Estimation)", color: "bg-yellow-500" },
    { key: "PROPOSAL", label: "ยื่นข้อเสนอ (Proposal)", color: "bg-orange-500" },
    { key: "NEGOTIATION", label: "เจรจาต่อรอง (Negotiation)", color: "bg-pink-500" },
    { key: "AWAITING_DECISION", label: "รอการตัดสินใจ (Decision)", color: "bg-teal-500" },
    { key: "WON", label: "ชนะงาน (Won)", color: "bg-emerald-500" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-indigo-600" />
            ศูนย์บริหารการขายและการจัดหาโครงการ (CRM & Sales Pipeline)
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            SmartJeff Phase 17 — การจัดการ Lead, โอกาสการขาย, งานประมูล, ประมาณการต้นทุน และการปิดสัญญา
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            รีเฟรช
          </button>
          <Link
            href="/admin/crm/pipeline"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            <Kanban className="w-4 h-4" />
            กระดานไปป์ไลน์ (Kanban)
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
              โอกาสการขายที่เปิดอยู่
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">
              {pipelineData?.openOpportunities ?? 0} รายการ
            </div>
            <p className="text-sm text-gray-500 mt-1">
              มูลค่ารวม:{" "}
              <span className="font-semibold text-gray-800">
                {(pipelineData?.totalPipelineValue ?? 0).toLocaleString()} THB
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
              ใบเสนอราคารออนุมัติ
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">
              {pipelineData?.quotationPending ?? 0} ฉบับ
            </div>
            <p className="text-sm text-gray-500 mt-1">
              ต้องตรวจทานต้นทุนและมาร์จิ้น
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
              งานประมูล (Tenders)
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">{tenders.length} รายการ</div>
            <p className="text-sm text-gray-500 mt-1">
              <Link href="/admin/tenders" className="text-purple-600 hover:underline">
                ตรวจเช็คกำหนดส่งข้อเสนอ &rarr;
              </Link>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
              ชนะงานเดือนนี้ (Won)
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700">
              {pipelineData?.wonThisMonth ?? 0} รายการ
            </div>
            <p className="text-sm text-gray-500 mt-1">
              มูลค่า:{" "}
              <span className="font-semibold text-emerald-700">
                {(pipelineData?.wonValueThisMonth ?? 0).toLocaleString()} THB
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Stage Distribution */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            การกระจายตัวของงานในไปป์ไลน์ (Pipeline Funnel)
          </h2>
          <Link
            href="/admin/crm/pipeline"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            เปิด Kanban Board <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {stages.map((st) => {
            const data = pipelineData?.pipelineByStage?.[st.key];
            const count = data?.count || 0;
            const value = data?.totalValue || 0;
            return (
              <div key={st.key} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                    <span className="text-xs font-semibold text-gray-700 truncate">{st.label.split(" ")[0]}</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">{count}</div>
                </div>
                <div className="text-xs text-gray-500 mt-2 truncate">
                  {value > 0 ? `${(value / 1000).toFixed(0)}k ฿` : "-"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/crm/leads"
          className="p-5 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition">
              <Users className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">จัดการลูกค้าเป้าหมาย (Leads)</h3>
          <p className="text-xs text-gray-500 mt-1">
            บันทึกข้อมูลผู้ติดต่อ, นัดหมาย, และ Convert เป็น Client จริงอย่างเป็นระบบ
          </p>
        </Link>

        <Link
          href="/admin/tenders"
          className="p-5 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-110 transition">
              <FileCheck className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">งานประมูลและการคัดกรอง (Tenders)</h3>
          <p className="text-xs text-gray-500 mt-1">
            กระบวนการ Go/No-Go Review, ตรวจสอบเช็คลิสต์เอกสารประกวดราคา และแจ้งเตือนก่อนปิดรับ
          </p>
        </Link>

        <Link
          href="/mobile/site-survey"
          className="p-5 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition">
              <Compass className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">สำรวจพื้นที่หน้างาน (Site Survey PWA)</h3>
          <p className="text-xs text-gray-500 mt-1">
            บันทึกพิกัด GPS, ถ่ายรูปพื้นที่, ข้อจำกัดหน้างาน และรองรับการบันทึกแบบ Offline
          </p>
        </Link>
      </div>
    </div>
  );
}
