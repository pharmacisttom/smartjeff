'use me'
'use client';

import React, { useState } from 'react';
import { auditLaborCompliance, generateGovDocData, GovDocSpec } from '@/lib/compliance/labor-law';
import { ShieldCheck, AlertOctagon, FileText, CheckCircle2, Download, AlertTriangle, Building2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ComplianceDashboardPage() {
  const [activeTab, setActiveTab] = useState<'labor' | 'gov_docs'>('labor');

  // Sample attendance dataset
  const sampleData = [
    { employeeId: 'EMP-001', employeeName: 'สมชาย สายซิ่ง', date: '2026-09-15', hoursWorked: 13, otHours: 5, dailyWage: 500, province: 'RAYONG' },
    { employeeId: 'EMP-002', employeeName: 'วิภา ตรงเวลา', date: '2026-09-15', hoursWorked: 8, otHours: 2, dailyWage: 450, province: 'RAYONG' },
    { employeeId: 'EMP-003', employeeName: 'กิตติศักดิ์ พรหมมี', date: '2026-09-15', hoursWorked: 9, otHours: 1, dailyWage: 320, province: 'BANGKOK' },
  ];

  const result = auditLaborCompliance(sampleData);

  const govDocs: GovDocSpec[] = [
    { docType: 'SSO_1_10', period: '2026-09', companyName: 'บริษัท สมาร์ทเจฟ จำกัด', taxId: '0105567890123', itemsCount: 40, totalAmount: 30000 },
    { docType: 'PND_1', period: '2026-09', companyName: 'บริษัท สมาร์ทเจฟ จำกัด', taxId: '0105567890123', itemsCount: 40, totalAmount: 45000 },
    { docType: 'PND_1A', period: '2026-09', companyName: 'บริษัท สมาร์ทเจฟ จำกัด', taxId: '0105567890123', itemsCount: 40, totalAmount: 540000 },
    { docType: 'CR_7', period: '2026-09', companyName: 'บริษัท สมาร์ทเจฟ จำกัด', taxId: '0105567890123', itemsCount: 40, totalAmount: 0 },
    { docType: 'WHT_50_TWI', period: '2026-09', companyName: 'บริษัท สมาร์ทเจฟ จำกัด', taxId: '0105567890123', itemsCount: 40, totalAmount: 45000 },
  ];

  const handleDownloadDoc = (doc: GovDocSpec) => {
    const data = generateGovDocData(doc);
    Swal.fire({
      title: 'ดาวน์โหลดเอกสารราชการสำเร็จ',
      html: `
        <div class="text-left text-sm space-y-2">
          <p><b>ประเภท:</b> ${doc.docType}</p>
          <p><b>งวด:</b> ${doc.period}</p>
          <p><b>สถานะ:</b> Ready for e-Filing (สปส. / กรมสรรพากร)</p>
          <p class="text-emerald-400 font-mono text-xs">${data.downloadUrl}</p>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'รับทราบ',
      confirmButtonColor: '#4f46e5',
      background: '#0f172a',
      color: '#fff',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Compliance & Legal Audit</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            ⚖️ Compliance Dashboard & Government Docs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            ตรวจสอบการปฏิบัติตาม พ.ร.บ. คุ้มครองแรงงาน + สรุปแบบยื่น e-Filing สปส. / ภาษี
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('labor')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'labor' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            กฎหมายแรงงาน
          </button>
          <button
            onClick={() => setActiveTab('gov_docs')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'gov_docs' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            แบบยื่นราชการ (Gov Docs)
          </button>
        </div>
      </div>

      {activeTab === 'labor' ? (
        <div className="space-y-6">
          {/* Score Banner */}
          <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 ${
            result.status === 'OK' ? 'bg-emerald-950/40 border-emerald-500/30' :
            result.status === 'WARNING' ? 'bg-amber-950/40 border-amber-500/30' : 'bg-red-950/40 border-red-500/30'
          }`}>
            <div className="flex items-center gap-5">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl shadow-inner ${
                result.status === 'OK' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                result.status === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
              }`}>
                {result.score}
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  result.status === 'OK' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  result.status === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  STATUS: {result.status}
                </span>
                <h2 className="text-xl font-bold text-white mt-1">คะแนนการปฏิบัติตามกฎหมายแรงงานไทย</h2>
                <p className="text-xs text-slate-400 mt-1">อ้างอิง พ.ร.บ. คุ้มครองแรงงาน พ.ศ. 2541 และฉบับแก้ไขเพิ่มเติม</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-400">การละเมิดที่ตรวจพบ</p>
              <p className="text-3xl font-black text-white">{result.violations.length} รายการ</p>
            </div>
          </div>

          {/* Violations List */}
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-400" />
              รายการตรวจพบการผิดข้อบังคับ (Violations)
            </h3>

            {result.violations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-800/40 rounded-xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p>ไม่พบข้อละเมิดกฎหมายแรงงานในการสุ่มตรวจประจำงวด</p>
              </div>
            ) : (
              <div className="space-y-3">
                {result.violations.map((v, i) => (
                  <div key={i} className="p-4 bg-slate-800/60 border border-red-500/20 rounded-xl flex justify-between items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold">
                          {v.severity}
                        </span>
                        <span className="font-semibold text-white">{v.rule}</span>
                      </div>
                      <p className="text-sm text-slate-300 mt-1">{v.message}</p>
                    </div>

                    <span className="text-xs font-mono text-slate-400">EMP: {v.employeeId}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations Card */}
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              ข้อเสนอแนะในการปรับปรุง Compliance
            </h3>
            <ul className="space-y-2">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        /* Gov Docs Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {govDocs.map((doc, idx) => (
            <div key={idx} className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-indigo-500/40 transition">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
                  Ready e-Filing
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">{doc.docType}</h3>
                <p className="text-xs text-slate-400 mt-0.5">งวดประจำเดือน: {doc.period}</p>
              </div>

              <div className="text-xs text-slate-300 space-y-1 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 font-mono">
                <p>จำนวนพนักงาน: {doc.itemsCount} คน</p>
                <p>ยอดรวมที่ยื่น: ฿{doc.totalAmount.toLocaleString()}</p>
                <p>เลขประจำตัวผู้เสียภาษี: {doc.taxId}</p>
              </div>

              <button
                onClick={() => handleDownloadDoc(doc)}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold transition"
              >
                <Download className="w-4 h-4" />
                ดาวน์โหลด PDF & XML
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
