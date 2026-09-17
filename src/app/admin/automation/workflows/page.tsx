"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  GitMerge,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Settings,
  Terminal,
  ShieldAlert,
  Search,
} from "lucide-react";
import Swal from "@/lib/swal";

interface WorkflowItem {
  id: string;
  code: string;
  name: string;
  domain: string;
  version: number;
  triggerType: string;
  triggerEvent: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "DEPRECATED";
  criticality: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string | null;
  definitionJson: string;
  updatedAt: string;
}

export default function WorkflowsManagementPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);
  const [simulationPayload, setSimulationPayload] = useState(
    JSON.stringify({ attendanceId: "att_001", deficit: 4, severity: "HIGH" }, null, 2)
  );
  const [simulating, setSimulating] = useState(false);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/automation/workflows");
      const data = await res.json();
      if (data.success) {
        setWorkflows(data.workflows);
        if (data.workflows.length > 0 && !selectedWorkflow) {
          setSelectedWorkflow(data.workflows[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handlePublish = async (id: string) => {
    const confirm = await Swal.fire({
      title: "ยืนยันการเผยแพร่ Workflow?",
      text: "Workflow จะเปลี่ยนสถานะเป็น ACTIVE และเริ่มรับ Trigger จากระบบ",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "เผยแพร่",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#4f46e5",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`/api/automation/workflows/${id}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approvedBy: "Administrator", changeReason: "Manual verification passed" }),
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire({ icon: "success", title: "เผยแพร่เรียบร้อย", timer: 1500, showConfirmButton: false });
          fetchWorkflows();
        } else {
          Swal.fire({
            icon: "error",
            title: "ไม่สามารถเผยแพร่ได้",
            html: (data.errors || [data.error]).map((e: string) => `• ${e}`).join("<br>"),
          });
        }
      } catch (err: any) {
        Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
      }
    }
  };

  const handleCreateDefaultWorkflow = async () => {
    try {
      const newWf = {
        code: `WF_ATTENDANCE_GAP_${Date.now().toString().slice(-4)}`,
        name: "มาตรการรับมือกำลังพลขาดแคลนกะดึก",
        domain: "WORKFORCE",
        triggerType: "EVENT",
        triggerEvent: "WORKFORCE_GAP_DETECTED",
        criticality: "HIGH",
        description: "ตรวจสอบช่องว่างกำลังพล หากขาดเกิน 3 คน ให้ส่ง Alert และสร้างภารกิจจัดหาคนด่วน",
        definitionJson: {
          startStepId: "step_check_gap",
          steps: [
            {
              id: "step_check_gap",
              name: "ตรวจสอบจำนวนที่ขาดแคลน",
              stepType: "CONDITION",
              condition: { field: "deficit", operator: "GREATER_THAN", value: 3 },
              onTrueStepId: "step_create_alert",
              onFalseStepId: "step_end",
            },
            {
              id: "step_create_alert",
              name: "สร้าง Critical Alert",
              stepType: "ACTION",
              actionType: "CREATE_ALERT",
              config: { title: "กำลังพลขาดแคลนวิกฤต", severity: "HIGH" },
              nextStepId: "step_send_notif",
            },
            {
              id: "step_send_notif",
              name: "แจ้งเตือน Site Manager",
              stepType: "ACTION",
              actionType: "SEND_NOTIFICATION",
              config: { channel: "IN_APP", message: "ตรวจพบกำลังพลขาดแคลนหน้างาน กรุณาจัดหาคนเสริม" },
              nextStepId: "step_end",
            },
            {
              id: "step_end",
              name: "สิ้นสุดขั้นตอน",
              stepType: "END",
            },
          ],
        },
      };

      const res = await fetch("/api/automation/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWf),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: "success", title: "สร้าง Workflow สำเร็จ", timer: 1500, showConfirmButton: false });
        fetchWorkflows();
      }
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    }
  };

  const filteredWorkflows = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.code.toLowerCase().includes(search.toLowerCase()) ||
      w.domain.toLowerCase().includes(search.toLowerCase())
  );

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
              <GitMerge className="w-6 h-6 text-indigo-400" />
              <span>Workflow Orchestration Engine</span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              ออกแบบขั้นตอนอัตโนมัติ (Multi-step), เงื่อนไข (Rule Branching) และ Action ที่ได้รับการอนุมัติ
            </p>
          </div>
        </div>

        <button
          id="btn-create-workflow"
          onClick={handleCreateDefaultWorkflow}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>สร้าง Workflow ใหม่</span>
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Workflow List */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหา Workflow ด้วยชื่อ, รหัส, โดเมน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[700px] pr-1">
            {filteredWorkflows.map((wf) => (
              <div
                key={wf.id}
                onClick={() => setSelectedWorkflow(wf)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedWorkflow?.id === wf.id
                    ? "bg-indigo-950/40 border-indigo-500/50 shadow-md"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-slate-400">{wf.code}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        wf.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {wf.status}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">v{wf.version}</span>
                  </div>
                </div>

                <h4 className="font-semibold text-sm text-slate-200 mt-2">{wf.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{wf.description || "ไม่มีรายละเอียด"}</p>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
                  <span>Trigger: {wf.triggerEvent || "Manual"}</span>
                  <span className="uppercase text-indigo-400 font-semibold">{wf.domain}</span>
                </div>
              </div>
            ))}

            {filteredWorkflows.length === 0 && !loading && (
              <div className="text-center py-10 text-slate-500 text-sm">ไม่พบ Workflow ตามเงื่อนไขค้นหา</div>
            )}
          </div>
        </div>

        {/* Right: Selected Workflow Visualizer & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {selectedWorkflow ? (
            <>
              {/* Detail Header Card */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white">{selectedWorkflow.name}</h2>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {selectedWorkflow.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{selectedWorkflow.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {selectedWorkflow.status === "DRAFT" && (
                      <button
                        id="btn-publish-wf"
                        onClick={() => handlePublish(selectedWorkflow.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>เผยแพร่ (Publish)</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-800 text-slate-400">
                  <div>
                    <span className="text-slate-500">Domain:</span> <span className="font-semibold text-slate-300">{selectedWorkflow.domain}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Trigger Event:</span>{" "}
                    <span className="font-semibold text-cyan-400">{selectedWorkflow.triggerEvent || "Manual"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Criticality:</span>{" "}
                    <span className="font-semibold text-amber-400">{selectedWorkflow.criticality}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Status:</span>{" "}
                    <span className="font-semibold text-emerald-400">{selectedWorkflow.status}</span>
                  </div>
                </div>
              </div>

              {/* Step Sequence Visualizer */}
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-400" />
                  <span>ลำดับขั้นตอนการทำงาน (Structured Step Pipeline)</span>
                </h3>

                <div className="space-y-3">
                  {(() => {
                    try {
                      const def = JSON.parse(selectedWorkflow.definitionJson);
                      return def.steps.map((step: any, index: number) => (
                        <div
                          key={step.id}
                          className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-4"
                        >
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-slate-200">{step.name}</h4>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                                {step.stepType}
                              </span>
                            </div>
                            {step.stepType === "CONDITION" && step.condition && (
                              <p className="text-xs text-amber-400/90 mt-1 font-mono">
                                IF {step.condition.field} {step.condition.operator} {String(step.condition.value)}
                              </p>
                            )}
                            {step.stepType === "ACTION" && (
                              <p className="text-xs text-emerald-400/90 mt-1 font-mono">
                                EXECUTE: {step.actionType} ({JSON.stringify(step.config)})
                              </p>
                            )}
                          </div>
                        </div>
                      ));
                    } catch {
                      return <p className="text-xs text-rose-400">Definition JSON parsing error</p>;
                    }
                  })()}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900/20 border border-dashed border-slate-800 text-slate-500">
              เลือก Workflow จากรายการด้านซ้ายเพื่อดูรายละเอียด
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
