// src/components/homeVisit/HomeVisitList.jsx
import React, { useState } from 'react';
import HomeVisitReport from './HomeVisitReport';

export default function HomeVisitList({ visits, onNewVisit, onEdit }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'report'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [selectedForPrint, setSelectedForPrint] = useState(null);

  const filteredVisits = visits.filter((v) => {
    const matchName = v.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) || v.cid?.includes(searchTerm);
    const matchVillage = selectedVillage === 'all' || v.village_no === parseInt(selectedVillage, 10);
    return matchName && matchVillage;
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Header และแถบเครื่องมือ */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base">ระบบงานบริการเยี่ยมบ้านและประเมินภาวะพึ่งพิง (ADL)</h3>
          <p className="text-xs text-slate-500">รพ.สต.วังตะเคียน อำเภอกบินทร์บุรี จังหวัดปราจีนบุรี</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* ปุ่มสลับโหมด: รายการเยี่ยมบ้าน vs ทะเบียนรายงานตามช่วงเวลา */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'list' ? 'bg-white text-emerald-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 รายการเยี่ยมบ้าน
            </button>
            <button
              onClick={() => setViewMode('report')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'report' ? 'bg-white text-emerald-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 ทะเบียนรายงานตามช่วงเวลา
            </button>
          </div>

          <button
            onClick={onNewVisit}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3.5 py-2 rounded-xl font-semibold shadow transition flex items-center gap-1.5"
          >
            <span>+</span> บันทึกการเยี่ยมบ้าน
          </button>
        </div>
      </div>

      {viewMode === 'report' ? (
        <HomeVisitReport visits={visits} />
      ) : (
        <>
          {/* ตัวกรองค้นหา */}
          <div className="flex flex-wrap gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <input
              type="text"
              placeholder="🔍 ค้นหาชื่อผู้ป่วย หรือเลขประจำตัวประชาชน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[220px] border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
            />

            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-medium"
            >
              <option value="all">ทุกหมู่บ้าน (ม.1–17)</option>
              {Array.from({ length: 17 }, (_, i) => i + 1).map((v) => (
                <option key={v} value={v}>หมู่ {v}</option>
              ))}
            </select>
          </div>

          {/* รายการแสดงผลการ์ดผู้ป่วย */}
          {filteredVisits.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <span className="text-4xl block mb-2">📋</span>
              <p className="text-sm font-semibold text-slate-600">ยังไม่มีบันทึกข้อมูลการเยี่ยมบ้านในระบบ</p>
              <p className="text-xs text-slate-400 mt-1">คลิกปุ่ม "+ บันทึกการเยี่ยมบ้าน" เพื่อเริ่มบันทึกเคส</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredVisits.map((v) => (
                <div key={v.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 transition flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{v.patient_name}</h4>
                        <p className="text-xs text-slate-500">หมู่ {v.village_no} บ้านเลขที่ {v.house_no || '-'} {v.cid ? `(CID: ${v.cid})` : ''}</p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        v.adl_score <= 4 ? 'bg-rose-50 text-rose-700 border-rose-200' : v.adl_score <= 11 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        ADL: {v.adl_score} ({v.adl_score <= 4 ? 'ติดเตียง' : v.adl_score <= 11 ? 'ติดบ้าน' : 'ติดสังคม'})
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-slate-600 space-y-1">
                      <p className="font-medium text-slate-700">🩺 สัญญาณชีพ: BP {v.bp_sys || '-'}/{v.bp_dia || '-'} mmHg | PR {v.pulse || '-'} bpm | Temp {v.temp || '-'} °C</p>
                      {v.nursing_care && <p className="line-clamp-2">📝 การพยาบาล: {v.nursing_care}</p>}
                    </div>

                    {v.photo_1 && (
                      <div className="flex gap-2 mt-2">
                        <img src={v.photo_1} alt="Visit 1" className="w-14 h-14 object-cover rounded-lg border" />
                        {v.photo_2 && <img src={v.photo_2} alt="Visit 2" className="w-14 h-14 object-cover rounded-lg border" />}
                      </div>
                    )}
                  </div>

                  {/* ส่วนล่างของการ์ด: แสดงวันผู้ตรวจ พร้อมปุ่ม "✏️ แก้ไข" และ "🖨️ พิมพ์ใบประเมิน" */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">วันที่: {v.visit_date} โดย {v.visitor_name || '-'}</span>
                    <div className="flex items-center gap-1.5">
                      {/* ปุ่มแก้ไขข้อมูลเคสเยี่ยมบ้าน */}
                      <button
                        onClick={() => onEdit(v)}
                        className="text-amber-800 hover:text-amber-900 font-semibold bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition"
                        title="แก้ไขข้อมูล"
                      >
                        ✏️ แก้ไข
                      </button>

                      {/* ปุ่มพิมพ์ใบประเมิน A4 */}
                      <button
                        onClick={() => setSelectedForPrint(v)}
                        className="text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 transition"
                      >
                        <span>🖨️</span> พิมพ์ใบประเมิน
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal พิมพ์ใบประเมินรายบุคคล (A4) */}
      {selectedForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[92vh] overflow-y-auto font-sans">
            <div className="flex justify-between items-center border-b pb-3 mb-4 print:hidden">
              <span className="font-bold text-slate-800">พรีวิวแบบฟอร์มบันทึกการเยี่ยมบ้าน</span>
              <button onClick={() => setSelectedForPrint(null)} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="text-center border-b pb-3">
                <h3 className="font-bold text-sm text-slate-900">แบบบันทึกการประเมินและการปฏิบัติการพยาบาลเยี่ยมบ้าน</h3>
                <p className="text-slate-600 mt-0.5">โรงพยาบาลส่งเสริมสุขภาพตำบลวังตะเคียน อำเภอกบินทร์บุรี จังหวัดปราจีนบุรี</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border">
                <div><strong>ชื่อ-สกุล:</strong> {selectedForPrint.patient_name}</div>
                <div><strong>เลขประจำตัวประชาชน:</strong> {selectedForPrint.cid || '-'}</div>
                <div><strong>ที่อยู่:</strong> บ้านเลขที่ {selectedForPrint.house_no || '-'} หมู่ {selectedForPrint.village_no} ต.วังตะเคียน</div>
                <div><strong>วันที่ลงเยี่ยม:</strong> {selectedForPrint.visit_date}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border space-y-1">
                <div className="font-bold text-slate-800">ผลการตรวจสัญญาณชีพและการประเมิน ADL:</div>
                <div>• ความดันโลหิต (BP): {selectedForPrint.bp_sys || '-'}/{selectedForPrint.bp_dia || '-'} mmHg</div>
                <div>• ชีพจร (PR): {selectedForPrint.pulse || '-'} bpm | อุณหภูมิ: {selectedForPrint.temp || '-'} °C</div>
                <div>• คะแนน Barthel ADL Index: <strong>{selectedForPrint.adl_score} / 20 ({selectedForPrint.adl_group || '-'})</strong></div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border space-y-1">
                <div><strong>ปัญหาทางการพยาบาล:</strong> {selectedForPrint.nursing_diagnosis || '-'}</div>
                <div><strong>กิจกรรมการพยาบาล / การดูแล:</strong> {selectedForPrint.nursing_care || '-'}</div>
                <div><strong>แผนการดูแลต่อเนื่อง:</strong> {selectedForPrint.plan_next_visit || '-'}</div>
              </div>

              {selectedForPrint.photo_1 && (
                <div className="flex gap-2">
                  <img src={selectedForPrint.photo_1} alt="evidence 1" className="w-24 h-24 object-cover rounded-xl border" />
                  {selectedForPrint.photo_2 && <img src={selectedForPrint.photo_2} alt="evidence 2" className="w-24 h-24 object-cover rounded-xl border" />}
                </div>
              )}

              <div className="pt-6 flex justify-between items-center text-center">
                <div>
                  <p>ลงชื่อ....................................................</p>
                  <p className="mt-1">({selectedForPrint.visitor_name || '....................................................'})</p>
                  <p className="text-[10px] text-slate-500">พยาบาลวิชาชีพผู้บันทึก</p>
                </div>
                <div className="flex gap-2 print:hidden">
                  <button onClick={() => setSelectedForPrint(null)} className="px-3 py-2 bg-slate-100 rounded-xl font-medium">ปิด</button>
                  <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow">🖨️ พิมพ์เอกสาร</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}