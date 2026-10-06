// src/components/refer/ReferForm.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db';

export default function ReferForm({ editingRecord, currentUser, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    refer_no: '',
    patient_name: '',
    cid: '',
    age: '',
    gender: 'ชาย',
    village_no: '1',
    house_no: '',
    refer_date: new Date().toISOString().split('T')[0],
    refer_time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }),
    destination_hospital: 'โรงพยาบาลกบินทร์บุรี',
    urgency: 'ด่วนมาก',
    bp: '120/80',
    pulse: '80',
    temp: '36.5',
    o2sat: '98',
    cc_pe: '',
    preliminary_diagnosis: '',
    refer_reason: 'เกินขีดความสามารถในการตรวจรักษาของ รพ.สต.',
    pre_refer_treatment: ''
  });

  const [loading, setLoading] = useState(false);

  // ดึงข้อมูลเดิมมาใส่ฟอร์มหากเป็นการกด "แก้ไข"
  useEffect(() => {
    if (editingRecord) {
      setFormData({
        refer_no: editingRecord.refer_no || '',
        patient_name: editingRecord.patient_name || '',
        cid: editingRecord.cid || '',
        age: editingRecord.age || '',
        gender: editingRecord.gender || 'ชาย',
        village_no: String(editingRecord.village_no || '1'),
        house_no: editingRecord.house_no || '',
        refer_date: editingRecord.refer_date || new Date().toISOString().split('T')[0],
        refer_time: editingRecord.refer_time || '',
        destination_hospital: editingRecord.destination_hospital || 'โรงพยาบาลกบินทร์บุรี',
        urgency: editingRecord.urgency || 'ด่วนมาก',
        bp: editingRecord.bp || '',
        pulse: editingRecord.pulse || '',
        temp: editingRecord.temp || '',
        o2sat: editingRecord.o2sat || '',
        cc_pe: editingRecord.cc_pe || '',
        preliminary_diagnosis: editingRecord.preliminary_diagnosis || '',
        refer_reason: editingRecord.refer_reason || '',
        pre_refer_treatment: editingRecord.pre_refer_treatment || ''
      });
    }
  }, [editingRecord]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const recordId = editingRecord ? editingRecord.id : crypto.randomUUID();
    const payload = {
      id: recordId,
      ...formData,
      village_no: parseInt(formData.village_no, 10),
      age: formData.age ? parseInt(formData.age, 10) : null,
      sender_name: currentUser?.name || 'พยาบาลวิชาชีพ',
      sender_position: currentUser?.position || 'พยาบาลวิชาชีพ',
      status: editingRecord?.status || 'อยู่ระหว่างส่งต่อ',
      updated_at: new Date().toISOString()
    };

    if (!editingRecord) {
      payload.created_at = new Date().toISOString();
    }

    try {
      if (editingRecord) {
        // อัปเดตข้อมูลเดิม (Update)
        if (navigator.onLine) {
          const { error } = await supabase.from('patient_refers').update(payload).eq('id', recordId);
          if (error) console.error('Supabase update warning:', error.message);
        }
        if (db.patientRefers) {
          await db.patientRefers.put({ ...payload, sync_status: 'synced' });
        }
        alert('แก้ไขข้อมูลส่งต่อเรียบร้อยแล้ว');
      } else {
        // เพิ่มข้อมูลใหม่ (Insert)
        if (navigator.onLine) {
          const { error } = await supabase.from('patient_refers').insert([payload]);
          if (error) console.error('Supabase insert warning:', error.message);
        }
        if (db.patientRefers) {
          await db.patientRefers.put({ ...payload, sync_status: 'synced' });
        }
        alert('บันทึกการส่งต่อผู้ป่วยเรียบร้อยแล้ว');
      }

      if (onSaved) onSaved(payload);
      if (onClose) onClose();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto font-sans">
      <div className="flex justify-between items-center border-b pb-3 mb-4 sticky top-0 bg-white z-10">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <span>🚑</span> {editingRecord ? 'แก้ไขข้อมูลส่งต่อผู้ป่วย' : 'บันทึกส่งต่อผู้ป่วย (Refer Out)'}
          </h3>
          <p className="text-xs text-blue-700 font-medium">
            ผู้บันทึก: {currentUser?.name} ({currentUser?.position})
          </p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* ข้อมูลพื้นฐานผู้ป่วย */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <span className="font-bold text-slate-800 text-xs block">1. ข้อมูลผู้ป่วย & สถานที่ส่งต่อ</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">ชื่อ - สกุล ผู้ป่วย *</label>
              <input
                type="text"
                required
                value={formData.patient_name}
                onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                placeholder="เช่น นายสมชาย หวันทา"
                className="w-full border rounded-xl p-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-600"
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
                className="w-full border rounded-xl p-2.5 bg-white font-mono outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">อายุ (ปี)</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="เช่น 59"
                className="w-full border rounded-xl p-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">เพศ</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full border rounded-xl p-2.5 bg-white outline-none"
              >
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">หมู่ที่ (ต.วังตะเคียน)</label>
              <select
                value={formData.village_no}
                onChange={(e) => setFormData({ ...formData, village_no: e.target.value })}
                className="w-full border rounded-xl p-2.5 bg-white outline-none"
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
                placeholder="เช่น 36/1"
                className="w-full border rounded-xl p-2.5 bg-white outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ส่งต่อไปยังสถานพยาบาล</label>
              <input
                type="text"
                value={formData.destination_hospital}
                onChange={(e) => setFormData({ ...formData, destination_hospital: e.target.value })}
                className="w-full border rounded-xl p-2.5 bg-white outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ระดับความเร่งด่วน</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                className="w-full border rounded-xl p-2.5 bg-white outline-none font-semibold text-blue-900"
              >
                <option value="ทั่วไป">ทั่วไป (Non-urgent)</option>
                <option value="ด่วนมาก">ด่วนมาก (Urgent)</option>
                <option value="ฉุกเฉิน">ฉุกเฉิน (Emergency)</option>
              </select>
            </div>
          </div>
        </div>

        {/* สัญญาณชีพแรกรับ */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <span className="font-bold text-slate-800 text-xs block">2. สัญญาณชีพแรกรับก่อนส่งต่อ (Vital Signs)</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">BP (mmHg)</label>
              <input
                type="text"
                value={formData.bp}
                onChange={(e) => setFormData({ ...formData, bp: e.target.value })}
                placeholder="120/80"
                className="w-full border rounded-xl p-2 bg-white text-center"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pulse (bpm)</label>
              <input
                type="text"
                value={formData.pulse}
                onChange={(e) => setFormData({ ...formData, pulse: e.target.value })}
                placeholder="80"
                className="w-full border rounded-xl p-2 bg-white text-center"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Temp (°C)</label>
              <input
                type="text"
                value={formData.temp}
                onChange={(e) => setFormData({ ...formData, temp: e.target.value })}
                placeholder="36.5"
                className="w-full border rounded-xl p-2 bg-white text-center"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">O2 Sat (%)</label>
              <input
                type="text"
                value={formData.o2sat}
                onChange={(e) => setFormData({ ...formData, o2sat: e.target.value })}
                placeholder="98"
                className="w-full border rounded-xl p-2 bg-white text-center"
              />
            </div>
          </div>
        </div>

        {/* อาการและการวินิจฉัย */}
        <div className="space-y-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">อาการสำคัญและการตรวจพบ (CC & PE)</label>
            <textarea
              rows="2"
              value={formData.cc_pe}
              onChange={(e) => setFormData({ ...formData, cc_pe: e.target.value })}
              placeholder="อาการสำคัญที่พบก่อนส่งต่อ..."
              className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">การวินิจฉัยโรคเบื้องต้น (Impression) *</label>
              <input
                type="text"
                required
                value={formData.preliminary_diagnosis}
                onChange={(e) => setFormData({ ...formData, preliminary_diagnosis: e.target.value })}
                placeholder="เช่น Eye trauma, R/o Appendicitis"
                className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">สาเหตุการส่งต่อผู้ป่วย</label>
              <input
                type="text"
                value={formData.refer_reason}
                onChange={(e) => setFormData({ ...formData, refer_reason: e.target.value })}
                className="w-full border rounded-xl p-2.5 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">การรักษาพยาบาล / ยาที่ให้ก่อนส่งต่อ</label>
            <textarea
              rows="2"
              value={formData.pre_refer_treatment}
              onChange={(e) => setFormData({ ...formData, pre_refer_treatment: e.target.value })}
              placeholder="เช่น NSS 1000 ml IV drip, Paracetamol 500 mg 1 tab..."
              className="w-full border rounded-xl p-2.5 outline-none"
            />
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
            disabled={loading}
            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold shadow disabled:opacity-50"
          >
            {loading ? 'กำลังบันทึก...' : editingRecord ? 'บันทึกการแก้ไข' : 'บันทึกการส่งต่อผู้ป่วย'}
          </button>
        </div>
      </form>
    </div>
  );
}