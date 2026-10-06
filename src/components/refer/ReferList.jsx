// src/components/refer/ReferList.jsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db';

export default function ReferList({ records, onRefresh, onEdit, currentUser }) {
  const [selectedForPrint, setSelectedForPrint] = useState(null);
  const [receivingRecord, setReceivingRecord] = useState(null);
  const [receiveData, setReceiveData] = useState({
    discharge_date: new Date().toISOString().split('T')[0],
    final_diagnosis: '',
    treatment_result: 'หายเป็นปกติ',
    post_discharge_plan: ''
  });

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatePayload = {
        status: 'รับกลับแล้ว',
        return_discharge_date: receiveData.discharge_date,
        return_final_diagnosis: receiveData.final_diagnosis,
        return_treatment_result: receiveData.treatment_result,
        return_post_discharge_plan: receiveData.post_discharge_plan
      };

      if (navigator.onLine) {
        await supabase
          .from('patient_refers')
          .update(updatePayload)
          .eq('id', receivingRecord.id);
      }

      if (db.patientRefers) {
        await db.patientRefers.update(receivingRecord.id, updatePayload);
      }

      alert('บันทึกการรับกลับเรียบร้อยแล้ว');
      setReceivingRecord(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <th className="py-3 px-3 text-center">เลขที่ใบส่งตัว</th>
              <th className="py-3 px-3">วัน/เวลาส่งต่อ</th>
              <th className="py-3 px-3">ผู้ป่วย</th>
              <th className="py-3 px-3">ที่อยู่</th>
              <th className="py-3 px-3 text-center">ความเร่งด่วน</th>
              <th className="py-3 px-3">การวินิจฉัย / สาเหตุ</th>
              <th className="py-3 px-3 text-center">สถานะ</th>
              <th className="py-3 px-3 text-center">จัดการ / รายงาน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-10 text-slate-400">
                  ยังไม่มีประวัติการส่งต่อผู้ป่วยในระบบ
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 text-center font-bold text-blue-700 whitespace-nowrap">
                    {r.refer_no || '-'}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                    <div>{r.refer_date ? new Date(r.refer_date).toLocaleDateString('th-TH') : '-'}</div>
                    <div className="text-[10px] text-slate-400">{r.refer_time || ''} น.</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800">{r.patient_name}</div>
                    <div className="text-[11px] text-slate-500">
                      {r.age ? `${r.age} ปี` : ''} {r.gender || ''} {r.cid ? `(CID: ${r.cid})` : ''}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    <div>บ้านเลขที่ {r.house_no || '-'}</div>
                    <div className="text-[11px] text-slate-500">หมู่ {r.village_no || '-'}</div>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.urgency === 'emergency' || r.urgency === 'ด่วนที่สุด'
                        ? 'bg-red-100 text-red-700'
                        : r.urgency === 'urgent' || r.urgency === 'ด่วนมาก'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {r.urgency === 'emergency' ? 'ฉุกเฉิน' : r.urgency === 'urgent' ? 'ด่วนมาก' : r.urgency || 'ทั่วไป'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">{r.preliminary_diagnosis || '-'}</div>
                    <div className="text-[11px] text-blue-700">{r.refer_reason || '-'}</div>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      r.status === 'รับกลับแล้ว'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {r.status || 'อยู่ระหว่างส่งต่อ'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {/* ปุ่มแก้ไขข้อมูล */}
                      <button
                        onClick={() => onEdit(r)}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded-lg text-[11px] font-medium transition"
                        title="แก้ไขข้อมูล"
                      >
                        ✏️ แก้ไข
                      </button>

                      {/* ปุ่มพิมพ์ใบ Refer A4 */}
                      <button
                        onClick={() => setSelectedForPrint(r)}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-2 py-1 rounded-lg text-[11px] font-medium transition flex items-center gap-1"
                      >
                        <span>🖨️</span> พิมพ์ A4
                      </button>

                      {/* ปุ่มรับกลับ */}
                      <button
                        onClick={() => setReceivingRecord(r)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 px-2 py-1 rounded-lg text-[11px] font-medium transition"
                      >
                        📥 รับกลับ
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal พิมพ์ใบ Refer A4 ปรับส่วนล่างตามรูปที่ 3 */}
      {selectedForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-10 max-w-3xl w-full max-h-[95vh] overflow-y-auto font-sans print:p-0 print:border-none print:shadow-none">
            {/* ปุ่มปิดและพิมพ์ (ซ่อนเวลาพิมพ์จริง) */}
            <div className="flex justify-between items-center border-b pb-3 mb-6 print:hidden">
              <span className="font-bold text-slate-800 text-base">พรีวิวใบส่งตัวผู้ป่วย (Referral Form)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow"
                >
                  🖨️ สั่งพิมพ์เอกสาร A4
                </button>
                <button onClick={() => setSelectedForPrint(null)} className="text-2xl text-slate-400 hover:text-slate-600 px-2">
                  &times;
                </button>
              </div>
            </div>

            {/* เนื้อหาใบ Refer */}
            <div className="space-y-4 text-xs text-slate-900 border border-slate-300 p-6 rounded-2xl print:border-none print:p-0">
              <div className="text-center border-b pb-3">
                <h2 className="text-base font-bold text-slate-900">แบบฟอร์มส่งต่อผู้ป่วย (Referral Form)</h2>
                <p className="text-xs text-slate-700">
                  โรงพยาบาลส่งเสริมสุขภาพตำบลวังตะเคียน อำเภอกบินทร์บุรี จังหวัดปราจีนบุรี
                </p>
                <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
                  <span>เลขที่ใบส่งตัว: <strong>{selectedForPrint.refer_no}</strong></span>
                  <span>วันที่: <strong>{selectedForPrint.refer_date} {selectedForPrint.refer_time || ''} น.</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div><strong>ชื่อ-สกุล ผู้ป่วย:</strong> {selectedForPrint.patient_name}</div>
                <div><strong>เลขประจำตัวประชาชน:</strong> {selectedForPrint.cid || '-'}</div>
                <div><strong>อายุ:</strong> {selectedForPrint.age || '-'} ปี | <strong>เพศ:</strong> {selectedForPrint.gender || '-'}</div>
                <div><strong>ที่อยู่:</strong> บ้านเลขที่ {selectedForPrint.house_no || '-'} หมู่ {selectedForPrint.village_no} ต.วังตะเคียน</div>
                <div><strong>ส่งต่อไปยัง:</strong> {selectedForPrint.destination_hospital || 'โรงพยาบาลกบินทร์บุรี'}</div>
                <div><strong>ระดับความเร่งด่วน:</strong> {selectedForPrint.urgency || 'ทั่วไป'}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">สัญญาณชีพแรกรับก่อนส่งต่อ (Vital Signs):</div>
                <div className="grid grid-cols-4 gap-2 text-center pt-1 font-mono">
                  <div className="bg-white p-1 rounded border">BP: {selectedForPrint.bp || '-'} mmHg</div>
                  <div className="bg-white p-1 rounded border">PR: {selectedForPrint.pulse || '-'} bpm</div>
                  <div className="bg-white p-1 rounded border">Temp: {selectedForPrint.temp || '-'} °C</div>
                  <div className="bg-white p-1 rounded border">O2 Sat: {selectedForPrint.o2sat || '-'} %</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div><strong>อาการสำคัญ / ผลการตรวจพบ (CC & PE):</strong> {selectedForPrint.cc_pe || '-'}</div>
                <div><strong>การวินิจฉัยโรคเบื้องต้น (Impression):</strong> {selectedForPrint.preliminary_diagnosis || '-'}</div>
                <div><strong>สาเหตุการส่งต่อ:</strong> {selectedForPrint.refer_reason || '-'}</div>
                <div><strong>การรักษาพยาบาล / ยาที่ให้ก่อนส่งต่อ:</strong> {selectedForPrint.pre_refer_treatment || '-'}</div>
              </div>

              {/* ปรับปรุงส่วนลงชื่อและส่วนตอบรับให้ตรงตามรูปที่ 3 */}
              <div className="pt-6 mt-4 border-t border-slate-300 space-y-6">
                <div className="font-medium text-slate-800">ข้าพเจ้ารับทราบข้อความข้างต้น</div>

                <div className="grid grid-cols-2 gap-8 text-center text-xs">
                  {/* ฝั่งซ้าย: ผู้บริการ/ญาติ */}
                  <div className="space-y-4">
                    <p>ลงชื่อ..............................................................ผู้บริการ/ญาติ</p>
                    <p>(..........................................................) ตัวบรรจง</p>
                  </div>

                  {/* ฝั่งขวา: ดึงชื่อผู้ Login และ Position Title อัตโนมัติ */}
                  <div className="space-y-4">
                    <p>
                      ลงชื่อ.....<span className="font-semibold">{selectedForPrint.sender_name || currentUser?.name || '...................................................'}</span>.....
                    </p>
                    <p>
                      ตำแหน่ง.....<span className="font-semibold">{currentUser?.position || 'เจ้าหน้าที่ผู้ส่งต่อ'}</span>.....
                    </p>
                  </div>
                </div>

                {/* แบบตอบรับการส่งตัวผู้ป่วย (ส่งกลับ รพ.สต.) */}
                <div className="pt-6 border-t border-dashed border-slate-300 space-y-4">
                  <div className="text-center font-bold text-slate-900">
                    แบบตอบรับการส่งตัวผู้ป่วย (ส่งกลับ รพ.สต.)
                  </div>

                  <div className="space-y-2 text-slate-700">
                    <p>การวินิจฉัย/การรักษาและการส่งต่อให้ได้รับการดูแลที่สถานบริการสาธารณสุขใกล้บ้าน Dx : .................................................................................</p>
                    <p className="border-b border-dotted border-slate-400 h-6"></p>
                    <p className="border-b border-dotted border-slate-400 h-6"></p>
                  </div>

                  <div className="text-right pt-4 pr-12 space-y-3">
                    <p>ลงชื่อ.............................................................. แพทย์ผู้รักษา</p>
                    <p>(..........................................................)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal บันทึกรับกลับ */}
      {receivingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full font-sans space-y-4">
            <h3 className="font-bold text-base text-slate-800">บันทึกรับผู้ป่วยกลับ รพ.สต.</h3>
            <p className="text-xs text-slate-500">ผู้ป่วย: {receivingRecord.patient_name} (เลขที่: {receivingRecord.refer_no})</p>

            <form onSubmit={handleReceiveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">วันที่จำหน่าย/รับกลับ</label>
                <input
                  type="date"
                  value={receiveData.discharge_date}
                  onChange={(e) => setReceiveData({ ...receiveData, discharge_date: e.target.value })}
                  className="w-full border rounded-xl p-2 bg-slate-50 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">การวินิจฉัยโรคขั้นสุดท้ายจาก รพ.</label>
                <input
                  type="text"
                  value={receiveData.final_diagnosis}
                  onChange={(e) => setReceiveData({ ...receiveData, final_diagnosis: e.target.value })}
                  placeholder="เช่น Appendicitis post op appendectomy"
                  className="w-full border rounded-xl p-2 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">ผลการรักษา</label>
                <select
                  value={receiveData.treatment_result}
                  onChange={(e) => setReceiveData({ ...receiveData, treatment_result: e.target.value })}
                  className="w-full border rounded-xl p-2 bg-slate-50 outline-none"
                >
                  <option value="หายเป็นปกติ">หายเป็นปกติ</option>
                  <option value="ทุเลาลง">ทุเลาลง</option>
                  <option value="ส่งต่อไปสถานพยาบาลระดับสูงกว่า">ส่งต่อไปสถานพยาบาลระดับสูงกว่า</option>
                  <option value="เสียชีวิต">เสียชีวิต</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">แผนการดูแลต่อเนื่องที่บ้าน / คำแนะนำ</label>
                <textarea
                  rows="2"
                  value={receiveData.post_discharge_plan}
                  onChange={(e) => setReceiveData({ ...receiveData, post_discharge_plan: e.target.value })}
                  placeholder="เช่น นัดตัดไหม 7 วัน, ติดตามเยี่ยมบ้านและทำแผล..."
                  className="w-full border rounded-xl p-2 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReceivingRecord(null)}
                  className="flex-1 py-2 bg-slate-100 rounded-xl font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-700 text-white rounded-xl font-medium shadow"
                >
                  บันทึกรับกลับ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}