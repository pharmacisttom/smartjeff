"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Kanban,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface Opportunity {
  id: string;
  opportunityNo: string;
  name: string;
  clientId: string;
  client: { id: string; code: string; name: string };
  estimatedContractValue: number;
  stage: string;
  probability: number;
  status: string;
  expectedCloseDate?: string;
  estimates?: any[];
  quotations?: any[];
  requirements?: any[];
  convertedProjectId?: string;
}

const STAGES = [
  { key: "DISCOVERY", label: "Discovery", badgeColor: "bg-blue-100 text-blue-800" },
  { key: "QUALIFICATION", label: "Qualification", badgeColor: "bg-indigo-100 text-indigo-800" },
  { key: "SITE_SURVEY", label: "Site Survey", badgeColor: "bg-purple-100 text-purple-800" },
  { key: "ESTIMATION", label: "Estimation", badgeColor: "bg-amber-100 text-amber-800" },
  { key: "PROPOSAL", label: "Proposal", badgeColor: "bg-orange-100 text-orange-800" },
  { key: "NEGOTIATION", label: "Negotiation", badgeColor: "bg-pink-100 text-pink-800" },
  { key: "AWAITING_DECISION", label: "Decision", badgeColor: "bg-teal-100 text-teal-800" },
  { key: "WON", label: "Won", badgeColor: "bg-emerald-100 text-emerald-800" },
  { key: "LOST", label: "Lost", badgeColor: "bg-red-100 text-red-800" },
];

export default function PipelineKanbanPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Opp Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    clientId: "",
    estimatedContractValue: 500000,
    ownerId: "SYS_SALES",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [oppRes, clRes] = await Promise.all([
        fetch("/api/crm/opportunities"),
        fetch("/api/crm/leads"),
      ]);
      const oppJson = await oppRes.json();
      if (oppJson.success) setOpportunities(oppJson.data || []);

      // fetch clients
      const clientsRes = await fetch("/api/crm/leads");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStageChange = async (oppId: string, targetStage: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/crm/opportunities/${oppId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: targetStage, performedBy: "USER_ADMIN" }),
      });
      const json = await res.json();
      if (!json.success) {
        setErrorMsg(`[Stage Guardrail]: ${json.error}`);
        return;
      }
      await fetchData();
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleCreateOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/crm/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setFormData({ name: "", clientId: "", estimatedContractValue: 500000, ownerId: "SYS_SALES" });
        await fetchData();
      } else {
        alert(json.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="p-6 max-w-[1700px] mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Kanban className="w-7 h-7 text-indigo-600" />
            กระดานไปป์ไลน์การขาย (Sales Pipeline Kanban)
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            ลากหรือเลื่อนสถานะโอกาสการขาย โดยมีระบบ Stage Validation ป้องกันการข้ามขั้นตอน
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/crm/leads"
            className="px-3.5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            ดูลูกค้าเป้าหมาย (Leads)
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            สร้างโอกาสการขายใหม่
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-sm animate-shake">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">ข้อกำหนดทางธุรกิจไม่อนุญาตให้เปลี่ยนสถานะ:</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 text-xs font-bold">
            ปิด
          </button>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin">
        {STAGES.map((col) => {
          const colOpps = opportunities.filter((o) => o.stage === col.key);
          const colTotal = colOpps.reduce((sum, o) => sum + (o.estimatedContractValue || 0), 0);

          return (
            <div
              key={col.key}
              className="flex-shrink-0 w-72 bg-gray-50/80 border border-gray-200 rounded-xl flex flex-col max-h-[80vh]"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-gray-200 bg-white rounded-t-xl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800">{col.label}</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                    {colOpps.length}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  รวม: <span className="font-medium text-gray-700">{(colTotal / 1000).toFixed(0)}k ฿</span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                {colOpps.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">ไม่มีรายการในขั้นตอนนี้</div>
                ) : (
                  colOpps.map((opp) => (
                    <div
                      key={opp.id}
                      className="p-3.5 bg-white border border-gray-200 rounded-lg shadow-xs hover:shadow-md transition space-y-2 group"
                    >
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="font-mono">{opp.opportunityNo}</span>
                        <span className="font-semibold text-indigo-600">{opp.probability}% win</span>
                      </div>

                      <h4 className="font-bold text-sm text-gray-900 leading-snug">{opp.name}</h4>

                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{opp.client?.name || "N/A"}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                        <span className="font-bold text-gray-800">
                          {(opp.estimatedContractValue || 0).toLocaleString()} ฿
                        </span>

                        {/* Stage transition quick selector */}
                        <select
                          value={opp.stage}
                          onChange={(e) => handleStageChange(opp.id, e.target.value)}
                          className="text-[11px] py-0.5 px-1.5 border border-gray-200 rounded bg-gray-50 text-gray-700 hover:bg-white focus:outline-none"
                        >
                          {STAGES.map((s) => (
                            <option key={s.key} value={s.key}>
                              &rarr; {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* If Won, show conversion button */}
                      {opp.stage === "WON" && (
                        <div className="pt-2 border-t border-emerald-100">
                          {opp.convertedProjectId ? (
                            <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              แปลงเป็นโครงการเรียบร้อยแล้ว
                            </span>
                          ) : (
                            <button
                              onClick={async () => {
                                if (confirm(`ยืนยันการแปลงโอกาสการขาย ${opp.opportunityNo} เป็นโครงการและสัญญาใหม่?`)) {
                                  const res = await fetch(`/api/crm/opportunities/${opp.id}/convert`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ confirmedBy: "SYS_ADMIN" }),
                                  });
                                  const j = await res.json();
                                  if (j.success) {
                                    alert(j.data.message);
                                    fetchData();
                                  } else {
                                    alert(j.error);
                                  }
                                }
                              }}
                              className="w-full py-1 text-[11px] bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition"
                            >
                              Convert to Project & Contract &rarr;
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Opportunity Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">สร้างโอกาสการขายใหม่ (New Opportunity)</h3>
            <form onSubmit={handleCreateOpp} className="space-y-3 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">ชื่องาน / โครงการ</label>
                <input
                  required
                  type="text"
                  placeholder="เช่น งานรักษาความปลอดภัยและทำความสะอาด รพ.ปลวกแดง"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">รหัสลูกค้า (Client ID หรือชื่อ)</label>
                <input
                  required
                  type="text"
                  placeholder="เช่น รหัส Client ID"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">มูลค่าประมาณการตามสัญญา (THB)</label>
                <input
                  type="number"
                  value={formData.estimatedContractValue}
                  onChange={(e) => setFormData({ ...formData, estimatedContractValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
