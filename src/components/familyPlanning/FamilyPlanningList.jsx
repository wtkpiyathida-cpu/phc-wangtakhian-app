// src/components/familyPlanning/FamilyPlanningList.jsx
import React from 'react';

const METHOD_LABELS = {
  dmpa_injection: 'ยาฉีด DMPA (3 เดือน)',
  monthly_injection: 'ยาฉีด 1 เดือน',
  oral_pills_coc: 'ยาเม็ดคุมกำเนิด (COC)',
  oral_pills_pop: 'ยาเม็ดคุมกำเนิด (POP)',
  implant_3yr: 'ยาฝังคุมกำเนิด 3 ปี',
  implant_5yr: 'ยาฝังคุมกำเนิด 5 ปี',
  condom: 'ถุงยางอนามัย',
  iud: 'ห่วงอนามัย',
  sterilization: 'ทำหมันถาวร'
};

export default function FamilyPlanningList({ records, loading }) {
  if (loading) {
    return (
      <div className="py-12 text-center text-gray-400 text-sm">
        กำลังโหลดข้อมูลงานวางแผนครอบครัว...
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
        <span className="text-3xl block mb-2">💊</span>
        ยังไม่มีประวัติการให้บริการวางแผนครอบครัวในระบบ
      </div>
    );
  }

  const getAppointmentBadge = (nextDateStr) => {
    if (!nextDateStr) {
      return <span className="text-gray-400 text-xs">-</span>;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDate = new Date(nextDateStr);
    nextDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-block bg-red-100 text-red-800 border border-red-200 text-xs px-2 py-0.5 rounded-full font-semibold">
          เลยนัด {Math.abs(diffDays)} วัน ({nextDateStr})
        </span>
      );
    } else if (diffDays <= 7) {
      return (
        <span className="inline-block bg-amber-100 text-amber-800 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-semibold">
          นัดใน {diffDays} วัน ({nextDateStr})
        </span>
      );
    } else {
      return (
        <span className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2 py-0.5 rounded-full">
          {nextDateStr} (อีก {diffDays} วัน)
        </span>
      );
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b">
          <tr>
            <th className="py-3 px-3">วันที่บริการ</th>
            <th className="py-3 px-3">ผู้รับบริการ</th>
            <th className="py-3 px-3">ประวัติครรภ์</th>
            <th className="py-3 px-3">ที่อยู่</th>
            <th className="py-3 px-3">วิธีคุมกำเนิด / รายละเอียด</th>
            <th className="py-3 px-3">ผลข้างเคียง</th>
            <th className="py-3 px-3 text-center">วันนัดครั้งถัดไป</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {records.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50 transition">
              <td className="py-3 px-3 font-medium text-gray-800 whitespace-nowrap">
                {r.service_date}
              </td>
              <td className="py-3 px-3">
                <span className="font-semibold text-gray-900 block">{r.patient_name}</span>
                {r.cid && <span className="text-xs text-gray-400 font-mono">CID: {r.cid}</span>}
              </td>
              <td className="py-3 px-3 text-xs">
                {r.gravida !== null || r.para !== null ? (
                  <div>
                    <span className="font-bold text-purple-900 font-mono">
                      G{r.gravida ?? 0} P{r.para ?? 0} A{r.abortion ?? 0} L{r.living ?? 0}
                    </span>
                    {r.last_child_age && (
                      <span className="text-[11px] text-gray-500 block">บุตร: {r.last_child_age}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="py-3 px-3 text-xs">
                {r.house_no && <span className="text-gray-800 font-medium block">บ้านเลขที่ {r.house_no}</span>}
                {r.village_no === 0 ? (
                  <span className="inline-block bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                    นอกเขต
                  </span>
                ) : (
                  <span className="inline-block bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[11px]">
                    หมู่ {r.village_no}
                  </span>
                )}
              </td>
              <td className="py-3 px-3">
                <span className="font-medium text-purple-900 block">
                  {METHOD_LABELS[r.method] || r.method}
                </span>
                {r.item_details && (
                  <span className="text-xs text-gray-500 block">{r.item_details}</span>
                )}
              </td>
              <td className="py-3 px-3 text-xs">
                {r.side_effects ? (
                  <span className="text-amber-700">{r.side_effects}</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="py-3 px-3 text-center whitespace-nowrap">
                {getAppointmentBadge(r.next_appointment_date)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}