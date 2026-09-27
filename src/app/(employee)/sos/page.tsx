'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  PhoneCall,
  ShieldAlert,
  CheckCircle,
  XCircle,
  MapPin,
  Flame,
  HeartPulse,
  Car,
  ShieldCheck,
  Radio,
  Clock,
  ExternalLink,
} from 'lucide-react';
import Swal from 'sweetalert2';

export type EmergencyType = 'SOS' | 'ACCIDENT' | 'MEDICAL' | 'FIRE' | 'SECURITY';

const EMERGENCY_TYPES: { id: EmergencyType; label: string; sublabel: string; icon: any; color: string }[] = [
  { id: 'SOS', label: 'ฉุกเฉินทั่วไป', sublabel: 'General SOS', icon: ShieldAlert, color: 'from-red-600 to-rose-600' },
  { id: 'ACCIDENT', label: 'อุบัติเหตุโรงงาน', sublabel: 'Factory Accident', icon: Car, color: 'from-amber-600 to-orange-600' },
  { id: 'MEDICAL', label: 'เจ็บป่วยฉุกเฉิน', sublabel: 'Medical Emergency', icon: HeartPulse, color: 'from-emerald-600 to-teal-600' },
  { id: 'FIRE', label: 'เพลิงไหม้ / สารเคมี', sublabel: 'Fire / Chemical', icon: Flame, color: 'from-orange-600 to-red-600' },
  { id: 'SECURITY', label: 'ความปลอดภัย', sublabel: 'Security Threat', icon: ShieldCheck, color: 'from-purple-600 to-indigo-600' },
];

