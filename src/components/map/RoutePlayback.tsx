"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, FastForward, Navigation, MapPin } from "lucide-react";
import { SmartLongdoMap, SmartMapMarker, SmartMapPolyline } from "./SmartLongdoMap";

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: string;
  speedKmH?: number;
}

interface RoutePlaybackProps {
  routeName?: string;
  originName?: string;
  destName?: string;
  points?: RoutePoint[];
  demoMode?: boolean;
}

const defaultDemoPoints: RoutePoint[] = [
  { lat: 12.9734, lng: 101.2155, timestamp: "07:30 น.", speedKmH: 0 },
  { lat: 12.9810, lng: 101.2050, timestamp: "07:35 น.", speedKmH: 42 },
  { lat: 12.9900, lng: 101.1900, timestamp: "07:40 น.", speedKmH: 58 },
  { lat: 12.9980, lng: 101.1780, timestamp: "07:45 น.", speedKmH: 50 },
  { lat: 13.0039, lng: 101.1668, timestamp: "07:50 น.", speedKmH: 15 },
];

export function RoutePlayback({
  routeName = "เส้นทางเดินทางสายงานปฏิบัติการ 01",
  originName = "บ้านพนักงาน (สุขุมวิท ระยอง)",
  destName = "โรงงาน AAM นิคมฯ เหมราช",
  points = defaultDemoPoints,
  demoMode = true,
}: RoutePlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState<number>(1);

  const activePoints = points && points.length > 0 ? points : defaultDemoPoints;
  const currentPoint = activePoints[currentIndex] || activePoints[0];

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= activePoints.length - 1) {
            setIsPlaying(false);
            return activePoints.length - 1;
          }
          return prev + 1;
        });
      }, 1500 / speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed, activePoints.length]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const resetPlayback = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const polyline: SmartMapPolyline = {
    id: "playback_route",
    points: activePoints.map((p) => ({ lat: p.lat, lng: p.lng })),
    color: "#3b82f6",
    width: 5,
  };

  const markers: SmartMapMarker[] = [
    {
      id: "origin_marker",
      lat: activePoints[0].lat,
      lng: activePoints[0].lng,
      title: "จุดเริ่มต้น",
      subtitle: originName,
      color: "#10b981",
    },
    {
      id: "dest_marker",
      lat: activePoints[activePoints.length - 1].lat,
      lng: activePoints[activePoints.length - 1].lng,
      title: "จุดหมายปลายทาง",
      subtitle: destName,
      color: "#f43f5e",
    },
    {
      id: "current_vehicle_marker",
      lat: currentPoint.lat,
      lng: currentPoint.lng,
      title: "ตำแหน่งปัจจุบัน",
      subtitle: `เวลา ${currentPoint.timestamp} (${currentPoint.speedKmH || 0} กม./ชม.)`,
      category: "VEHICLE",
      color: "#6366f1",
    },
  ];

  const progressPercent = Math.round(((currentIndex + 1) / activePoints.length) * 100);

  return (
    <div className="bg-surface-card border border-surface-border rounded-3xl p-5 shadow-sm space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-border pb-3">
        <div className="flex items-center space-x-2">
          <Navigation className="w-5 h-5 text-brand-600" />
          <h3 className="font-bold text-content-primary text-sm">{routeName}</h3>
        </div>
        {demoMode && (
          <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
            DEMO MODE (Sanitized GPS Data)
          </span>
        )}
      </div>

      {/* Longdo Map Visualizer */}
      <SmartLongdoMap
        center={currentPoint}
        zoom={13}
        height="h-64"
        markers={markers}
        polylines={[polyline]}
      />

      {/* Control Panel */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-white">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-bold">{originName}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="font-bold">{destName}</span>
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="space-y-1.5">
          <input
            id="playback-timeline-slider"
            type="range"
            min={0}
            max={activePoints.length - 1}
            value={currentIndex}
            onChange={(e) => setCurrentIndex(parseInt(e.target.value, 10))}
            className="w-full accent-brand-500 cursor-pointer"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>เวลา: {currentPoint.timestamp}</span>
            <span className="font-mono text-emerald-400 font-bold">{progressPercent}%</span>
            <span>ความเร็ว: {currentPoint.speedKmH || 0} กม./ชม.</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <button
              id="playback-play-pause-btn"
              onClick={togglePlay}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow transition-all active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? "พักการเล่น" : "เล่นย้อนหลัง"}</span>
            </button>
            <button
              id="playback-reset-btn"
              onClick={resetPlayback}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="เริ่มใหม่"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-1 text-xs font-bold text-slate-400">
            <span>ความเร็ว:</span>
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                id={`playback-speed-${s}x`}
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
