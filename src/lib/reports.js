// src/lib/reports.js
import * as XLSX from 'xlsx';

// ==========================================
// 1. โมดูลรายงานงานเยี่ยมบ้าน (Home Visits)
// ==========================================

// ส่งออกข้อมูลการเยี่ยมบ้านทั้งหมดเป็น Excel
export function exportVisitsToExcel(visits, patients = []) {
  if (!visits || visits.length === 0) {
    alert('ไม่มีข้อมูลการเยี่ยมบ้านสำหรับส่งออก');
    return;
  }

  const patientMap = new Map((patients || []).map(p => [p.id, p]));

  const exportData = visits.map((v, index) => {
    const pt = patientMap.get(v.patient_id) || {};
    return {
      'ลำดับ': index + 1,
      'วันที่เยี่ยม': v.visit_date || '-',
      'ชื่อ-สกุล ผู้ป่วย': pt.full_name || v.patient_name || '-',
      'เลขบัตรประชาชน (CID)': pt.cid || '-',
      'HN': pt.hn || '-',
      'หมู่ที่': pt.village_no ? `หมู่ ${pt.village_no}` : '-',
      'ความดันโลหิต (BP)': v.bp || '-',
      'ชีพจร (PR)': v.pulse ? `${v.pulse} ครั้ง/นาที` : '-',
      'อุณหภูมิ (Temp)': v.temp ? `${v.temp} °C` : '-',
      'น้ำตาลปลายนิ้ว (DTX)': v.dtx ? `${v.dtx} mg/dL` : '-',
      'คะแนน ADL': v.adl_score ?? '-',
      'ปัญหา/การพยาบาล': v.nursing_care || v.notes || '-',
      'ผู้บันทึก/ผู้เยี่ยม': v.caregiver_name || '-'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'บันทึกการเยี่ยมบ้าน');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `รายงานการเยี่ยมบ้าน_รพสต_วังตะเคียน_${today}.xlsx`);
}

// พิมพ์รายงานการเยี่ยมบ้านรายบุคคล 1 หน้า A4 (TH Sarabun)
export function printIndividualVisitReport(visit, patient) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('กรุณาอนุญาตป๊อปอัปเพื่อพิมพ์รายงาน');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>ใบบันทึกการเยี่ยมบ้าน - ${patient?.full_name || 'ผู้รับบริการ'}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: 'Sarabun', sans-serif;
          font-size: 14pt;
          line-height: 1.35;
          color: #111827;
          margin: 0;
          padding: 0;
        }
        .header-title {
          text-align: center;
          font-size: 17pt;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .header-sub {
          text-align: center;
          font-size: 13pt;
          color: #4b5563;
          margin-bottom: 12px;
        }
        .section-box {
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 10px;
        }
        .section-title {
          font-size: 14pt;
          font-weight: 700;
          color: #065f46;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 3px;
          margin-bottom: 6px;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 12px;
        }
        .grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        .info-item {
          font-size: 13pt;
        }
        .info-label {
          font-weight: 600;
          color: #374151;
        }
        .vitals-card {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 4px 6px;
          text-align: center;
        }
        .vitals-val {
          font-size: 14pt;
          font-weight: 700;
          color: #111827;
        }
        .images-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 8px 0;
        }
        .img-box {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          height: 145px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fdfdfd;
        }
        .img-box img {
          max-height: 100%;
          max-width: 100%;
          object-fit: cover;
        }
        .signatures-area {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 15px;
          padding-top: 8px;
        }
        .signature-col {
          text-align: center;
          font-size: 13pt;
        }
        .sig-line {
          height: 60px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          margin-bottom: 4px;
        }
        .sig-line img {
          max-height: 55px;
        }
      </style>
    </head>
    <body>
      <div class="header-title">ใบบันทึกการเยี่ยมบ้าน (Home Visit Record)</div>
      <div class="header-sub">โรงพยาบาลส่งเสริมสุขภาพตำบลวังตะเคียน อำเภอกบินทร์บุรี จังหวัดปราจีนบุรี</div>

      <!-- ข้อมูลผู้ป่วย -->
      <div class="section-box">
        <div class="section-title">ข้อมูลผู้รับบริการ</div>
        <div class="grid-2">
          <div class="info-item"><span class="info-label">ชื่อ-สกุล:</span> ${patient?.full_name || '-'}</div>
          <div class="info-item"><span class="info-label">เลขบัตรประชาชน:</span> ${patient?.cid || '-'}</div>
          <div class="info-item"><span class="info-label">HN:</span> ${patient?.hn || '-'}</div>
          <div class="info-item"><span class="info-label">ที่อยู่:</span> หมู่ที่ ${patient?.village_no || '-'} ต.วังตะเคียน</div>
          <div class="info-item"><span class="info-label">วันที่เยี่ยม:</span> ${visit?.visit_date || '-'}</div>
          <div class="info-item"><span class="info-label">คะแนน ADL:</span> ${visit?.adl_score ?? '-'} / 20</div>
        </div>
      </div>

      <!-- สัญญาณชีพ -->
      <div class="section-box">
        <div class="section-title">สัญญาณชีพ (Vital Signs)</div>
        <div class="grid-4">
          <div class="vitals-card">
            <div class="info-label" style="font-size: 11pt;">ความดัน (BP)</div>
            <div class="vitals-val">${visit?.bp || '-'}</div>
          </div>
          <div class="vitals-card">
            <div class="info-label" style="font-size: 11pt;">ชีพจร (PR)</div>
            <div class="vitals-val">${visit?.pulse || '-'} <span style="font-size: 10pt; font-weight: normal;">bpm</span></div>
          </div>
          <div class="vitals-card">
            <div class="info-label" style="font-size: 11pt;">อุณหภูมิ (T)</div>
            <div class="vitals-val">${visit?.temp || '-'} <span style="font-size: 10pt; font-weight: normal;">°C</span></div>
          </div>
          <div class="vitals-card">
            <div class="info-label" style="font-size: 11pt;">DTX</div>
            <div class="vitals-val">${visit?.dtx || '-'} <span style="font-size: 10pt; font-weight: normal;">mg%</span></div>
          </div>
        </div>
      </div>

      <!-- บันทึกการพยาบาล -->
      <div class="section-box">
        <div class="section-title">ปัญหาและการให้การพยาบาล</div>
        <div style="font-size: 13pt; min-height: 48px;">
          ${visit?.nursing_care || visit?.notes || 'ได้รับการดูแลสุขภาพและให้คำแนะนำตามมาตรฐาน'}
        </div>
      </div>

      <!-- ภาพถ่ายหน้างาน 2 ภาพตรงกลาง -->
      <div class="images-container">
        <div class="img-box">
          ${visit?.photo_url_1 ? `<img src="${visit.photo_url_1}" alt="ภาพอาการ/แผล"/>` : '<span style="color: #9ca3af; font-size: 12pt;">ภาพผู้ป่วย / อาการ</span>'}
        </div>
        <div class="img-box">
          ${visit?.photo_url_2 ? `<img src="${visit.photo_url_2}" alt="ภาพสภาพแวดล้อม"/>` : '<span style="color: #9ca3af; font-size: 12pt;">ภาพสภาพแวดล้อมบ้าน</span>'}
        </div>
      </div>

      <!-- ลายมือชื่อ 2 ฝั่งในระนาบเดียวกัน -->
      <div class="signatures-area">
        <div class="signature-col">
          <div class="sig-line">
            ${visit?.patient_signature_url ? `<img src="${visit.patient_signature_url}"/>` : '...................................................'}
          </div>
          <div>ลงชื่อ ...................................................</div>
          <div>(ผู้รับบริการ / ญาติ)</div>
        </div>
        <div class="signature-col">
          <div class="sig-line">
            ${visit?.caregiver_signature_url ? `<img src="${visit.caregiver_signature_url}"/>` : '...................................................'}
          </div>
          <div>ลงชื่อ ...................................................</div>
          <div>(${visit?.caregiver_name || 'เจ้าหน้าที่ผู้ปฏิบัติงาน'})</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}


