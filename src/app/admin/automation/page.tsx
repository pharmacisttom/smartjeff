"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Zap,
  GitMerge,
  Radio,
  AlertOctagon,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Server,
  Clock,
  Layers,
  Webhook,
} from "lucide-react";
import Swal from "@/lib/swal";

interface HealthData {
  status: "HEALTHY" | "DEGRADED" | "CRITICAL";
  timestamp: string;
  provider: string;
  metrics: {
    eventsToday: number;
    outboxPending: number;
    outboxFailed: number;
    dlqOpenCount: number;
    activeWorkflows: number;
    activeRules: number;
    activeWebhooks: number;
    activeSchedules: number;
  };
}

export default function AutomationCommandCenterPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/automation/health");
      const data = await res.json();
      if (data.success) {
        setHealth(data.health);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // 10s live poll
    return () => clearInterval(interval);
  }, []);

  const triggerProcessOutbox = async () => {
    try {
      const res = await fetch("/api/automation/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "SYSTEM_HEARTBEAT_CHECK",
          domain: "SYSTEM",
          aggregateType: "WORKER",
          aggregateId: "manual_trigger",
          payload: { initiatedBy: "Admin Command Center", time: new Date().toISOString() },
        }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "บันทึกและส่งเข้า Outbox เรียบร้อย",
          text: `Event ID: ${data.event.eventId}`,
          timer: 2000,
          showConfirmButton: false,
        });
        fetchHealth();
      }
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                Enterprise Automation & Workflow Orchestrator
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                ระบบจัดการ Event-Driven, Outbox Pattern, Workflow Engine, Deterministic Rules และ Integration Hub
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-refresh-telemetry"
            onClick={fetchHealth}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>
          <button
            id="btn-trigger-heartbeat"
            onClick={triggerProcessOutbox}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/20 transition"
          >
            <Radio className="w-4 h-4" />
            <span>ทดสอบยิง Event สด</span>
          </button>
        </div>
      </div>

      {/* Health Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Platform Status</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                health?.status === "HEALTHY"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : health?.status === "DEGRADED"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {health?.status || "CHECKING"}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{health?.provider || "In-Memory Bus"}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Active Queue & Event Dispatcher</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Events Today</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400">{health?.metrics.eventsToday ?? 0}</span>
            <span className="text-xs text-slate-400">events recorded</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Audit Trail & Event Store</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Transactional Outbox</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{health?.metrics.outboxPending ?? 0}</span>
            <span className="text-xs text-slate-400">pending queue</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Failed retrying: {health?.metrics.outboxFailed ?? 0}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dead Letter Queue</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${health?.metrics.dlqOpenCount ? "text-rose-400" : "text-slate-200"}`}>
              {health?.metrics.dlqOpenCount ?? 0}
            </span>
            <span className="text-xs text-slate-400">open dead jobs</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Requires manual inspection or dismiss</p>
        </div>
      </div>

      {/* Main Feature Navigation Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Workflows */}
        <Link
          href="/admin/automation/workflows"
          className="group p-6 rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-900/40 border border-slate-800 hover:border-indigo-500/50 transition duration-300 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition">
              <GitMerge className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              {health?.metrics.activeWorkflows ?? 0} Active
            </span>
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition">
            Workflow Engine & Orchestrator
          </h3>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            สร้าง ออกแบบ และเผยแพร่ Workflow แบบ Multi-Step รองรับเงื่อนไข Action ปลอดภัยโดยปราศจาก eval()
          </p>
          <div className="mt-6 flex items-center text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition">
            <span>จัดการ Workflows</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </div>
        </Link>

        {/* Event Explorer */}
        <Link
          href="/admin/automation/events"
          className="group p-6 rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-900/40 border border-slate-800 hover:border-cyan-500/50 transition duration-300 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 group-hover:scale-110 transition">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
              Correlation Trace
            </span>
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition">
            Event Explorer & Trace
          </h3>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            สืบค้นเหตุการณ์ทั้งหมดในองค์กร ค้นหาด้วย Correlation ID ตรวจสอบความถูกต้องและ Replay อย่างปลอดภัย
          </p>
          <div className="mt-6 flex items-center text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition">
            <span>ตรวจสอบ Event Store</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </div>
        </Link>

        {/* Webhook & n8n Integration */}
        <Link
          href="/admin/integrations/webhooks"
          className="group p-6 rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-900/40 border border-slate-800 hover:border-emerald-500/50 transition duration-300 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition">
              <Webhook className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              n8n Ready
            </span>
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">
            Webhook & Integration Hub
          </h3>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            เชื่อมต่อ Webhook ภายนอกด้วย HMAC-SHA256, ป้องกัน SSRF, จัดการ Scoped API Keys สำหรับ n8n
          </p>
          <div className="mt-6 flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition">
            <span>ตั้งค่า Integrations</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </div>
        </Link>
      </div>

      {/* Architecture & Reliability Blueprint */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Core Operational Guarantees (Phase 23 Architecture)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <h4 className="font-semibold text-slate-200 mb-1">Transactional Outbox</h4>
            <p>
              ข้อมูลธุรกิจหลักจะถูกเขียนลง Database พร้อม Event เสมอ ป้องกันสถานะ Transaction ไม่ตรงกับ Event Bus
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <h4 className="font-semibold text-slate-200 mb-1">Failure Isolation</h4>
            <p>
              หากบริการภายนอก เช่น Telegram หรือ Webhook เกิด Downtime ระบบลงเวลาและธุรกรรมหลักจะไม่มีวันล้มเหลว
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <h4 className="font-semibold text-slate-200 mb-1">Idempotent Consumer</h4>
            <p>
              ระบบบันทึก ProcessedEvent ป้องกันการประมวลผลซ้ำ แม้ว่าจะมีการ Retry จากคิวหรือ Replay เหตุการณ์
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
