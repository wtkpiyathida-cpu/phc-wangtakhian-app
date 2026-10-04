import React, { useState } from 'react';
import { db } from '../../lib/db';
import { supabase } from '../../lib/supabase';

const DISEASE_OPTIONS = [
  { value: 'dengue', label: 'ไข้เลือดออก (Dengue)' },
  { value: 'covid19', label: 'COVID-19' },
  { value: 'influenza', label: 'ไข้หวัดใหญ่' },
  { value: 'hfm', label: 'โรคมือเท้าปาก (HFM)' },
  { value: 'diarrhea', label: 'อุจจาระร่วงเฉียบพลัน' },
  { value: 'chikungunya', label: 'ไข้ปวดข้อยุงลาย' },
  { value: 'other', label: 'โรคติดต่ออื่นๆ' }
];

export default function SurveillanceForm({ patient, onSaved, onClose }) {
  const [formData, setFormData] = useState({
    disease: 'dengue',
    disease_other: '',
    onset_date: new Date().toISOString().split('T')[0],
    village_no: patient?.village_no || 1,
    status: 'suspected',
    latitude: '',
    longitude: '',
    fogging_done: false,
    temephos_distributed: false,
    notes: ''
  });

  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ดึงพิกัด GPS อัตโนมัติ
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('อุปกรณ์ไม่รองรับ GPS');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        }));
        setLocating(false);
      },
      (err) => {
        console.error(err);
        alert('ไม่สามารถดึงตำแหน่งพิกัดได้ กรุณาเปิดการอนุญาตตำแหน่งบนอุปกรณ์');
        setLocating(false);
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
      patient_id: patient?.id || null,
      village_no: parseInt(formData.village_no, 10),
      disease: formData.disease,
      disease_other: formData.disease === 'other' ? formData.disease_other : null,
      onset_date: formData.onset_date,
      status: formData.status,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      control_measures: {
        fogging_done: formData.fogging_done,
        temephos_distributed: formData.temephos_distributed
      },
      notes: formData.notes
    };

    try {
      if (navigator.onLine) {
        const { error } = await supabase.from('disease_surveillance').insert([payload]);
        if (error) throw error;
        await db.diseaseSurveillance.put({ ...payload, sync_status: 'synced' });
      } else {
        await db.diseaseSurveillance.put({ ...payload, sync_status: 'pending' });
        await db.syncQueue.add({
          table_name: 'disease_surveillance',
          action: 'INSERT',
          payload: payload,
          created_at: new Date().toISOString()
        });
      }

      alert('บันทึกข้อมูลเฝ้าระวังโรคสำเร็จ' + (!navigator.onLine ? ' (ออฟไลน์: บันทึกลงคิวซิงก์แล้ว)' : ''));
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-xl w-full mx-auto font-sans">
      <div className="flex justify-between items-start border-b pb-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">แบบบันทึกงานเฝ้าระวังโรคติดต่อ</h2>
          <p className="text-sm text-gray-500">
            ผู้ป่วย: <span className="font-semibold text-emerald-700">{patient?.full_name || 'ไม่ระบุชื่อ'}</span> {patient?.cid && `(CID: ${patient.cid})`}
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">
            &times;
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">กลุ่มโรค</label>
            <select
              value={formData.disease}
              onChange={(e) => setFormData({ ...formData, disease: e.target.value })}
              className="w-full border rounded-lg p-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            >
              {DISEASE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่มมีอาการ</label>
            <input
              type="date"
              value={formData.onset_date}
              onChange={(e) => setFormData({ ...formData, onset_date: e.target.value })}
              className="w-full border rounded-lg p-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              required
            />
          </div>
        </div>

        {formData.disease === 'other' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ระบุชื่อโรค</label>
            <input
              type="text"
              placeholder="เช่น โรคสุกใส, ไข้อีดำอีแดง"
              value={formData.disease_other}
              onChange={(e) => setFormData({ ...formData, disease_other: e.target.value })}
              className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมู่ที่ (ต.วังตะเคียน)</label>
            <select
              value={formData.village_no}
              onChange={(e) => setFormData({ ...formData, village_no: e.target.value })}
              className="w-full border rounded-lg p-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            >
              {Array.from({ length: 17 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>หมู่ที่ {m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สถานะผู้ป่วย</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full border rounded-lg p-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            >
              <option value="suspected">สงสัย / รอผลตรวจ</option>
              <option value="confirmed">ยืนยันผลตรวจ</option>
              <option value="under_control">อยู่ระหว่างควบคุมโรค</option>
              <option value="recovered">หายแล้ว / สิ้นสุดติดตาม</option>
              <option value="deceased">เสียชีวิต</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-700">พิกัดจุดเกิดโรค (GPS Spot)</span>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locating}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded transition"
            >
              {locating ? 'กำลังดึงพิกัด...' : '📍 ดึงพิกัดปัจจุบัน'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <input
              type="text"
              placeholder="Latitude"
              value={formData.latitude}
              readOnly
              className="border rounded p-1.5 bg-white text-gray-600 outline-none"
            />
            <input
              type="text"
              placeholder="Longitude"
              value={formData.longitude}
              readOnly
              className="border rounded p-1.5 bg-white text-gray-600 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">มาตรการควบคุมโรค</label>
          <div className="flex gap-4 text-sm">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={formData.fogging_done}
                onChange={(e) => setFormData({ ...formData, fogging_done: e.target.checked })}
                className="rounded text-emerald-600 mr-2"
              />
              พ่นหมอกควัน/ฆ่าเชื้อ
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={formData.temephos_distributed}
                onChange={(e) => setFormData({ ...formData, temephos_distributed: e.target.checked })}
                className="rounded text-emerald-600 mr-2"
              />
              แจกทรายอะเบท/เวชภัณฑ์
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">บันทึกเพิ่มเติม</label>
          <textarea
            rows="2"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="ประวัติการเดินทาง หรือข้อมูลเพิ่มเติม..."
            className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลเฝ้าระวังโรค'}
        </button>
      </form>
    </div>
  );
}