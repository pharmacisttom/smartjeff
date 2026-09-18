"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Send } from "lucide-react";
import { showError, showSuccess } from "@/lib/swal";

export default function NotificationSettingsPage() {
  const [channels, setChannels] = useState<Record<string, boolean>>({}); const [email, setEmail] = useState("");
  useEffect(() => { fetch("/api/notifications/test").then((response) => response.json()).then((body) => setChannels(body.channels || {})); }, []);
  const test = async (type: string) => { const response = await fetch("/api/notifications/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, ...(type === "EMAIL" ? { email } : {}) }) }); const body = await response.json(); response.ok && body.success ? showSuccess("ส่งสำเร็จ", body.message) : showError("ส่งไม่สำเร็จ", body.message); };
  return <div className="space-y-5 max-w-4xl mx-auto"><div className="p-6 rounded-2xl bg-surface-bg border border-surface-border"><h1 className="text-2xl font-bold">ช่องทางแจ้งเตือน</h1><p className="text-sm text-content-muted">ระบบแสดงเฉพาะสถานะจาก environment โดยไม่ส่ง secret กลับ browser</p></div>{[["LINE Notify", "line", "LINE_NOTIFY"], ["Telegram", "telegram", "TELEGRAM"], ["Email API", "email", "EMAIL"]].map(([label, key, type]) => <div key={key} className="p-5 rounded-2xl bg-surface-bg border border-surface-border flex justify-between items-center"><div className="flex gap-3 items-center">{channels[key] ? <CheckCircle2 className="text-emerald-600" /> : <XCircle className="text-red-600" />}<div><div className="font-bold">{label}</div><div className="text-sm text-content-muted">{channels[key] ? "ตั้งค่าแล้ว" : "ยังไม่ได้ตั้งค่า environment"}</div>{type === "EMAIL" && <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="อีเมลผู้รับสำหรับทดสอบ" className="mt-2 p-2 border rounded-lg" />}</div></div><button disabled={!channels[key] || (type === "EMAIL" && !email)} onClick={() => test(type)} className="p-2 text-brand-600 disabled:opacity-30"><Send /></button></div>)}</div>;
}
