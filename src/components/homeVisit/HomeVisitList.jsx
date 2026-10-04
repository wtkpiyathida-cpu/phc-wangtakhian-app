// src/components/homeVisit/HomeVisitList.jsx
import React, { useState } from 'react';

export default function HomeVisitList({ visits, onNewVisit }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('all');

  const filteredVisits = visits.filter((v) => {
    const matchName = v.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) || v.cid?.includes(searchTerm);
    const matchVillage = selectedVillage === 'all' || v.village_no === parseInt(selectedVillage, 10);
    return matchName && matchVillage;
  });

  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h3 className="font-bold text-slate-800 text-base">ทะเบียนประวัติการเยี่ยมบ้านและประเมินภาวะพึ่งพิง</h3>
          <p className="text-xs text-slate-500">รพ.สต.วังตะเคียน อำเภอกบินทร์บุรี จังหวัดปราจีนบุรี</p>
        </div>

        <button
          onClick={onNewVisit}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-4 py-2.5 rounded-xl font-semibold shadow flex items-center gap-1.5 transition"
        >
          <span>+</span> บันทึกการเยี่ยมบ้าน
        </button>
      </div>

      {/* ค้นหาและตัวกรอง */}
      <div className="flex flex-wrap gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <input
          type="text"
          placeholder="🔍 ค้นหาชื่อผู้ป่วย หรือเลขบัตร ปชช..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
        />

        <select
          value={selectedVillage}
          onChange={(e) => setSelectedVillage(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-medium"
        >
          <option value="all">ทุกหมู่บ้าน (ม.1–17)</option>
          {Array.from({ length: 17 }, (_, i) => i + 1).map((v) => (
            <option key={v} value={v}>หมู่ {v}</option>
          ))}
        </select>
      </div>

      {/* รายการประวัติ */}
      {filteredVisits.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <span className="text-4xl block mb-2">📋</span>
          <p className="text-sm font-semibold text-slate-600">ยังไม่มีบันทึกข้อมูลการเยี่ยมบ้าน</p>
          <p className="text-xs text-slate-400 mt-1">คลิกปุ่ม "+ บันทึกการเยี่ยมบ้าน" เพื่อเริ่มบันทึกเคสแรก</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredVisits.map((v) => (
            <div key={v.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 transition">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{v.patient_name}</h4>
                  <p className="text-xs text-slate-500">หมู่ {v.village_no} บ้านเลขที่ {v.house_no || '-'}</p>
                </div>
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ADL: {v.adl_score} ({v.adl_group || 'ติดบ้าน'})
                </span>
              </div>

              <div className="mt-3 text-xs text-slate-600 space-y-1">
                <p>🩺 สัญญาณชีพ: BP {v.bp_sys || '-'}/{v.bp_dia || '-'} mmHg | PR {v.pulse || '-'} bpm | DTX {v.dtx || '-'} mg%</p>
                <p className="line-clamp-2">📝 การพยาบาล: {v.nursing_care || '-'}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
                <span>วันที่: {v.visit_date} โดย {v.visitor_name}</span>
                {v.photo_1 && <span className="text-emerald-700 font-semibold">📷 มีภาพถ่าย</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}