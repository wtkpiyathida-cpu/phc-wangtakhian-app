// src/components/refer/ReferReport.jsx
import React, { useState, useMemo } from 'react';
import { exportReferRegisterToExcel, printReferReport } from '../../lib/reports';

const URGENCY_STYLES = {
  emergency: { label: 'วิกฤต/ฉุกเฉิน', bg: 'bg-red-100 text-red-800 border-red-200' },
  urgent: { label: 'ด่วนมาก', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  routine: { label: 'ทั่วไป', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
};

export default function ReferReport({ records = [] }) {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(todayStr);
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // กรองตามช่วงวันที่ ระดับความเร่งด่วน และสถานะ
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const recordDate = r.refer_date ? r.refer_date.split('T')[0] : '';
      const matchStart = !startDate || recordDate >= startDate;
      const matchEnd = !endDate || recordDate <= endDate;
      const matchUrgency = urgencyFilter === 'all' || r.urgency === urgencyFilter;
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchStart && matchEnd && matchUrgency && matchStatus;
    });
  }, [records, startDate, endDate, urgencyFilter, statusFilter]);

  // สรุปสถิติเบื้องต้น
  const totalCount = filteredRecords.length;
  const emergencyCount = filteredRecords.filter((r) => r.urgency === 'emergency').length;
  const urgentCount = filteredRecords.filter((r) => r.urgency === 'urgent').length;
  const referBackCount = filteredRecords.filter((r) => r.status === 'referred_back').length;

  return (
    <div className="space-y-5">
      {/* แถบตัวกรองช่วงเวลาและเงื่อนไขทะเบียน */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-900">ตั้งแต่วันที่:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-blue-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-900">ถึงวันที่:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-blue-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-900">ความเร่งด่วน:</span>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="border border-blue-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="emergency">วิกฤต/ฉุกเฉิน</option>
              <option value="urgent">ด่วนมาก</option>
              <option value="routine">ทั่วไป</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-900">สถานะ:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-blue-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="pending">อยู่ระหว่างส่งต่อ</option>
              <option value="received">รพ.รับตัวแล้ว</option>
              <option value="referred_back">รับกลับดูแลต่อ</option>
            </select>
          </div>
        </div>

        {/* ปุ่มส่งออก Excel ทะเบียน Refer */}
        <button
          onClick={() => exportReferRegisterToExcel(filteredRecords, startDate, endDate)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-2 rounded-xl shadow-sm transition font-medium flex items-center gap-1.5 whitespace-nowrap"
        >
          <span>📊</span> ส่งออกทะเบียน Excel (.xlsx)
        </button>
      </div>

      {/* การ์ดสรุปยอดทะเบียน */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-xs text-gray-500 block">ส่งต่อทั้งหมดในช่วงเวลา</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-gray-800">{totalCount}</span>
            <span className="text-xs text-gray-500">เคส</span>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-xs text-red-700 font-medium block">วิกฤต / ฉุกเฉิน</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-red-800">{emergencyCount}</span>
            <span className="text-xs text-red-600">เคส</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-xs text-amber-700 font-medium block">ด่วนมาก (Urgent)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-amber-800">{urgentCount}</span>
            <span className="text-xs text-amber-600">เคส</span>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-xs text-emerald-700 font-medium block">รับกลับดูแลต่อ (Refer Back)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-emerald-800">{referBackCount}</span>
            <span className="text-xs text-emerald-600">เคส</span>
          </div>
        </div>
      </div>

      {/* ตารางทะเบียนส่งต่อทางการ */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
          <h4 className="text-sm font-bold text-gray-800">
            สมุดทะเบียนส่งต่อผู้ป่วย (Referral Register Book)
          </h4>
          <span className="text-xs text-gray-500">
            {startDate} ถึง {endDate} (รวม {filteredRecords.length} เคส)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-gray-700 uppercase font-semibold text-xs border-b">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">ลำดับ</th>
                <th className="py-2.5 px-3">เลขที่ใบส่งตัว</th>
                <th className="py-2.5 px-3">วัน/เวลาส่งต่อ</th>
                <th className="py-2.5 px-3">ชื่อ-สกุล ผู้ป่วย</th>
                <th className="py-2.5 px-3">ที่อยู่</th>
                <th className="py-2.5 px-3">ความเร่งด่วน</th>
                <th className="py-2.5 px-3">การวินิจฉัย / สาเหตุส่งต่อ</th>
                <th className="py-2.5 px-3">ผล Refer Back</th>
                <th className="py-2.5 px-3 text-center">พิมพ์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-gray-400 text-xs">
                    ไม่พบข้อมูลการส่งต่อในช่วงเวลาที่เลือก
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  const urgencyBadge = URGENCY_STYLES[r.urgency] || URGENCY_STYLES.routine;
                  return (
                    <tr key={r.id} className="hover:bg-blue-50/20 transition text-xs">
                      <td className="py-2.5 px-3 text-center text-gray-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-blue-900">
                        {r.refer_no ? `${r.refer_no}/${r.fiscal_year}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {new Date(r.refer_date).toLocaleDateString('th-TH')}
                        <span className="block text-gray-400 text-[10px]">
                          {new Date(r.refer_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-gray-900 block">{r.patient_name}</span>
                        {r.cid && <span className="text-[11px] text-gray-400 font-mono">CID: {r.cid}</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        {r.house_no && <span>{r.house_no} </span>}
                        {r.village_no === 0 ? (
                          <span className="text-orange-700 font-medium">นอกเขต</span>
                        ) : (
                          <span>ม.{r.village_no}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${urgencyBadge.bg}`}>
                          {urgencyBadge.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-gray-900 block">{r.preliminary_diagnosis}</span>
                        <span className="text-[11px] text-gray-500 block truncate max-w-xs">{r.reason_for_refer}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        {r.status === 'referred_back' ? (
                          <div>
                            <span className="text-emerald-700 font-semibold block">✓ รับกลับแล้ว</span>
                            <span className="text-[10px] text-gray-500 block truncate max-w-xs">{r.refer_back_diagnosis}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => printReferReport(r)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded text-[11px] transition"
                        >
                          🖨️ A4
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}