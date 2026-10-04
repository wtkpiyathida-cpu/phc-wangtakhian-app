
// src/App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { db } from './lib/db';
import { exportSurveillanceToExcel } from './lib/reports';
import { getPendingSyncCount, syncPendingVisits } from './lib/syncService';

import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import CaregiverDashboard from './components/caregiver/CaregiverDashboard';

// โมดูลวิชาชีพ
import SurveillanceForm from './components/surveillance/SurveillanceForm';
import SurveillanceList from './components/surveillance/SurveillanceList';
import SurveillanceSummary from './components/surveillance/SurveillanceSummary';
import FamilyPlanningForm from './components/familyPlanning/FamilyPlanningForm';
import FamilyPlanningList from './components/familyPlanning/FamilyPlanningList';
import FamilyPlanningReport from './components/familyPlanning/FamilyPlanningReport';
import ReferForm from './components/refer/ReferForm';
import ReferList from './components/refer/ReferList';
import ReferReport from './components/refer/ReferReport';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null); // null = Guest
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [fpViewMode, setFpViewMode] = useState('list');
  const [referViewMode, setReferViewMode] = useState('list');

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // States
  const [surveillanceCases, setSurveillanceCases] = useState([]);
  const [familyPlanningRecords, setFamilyPlanningRecords] = useState([]);
  const [referRecords, setReferRecords] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [loadingFP, setLoadingFP] = useState(false);
  const [loadingRefer, setLoadingRefer] = useState(false);

  // Modals
  const [showSurveillanceModal, setShowSurveillanceModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showFPModal, setShowFPModal] = useState(false);
  const [showReferModal, setShowReferModal] = useState(false);

  // สิทธิ์ผู้ใช้งาน
  const userRole = currentUser ? currentUser.role : isGuestMode ? 'guest' : null;
  const isProfessional = ['nurse', 'public_health_officer', 'health_officer'].includes(userRole);
  const isOsmOrCg = ['osm', 'caregiver'].includes(userRole);

  useEffect(() => {
    const savedUser = localStorage.getItem('phc_local_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
    setCheckingAuth(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('phc_local_user');
    setCurrentUser(null);
    setIsGuestMode(false);
    setActiveTab('dashboard');
  };

  // ดึงข้อมูล
  const fetchSurveillanceCases = async () => {
    setLoadingCases(true);
    try {
      if (navigator.onLine) {
        const { data } = await supabase.from('disease_surveillance').select('*').order('onset_date', { ascending: false });
        if (data) setSurveillanceCases(data);
      } else {
        const local = await db.diseaseSurveillance.toArray();
        setSurveillanceCases(local.reverse());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCases(false);
    }
  };

  const fetchFamilyPlanningRecords = async () => {
    setLoadingFP(true);
    try {
      if (navigator.onLine) {
        const { data } = await supabase.from('family_planning').select('*').order('service_date', { ascending: false });
        if (data) setFamilyPlanningRecords(data);
      } else {
        const local = await db.familyPlanning.toArray();
        setFamilyPlanningRecords(local.reverse());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFP(false);
    }
  };

  const fetchReferRecords = async () => {
    setLoadingRefer(true);
    try {
      if (navigator.onLine) {
        const { data } = await supabase.from('patient_refers').select('*').order('refer_date', { ascending: false });
        if (data) setReferRecords(data);
      } else {
        const local = await db.patientRefers.toArray();
        setReferRecords(local.reverse());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRefer(false);
    }
  };

  useEffect(() => {
    fetchSurveillanceCases();
    fetchFamilyPlanningRecords();
    fetchReferRecords();
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
        กำลังโหลดระบบบริการปฐมภูมิ รพ.สต.วังตะเคียน...
      </div>
    );
  }

  // หน้า Login เมื่อยังไม่ได้ล็อกอินและไม่ได้เลือก Guest Mode
  if (!currentUser && !isGuestMode) {
    return (
      <Login
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsGuestMode(false);
          setActiveTab(user.role === 'osm' || user.role === 'caregiver' ? 'caregiver' : 'dashboard');
        }}
        onContinueAsGuest={() => {
          setIsGuestMode(true);
          setActiveTab('dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex justify-between items-center gap-3">
          <div onClick={() => setActiveTab('dashboard')} className="cursor-pointer flex items-center gap-2.5">
            <img src="/logo.png" alt="โลโก้" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-base font-bold leading-tight">รพ.สต.วังตะเคียน</h1>
              <p className="text-[11px] text-emerald-200">
                {currentUser ? `${currentUser.name} (${currentUser.position})` : 'มุมมองบุคคลทั่วไป (Guest)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="bg-emerald-900/80 hover:bg-rose-600 text-white text-xs px-3 py-1.5 rounded-xl transition"
              >
                ออกจากระบบ
              </button>
            ) : (
              <button
                onClick={() => setIsGuestMode(false)}
                className="bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-semibold px-3 py-1.5 rounded-xl transition shadow-sm"
              >
                เข้าสู่ระบบ
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-5 flex-1 w-full space-y-5">
        {/* เมนูแท็บ: แสดงเฉพาะแท็บที่ผู้ใช้มีสิทธิ์เข้าถึง */}
        <section className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-xl font-bold transition ${
                activeTab === 'dashboard' ? 'bg-slate-800 text-white shadow' : 'bg-slate-100 text-slate-700'
              }`}
            >
              📊 หน้าหลัก (Dashboard)
            </button>

            {/* อสม. / Caregiver แสดงเฉพาะแท็บเยี่ยมบ้านมอบหมาย */}
            {isOsmOrCg && (
              <button
                onClick={() => setActiveTab('caregiver')}
                className={`px-3 py-2 rounded-xl font-bold transition ${
                  activeTab === 'caregiver' ? 'bg-teal-700 text-white shadow' : 'bg-teal-50 text-teal-900'
                }`}
              >
                🤝 ผู้ป่วยที่ได้รับมอบหมาย
              </button>
            )}

            {/* วิชาชีพ (พยาบาล/สธ.) เข้าถึงได้ทั้ง 4 ด้าน */}
            {isProfessional && (
              <>
                <button
                  onClick={() => setActiveTab('homeVisit')}
                  className={`px-3 py-2 rounded-xl font-medium transition ${
                    activeTab === 'homeVisit' ? 'bg-emerald-700 text-white font-bold shadow' : 'bg-emerald-50 text-emerald-900'
                  }`}
                >
                  🏠 1. เยี่ยมบ้าน
                </button>
                <button
                  onClick={() => setActiveTab('surveillance')}
                  className={`px-3 py-2 rounded-xl font-medium transition ${
                    activeTab === 'surveillance' ? 'bg-amber-600 text-white font-bold shadow' : 'bg-amber-50 text-amber-900'
                  }`}
                >
                  🚨 2. เฝ้าระวังโรค
                </button>
                <button
                  onClick={() => setActiveTab('familyPlanning')}
                  className={`px-3 py-2 rounded-xl font-medium transition ${
                    activeTab === 'familyPlanning' ? 'bg-purple-700 text-white font-bold shadow' : 'bg-purple-50 text-purple-900'
                  }`}
                >
                  💊 3. วางแผนครอบครัว
                </button>
                <button
                  onClick={() => setActiveTab('refer')}
                  className={`px-3 py-2 rounded-xl font-medium transition ${
                    activeTab === 'refer' ? 'bg-blue-700 text-white font-bold shadow' : 'bg-blue-50 text-blue-900'
                  }`}
                >
                  🚑 4. ส่งต่อ (Refer)
                </button>
                <button
                  onClick={() => setActiveTab('caregiver')}
                  className={`px-3 py-2 rounded-xl font-medium transition ${
                    activeTab === 'caregiver' ? 'bg-teal-700 text-white font-bold shadow' : 'bg-teal-50 text-teal-900'
                  }`}
                >
                  🤝 งาน Caregiver
                </button>
              </>
            )}
          </div>
        </section>

        {/* แสดงเนื้อหาตามแท็บและสิทธิ์ */}
        {activeTab === 'dashboard' && (
          <Dashboard
            userRole={userRole}
            onNavigate={(tab) => setActiveTab(tab)}
            stats={{
              totalPatients: 428,
              homebound: 34,
              bedridden: 18,
              palliative: 7,
              mch: 56,
              surveillance: surveillanceCases.length || 12,
              refer: referRecords.length || 24
            }}
          />
        )}

        {/* แท็บ Caregiver สำหรับ อสม./CG และ พยาบาล */}
        {activeTab === 'caregiver' && (isOsmOrCg || isProfessional) && (
          <CaregiverDashboard currentUser={currentUser} />
        )}

        {/* แท็บงานวิชาชีพ 4 ด้าน (จำกัดเฉพาะพยาบาล / เจ้าหน้าที่ สธ.) */}
        {isProfessional && (
          <>
            {activeTab === 'homeVisit' && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center py-12">
                <span className="text-4xl block mb-2">🏠</span>
                <h3 className="font-bold text-slate-800 text-base">ระบบงานเยี่ยมบ้านและประเมิน ADL (พยาบาลวิชาชีพ)</h3>
                <p className="text-xs text-slate-500 mt-1">สัญญาณชีพ พิกัด GPS ภาพถ่าย 2 ภาพ และลายเซ็นดิจิทัล</p>
              </section>
            )}

            {activeTab === 'surveillance' && (
              <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 text-base">งานเฝ้าระวังโรคติดต่อ (หมู่ 1–17)</h3>
                  <div className="flex gap-2">
                    <button onClick={() => exportSurveillanceToExcel(surveillanceCases)} className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg">
                      📊 ส่งออก Excel
                    </button>
                    <button onClick={() => setShowSurveillanceModal(true)} className="bg-amber-600 text-white text-xs px-3 py-1.5 rounded-lg">
                      + บันทึกเคส
                    </button>
                  </div>
                </div>
                <SurveillanceSummary cases={surveillanceCases} />
                <SurveillanceList cases={surveillanceCases} loading={loadingCases} onRefresh={fetchSurveillanceCases} />
              </section>
            )}

            {activeTab === 'familyPlanning' && (
              <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4 pb-3 border-b">
                  <h3 className="font-bold text-slate-800 text-base">งานบริการวางแผนครอบครัว</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setFpViewMode(fpViewMode === 'list' ? 'report' : 'list')} className="bg-slate-100 text-xs px-3 py-1.5 rounded-lg">
                      {fpViewMode === 'list' ? '📈 ดูรายงานสรุป' : '📋 ดูทะเบียน'}
                    </button>
                    <button onClick={() => setShowFPModal(true)} className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg">
                      + บันทึกบริการ
                    </button>
                  </div>
                </div>
                {fpViewMode === 'list' ? (
                  <FamilyPlanningList records={familyPlanningRecords} loading={loadingFP} />
                ) : (
                  <FamilyPlanningReport records={familyPlanningRecords} />
                )}
              </section>
            )}

            {activeTab === 'refer' && (
              <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4 pb-3 border-b">
                  <h3 className="font-bold text-slate-800 text-base">ระบบส่งต่อผู้ป่วย (Patient Refer System)</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setReferViewMode(referViewMode === 'list' ? 'report' : 'list')} className="bg-slate-100 text-xs px-3 py-1.5 rounded-lg">
                      {referViewMode === 'list' ? '📑 สมุดทะเบียน' : '🚑 รายการส่งต่อ'}
                    </button>
                    <button onClick={() => setShowReferModal(true)} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg">
                      + บันทึกส่งต่อ
                    </button>
                  </div>
                </div>
                {referViewMode === 'list' ? (
                  <ReferList records={referRecords} loading={loadingRefer} onRefresh={fetchReferRecords} />
                ) : (
                  <ReferReport records={referRecords} />
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* Modals สำหรับบันทึกงาน */}
      {showSurveillanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-xl">
            <SurveillanceForm
              patient={selectedPatient}
              onClose={() => setShowSurveillanceModal(false)}
              onSaved={() => { setShowSurveillanceModal(false); fetchSurveillanceCases(); }}
            />
          </div>
        </div>
      )}

      {showFPModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-xl">
            <FamilyPlanningForm
              onClose={() => setShowFPModal(false)}
              onSaved={() => { setShowFPModal(false); fetchFamilyPlanningRecords(); }}
            />
          </div>
        </div>
      )}

      {showReferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl">
            <ReferForm
              onClose={() => setShowReferModal(false)}
              onSaved={() => { setShowReferModal(false); fetchReferRecords(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}