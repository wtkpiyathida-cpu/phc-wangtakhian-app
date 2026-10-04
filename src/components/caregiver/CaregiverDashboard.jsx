// src/components/caregiver/CaregiverDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import CaregiverVisitModal from './CaregiverVisitModal';

const INITIAL_MOCK_ASSIGNMENTS = [
  { id: 'cg-1', patient_name: 'นายประสิทธิ์ สุขใจ', house_no: '45', village_no: 1, patient_type: 'ติดเตียง (Bedridden)', caregiver_cid: '4567890123456', phone: '081-234-5678' },
  { id: 'cg-2', patient_name: 'นางสมควร มีศรี', house_no: '12/1', village_no: 1, patient_type: 'ติดบ้าน (Homebound)', caregiver_cid: '4567890123456', phone: '089-876-5432' },
  { id: 'cg-3', patient_name: 'นางทองหล่อ ยอดดี', house_no: '88', village_no: 5, patient_type: 'ผู้สูงอายุมีภาวะพึ่งพิง', caregiver_cid: '5678901234567', phone: '084-555-1212' },
  { id: 'cg-4', patient_name: 'นายบุญทัน มั่นคง', house_no: '104', village_no: 2, patient_type: 'ติดเตียง (Bedridden)', caregiver_cid: '1234567890123', phone: '082-111-2233' }
];

export default function CaregiverDashboard({ currentUser }) {
  const [assignments, setAssignments] = useState(INITIAL_MOCK_ASSIGNMENTS);
  const [visitLogs, setVisitLogs] = useState([]);
  const [selectedPatientForVisit, setSelectedPatientForVisit] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const userCid = currentUser?.cid || '';
  const userRole = currentUser?.role || 'caregiver';
  const isProfessional = ['nurse', 'public_health_officer', 'health_officer'].includes(userRole);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (navigator.onLine) {
          const { data: assignData } = await supabase.from('caregiver_assignments').select('*');
          if (assignData && assignData.length > 0) setAssignments(assignData);

          const { data: logsData } = await supabase.from('caregiver_visit_logs').select('*').order('visit_date', { ascending: false });
          if (logsData) setVisitLogs(logsData);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [userCid]);

  const myPatients = useMemo(() => {
    return assignments.filter((p) => {
      const matchCg = isProfessional || p.caregiver_cid === userCid || !p.caregiver_cid;
      const matchType = filterType === 'all' || p.patient_type.includes(filterType);
      return matchCg && matchType;
    });
  }, [assignments, userCid, isProfessional, filterType]);

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const getVisitStatus = (patientId) => {
    return visitLogs.some(
      (l) => l.assignment_id === patientId && l.visit_date.startsWith(currentMonthStr)
    );
  };

  return (
    <div className="space-y-5 font-sans">
      <div className="bg-gradient-to-r from-teal-800 to-emerald-700 rounded-3xl p-5 text-white shadow-sm flex flex-wrap justify-between items-center gap-3">
        <div>
          <span className="bg-teal-900/60 text-teal-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
            Caregiver Mobile Portal
          </span>
          <h2 className="text-xl font-bold mt-1.5 flex items-center gap-2">
            <span>🤝</span> ผู้ป่วยที่ได้รับมอบหมายดูแล
          </h2>
          <p className="text-xs text-teal-100">
            ผู้ดูแล: <span className="font-semibold underline">{currentUser?.name || 'เจ้าหน้าที่ Caregiver'}</span> ({currentUser?.position || 'อสม.'})
          </p>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black">{myPatients.length}</span>
          <span className="text-xs text-teal-200 block">ผู้ป่วยในความรับผิดชอบ</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">กลุ่มเป้าหมาย:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 outline-none"
          >
            <option value="all">ทั้งหมดทุกกลุ่ม</option>
            <option value="ติดเตียง">ติดเตียง (Bedridden)</option>
            <option value="ติดบ้าน">ติดบ้าน (Homebound)</option>
          </select>
        </div>

        <span className="text-[11px] text-slate-400">
          รอบประจำเดือน {new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {myPatients.map((p) => {
          const isVisited = getVisitStatus(p.id);

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-500 transition"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-base font-bold text-slate-800 block">
                      {p.patient_name}
                    </span>
                    <span className="text-xs text-slate-500">
                      บ้านเลขที่ {p.house_no} หมู่ {p.village_no} ต.วังตะเคียน
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      isVisited
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {isVisited ? '✓ เยี่ยมแล้วในเดือนนี้' : '⏳ รอเยี่ยม'}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
                    {p.patient_type}
                  </span>
                  {p.phone && (
                    <span className="text-xs text-slate-500 font-mono">
                      📞 {p.phone}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  พิกัด & รูปถ่าย 2 ภาพ
                </span>
                <button
                  onClick={() => setSelectedPatientForVisit(p)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3.5 py-1.5 rounded-xl font-medium transition shadow-sm flex items-center gap-1"
                >
                  <span>📝</span> บันทึกการเยี่ยมบ้าน
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPatientForVisit && (
        <CaregiverVisitModal
          patient={selectedPatientForVisit}
          currentUser={currentUser}
          onClose={() => setSelectedPatientForVisit(null)}
          onSaved={() => setSelectedPatientForVisit(null)}
        />
      )}
    </div>
  );
}