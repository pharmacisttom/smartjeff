"use client";

import { useState, useEffect } from "react";
import {
  Compass,
  MapPin,
  Camera,
  CheckCircle2,
  Save,
  CloudOff,
  Cloud,
  AlertTriangle,
  Clock,
  Send,
  Building,
} from "lucide-react";

export default function MobileSiteSurveyPage() {
  const [isOffline, setIsOffline] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [savedLocal, setSavedLocal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    opportunityId: "",
    temporarySiteName: "รพ.ปลวกแดง - พื้นที่อาคารบริการ",
    address: "อ.ปลวกแดง จ.ระยอง",
    lat: 12.9754,
    lng: 101.2154,
    surveyedBy: "SURVEYOR_PWA",
    accessNotes: "ต้องแลกบัตรและมีใบรับรองความปลอดภัยก่อนเข้าพื้นที่บริการชั้น 1-3",
    workArea: "พื้นที่ภายในอาคาร 2,400 ตร.ม. และลานจอดรถด้านนอก",
    workingHours: "24 ชั่วโมง (แบ่ง 3 กะ)",
    riskNotes: "พื้นที่เสี่ยงติดเชื้อทางการแพทย์ ต้องสวมใส่ PPE ตามมาตรฐาน",
    photos: [] as string[],
    checklist: {
      powerAvailable: true,
      waterAvailable: true,
      parkingAvailable: true,
      securityGate: true,
      cctvCoverage: true,
    },
  });

  useEffect(() => {
    // Check localStorage for offline draft
    const cached = localStorage.getItem("smartjeff_site_survey_draft");
    if (cached) {
      try {
        setFormData(JSON.parse(cached));
        setSavedLocal(true);
      } catch (e) {}
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      alert("อุปกรณ์ไม่รองรับ GPS Geolocation");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lng: parseFloat(pos.coords.longitude.toFixed(6)),
        }));
        setGpsLoading(false);
      },
      (err) => {
        alert(`ไม่สามารถดึงพิกัดได้: ${err.message}`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveLocal = () => {
    localStorage.setItem("smartjeff_site_survey_draft", JSON.stringify(formData));
    setSavedLocal(true);
    alert("บันทึกฉบับร่างลงในหน่วยความจำของอุปกรณ์แล้ว (Offline Draft Saved)");
  };

  const handleSimulatePhoto = () => {
    const photoUrl = `https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=60`;
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, photoUrl],
    }));
  };

  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.temporarySiteName || !formData.address) {
      alert("กรุณากรอกชื่อสถานที่และที่อยู่");
      return;
    }

    setSubmitting(true);
    try {
      // In real scenario, sync with API
      localStorage.removeItem("smartjeff_site_survey_draft");
      setSavedLocal(false);
      alert("ส่งผลการสำรวจหน้างานเข้าระบบเรียบร้อยแล้ว!");
    } catch (e: any) {
      alert(`บันทึกลงในเครื่องเนื่องจากออฟไลน์: ${e.message}`);
      handleSaveLocal();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-24 space-y-4">
      {/* Mobile Top Header */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-sm">สำรวจพื้นที่หน้างาน (Site Survey)</h1>
            <p className="text-[11px] text-gray-500">PWA Mobile Field Command</p>
          </div>
        </div>

        <div>
          {isOffline ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
              <CloudOff className="w-3.5 h-3.5" /> ออฟไลน์
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
              <Cloud className="w-3.5 h-3.5" /> ออนไลน์
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmitSurvey} className="space-y-4">
        {/* Site Details Card */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
          <h2 className="font-bold text-xs uppercase text-gray-400 tracking-wider">ข้อมูลไซต์งาน</h2>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อพื้นที่ / ไซต์งานชั่วคราว</label>
            <input
              type="text"
              required
              value={formData.temporarySiteName}
              onChange={(e) => setFormData({ ...formData, temporarySiteName: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ที่อยู่ / พิกัดสถานที่</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* GPS Location Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleCaptureGPS}
              disabled={gpsLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200 transition"
            >
              <MapPin className="w-4 h-4" />
              {gpsLoading ? "กำลังดึงพิกัดดาวเทียม..." : `บันทึกพิกัด GPS (${formData.lat}, ${formData.lng})`}
            </button>
          </div>
        </div>

        {/* Operating Environment & Checklist */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
          <h2 className="font-bold text-xs uppercase text-gray-400 tracking-wider">สภาพแวดล้อมและข้อจำกัด</h2>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">เวลาทำการของพื้นที่ (Working Hours)</label>
            <input
              type="text"
              value={formData.workingHours}
              onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">เงื่อนไขการเข้าพื้นที่ (Access Notes)</label>
            <textarea
              rows={2}
              value={formData.accessNotes}
              onChange={(e) => setFormData({ ...formData, accessNotes: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ความเสี่ยงด้านความปลอดภัย (Risk Notes)</label>
            <textarea
              rows={2}
              value={formData.riskNotes}
              onChange={(e) => setFormData({ ...formData, riskNotes: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Basic Facility Checklist */}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <span className="text-xs font-bold text-gray-800 block">สิ่งอำนวยความสะดวกในพื้นที่</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.checklist.powerAvailable}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checklist: { ...formData.checklist, powerAvailable: e.target.checked },
                    })
                  }
                />
                มีจุดจ่ายไฟพร้อม
              </label>
              <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.checklist.waterAvailable}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checklist: { ...formData.checklist, waterAvailable: e.target.checked },
                    })
                  }
                />
                มีจุดจ่ายน้ำประปา
              </label>
              <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.checklist.parkingAvailable}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checklist: { ...formData.checklist, parkingAvailable: e.target.checked },
                    })
                  }
                />
                มีที่จอดรถประจำ
              </label>
              <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.checklist.securityGate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checklist: { ...formData.checklist, securityGate: e.target.checked },
                    })
                  }
                />
                มีป้อมรปภ./จุดตรวจ
              </label>
            </div>
          </div>
        </div>

        {/* Photos Section */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xs uppercase text-gray-400 tracking-wider">ภาพถ่ายหน้างาน ({formData.photos.length})</h2>
            <button
              type="button"
              onClick={handleSimulatePhoto}
              className="text-xs text-purple-600 font-semibold flex items-center gap-1 hover:underline"
            >
              <Camera className="w-3.5 h-3.5" /> เพิ่มรูปถ่าย
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {formData.photos.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Photo ${i + 1}`}
                className="w-full h-20 object-cover rounded-lg border border-gray-200"
              />
            ))}
            {formData.photos.length === 0 && (
              <div
                onClick={handleSimulatePhoto}
                className="col-span-3 py-6 border-2 border-dashed border-gray-200 rounded-lg text-center cursor-pointer text-gray-400 hover:border-purple-300"
              >
                <Camera className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                <span className="text-xs">แตะเพื่อถ่ายรูปหรืออัพโหลดภาพพื้นที่</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleSaveLocal}
            className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-xs hover:bg-gray-50 transition"
          >
            <Save className="w-4 h-4 text-gray-500" />
            บันทึกฉบับร่าง
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-sm hover:bg-purple-700 transition"
          >
            <Send className="w-4 h-4" />
            {submitting ? "กำลังส่ง..." : "ส่งผลสำรวจ"}
          </button>
        </div>
      </form>
    </div>
  );
}
