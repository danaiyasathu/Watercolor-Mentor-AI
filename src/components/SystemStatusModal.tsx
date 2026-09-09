// src/components/SystemStatusModal.tsx
import React from 'react';
import { X, Check, AlertCircle, CloudOff, WifiOff } from 'lucide-react';

interface SystemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: {
    online: boolean;
    storage: { localStorage: boolean; indexedDB: boolean; firebaseStorage: boolean };
    api: { available: boolean; evaluationEndpoint: boolean };
    firestore: { connected: boolean; databaseId: string };
  } | null;
}

export const SystemStatusModal: React.FC<SystemStatusModalProps> = ({
  isOpen,
  onClose,
  status,
}) => {
  if (!isOpen || !status) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-[#FAF7F2] border border-[#E9E3D5] rounded-3xl max-w-md w-full shadow-2xl p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#737365] hover:text-[#2C2C2C] hover:bg-[#E9E3D5]/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4 pr-8">
          <h2 className="font-serif italic font-bold text-xl text-[#5A5A40]">
            🛠️ สถานะระบบ
          </h2>
          <p className="text-xs text-[#737365] mt-0.5">
            ตรวจสอบการทำงานของระบบทั้งหมด
          </p>
        </div>

        <div className="space-y-3 text-sm">
          {/* Online Status */}
          <div className="flex items-center justify-between">
            <span className="text-[#5A5A40]">การเชื่อมต่ออินเทอร์เน็ต</span>
            <span className={`flex items-center gap-1.5 ${status.online ? 'text-green-700' : 'text-amber-700'}`}>
              {status.online ? <Check className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {status.online ? 'ออนไลน์' : 'ออฟไลน์'}
            </span>
          </div>

          {/* API Status */}
          <div className="flex items-center justify-between">
            <span className="text-[#5A5A40]">ระบบ AI ประเมินผล</span>
            <span className={`flex items-center gap-1.5 ${status.api.evaluationEndpoint ? 'text-green-700' : 'text-amber-700'}`}>
              {status.api.evaluationEndpoint ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {status.api.evaluationEndpoint ? 'พร้อมใช้งาน' : 'โหมดออฟไลน์'}
            </span>
          </div>

          {/* Storage Status */}
          <div className="flex items-center justify-between">
            <span className="text-[#5A5A40]">การจัดเก็บข้อมูล</span>
            <span className={`flex items-center gap-1.5 ${status.storage.indexedDB ? 'text-green-700' : 'text-amber-700'}`}>
              {status.storage.indexedDB ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {status.storage.indexedDB ? 'พร้อม' : 'มีปัญหา'}
            </span>
          </div>

          {/* Cloud Sync Status */}
          <div className="flex items-center justify-between">
            <span className="text-[#5A5A40]">การซิงค์คลาวด์</span>
            <span className={`flex items-center gap-1.5 ${status.firestore.connected ? 'text-green-700' : 'text-amber-700'}`}>
              {status.firestore.connected ? <Check className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
              {status.firestore.connected ? 'เชื่อมต่อแล้ว' : 'ไม่เชื่อมต่อ'}
            </span>
          </div>

          {/* Recommendations */}
          {(!status.online || !status.api.evaluationEndpoint || !status.storage.indexedDB) && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <p className="font-semibold mb-1">📝 คำแนะนำ:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {!status.online && <li>ผลงานจะถูกบันทึกเฉพาะในอุปกรณ์นี้</li>}
                {!status.api.evaluationEndpoint && <li>ใช้โหมดประเมินผลแบบออฟไลน์</li>}
                {!status.firestore.connected && <li>ผลงานจะไม่ถูกซิงค์ไปยังคลาวด์</li>}
              </ul>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#464632] rounded-xl shadow-2xs transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};