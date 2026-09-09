import React from 'react';
import {
  Palette,
  FileCode2,
  Sliders,
  Image as ImageIcon,
  Sparkles,
  Volume2,
  VolumeX,
  History,
  CheckCircle2,
} from 'lucide-react';
import { COURSE_LESSONS } from '../data/courseData';

interface NavbarProps {
  currentLessonId: number;
  completedLessons: number[];
  onOpenSystemInstruction: () => void;
  onOpenColorStudio: () => void;
  onOpenGallery: () => void;
  onOpenHistory: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  lastSavedAt: number;
  cloudStatus?: 'synced' | 'connecting' | 'offline';
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLessonId,
  completedLessons,
  onOpenSystemInstruction,
  onOpenColorStudio,
  onOpenGallery,
  onOpenHistory,
  soundEnabled,
  onToggleSound,
  lastSavedAt,
  cloudStatus = 'synced',
}) => {
  const currentLesson = COURSE_LESSONS.find((l) => l.id === currentLessonId) || COURSE_LESSONS[0];
  const progressPercent = Math.round((completedLessons.length / COURSE_LESSONS.length) * 100);

  return (
    <header id="app-navbar" className="sticky top-0 z-30 bg-[#FFF] border-b border-[#E9E3D5] px-4 lg:px-8 py-3 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Identity in Geometric Balance */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#5A5A40] flex items-center justify-center text-[#FDFBF7] shadow-2xs">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif italic font-bold text-lg text-[#5A5A40] tracking-tight leading-none">
                Watercolor Mentor
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FFE8D6] text-[#D9A066] border border-[#D9A066]/30">
                ครูสอนสีน้ำ
              </span>
            </div>
            <p className="text-[11px] text-[#737365] mt-0.5 hidden sm:block tracking-wide">
              พื้นที่ปลอดภัยสำหรับการฝึกฝน จินตนาการ และการเยียวยาใจ
            </p>
          </div>
        </div>

        {/* Center: Current Progress Pill & Auto-Save Badge */}
        <div className="hidden md:flex items-center gap-3 bg-[#FAF7F2] border border-[#E9E3D5] rounded-full px-4 py-1.5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs text-[#5A5A40] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#5A5A40] animate-pulse" />
            <span className="text-[11px] uppercase tracking-wider text-[#737365]">กำลังเรียน:</span>
            <span className="text-[#2C2C2C] font-semibold">{currentLesson.thaiTitle.split('—')[0].trim()}</span>
          </div>
          <span className="text-[#E9E3D5]">|</span>
          <div className="flex items-center gap-2 text-xs text-[#737365]">
            <div className="w-16 bg-[#E9E3D5] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5A5A40] rounded-full transition-all duration-500"
                style={{ width: `${Math.max(progressPercent, 5)}%` }}
              />
            </div>
            <span className="font-mono text-[11px] font-medium text-[#5A5A40]">{progressPercent}%</span>
          </div>
          <span className="text-[#E9E3D5]">|</span>
          <button
            type="button"
            onClick={onOpenHistory}
            title="ฐานข้อมูล Firestore เชื่อมต่อภูมิภาค asia-east1"
            className="flex items-center gap-1.5 text-[11px] text-[#5A5A40] hover:text-[#2C2C2C] font-medium transition-colors"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                cloudStatus === 'synced'
                  ? 'bg-emerald-500 shadow-xs'
                  : cloudStatus === 'connecting'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-stone-400'
              }`}
            />
            <span className="hidden lg:inline">
              {cloudStatus === 'synced'
                ? 'Cloud DB (asia-east1)'
                : cloudStatus === 'connecting'
                ? 'กำลังเชื่อมต่อ Cloud...'
                : 'ออฟไลน์ (บันทึกในเครื่อง)'}
            </span>
          </button>
        </div>

        {/* Right: Quick Tools */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'ปิดเสียงเซน' : 'เปิดเสียงเซน'}
            className="p-2 rounded-full text-[#737365] hover:text-[#5A5A40] hover:bg-[#FAF7F2] border border-transparent hover:border-[#E9E3D5] transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#5A5A40]" /> : <VolumeX className="w-4 h-4 text-[#888877]" />}
          </button>

          {/* Learning History & Backup */}
          <button
            id="btn-history"
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#E9E3D5]/70 text-[#2C2C2C] border border-[#E9E3D5] transition-colors shadow-2xs"
            title="ดูประวัติการเรียน ไทม์ไลน์ และสำรองข้อมูล"
          >
            <History className="w-3.5 h-3.5 text-[#5A5A40]" />
            <span className="hidden sm:inline">ประวัติการเรียน</span>
          </button>

          {/* Color Mixing Studio */}
          <button
            id="btn-color-studio"
            type="button"
            onClick={onOpenColorStudio}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#E9E3D5]/70 text-[#2C2C2C] border border-[#E9E3D5] transition-colors shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-[#D9A066]" />
            <span className="hidden sm:inline">ห้องผสมสี</span>
          </button>

          {/* Gallery of Works */}
          <button
            id="btn-gallery"
            type="button"
            onClick={onOpenGallery}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#E9E3D5]/70 text-[#2C2C2C] border border-[#E9E3D5] transition-colors shadow-2xs"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#5A5A40]" />
            <span className="hidden sm:inline">ผลงานของฉัน</span>
            {completedLessons.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[#E9F5DB] text-[#5A5A40] font-mono font-semibold border border-[#5A5A40]/20">
                {completedLessons.length}
              </span>
            )}
          </button>

          {/* System Instructions Modal */}
          <button
            id="btn-system-instructions"
            type="button"
            onClick={onOpenSystemInstruction}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-[#5A5A40] hover:bg-[#464632] text-white transition-colors shadow-2xs"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">System Instruction</span>
          </button>
        </div>
      </div>
    </header>
  );
};

