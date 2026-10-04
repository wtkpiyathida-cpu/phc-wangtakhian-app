// src/components/familyPlanning/FamilyPlanningReport.jsx
import React, { useState, useMemo } from 'react';
import { exportFamilyPlanningReportToExcel } from '../../lib/reports';

const METHOD_CONFIG = [
  { key: 'dmpa_injection', label: 'ยาฉีด DMPA (3 เดือน)', color: 'border-l-emerald-500 text-emerald-700 bg-emerald-50/40' },
  { key: 'monthly_injection', label: 'ยาฉีด 1 เดือน', color: 'border-l-teal-500 text-teal-700 bg-teal-50/40' },
  { key: 'oral_pills_coc', label: 'ยาเม็ดฮอร์โมนรวม (COC)', color: 'border-l-purple-500 text-purple-700 bg-purple-50/40' },
  { key: 'oral_pills_pop', label: 'ยาเม็ดฮอร์โมนเดี่ยว (POP)', color: 'border-l-fuchsia-500 text-fuchsia-700 bg-fuchsia-50/40' },
  { key: 'implant_3yr', label: 'ยาฝังคุมกำเนิด 3 ปี', color: 'border-l-blue-500 text-blue-700 bg-blue-50/40' },
  { key: 'implant_5yr', label: 'ยาฝังคุมกำเนิด 5 ปี', color: 'border-l-indigo-500 text-indigo-700 bg-indigo-50/40' },
  { key: 'condom', label: 'ถุงยางอนามัย', color: 'border-l-cyan-500 text-cyan-700 bg-cyan-50/40' },
  { key: 'iud', label: 'ห่วงอนามัย', color: 'border-l-amber-500 text-amber-700 bg-amber-50/40' },
  { key: 'sterilization', label: 'ทำหมันถาวร', color: 'border-l-rose-500 text-rose-700 bg-rose-50/40' }
];

export default function FamilyPlanningReport({ records = [] }) {
  // ค่าเริ่มต้น: ต้นเดือนปัจจุบัน ถึง วันปัจจุบัน
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(todayStr);
  const [selectedVillage, setSelectedVillage] = useState('all');

  // กรองข้อมูลตามช่วงเวลาและหมู่บ้าน
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchStart = !startDate || r.service_date >= startDate;
      const matchEnd = !endDate || r.service_date <= endDate;
      const matchVillage = selectedVillage === 'all' || String(r.village_no) === selectedVillage;
      return matchStart && matchEnd && matchVillage;
    });
  }, [records, startDate, endDate, selectedVillage]);

  // คำนวณยอดสรุปแยกตามวิธีคุมกำเนิด
  const summaryStats = useMemo(() => {
    const total = filteredRecords.length;
    return METHOD_CONFIG.map((m) => {
      const count = filteredRecords.filter((r) => r.method === m.key).length;
      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0.0%';
      return { ...m, count, percentage };
    });
  }, [filteredRecords]);

  return (
    <div className="space-y-6">
      {/* แถบตัวกรองช่วงเวลา (Date Filter Bar) */}
      <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-purple-900 whitespace-nowrap">ตั้งแต่วันที่:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-purple-900 whitespace-nowrap">ถึงวันที่:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-purple-900 whitespace-nowrap">พื้นที่:</span>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">ทุกพื้นที่ (รวมนอกเขต)</option>
              <option value="0">นอกเขตรับผิดชอบ</option>
              {Array.from({ length: 17 }, (_, i) => i + 1).map((v) => (
                <option key={v} value={String(v)}>หมู่ที่ {v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ปุ่มส่งออก Excel รายงานสรุป */}
        <button
          onClick={() => exportFamilyPlanningReportToExcel(filteredRecords, startDate, endDate, summaryStats)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-2 rounded-xl shadow-sm transition font-medium flex items-center gap-1.5"
        >
          <span>📊</span> ส่งออกรายงาน Excel (.xlsx)
        </button>
      </div>

      {/* การ์ดยอดรวมใหญ่ */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-500 font-medium block">
            ยอดผู้รับบริการคุมกำเนิดทั้งหมดในช่วงเวลา ({startDate} ถึง {endDate})
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-purple-900">{filteredRecords.length}</span>
            <span className="text-sm text-gray-600">ราย</span>
          </div>
        </div>
        <div className="text-right text-xs text-gray-400">
          รพ.สต.วังตะเคียน อ.กบินทร์บุรี
        </div>
      </div>

      {/* Grid การ์ดย่อยสรุปแยกแต่ละประเภทวิธี */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {summaryStats.map((item) => (
          <div
            key={item.key}
            className={`border-l-4 ${item.color} border border-gray-200 rounded-xl p-3 bg-white shadow-sm flex flex-col justify-between`}
          >
            <span className="text-xs font-semibold text-gray-700 leading-tight block">
              {item.label}
            </span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-2xl font-bold text-gray-800">{item.count}</span>
              <span className="text-xs font-medium text-gray-500">{item.percentage}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ตารางแจกแจงแบบทางการ (Printable Table Preview) */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
          <h4 className="text-sm font-bold text-gray-800">
            ตารางสรุปจำนวนและร้อยละการให้บริการวางแผนครอบครัว
          </h4>
          <span className="text-xs text-gray-500">
            รวม {filteredRecords.length} ราย
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-gray-700 uppercase font-semibold text-xs border-b">
              <tr>
                <th className="py-2.5 px-4 w-12 text-center">ลำดับ</th>
                <th className="py-2.5 px-4">วิธีการคุมกำเนิด</th>
                <th className="py-2.5 px-4 text-center w-36">จำนวนผู้รับบริการ (ราย)</th>
                <th className="py-2.5 px-4 text-center w-32">สัดส่วนร้อยละ (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summaryStats.map((item, idx) => (
                <tr key={item.key} className="hover:bg-purple-50/30 transition">
                  <td className="py-2.5 px-4 text-center text-xs text-gray-400">{idx + 1}</td>
                  <td className="py-2.5 px-4 font-medium text-gray-800">{item.label}</td>
                  <td className="py-2.5 px-4 text-center font-bold text-purple-900">{item.count}</td>
                  <td className="py-2.5 px-4 text-center text-xs font-medium text-gray-600">{item.percentage}</td>
                </tr>
              ))}
              <tr className="bg-purple-50/60 font-bold text-gray-900 border-t-2 border-purple-200">
                <td colSpan="2" className="py-3 px-4 text-right">รวมทั้งสิ้น:</td>
                <td className="py-3 px-4 text-center text-base text-purple-950">{filteredRecords.length}</td>
                <td className="py-3 px-4 text-center text-xs">100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}