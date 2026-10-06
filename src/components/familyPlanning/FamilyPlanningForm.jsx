// src/components/familyPlanning/FamilyPlanningForm.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db';

export default function FamilyPlanningForm({ editingRecord, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    patient_name: '',
    cid: '',
    age: '',
    village_no: '1',
    service_date: new Date().toISOString().split('T')[0],
    method: 'ยาเม็ดคุมกำเนิด',
    product_name: '',
    quantity: '1',
    next_appointment_date: '',
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
        service_date: editingRecord.service_date || new Date().toISOString().split('T')[0],
        method: editingRecord.method || 'ยาเม็ดคุมกำเนิด',
        product_name: editingRecord.product_name || '',
        quantity: String(editingRecord.quantity || '1'),
        next_appointment_date: editingRecord.next_appointment_date || '',
        remarks: editingRecord.remarks || ''
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
      quantity: parseInt(formData.quantity, 10) || 1,
      updated_at: new Date().toISOString()
    };

    if (!editingRecord) payload.created_at = new Date().toISOString();

    try {
      if (editingRecord) {
        if (navigator.onLine) {
          await supabase.from('family_planning').update(payload).eq('id', recordId);
        }
        if (db.familyPlanning) {
          await db.familyPlanning.put({ ...payload, sync_status: 'synced' });
        }
        alert('แก้ไขข้อมูลวางแผนครอบครัวเรียบร้อย');
      } else {
        if (navigator.onLine) {
          await supabase.from('family_planning').insert([payload]);
        }
        if (db.familyPlanning) {
          await db.familyPlanning.put({ ...payload, sync_status: 'synced' });
        }
        alert('บันทึกข้อมูลวางแผนครอบครัวเรียบร้อย');
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
          💊 {editingRecord ? 'แก้ไขข้อมูลวางแผนครอบครัว' : 'บันทึกบริการวางแผนครอบครัว'}
        </h3>
        <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">ชื่อ - สกุล ผู้รับบริการ *</label>
            <input
              type="text"
              required
              value={formData.patient_name}
              onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
              className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-purple-500"
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
            <label className="block font-semibold mb-1">วิธีคุมกำเนิด</label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              className="w-full border rounded-xl p-2.5 outline-none font-semibold text-purple-900"
            >
              <option value="ยาเม็ดคุมกำเนิด">ยาเม็ดคุมกำเนิด</option>
              <option value="ยาฉีดคุมกำเนิด (DMPA 3 เดือน)">ยาฉีดคุมกำเนิด (DMPA 3 เดือน)</option>
              <option value="ยาฉีดคุมกำเนิด (Cyclofem 1 เดือน)">ยาฉีดคุมกำเนิด (Cyclofem 1 เดือน)</option>
              <option value="ยาฝังคุมกำเนิด (Implant)">ยาฝังคุมกำเนิด (Implant)</option>
              <option value="ห่วงอนามัย (IUD)">ห่วงอนามัย (IUD)</option>
              <option value="ถุงยางอนามัย">ถุงยางอนามัย</option>
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
            <label className="block font-semibold mb-1">วันที่รับบริการ</label>
            <input
              type="date"
              value={formData.service_date}
              onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
              className="w-full border rounded-xl p-2.5 outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">วันนัดรับบริการครั้งถัดไป</label>
            <input
              type="date"
              value={formData.next_appointment_date}
              onChange={(e) => setFormData({ ...formData, next_appointment_date: e.target.value })}
              className="w-full border rounded-xl p-2.5 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">หมายเหตุ / คำแนะนำ</label>
          <textarea
            rows="2"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            className="w-full border rounded-xl p-2.5 outline-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-medium">ยกเลิก</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-semibold shadow">
            {loading ? 'กำลังบันทึก...' : editingRecord ? 'บันทึกการแก้ไข' : 'บันทึกบริการ'}
          </button>
        </div>
      </form>
    </div>
  );
}