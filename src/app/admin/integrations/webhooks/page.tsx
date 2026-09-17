"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Webhook,
  ArrowLeft,
  Plus,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  Key,
  ShieldCheck,
  Globe,
  Clock,
  Layers,
  Copy,
} from "lucide-react";
import Swal from "@/lib/swal";

interface WebhookEndpointItem {
  id: string;
  name: string;
  url: string;
  eventTypesJson: string;
  status: string;
  timeoutMs: number;
  maxRetries: number;
  createdAt: string;
}

interface WebhookDeliveryItem {
  id: string;
  endpointId: string;
  eventId: string;
  statusCode: number | null;
  durationMs: number;
  responseSnippet: string | null;
  status: string;
  deliveredAt: string;
}

interface CredentialItem {
  id: string;
  name: string;
  clientId: string;
  scopes: string[];
  rateLimitPerMin: number;
  status: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function WebhooksIntegrationPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpointItem[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDeliveryItem[]>([]);
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [activeTab, setActiveTab] = useState<"WEBHOOKS" | "CREDENTIALS">("WEBHOOKS");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [whRes, credRes] = await Promise.all([
        fetch("/api/integrations/webhooks"),
        fetch("/api/integrations/credentials"),
      ]);

      const whData = await whRes.json();
      const credData = await credRes.json();

      if (whData.success) {
        setEndpoints(whData.endpoints);
        setDeliveries(whData.deliveries);
      }
      if (credData.success) {
        setCredentials(credData.credentials);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateWebhook = async () => {
    const { value: formValues } = await Swal.fire({
      title: "สร้าง Webhook Endpoint ใหม่",
      html: `
        <div class="text-left space-y-3">
          <div>
            <label class="text-xs font-semibold text-slate-300">Endpoint Name</label>
            <input id="swal-wh-name" class="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-700 text-sm text-white" placeholder="เช่น n8n Production Webhook" />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-300">Target URL (HTTPS)</label>
            <input id="swal-wh-url" class="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-700 text-sm text-white" placeholder="https://your-n8n.com/webhook/smartjeff" />
            <p class="text-[11px] text-amber-400 mt-1">ไม่อนุญาต localhost, private IP หรือ Cloud Metadata (SSRF Protection)</p>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึก Endpoint",
      cancelButtonText: "ยกเลิก",
      preConfirm: () => {
        const name = (document.getElementById("swal-wh-name") as HTMLInputElement).value;
        const url = (document.getElementById("swal-wh-url") as HTMLInputElement).value;
        if (!name || !url) {
          Swal.showValidationMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
          return false;
        }
        return { name, url };
      },
    });

    if (formValues) {
      try {
        const res = await fetch("/api/integrations/webhooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formValues, eventTypes: ["*"] }),
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire({
            icon: "success",
            title: "สร้าง Endpoint เรียบร้อย",
            html: `HMAC Secret: <code class="font-mono bg-slate-800 p-1 text-amber-400 rounded">${data.secret}</code><br><span class="text-xs text-slate-400">ใช้สำหรับตรวจสอบ X-SmartJeff-Signature</span>`,
          });
          fetchData();
        } else {
          Swal.fire({ icon: "error", title: "ไม่สามารถสร้างได้", text: data.error });
        }
      } catch (err: any) {
        Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
      }
    }
  };

  const handleTestPing = async (id: string) => {
    try {
      const res = await fetch(`/api/integrations/webhooks/${id}/test`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "เชื่อมต่อสำเร็จ (HTTP Status 200)",
          text: "ส่ง Test Event พร้อม HMAC Signature เรียบร้อย",
        });
        fetchData();
      } else {
        Swal.fire({ icon: "warning", title: "การเชื่อมต่อล้มเหลว", text: data.error || `HTTP Code: ${data.statusCode}` });
      }
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    }
  };

  const handleCreateCredential = async () => {
    const { value: formValues } = await Swal.fire({
      title: "สร้าง Scoped API Key (n8n / Partner)",
      html: `
        <div class="text-left space-y-3">
          <div>
            <label class="text-xs font-semibold text-slate-300">Credential Name</label>
            <input id="swal-cred-name" class="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-700 text-sm text-white" placeholder="เช่น n8n CRM Integration" />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-300">Granted Scopes</label>
            <div class="mt-1 space-y-1 text-xs text-slate-300">
              <label class="flex items-center gap-2"><input type="checkbox" id="scope-write" checked /> write:integration-events</label>
              <label class="flex items-center gap-2"><input type="checkbox" id="scope-read-p" checked /> read:projects</label>
              <label class="flex items-center gap-2"><input type="checkbox" id="scope-read-a" checked /> read:attendance</label>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "สร้าง Credential",
      preConfirm: () => {
        const name = (document.getElementById("swal-cred-name") as HTMLInputElement).value;
        const scopes = [];
        if ((document.getElementById("scope-write") as HTMLInputElement).checked) scopes.push("write:integration-events");
        if ((document.getElementById("scope-read-p") as HTMLInputElement).checked) scopes.push("read:projects");
        if ((document.getElementById("scope-read-a") as HTMLInputElement).checked) scopes.push("read:attendance");
        if (!name) {
          Swal.showValidationMessage("กรุณากรอกชื่อ Credential");
          return false;
        }
        return { name, scopes };
      },
    });

    if (formValues) {
      try {
        const res = await fetch("/api/integrations/credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formValues),
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire({
            icon: "success",
            title: "สร้าง API Key สำเร็จ",
            html: `
              <div class="text-left text-xs font-mono space-y-2">
                <p>Client ID: <span class="text-cyan-400 font-bold">${data.clientId}</span></p>
                <p>Client Secret: <span class="text-amber-400 font-bold">${data.clientSecret}</span></p>
                <p class="text-rose-400 font-sans text-[11px] mt-2">คำเตือน: Client Secret จะแสดงเพียงครั้งนี้เท่านั้น กรุณาคัดลอกและบันทึกไว้ใน n8n</p>
              </div>
            `,
          });
          fetchData();
        } else {
          Swal.fire({ icon: "error", title: "สร้างไม่สำเร็จ", text: data.error });
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
              <Webhook className="w-6 h-6 text-emerald-400" />
              <span>Webhook & Integration Platform (n8n Ready)</span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              เชื่อมต่อระบบภายนอกด้วย Secure Webhooks, HMAC SHA-256 และ Scoped API Credentials
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={activeTab === "WEBHOOKS" ? handleCreateWebhook : handleCreateCredential}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === "WEBHOOKS" ? "สร้าง Webhook ใหม่" : "สร้าง API Key ใหม่"}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-8 text-sm font-medium">
        <button
          onClick={() => setActiveTab("WEBHOOKS")}
          className={`pb-3 flex items-center gap-2 transition ${
            activeTab === "WEBHOOKS"
              ? "text-emerald-400 border-b-2 border-emerald-500"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Outbound Webhook Endpoints ({endpoints.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("CREDENTIALS")}
          className={`pb-3 flex items-center gap-2 transition ${
            activeTab === "CREDENTIALS"
              ? "text-emerald-400 border-b-2 border-emerald-500"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Incoming API Credentials ({credentials.length})</span>
        </button>
      </div>

      {activeTab === "WEBHOOKS" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Endpoints List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 font-semibold text-xs text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Webhook Endpoint</span>
                <span>Actions</span>
              </div>
              <div className="divide-y divide-slate-800/60">
                {endpoints.map((ep) => (
                  <div key={ep.id} className="p-5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{ep.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {ep.status}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-slate-400 mt-1 break-all">{ep.url}</p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                        <span>Timeout: {ep.timeoutMs}ms</span>
                        <span>Max Retries: {ep.maxRetries}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestPing(ep.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Send Test</span>
                      </button>
                    </div>
                  </div>
                ))}

                {endpoints.length === 0 && !loading && (
                  <div className="p-12 text-center text-slate-500 text-sm">ยังไม่มี Webhook Endpoint ที่ลงทะเบียนไว้</div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Deliveries */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>ประวัติการส่งข้อมูลล่าสุด (Deliveries)</span>
              </h3>

              <div className="space-y-2 overflow-y-auto max-h-[500px]">
                {deliveries.map((d) => (
                  <div key={d.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-semibold ${
                          d.status === "SUCCESS" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {d.status} (HTTP {d.statusCode || 500})
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">{d.durationMs}ms</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 block mt-1">Event: {d.eventId}</span>
                    {d.responseSnippet && (
                      <p className="font-mono text-[11px] text-slate-400 mt-1.5 truncate">
                        Response: {d.responseSnippet}
                      </p>
                    )}
                  </div>
                ))}

                {deliveries.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">ยังไม่มีประวัติการส่ง Webhook</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Scoped Credentials Tab */
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 font-semibold text-xs text-slate-400 uppercase tracking-wider flex justify-between">
            <span>Client Credential</span>
            <span>Scopes & Limits</span>
          </div>
          <div className="divide-y divide-slate-800/60">
            {credentials.map((c) => (
              <div key={c.id} className="p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">{c.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                      {c.clientId}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.scopes.map((s) => (
                      <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <span className="block">Rate Limit: {c.rateLimitPerMin} req/min</span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Last Used: {c.lastUsedAt ? new Date(c.lastUsedAt).toLocaleTimeString() : "Never"}
                  </span>
                </div>
              </div>
            ))}

            {credentials.length === 0 && !loading && (
              <div className="p-12 text-center text-slate-500 text-sm">ยังไม่มี Scoped API Key ในระบบ</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
