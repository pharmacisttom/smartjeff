"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import {
  Activity,
  Search,
  ArrowLeft,
  RefreshCw,
  GitBranch,
  Play,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import Swal from "@/lib/swal";

interface BusinessEventRecord {
  id: string;
  eventId: string;
  eventType: string;
  eventVersion: number;
  aggregateType: string;
  aggregateId: string;
  occurredAt: string;
  processedAt: string | null;
  correlationId: string;
  causationId: string | null;
  payloadJson: string;
  metadataJson: string | null;
}

function EventExplorerContent() {
  const [events, setEvents] = useState<BusinessEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCorrelation, setSearchCorrelation] = useState("");
  const [searchEventType, setSearchEventType] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<BusinessEventRecord | null>(null);
  const [traceEvents, setTraceEvents] = useState<BusinessEventRecord[]>([]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchCorrelation) params.append("correlationId", searchCorrelation);
      if (searchEventType) params.append("eventType", searchEventType);
      params.append("limit", "50");

      const res = await fetch(`/api/automation/events?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
        if (data.events.length > 0 && !selectedEvent) {
          setSelectedEvent(data.events[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleTraceCorrelation = async (correlationId: string) => {
    setSearchCorrelation(correlationId);
    try {
      const res = await fetch(`/api/automation/events?correlationId=${correlationId}`);
      const data = await res.json();
      if (data.success) {
        setTraceEvents(data.events);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplay = async (event: BusinessEventRecord) => {
    const isFinancial = ["PAYMENT_COMPLETED", "PAYROLL_APPROVED", "INVOICE_ISSUED"].includes(event.eventType);

    const result = await Swal.fire({
      title: `Replay Event: ${event.eventType}?`,
      text: isFinancial
        ? "คำเตือน: นี่คือเหตุการณ์ทางการเงินสำคัญ แนะนำให้ทดสอบด้วย DRY_RUN ก่อน"
        : "ต้องการจำลอง Replay หรือยิงเข้า Event Bus จริง?",
      icon: isFinancial ? "warning" : "question",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "ยิงจริง (ACTUAL)",
      denyButtonText: "จำลอง (DRY_RUN)",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: isFinancial ? "#e11d48" : "#4f46e5",
      denyButtonColor: "#0284c7",
    });

    if (result.isConfirmed || result.isDenied) {
      const mode = result.isConfirmed ? "ACTUAL" : "DRY_RUN";
      try {
        const res = await fetch(`/api/automation/events/${event.id}/replay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, adminConfirmed: result.isConfirmed }),
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire({
            icon: "success",
            title: `Replay (${mode}) สำเร็จ`,
            text: data.message,
          });
          fetchEvents();
        } else {
          Swal.fire({ icon: "error", title: "Replay ไม่สำเร็จ", text: data.error });
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
              <Activity className="w-6 h-6 text-cyan-400" />
              <span>Event Store Explorer & Correlation Trace</span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              ติดตามบันทึกเหตุการณ์ (Immutable Audit Log) เชื่อมโยงต้นสาย-ปลายสายด้วย Correlation ID
            </p>
          </div>
        </div>

        <button
          id="btn-refresh-events"
          onClick={fetchEvents}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          <span>รีเฟรชเหตุการณ์</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหา Correlation ID (เช่น po_corr_123)..."
            value={searchCorrelation}
            onChange={(e) => setSearchCorrelation(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Filter Event Type..."
            value={searchEventType}
            onChange={(e) => setSearchEventType(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <button
          onClick={fetchEvents}
          className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition"
        >
          ค้นหา
        </button>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events Table / List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 font-semibold text-xs text-slate-400 uppercase tracking-wider flex justify-between">
              <span>Event Record</span>
              <span>Occurred At</span>
            </div>
            <div className="divide-y divide-slate-800/60 max-h-[650px] overflow-y-auto">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-4 cursor-pointer transition flex items-center justify-between ${
                    selectedEvent?.id === evt.id ? "bg-cyan-950/30 border-l-4 border-cyan-500" : "hover:bg-slate-900/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">{evt.eventType}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {evt.aggregateType}:{evt.aggregateId}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                      <span className="font-mono text-[11px] text-slate-500">ID: {evt.eventId}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTraceCorrelation(evt.correlationId);
                        }}
                        className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <GitBranch className="w-3 h-3" />
                        <span>Trace ({evt.correlationId.substring(0, 16)}...)</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-mono">
                      {new Date(evt.occurredAt).toLocaleTimeString()}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        evt.processedAt ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                      }`}
                    >
                      {evt.processedAt ? "PROCESSED" : "PENDING"}
                    </span>
                  </div>
                </div>
              ))}

              {events.length === 0 && !loading && (
                <div className="p-8 text-center text-slate-500 text-sm">ไม่พบ Event ในระบบ</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Event Detail & Payload */}
        <div className="space-y-4">
          {selectedEvent ? (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-white">Event Envelope</h3>
                <button
                  id="btn-replay-event"
                  onClick={() => handleReplay(selectedEvent)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Replay Event</span>
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Event Type:</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedEvent.eventType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Correlation ID:</span>
                  <span className="font-mono text-slate-300 break-all">{selectedEvent.correlationId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Occurred At:</span>
                  <span className="font-mono text-slate-300">{new Date(selectedEvent.occurredAt).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Payload JSON
                </span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-60 overflow-y-auto">
                  {JSON.stringify(JSON.parse(selectedEvent.payloadJson), null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-900/20 border border-dashed border-slate-800 text-slate-500 text-sm">
              เลือก Event จากรายการเพื่อดูรายละเอียด Payload
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventExplorerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-400 p-8">Loading Event Explorer...</div>}>
      <EventExplorerContent />
    </Suspense>
  );
}
