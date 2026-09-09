import React from 'react';
import {
  CheckCircle2,
  Lock,
  PlayCircle,
  Palette,
  Droplets,
  Waves,
  Shapes,
  Sparkles,
  Trees,
  Compass,
  Award,
  User,
  Heart,
  History,
  Clock,
  Trophy,
} from 'lucide-react';
import { COURSE_LESSONS } from '../data/courseData';
import { UserProfile } from '../types';

interface CourseSidebarProps {
  currentLessonId: number;
  completedLessons: number[];
  onSelectLesson: (id: number) => void;
  userProfile: UserProfile;
  onEditProfile: () => void;
  onOpenHistory: () => void;
}

export const CourseSidebar: React.FC<CourseSidebarProps> = ({
  currentLessonId,
  completedLessons,
  onSelectLesson,
  userProfile,
  onEditProfile,
  onOpenHistory,
}) => {
  return (
    <aside id="course-sidebar" className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-[#FAF7F2] border-r border-[#E9E3D5] p-4 lg:p-5 overflow-y-auto space-y-5">
      {/* Learner Info Card */}
      <div className="bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-4 text-xs text-[#2C2C2C] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium text-[#5A5A40]">
            <User className="w-3.5 h-3.5 text-[#5A5A40]" />
            <span className="font-semibold">{userProfile.name || 'ผู้เรียนสีน้ำ'}</span>
          </div>
          <button
            type="button"
            onClick={onEditProfile}
            className="text-[11px] text-[#D9A066] hover:text-[#C2874C] hover:underline font-semibold"
          >
            ตั้งค่า / โปรไฟล์
          </button>
        </div>
        <div className="space-y-1.5 text-[#737365]">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3 h-3 text-[#D9A066]" />
            <span className="truncate">เป้าหมาย: {userProfile.goal || 'ผ่อนคลายและเยียวยาใจ'}</span>
          </div>
          <div className="text-[11px] text-[#888877] truncate">
            อุปกรณ์: {userProfile.supplies?.paintType || 'สีน้ำทั่วไป'} · {userProfile.practiceTimePerWeek || 'ฝึกตามสะดวก'}
          </div>
        </div>

        <button
          type="button"
          onClick={onEditProfile}
          className="w-full mt-1 pt-2 border-t border-[#E9E3D5] flex items-center justify-between text-[11px] text-[#5A5A40] hover:text-[#2C2C2C] font-semibold transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-[#D9A066]" />
            <span>เหรียญรางวัลความสำเร็จ</span>
          </span>
          <span className="text-[10px] bg-[#FAF7F2] border border-[#E9E3D5] px-2 py-0.5 rounded-full text-[#737365]">
            ดูเหรียญ →
          </span>
        </button>
      </div>

      {/* Course Map Header */}
      <div>
        <div className="flex items-center justify-between mb-1.5 px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#737365]">
            แผนที่หลักสูตร (Course Map)
          </h2>
          <span className="text-[11px] text-[#5A5A40] font-mono font-semibold">
            {completedLessons.length} / {COURSE_LESSONS.length} บท
          </span>
        </div>
        <p className="text-[11px] text-[#888877] px-1 leading-relaxed">
          *กติกา: เรียนทีละบทและตรวจผลงานก่อนปลดล็อกบทถัดไป
        </p>
      </div>

      {/* Lessons List */}
      <div className="space-y-2">
        {COURSE_LESSONS.map((lesson) => {
          const isCompleted = completedLessons.includes(lesson.id);
          const isCurrent = currentLessonId === lesson.id;
          const isUnlocked = lesson.id === 0 || completedLessons.includes(lesson.id - 1) || isCompleted;

          return (
            <button
              key={lesson.id}
              id={`lesson-item-${lesson.id}`}
              type="button"
              disabled={!isUnlocked}
              onClick={() => isUnlocked && onSelectLesson(lesson.id)}
              className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-start gap-3 border ${
                isCurrent
                  ? 'bg-[#FFF] border-[#5A5A40] shadow-2xs ring-1 ring-[#5A5A40]/30 text-[#2C2C2C]'
                  : isCompleted
                  ? 'bg-[#FFF] border-[#E9E3D5] hover:border-[#5A5A40]/50 hover:bg-[#FDFBF7] text-[#2C2C2C]'
                  : isUnlocked
                  ? 'bg-[#FFF] border-[#E9E3D5] hover:border-[#5A5A40]/40 text-[#2C2C2C]'
                  : 'bg-[#FAF7F2]/60 border-[#E9E3D5]/60 text-[#888877] cursor-not-allowed opacity-50'
              }`}
            >
              {/* Status / Step Icon */}
              <div
                className={`mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                  isCompleted
                    ? 'bg-[#E9F5DB] text-[#5A5A40] border border-[#5A5A40]/30'
                    : isCurrent
                    ? 'bg-[#5A5A40] text-[#FDFBF7] shadow-2xs'
                    : isUnlocked
                    ? 'bg-[#E9E3D5] text-[#5A5A40]'
                    : 'bg-[#E9E3D5]/50 text-[#888877]'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isCurrent ? (
                  <PlayCircle className="w-4 h-4 animate-pulse" />
                ) : !isUnlocked ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <span>{lesson.id}</span>
                )}
              </div>

              {/* Title & Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold leading-snug truncate">
                    {lesson.thaiTitle.split('—')[0].trim()}
                  </span>
                  {isCompleted && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E9F5DB] text-[#5A5A40] border border-[#5A5A40]/20">
                      ผ่านแล้ว
                    </span>
                  )}
                  {isCurrent && !isCompleted && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFE8D6] text-[#D9A066] border border-[#D9A066]/30">
                      กำลังฝึก
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#737365] mt-0.5 line-clamp-1">
                  {lesson.thaiTitle.includes('—') ? lesson.thaiTitle.split('—')[1].trim() : lesson.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Graduation Badge Banner if completed all */}
      {completedLessons.length === COURSE_LESSONS.length && (
        <div className="bg-[#FFF] border border-[#5A5A40]/40 rounded-2xl p-4 text-center text-[#2C2C2C] shadow-2xs">
          <Award className="w-7 h-7 mx-auto text-[#5A5A40] mb-1.5" />
          <h4 className="font-serif italic font-bold text-xs text-[#5A5A40]">ยินดีด้วย! คุณจบหลักสูตรแล้ว</h4>
          <p className="text-[11px] text-[#737365] mt-1">
            พร้อมรับใบประกาศนียบัตรศิลปินสีน้ำฝึกหัดในแกลเลอรี
          </p>
        </div>
      )}

      {/* History & Auto-save Status Card */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onOpenHistory}
          className="w-full bg-[#FFF] hover:bg-[#FAF7F2] border border-[#E9E3D5] hover:border-[#5A5A40]/40 rounded-2xl p-3.5 text-left transition-all shadow-2xs flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#FAF7F2] border border-[#E9E3D5] flex items-center justify-center text-[#5A5A40]">
              <History className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#2C2C2C]">ประวัติการเรียนรู้</div>
              <div className="text-[10px] text-[#737365]">Auto-saved · สำรองข้อมูลได้</div>
            </div>
          </div>
          <span className="text-[11px] text-[#5A5A40] font-semibold">ดูประวัติ →</span>
        </button>
      </div>
    </aside>
  );
};

