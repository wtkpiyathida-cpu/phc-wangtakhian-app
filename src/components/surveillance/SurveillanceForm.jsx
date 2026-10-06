// src/components/surveillance/SurveillanceForm.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db';

export default function SurveillanceForm({ editingRecord, patient, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    patient_name: '',
    cid: '',
    age: '',
    village_no: '1',
    disease_code: 'DENGUE',
    disease_name: 'โรคไข้เลือดออก (DHF)',
    onset_date: new Date().toISOString().split('T')[0],
    diagnosis_date: new Date().toISOString().split('T')[0],
    investigation_status: 'รอสอบสวนโรค',
    fogging_done: false,
    larvae_survey_done: false,
    remarks: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        patient_name: editingRecord.patient_name || '',
        cid: editingRecord.cid || '',
        age: editingRecord.age || '',
        village_no: String(editingRecord.village_no || '1'),
        disease_code: editingRecord.disease_code || 'DENGUE',
        disease_name: editingRecord.disease_name || 'โรคไข้เลือดออก (DHF)',
        onset_date: editingRecord.onset_date || new Date().toISOString().split('T')[0],
        diagnosis_date: editingRecord.diagnosis_date || new Date().toISOString().split('T')[0],
        investigation_status: editingRecord.investigation_status || 'รอสอบสวนโรค',
        fogging_done: !!editingRecord.fogging_done,
        larvae_survey_done: !!editingRecord.larvae_survey_done,
        remarks: editingRecord.remarks || ''
      });
    } else if (patient) {
      setFormData(prev => ({
        ...prev,
        patient_name: patient.full_name || patient.patient_name || '',
        cid: patient.cid || '',
        village_no: String(patient.village_no || '1')
      }));
    }
  }, [editingRecord, patient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const recordId = editingRecord ? editingRecord.id : crypto.randomUUID();
    const payload = {
      id: recordId,
      ...formData,
      village_no: parseInt(formData.village_no, 10),
      age: formData.age ? parseInt(formData.age, 10) : null,
      updated_at: new Date().toISOString()
    };

    if (!editingRecord) payload.created_at = new Date().toISOString();

    try {
      if (editingRecord) {
        if (navigator.onLine) {
          await supabase.from('disease_surveillance').update(payload).eq('id', recordId);
        }
        if (db.diseaseSurveillance) {
          await db.diseaseSurveillance.put({ ...payload, sync_status: 'synced' });
        }
        alert('แก้ไขข้อมูลเฝ้าระวังโรคเรียบร้อย');
      } else {
        if (navigator.onLine) {
          await supabase.from('disease_surveillance').insert([payload]);
        }
        if (db.diseaseSurveillance) {
          await db.diseaseSurveillance.put({ ...payload, sync_status: 'synced' });
        }
        alert('บันทึกเคสเฝ้าระวังโรคเรียบร้อย');
      }

      if (onSaved) onSaved(payload);
      if (onClose) onClose();
    } catch (err) {
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-xl w-full font-sans">
      <div className="flex justify-between items-center border-b pb-3 mb-4">
        <h3 className="font-bold text-slate-800 text-base">
          🚨 {editingRecord ? 'แก้ไขข้อมูลเคสเฝ้าระวังโรค' : 'บันทึกเคสเฝ้าระวังโรคติดต่อ (506)'}
        </h3>
        <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">ชื่อ - สกุล ผู้ป่วย *</label>
            <input
              type="text"
              required
              value={formData.patient_name}
              onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
              className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">เลขประจำตัวประชาชน (CID)</label>
            <input
              type="text"
              maxLength="13"
              value={formData.cid}
              onChange={(e) => setFormData({ ...formData, cid: e.target.value })}
              className="w-full border rounded-xl p-2.5 font-mono outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">โรคติดต่อที่เฝ้าระวัง</label>
            <select
              value={formData.disease_name}
              onChange={(e) => setFormData({ ...formData, disease_name: e.target.value })}
              className="w-full border rounded-xl p-2.5 outline-none"
            >
              <option value="โรคไข้เลือดออก (DHF)">โรคไข้เลือดออก (DHF)</option>
              <option value="โรคอุจจาระร่วงเฉียบพลัน (Acute Diarrhea)">โรคอุจจาระร่วงเฉียบพลัน (Acute Diarrhea)</option>
              <option value="โรคมือเท้าปาก (HFMD)">โรคมือเท้าปาก (HFMD)</option>
              <option value="โรคไข้หวัดใหญ่ (Influenza)">โรคไข้หวัดใหญ่ (Influenza)</option>
              <option value="โรคโควิด-19 (COVID-19)">โรคโควิด-19 (COVID-19)</option>
              <option value="โรคสครับไทฟัส (Scrub typhus)">โรคสครับไทฟัส (Scrub typhus)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">หมู่ที่ (ต.วังตะเคียน)</label>
            <select
              value={formData.village_no}
              onChange={(e) => setFormData({ ...formData, village_no: e.target.value })}
              className="w-full border rounded-xl p-2.5 outline-none"
            >
              {Array.from({ length: 17 }, (_, i) => i + 1).map((v) => (
                <option key={v} value={v}>หมู่ {v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">วันที่เริ่มมีอาการ</label>
            <input
              type="date"
              value={formData.onset_date}
              onChange={(e) => setFormData({ ...formData, onset_date: e.target.value })}
              className="w-full border rounded-xl p-2.5 outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">สถานะการสอบสวนโรค</label>
            <select
              value={formData.investigation_status}
              onChange={(e) => setFormData({ ...formData, investigation_status: e.target.value })}
              className="w-full border rounded-xl p-2.5 outline-none font-semibold text-amber-900"
            >
              <option value="รอสอบสวนโรค">รอสอบสวนโรค</option>
              <option value="กำลังสอบสวนโรค">กำลังสอบสวนโรค</option>
              <option value="สอบสวนโรคแล้ว">สอบสวนโรคแล้ว</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-amber-900">
            <input
              type="checkbox"
              checked={formData.fogging_done}
              onChange={(e) => setFormData({ ...formData, fogging_done: e.target.checked })}
              className="w-4 h-4 rounded text-amber-600"
            />
            พ่นหมอกควันแล้ว
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-amber-900">
            <input
              type="checkbox"
              checked={formData.larvae_survey_done}
              onChange={(e) => setFormData({ ...formData, larvae_survey_done: e.target.checked })}
              className="w-4 h-4 rounded text-amber-600"
            />
            สำรวจลูกน้ำยุงลายแล้ว
          </label>
        </div>

        <div>
          <label className="block font-semibold mb-1">บันทึกเพิ่มเติม / ผลการควบคุมโรค</label>
          <textarea
            rows="2"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="รายละเอียดการลงพื้นที่..."
            className="w-full border rounded-xl p-2.5 outline-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-medium">ยกเลิก</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow">
            {loading ? 'กำลังบันทึก...' : editingRecord ? 'บันทึกการแก้ไข' : 'บันทึกเคส'}
          </button>
        </div>
      </form>
    </div>
  );
}