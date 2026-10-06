// src/components/familyPlanning/FamilyPlanningList.jsx
import React, { useState } from 'react';

export default function FamilyPlanningList({ records = [], loading = false, onEdit }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');

  // ตัวกรองค้นหาตามคำค้นหา, วิธีคุมกำเนิด และหมู่บ้าน
  const filteredRecords = records.filter((r) => {
    const matchSearch =
      (r.patient_name && r.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.cid && r.cid.includes(searchTerm));
    const matchVillage = selectedVillage === 'all' || r.village_no === parseInt(selectedVillage, 10);
    const matchMethod = selectedMethod === 'all' || r.method === selectedMethod;
    return matchSearch && matchVillage && matchMethod;
  });

  return (
    <div className="space-y-4 font-sans mt-2">
      {/* แถบค้นหาและตัวกรอง */}
      <div className="flex flex-wrap gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <input
          type="text"
          placeholder="🔍 ค้นหาชื่อผู้รับบริการ หรือเลขประจำตัวประชาชน..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
        />

        <select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-medium"
        >
          <option value="all">วิธีคุมกำเนิดทั้งหมด</option>
          <option value="ยาเม็ดคุมกำเนิด">ยาเม็ดคุมกำเนิด</option>
          <option value="ยาฉีดคุมกำเนิด (DMPA 3 เดือน)">ยาฉีดคุมกำเนิด (DMPA 3 เดือน)</option>
          <option value="ยาฉีดคุมกำเนิด (Cyclofem 1 เดือน)">ยาฉีดคุมกำเนิด (Cyclofem 1 เดือน)</option>
          <option value="ยาฝังคุมกำเนิด (Implant)">ยาฝังคุมกำเนิด (Implant)</option>
          <option value="ห่วงอนามัย (IUD)">ห่วงอนามัย (IUD)</option>
          <option value="ถุงยางอนามัย">ถุงยางอนามัย</option>
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

      {/* ตารางแสดงทะเบียนบริการ */}
      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <th className="py-3 px-3 text-center w-12">ลำดับ</th>
              <th className="py-3 px-3">วันที่รับบริการ</th>
              <th className="py-3 px-3">ผู้รับบริการ</th>
              <th className="py-3 px-3 text-center">หมู่ที่</th>
              <th className="py-3 px-3">วิธีคุมกำเนิด / ผลิตภัณฑ์</th>
              <th className="py-3 px-3 text-center">จำนวน</th>
              <th className="py-3 px-3">วันนัดครั้งถัดไป</th>
              <th className="py-3 px-3">หมายเหตุ</th>
              <th className="py-3 px-3 text-center w-24">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-10 text-slate-400">
                  กำลังโหลดข้อมูลทะเบียนวางแผนครอบครัว...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-10 text-slate-400">
                  ไม่พบข้อมูลทะเบียนบริการตามเงื่อนไขที่เลือก
                </td>
              </tr>
            ) : (
              filteredRecords.map((r, idx) => (
                <tr key={r.id || idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 text-center text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                    {r.service_date ? new Date(r.service_date).toLocaleDateString('th-TH') : '-'}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800">{r.patient_name}</div>
                    <div className="text-[11px] text-slate-500">
                      {r.age ? `อายุ ${r.age} ปี` : ''} {r.cid ? `(CID: ${r.cid})` : ''}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-700">
                    ม.{r.village_no || '-'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-purple-900 block">{r.method}</span>
                    {r.product_name && (
                      <span className="text-[11px] text-slate-500">{r.product_name}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    {r.quantity || 1}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-purple-700 font-medium">
                    {r.next_appointment_date
                      ? new Date(r.next_appointment_date).toLocaleDateString('th-TH')
                      : '-'}
                  </td>
                  <td className="py-3 px-3 text-slate-500 max-w-[150px] truncate">
                    {r.remarks || '-'}
                  </td>
                  {/* คอลัมน์จัดการ: ปุ่มแก้ไข */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => onEdit && onEdit(r)}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1 rounded-lg text-xs font-semibold shadow-sm transition"
                      title="แก้ไขข้อมูลบริการ"
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