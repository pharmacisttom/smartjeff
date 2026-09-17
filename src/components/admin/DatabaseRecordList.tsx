"use client";
import { useEffect, useState } from "react";

export function DatabaseRecordList({ type, title, description }: { type: "training" | "compliance" | "alerts" | "birthdays"; title: string; description: string }) {
  const [records, setRecords] = useState<Record<string, unknown>[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch(`/api/admin/operations-records?type=${type}`, { cache: "no-store" }).then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error); setRecords(body.records || []); }).catch((reason) => setError(reason.message)).finally(() => setLoading(false)); }, [type]);
  const display = (record: Record<string, unknown>) => String(record.title || `${record.firstName || ""} ${record.lastName || ""}`.trim() || record.id);
  const secondary = (record: Record<string, unknown>) => [record.category, record.status, record.dueDate || record.birthDate].filter(Boolean).map(String).join(" · ");
  return <div className="space-y-4 max-w-5xl mx-auto"><div className="p-6 bg-surface-bg border border-surface-border rounded-2xl"><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-content-muted">{description}</p></div>{error && <div className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>}{loading ? <div className="p-8 text-center">กำลังโหลดข้อมูล...</div> : records.length === 0 ? <div className="p-8 text-center bg-surface-bg border rounded-2xl">ยังไม่มีข้อมูลในระบบ</div> : <div className="space-y-3">{records.map((record) => <div key={String(record.id)} className="p-4 bg-surface-bg border border-surface-border rounded-2xl"><div className="font-bold">{display(record)}</div><div className="text-sm text-content-muted">{secondary(record)}</div>{record.description ? <p className="mt-2 text-sm">{String(record.description)}</p> : null}</div>)}</div>}</div>;
}