export default function EmployeeSOSPage() {
  const [session, setSession] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<EmergencyType>('SOS');
  const [customMsg, setCustomMsg] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentAlert, setSentAlert] = useState<any | null>(null);

  // 1. Fetch current authenticated session
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        }
      } catch (e) {
        console.error('Error fetching session:', e);
      }
    }
    loadSession();
  }, []);

  // 2. Fetch live GPS coordinates
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          setGpsLoading(false);
        },
        (err) => {
          console.warn('Geolocation warning:', err);
          // Fallback to default Rayong Maptaphut coordinates
          setCoords({
            lat: 12.6828,
            lng: 101.2813,
            accuracy: 100,
          });
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setCoords({ lat: 12.6828, lng: 101.2813 });
      setGpsLoading(false);
    }
  }, []);

  const handleConfirmSOS = useCallback(async () => {
    if (!coords) return;
    setSending(true);

    try {
      const payload = {
        type: selectedType,
        lat: coords.lat,
        lng: coords.lng,
        accuracy: coords.accuracy,
        message: customMsg.trim() || undefined,
        siteId: session?.employee?.siteId || undefined,
        address: session?.employee?.site?.name
          ? `โรงงาน ${session.employee.site.name} (${session.employee.site.code})`
          : undefined,
      };

      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSentAlert(data.incident);
        Swal.fire({
          title: '🚨 ส่งสัญญาณ SOS เรียบร้อยแล้ว!',
          html: `
            <div class="text-left text-sm space-y-2 p-2">
              <p><b>รหัสแจ้งเหตุ:</b> <span class="text-red-400 font-mono">${data.incident.refNo}</span></p>
              <p><b>ผู้แจ้งเหตุ:</b> ${data.incident.employeeName}</p>
              <p><b>ประเภทเหตุ:</b> <span class="text-amber-300 font-bold">${selectedType}</span></p>
              <p><b>พิกัด GPS:</b> ${data.incident.lat.toFixed(5)}, ${data.incident.lng.toFixed(5)}</p>
              <div class="p-3 bg-red-950/60 border border-red-500/40 rounded-xl mt-3 text-red-200">
                <p class="font-bold flex items-center gap-1.5">
                  <span class="animate-ping inline-block w-2 h-2 rounded-full bg-red-400"></span>
                  ระบบได้แจ้งเตือนผู้บริหารและฝ่ายความปลอดภัยทันที
                </p>
                <p class="text-xs text-red-300 mt-1">กรุณารอการติดต่อกลับ หรือโทรสายด่วนหากจำเป็นเร่งด่วน</p>
              </div>
            </div>
          `,
          icon: 'warning',
          background: '#0f172a',
          color: '#ffffff',
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'รับทราบ (OK)',
        });
      } else {
        Swal.fire({
          title: 'เกิดข้อผิดพลาดในการส่งสัญญาณ',
          text: data.error || 'กรุณาลองใหม่อีกครั้ง หรือโทรสายด่วนฉุกเฉิน 1669',
          icon: 'error',
          background: '#0f172a',
          color: '#ffffff',
        });
      }
    } catch (e: any) {
      console.error(e);
      Swal.fire({
        title: 'การเชื่อมต่อขัดข้อง',
        text: 'กรุณาโทรตรงสายด่วนฉุกเฉิน 1669 หรือเบอร์โรงงานทันที',
        icon: 'error',
        background: '#0f172a',
        color: '#ffffff',
      });
    } finally {
      setSending(false);
    }
  }, [coords, selectedType, customMsg, session]);

  // Countdown timer logic
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
  }, [countdown, handleConfirmSOS]);

  const handlePressSOS = () => {
    setCountdown(5);
  };

  const handleCancelCountdown = () => {
    setCountdown(null);
  };

  const employeeName = session?.employee
    ? `${session.employee.prefix || ''} ${session.employee.firstName} ${session.employee.lastName}`.trim()
    : session?.user?.name || session?.email || 'พนักงาน';

  const siteName = session?.employee?.site?.name || 'นิคมอุตสาหกรรมมาบตาพุด / ระยอง';

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-6 text-slate-100 flex flex-col justify-between">
      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* Header Banner */}
        <div className="bg-slate-900/90 p-5 rounded-3xl border border-red-500/30 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse text-red-400" />
              SmartJeff Emergency SOS
            </span>
            <span className="text-xs text-slate-400 font-mono">24/7 Response</span>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
              🚨 แจ้งเหตุฉุกเฉินด่วน
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              กดปุ่ม SOS เพื่อส่งพิกัด GPS อัตโนมัติและแจ้งเตือนด่วนไปยังศูนย์บัญชาการและผู้บริหารทันที
            </p>
          </div>

          {/* User & Site Info */}
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60 flex items-center justify-between text-xs">
            <div>
              <p className="text-slate-400">ผู้แจ้งเหตุ:</p>
              <p className="text-white font-bold">{employeeName}</p>
              <p className="text-slate-400 text-[11px]">{siteName}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400">พิกัด GPS ปัจจุบัน:</p>
              {gpsLoading ? (
                <p className="text-amber-400 animate-pulse font-mono">กำลังค้นหาสัญญาณ GPS...</p>
              ) : coords ? (
                <p className="text-emerald-400 font-mono font-semibold">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                  <span className="block text-[10px] text-slate-400">
                    ความแม่นยำ ±{Math.round(coords.accuracy || 10)}m
                  </span>
                </p>
              ) : (
                <p className="text-rose-400">GPS ปิดอยู่</p>
              )}
            </div>
          </div>

          {/* Emergency Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              เลือกประเภทเหตุการณ์ฉุกเฉิน:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EMERGENCY_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = selectedType === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedType(t.id)}
                    type="button"
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? `bg-gradient-to-br ${t.color} text-white border-white/40 shadow-lg scale-[1.02]`
                        : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-2" />
                    <div>
                      <div className="text-xs font-bold leading-tight">{t.label}</div>
                      <div className="text-[10px] opacity-75">{t.sublabel}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ข้อความรายละเอียดเพิ่มเติม (ถ้ามีเวลาพิมพ์):
            </label>
            <input
              type="text"
              placeholder="ระบุจุดเกิดเหตุหรืออาการเบื้องต้น เช่น ล้มในไลน์ผลิต, ช็อตไฟฟ้า, ไฟไหม้ตู้ไฟ"
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Giant SOS Button */}
          <div className="py-6 text-center">
            {countdown !== null ? (
              <div className="space-y-4">
                <div className="w-40 h-40 mx-auto rounded-full bg-red-600/30 border-4 border-red-500 flex items-center justify-center animate-pulse shadow-2xl shadow-red-600/50">
                  <span className="text-7xl font-black text-red-500">{countdown}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-red-400">
                    🚨 กำลังส่งสัญญาณ SOS ใน {countdown} วินาที...
                  </p>
                  <p className="text-xs text-slate-400">กดปุ่มยกเลิกด้านล่างหากกดโดยไม่ได้ตั้งใจ</p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelCountdown}
                  className="bg-slate-800 hover:bg-slate-700 text-rose-300 px-8 py-3 rounded-2xl text-sm font-bold border border-rose-500/40 shadow-lg active:scale-95 transition"
                >
                  <XCircle className="w-4 h-4 inline mr-1.5" />
                  ยกเลิกการส่งสัญญาณ (Cancel)
                </button>
              </div>
            ) : sending ? (
              <div className="space-y-3">
                <div className="w-44 h-44 rounded-full bg-red-600/40 border-4 border-red-500 animate-spin flex items-center justify-center mx-auto">
                  <Radio className="w-12 h-12 text-white" />
                </div>
                <p className="text-sm font-bold text-red-400">กำลังติดต่อศูนย์รับแจ้งเหตุ...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handlePressSOS}
                  className="w-48 h-48 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-400 text-white font-black text-3xl shadow-2xl shadow-red-600/60 border-4 border-red-300 active:scale-95 transition-all transform flex flex-col items-center justify-center mx-auto space-y-1 group"
                >
                  <ShieldAlert className="w-14 h-14 group-hover:scale-110 transition" />
                  <span className="tracking-wider">SOS</span>
                  <span className="text-[11px] font-medium opacity-90 bg-black/20 px-2.5 py-0.5 rounded-full">
                    แตะเพื่อขอความช่วยเหลือ
                  </span>
                </button>
                <p className="text-[11px] text-slate-400">มีเวลานับถอยหลัง 5 วินาทีก่อนส่งสัญญาณจริง</p>
              </div>
            )}
          </div>

          {/* Active Sent Alert Status */}
          {sentAlert && (
            <div className="bg-emerald-950/50 border border-emerald-500/40 p-4 rounded-2xl text-left text-xs space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
                  <CheckCircle className="w-4 h-4" /> ส่งสัญญาณเตือนล่าสุดสำเร็จ
                </p>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono text-[11px]">
                  {sentAlert.refNo}
                </span>
              </div>
              <p className="text-slate-300">
                สถานะ: <span className="font-semibold text-amber-300">{sentAlert.status}</span> | ประเภท: {sentAlert.type}
              </p>
              <p className="text-slate-400">
                ระบบได้แจ้งเตือนทีมผู้บริหารและฝ่ายบุคคลทันที พร้อมพิกัดดาวเทียม
              </p>
            </div>
          )}
        </div>

        {/* Emergency Hotlines Shortcut */}
        <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            สายด่วนฉุกเฉินภายนอก (One-Touch Direct Call)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <a
              href="tel:1669"
              className="p-3 bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 rounded-2xl text-center transition flex flex-col items-center justify-center space-y-1"
            >
              <HeartPulse className="w-5 h-5 text-red-400" />
              <div className="text-lg font-black text-white">1669</div>
              <div className="text-[10px] text-slate-300">การแพทย์ฉุกเฉิน</div>
            </a>
            <a
              href="tel:191"
              className="p-3 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 rounded-2xl text-center transition flex flex-col items-center justify-center space-y-1"
            >
              <ShieldAlert className="w-5 h-5 text-blue-400" />
              <div className="text-lg font-black text-white">191</div>
              <div className="text-[10px] text-slate-300">เหตุด่วนเหตุร้าย</div>
            </a>
            <a
              href="tel:199"
              className="p-3 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 rounded-2xl text-center transition flex flex-col items-center justify-center space-y-1"
            >
              <Flame className="w-5 h-5 text-amber-400" />
              <div className="text-lg font-black text-white">199</div>
              <div className="text-[10px] text-slate-300">ดับเพลิง / สารเคมี</div>
            </a>
            <a
              href="tel:038000000"
              className="p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-2xl text-center transition flex flex-col items-center justify-center space-y-1"
            >
              <PhoneCall className="w-5 h-5 text-emerald-400" />
              <div className="text-base font-bold text-white">หัวหน้ากะ</div>
              <div className="text-[10px] text-slate-300">ศูนย์ความปลอดภัย</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
