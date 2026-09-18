"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Camera, RefreshCw, Upload, AlertCircle, X } from "lucide-react";
import { compressAndWatermarkPhoto, type WatermarkMetadata } from "@/lib/image";

interface CameraCaptureProps {
  metadata: WatermarkMetadata;
  onCapture: (result: { blob: Blob; dataUrl: string; hash: string }) => void;
  onClose?: () => void;
}

export function CameraCapture({ metadata, onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const stopCurrentStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setLoading(true);
    setCameraError(null);

    stopCurrentStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("กล้องไม่รองรับในเบราว์เซอร์นี้");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setLoading(false);
    } catch (err: any) {
      console.warn("Camera getUserMedia error:", err);
      setCameraError(err.message || "ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์เข้าถึงกล้อง");
      setLoading(false);
    }
  }, [facingMode, stopCurrentStream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCurrentStream();
    };
  }, [startCamera, stopCurrentStream]);

  const handleSnap = async () => {
    if (!videoRef.current) return;
    setLoading(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Cannot get canvas context");

      // Flip canvas horizontally if selfie mode
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const processed = await compressAndWatermarkPhoto(canvas.toDataURL("image/jpeg"), metadata);
      onCapture(processed);
    } catch (e: any) {
      alert("เกิดข้อผิดพลาดในการประมวลผลรูปถ่าย: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const processed = await compressAndWatermarkPhoto(file, metadata);
      onCapture(processed);
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการประมวลผลรูปไฟล์: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 safe-pt safe-pb">
      {/* Top Controls */}
      <div className="w-full flex items-center justify-between max-w-md">
        <span className="text-white text-sm font-semibold flex items-center space-x-2">
          <Camera className="w-5 h-5 text-brand-500" />
          <span>ถ่ายรูปเซลฟี่ยืนยันตัวตน</span>
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Video Viewport Container */}
      <div className="relative w-full max-w-md aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden my-auto border border-white/20 flex flex-col items-center justify-center">
        {loading && (
          <div className="absolute inset-0 z-20 bg-slate-900/80 flex flex-col items-center justify-center text-white">
            <RefreshCw className="w-8 h-8 animate-spin text-brand-500 mb-2" />
            <span className="text-xs">กำลังเปิดกล้อง...</span>
          </div>
        )}

        {cameraError ? (
          <div className="p-6 text-center text-white space-y-3">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <p className="text-sm font-semibold">{cameraError}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-bold shadow hover:bg-brand-600 transition-colors inline-flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>เลือกรูปถ่ายจากคลังภาพแทน</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
          />
        )}
      </div>

      {/* Bottom Shutter Controls */}
      <div className="w-full max-w-md flex items-center justify-around py-4">
        <button
          onClick={() => setFacingMode((prev) => (prev === "user" ? "environment" : "user"))}
          className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 active-press transition-colors"
          title="สลับกล้อง"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        <button
          onClick={handleSnap}
          disabled={loading || !!cameraError}
          className="w-16 h-16 rounded-full bg-white border-4 border-brand-500 flex items-center justify-center shadow-lg active-press hover:scale-105 transition-all disabled:opacity-50"
        >
          <div className="w-12 h-12 rounded-full bg-brand-500" />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 active-press transition-colors"
          title="อัปโหลดภาพ"
        >
          <Upload className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
