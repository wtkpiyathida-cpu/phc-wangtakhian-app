// src/App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { db } from './lib/db';
import { exportSurveillanceToExcel } from './lib/reports';

import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import CaregiverDashboard from './components/caregiver/CaregiverDashboard';

// โมดูล 1: เยี่ยมบ้าน
import HomeVisitList from './components/homeVisit/HomeVisitList';
import HomeVisitModal from './components/homeVisit/HomeVisitModal';

// โมดูล 2: เฝ้าระวังโรค
import SurveillanceForm from './components/surveillance/SurveillanceForm';
import SurveillanceList from './components/surveillance/SurveillanceList';
import SurveillanceSummary from './components/surveillance/SurveillanceSummary';

// โมดูล 3: วางแผนครอบครัว
import FamilyPlanningForm from './components/familyPlanning/FamilyPlanningForm';
import FamilyPlanningList from './components/familyPlanning/FamilyPlanningList';
import FamilyPlanningReport from './components/familyPlanning/FamilyPlanningReport';

// โมดูล 4: ส่งต่อ
import ReferForm from './components/refer/ReferForm';
import ReferList from './components/refer/ReferList';
import ReferReport from './components/refer/ReferReport';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [fpViewMode, setFpViewMode] = useState('list');
  const [referViewMode, setReferViewMode] = useState('list');

  // Lists
  const [homeVisits, setHomeVisits] = useState([]);
  const [surveillanceCases, setSurveillanceCases] = useState([]);
  const [familyPlanningRecords, setFamilyPlanningRecords] = useState([]);
  const [referRecords, setReferRecords] = useState([]);

  // Modals
  const [showHomeVisitModal, setShowHomeVisitModal] = useState(false);
  const [showSurveillanceModal, setShowSurveillanceModal] = useState(false);
  const [showFPModal, setShowFPModal] = useState(false);
  const [showReferModal, setShowReferModal] = useState(false);

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

  // ดึงประวัติการเยี่ยมบ้าน
  const fetchHomeVisits = async () => {
    try {
      if (navigator.onLine) {
        const { data } = await supabase.from('patient_visits').select('*').order('visit_date', { ascending: false });
        if (data) setHomeVisits(data);
      } else {
        const local = await db.cachedVisits.toArray();
        setHomeVisits(local.reverse());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSurveillanceCases = async () => {
    try {
      if (navigator.onLine) {
        const { data } = await supabase.from('disease_surveillance').select('*').order('onset_date', { ascending: false });
        if (data) setSurveillanceCases(data);
      }
    } catch (e) { console.error(e); }
  };

  const fetchFamilyPlanningRecords = async () => {
    try {
      if (navigator.onLine) {
        const { data } = await supabase.from('family_planning').select('*').order('service_date', { ascending: false });
        if (data) setFamilyPlanningRecords(data);
      }
    } catch (e) { console.error(e); }
  };

  const fetchReferRecords = async () => {
    try {
      if (navigator.onLine) {
        const { data } = await supabase.from('patient_refers').select('*').order('refer_date', { ascending: false });
        if (data) setReferRecords(data);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchHomeVisits();
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
      {/* Header: ปรับให้ชื่อและตำแหน่งผู้ Login อยู่มุมบนขวา */}
      <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex justify-between items-center gap-3">
          {/* ซ้าย: ชื่อ รพ.สต. */}
          <div onClick={() => setActiveTab('dashboard')} className="cursor-pointer flex items-center gap-2.5">
            <img src="/logo.png" alt="โลโก้" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-base font-bold leading-tight">รพ.สต.วังตะเคียน</h1>
              <p className="text-[11px] text-emerald-200">อ.กบินทร์บุรี จ.ปราจีนบุรี</p>
            </div>
          </div>

          {/* ขวา: แสดงชื่อ + ตำแหน่งผู้ Login และปุ่มออกจากระบบ */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-bold text-white leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-200 font-medium">
                    {currentUser.position}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="bg-emerald-900 hover:bg-rose-600 text-white text-xs px-3 py-1.5 rounded-xl transition font-medium shadow-sm"
                >
                  ออกจากระบบ
                </button>
              </div>
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

        {/* แท็บ Dashboard */}
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

        {/* แท็บ 1: เยี่ยมบ้าน */}
        {activeTab === 'homeVisit' && isProfessional && (
          <HomeVisitList
            visits={homeVisits}
            onNewVisit={() => setShowHomeVisitModal(true)}
          />
        )}

        {/* แท็บ Caregiver */}
        {activeTab === 'caregiver' && (isOsmOrCg || isProfessional) && (
          <CaregiverDashboard currentUser={currentUser} />
        )}

        {/* แท็บ 2: เฝ้าระวังโรค */}
        {activeTab === 'surveillance' && isProfessional && (
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
            <SurveillanceList cases={surveillanceCases} onRefresh={fetchSurveillanceCases} />
          </section>
        )}

        {/* แท็บ 3: วางแผนครอบครัว */}
        {activeTab === 'familyPlanning' && isProfessional && (
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
              <FamilyPlanningList records={familyPlanningRecords} />
            ) : (
              <FamilyPlanningReport records={familyPlanningRecords} />
            )}
          </section>
        )}

        {/* แท็บ 4: ส่งต่อ */}
        {activeTab === 'refer' && isProfessional && (
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
              <ReferList records={referRecords} onRefresh={fetchReferRecords} />
            ) : (
              <ReferReport records={referRecords} />
            )}
          </section>
        )}
      </main>

      {/* Modals */}
      {showHomeVisitModal && (
        <HomeVisitModal
          currentUser={currentUser}
          onClose={() => setShowHomeVisitModal(false)}
          onSaved={() => { setShowHomeVisitModal(false); fetchHomeVisits(); }}
        />
      )}

      {showSurveillanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-xl">
            <SurveillanceForm
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