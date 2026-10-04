// src/components/refer/ReferList.jsx
import React, { useState } from 'react';
import { printReferReport } from '../../lib/reports';
import { db } from '../../lib/db';
import { supabase } from '../../lib/supabase';

const URGENCY_BADGES = {
  emergency: { label: 'วิกฤต/ฉุกเฉิน', bg: 'bg-red-100 text-red-800 border-red-200' },
  urgent: { label: 'ด่วนมาก', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  routine: { label: 'ทั่วไป', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
};

const STATUS_BADGES = {
  pending: { label: 'อยู่ระหว่างส่งต่อ', bg: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  received: { label: 'รพ.รับตัวแล้ว', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
  referred_back: { label: 'รับกลับดูแลต่อ (Refer Back)', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold' }
};

export default function ReferList({ records, loading, onRefresh }) {
  const [selectedReferBack, setSelectedReferBack] = useState(null);
  const [backDiagnosis, setBackDiagnosis] = useState('');
  const [backPlan, setBackPlan] = useState('');
  const [updating, setUpdating] = useState(false);

  if (loading) {
    return <div className="py-12 text-center text-gray-400 text-sm">กำลังโหลดข้อมูลการส่งต่อ...</div>;
  }

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
        <span className="text-3xl block mb-2">🚑</span>
        ยังไม่มีประวัติการส่งต่อผู้ป่วยในระบบ
      </div>
    );
  }

  const handleSaveReferBack = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const updatedData = {
      status: 'referred_back',
      refer_back_diagnosis: backDiagnosis,
      refer_back_plan: backPlan,
      updated_at: new Date().toISOString()
    };

    try {
      if (navigator.onLine) {
        const { error } = await supabase
          .from('patient_refers')
          .update(updatedData)
          .eq('id', selectedReferBack.id);
        if (error) throw error;
        await db.patientRefers.update(selectedReferBack.id, { ...updatedData, sync_status: 'synced' });
      } else {
        await db.patientRefers.update(selectedReferBack.id, { ...updatedData, sync_status: 'pending' });
        await db.syncQueue.add({
          table_name: 'patient_refers',
          action: 'UPDATE',
          payload: { id: selectedReferBack.id, ...updatedData },
          created_at: new Date().toISOString()
        });
      }

      alert('บันทึกผลตอบกลับ Refer Back สำเร็จ');
      setSelectedReferBack(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b">
            <tr>
              <th className="py-3 px-3">เลขที่ใบส่งตัว</th>
              <th className="py-3 px-3">วัน/เวลาส่งต่อ</th>
              <th className="py-3 px-3">ผู้ป่วย</th>
              <th className="py-3 px-3">ที่อยู่</th>
              <th className="py-3 px-3">ความเร่งด่วน</th>
              <th className="py-3 px-3">การวินิจฉัย / สาเหตุ</th>
              <th className="py-3 px-3 text-center">สถานะ</th>
              <th className="py-3 px-3 text-center">จัดการ / รายงาน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((r) => {
              const urgencyBadge = URGENCY_BADGES[r.urgency] || URGENCY_BADGES.routine;
              const statusBadge = STATUS_BADGES[r.status] || STATUS_BADGES.pending;

              return (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs">
                      {r.refer_no ? `${r.refer_no}/${r.fiscal_year}` : '-'}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-xs">
                    {new Date(r.refer_date).toLocaleDateString('th-TH')}
                    <span className="block text-gray-400">
                      {new Date(r.refer_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-gray-900 block">{r.patient_name}</span>
                    <span className="text-xs text-gray-400">
                      {r.age ? `${r.age} ปี ` : ''}{r.gender} {r.cid ? `(CID: ${r.cid})` : ''}
                    </span>
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
                    <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${urgencyBadge.bg}`}>
                      {urgencyBadge.label}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-gray-900 block">{r.preliminary_diagnosis}</span>
                    <span className="text-xs text-blue-700 block">{r.reason_for_refer}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                      {statusBadge.label}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => printReferReport(r)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1"
                      >
                        🖨️️ พิมพ์ A4
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReferBack(r);
                          setBackDiagnosis(r.refer_back_diagnosis || '');
                          setBackPlan(r.refer_back_plan || '');
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-md transition font-medium"
                      >
                        📥 รับกลับ
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal รับผู้ป่วยกลับดูแลต่อ (Refer Back) */}
      {selectedReferBack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full border border-gray-100 font-sans">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <div>
                <h3 className="font-bold text-gray-800 text-base">บันทึกรับผู้ป่วยกลับ (Refer Back)</h3>
                <p className="text-xs text-gray-500">
                  {selectedReferBack.patient_name} (ใบส่งตัว {selectedReferBack.refer_no}/{selectedReferBack.fiscal_year})
                </p>
              </div>
              <button
                onClick={() => setSelectedReferBack(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveReferBack} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ผลการวินิจฉัยโรคขั้นสุดท้าย (Final Diagnosis จาก รพ.)
                </label>
                <input
                  type="text"
                  value={backDiagnosis}
                  onChange={(e) => setBackDiagnosis(e.target.value)}
                  placeholder="เช่น Pneumonia treated, Appendicitis post op day 3"
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  แผนการดูแลต่อเนื่องที่ รพ.สต. / ยาที่ต้องรับประทานต่อ
                </label>
                <textarea
                  rows="3"
                  value={backPlan}
                  onChange={(e) => setBackPlan(e.target.value)}
                  placeholder="เช่น ทำแผล Dressing แผลผ่าตัดทุกวัน, รับประทานยาต่อจนครบ..."
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReferBack(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {updating ? 'กำลังบันทึก...' : 'บันทึกรับกลับ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}