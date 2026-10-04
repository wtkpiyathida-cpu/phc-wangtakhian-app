// src/components/dashboard/Dashboard.jsx
import React from 'react';

export default function Dashboard({ 
  userRole = 'guest',
  onNavigate,
  stats = {
    totalPatients: 428,
    homebound: 34,     // ติดบ้าน
    bedridden: 18,     // ติดเตียง
    palliative: 7,     // Palliative Care
    mch: 56,           // แม่และเด็ก
    surveillance: 12,  // เฝ้าระวังโรคติดต่อ
    refer: 24          // ส่งต่อ
  }
}) {
  const isProfessional = ['nurse', 'public_health_officer', 'health_officer'].includes(userRole);
  const isOsmOrCg = ['osm', 'caregiver'].includes(userRole);

  const STAT_CARDS = [
    { title: 'ผู้ป่วยทั้งหมดในระบบ', count: stats.totalPatients, unit: 'คน', color: 'border-slate-400 bg-white text-slate-800', icon: '👥' },
    { title: 'ผู้ป่วยติดบ้าน (Homebound)', count: stats.homebound, unit: 'คน', color: 'border-amber-400 bg-amber-50/50 text-amber-900', icon: '🚶' },
    { title: 'ผู้ป่วยติดเตียง (Bedridden)', count: stats.bedridden, unit: 'คน', color: 'border-rose-400 bg-rose-50/50 text-rose-900', icon: '🛏️' },
    { title: 'ผู้ป่วยประคับประคอง (Palliative)', count: stats.palliative, unit: 'คน', color: 'border-purple-400 bg-purple-50/50 text-purple-900', icon: '🤍' },
    { title: 'งานอนามัยแม่และเด็ก', count: stats.mch, unit: 'ราย', color: 'border-pink-400 bg-pink-50/50 text-pink-900', icon: '🤱' },
    { title: 'เฝ้าระวังโรคติดต่อ', count: stats.surveillance, unit: 'เคส', color: 'border-orange-400 bg-orange-50/50 text-orange-900', icon: '🚨' },
    { title: 'ส่งต่อโรงพยาบาล (Refer)', count: stats.refer, unit: 'เคส', color: 'border-blue-400 bg-blue-50/50 text-blue-900', icon: '🚑' }
  ];

  return (
    <div className="space-y-6">
      {/* Header แดชบอร์ด */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-3xl p-6 text-white shadow-md flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="text-xs font-semibold bg-emerald-900/60 px-3 py-1 rounded-full text-emerald-200 uppercase tracking-wider">
            Wang Takhian Primary Healthcare Overview
          </span>
          <h2 className="text-xl sm:text-2xl font-bold mt-2">
            ศูนย์ข้อมูลบริการสุขภาพปฐมภูมิ รพ.สต.วังตะเคียน
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            สรุปสถานการณ์สุขภาพชุมชนและผู้ป่วยในความดูแล (หมู่ 1–17)
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          <div className="text-xs text-emerald-200">
            {userRole === 'guest' ? 'มุมมองบุคคลทั่วไป (Public View)' : `สิทธิ์การเข้าถึง: ${userRole.toUpperCase()}`}
          </div>
        </div>
      </div>

      {/* สรุปยอดผู้ป่วย 7 หมวดหมู่หลัก */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <span>📊</span> สถิติจำนวนผู้รับบริการและกลุ่มเป้าหมายในพื้นที่
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {STAT_CARDS.map((card, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border-l-4 ${card.color} border border-slate-200 shadow-sm flex flex-col justify-between`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-600">{card.title}</span>
                <span className="text-xl">{card.icon}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold">{card.count}</span>
                <span className="text-xs font-medium text-slate-500">{card.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* เมนูนำทางตามสิทธิ์ */}
      {isProfessional && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-3">เข้าสู่ระบบงานบริการ (เจ้าหน้าที่วิชาชีพ)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <button onClick={() => onNavigate('homeVisit')} className="p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-left border border-emerald-200 transition">
              <span className="font-bold text-emerald-900 block">🏠 1. เยี่ยมบ้าน & ADL</span>
              <span className="text-[11px] text-emerald-700">ประเมินและออกรายงาน</span>
            </button>
            <button onClick={() => onNavigate('surveillance')} className="p-3 bg-amber-50 hover:bg-amber-100 rounded-xl text-left border border-amber-200 transition">
              <span className="font-bold text-amber-900 block">🚨 2. เฝ้าระวังโรคติดต่อ</span>
              <span className="text-[11px] text-amber-700">สอบสวนและควบคุมโรค</span>
            </button>
            <button onClick={() => onNavigate('familyPlanning')} className="p-3 bg-purple-50 hover:bg-purple-100 rounded-xl text-left border border-purple-200 transition">
              <span className="font-bold text-purple-900 block">💊 3. วางแผนครอบครัว</span>
              <span className="text-[11px] text-purple-700">จ่ายยาคุมและสรุปยอด</span>
            </button>
            <button onClick={() => onNavigate('refer')} className="p-3 bg-blue-50 hover:bg-blue-100 rounded-xl text-left border border-blue-200 transition">
              <span className="font-bold text-blue-900 block">🚑 4. งานส่งต่อ (Refer)</span>
              <span className="text-[11px] text-blue-700">ใบ Refer A4 และทะเบียน</span>
            </button>
          </div>
        </div>
      )}

      {isOsmOrCg && (
        <div className="bg-teal-50 border border-teal-200 rounded-3xl p-5 shadow-sm flex flex-wrap justify-between items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-teal-900">งานเยี่ยมบ้านสำหรับ อสม. และ Caregiver</h3>
            <p className="text-xs text-teal-700 mt-1">
              เข้าบันทึกผลการดูแลผู้ป่วยติดบ้าน/ติดเตียงตามที่ได้รับมอบหมาย
            </p>
          </div>
          <button
            onClick={() => onNavigate('caregiver')}
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs px-5 py-2.5 rounded-xl font-medium transition shadow"
          >
            🤝 ไปยังรายชื่อผู้ป่วยที่รับผิดชอบ
          </button>
        </div>
      )}
    </div>
  );
}