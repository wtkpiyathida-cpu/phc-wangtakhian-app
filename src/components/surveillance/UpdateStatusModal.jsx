// src/components/surveillance/UpdateStatusModal.jsx
import React, { useState } from 'react';
import { db } from '../../lib/db';
import { supabase } from '../../lib/supabase';

export default function UpdateStatusModal({ caseData, onClose, onUpdated }) {
  const [status, setStatus] = useState(caseData?.status || 'suspected');
  const [foggingDone, setFoggingDone] = useState(caseData?.control_measures?.fogging_done || false);
  const [temephosDone, setTemephosDone] = useState(caseData?.control_measures?.temephos_distributed || false);
  const [notes, setNotes] = useState(caseData?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    const updatedFields = {
      status,
      control_measures: {
        fogging_done: foggingDone,
        temephos_distributed: temephosDone
      },
      notes,
      updated_at: new Date().toISOString()
    };

    try {
      if (navigator.onLine) {
        const { error } = await supabase
          .from('disease_surveillance')
          .update(updatedFields)
          .eq('id', caseData.id);

        if (error) throw error;
        await db.diseaseSurveillance.update(caseData.id, { ...updatedFields, sync_status: 'synced' });
      } else {
        await db.diseaseSurveillance.update(caseData.id, { ...updatedFields, sync_status: 'pending' });
        await db.syncQueue.add({
          table_name: 'disease_surveillance',
          action: 'UPDATE',
          payload: { id: caseData.id, ...updatedFields },
          created_at: new Date().toISOString()
        });
      }

      alert('อัปเดตสถานะเรียบร้อยแล้ว');
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการอัปเดต: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full border border-gray-100 font-sans">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="font-bold text-gray-800 text-lg">อัปเดตการควบคุมโรค</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สถานะผู้ป่วย / ระบาดวิทยา</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="suspected">สงสัย / รอผล</option>
              <option value="confirmed">ยืนยันผลตรวจ</option>
              <option value="under_control">กำลังควบคุมโรค</option>
              <option value="recovered">หายแล้ว / สิ้นสุดติดตาม</option>
              <option value="deceased">เสียชีวิต</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">มาตรการควบคุมโรคที่ดำเนินการ</label>
            <div className="flex flex-col gap-2 text-sm bg-gray-50 p-3 rounded-lg border">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={foggingDone}
                  onChange={(e) => setFoggingDone(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 mr-2"
                />
                พ่นหมอกควันกำจัดยุง / พ่นยาฆ่าเชื้อ
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={temephosDone}
                  onChange={(e) => setTemephosDone(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 mr-2"
                />
                แจกทรายอะเบท / เวชภัณฑ์ป้องกัน
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">บันทึกเพิ่มเติม</label>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="บันทึกผลการติดตามอาการ..."
              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกอัปเดต'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}