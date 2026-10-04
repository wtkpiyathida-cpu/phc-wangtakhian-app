// src/components/refer/ReferForm.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { supabase } from '../../lib/supabase';

const REFER_REASONS = [
  'เกินขีดความสามารถในการตรวจรักษาของ รพ.สต.',
  'รับการตรวจรักษาเพิ่มเติม',
  'ส่งพบแพทย์ตามนัด/เกณฑ์มาตรฐาน'
];

export default function ReferForm({ patient, onClose, onSaved }) {
  // ฟังก์ชันคำนวณปีงบประมาณ พ.ศ. ตามเกณฑ์ราชการ (1 ต.ค. เป็นต้นไปนับเป็นปีถัดไป)
  const calculateFiscalYear = (dateObj = new Date()) => {
    const yearCE = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // 1-12
    return month >= 10 ? yearCE + 543 + 1 : yearCE + 543;
  };

  const [currentFiscalYear] = useState(calculateFiscalYear());
  const [nextReferNo, setNextReferNo] = useState(1);

  const [formData, setFormData] = useState({
    patient_name: patient?.full_name || '',
    cid: patient?.cid || '',
    age: patient?.age || '',
    gender: patient?.gender || 'หญิง',
    house_no: '',
    village_no: patient?.village_no !== undefined ? patient.village_no : 1,
    destination_hospital: 'โรงพยาบาลกบินทร์บุรี',
    urgency: 'urgent',
    chief_complaint: '',
    preliminary_diagnosis: '',
    bp: '',
    pulse: '',
    temp: '',
    spo2: '',
    pre_referral_treatment: '',
    reason_for_refer: REFER_REASONS[0]
  });

  const [submitting, setSubmitting] = useState(false);

  // ดึงหมายเลขลำดับที่ถัดไปในปีงบประมาณปัจจุบัน (เริ่ม 1 ใหม่เมื่อเข้าสู่ 1 ต.ค.)
  useEffect(() => {
    const fetchNextReferNo = async () => {
      try {
        let maxNo = 0;

        // 1. ตรวจสอบใน Supabase ก่อน
        if (navigator.onLine) {
          const { data, error } = await supabase
            .from('patient_refers')
            .select('refer_no')
            .eq('fiscal_year', currentFiscalYear)
            .order('refer_no', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!error && data?.refer_no) {
            maxNo = data.refer_no;
          }
        }

        // 2. ตรวจสอบเทียบกับในเครื่อง (IndexedDB)
        const localItems = await db.patientRefers
          .filter((r) => r.fiscal_year === currentFiscalYear && r.refer_no)
          .toArray();

        if (localItems.length > 0) {
          const localMax = Math.max(...localItems.map((r) => r.refer_no || 0));
          if (localMax > maxNo) maxNo = localMax;
        }

        setNextReferNo(maxNo + 1);
      } catch (err) {
        console.error('Error calculating next refer number:', err);
        setNextReferNo(1);
      }
    };

    fetchNextReferNo();
  }, [currentFiscalYear]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const recordId = crypto.randomUUID();
    const payload = {
      id: recordId,
      refer_no: nextReferNo,
      fiscal_year: currentFiscalYear,
      patient_id: patient?.id || null,
      patient_name: formData.patient_name.trim(),
      cid: formData.cid.trim() || null,
      age: formData.age ? parseInt(formData.age, 10) : null,
      gender: formData.gender,
      house_no: formData.house_no.trim() || null,
      village_no: parseInt(formData.village_no, 10),
      refer_date: new Date().toISOString(),
      destination_hospital: formData.destination_hospital.trim(),
      urgency: formData.urgency,
      chief_complaint: formData.chief_complaint.trim(),
      preliminary_diagnosis: formData.preliminary_diagnosis.trim(),
      bp: formData.bp.trim() || null,
      pulse: formData.pulse ? parseInt(formData.pulse, 10) : null,
      temp: formData.temp ? parseFloat(formData.temp) : null,
      spo2: formData.spo2 ? parseInt(formData.spo2, 10) : null,
      pre_referral_treatment: formData.pre_referral_treatment.trim() || null,
      reason_for_refer: formData.reason_for_refer,
      status: 'pending'
    };

    try {
      if (navigator.onLine) {
        const { error } = await supabase.from('patient_refers').insert([payload]);
        if (error) throw error;
        await db.patientRefers.put({ ...payload, sync_status: 'synced' });
      } else {
        await db.patientRefers.put({ ...payload, sync_status: 'pending' });
        await db.syncQueue.add({
          table_name: 'patient_refers',
          action: 'INSERT',
          payload: payload,
          created_at: new Date().toISOString()
        });
      }

      alert(`บันทึกส่งต่อสำเร็จ (ใบส่งตัวหมายเลข ${nextReferNo}/${currentFiscalYear})`);
      if (onSaved) onSaved(payload);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full mx-auto font-sans max-h-[90vh] overflow-y-auto">
      {/* ส่วนหัวแสดงเลขที่และปีงบประมาณ */}
      <div className="flex justify-between items-start border-b pb-3 mb-4 sticky top-0 bg-white z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚑</span>
            <h2 className="text-lg font-bold text-gray-800">บันทึกส่งต่อผู้ป่วย (Refer Out)</h2>
            <span className="bg-blue-100 text-blue-900 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
              ใบส่งตัวหมายเลข {nextReferNo} /{currentFiscalYear}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ปีงบประมาณ พ.ศ. {currentFiscalYear} (เริ่มนับ 1 ใหม่ทุก 1 ต.ค.)
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
        {/* ชื่อผู้ป่วย และ เลขบัตร */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อ-สกุล ผู้ป่วย</label>
            <input
              type="text"
              value={formData.patient_name}
              onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
              placeholder="ระบุชื่อ-สกุล"
              className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">เลขบัตรประชาชน</label>
            <input
              type="text"
              maxLength="13"
              value={formData.cid}
              onChange={(e) => setFormData({ ...formData, cid: e.target.value })}
              placeholder="13 หลัก"
              className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* อายุ เพศ บ้านเลขที่ หมู่ที่ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">อายุ (ปี)</label>
            <input
              type="number"
              min="0"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="อายุ"
              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">เพศ</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            >
              <option value="หญิง">หญิง</option>
              <option value="ชาย">ชาย</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">บ้านเลขที่</label>
            <input
              type="text"
              value={formData.house_no}
              onChange={(e) => setFormData({ ...formData, house_no: e.target.value })}
              placeholder="เช่น 12/1"
              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">หมู่ที่</label>
            <select
              value={formData.village_no}
              onChange={(e) => setFormData({ ...formData, village_no: e.target.value })}
              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            >
              <option value="0">นอกเขต</option>
              {Array.from({ length: 17 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>หมู่ {m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* โรงพยาบาลปลายทาง และ ความเร่งด่วน */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
          <div>
            <label className="block text-xs font-semibold text-blue-900 mb-1">ส่งต่อไปยังสถานพยาบาล</label>
            <input
              type="text"
              value={formData.destination_hospital}
              onChange={(e) => setFormData({ ...formData, destination_hospital: e.target.value })}
              className="w-full border border-blue-200 rounded-lg p-2 text-sm bg-white font-medium text-gray-800 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-blue-900 mb-1">ระดับความเร่งด่วน</label>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              className="w-full border border-blue-200 rounded-lg p-2 text-sm bg-white font-bold text-gray-800 outline-none"
            >
              <option value="emergency" className="text-red-600 font-bold">🔴 วิกฤต / ฉุกเฉิน (Emergency)</option>
              <option value="urgent" className="text-amber-600 font-bold">🟡 ด่วนมาก (Urgent)</option>
              <option value="routine" className="text-emerald-600 font-bold">🟢 ทั่วไป / นัดตรวจต่อ (Routine)</option>
            </select>
          </div>
        </div>

        {/* สัญญาณชีพ */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">สัญญาณชีพแรกรับก่อนส่งต่อ (Vital Signs)</label>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <input
              type="text"
              placeholder="BP (เช่น 120/80)"
              value={formData.bp}
              onChange={(e) => setFormData({ ...formData, bp: e.target.value })}
              className="border rounded-lg p-2 text-center outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="PR (ครั้ง/นาที)"
              value={formData.pulse}
              onChange={(e) => setFormData({ ...formData, pulse: e.target.value })}
              className="border rounded-lg p-2 text-center outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Temp (°C)"
              value={formData.temp}
              onChange={(e) => setFormData({ ...formData, temp: e.target.value })}
              className="border rounded-lg p-2 text-center outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="SpO2 (%)"
              value={formData.spo2}
              onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
              className="border rounded-lg p-2 text-center outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* อาการสำคัญ */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">อาการสำคัญและการตรวจพบ (CC & PE)</label>
          <textarea
            rows="2"
            value={formData.chief_complaint}
            onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
            placeholder="ระบุอาการสำคัญ เช่น แน่นหน้าอก หายใจเหนื่อยหอบ มีไข้สูง 3 วัน..."
            className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* วินิจฉัยเบื้องต้น & สาเหตุการส่งต่อ (ตัวเลือก 3 ข้อ) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">การวินิจฉัยโรคเบื้องต้น (Impression)</label>
            <input
              type="text"
              value={formData.preliminary_diagnosis}
              onChange={(e) => setFormData({ ...formData, preliminary_diagnosis: e.target.value })}
              placeholder="เช่น Suspected ACS, Acute Appendicitis"
              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">สาเหตุการส่งต่อผู้ป่วย</label>
            <select
              value={formData.reason_for_refer}
              onChange={(e) => setFormData({ ...formData, reason_for_refer: e.target.value })}
              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            >
              {REFER_REASONS.map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>
        </div>

        {/* การรักษาพยาบาลเบื้องต้น */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">การรักษาพยาบาล / ยาที่ให้ก่อนส่งต่อ</label>
          <textarea
            rows="2"
            value={formData.pre_referral_treatment}
            onChange={(e) => setFormData({ ...formData, pre_referral_treatment: e.target.value })}
            placeholder="เช่น On O2 cannula 3 LPM, ให้ยา Paracetamol 500 mg 1 tab, เปิด IV 0.9% NSS..."
            className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition shadow disabled:opacity-50"
          >
            {submitting ? 'กำลังบันทึก...' : `บันทึกส่งต่อผู้ป่วย (หมายเลข ${nextReferNo}/${currentFiscalYear})`}
          </button>
        </div>
      </form>
    </div>
  );
}