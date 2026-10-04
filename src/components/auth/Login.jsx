// src/components/auth/Login.jsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

// ข้อมูลบุคลากรสำรอง (กรณีออฟไลน์หรือยังไม่ได้เชื่อมต่อตาราง)
const LOCAL_STAFF_DIRECTORY = {
  '1234567890123': { name: 'พยาบาลวิชาชีพชำนาญการพิเศษ', role: 'nurse', position: 'พยาบาลวิชาชีพ' },
  '2345678901234': { name: 'นักวิชาการสาธารณสุขปฏิบัติการ', role: 'public_health_officer', position: 'นักวิชาการสาธารณสุข' },
  '3456789012345': { name: 'เจ้าพนักงานสาธารณสุขชุมชน', role: 'health_officer', position: 'เจ้าพนักงานสาธารณสุข' },
  '4567890123456': { name: 'นางสมศรี ใจดี (อสม.)', role: 'osm', position: 'อสม. หมู่ 1' },
  '5678901234567': { name: 'นายสุทิน มีสุข (Caregiver)', role: 'caregiver', position: 'Caregiver (CG)' }
};

export default function Login({ onLoginSuccess, onContinueAsGuest }) {
  const [cid, setCid] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanCid = cid.replace(/\D/g, ''); // กรองเอาเฉพาะตัวเลข
    if (cleanCid.length !== 13) {
      setErrorMsg('กรุณากรอกเลขประจำตัวประชาชนให้ครบถ้วน 13 หลัก');
      setLoading(false);
      return;
    }

    try {
      // 1. ตรวจสอบกับ Supabase เมื่อ Online
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('staff_users')
          .select('*')
          .eq('cid', cleanCid)
          .maybeSingle();

        if (!error && data) {
          const authUser = {
            cid: data.cid,
            name: data.full_name,
            role: data.role,
            position: data.position_title
          };
          localStorage.setItem('phc_local_user', JSON.stringify(authUser));
          onLoginSuccess(authUser);
          return;
        }
      }

      // 2. ตรวจสอบฐานข้อมูลสำรอง (ออฟไลน์หรือ Mock)
      if (LOCAL_STAFF_DIRECTORY[cleanCid]) {
        const authUser = {
          cid: cleanCid,
          name: LOCAL_STAFF_DIRECTORY[cleanCid].name,
          role: LOCAL_STAFF_DIRECTORY[cleanCid].role,
          position: LOCAL_STAFF_DIRECTORY[cleanCid].position
        };
        localStorage.setItem('phc_local_user', JSON.stringify(authUser));
        onLoginSuccess(authUser);
      } else {
        setErrorMsg('ไม่พบเลขประจำตัวประชาชนนี้ในระบบบุคลากร รพ.สต.วังตะเคียน');
      }
    } catch (err) {
      setErrorMsg(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-3">
          <img src="/logo.png" alt="โลโก้" className="w-20 h-20 object-contain drop-shadow" />
        </div>

        <h1 className="text-xl font-bold text-slate-800">ระบบบริการสุขภาพปฐมภูมิ</h1>
        <p className="text-xs text-emerald-800 font-semibold mb-6">
          โรงพยาบาลส่งเสริมสุขภาพตำบลวังตะเคียน จ.ปราจีนบุรี
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-left">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เลขประจำตัวประชาชน 13 หลัก (เจ้าหน้าที่ / อสม. / Caregiver)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">
                🪪
              </span>
              <input
                type="tel"
                maxLength="13"
                value={cid}
                onChange={(e) => setCid(e.target.value)}
                placeholder="ระบุเลขบัตรประชาชน 13 หลัก"
                className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white tracking-widest font-mono"
                required
                autoFocus
              />
            </div>
            <div className="mt-2 text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div className="font-semibold text-slate-600 mb-0.5">ตัวอย่างรหัสเข้าใช้งาน:</div>
              <div>• เจ้าหน้าที่วิชาชีพ: <span className="font-mono text-emerald-700 font-bold">1234567890123</span></div>
              <div>• อสม. / Caregiver: <span className="font-mono text-teal-700 font-bold">4567890123456</span></div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-3 rounded-xl text-sm transition shadow-md disabled:opacity-50 mt-1"
          >
            {loading ? 'กำลังตรวจสอบสิทธิ์...' : 'เข้าสู่ระบบ (Sign In)'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
          <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-slate-400">สำหรับประชาชน / ผู้มี Link</span></div>
        </div>

        {/* ปุ่มเข้าดู Dashboard สาธารณะ */}
        <button
          onClick={onContinueAsGuest}
          className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-medium py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
        >
          <span>👁️</span> เข้าดูภาพรวมระบบ (Public Dashboard)
        </button>
      </div>
    </div>
  );
}