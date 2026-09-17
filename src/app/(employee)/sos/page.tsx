'use me'
'use client';

import React, { useState, useEffect } from 'react';
import { triggerSOSAlert, EmergencyType } from '@/lib/emergency/sos';
import { AlertTriangle, PhoneCall, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function EmployeeSOSPage() {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<EmergencyType>('SOS');
  const [customMsg, setCustomMsg] = useState('');
  const [sentAlert, setSentAlert] = useState<any | null>(null);

  useEffect(() => {
    let timer: any;
    if (countdown !== null && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      handleConfirmSOS();
      setCountdown(null);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handlePressSOS = () => {
    setCountdown(5);
  };

  const handleCancelCountdown = () => {
    setCountdown(null);
  };

  const handleConfirmSOS = () => {
    // Geolocation fallback
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sendAlertWithCoords(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        sendAlertWithCoords(12.682, 101.281); // default Maptaphut coords
      }
    );
  };

  const sendAlertWithCoords = (lat: number, lng: number) => {
    const alert = triggerSOSAlert('EMP-001', 'สมชาย สายซิ่ง', lat, lng, selectedType, customMsg);
    setSentAlert(alert);

    Swal.fire({
      title: '🚨 ส่งสัญญาณ SOS เรียบร้อยแล้ว!',
      html: `
        <div class="text-left text-sm space-y-2">
          <p><b>ประเภท:</b> ${alert.type}</p>
          <p><b>พิกัด:</b> ${alert.lat.toFixed(4)}, ${alert.lng.toFixed(4)}</p>
          <p><b>การแจ้งเตือน:</b> LINE, SMS, Email, Slack, Push Notification (Admin)</p>
          <p class="text-emerald-400 font-semibold">เจ้าหน้าที่ศูนย์ควบคุมกำลังเร่งดำเนินการ!</p>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#ef4444',
      background: '#0f172a',
      color: '#fff',
    });
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6 text-slate-100 text-center">
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-red-500/30 backdrop-blur-xl shadow-2xl space-y-6">
        <div>
          <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-full text-xs font-bold uppercase tracking-wider">
            Emergency SOS Service
          </span>
          <h1 className="text-3xl font-black text-white mt-2">
            🚨 ปุ่มขอความช่วยเหลือฉุกเฉิน
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            กดเพื่อส่งพิกัด GPS + แจ้งเตือนด่วนไปยังผู้บริหารและทีมความปลอดภัยทันที
          </p>
        </div>

        {/* Emergency Type Selector */}
        <div className="grid grid-cols-3 gap-2">
          {(['SOS', 'ACCIDENT', 'MEDICAL', 'FIRE', 'SECURITY'] as EmergencyType[]).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                selectedType === t
                  ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Message Input */}
        <input
          type="text"
          placeholder="ข้อความเพิ่มเติม (ถ้ามี)"
          value={customMsg}
          onChange={(e) => setCustomMsg(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
        />

        {/* Giant Red Button */}
        <div className="py-4">
          {countdown !== null ? (
            <div className="space-y-4">
              <div className="w-36 h-36 mx-auto rounded-full bg-red-600/30 border-4 border-red-500 flex items-center justify-center animate-ping">
                <span className="text-6xl font-black text-red-500">{countdown}</span>
              </div>
              <p className="text-sm font-semibold text-red-400">กำลังส่งสัญญาณ SOS ใน {countdown} วินาที...</p>
              <button
                onClick={handleCancelCountdown}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2 rounded-xl text-sm font-semibold border border-slate-700"
              >
                ยกเลิก (Cancel)
              </button>
            </div>
          ) : (
            <button
              onClick={handlePressSOS}
              className="w-48 h-48 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-black text-3xl shadow-2xl shadow-red-600/50 border-4 border-red-400 active:scale-95 transition transform flex flex-col items-center justify-center mx-auto space-y-1"
            >
              <ShieldAlert className="w-12 h-12" />
              <span>SOS</span>
              <span className="text-xs font-normal opacity-80">กดค้าง 1 วินาที</span>
            </button>
          )}
        </div>

        {sentAlert && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl text-left text-xs space-y-1">
            <p className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> ส่งสัญญาณเตือนล่าสุดแล้ว
            </p>
            <p className="text-slate-300">ID: {sentAlert.id} | ประเภท: {sentAlert.type}</p>
            <p className="text-slate-400">แจ้งเตือนผ่าน: {sentAlert.notifiedVia.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