// ==========================================
// 2. โมดูลงานเฝ้าระวังโรคติดต่อ (Disease Surveillance)
// ==========================================

const SURVEILLANCE_DISEASE_NAMES = {
  dengue: 'ไข้เลือดออก',
  covid19: 'COVID-19',
  influenza: 'ไข้หวัดใหญ่',
  hfm: 'มือเท้าปาก',
  diarrhea: 'อุจจาระร่วงเฉียบพลัน',
  chikungunya: 'ไข้ปวดข้อยุงลาย',
  other: 'โรคติดต่ออื่นๆ'
};

const SURVEILLANCE_STATUS_LABELS = {
  suspected: 'สงสัย / รอผล',
  confirmed: 'ยืนยันผล',
  under_control: 'กำลังควบคุมโรค',
  recovered: 'หายแล้ว',
  deceased: 'เสียชีวิต'
};

// ส่งออกรายงานเฝ้าระวังโรคเป็น Excel
export function exportSurveillanceToExcel(cases) {
  if (!cases || cases.length === 0) {
    alert('ไม่มีข้อมูลสำหรับส่งออก Excel');
    return;
  }

  const exportData = cases.map((c, index) => ({
    'ลำดับ': index + 1,
    'วันที่เริ่มป่วย': c.onset_date || '-',
    'โรค': SURVEILLANCE_DISEASE_NAMES[c.disease] || c.disease,
    'ชื่อโรคเพิ่มเติม': c.disease_other || '-',
    'หมู่ที่': `หมู่ ${c.village_no} ต.วังตะเคียน`,
    'พิกัดละติจูด (Lat)': c.latitude || '-',
    'พิกัดลองจิจูด (Lng)': c.longitude || '-',
    'มาตรการพ่นหมอกควัน': c.control_measures?.fogging_done ? 'ดำเนินการแล้ว' : 'ยังไม่ดำเนินการ',
    'มาตรการแจกทรายอะเบท': c.control_measures?.temephos_distributed ? 'ดำเนินการแล้ว' : 'ยังไม่ดำเนินการ',
    'สถานะผู้ป่วย': SURVEILLANCE_STATUS_LABELS[c.status] || c.status,
    'บันทึกเพิ่มเติม': c.notes || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงานเฝ้าระวังโรค');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `รายงานเฝ้าระวังโรค_รพสต_วังตะเคียน_${today}.xlsx`);
}
// เพิ่มต่อท้ายใน src/lib/reports.js

const FP_METHOD_LABELS = {
  dmpa_injection: 'ยาฉีด DMPA (3 เดือน)',
  monthly_injection: 'ยาฉีด 1 เดือน',
  oral_pills_coc: 'ยาเม็ดฮอร์โมนรวม (COC)',
  oral_pills_pop: 'ยาเม็ดฮอร์โมนเดี่ยว (POP)',
  implant_3yr: 'ยาฝังคุมกำเนิด 3 ปี',
  implant_5yr: 'ยาฝังคุมกำเนิด 5 ปี',
  condom: 'ถุงยางอนามัย',
  iud: 'ห่วงอนามัย',
  sterilization: 'ทำหมันถาวร'
};

// ฟังก์ชันส่งออกรายงานสรุปวางแผนครอบครัวตามช่วงเวลา
export function exportFamilyPlanningReportToExcel(filteredRecords, startDate, endDate, summaryStats) {
  if (!filteredRecords || filteredRecords.length === 0) {
    alert('ไม่มีข้อมูลสำหรับส่งออก Excel ในช่วงเวลานี้');
    return;
  }

  const workbook = XLSX.utils.book_new();

  // แผ่นที่ 1: สรุปยอดแยกตามวิธีคุมกำเนิด
  const summaryData = summaryStats.map((item, idx) => ({
    'ลำดับ': idx + 1,
    'วิธีการคุมกำเนิด': item.label,
    'จำนวนผู้รับบริการ (ราย)': item.count,
    'คิดเป็นร้อยละ (%)': item.percentage
  }));
  summaryData.push({
    'ลำดับ': '',
    'วิธีการคุมกำเนิด': 'รวมทั้งสิ้น',
    'จำนวนผู้รับบริการ (ราย)': filteredRecords.length,
    'คิดเป็นร้อยละ (%)': '100.0%'
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'สรุปยอดแยกวิธีคุมกำเนิด');

  // แผ่นที่ 2: รายชื่อผู้รับบริการทั้งหมดในช่วงเวลา
  const detailData = filteredRecords.map((r, idx) => ({
    'ลำดับ': idx + 1,
    'วันที่รับบริการ': r.service_date,
    'ชื่อ-สกุล': r.patient_name,
    'เลขบัตรประชาชน': r.cid || '-',
    'ประวัติครรภ์': (r.gravida !== null || r.para !== null) 
      ? `G${r.gravida ?? 0} P${r.para ?? 0} A${r.abortion ?? 0} L${r.living ?? 0}` 
      : '-',
    'อายุบุตรคนสุดท้อง': r.last_child_age || '-',
    'บ้านเลขที่': r.house_no || '-',
    'หมู่ที่': r.village_no === 0 ? 'นอกเขต' : `หมู่ ${r.village_no}`,
    'วิธีการคุมกำเนิด': FP_METHOD_LABELS[r.method] || r.method,
    'รายละเอียด/แผง/ยี่ห้อ': r.item_details || '-',
    'อาการข้างเคียง': r.side_effects || '-',
    'วันนัดหมายถัดไป': r.next_appointment_date || '-'
  }));

  const wsDetail = XLSX.utils.json_to_sheet(detailData);
  XLSX.utils.book_append_sheet(workbook, wsDetail, 'รายชื่อผู้รับบริการ');

  XLSX.writeFile(workbook, `รายงานสรุปวางแผนครอบครัว_${startDate}_ถึง_${endDate}.xlsx`);
}
// src/lib/reports.js (ส่วนฟังก์ชัน printReferReport)

const URGENCY_LABELS = {
  emergency: 'ภาวะวิกฤต / ฉุกเฉิน (Emergency)',
  urgent: 'ด่วนมาก (Urgent)',
  routine: 'ทั่วไป / นัดหมายล่วงหน้า (Routine)'
};

export function printReferReport(referData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('กรุณาอนุญาตป๊อปอัปเพื่อพิมพ์ใบส่งต่อผู้ป่วย');
    return;
  }

  // คำนวณปีงบประมาณ พ.ศ. และเลขที่ใบส่งตัว
  const d = new Date(referData?.refer_date || Date.now());
  const yearCE = d.getFullYear();
  const month = d.getMonth() + 1;
  const fiscalYear = referData?.fiscal_year || (month >= 10 ? yearCE + 543 + 1 : yearCE + 543);
  const referNo = referData?.refer_no || 1;
  const referDocCode = `ใบส่งตัวหมายเลข ${referNo} /${fiscalYear}`;

  // ใช้ absolute URL ไปยังโฟลเดอร์ public/logo.png
  const logoUrl = window.location.origin + '/logo.png';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>ใบส่งต่อผู้ป่วย - ${referData?.patient_name || 'ผู้ป่วย'}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 15mm 10mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: 'Sarabun', sans-serif;
          font-size: 13pt;
          line-height: 1.35;
          color: #111827;
          margin: 0;
          padding: 0;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2px;
        }
        .refer-no-box {
          font-size: 12.5pt;
          font-weight: 700;
          color: #0f172a;
          border: 1px solid #94a3b8;
          padding: 2px 10px;
          border-radius: 4px;
          background: #f8fafc;
        }
        .form-origin-text {
          font-size: 11pt;
          color: #475569;
        }
        .logo-center-wrapper {
          text-align: center;
          margin-top: -10px;
          margin-bottom: 4px;
        }
        .logo-img {
          width: 72px;
          height: 72px;
          object-fit: contain;
          display: inline-block;
        }
        .header-title {
          text-align: center;
          font-size: 16.5pt;
          font-weight: 700;
          line-height: 1.25;
          margin-bottom: 2px;
        }
        .header-sub {
          text-align: center;
          font-size: 12.5pt;
          color: #374151;
          margin-bottom: 8px;
        }
        .badge-urgency {
          display: inline-block;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1.5px solid #111827;
          font-size: 11.5pt;
        }
        .section-box {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 6px 12px;
          margin-bottom: 6px;
        }
        .section-title {
          font-size: 12.5pt;
          font-weight: 700;
          color: #0f172a;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 2px;
          margin-bottom: 4px;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2px 14px;
        }
        .grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        .info-item {
          font-size: 12pt;
        }
        .info-label {
          font-weight: 600;
          color: #1e293b;
        }
        .vitals-box {
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 3px 4px;
          text-align: center;
        }
        .vitals-title {
          font-size: 10pt;
          font-weight: 600;
          color: #475569;
        }
        .vitals-value {
          font-size: 12.5pt;
          font-weight: 700;
          color: #0f172a;
        }
        .signature-area {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 14px;
          text-align: center;
          font-size: 12pt;
        }
      </style>
    </head>
    <body>
      <div class="header-top">
        <div class="refer-no-box">${referDocCode}</div>
        <div class="form-origin-text">แบบฟอร์มส่งต่อผู้ป่วย รพ.สต.</div>
      </div>

      <div class="logo-center-wrapper">
        <img src="${logoUrl}" class="logo-img" alt="ตราสัญลักษณ์" />
      </div>

      <div class="header-title">ใบส่งต่อผู้รับบริการ (Referral Form)</div>
      <div class="header-sub">โรงพยาบาลส่งเสริมสุขภาพตำบลวังตะเคียน อำเภอกบินทร์บุรี จังหวัดปราจีนบุรี</div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <div style="font-size: 12.5pt;"><strong>ส่งต่อไปยัง:</strong> ${referData?.destination_hospital || 'โรงพยาบาลกบินทร์บุรี'}</div>
        <div class="badge-urgency">ความเร่งด่วน: ${URGENCY_LABELS[referData?.urgency] || referData?.urgency}</div>
      </div>

      <div class="section-box">
        <div class="section-title">ข้อมูลทั่วไปผู้ป่วย</div>
        <div class="grid-2">
          <div class="info-item"><span class="info-label">ชื่อ-สกุล:</span> ${referData?.patient_name || '-'}</div>
          <div class="info-item"><span class="info-label">เลขประจำตัวประชาชน:</span> ${referData?.cid || '-'}</div>
          <div class="info-item"><span class="info-label">อายุ:</span> ${referData?.age ? `${referData.age} ปี` : '-'} &nbsp;&nbsp; <span class="info-label">เพศ:</span> ${referData?.gender || '-'}</div>
          <div class="info-item">
            <span class="info-label">ที่อยู่:</span> 
            ${referData?.house_no ? `บ้านเลขที่ ${referData.house_no} ` : ''} 
            ${referData?.village_no === 0 ? 'นอกเขตตำบลวังตะเคียน' : `หมู่ที่ ${referData?.village_no} ต.วังตะเคียน`}
          </div>
          <div class="info-item"><span class="info-label">วันที่/เวลาส่งต่อ:</span> ${new Date(referData?.refer_date || Date.now()).toLocaleString('th-TH')}</div>
        </div>
      </div>

      <div class="section-box">
        <div class="section-title">สัญญาณชีพแรกรับก่อนส่งต่อ (Vital Signs)</div>
        <div class="grid-4">
          <div class="vitals-box">
            <div class="vitals-title">ความดันโลหิต (BP)</div>
            <div class="vitals-value">${referData?.bp || '-'} <span style="font-size: 9pt; font-weight: normal;">mmHg</span></div>
          </div>
          <div class="vitals-box">
            <div class="vitals-title">ชีพจร (PR)</div>
            <div class="vitals-value">${referData?.pulse || '-'} <span style="font-size: 9pt; font-weight: normal;">bpm</span></div>
          </div>
          <div class="vitals-box">
            <div class="vitals-title">อุณหภูมิ (T)</div>
            <div class="vitals-value">${referData?.temp || '-'} <span style="font-size: 9pt; font-weight: normal;">°C</span></div>
          </div>
          <div class="vitals-box">
            <div class="vitals-title">ออกซิเจน (SpO2)</div>
            <div class="vitals-value">${referData?.spo2 || '-'} <span style="font-size: 9pt; font-weight: normal;">%</span></div>
          </div>
        </div>
      </div>

      <div class="section-box">
        <div class="section-title">อาการสำคัญและการตรวจร่างกาย (Chief Complaint & Physical Exam)</div>
        <div style="font-size: 12pt; min-height: 36px; padding: 2px 0;">
          ${referData?.chief_complaint || '-'}
        </div>
      </div>

      <div class="section-box">
        <div class="section-title">การวินิจฉัยโรคเบื้องต้น (Preliminary Diagnosis)</div>
        <div style="font-size: 12pt; font-weight: 600; color: #0f172a; margin-bottom: 2px;">
          ${referData?.preliminary_diagnosis || '-'}
        </div>
        <div class="info-item"><span class="info-label">สาเหตุที่ส่งต่อ:</span> ${referData?.reason_for_refer || '-'}</div>
      </div>

      <div class="section-box">
        <div class="section-title">การรักษา/ยาที่ให้ก่อนส่งต่อ (Pre-referral Management & Medication)</div>
        <div style="font-size: 12pt; min-height: 40px;">
          ${referData?.pre_referral_treatment || 'ให้การปฐมพยาบาล ประเมินสัญญาณชีพต่อเนื่อง และดูแลความปลอดภัยระหว่างเดินทาง'}
        </div>
      </div>

      <div class="signature-area">
        <div>
          <div style="height: 38px;"></div>
          <div>ลงชื่อ ................................................................</div>
          <div>(ผู้รับส่งต่อ / เจ้าหน้าที่รับเวร)</div>
          <div style="font-size: 10pt; color: #64748b;">ตำแหน่ง ......................................................</div>
        </div>
        <div>
          <div style="height: 38px;"></div>
          <div>ลงชื่อ ................................................................</div>
          <div>(พยาบาลวิชาชีพ / เจ้าหน้าที่ผู้ส่งต่อ)</div>
          <div style="font-size: 10pt; color: #64748b;">รพ.สต.วังตะเคียน อ.กบินทร์บุรี</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
// เพิ่มต่อท้ายใน src/lib/reports.js

const REFER_URGENCY_TH = {
  emergency: 'วิกฤต/ฉุกเฉิน',
  urgent: 'ด่วนมาก',
  routine: 'ทั่วไป'
};

const REFER_STATUS_TH = {
  pending: 'อยู่ระหว่างส่งต่อ',
  received: 'รพ.รับตัวแล้ว',
  referred_back: 'รับกลับดูแลต่อ (Refer Back)'
};

// ส่งออกทะเบียนส่งต่อผู้ป่วย (Refer Register) ตามช่วงเวลาที่เลือก
export function exportReferRegisterToExcel(records, startDate, endDate) {
  if (!records || records.length === 0) {
    alert('ไม่มีข้อมูลการส่งต่อผู้ป่วยในช่วงเวลาที่เลือก');
    return;
  }

  const exportData = records.map((r, index) => {
    const d = new Date(r.refer_date || Date.now());
    return {
      'ลำดับ': index + 1,
      'เลขที่ใบส่งตัว': r.refer_no ? `${r.refer_no}/${r.fiscal_year}` : '-',
      'วันที่ส่งต่อ': d.toLocaleDateString('th-TH'),
      'เวลา': d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      'ชื่อ-สกุล ผู้ป่วย': r.patient_name || '-',
      'เลขประจำตัวประชาชน': r.cid || '-',
      'อายุ': r.age ? `${r.age} ปี` : '-',
      'เพศ': r.gender || '-',
      'บ้านเลขที่': r.house_no || '-',
      'หมู่ที่': r.village_no === 0 ? 'นอกเขต' : `หมู่ ${r.village_no}`,
      'ระดับความเร่งด่วน': REFER_URGENCY_TH[r.urgency] || r.urgency,
      'สถานพยาบาลปลายทาง': r.destination_hospital || '-',
      'อาการสำคัญ (CC)': r.chief_complaint || '-',
      'การวินิจฉัยเบื้องต้น (Impression)': r.preliminary_diagnosis || '-',
      'สาเหตุการส่งต่อ': r.reason_for_refer || '-',
      'BP': r.bp || '-',
      'PR (bpm)': r.pulse ?? '-',
      'Temp (°C)': r.temp ?? '-',
      'SpO2 (%)': r.spo2 ?? '-',
      'การรักษาเบื้องต้นก่อนส่งตัว': r.pre_referral_treatment || '-',
      'สถานะการส่งต่อ': REFER_STATUS_TH[r.status] || r.status,
      'ผลวินิจฉัยตอบกลับ (Refer Back)': r.refer_back_diagnosis || '-',
      'แผนดูแลต่อเนื่องที่ รพ.สต.': r.refer_back_plan || '-'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ทะเบียนส่งต่อผู้ป่วย');

  XLSX.writeFile(workbook, `ทะเบียนส่งต่อผู้ป่วย_รพสต_วังตะเคียน_${startDate}_ถึง_${endDate}.xlsx`);
}