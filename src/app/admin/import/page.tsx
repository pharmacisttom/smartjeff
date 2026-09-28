"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, ShieldCheck, Upload } from "lucide-react";

const importTypes = ["EMPLOYEE", "USER", "CLIENT", "SITE", "SHIFT", "ATTENDANCE", "PAYROLL_POLICY", "PAYROLL", "PAYSLIP", "EMPLOYEE_DEPLOYMENT"];
const workflow = ["Upload", "Analyze", "Preview", "Map Columns", "Validate", "Dry Run", "Confirm", "Import", "Import Report"];

type Analysis = { sheets: Array<{ name: string; range: string | null; rowCount: number; columnCount: number; formulaCells: number; candidateHeaderRows: Array<{ row: number; nonEmptyCells: number }> }> };

export default function ExcelImportCenterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState("EMPLOYEE");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const activeStep = analysis ? 2 : file ? 1 : 0;
  const totals = useMemo(() => analysis?.sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0) || 0, [analysis]);

  async function analyze() {
    if (!file) return;
    setLoading(true); setError(""); setAnalysis(null);
    try {
      const body = new FormData(); body.set("file", file); body.set("importType", importType);
      const response = await fetch("/api/admin/import/analyze", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message || "Workbook analysis failed.");
      setAnalysis(payload.analysis); setJobId(payload.job.id);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Workbook analysis failed."); }
    finally { setLoading(false); }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Excel Import Center</h1>
        <p className="mt-1 text-sm text-slate-500">Analyze and validate customer workbooks before any database write.</p>
      </header>

      <section className="overflow-x-auto rounded-2xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <ol className="flex min-w-[900px] items-center gap-2">
          {workflow.map((step, index) => <li key={step} className={`flex-1 rounded-xl px-3 py-2 text-center text-xs font-bold ${index <= activeStep ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>{index + 1}. {step}</li>)}
        </ol>
      </section>

      <section className="grid gap-5 rounded-2xl border bg-white p-5 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold">Import type
          <select value={importType} onChange={(event) => setImportType(event.target.value)} className="block w-full rounded-xl border bg-transparent p-3">{importTypes.map((type) => <option key={type}>{type}</option>)}</select>
        </label>
        <label className="space-y-2 text-sm font-semibold">Workbook (.xlsx, maximum 10 MB)
          <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { setFile(event.target.files?.[0] || null); setAnalysis(null); }} className="block w-full rounded-xl border p-2" />
        </label>
        <button disabled={!file || loading} onClick={analyze} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50 md:col-span-2">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />} Analyze without importing
        </button>
      </section>

      <aside className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <ShieldCheck className="h-5 w-5 shrink-0" /><p>Upload never triggers an import. Raw rows are not returned to this page or written to audit metadata. Continue to mapping, validation and dry run before confirmation.</p>
      </aside>
      {error && <div className="flex gap-2 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-800"><AlertTriangle className="h-5 w-5" />{error}</div>}

      {analysis && <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Import job" value={jobId || "—"} /><Metric label="Worksheets" value={String(analysis.sheets.length)} /><Metric label="Rows inspected" value={String(totals)} />
        </div>
        <div className="overflow-hidden rounded-2xl border bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b p-4 font-bold">Workbook structure (no row data)</div>
          <div className="divide-y dark:divide-slate-700">{analysis.sheets.map((sheet) => <article key={sheet.name} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
            <div className="flex items-center gap-2 font-semibold"><FileSpreadsheet className="h-4 w-4 text-emerald-600" />{sheet.name}</div>
            <span className="text-xs text-slate-500">{sheet.rowCount} rows × {sheet.columnCount} columns</span>
            <span className="text-xs text-slate-500">{sheet.formulaCells} formulas</span>
            <span className="flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" />Analyzed</span>
          </article>)}</div>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">Select the authoritative sheet and header row during column mapping. Import remains disabled until server-side validation and dry run report zero critical errors.</div>
      </section>}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 truncate text-lg font-black">{value}</p></div>; }
