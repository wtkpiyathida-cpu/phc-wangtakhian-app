// src/components/surveillance/SurveillanceSummary.jsx
import React from 'react';

export default function SurveillanceSummary({ cases }) {
  const totalCases = cases.length;
  const underControlCount = cases.filter(c => c.status === 'under_control').length;
  const suspectedCount = cases.filter(c => c.status === 'suspected').length;
  const dengueCount = cases.filter(c => c.disease === 'dengue').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
        <span className="text-xs font-medium text-slate-500 block">ผู้ป่วยสะสมทั้งหมด</span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold text-slate-800">{totalCases}</span>
          <span className="text-xs text-slate-500">ราย</span>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
        <span className="text-xs font-medium text-amber-700 block">สงสัย / รอผลตรวจ</span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold text-amber-800">{suspectedCount}</span>
          <span className="text-xs text-amber-600">ราย</span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
        <span className="text-xs font-medium text-blue-700 block">กำลังควบคุมโรค</span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold text-blue-800">{underControlCount}</span>
          <span className="text-xs text-blue-600">ราย</span>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
        <span className="text-xs font-medium text-red-700 block">ไข้เลือดออก (Dengue)</span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold text-red-800">{dengueCount}</span>
          <span className="text-xs text-red-600">ราย</span>
        </div>
      </div>
    </div>
  );
}