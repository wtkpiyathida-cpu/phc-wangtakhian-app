// src/lib/syncService.js
import { db } from './db';
import { supabase } from './supabase';

export async function getPendingSyncCount() {
  try {
    const queueCount = await db.syncQueue.count();
    return queueCount;
  } catch (error) {
    console.error('Error counting sync queue:', error);
    return 0;
  }
}

export async function syncPendingVisits() {
  if (!navigator.onLine) {
    return { success: false, message: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต' };
  }

  try {
    const pendingItems = await db.syncQueue.toArray();
    if (pendingItems.length === 0) {
      return { success: true, count: 0 };
    }

    for (const item of pendingItems) {
      const { auto_id, table_name, action, payload } = item;

      // 1. งานเฝ้าระวังโรคติดต่อ
      if (table_name === 'disease_surveillance') {
        if (action === 'INSERT') {
          const { error } = await supabase.from('disease_surveillance').insert([payload]);
          if (!error) {
            await db.diseaseSurveillance.update(payload.id, { sync_status: 'synced' });
            await db.syncQueue.delete(auto_id);
          }
        } else if (action === 'UPDATE') {
          const { id, ...updateFields } = payload;
          const { error } = await supabase.from('disease_surveillance').update(updateFields).eq('id', id);
          if (!error) {
            await db.diseaseSurveillance.update(id, { ...updateFields, sync_status: 'synced' });
            await db.syncQueue.delete(auto_id);
          }
        }
      }
      // 2. งานวางแผนครอบครัว
      else if (table_name === 'family_planning' && action === 'INSERT') {
        const { error } = await supabase.from('family_planning').insert([payload]);
        if (!error) {
          await db.familyPlanning.update(payload.id, { sync_status: 'synced' });
          await db.syncQueue.delete(auto_id);
        }
      }
      // 3. งานส่งต่อ (Refer)
      else if (table_name === 'patient_refers') {
        if (action === 'INSERT') {
          const { error } = await supabase.from('patient_refers').insert([payload]);
          if (!error) {
            await db.patientRefers.update(payload.id, { sync_status: 'synced' });
            await db.syncQueue.delete(auto_id);
          }
        } else if (action === 'UPDATE') {
          const { id, ...updateFields } = payload;
          const { error } = await supabase.from('patient_refers').update(updateFields).eq('id', id);
          if (!error) {
            await db.patientRefers.update(id, { ...updateFields, sync_status: 'synced' });
            await db.syncQueue.delete(auto_id);
          }
        }
      }
      // 4. งานเยี่ยมบ้าน
      else if (table_name === 'home_visits' && action === 'INSERT') {
        const { error } = await supabase.from('home_visits').insert([payload]);
        if (!error) {
          await db.cachedVisits.update(payload.id, { sync_status: 'synced' });
          await db.syncQueue.delete(auto_id);
        }
      }
    }

    return { success: true, count: pendingItems.length };
  } catch (err) {
    console.error('Background sync failed:', err);
    return { success: false, error: err.message };
  }
}