'use me'
'use client';

import React, { useState } from 'react';
import { calculateSLADue } from '@/lib/support/sla';
import { MessageSquare, Clock, AlertCircle, CheckCircle2, Search, Filter, Send } from 'lucide-react';
import Swal from 'sweetalert2';

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState([
    {
      id: 'TKT-2026-001',
      companyName: 'บริษัท สยาม ออโต้แมค จำกัด',
      plan: 'PROFESSIONAL',
      subject: 'สอบถามวิธีการเชื่อมต่อ LINE Messaging API สำหรับแจ้งเตือนการลงเวลา',
      priority: 'NORMAL',
      status: 'OPEN',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'TKT-2026-002',
      companyName: 'บริษัท มาบตาพุด คลีนนิ่ง เซอร์วิส จำกัด',
      plan: 'BUSINESS',
      subject: 'ขอเพิ่มโควตา API Call รายวันสำหรับเชื่อมต่อ ERP ภายนอก',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const handleReply = (tktId: string) => {
    Swal.fire({
      title: `ตอบกลับตั๋ว Support: ${tktId}`,
      input: 'textarea',
      inputPlaceholder: 'พิมพ์ข้อความตอบกลับไปยังผู้บริหาร/HR...',
      showCancelButton: true,
      confirmButtonText: 'ส่งข้อความตอบกลับ',
      confirmButtonColor: '#4f46e5',
      background: '#0f172a',
      color: '#fff',
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        setTickets((prev) =>
          prev.map((t) => (t.id === tktId ? { ...t, status: 'IN_PROGRESS' } : t))
        );
        Swal.fire({ title: 'ส่งข้อความสำเร็จ', icon: 'success', background: '#0f172a', color: '#fff' });
      }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <MessageSquare className="w-4 h-4" />
            <span>Customer Support & SLA Tracking</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            🎧 Support Ticket System & Inbox
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            ระบบรับเรื่องและแก้ไขปัญหาลูกค้าองค์กร พร้อมติดตาม SLA การตอบกลับตามระดับแพ็กเกจ
          </p>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          ตั๋วที่ต้องดำเนินการ (Open Tickets)
        </h2>

        <div className="space-y-4">
          {tickets.map((tkt) => {
            const slaDue = calculateSLADue(new Date(tkt.createdAt), tkt.plan);

            return (
              <div key={tkt.id} className="p-5 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-3">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-400 text-sm">{tkt.id}</span>
                    <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-xs font-bold">
                      {tkt.companyName}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs font-mono">
                      {tkt.plan}
                    </span>
                  </div>

                  <span className="text-xs text-amber-400 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> SLA Due: {slaDue.toLocaleTimeString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{tkt.subject}</h3>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-400">สร้างเมื่อ: {new Date(tkt.createdAt).toLocaleString()}</span>

                  <button
                    onClick={() => handleReply(tkt.id)}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    ตอบกลับ (Reply)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
