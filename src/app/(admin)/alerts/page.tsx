'use me'
'use client';

import React, { useState } from 'react';
import { EmergencyAlertPayload, acknowledgeAlert, resolveAlert } from '@/lib/emergency/sos';
import { ShieldAlert, CheckCircle2, Clock, MapPin, Phone, Radio, UserCheck } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminAlertsInboxPage() {
  const [alerts, setAlerts] = useState<EmergencyAlertPayload[]>([
    {
      id: 'EMG-17264821',
      tenantId: 'TENANT-001',
      employeeId: 'EMP-001',
      employeeName: 'สมชาย สายซิ่ง',
      type: 'SOS',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      lat: 12.6825,
      lng: 101.2811,
      address: 'โรงงาน A1 นิคมอุตสาหกรรมมาบตาพุด จ.ระยอง',
      message: 'เกิดเหตุการณ์เครื่องจักรขัดข้อง ขอทีมเซฟตี้เข้าพื้นที่ด่วน',
      notifiedVia: ['LINE', 'SMS', 'SLACK', 'PUSH'],
      createdAt: '2026-09-16T10:45:00Z',
    },
    {
      id: 'EMG-17264810',
      tenantId: 'TENANT-001',
      employeeId: 'EMP-005',
      employeeName: 'วิศรุต ผู้บริหาร',
      type: 'ACCIDENT',
      severity: 'HIGH',
      status: 'ACKNOWLEDGED',
      lat: 12.7101,
      lng: 101.1523,
      address: 'นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด ปลวกแดง',
      message: 'รถยนต์บริการยางรั่ว ต้องการรถสำรอง',
      notifiedVia: ['LINE', 'EMAIL'],
      createdAt: '2026-09-16T09:15:00Z',
    },
  ]);

  const handleAck = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? acknowledgeAlert(a, 'Admin User') : a))
    );
    Swal.fire({
      title: 'รับทราบเหตุการณ์แล้ว',
      text: 'ระบบได้บันทึกการ รับทราบ (Acknowledge) และแจ้งพนักงานแล้ว',
      icon: 'info',
      confirmButtonColor: '#4f46e5',
      background: '#0f172a',
      color: '#fff',
    });
  };

  const handleResolve = (id: string) => {
    Swal.fire({
      title: 'ปิดเคสเหตุการณ์ฉุกเฉิน',
      input: 'textarea',
      inputPlaceholder: 'กรอกบันทึกการแก้ไขปัญหา (Resolution Note)...',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันปิดเคส',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#10b981',
      background: '#0f172a',
      color: '#fff',
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? resolveAlert(a, res.value) : a))
        );
        Swal.fire({ title: 'ปิดเคสสำเร็จ', icon: 'success', background: '#0f172a', color: '#fff' });
      }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency Operations Command</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            🚨 Real-Time Emergency Alerts Inbox
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            ศูนย์รับแจ้งเหตุฉุกเฉิน SOS & Safety Monitor ควบคุมเหตุการณ์เรียลไทม์
          </p>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-6 rounded-2xl border backdrop-blur-xl transition ${
              alert.status === 'ACTIVE'
                ? 'bg-red-950/30 border-red-500/50 shadow-2xl shadow-red-950/50 animate-pulse'
                : alert.status === 'ACKNOWLEDGED'
                ? 'bg-amber-950/20 border-amber-500/40'
                : 'bg-slate-900/60 border-slate-800 opacity-80'
            }`}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    alert.status === 'ACTIVE' ? 'bg-red-600 text-white' : alert.status === 'ACKNOWLEDGED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {alert.status}
                  </span>
                  <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded text-xs font-mono">
                    {alert.type}
                  </span>
                  <span className="text-xs text-slate-400">{new Date(alert.createdAt).toLocaleString()}</span>
                </div>

                <h2 className="text-xl font-bold text-white mt-2">
                  {alert.employeeName} ({alert.employeeId})
                </h2>
                <p className="text-sm text-slate-300 font-medium">{alert.message}</p>

                <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <span>{alert.address} ({alert.lat.toFixed(4)}, {alert.lng.toFixed(4)})</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {alert.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleAck(alert.id)}
                    className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                  >
                    <UserCheck className="w-4 h-4" />
                    รับทราบเหตุการณ์ (Ack)
                  </button>
                )}

                {alert.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    ปิดเคส (Resolve)
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
