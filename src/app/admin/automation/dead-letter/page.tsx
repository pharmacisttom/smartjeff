"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  ArrowLeft,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Code,
  ShieldCheck,
} from "lucide-react";
import Swal from "@/lib/swal";

interface DeadLetterJobItem {
  id: string;
  queueName: string;
  jobName: string;
  eventId: string | null;
  payloadJson: string;
  reason: string;
  errorMessage: string | null;
  stackTrace: string | null;
  retryCount: number;
  status: "OPEN" | "RETRIED" | "DISMISSED";
  dismissedBy: string | null;
  dismissedReason: string | null;
  createdAt: string;
}

export default function DeadLetterQueuePage() {
  const [jobs, setJobs] = useState<DeadLetterJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<DeadLetterJobItem | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/automation/dead-letter");
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
        if (data.jobs.length > 0 && !selectedJob) {
          setSelectedJob(data.jobs[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleRetry = async (jobId: string) => {
    try {
      const res = await fetch(`/api/automation/dead-letter/${jobId}/retry`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: "success", title: "ส่ง Re-queue เรียบร้อย", text: data.message, timer: 1500, showConfirmButton: false });
        fetchJobs();
      } else {
        Swal.fire({ icon: "error", title: "ไม่สามารถ Retry ได้", text: data.error });
      }
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    }
  };

  const handleDismiss = async (jobId: string) => {
    const { value: reason } = await Swal.fire({
      title: "ยกเลิก / ปิดงาน DLQ (Dismiss)",
      text: "ตามข้อกำหนดความปลอดภัย ต้องระบุเหตุผลในการ Dismiss เพื่อการตรวจสอบ (Audit Trail)",
      input: "textarea",
      inputPlaceholder: "ระบุเหตุผล เช่น ได้แก้ไขข้อมูลที่ปลายทางแล้ว...",
      inputValidator: (val) => {
        if (!val || val.trim().length < 5) {
          return "กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร";
        }
      },
      showCancelButton: true,
      confirmButtonText: "ยืนยัน Dismiss",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#e11d48",
    });

    if (reason) {
      try {
        const res = await fetch(`/api/automation/dead-letter/${jobId}/dismiss`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason, dismissedBy: "Administrator" }),
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire({ icon: "success", title: "Dismiss เรียบร้อย", timer: 1500, showConfirmButton: false });
          fetchJobs();
        } else {
          Swal.fire({ icon: "error", title: "Dismiss ไม่สำเร็จ", text: data.error });
        }
      } catch (err: any) {
        Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/automation"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-6 h-6 text-rose-500" />
              <span>Dead Letter Queue (DLQ) Management</span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              ศูนย์ตรวจสอบและกู้คืนงานที่ Retry ครบกำหนดหรือเกิดความล้มเหลวร้ายแรง
            </p>
          </div>
        </div>

        <button
          onClick={fetchJobs}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-rose-400" : ""}`} />
          <span>รีเฟรชคิว</span>
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 font-semibold text-xs text-slate-400 uppercase tracking-wider flex justify-between">
              <span>Dead Letter Jobs</span>
              <span>Status / Retry</span>
            </div>
            <div className="divide-y divide-slate-800/60 max-h-[650px] overflow-y-auto">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-4 cursor-pointer transition flex items-center justify-between ${
                    selectedJob?.id === job.id ? "bg-rose-950/30 border-l-4 border-rose-500" : "hover:bg-slate-900/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">{job.jobName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {job.queueName}
                      </span>
                    </div>
                    <p className="text-xs text-rose-400/90 mt-1 line-clamp-1">{job.errorMessage || job.reason}</p>
                    <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                      {new Date(job.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        job.status === "OPEN"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : job.status === "RETRIED"
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {job.status}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">Retries: {job.retryCount}</span>
                  </div>
                </div>
              ))}

              {jobs.length === 0 && !loading && (
                <div className="p-12 text-center text-slate-500 text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                  ไม่มีงานค้างใน Dead Letter Queue (ระบบทำงานสมบูรณ์)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Job Inspect Drawer */}
        <div className="space-y-4">
          {selectedJob ? (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-white">Job Diagnostics</h3>
                {selectedJob.status === "OPEN" && (
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-retry-job"
                      onClick={() => handleRetry(selectedJob.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                    <button
                      id="btn-dismiss-job"
                      onClick={() => handleDismiss(selectedJob.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition shadow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Dismiss</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Queue:</span>
                  <span className="font-mono text-slate-200">{selectedJob.queueName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Reason:</span>
                  <span className="font-mono text-rose-400 font-semibold">{selectedJob.reason}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Error Message:</span>
                  <span className="text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-800 block mt-1 font-mono">
                    {selectedJob.errorMessage || "N/A"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Payload
                </span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto">
                  {JSON.stringify(JSON.parse(selectedJob.payloadJson), null, 2)}
                </pre>
              </div>

              {selectedJob.stackTrace && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Stack Trace
                  </span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-rose-400/80 max-h-40 overflow-y-auto">
                    {selectedJob.stackTrace}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-900/20 border border-dashed border-slate-800 text-slate-500 text-sm">
              เลือก Dead Letter Job เพื่อตรวจสอบ Error
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
