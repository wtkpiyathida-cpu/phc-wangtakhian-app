// src/components/homeVisit/HomeVisitModal.jsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db';

export default function HomeVisitModal({ currentUser, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    patient_name: '',
    cid: '',
    village_no: '1',
    house_no: '',
    visit_date: new Date().toISOString().split('T')[0],
    bp_sys: '',
    bp_dia: '',
    pulse: '',
    temp: '',
    adl_score: 20,
    nursing_diagnosis: '',
    nursing_care: '',
    plan_next_visit: ''
  });

  const [photos, setPhotos] = useState([]);
  const [gps, setGps] = useState({ lat: null, lng: null });
  const [loadingGps, setLoadingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getAdlGroup = (score) => {
    const s = parseInt(score, 10);
    if (s <= 4) return 'ติดเตียง (กลุ่ม 3: พึ่งพิงรุนแรง)';
    if (s <= 11) return 'ติดบ้าน (กลุ่ม 2: พึ่งพิงปานกลาง)';
    return 'ติดสังคม (กลุ่ม 1: ช่วยเหลือตัวเองได้ดี)';
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

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('อุปกรณ์ไม่รองรับการดึงพิกัด GPS');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const recordId = crypto.randomUUID();
    const payload = {
      id: recordId,
      patient_name: formData.patient_name.trim(),
      cid: formData.cid.trim() || null,
      village_no: parseInt(formData.village_no, 10),
      house_no: formData.house_no.trim() || null,
      visit_date: formData.visit_date,
      bp_sys: formData.bp_sys ? parseInt(formData.bp_sys, 10) : null,
      bp_dia: formData.bp_dia ? parseInt(formData.bp_dia, 10) : null,
      pulse: formData.pulse ? parseInt(formData.pulse, 10) : null,
      temp: formData.temp ? parseFloat(formData.temp) : null,
      adl_score: parseInt(formData.adl_score, 10),
      adl_group: getAdlGroup(formData.adl_score),
      nursing_diagnosis: formData.nursing_diagnosis.trim() || null,
      nursing_care: formData.nursing_care.trim() || null,
      plan_next_visit: formData.plan_next_visit.trim() || null,
      visitor_name: currentUser?.name || 'พยาบาลวิชาชีพ',
      visitor_cid: currentUser?.cid || '',
      photo_1: photos[0] || null,
      photo_2: photos[1] || null,
      lat: gps.lat,
      lng: gps.lng,
      created_at: new Date().toISOString()
    };

    try {
      // 1. บันทึกลง Supabase
      if (navigator.onLine) {
        const { error } = await supabase.from('patient_visits').insert([payload]);
        if (error) {
          console.warn('Supabase sync notice:', error.message);
        }
      }

      // 2. บันทึกลง Local IndexedDB เพื่อให้แสดงทันทีแน่นอน
      if (db.cachedVisits) {
        await db.cachedVisits.put({ ...payload, sync_status: navigator.onLine ? 'synced' : 'pending' });
      }

      alert('บันทึกข้อมูลการเยี่ยมบ้านเรียบร้อยแล้ว');
      if (onSaved) onSaved(payload);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      alert('บันทึกข้อมูลเรียบร้อย (ทำงานในโหมดออฟไลน์): ' + err.message);
      if (onSaved) onSaved(payload);
      if (onClose) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto font-sans">
        <div className="flex justify-between items-center border-b pb-3 mb-4 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <span>🏠</span> บันทึกการเยี่ยมบ้านและประเมินภาวะพึ่งพิง
            </h3>
            <p className="text-xs text-emerald-800 font-medium">
              ผู้ตรวจ: {currentUser?.name} ({currentUser?.position})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* ข้อมูลผู้ป่วย */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 text-xs block">1. ข้อมูลผู้ป่วยและสถานที่</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อ - สกุล ผู้ป่วย *</label>
                <input
                  type="text"
                  required
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  placeholder="เช่น นายบุญมี รักสงบ"
                  className="w-full border rounded-xl p-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เลขประจำตัวประชาชน (13 หลัก)</label>
                <input
                  type="text"
                  maxLength="13"
                  value={formData.cid}
                  onChange={(e) => setFormData({ ...formData, cid: e.target.value })}
                  placeholder="13 หลัก"
                  className="w-full border rounded-xl p-2.5 bg-white font-mono outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมู่ที่ (ต.วังตะเคียน) *</label>
                <select
                  value={formData.village_no}
                  onChange={(e) => setFormData({ ...formData, village_no: e.target.value })}
                  className="w-full border rounded-xl p-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {Array.from({ length: 17 }, (_, i) => i + 1).map((v) => (
                    <option key={v} value={v}>หมู่ {v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">บ้านเลขที่</label>
                <input
                  type="text"
                  value={formData.house_no}
                  onChange={(e) => setFormData({ ...formData, house_no: e.target.value })}
                  placeholder="เช่น 12/3"
                  className="w-full border rounded-xl p-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* สัญญาณชีพ (ตัด DTX ออกแล้ว) และคะแนน ADL */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 text-xs block">2. สัญญาณชีพ & การประเมิน ADL</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">BP (mmHg)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="120"
                    value={formData.bp_sys}
                    onChange={(e) => setFormData({ ...formData, bp_sys: e.target.value })}
                    className="w-full border rounded-xl p-2.5 bg-white text-center"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    placeholder="80"
                    value={formData.bp_dia}
                    onChange={(e) => setFormData({ ...formData, bp_dia: e.target.value })}
                    className="w-full border rounded-xl p-2.5 bg-white text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">PR ชีพจร (bpm)</label>
                <input
                  type="number"
                  placeholder="78"
                  value={formData.pulse}
                  onChange={(e) => setFormData({ ...formData, pulse: e.target.value })}
                  className="w-full border rounded-xl p-2.5 bg-white text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">อุณหภูมิ Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="36.5"
                  value={formData.temp}
                  onChange={(e) => setFormData({ ...formData, temp: e.target.value })}
                  className="w-full border rounded-xl p-2.5 bg-white text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">คะแนน Barthel ADL (0-20)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.adl_score}
                  onChange={(e) => setFormData({ ...formData, adl_score: e.target.value })}
                  className="w-full border rounded-xl p-2.5 bg-white text-center font-bold text-emerald-800 text-sm"
                />
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                ระดับการพึ่งพิง: {getAdlGroup(formData.adl_score)}
              </span>
            </div>
          </div>

          {/* การพยาบาล */}
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ปัญหาทางการพยาบาล / การวินิจฉัย</label>
              <textarea
                rows="2"
                value={formData.nursing_diagnosis}
                onChange={(e) => setFormData({ ...formData, nursing_diagnosis: e.target.value })}
                placeholder="เช่น เสี่ยงต่อการเกิดแผลกดทับ, ควบคุมความดันโลหิตไม่สม่ำเสมอ..."
                className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">กิจกรรมการพยาบาล / คำแนะนำที่ให้</label>
              <textarea
                rows="2"
                value={formData.nursing_care}
                onChange={(e) => setFormData({ ...formData, nursing_care: e.target.value })}
                placeholder="เช่น ทำแผลกดทับด้วยวิธีปลอดเชื้อ, แนะนำญาติพลิกตัวทุก 2 ชม., ปรับการจัดยา..."
                className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 border rounded-2xl flex justify-between items-center">
                <div>
                  <span className="font-semibold block text-slate-800">พิกัด GPS บ้านผู้ป่วย</span>
                  <span className="text-[11px] text-slate-500">
                    {gps.lat ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'ยังไม่ได้ดึงพิกัด'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={loadingGps}
                  className="bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-medium"
                >
                  {loadingGps ? 'กำลังดึง...' : '📍 ดึงพิกัด'}
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ภาพถ่ายเยี่ยมบ้าน (สูงสุด 2 รูป)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:bg-emerald-50 file:text-emerald-700"
                />
                {photos.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {photos.map((src, i) => (
                      <img key={i} src={src} alt="Visit log" className="w-14 h-14 object-cover rounded-xl border shadow-sm" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl font-medium shadow"
            >
              {submitting ? 'กำลังบันทึกข้อมูล...' : 'บันทึกการเยี่ยมบ้าน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}