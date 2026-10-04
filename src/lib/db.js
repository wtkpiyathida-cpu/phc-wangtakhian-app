// src/lib/db.js
import Dexie from 'dexie';

export const db = new Dexie('PHCWangTakhianDB');

// ขยับเวอร์ชันเป็น 4 ครบ 4 โมดูลหลัก
db.version(4).stores({
  patients: 'id, cid, full_name, village_no',
  cachedVisits: 'id, patient_id, visit_date, sync_status',
  diseaseSurveillance: 'id, patient_id, disease, village_no, status, sync_status',
  familyPlanning: 'id, patient_id, method, village_no, next_appointment_date, sync_status',
  patientRefers: 'id, patient_id, urgency, status, refer_date, sync_status',
  syncQueue: '++auto_id, table_name, action, payload, created_at'
});