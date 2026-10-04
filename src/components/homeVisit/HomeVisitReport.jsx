// src/components/homeVisit/HomeVisitReport.jsx
import React, { useState, useMemo } from 'react';

export default function HomeVisitReport({ visits }) {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [filterVillage, setFilterVillage] = useState('all');

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      const matchDate = (!startDate || v.visit_date >= startDate) && (!endDate || v.visit_date <= endDate);
      const matchVillage = filterVillage === 'all' || v.village_no === parseInt(filterVillage, 10);
      return matchDate && matchVillage;
    });
  }, [visits, startDate, endDate, filterVillage]);

  // สรุปสถิติ ADL
  const stats = useMemo(() => {
    let bedridden = 0;
    let homebound = 0;
    let social = 0;

    filteredVisits.forEach((v) => {
      const s = parseInt(v.adl_score, 10);
      if (s <= 4) bedridden++;
      else if (s <= 11) homebound++;
      else social++;
    });

    return { total: filteredVisits.length, bedridden, homebound, social };
  }, [filteredVisits]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 font-sans">
      {/* ส่วนควบคุมตัวกรอง (ซ่อนเวลาพิมพ์) */}
      <div className="print:hidden bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-700">ช่วงวันที่:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded-xl px-2.5 py-1.5 bg-white outline-none"
          />
          <span className="text-slate-400">ถึง</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded-xl px-2.5 py-1.5 bg-white outline-none"
          />

          <select
            value={filterVillage}
            onChange={(e) => setFilterVillage(e.target.value)}
            className="border rounded-xl px-2.5 py-1.5 bg-white outline-none font-medium ml-2"
          >
            <option value="all">ทุกหมู่บ้าน (ม.1–17)</option>
            {Array.from({ length: 17 }, (_, i) => i + 1).map((v) => (
              <option key={v} value={v}>หมู่ {v}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handlePrint}
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl font-semibold shadow transition flex items-center gap-1.5"
        >
          <span>🖨️</span> พิมพ์รายงาน / บันทึก PDF (A4)
        </button>
      </div>

      {/* แผ่นรายงานทางการสำหรับพิมพ์และแสดงผล */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
        <div className="text-center border-b pb-4 mb-5">
          <h2 className="text-lg font-bold text-slate-900">ทะเบียนรายงานการเยี่ยมบ้านและการดูแลผู้มีภาวะพึ่งพิง</h2>
          <p className="text-xs text-slate-600 mt-1">
            โรงพยาบาลส่งเสริมสุขภาพตำบลวังตะเคียน อำเภอกบินทร์บุรี จังหวัดปราจีนบุรี
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            ข้อมูลตั้งแต่วันที่ {startDate ? new Date(startDate).toLocaleDateString('th-TH') : '-'} ถึง {endDate ? new Date(endDate).toLocaleDateString('th-TH') : '-'}
          </p>
        </div>

        {/* ตารางสรุปภาพรวม */}
        <div className="grid grid-cols-4 gap-2 mb-5 text-center text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl border">
            <span className="text-slate-500 block text-[11px]">เยี่ยมทั้งหมด</span>
            <span className="text-base font-bold text-slate-800">{stats.total} ครั้ง</span>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-emerald-700 block text-[11px]">ติดสังคม (ADL 12-20)</span>
            <span className="text-base font-bold text-emerald-900">{stats.social} ราย</span>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
            <span className="text-amber-700 block text-[11px]">ติดบ้าน (ADL 5-11)</span>
            <span className="text-base font-bold text-amber-900">{stats.homebound} ราย</span>
          </div>
          <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
            <span className="text-rose-700 block text-[11px]">ติดเตียง (ADL 0-4)</span>
            <span className="text-base font-bold text-rose-900">{stats.bedridden} ราย</span>
          </div>
        </div>

        {/* รายการตารางข้อมูลทะเบียน */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-y border-slate-300">
                <th className="py-2.5 px-2 text-center w-10">ลำดับ</th>
                <th className="py-2.5 px-2">วันเดือนปี</th>
                <th className="py-2.5 px-2">ชื่อ - สกุล ผู้ป่วย</th>
                <th className="py-2.5 px-2 text-center">หมู่ที่</th>
                <th className="py-2.5 px-2 text-center">สัญญาณชีพ (BP / PR / Temp)</th>
                <th className="py-2.5 px-2 text-center">คะแนน ADL</th>
                <th className="py-2.5 px-2">การพยาบาล / การดูแล</th>
                <th className="py-2.5 px-2">ผู้เยี่ยม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลการเยี่ยมบ้านในช่วงเวลาที่เลือก
                  </td>
                </tr>
              ) : (
                filteredVisits.map((v, idx) => (
                  <tr key={v.id || idx} className="hover:bg-slate-50">
                    <td className="py-2 px-2 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-2 whitespace-nowrap">{v.visit_date}</td>
                    <td className="py-2 px-2 font-semibold text-slate-800">{v.patient_name}</td>
                    <td className="py-2 px-2 text-center">ม.{v.village_no}</td>
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      {v.bp_sys && v.bp_dia ? `${v.bp_sys}/${v.bp_dia}` : '-'} | {v.pulse ? `${v.pulse} bpm` : '-'} | {v.temp ? `${v.temp}°C` : '-'}
                    </td>
                    <td className="py-2 px-2 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        v.adl_score <= 4 ? 'bg-rose-100 text-rose-800' : v.adl_score <= 11 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {v.adl_score} ({v.adl_score <= 4 ? 'ติดเตียง' : v.adl_score <= 11 ? 'ติดบ้าน' : 'ติดสังคม'})
                      </span>
                    </td>
                    <td className="py-2 px-2 text-slate-600 max-w-[200px] truncate">{v.nursing_care || '-'}</td>
                    <td className="py-2 px-2 text-slate-500 whitespace-nowrap">{v.visitor_name || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ส่วนลงชื่อท้ายรายงานสำหรับเอกสารราชการ */}
        <div className="hidden print:grid grid-cols-2 gap-8 mt-12 pt-6 text-center text-xs">
          <div>
            <p>ลงชื่อ..............................................................ผู้จัดทำรายงาน</p>
            <p className="mt-1">(..........................................................)</p>
            <p className="text-[11px] text-slate-500">พยาบาลวิชาชีพ / เจ้าหน้าที่ผู้รับผิดชอบงาน</p>
          </div>
          <div>
            <p>ลงชื่อ..............................................................ผู้ตรวจรับรอง</p>
            <p className="mt-1">(..........................................................)</p>
            <p className="text-[11px] text-slate-500">ผู้อำนวยการ รพ.สต.วังตะเคียน</p>
          </div>
        </div>
      </div>
    </div>
  );
}