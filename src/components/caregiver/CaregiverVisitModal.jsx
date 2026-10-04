// src/components/caregiver/CaregiverVisitModal.jsx
import React, { useState } from 'react';
import { db } from '../../lib/db';
import { supabase } from '../../lib/supabase';

const ACTIVITIES_LIST = [
  'ดูแลสุขอนามัย/เช็ดตัว/สระผม',
  'ทำแผล/เปลี่ยนสายยาง',
  'ช่วยพลิกตัวทุก 2 ชั่วโมง',
  'ทำกายภาพบำบัด/ขยับข้อต่อ',
  'ดูแลการจัดยาและอาหาร',
  'วัดสัญญาณชีพเบื้องต้น',
  'พูดคุยประเมินสุขภาพจิต'
];

export default function CaregiverVisitModal({ patient, currentUser, onClose, onSaved }) {
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [generalCondition, setGeneralCondition] = useState('สดชื่นดี');
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [problemsFound, setProblemsFound] = useState('');
  const [needsNurse, setNeedsNurse] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [gps, setGps] = useState({ lat: null, lng: null });
  const [loadingGps, setLoadingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleActivity = (act) => {
    setSelectedActivities((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
    );
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('อุปกรณ์นี้ไม่รองรับการดึงพิกัด GPS');
      return;
    }
    setLoadingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoadingGps(false);
      },
      (err) => {
        alert('ไม่สามารถดึงพิกัดได้: ' + err.message);
        setLoadingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photos.length > 2) {
      alert('แนบภาพได้สูงสุด 2 ภาพ');
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const recordId = crypto.randomUUID();
    const payload = {
      id: recordId,
      assignment_id: patient?.id,
      patient_name: patient?.patient_name || 'ไม่ระบุชื่อ',
      village_no: patient?.village_no || 1,
      visit_date: visitDate,
      caregiver_id: currentUser?.cid || '1234567890123',
      caregiver_name: currentUser?.name || 'Caregiver ประจำพื้นที่',
      general_condition: generalCondition,
      care_activities: selectedActivities,
      problems_found: problemsFound.trim() || null,
      needs_nurse_visit: needsNurse,
      photo_1: photos[0] || null,
      photo_2: photos[1] || null,
      lat: gps.lat,
      lng: gps.lng,
      created_at: new Date().toISOString()
    };

    try {
      if (navigator.onLine) {
        await supabase.from('caregiver_visit_logs').insert([payload]);
      }
      if (db.caregiverVisitLogs) {
        await db.caregiverVisitLogs.put({ ...payload, sync_status: navigator.onLine ? 'synced' : 'pending' });
      }

      alert('บันทึกผลการเยี่ยมเรียบร้อย');
      if (onSaved) onSaved(payload);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto font-sans">
        <div className="flex justify-between items-center border-b pb-3 mb-4 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
              <span>🩺</span> บันทึกการเยี่ยมของ Caregiver / อสม.
            </h3>
            <p className="text-xs text-emerald-800 font-medium">
              ผู้ป่วย: {patient?.patient_name} (ม.{patient?.village_no})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">วันที่ลงเยี่ยม</label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">สภาพร่างกายและอาการทั่วไป</label>
            <select
              value={generalCondition}
              onChange={(e) => setGeneralCondition(e.target.value)}
              className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            >
              <option value="สดชื่นดี">สดชื่นดี / ตอบสนองได้ปกติ</option>
              <option value="อ่อนเพลีย">อ่อนเพลีย / ทานอาหารได้น้อย</option>
              <option value="มีไข้">มีไข้ / ตัวร้อน</option>
              <option value="ซึมลง">ซึมลง / ปลุกตื่นยาก</option>
              <option value="มีแผลกดทับ">มีรอยแดงหรือแผลกดทับเริ่มแรก</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">กิจกรรมการดูแลที่ปฏิบัติ</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACTIVITIES_LIST.map((act) => (
                <button
                  type="button"
                  key={act}
                  onClick={() => toggleActivity(act)}
                  className={`p-2 rounded-xl text-left border transition ${
                    selectedActivities.includes(act)
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {selectedActivities.includes(act) ? '✓ ' : '+ '} {act}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
            <div>
              <span className="font-semibold text-slate-800 block">พิกัด GPS ตำแหน่งบ้าน</span>
              <span className="text-[11px] text-slate-500">
                {gps.lat ? `Lat: ${gps.lat.toFixed(5)}, Lng: ${gps.lng.toFixed(5)}` : 'ยังไม่ได้ดึงพิกัด'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={loadingGps}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-medium transition"
            >
              {loadingGps ? 'กำลังระบุ...' : '📍 ดึงพิกัด'}
            </button>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">ภาพถ่ายขณะลงเยี่ยม (สูงสุด 2 รูป)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:text-emerald-700 file:font-semibold"
            />
            {photos.length > 0 && (
              <div className="flex gap-2 mt-2">
                {photos.map((src, i) => (
                  <img key={i} src={src} alt="Visit log" className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-sm" />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">ปัญหาที่พบ / ข้อสังเกตเพิ่มเติม</label>
            <textarea
              rows="2"
              value={problemsFound}
              onChange={(e) => setProblemsFound(e.target.value)}
              placeholder="เช่น ยาหมด, มีแผลกดทับ, นมผง/แพมเพิสไม่พอ..."
              className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5">
            <input
              type="checkbox"
              id="nurseNeed"
              checked={needsNurse}
              onChange={(e) => setNeedsNurse(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded"
            />
            <label htmlFor="nurseNeed" className="text-rose-900 font-semibold cursor-pointer">
              แจ้งเตือน: ส่งต่อให้พยาบาลวิชาชีพ รพ.สต. ร่วมลงตรวจประเมิน
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-medium transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl font-medium transition shadow disabled:opacity-50"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกการเยี่ยม'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}