"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Lock,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ArrowLeftRight,
  FileText,
  DollarSign,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2";

export default function BankReconciliationPage() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [summary, setSummary] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedBankTx, setSelectedBankTx] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const fetchData = async (accountId?: string) => {
    try {
      setLoading(true);
      const accRes = await fetch("/api/finance/accounts");
      const accData = await accRes.json();
      if (accData.success && accData.accounts.length > 0) {
        setAccounts(accData.accounts);
        const targetAccId = accountId || selectedAccountId || accData.accounts[0].id;
        setSelectedAccountId(targetAccId);

        const [suggRes, sumRes] = await Promise.all([
          fetch(`/api/finance/reconciliation/suggestions?financialAccountId=${targetAccId}`),
          fetch(`/api/finance/reconciliation/suggestions`),
        ]);

        const suggData = await suggRes.json();
        const sumData = await sumRes.json();

        if (suggData.success) {
          setSuggestions(suggData.suggestions || []);
          if (suggData.suggestions?.length > 0) {
            setSelectedBankTx(suggData.suggestions[0].bankTransaction);
          }
        }
        if (sumData.success) {
          setSummary(sumData.summary);
        }
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: "ไม่สามารถดึงข้อมูลกระทบยอดได้" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const accId = e.target.value;
    setSelectedAccountId(accId);
    fetchData(accId);
  };

  const handleConfirmMatch = async (bankTxId: string, suggestion: any) => {
    try {
      const res = await fetch("/api/finance/reconciliation/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankTransactionId: bankTxId,
          targetType: suggestion.candidate.targetType,
          targetId: suggestion.candidate.id,
          matchedAmount: suggestion.match.matchedAmount,
          matchMethod: suggestion.match.matchMethod,
          matchScore: suggestion.match.score,
          matchExplanation: suggestion.match.explanation,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      Swal.fire({
        icon: "success",
        title: "กระทบยอดสำเร็จ",
        text: `จับคู่รายการ ฿${suggestion.match.matchedAmount.toLocaleString()} เรียบร้อยแล้ว`,
        timer: 1800,
        showConfirmButton: false,
      });

      fetchData(selectedAccountId);
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ไม่สามารถจับคู่ได้", text: err.message });
    }
  };

  const handleCreateAdjustment = async (bankTxId: string, isFee: boolean) => {
    try {
      const res = await fetch("/api/finance/bank-transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankTransactionId: bankTxId,
          action: "CREATE_ADJUSTMENT",
          notes: isFee ? "บันทึกค่าธรรมเนียมธนาคารอัตโนมัติ" : "บันทึกดอกเบี้ยรับอัตโนมัติ",
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      Swal.fire({
        icon: "success",
        title: "บันทึกปรับปรุงสำเร็จ",
        text: isFee ? "บันทึกค่าธรรมเนียมและกระทบยอดแล้ว" : "บันทึกรายได้ดอกเบี้ยและกระทบยอดแล้ว",
        timer: 1800,
        showConfirmButton: false,
      });

      fetchData(selectedAccountId);
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ผิดพลาด", text: err.message });
    }
  };

  const handleExclude = async (bankTxId: string) => {
    const { value: reason } = await Swal.fire({
      title: "ยกเว้นรายการ (Exclude)",
      input: "text",
      inputLabel: "ระบุเหตุผลในการยกเว้นรายการ (เช่น ข้อมูลซ้ำ หรือ รายการแจ้งข้อมูลธนาคาร)",
      inputPlaceholder: "เหตุผลการยกเว้น...",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return "จำเป็นต้องระบุเหตุผล";
      },
    });

    if (reason) {
      try {
        const res = await fetch("/api/finance/bank-transactions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bankTransactionId: bankTxId,
            action: "EXCLUDE",
            reason,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        Swal.fire({ icon: "success", title: "ยกเว้นรายการเรียบร้อย", timer: 1500, showConfirmButton: false });
        fetchData(selectedAccountId);
      } catch (err: any) {
        Swal.fire({ icon: "error", title: "ผิดพลาด", text: err.message });
      }
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedAccountId) return;

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("financialAccountId", selectedAccountId);

      const res = await fetch("/api/finance/bank-statements/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      Swal.fire({
        icon: "success",
        title: "นำเข้า Statement สำเร็จ",
        text: `นำเข้า ${data.result.importedCount} รายการ (ซ้ำ ${data.result.duplicateCount} รายการ)`,
      });

      setImportModalOpen(false);
      setUploadFile(null);
      fetchData(selectedAccountId);
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "นำเข้าล้มเหลว", text: err.message });
    } finally {
      setImporting(false);
    }
  };

  const kpi = summary?.kpi || { totalBankTransactions: 0, matched: 0, unmatched: 0, suggested: 0 };
  const balances = summary?.balances || { ledgerBalance: 0, bankBalance: 0, difference: 0 };

  const activeSuggestionGroup = suggestions.find(
    (s) => s.bankTransaction.id === selectedBankTx?.id
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              Phase 21 — Bank Reconciliation
            </span>
            <span className="text-xs text-slate-500">Explainable Matching Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2.5">
            <Scale className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            กระทบยอดรายการเดินบัญชีธนาคาร (Bank Reconciliation)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            จับคู่รายการเดินบัญชีจาก Bank Statement กับระบบ SmartJeff อัตโนมัติ พร้อมคะแนนความน่าเชื่อถือและการยืนยันโดยมนุษย์
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
          >
            <Upload className="w-4 h-4" />
            นำเข้า Bank Statement
          </button>
        </div>
      </div>

      {/* Account Selector & Summary Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            เลือกบัญชีธนาคาร:
          </label>
          <select
            value={selectedAccountId}
            onChange={handleAccountChange}
            className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium w-full md:w-80"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                [{a.bankCode}] {a.accountName} ({a.maskedAccountNo})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-6 text-xs w-full md:w-auto justify-between md:justify-end">
          <div>
            <div className="text-slate-500">ยอดเงินตามระบบ (Ledger)</div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              ฿{balances.ledgerBalance.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-slate-500">ยอดธนาคารล่าสุด</div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              ฿{balances.bankBalance.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-slate-500">ผลต่าง (Reconciliation Diff)</div>
            <div
              className={`font-bold text-sm ${
                balances.difference === 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              ฿{balances.difference.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-slate-500">อัตราจับคู่ (Matched %)</div>
            <div className="font-bold text-sm text-emerald-600">
              {kpi.matchedPercentage || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Split View Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Bank Transactions List (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[680px]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <h2 className="font-bold text-sm">รายการใน Bank Statement</h2>
              <span className="text-xs text-slate-500">{suggestions.length} รายการที่รอตรวจสอบ</span>
            </div>
            <button
              onClick={() => fetchData(selectedAccountId)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1">
            {suggestions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                ไม่พบรายการรอการกระทบยอดในบัญชีนี้ หรือทุกรายการกระทบยอดเสร็จสิ้นแล้ว
              </div>
            ) : (
              suggestions.map((item) => {
                const tx = item.bankTransaction;
                const isSelected = selectedBankTx?.id === tx.id;
                const topScore = item.suggestions[0]?.match.score || 0;

                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedBankTx(tx)}
                    className={`p-4 cursor-pointer transition flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-l-4 border-emerald-500"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(tx.transactionDate).toLocaleDateString("th-TH")}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            tx.direction === "CREDIT"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {tx.direction === "CREDIT" ? "ฝาก/โอนเข้า" : "ถอน/โอนออก"}
                        </span>
                        {topScore >= 90 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold">
                            แนะนำ {topScore}%
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                        {tx.description}
                      </div>
                      {tx.reference && (
                        <div className="text-slate-500 text-[11px]">Ref: {tx.reference}</div>
                      )}
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-extrabold text-sm ${
                          tx.direction === "CREDIT"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {tx.direction === "CREDIT" ? "+" : "-"}฿{tx.amount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">{tx.status}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Suggestions & Match Actions (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          {selectedBankTx ? (
            <>
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    รายการที่เลือกเพื่อกระทบยอด
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedBankTx.description}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span>วันที่: {new Date(selectedBankTx.transactionDate).toLocaleDateString("th-TH")}</span>
                    <span>•</span>
                    <span>อ้างอิง: {selectedBankTx.reference || "ไม่มี"}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Hash: {selectedBankTx.hash.substring(0, 10)}...
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">ยอดเงินในสเตทเมนต์</div>
                  <div
                    className={`text-2xl font-black ${
                      selectedBankTx.direction === "CREDIT" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {selectedBankTx.direction === "CREDIT" ? "+" : "-"}฿
                    {selectedBankTx.amount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Suggestions List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    รายการในระบบ SmartJeff ที่เสนอแนะ (Matching Candidates)
                  </h4>
                  <span className="text-xs text-slate-500">
                    {activeSuggestionGroup?.suggestions.length || 0} รายการที่ใกล้เคียง
                  </span>
                </div>

                {activeSuggestionGroup?.suggestions && activeSuggestionGroup.suggestions.length > 0 ? (
                  activeSuggestionGroup.suggestions.map((sug: any, idx: number) => {
                    const cand = sug.candidate;
                    const match = sug.match;
                    const isHighConfidence = match.score >= 90;

                    return (
                      <div
                        key={cand.id}
                        className={`p-4 rounded-xl border transition ${
                          isHighConfidence
                            ? "border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/30"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {cand.transactionNo}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-medium">
                                {cand.targetType}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                  match.score >= 90
                                    ? "bg-emerald-600 text-white"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                }`}
                              >
                                คะแนน {match.score}/100
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300">
                              {cand.description} {cand.partyName ? `(${cand.partyName})` : ""}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-3">
                              <span>วันที่ในระบบ: {new Date(cand.date).toLocaleDateString("th-TH")}</span>
                              <span>•</span>
                              <span>ยอดในระบบ: ฿{cand.amount.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <button
                              onClick={() => handleConfirmMatch(selectedBankTx.id, sug)}
                              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow transition flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              ยืนยันจับคู่ (Confirm Match)
                            </button>
                          </div>
                        </div>

                        {/* Explainable Reasoning Badge */}
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          <span>เหตุผล AI: {match.explanation}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
                    <p className="text-sm text-slate-500">
                      ไม่พบรายการที่เข้าข่ายจับคู่อัตโนมัติสำหรับรายการนี้
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                      <button
                        onClick={() => handleCreateAdjustment(selectedBankTx.id, selectedBankTx.direction === "DEBIT")}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        {selectedBankTx.direction === "DEBIT" ? "บันทึกเป็นค่าธรรมเนียมธนาคาร (Bank Fee)" : "บันทึกเป็นดอกเบี้ยรับ (Interest)"}
                      </button>
                      <button
                        onClick={() => handleExclude(selectedBankTx.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40 transition"
                      >
                        ยกเว้นรายการ (Exclude)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
              <Scale className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">กรุณาเลือกรายการธนาคารทางด้านซ้ายเพื่อดูข้อเสนอแนะในการกระทบยอด</p>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold">นำเข้า Bank Statement</h3>
              <button
                onClick={() => setImportModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  บัญชีธนาคารเป้าหมาย
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.bankCode}] {a.accountName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  ไฟล์ Statement (รองรับ CSV หรือ Excel .xlsx)
                </label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 space-y-1">
                <div>• ระบบตรวจจับและป้องกันการนำเข้ารายการซ้ำด้วย SHA-256 Hash</div>
                <div>• ระบบคำนวณยอด Opening และ Closing Balance โดยอัตโนมัติ</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={importing || !uploadFile}
                  className="px-4 py-2 text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow disabled:opacity-50"
                >
                  {importing ? "กำลังนำเข้า..." : "ยืนยันนำเข้าข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
