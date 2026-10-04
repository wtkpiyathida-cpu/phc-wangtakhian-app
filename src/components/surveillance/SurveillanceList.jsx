// src/components/surveillance/SurveillanceList.jsx
import React, { useState } from 'react';
import UpdateStatusModal from './UpdateStatusModal';

const STATUS_BADGES = {
  suspected: { label: 'สงสัย / รอผล', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  confirmed: { label: 'ยืนยันผล', bg: 'bg-red-100 text-red-800 border-red-200' },
  under_control: { label: 'กำลังควบคุมโรค', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
  recovered: { label: 'หายแล้ว', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  deceased: { label: 'เสียชีวิต', bg: 'bg-gray-100 text-gray-800 border-gray-200' }
};

const DISEASE_NAMES = {
  dengue: 'ไข้เลือดออก',
  covid19: 'COVID-19',
  influenza: 'ไข้หวัดใหญ่',
  hfm: 'มือเท้าปาก',
  diarrhea: 'อุจจาระร่วงเฉียบพลัน',
  chikungunya: 'ไข้ปวดข้อยุงลาย',
  other: 'โรคติดต่ออื่นๆ'
};

export default function SurveillanceList({ cases, loading, onRefresh }) {
  const [selectedCaseToEdit, setSelectedCaseToEdit] = useState(null);

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-400 text-sm">
        กำลังโหลดรายการเฝ้าระวังโรค...
      </div>
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
        <span className="text-3xl block mb-2">📋</span>
        ยังไม่พบรายการเฝ้าระวังโรคในพื้นที่ ต.วังตะเคียน
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b">
            <tr>
              <th className="py-3 px-3">วันที่เริ่มป่วย</th>
              <th className="py-3 px-3">โรค</th>
              <th className="py-3 px-3">พื้นที่</th>
              <th className="py-3 px-3">พิกัด GPS</th>
              <th className="py-3 px-3">มาตรการควบคุม</th>
              <th className="py-3 px-3 text-center">สถานะ</th>
              <th className="py-3 px-3 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cases.map((c) => {
              const statusConfig = STATUS_BADGES[c.status] || STATUS_BADGES.suspected;
              return (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-3 font-medium text-gray-800">
                    {c.onset_date}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-gray-800">
                      {DISEASE_NAMES[c.disease] || c.disease}
                    </span>
                    {c.disease === 'other' && c.disease_other && (
                      <span className="text-xs text-gray-500 block">({c.disease_other})</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                      หมู่ {c.village_no}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs">
                    {c.latitude && c.longitude ? (
                      <a
                        href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:underline flex items-center gap-1 font-mono"
                      >
                        📍 {Number(c.latitude).toFixed(4)}, {Number(c.longitude).toFixed(4)}
                      </a>
                    ) : (
                      <span className="text-gray-400">ไม่มีพิกัด</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-xs space-y-1">
                    {c.control_measures?.fogging_done && (
                      <span className="inline-block bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded mr-1">
                        พ่นหมอกควันแล้ว
                      </span>
                    )}
                    {c.control_measures?.temephos_distributed && (
                      <span className="inline-block bg-cyan-50 text-cyan-700 border border-cyan-200 px-1.5 py-0.5 rounded">
                        แจกทรายอะเบทแล้ว
                      </span>
                    )}
                    {!c.control_measures?.fogging_done && !c.control_measures?.temephos_distributed && (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${statusConfig.bg}`}>
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedCaseToEdit(c)}
                      className="text-xs bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-medium px-2.5 py-1 rounded-md border transition"
                    >
                      ✏️ อัปเดต
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal อัปเดตสถานะ */}
      {selectedCaseToEdit && (
        <UpdateStatusModal
          caseData={selectedCaseToEdit}
          onClose={() => setSelectedCaseToEdit(null)}
          onUpdated={onRefresh}
        />
      )}
    </>
  );
}