"use client";

import { useState, useEffect } from "react";
import {
  Target,
  Plus,
  Search,
  Filter,
  UserCheck,
  Building,
  Phone,
  Mail,
  CheckCircle2,
  Calendar,
  DollarSign,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form State with sample from prompt
  const [formData, setFormData] = useState({
    companyName: "โรงพยาบาลปลวกแดง",
    contactName: "น.ส.ธารทิพย์ ภูทองเงิน",
    phone: "038-123456",
    email: "pluakdaeng.hospital@moph.mail.go.th",
    source: "TENDER",
    industry: "Healthcare / Hospital",
    province: "ระยอง",
    interest: "งานอาชีวอนามัย, คุ้มครองผู้บริโภค, แพทย์แผนไทย (3 อัตรา)",
    estimatedValue: 450000,
    notes: "ต้องการพนักงานสนับสนุน 3 คน ประจำ รพ.ปลวกแดง จ.ระยอง",
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/crm/leads", window.location.origin);
      if (search) url.searchParams.set("search", search);
      if (statusFilter) url.searchParams.set("status", statusFilter);

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success) setLeads(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        await fetchLeads();
      } else {
        alert(json.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleConvert = async (leadId: string, companyName: string) => {
    if (!confirm(`ยืนยันการ Convert '${companyName}' เป็น Client จริงในระบบ?`)) return;

    try {
      const res = await fetch(`/api/crm/leads/${leadId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ performedBy: "USER_ADMIN" }),
      });
      const json = await res.json();
      if (json.success) {
        alert(
          json.data.alreadyConverted
            ? `Lead นี้เคย Convert แล้ว รหัสลูกค้า: ${json.data.client.code}`
            : `แปลงเป็นลูกค้าเรียบร้อยแล้ว รหัสลูกค้า: ${json.data.client.code} (${json.data.client.name})`
        );
        await fetchLeads();
      } else {
        alert(json.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-7 h-7 text-indigo-600" />
            การจัดการลูกค้าเป้าหมาย (Lead & Prospect Management)
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            แยก Lead/Prospect ออกจาก Client จริง และ Convert เป็น Client ได้อย่างปลอดภัยแบบ Idempotent
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          สร้าง Lead ใหม่
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อบริษัท, ผู้ติดต่อ, เบอร์โทร, อีเมล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLeads()}
            className="w-full text-sm border-none focus:outline-none placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700"
          >
            <option value="">ทุกสถานะ (All Status)</option>
            <option value="NEW">ใหม่ (NEW)</option>
            <option value="CONTACTED">ติดต่อแล้ว (CONTACTED)</option>
            <option value="QUALIFYING">กำลังประเมิน (QUALIFYING)</option>
            <option value="QUALIFIED">ผ่านการประเมิน (QUALIFIED)</option>
            <option value="CONVERTED">แปลงเป็นลูกค้าแล้ว (CONVERTED)</option>
            <option value="LOST">ไม่สำเร็จ (LOST)</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase">
            <tr>
              <th className="px-5 py-3">รหัส / องค์กร</th>
              <th className="px-5 py-3">ผู้ติดต่อ</th>
              <th className="px-5 py-3">ที่มา / ความสนใจ</th>
              <th className="px-5 py-3">มูลค่าประมาณการ</th>
              <th className="px-5 py-3">สถานะ</th>
              <th className="px-5 py-3 text-right">การกระทำ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                  ไม่พบข้อมูลลูกค้าเป้าหมาย
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50/60 transition">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-gray-900">{lead.companyName}</div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{lead.leadNo}</div>
                    {lead.province && (
                      <span className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mt-1 inline-block">
                        จ.{lead.province}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-gray-800">{lead.contactName}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {lead.phone || "-"}
                    </div>
                    {lead.email && (
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {lead.email}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-xs font-semibold text-indigo-600 uppercase">{lead.source}</div>
                    <div className="text-xs text-gray-600 mt-0.5 line-clamp-2 max-w-xs">{lead.interest || "-"}</div>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">
                    {lead.estimatedValue ? `${lead.estimatedValue.toLocaleString()} ฿` : "-"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        lead.status === "CONVERTED"
                          ? "bg-emerald-100 text-emerald-800"
                          : lead.status === "QUALIFIED"
                          ? "bg-blue-100 text-blue-800"
                          : lead.status === "LOST"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {lead.status === "CONVERTED" ? (
                      <span className="text-xs text-emerald-600 font-medium flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Client: {lead.convertedClient?.code || "Mapped"}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConvert(lead.id, lead.companyName)}
                        className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold transition"
                      >
                        Convert to Client
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              บันทึก Lead ใหม่ (New Lead / Prospect)
            </h3>
            <form onSubmit={handleCreateLead} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-medium text-gray-700 mb-1">ชื่อหน่วยงาน / บริษัท</label>
                  <input
                    required
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">ชื่อผู้ติดต่อ</label>
                  <input
                    required
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">จังหวัด</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">อีเมล</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">ช่องทางที่มา (Source)</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="TENDER">TENDER (งานประกวดราคา)</option>
                    <option value="REFERRAL">REFERRAL (แนะนำบอกต่อ)</option>
                    <option value="WEBSITE">WEBSITE (เว็บไซต์)</option>
                    <option value="PHONE">PHONE (โทรศัพท์)</option>
                    <option value="EXISTING_CLIENT">EXISTING_CLIENT (ลูกค้าเดิม)</option>
                    <option value="OTHER">OTHER (อื่นๆ)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">มูลค่าประมาณการ (THB)</label>
                  <input
                    type="number"
                    value={formData.estimatedValue}
                    onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-medium text-gray-700 mb-1">ความต้องการ / ความสนใจ</label>
                  <textarea
                    rows={2}
                    value={formData.interest}
                    onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
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
                  บันทึก Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
