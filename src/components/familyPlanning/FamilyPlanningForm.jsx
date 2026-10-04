// src/components/familyPlanning/FamilyPlanningForm.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { supabase } from '../../lib/supabase';

const CONTRACEPTION_METHODS = [
  { value: 'dmpa_injection', label: 'ยาฉีดคุมกำเนิด DMPA (นัดถัดไป 12 สัปดาห์ / 84 วัน)', days: 84 },
  { value: 'oral_pills_coc', label: 'ยาเม็ดคุมกำเนิดชนิดฮอร์โมนรวม (COC - 28 วัน/แผง)', isPill: true },
  { value: 'oral_pills_pop', label: 'ยาเม็ดคุมกำเนิดชนิดฮอร์โมนเดี่ยวสำหรับแม่ให้นม (POP - 28 วัน/แผง)', isPill: true },
  { value: 'monthly_injection', label: 'ยาฉีดคุมกำเนิดชนิด 1 เดือน (นัดถัดไป 28 วัน)', days: 28 },
  { value: 'condom', label: 'ถุงยางอนามัย (นัดรับเพิ่ม 84 วัน)', days: 84 },
  { value: 'implant_3yr', label: 'ยาฝังคุมกำเนิด 3 ปี', years: 3 },
  { value: 'implant_5yr', label: 'ยาฝังคุมกำเนิด 5 ปี', years: 5 },
  { value: 'sterilization', label: 'ทำหมันถาวร (ไม่มีนัดหมาย)', noAppointment: true }
];

