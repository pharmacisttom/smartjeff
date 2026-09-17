"use client";

import { useRef, useState, useEffect } from "react";
import { PenTool, RotateCcw, CheckCircle2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  signerName: string;
  signerTitle: string;
  onSign: (data: { dataUrl: string; timestamp: string }) => void;
}

export function SignaturePad({ signerName, signerTitle, onSign }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#0f172a"; // Dark slate pen color
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const confirmSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const dataUrl = canvas.toDataURL("image/png");
    onSign({
      dataUrl,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-4 shadow-md max-w-md mx-auto">
      <div className="flex items-center justify-between border-b border-surface-border pb-3">
        <div className="flex items-center space-x-2">
          <PenTool className="w-5 h-5 text-brand-600" />
          <h3 className="font-bold text-content-primary text-sm">ลงนามอิเล็กทรอนิกส์ (e-Signature)</h3>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center space-x-1">
          <ShieldCheck className="w-3 h-3" />
          <span>SHA-256 Audit Trail</span>
        </span>
      </div>

      <div className="border-2 border-dashed border-surface-border rounded-2xl bg-white p-2 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={380}
          height={160}
          className="w-full h-40 touch-none cursor-crosshair bg-slate-50/50 rounded-xl"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-content-muted text-xs font-semibold">
            ใช้นิ้วมือหรือเมาส์วาดลายเซ็นในกรอบนี้
          </div>
        )}
      </div>

      <div className="text-center text-xs space-y-0.5">
        <p className="font-bold text-content-primary">ผู้ลงนาม: {signerName}</p>
        <p className="text-content-muted text-[11px]">{signerTitle}</p>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={clearCanvas}
          className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 border border-surface-border rounded-xl text-xs font-bold hover:bg-surface-subtle transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5 text-content-muted" />
          <span>ล้างลายเซ็น</span>
        </button>

        <button
          onClick={confirmSignature}
          disabled={!hasSignature}
          className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>ยืนยันลายเซ็นสัญญา</span>
        </button>
      </div>
    </div>
  );
}
