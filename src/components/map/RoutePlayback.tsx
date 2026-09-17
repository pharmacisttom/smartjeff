"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, FastForward, MapPin, Navigation } from "lucide-react";

interface RoutePlaybackProps {
  originName?: string;
  destName?: string;
  distanceKm?: number;
  durationMinutes?: number;
}

export function RoutePlayback({
  originName = "บ้านพนักงาน (สุขุมวิท ระยอง)",
  destName = "โรงงาน AAM นิคมฯ มาบตาพุด",
  distanceKm = 12.5,
  durationMinutes = 18,
}: RoutePlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [speed, setSpeed] = useState<number>(1);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 1 * speed;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const resetPlayback = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-3xl p-5 shadow-sm space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-surface-border pb-3">
        <div className="flex items-center space-x-2">
          <Navigation className="w-5 h-5 text-brand-600" />
          <h3 className="font-bold text-content-primary text-sm">การเล่นย้อนหลังเส้นทางเดินทาง (Route Playback)</h3>
        </div>
        <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full">
          {distanceKm} กม. ({durationMinutes} นาที)
        </span>
      </div>

      {/* Playback Route Track Visual */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-bold">{originName}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="font-bold">{destName}</span>
          </div>
        </div>

        {/* Progress Timeline Slider */}
        <div className="space-y-1.5">
          <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-brand-500 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>เริ่มต้น</span>
            <span className="font-mono text-emerald-400 font-bold">{Math.round(progress)}% ({(distanceKm * (progress / 100)).toFixed(1)} กม.)</span>
            <span>ถึงที่หมาย</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePlay}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow transition-all active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? "พักการเล่น" : "เล่นย้อนหลัง"}</span>
            </button>

            <button
              onClick={resetPlayback}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-1 text-xs font-bold text-slate-400">
            <span>ความเร็ว:</span>
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded-md border text-[11px] ${
                  speed === s
                    ? "bg-brand-500/20 text-brand-300 border-brand-500/40"
                    : "bg-slate-900 border-slate-800 text-slate-400"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
