import React, { useState } from 'react';
import { X, Copy, Check, FileCode2, ExternalLink, Sparkles } from 'lucide-react';
import { SYSTEM_INSTRUCTION_TEXT } from '../data/courseData';

interface SystemInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemInstructionModal: React.FC<SystemInstructionModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SYSTEM_INSTRUCTION_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-[#FAF7F2] border border-[#E9E3D5] rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#737365] hover:text-[#2C2C2C] hover:bg-[#E9E3D5]/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4 pr-8">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5A5A40] bg-[#E9E3D5]/60 border border-[#E9E3D5] px-2.5 py-0.5 rounded-full mb-1">
            <FileCode2 className="w-3 h-3" />
            <span>Google AI Studio Prompt Guide</span>
          </div>
          <h2 className="font-serif italic font-bold text-xl sm:text-2xl text-[#5A5A40]">
            System Instruction — ครูสอนสีน้ำสำหรับผู้เริ่มต้น
          </h2>
          <p className="text-xs text-[#737365] mt-1">
            สามารถคัดลอกข้อความทั้งหมดนี้ไปวางในช่อง <strong>"System instructions"</strong> ของ Google AI Studio เพื่อเปิดใช้งานติวเตอร์สีน้ำได้ทันที
          </p>
        </div>

        {/* Copy Button Action Bar */}
        <div className="flex items-center justify-between bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-3 mb-3 shadow-2xs">
          <span className="text-xs text-[#737365] font-medium pl-1">
            ข้อความคำสั่งระบบความยาว {SYSTEM_INSTRUCTION_TEXT.length} ตัวอักษร
          </span>
          <button
            id="btn-copy-system-instruction"
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              copied
                ? 'bg-[#5A5A40] text-white shadow-2xs'
                : 'bg-[#5A5A40] hover:bg-[#464632] text-white shadow-2xs'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>คัดลอกสำเร็จแล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>คัดลอกข้อความทั้งหมด</span>
              </>
            )}
          </button>
        </div>

        {/* Text Container */}
        <div className="flex-1 overflow-y-auto bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-4 sm:p-5 font-mono text-xs text-[#2C2C2C] whitespace-pre-wrap leading-relaxed select-all">
          {SYSTEM_INSTRUCTION_TEXT}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#E9E3D5] flex items-center justify-between text-xs text-[#737365]">
          <span>ครูสอนสีน้ำ (Watercolor Mentor)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 font-semibold text-white bg-[#5A5A40] hover:bg-[#464632] rounded-xl transition-colors shadow-2xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
