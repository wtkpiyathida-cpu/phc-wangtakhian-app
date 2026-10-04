// src/App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { db } from './lib/db';
import { exportSurveillanceToExcel } from './lib/reports';
import { getPendingSyncCount, syncPendingVisits } from './lib/syncService';

// โมดูล 2: เฝ้าระวังโรค
import SurveillanceForm from './components/surveillance/SurveillanceForm';
import SurveillanceList from './components/surveillance/SurveillanceList';
import SurveillanceSummary from './components/surveillance/SurveillanceSummary';

// โมดูล 3: วางแผนครอบครัว
import FamilyPlanningForm from './components/familyPlanning/FamilyPlanningForm';
import FamilyPlanningList from './components/familyPlanning/FamilyPlanningList';
import FamilyPlanningReport from './components/familyPlanning/FamilyPlanningReport';

// โมดูล 4: งานส่งต่อ (Refer)
import ReferForm from './components/refer/ReferForm';
import ReferList from './components/refer/ReferList';
import ReferReport from './components/refer/ReferReport';

export default function App() {
  const [activeTab, setActiveTab] = useState('refer');
  const [fpViewMode, setFpViewMode] = useState('list');
  const [referViewMode, setReferViewMode] = useState('list'); // 'list' (รายการส่งต่อ) หรือ 'report' (สมุดทะเบียน)
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // State เฝ้าระวังโรค
  const [surveillanceCases, setSurveillanceCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [showSurveillanceModal, setShowSurveillanceModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // State วางแผนครอบครัว
  const [familyPlanningRecords, setFamilyPlanningRecords] = useState([]);
  const [loadingFP, setLoadingFP] = useState(true);
  const [showFPModal, setShowFPModal] = useState(false);

  // State ส่งต่อ Refer
  const [referRecords, setReferRecords] = useState([]);
  const [loadingRefer, setLoadingRefer] = useState(true);
  const [showReferModal, setShowReferModal] = useState(false);

  // ดึงข้อมูลเฝ้าระวังโรค
  const fetchSurveillanceCases = async () => {
    setLoadingCases(true);
    try {
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('disease_surveillance')
          .select('*')
          .order('onset_date', { ascending: false });

        if (!error && data) {
          setSurveillanceCases(data);
          await db.diseaseSurveillance.bulkPut(data);
        }
      } else {
        const localData = await db.diseaseSurveillance.toArray();
        setSurveillanceCases(localData.reverse());
      }
    } catch (err) {
      console.error(err);
      const fallback = await db.diseaseSurveillance.toArray();
      setSurveillanceCases(fallback.reverse());
    } finally {
      setLoadingCases(false);
    }
  };

  // ดึงข้อมูลวางแผนครอบครัว
  const fetchFamilyPlanningRecords = async () => {
    setLoadingFP(true);
    try {
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('family_planning')
          .select('*')
          .order('service_date', { ascending: false });

        if (!error && data) {
          setFamilyPlanningRecords(data);
          await db.familyPlanning.bulkPut(data);
        }
      } else {
        const localData = await db.familyPlanning.toArray();
        setFamilyPlanningRecords(localData.reverse());
      }
    } catch (err) {
      console.error(err);
      const fallback = await db.familyPlanning.toArray();
      setFamilyPlanningRecords(fallback.reverse());
    } finally {
      setLoadingFP(false);
    }
  };

  // ดึงข้อมูลการส่งต่อ Refer
  const fetchReferRecords = async () => {
    setLoadingRefer(true);
    try {
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('patient_refers')
          .select('*')
          .order('refer_date', { ascending: false });

        if (!error && data) {
          setReferRecords(data);
          await db.patientRefers.bulkPut(data);
        }
      } else {
        const localData = await db.patientRefers.toArray();
        setReferRecords(localData.reverse());
      }
    } catch (err) {
      console.error(err);
      const fallback = await db.patientRefers.toArray();
      setReferRecords(fallback.reverse());
    } finally {
      setLoadingRefer(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    updatePendingCount();
    fetchSurveillanceCases();
    fetchFamilyPlanningRecords();
    fetchReferRecords();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingCount = async () => {
    try {
      const count = await getPendingSyncCount();
      setPendingCount(count);
    } catch (e) {
      console.error(e);
    }
  };

  const triggerSync = async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncPendingVisits();
      await updatePendingCount();
      await fetchSurveillanceCases();
      await fetchFamilyPlanningRecords();
      await fetchReferRecords();
    } catch (err) {
      console.error('ซิงก์ข้อมูลไม่สำเร็จ:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              ระบบบริการสุขภาพปฐมภูมิ รพ.สต.วังตะเคียน
            </h1>
            <p className="text-xs text-emerald-200">
              ต.วังตะเคียน อ.กบินทร์บุรี จ.ปราจีนบุรี
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              {isOnline ? 'Online' : 'Offline'}
            </span>

            <button
              onClick={triggerSync}
              disabled={isSyncing || !isOnline}
              className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              <span>🔄</span> {isSyncing ? 'กำลังซิงก์...' : `ซิงก์ (${pendingCount})`}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {/* เมนู 4 ด้าน */}
        <section className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-700 mb-3">
            งานบริการปฐมภูมิ 4 ด้าน
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button className="p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-center transition">
              <span className="text-2xl block mb-1">🏠</span>
              <span className="font-semibold text-emerald-900 text-sm block">1. เยี่ยมบ้าน</span>
              <span className="text-xs text-gray-500">ADL & Vital Signs</span>
            </button>

            <button
              onClick={() => setActiveTab('surveillance')}
              className={`p-4 rounded-xl text-center transition ${
                activeTab === 'surveillance'
                  ? 'bg-amber-100 border-2 border-amber-400 shadow-sm'
                  : 'bg-amber-50 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span className="text-2xl block mb-1">🚨</span>
              <span className="font-semibold text-amber-900 text-sm block">2. เฝ้าระวังโรค</span>
              <span className="text-xs text-amber-700 font-medium">ดูสถานการณ์</span>
            </button>

            <button
              onClick={() => setActiveTab('familyPlanning')}
              className={`p-4 rounded-xl text-center transition ${
                activeTab === 'familyPlanning'
                  ? 'bg-purple-100 border-2 border-purple-500 shadow-sm'
                  : 'bg-purple-50 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <span className="text-2xl block mb-1">💊</span>
              <span className="font-semibold text-purple-900 text-sm block">3. วางแผนครอบครัว</span>
              <span className="text-xs text-purple-700 font-medium">ยาคุม & รายงาน</span>
            </button>

            <button
              onClick={() => setActiveTab('refer')}
              className={`p-4 rounded-xl text-center transition ${
                activeTab === 'refer'
                  ? 'bg-blue-100 border-2 border-blue-500 shadow-sm'
                  : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <span className="text-2xl block mb-1">🚑</span>
              <span className="font-semibold text-blue-900 text-sm block">4. ส่งต่อ (Refer)</span>
              <span className="text-xs text-blue-700 font-medium">รพ.กบินทร์บุรี</span>
            </button>
          </div>
        </section>

        {/* แสดงเนื้อหาตามแท็บ */}
        {activeTab === 'surveillance' && (
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <div>
                <h3 className="font-bold text-gray-800 text-base">รายการเฝ้าระวังโรคติดต่อในพื้นที่ (หมู่ 1–17)</h3>
                <p className="text-xs text-gray-500">ข้อมูลสถานการณ์ระบาดวิทยาและมาตรการควบคุมโรคระดับตำบล</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportSurveillanceToExcel(surveillanceCases)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-2 rounded-lg shadow-sm transition font-medium flex items-center gap-1.5"
                >
                  <span>📊</span> ส่งออก Excel (.xlsx)
                </button>
                <button
                  onClick={() => {
                    setSelectedPatient({ id: null, full_name: 'เคสทั่วไปในพื้นที่', cid: '-', village_no: 1 });
                    setShowSurveillanceModal(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-2 rounded-lg shadow transition font-medium"
                >
                  + บันทึกเคสโรคติดต่อ
                </button>
              </div>
            </div>
            <SurveillanceSummary cases={surveillanceCases} />
            <SurveillanceList cases={surveillanceCases} loading={loadingCases} onRefresh={fetchSurveillanceCases} />
          </section>
        )}

        {activeTab === 'familyPlanning' && (
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-5 border-b pb-4">
              <div>
                <h3 className="font-bold text-gray-800 text-base">งานบริการวางแผนครอบครัว (Family Planning)</h3>
                <p className="text-xs text-gray-500">รพ.สต.วังตะเคียน อำเภอกบินทร์บุรี จังหวัดปราจีนบุรี</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setFpViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      fpViewMode === 'list' ? 'bg-white text-purple-900 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📋 ทะเบียนบริการ
                  </button>
                  <button
                    onClick={() => setFpViewMode('report')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      fpViewMode === 'report' ? 'bg-white text-purple-900 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📈 สรุปรายงานตามช่วงเวลา
                  </button>
                </div>
                <button
                  onClick={() => setShowFPModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3.5 py-2 rounded-xl shadow transition font-medium flex items-center gap-1.5"
                >
                  <span>+</span> บันทึกบริการวางแผนครอบครัว
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

        {/* แท็บ 4: งานส่งต่อ (Refer) */}
        {activeTab === 'refer' && (
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-5 border-b pb-4">
              <div>
                <h3 className="font-bold text-gray-800 text-base">
                  ระบบส่งต่อผู้ป่วย (Patient Refer System)
                </h3>
                <p className="text-xs text-gray-500">
                  ส่งต่อไปยังโรงพยาบาลแม่ข่าย (รพ.กบินทร์บุรี) และจัดทำทะเบียนรายงาน
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* สวิตช์สลับโหมด: รายการส่งต่อ VS ทะเบียนรายงาน */}
                <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setReferViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      referViewMode === 'list'
                        ? 'bg-white text-blue-900 shadow-sm font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🚑 รายการส่งต่อ & รับกลับ
                  </button>
                  <button
                    onClick={() => setReferViewMode('report')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      referViewMode === 'report'
                        ? 'bg-white text-blue-900 shadow-sm font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📑 ทะเบียนรายงานตามช่วงเวลา
                  </button>
                </div>

                <button
                  onClick={() => setShowReferModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-2 rounded-xl shadow transition font-medium flex items-center gap-1.5"
                >
                  <span>+</span> บันทึกส่งต่อผู้ป่วย
                </button>
              </div>
            </div>

            {/* แสดงตามโหมดที่เลือก */}
            {referViewMode === 'list' ? (
              <ReferList
                records={referRecords}
                loading={loadingRefer}
                onRefresh={fetchReferRecords}
              />
            ) : (
              <ReferReport
                records={referRecords}
              />
            )}
          </section>
        )}
      </main>

      {/* Modals */}
      {showSurveillanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl my-8">
            <SurveillanceForm
              patient={selectedPatient}
              onClose={() => setShowSurveillanceModal(false)}
              onSaved={() => {
                setShowSurveillanceModal(false);
                updatePendingCount();
                fetchSurveillanceCases();
              }}
            />
          </div>
        </div>
      )}

      {showFPModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl my-8">
            <FamilyPlanningForm
              onClose={() => setShowFPModal(false)}
              onSaved={() => {
                setShowFPModal(false);
                updatePendingCount();
                fetchFamilyPlanningRecords();
              }}
            />
          </div>
        </div>
      )}

      {showReferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8">
            <ReferForm
              onClose={() => setShowReferModal(false)}
              onSaved={() => {
                setShowReferModal(false);
                updatePendingCount();
                fetchReferRecords();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}