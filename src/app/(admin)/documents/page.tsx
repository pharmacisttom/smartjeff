'use me'
'use client';

import React, { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle, Clock, Search, Filter, ShieldAlert, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';

export default function DocumentExpiryPage() {
  const [documents, setDocuments] = useState([
    {
      id: 'DOC-001',
      employeeName: 'สมชาย สายซิ่ง (EMP-001)',
      type: 'WORK_PERMIT',
      typeName: 'ใบอนุญาตทำงาน (Work Permit)',
      number: 'WP-2024-88912',
      expiryDate: '2026-09-25',
      daysLeft: 9,
      status: 'CRITICAL',
    },
    {
      id: 'DOC-002',
      employeeName: 'วิภา ตรงเวลา (EMP-002)',
      type: 'PASSPORT',
      typeName: 'หนังสือเดินทาง (Passport)',
      number: 'AA-9981203',
      expiryDate: '2026-10-15',
      daysLeft: 29,
      status: 'URGENT',
    },
    {
      id: 'DOC-003',
      employeeName: 'กิตติศักดิ์ พรหมมี (EMP-003)',
      type: 'VISA_90_DAY',
      typeName: 'รายงานตัว 90 วัน (90-Day Visa Report)',
      number: 'V90-11204',
      expiryDate: '2026-11-20',
      daysLeft: 65,
      status: 'WARNING',
    },
  ]);

  const handleSendReminder = (doc: any) => {
    Swal.fire({
      title: 'ส่งการแจ้งเตือนสำเร็จ',
      text: `ส่งข้อความแจ้งเตือนต่ออายุ ${doc.typeName} ไปยัง ${doc.employeeName} เรียบร้อยแล้ว`,
      icon: 'success',
      confirmButtonColor: '#4f46e5',
      background: '#0f172a',
      color: '#fff',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Clock className="w-4 h-4" />
            <span>Compliance & Document Tracking</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            📄 Document Expiry Tracking & Alerts
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            ติดตามวันหมดอายุ Work Permit, Passport, รายงานตัว 90 วัน และใบอนุญาตพนักงานต่างด้าว
          </p>
        </div>
      </div>

      {/* Docs List */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          รายการเอกสารสุ่มเสี่ยงหมดอายุ (Expiry Matrix)
        </h2>

        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                doc.status === 'CRITICAL'
                  ? 'bg-red-950/30 border-red-500/40'
                  : doc.status === 'URGENT'
                  ? 'bg-amber-950/30 border-amber-500/40'
                  : 'bg-slate-800/40 border-slate-700/60'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    doc.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {doc.daysLeft} วันข้างหน้า ({doc.status})
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{doc.number}</span>
                </div>
                <h3 className="font-bold text-white text-base">{doc.employeeName}</h3>
                <p className="text-sm text-slate-300">{doc.typeName} — หมดอายุ {doc.expiryDate}</p>
              </div>

              <button
                onClick={() => handleSendReminder(doc)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
              >
                แจ้งเตือนต่ออายุ (Send Alert)
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
