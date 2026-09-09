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
  Activity,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  AlertCircle,
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
  onCheckSystemStatus?: () => void; // 🔥 เพิ่ม prop ใหม่
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
  onCheckSystemStatus, // 🔥 เพิ่ม prop ใหม่
}) => {
  const currentLesson = COURSE_LESSONS.find((l) => l.id === currentLessonId) || COURSE_LESSONS[0];
  const progressPercent = Math.round((completedLessons.length / COURSE_LESSONS.length) * 100);

  // 🔥 ฟังก์ชันฟอร์แมตเวลาที่บันทึกล่าสุด
  const formatTimeSinceSaved = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'เพิ่งบันทึก';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(seconds / 86400)} วันที่แล้ว`;
  };

  // 🔥 ไอคอนสถานะคลาวด์
  const getCloudIcon = () => {
    switch (cloudStatus) {
      case 'synced':
        return <Cloud className="w-3.5 h-3.5 text-emerald-500" />;
      case 'connecting':
        return <Cloud className="w-3.5 h-3.5 text-amber-500 animate-pulse" />;
      case 'offline':
        return <CloudOff className="w-3.5 h-3.5 text-stone-400" />;
      default:
        return <Cloud className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  // 🔥 ข้อความสถานะคลาวด์
  const getCloudStatusText = () => {
    switch (cloudStatus) {
      case 'synced':
        return 'เชื่อมต่อคลาวด์';
      case 'connecting':
        return 'กำลังเชื่อมต่อ...';
      case 'offline':
        return 'ออฟไลน์';
      default:
        return 'คลาวด์';
    }
  };

  // 🔥 สีสถานะคลาวด์
  const getCloudStatusColor = () => {
    switch (cloudStatus) {
      case 'synced':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'connecting':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'offline':
        return 'text-stone-600 bg-stone-50 border-stone-200';
      default:
        return 'text-stone-600 bg-stone-50 border-stone-200';
    }
  };

  // 🔥 สถานะบันทึกข้อมูลล่าสุด
  const isRecentlySaved = Date.now() - lastSavedAt < 30000; // 30 วินาที

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
            <span className="text-[#2C2C2C] font-semibold max-w-[120px] truncate">
              {currentLesson.thaiTitle.split('—')[0].trim()}
            </span>
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
          
          {/* 🔥 Cloud Status with Improved UI */}
          <button
            type="button"
            onClick={onCheckSystemStatus}
            title="คลิกเพื่อตรวจสอบสถานะระบบทั้งหมด"
            className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg border transition-colors ${getCloudStatusColor()}`}
          >
            {getCloudIcon()}
            <span className="hidden lg:inline font-medium">
              {getCloudStatusText()}
            </span>
            {cloudStatus === 'synced' && (
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            )}
            {cloudStatus === 'connecting' && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>

          {/* 🔥 Last Saved Indicator */}
          <div className="flex items-center gap-1.5 text-[10px] text-[#737365]">
            <span className="text-[#E9E3D5]">|</span>
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${isRecentlySaved ? 'bg-emerald-400 animate-pulse' : 'bg-stone-300'}`} />
              <span className="font-medium">
                {formatTimeSinceSaved(lastSavedAt)}
              </span>
            </div>
          </div>
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

          {/* 🔥 System Status Check Button */}
          {onCheckSystemStatus && (
            <button
              type="button"
              onClick={onCheckSystemStatus}
              className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-[#5A5A40] hover:text-[#2C2C2C] bg-[#FAF7F2] hover:bg-[#E9E3D5]/50 border border-[#E9E3D5] px-3 py-1.5 rounded-lg transition-colors"
              title="ตรวจสอบสถานะระบบทั้งหมด"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>สถานะระบบ</span>
            </button>
          )}

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

      {/* 🔥 Mobile View: Simplified Progress Bar */}
      <div className="md:hidden mt-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="text-[10px] text-[#737365] mb-1 flex items-center justify-between">
              <span className="font-medium">บทเรียนปัจจุบัน:</span>
              <span className="font-semibold text-[#5A5A40]">{progressPercent}% เสร็จสิ้น</span>
            </div>
            <div className="w-full bg-[#E9E3D5] h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5A5A40] rounded-full transition-all duration-500"
                style={{ width: `${Math.max(progressPercent, 5)}%` }}
              />
            </div>
          </div>
          
          {/* 🔥 Mobile Cloud Status */}
          <button
            type="button"
            onClick={onCheckSystemStatus}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-medium ${getCloudStatusColor()}`}
            title="สถานะระบบ"
          >
            {getCloudIcon()}
            <span>{getCloudStatusText()}</span>
          </button>
        </div>
      </div>
    </header>
  );
};