'use me'
'use client';

import React, { useState } from 'react';
import { BookOpen, CheckCircle, Award, ShieldAlert, GraduationCap, Video, FileText } from 'lucide-react';
import Swal from 'sweetalert2';

export default function TrainingMatrixPage() {
  const courses = [
    {
      id: 'CRS-001',
      title: 'ความปลอดภัยในการทำงานกับสารเคมีและวัตถุอันตราย (ISO 45001)',
      category: 'Safety',
      duration: '45 นาที',
      passingScore: 80,
      isMandatory: true,
      assignedCount: 40,
      passedCount: 36,
    },
    {
      id: 'CRS-002',
      title: 'มาตรฐานการเช็คอิน GPS และรายงานค่าเดินทาง SMARTO',
      category: 'Operations',
      duration: '20 นาที',
      passingScore: 100,
      isMandatory: true,
      assignedCount: 40,
      passedCount: 40,
    },
    {
      id: 'CRS-003',
      title: 'ทักษะการเป็นหัวหน้าทีม และการสื่อสารในโรงงาน',
      category: 'Soft Skill',
      duration: '60 นาที',
      passingScore: 75,
      isMandatory: false,
      assignedCount: 15,
      passedCount: 12,
    },
  ];

  const handleAssignCourse = (courseTitle: string) => {
    Swal.fire({
      title: 'มอบหมายหลักสูตรสำเร็จ',
      text: `ส่งข้อความแจ้งเตือนเข้าเรียน "${courseTitle}" ไปยังพนักงานเป้าหมายเรียบร้อยแล้ว`,
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
            <GraduationCap className="w-4 h-4" />
            <span>LMS & Skills Matrix</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            📚 Training & Skills Matrix Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            จัดการหลักสูตรอบรม บังคับเรียนนิคมอุตสาหกรรม และวัดผลการสอบรับใบรับรอง (Certificates)
          </p>
        </div>
      </div>

      {/* Course List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-indigo-500/40 transition">
            <div className="flex justify-between items-start">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                course.isMandatory ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {course.isMandatory ? 'บังคับเรียน (Mandatory)' : 'ทั่วไป'}
              </span>
              <span className="text-xs text-slate-400 font-mono">{course.category}</span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white leading-snug">{course.title}</h3>
              <p className="text-xs text-slate-400 mt-1">ระยะเวลา: {course.duration} | เกณฑ์ผ่าน: {course.passingScore}%</p>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">อัตราผ่านการอบรม:</span>
                <span className="text-emerald-400">{Math.round((course.passedCount / course.assignedCount) * 100)}% ({course.passedCount}/{course.assignedCount})</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${(course.passedCount / course.assignedCount) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => handleAssignCourse(course.title)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-xl text-sm transition"
            >
              มอบหมายผู้เรียนเพิ่ม
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