export default function FamilyPlanningForm({ patient, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    patient_name: patient?.full_name || '',
    cid: patient?.cid || '',
    house_no: '',
    village_no: patient?.village_no || 1,
    service_date: new Date().toISOString().split('T')[0],
    
    // ประวัติการตั้งครรภ์
    gravida: '',
    para: '',
    abortion: '',
    living: '',
    last_child_age: '',
    
    method: 'dmpa_injection',
    pill_cycles: 1,
    item_details: '',
    side_effects: '',
    next_appointment_date: ''
  });

  const [hasPreviousHistory, setHasPreviousHistory] = useState(false);
  const [searchingHistory, setSearchingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ฟังก์ชันค้นหาประวัติเดิมโดยใช้ "ชื่อ-สกุล" อย่างเดียว
  const handleSearchByName = async () => {
    const trimmedName = formData.patient_name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      alert('กรุณากรอกชื่อ-สกุลอย่างน้อย 2 ตัวอักษรเพื่อค้นหา');
      return;
    }

    setSearchingHistory(true);
    try {
      let prevRecord = null;

      // 1. ค้นหาใน Dexie (Local DB)
      const localRecords = await db.familyPlanning.toArray();
      prevRecord = localRecords
        .filter((r) => r.patient_name && r.patient_name.trim().includes(trimmedName))
        .sort((a, b) => new Date(b.service_date) - new Date(a.service_date))[0];

      // 2. ถ้าในเครื่องไม่พบ และต่อเน็ตอยู่ ให้ค้นหาใน Supabase
      if (!prevRecord && navigator.onLine) {
        const { data, error } = await supabase
          .from('family_planning')
          .select('cid, house_no, village_no, gravida, para, abortion, living, last_child_age')
          .ilike('patient_name', `%${trimmedName}%`)
          .order('service_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          prevRecord = data;
        }
      }

      if (prevRecord) {
        setFormData((prev) => ({
          ...prev,
          cid: prevRecord.cid || prev.cid,
          house_no: prevRecord.house_no || prev.house_no,
          village_no: prevRecord.village_no !== undefined ? prevRecord.village_no : prev.village_no,
          gravida: prevRecord.gravida ?? '',
          para: prevRecord.para ?? '',
          abortion: prevRecord.abortion ?? '',
          living: prevRecord.living ?? '',
          last_child_age: prevRecord.last_child_age ?? ''
        }));
        setHasPreviousHistory(true);
      } else {
        alert(`ไม่พบประวัติเดิมของ "${trimmedName}" (เป็นผู้รับบริการรายใหม่)`);
        setHasPreviousHistory(false);
      }
    } catch (err) {
      console.error('Error searching by name:', err);
    } finally {
      setSearchingHistory(false);
    }
  };

  // คำนวณวันนัดหมายครั้งถัดไปอัตโนมัติ
  useEffect(() => {
    if (!formData.service_date) return;

    const baseDate = new Date(formData.service_date);
    if (isNaN(baseDate.getTime())) return;

    const selectedMethod = CONTRACEPTION_METHODS.find((m) => m.value === formData.method);

    if (selectedMethod?.noAppointment) {
      setFormData((prev) => ({ ...prev, next_appointment_date: '' }));
      return;
    }

    const calculatedDate = new Date(baseDate);

    if (selectedMethod?.isPill) {
      const cycles = parseInt(formData.pill_cycles, 10) || 1;
      calculatedDate.setDate(calculatedDate.getDate() + cycles * 28);
    } else if (selectedMethod?.days) {
      calculatedDate.setDate(calculatedDate.getDate() + selectedMethod.days);
    } else if (selectedMethod?.years) {
      calculatedDate.setFullYear(calculatedDate.getFullYear() + selectedMethod.years);
    }

    setFormData((prev) => ({
      ...prev,
      next_appointment_date: calculatedDate.toISOString().split('T')[0]
    }));
  }, [formData.method, formData.service_date, formData.pill_cycles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const recordId = crypto.randomUUID();
    const payload = {
      id: recordId,
      patient_id: patient?.id || null,
      patient_name: formData.patient_name.trim() || 'ไม่ระบุชื่อ',
      cid: formData.cid.trim() || null,
      house_no: formData.house_no.trim() || null,
      village_no: parseInt(formData.village_no, 10),
      service_date: formData.service_date,
      
      // ประวัติการตั้งครรภ์
      gravida: formData.gravida !== '' ? parseInt(formData.gravida, 10) : null,
      para: formData.para !== '' ? parseInt(formData.para, 10) : null,
      abortion: formData.abortion !== '' ? parseInt(formData.abortion, 10) : null,
      living: formData.living !== '' ? parseInt(formData.living, 10) : null,
      last_child_age: formData.last_child_age ? formData.last_child_age.trim() : null,

      method: formData.method,
      item_details: formData.method.includes('oral_pills')
        ? `${formData.item_details || 'ยาเม็ดคุมกำเนิด'} (${formData.pill_cycles} แผง / ${formData.pill_cycles * 28} วัน)`.trim()
        : formData.item_details,
      side_effects: formData.side_effects,
      next_appointment_date: formData.next_appointment_date || null
    };

    try {
      if (navigator.onLine) {
        const { error } = await supabase.from('family_planning').insert([payload]);
        if (error) throw error;
        await db.familyPlanning.put({ ...payload, sync_status: 'synced' });
      } else {
        await db.familyPlanning.put({ ...payload, sync_status: 'pending' });
        await db.syncQueue.add({
          table_name: 'family_planning',
          action: 'INSERT',
          payload: payload,
          created_at: new Date().toISOString()
        });
      }

      alert('บันทึกข้อมูลวางแผนครอบครัวสำเร็จ' + (!navigator.onLine ? ' (ออฟไลน์: บันทึกในคิวซิงก์แล้ว)' : ''));
      if (onSaved) onSaved();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isPillMethod = formData.method === 'oral_pills_coc' || formData.method === 'oral_pills_pop';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 max-w-xl w-full mx-auto font-sans">
      <div className="flex justify-between items-start border-b pb-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>💊</span> บันทึกงานบริการวางแผนครอบครัว
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            โรงพยาบาลส่งเสริมสุขภาพตำบลวังตะเคียน
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none p-1"
          >
            &times;
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ชื่อผู้รับบริการ (มีปุ่มค้นหาประวัติเดิมด้วยชื่อ) & เลขบัตร */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อ-สกุล ผู้รับบริการ</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={formData.patient_name}
                onChange={(e) => {
                  setFormData({ ...formData, patient_name: e.target.value });
                  setHasPreviousHistory(false);
                }}
                placeholder="ระบุชื่อ-สกุล"
                className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                required
              />
              <button
                type="button"
                onClick={handleSearchByName}
                disabled={searchingHistory}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 rounded-lg text-xs font-medium whitespace-nowrap transition disabled:opacity-50"
              >
                {searchingHistory ? '...' : '🔍 ค้นหา'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">เลขประจำตัวประชาชน (13 หลัก)</label>
            <input
              type="text"
              maxLength="13"
              value={formData.cid}
              onChange={(e) => setFormData({ ...formData, cid: e.target.value })}
              placeholder="13 หลัก"
              className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* ประวัติการตั้งครรภ์เดิม */}
        <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <span>🤰</span> ประวัติการตั้งครรภ์และการคลอด
            </span>
            {hasPreviousHistory && (
              <span className="text-[11px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-semibold">
                ✓ ดึงจากประวัติเดิมสำเร็จ
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-[11px] text-gray-600 font-medium text-center mb-0.5">ครรภ์ที่ (G)</label>
              <input
                type="number"
                min="0"
                value={formData.gravida}
                onChange={(e) => setFormData({ ...formData, gravida: e.target.value })}
                placeholder="0"
                className="w-full border rounded-lg p-1.5 bg-white text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-600 font-medium text-center mb-0.5">คลอด (P)</label>
              <input
                type="number"
                min="0"
                value={formData.para}
                onChange={(e) => setFormData({ ...formData, para: e.target.value })}
                placeholder="0"
                className="w-full border rounded-lg p-1.5 bg-white text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-600 font-medium text-center mb-0.5">แท้ง (A)</label>
              <input
                type="number"
                min="0"
                value={formData.abortion}
                onChange={(e) => setFormData({ ...formData, abortion: e.target.value })}
                placeholder="0"
                className="w-full border rounded-lg p-1.5 bg-white text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-600 font-medium text-center mb-0.5">มีชีวิต (L)</label>
              <input
                type="number"
                min="0"
                value={formData.living}
                onChange={(e) => setFormData({ ...formData, living: e.target.value })}
                placeholder="0"
                className="w-full border rounded-lg p-1.5 bg-white text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-gray-700 font-medium mb-1">อายุบุตรคนสุดท้อง</label>
            <input
              type="text"
              value={formData.last_child_age}
              onChange={(e) => setFormData({ ...formData, last_child_age: e.target.value })}
              placeholder="เช่น 1 ปี 2 เดือน หรือ 8 เดือน (ให้นมแม่)"
              className="w-full border rounded-lg p-2 text-xs bg-white outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* ที่อยู่: บ้านเลขที่ + หมู่ (มีตัวเลือกนอกเขต) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">บ้านเลขที่</label>
            <input
              type="text"
              value={formData.house_no}
              onChange={(e) => setFormData({ ...formData, house_no: e.target.value })}
              placeholder="เช่น 99/1"
              className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">หมู่ที่</label>
            <select
              value={formData.village_no}
              onChange={(e) => setFormData({ ...formData, village_no: e.target.value })}
              className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm"
            >
              <option value="0">นอกเขต (นอก ต.วังตะเคียน)</option>
              {Array.from({ length: 17 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>หมู่ที่ {m} ต.วังตะเคียน</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">วันที่รับบริการ</label>
            <input
              type="date"
              value={formData.service_date}
              onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
              className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm"
              required
            />
          </div>
        </div>

        {/* วิธีการคุมกำเนิด */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">วิธีการคุมกำเนิด</label>
          <select
            value={formData.method}
            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
            className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium text-gray-800"
          >
            {CONTRACEPTION_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* กล่องไฮไลต์ DMPA 84 วัน */}
        {formData.method === 'dmpa_injection' && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
            <span className="text-base">💉</span>
            <span>
              <strong>เกณฑ์มาตรฐาน DMPA:</strong> นัดหมายครั้งถัดไปอีก <strong>12 สัปดาห์ (84 วัน)</strong> ระบบคำนวณวันให้เรียบร้อยแล้ว
            </span>
          </div>
        )}

        {/* กรณีเลือก ยาเม็ดคุมกำเนิด */}
        {isPillMethod && (
          <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-purple-900">จำนวนแผงยาคุมที่จ่าย (แผงละ 28 วัน):</span>
              <span className="text-purple-700 font-semibold">{formData.pill_cycles * 28} วันถัดไป</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 6].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setFormData({ ...formData, pill_cycles: num })}
                  className={`py-2 text-xs font-bold rounded-lg transition text-center ${
                    formData.pill_cycles === num
                      ? 'bg-purple-700 text-white shadow-md'
                      : 'bg-white text-purple-800 border border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  {num} แผง ({num * 28} ว.)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ชื่อยี่ห้อ & วันนัดถัดไป */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อการค้า / ยี่ห้อ / ล็อตยา</label>
            <input
              type="text"
              value={formData.item_details}
              onChange={(e) => setFormData({ ...formData, item_details: e.target.value })}
              placeholder={isPillMethod ? 'เช่น Anna, Oilezz, Marvelon' : 'เช่น Depo-M, Implanon'}
              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              วันนัดหมายครั้งถัดไป <span className="text-purple-600 font-normal">(คำนวณอัตโนมัติ)</span>
            </label>
            <input
              type="date"
              value={formData.next_appointment_date}
              onChange={(e) => setFormData({ ...formData, next_appointment_date: e.target.value })}
              className="w-full border rounded-lg p-2.5 bg-purple-50 font-bold text-purple-950 border-purple-200 text-sm outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* อาการข้างเคียง */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">อาการไม่พึงประสงค์ / ผลข้างเคียง</label>
          <input
            type="text"
            value={formData.side_effects}
            onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
            placeholder="เช่น เลือดออกกะปริดกะปรอย, เวียนศีรษะ, ฝ้า, ปกติไม่มีอาการ"
            className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl transition shadow disabled:opacity-50"
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลวางแผนครอบครัว'}
          </button>
        </div>
      </form>
    </div>
  );
}