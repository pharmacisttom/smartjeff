"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode,
  Package,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Wrench,
  Camera,
  ClipboardCheck,
  Search,
  RefreshCw,
  Clock,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/swal";

export default function MobileInventoryPage() {
  const [activeTab, setActiveTab] = useState<"SCAN" | "ISSUE" | "TOOLS">("SCAN");
  const [items, setItems] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanCode, setScanCode] = useState("");
  const [scannedResult, setScannedResult] = useState<any>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [itRes, astRes] = await Promise.all([
        fetch("/api/inventory/items"),
        fetch("/api/assets"),
      ]);
      const [itData, astData] = await Promise.all([itRes.json(), astRes.json()]);
      if (itData.success) setItems(itData.data);
      if (astData.success) setAssets(astData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSimulateScan = (code: string) => {
    setScanCode(code);
    const foundItem = items.find(
      (i) => i.code.toLowerCase() === code.toLowerCase() || i.barcode === code
    );
    const foundAsset = assets.find(
      (a) => a.assetCode.toLowerCase() === code.toLowerCase() || a.qrCode?.includes(code)
    );

    if (foundItem) {
      setScannedResult({ type: "ITEM", data: foundItem });
    } else if (foundAsset) {
      setScannedResult({ type: "ASSET", data: foundAsset });
    } else {
      setScannedResult({ type: "NOT_FOUND", code });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-100">SmartJeff Mobile Field</h1>
              <p className="text-xs text-slate-400">ระบบคลังและเครื่องมือภาคสนาม</p>
            </div>
          </div>
          <button
            onClick={fetchItems}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6">
        {/* Scanner Simulation Card */}
        {activeTab === "SCAN" && (
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center relative overflow-hidden">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-orange-500/10 border-2 border-dashed border-orange-500/40 flex items-center justify-center text-orange-400">
                <Camera className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="font-bold text-lg text-slate-100">สแกน Barcode / QR Code</h2>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                สแกนรหัสพัสดุเพื่อเช็คสต็อก หรือสแกนเครื่องมือเพื่อยืม-คืน
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="พิมพ์หรือยิงบาร์โค้ด..."
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-center text-orange-400 focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={() => handleSimulateScan(scanCode)}
                  className="px-5 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition-all"
                >
                  ค้นหา
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 text-left">
                <span className="text-xs text-slate-500 block mb-2">ตัวอย่างรหัสทดสอบ:</span>
                <div className="flex flex-wrap gap-2">
                  {items.slice(0, 3).map((it) => (
                    <button
                      key={it.id}
                      onClick={() => handleSimulateScan(it.code)}
                      className="px-2.5 py-1 bg-slate-800 text-xs rounded-lg font-mono text-slate-300"
                    >
                      {it.code}
                    </button>
                  ))}
                  {assets.slice(0, 2).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleSimulateScan(a.assetCode)}
                      className="px-2.5 py-1 bg-teal-900/40 text-xs rounded-lg font-mono text-teal-300 border border-teal-700/40"
                    >
                      {a.assetCode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scan Result */}
            {scannedResult && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 animate-in fade-in slide-in-from-bottom-2">
                {scannedResult.type === "ITEM" && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        พัสดุ (Material / Item)
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        {scannedResult.data.code}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-100 mb-1">
                      {scannedResult.data.name}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      {scannedResult.data.description || "ไม่มีคำอธิบายเพิ่มเติม"}
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/60 mb-4">
                      <div>
                        <span className="text-slate-500 block">คงเหลือพร้อมใช้</span>
                        <span className="text-lg font-bold text-emerald-400">
                          {scannedResult.data.balances?.reduce(
                            (s: number, b: any) => s + b.availableQuantity,
                            0
                          ) || 0}{" "}
                          {scannedResult.data.unit?.nameTh || "ชิ้น"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">จุดสั่งซื้อซ้ำ (ROP)</span>
                        <span className="text-lg font-bold text-amber-400">
                          {scannedResult.data.reorderPoint} ชิ้น
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {scannedResult.type === "ASSET" && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 text-xs rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        เครื่องมือ / ทรัพย์สิน (Asset)
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        {scannedResult.data.assetCode}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-100 mb-1">
                      {scannedResult.data.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2.5 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300">
                        {scannedResult.data.category}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 text-xs rounded-full border ${
                          scannedResult.data.status === "AVAILABLE"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {scannedResult.data.status}
                      </span>
                    </div>
                  </div>
                )}

                {scannedResult.type === "NOT_FOUND" && (
                  <div className="text-center py-4 text-rose-400 text-sm">
                    ไม่พบข้อมูลสำหรับรหัส: {scannedResult.code}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Issue / Inventory List */}
        {activeTab === "ISSUE" && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-100">รายการพัสดุพร้อมเบิก</h3>
            <div className="space-y-3">
              {items.map((it) => {
                const avail = it.balances?.reduce((s: number, b: any) => s + b.availableQuantity, 0) || 0;
                return (
                  <div
                    key={it.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 text-sm">{it.name}</div>
                      <div className="text-xs font-mono text-orange-400 mt-0.5">{it.code}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-slate-100">
                        {avail} {it.unit?.nameTh || "ชิ้น"}
                      </div>
                      <span className="text-xs text-slate-500">พร้อมใช้</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === "TOOLS" && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-100">เครื่องมือประจำไซต์</h3>
            <div className="space-y-3">
              {assets.map((ast) => (
                <div
                  key={ast.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold text-slate-200 text-sm">{ast.name}</div>
                    <div className="text-xs font-mono text-teal-400 mt-0.5">{ast.assetCode}</div>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs rounded-full border font-medium ${
                      ast.status === "AVAILABLE"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}
                  >
                    {ast.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex justify-around p-2">
        <button
          onClick={() => setActiveTab("SCAN")}
          className={`flex flex-col items-center py-1 px-4 rounded-xl text-xs transition-colors ${
            activeTab === "SCAN" ? "text-orange-500 font-semibold" : "text-slate-400"
          }`}
        >
          <QrCode className="w-5 h-5 mb-1" />
          สแกนบาร์โค้ด
        </button>
        <button
          onClick={() => setActiveTab("ISSUE")}
          className={`flex flex-col items-center py-1 px-4 rounded-xl text-xs transition-colors ${
            activeTab === "ISSUE" ? "text-orange-500 font-semibold" : "text-slate-400"
          }`}
        >
          <Boxes className="w-5 h-5 mb-1" />
          พัสดุคงคลัง
        </button>
        <button
          onClick={() => setActiveTab("TOOLS")}
          className={`flex flex-col items-center py-1 px-4 rounded-xl text-xs transition-colors ${
            activeTab === "TOOLS" ? "text-orange-500 font-semibold" : "text-slate-400"
          }`}
        >
          <Wrench className="w-5 h-5 mb-1" />
          เครื่องมือไซต์
        </button>
      </nav>
    </div>
  );
}
