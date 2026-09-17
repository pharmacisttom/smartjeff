'use me'
'use client';

import React, { useState } from 'react';
import { Award, Cake, Heart, Megaphone, Star, Trophy, Users } from 'lucide-react';
import Swal from 'sweetalert2';

export default function EngagementDashboardPage() {
  const [announcement, setAnnouncement] = useState('');

  const birthdays = [
    { name: 'สมชาย สายซิ่ง', dept: 'ฝ่ายปฏิบัติการ', birthDate: '18 ก.ย.', age: 29 },
    { name: 'วิภา ตรงเวลา', dept: 'ฝ่ายบัญชี/HR', birthDate: '22 ก.ย.', age: 31 },
  ];

  const employeeOfMonth = {
    name: 'กิตติศักดิ์ พรหมมี',
    role: 'หัวหน้าช่างเทคนิค นิคมมาบตาพุด',
    score: 98.5,
    votes: 42,
    award: '฿5,000 + เข็มเชิดชูเกียรติ',
  };

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement) return;
    Swal.fire({
      title: 'กระจายประกาศเรียบร้อยแล้ว!',
      text: 'ส่งประกาศไปยังแอปพลิเคชันพนักงาน และ LINE OA อัตโนมัติ',
      icon: 'success',
      confirmButtonColor: '#4f46e5',
      background: '#0f172a',
      color: '#fff',
    });
    setAnnouncement('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-pink-400 font-semibold text-sm">
            <Heart className="w-4 h-4" />
            <span>Employee Engagement & Culture</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            🎉 Engagement & Recognition Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            บริหารความผูกพันพนักงาน อวยพรวันเกิด ครบรอบการทำงาน และ Employee of the Month
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee of the month hero */}
        <div className="lg:col-span-2 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 p-6 rounded-2xl border border-amber-500/30 shadow-2xl relative overflow-hidden space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Trophy className="w-4 h-4" />
            <span>Employee of the Month (กันยายน 2569)</span>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 flex items-center justify-center shadow-xl">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-black text-2xl text-amber-400">
                KP
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">{employeeOfMonth.name}</h2>
              <p className="text-sm text-slate-300 mt-0.5">{employeeOfMonth.role}</p>
              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-bold">
                  คะแนนประเมิน: {employeeOfMonth.score}/100
                </span>
                <span className="text-slate-400">โหวตจากเพื่อนร่วมงาน: {employeeOfMonth.votes} เสียง</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-sm font-semibold">
            <span className="text-slate-400">รางวัลประจำเดือน:</span>
            <span className="text-emerald-400">{employeeOfMonth.award}</span>
          </div>
        </div>

        {/* Announcement Publisher */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-400" />
            ส่งประกาศถึงพนักงานทุกคน
          </h2>

          <form onSubmit={handlePublishAnnouncement} className="space-y-3">
            <textarea
              rows={4}
              placeholder="พิมพ์ข้อความประกาศบริษัท..."
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-lg shadow-indigo-600/30"
            >
              กระจายประกาศ (Publish)
            </button>
          </form>
        </div>
      </div>

      {/* Birthdays Section */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Cake className="w-5 h-5 text-pink-400" />
          วันเกิดพนักงานในสัปดาห์นี้ (Upcoming Birthdays)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {birthdays.map((b, i) => (
            <div key={i} className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">{b.name}</h3>
                <p className="text-xs text-slate-400">{b.dept} • ครบรอบ {b.age} ปี</p>
              </div>
              <span className="px-3 py-1 bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-full text-xs font-bold">
                🎂 {b.birthDate}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
