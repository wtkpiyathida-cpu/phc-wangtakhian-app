// src/components/surveillance/SurveillanceList.jsx
import React, { useState } from 'react';

export default function SurveillanceList({ cases = [], loading = false, onRefresh, onEdit }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [selectedDisease, setSelectedDisease] = useState('all');

  // ตัวกรองค้นหา
  const filteredCases = cases.filter((c) => {
    const matchSearch =
      (c.patient_name && c.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.cid && c.cid.includes(searchTerm));
    const matchVillage = selectedVillage === 'all' || c.village_no === parseInt(selectedVillage, 10);
    const matchDisease = selectedDisease === 'all' || c.disease_name === selectedDisease;
    return matchSearch && matchVillage && matchDisease;
  });

  return (
    <div className="space-y-4 font-sans mt-4">
      {/* แถบค้นหาและตัวกรอง */}
      <div className="flex flex-wrap gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <input
          type="text"
          placeholder="🔍 ค้นหาชื่อผู้ป่วย หรือเลขประจำตัวประชาชน..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 bg-white"
        />

        <select
          value={selectedDisease}
          onChange={(e) => setSelectedDisease(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-medium"
        >
          <option value="all">โรคติดต่อทั้งหมด</option>
          <option value="โรคไข้เลือดออก (DHF)">โรคไข้เลือดออก (DHF)</option>
          <option value="โรคอุจจาระร่วงเฉียบพลัน (Acute Diarrhea)">โรคอุจจาระร่วงเฉียบพลัน</option>
          <option value="โรคมือเท้าปาก (HFMD)">โรคมือเท้าปาก (HFMD)</option>
          <option value="โรคไข้หวัดใหญ่ (Influenza)">โรคไข้หวัดใหญ่ (Influenza)</option>
          <option value="โรคโควิด-19 (COVID-19)">โรคโควิด-19 (COVID-19)</option>
          <option value="โรคสครับไทฟัส (Scrub typhus)">โรคสครับไทฟัส (Scrub typhus)</option>
        </select>

        <select
          value={selectedVillage}
          onChange={(e) => setSelectedVillage(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-medium"
        >
          <option value="all">ทุกหมู่บ้าน (ม.1–17)</option>
          {Array.from({ length: 17 }, (_, i) => i + 1).map((v) => (
            <option key={v} value={v}>
              หมู่ {v}
            </option>
          ))}
        </select>
      </div>

      {/* ตารางแสดงข้อมูล */}
      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <th className="py-3 px-3 text-center w-12">ลำดับ</th>
              <th className="py-3 px-3">วันเริ่มป่วย / วินิจฉัย</th>
              <th className="py-3 px-3">ผู้ป่วย</th>
              <th className="py-3 px-3 text-center">หมู่ที่</th>
              <th className="py-3 px-3">โรคที่ตรวจพบ</th>
              <th className="py-3 px-3 text-center">การควบคุมโรค</th>
              <th className="py-3 px-3 text-center">สถานะสอบสวน</th>
              <th className="py-3 px-3 text-center w-24">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-10 text-slate-400">
                  กำลังโหลดข้อมูลเฝ้าระวังโรค...
                </td>
              </tr>
            ) : filteredCases.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-10 text-slate-400">
                  ไม่พบข้อมูลเคสเฝ้าระวังโรคตามเงื่อนไขที่เลือก
                </td>
              </tr>
            ) : (
              filteredCases.map((c, idx) => (
                <tr key={c.id || idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 text-center text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                    <div>{c.onset_date ? new Date(c.onset_date).toLocaleDateString('th-TH') : '-'}</div>
                    <div className="text-[10px] text-slate-400">
                      วินิจฉัย: {c.diagnosis_date ? new Date(c.diagnosis_date).toLocaleDateString('th-TH') : '-'}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800">{c.patient_name}</div>
                    <div className="text-[11px] text-slate-500">
                      {c.age ? `อายุ ${c.age} ปี` : ''} {c.cid ? `(CID: ${c.cid})` : ''}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-700">
                    ม.{c.village_no || '-'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-amber-900 block">{c.disease_name}</span>
                    {c.remarks && (
                      <span className="text-[11px] text-slate-500 line-clamp-1">{c.remarks}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          c.fogging_done
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.fogging_done ? '✓ พ่นหมอกควันแล้ว' : 'ยังไม่พ่นหมอกควัน'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          c.larvae_survey_done
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.larvae_survey_done ? '✓ สำรวจลูกน้ำแล้ว' : 'ยังไม่สำรวจลูกน้ำ'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        c.investigation_status === 'สอบสวนโรคแล้ว'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.investigation_status === 'กำลังสอบสวนโรค'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.investigation_status || 'รอสอบสวนโรค'}
                    </span>
                  </td>
                  {/* คอลัมน์จัดการ: ปุ่มแก้ไข */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => onEdit(c)}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-lg text-xs font-semibold shadow-sm transition"
                      title="แก้ไขข้อมูลเคส"
                    >
                      ✏️ แก้ไข
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}