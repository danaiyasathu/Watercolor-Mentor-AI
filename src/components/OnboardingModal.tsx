import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Heart,
  Clock,
  Check,
  Brush,
  X,
  Award,
  Trophy,
  Lock,
  CheckCircle2,
  Droplets,
  Compass,
  BookOpen,
  Image as ImageIcon,
  Crown,
  ChevronRight,
  User,
} from 'lucide-react';
import { UserProfile, Submission, LessonDraft, AchievementBadge } from '../types';
import { calculateAchievements } from '../utils/achievements';

interface OnboardingModalProps {
  isOpen: boolean;
  initialProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose?: () => void;
  isEditing?: boolean;
  completedLessons?: number[];
  submissions?: Submission[];
  lessonDrafts?: Record<number, LessonDraft>;
  onSelectLesson?: (lessonId: number) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  initialProfile,
  onSave,
  onClose,
  isEditing = false,
  completedLessons = [],
  submissions = [],
  lessonDrafts = {},
  onSelectLesson,
}) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [activeTab, setActiveTab] = useState<'profile' | 'achievements'>('profile');
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  if (!isOpen) return null;

  const achievements = calculateAchievements(
    profile,
    completedLessons,
    submissions,
    lessonDrafts
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalBadges = achievements.length;
  const unlockPercentage = Math.round((unlockedCount / totalBadges) * 100);

  const filteredBadges = achievements.filter((badge) => {
    if (badgeFilter === 'unlocked') return badge.unlocked;
    if (badgeFilter === 'locked') return !badge.unlocked;
    return true;
  });

  const getBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const iconClass = `w-5 h-5 ${isUnlocked ? 'text-[#5A5A40]' : 'text-[#888877]'}`;
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className={iconClass} />;
      case 'Brush':
        return <Brush className={iconClass} />;
      case 'Award':
        return <Award className={iconClass} />;
      case 'Droplets':
        return <Droplets className={iconClass} />;
      case 'Palette':
        return <Palette className={iconClass} />;
      case 'Compass':
        return <Compass className={iconClass} />;
      case 'BookOpen':
        return <BookOpen className={iconClass} />;
      case 'Image':
        return <ImageIcon className={iconClass} />;
      case 'Crown':
        return <Crown className={iconClass} />;
      default:
        return <Trophy className={iconClass} />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...profile,
      isOnboarded: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-[#FAF7F2] border border-[#E9E3D5] rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Close Button if editing */}
        {isEditing && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-[#737365] hover:text-[#2C2C2C] hover:bg-[#E9E3D5]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-[#5A5A40] text-[#FDFBF7] mx-auto flex items-center justify-center mb-3 shadow-2xs">
            <Brush className="w-5 h-5" />
          </div>
          <h2 className="font-serif italic font-bold text-xl sm:text-2xl text-[#5A5A40]">
            {isEditing ? 'โปรไฟล์ผู้เรียน & เหรียญความสำเร็จ' : 'ยินดีต้อนรับสู่ห้องเรียนสีน้ำ'}
          </h2>
          <p className="text-xs sm:text-sm text-[#737365] mt-1 max-w-md mx-auto leading-relaxed">
            {isEditing
              ? 'จัดการข้อมูลผู้เรียน และตรวจสอบความสำเร็จที่คุณได้พิชิตในการฝึกฝน'
              : 'ก่อนเริ่มบทเรียน ครูขอถามคำถามสั้น ๆ 3 ข้อ เพื่อปรับความเร็วและคำแนะนำให้เหมาะกับคุณที่สุดครับ'}
          </p>
        </div>

        {/* Navigation Tabs (if editing or onboarded) */}
        {isEditing && (
          <div className="flex border-b border-[#E9E3D5] mb-5 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'border-[#5A5A40] text-[#5A5A40]'
                  : 'border-transparent text-[#737365] hover:text-[#2C2C2C]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>ข้อมูลผู้เรียน (Profile)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('achievements')}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'achievements'
                  ? 'border-[#5A5A40] text-[#5A5A40]'
                  : 'border-transparent text-[#737365] hover:text-[#2C2C2C]'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-[#D9A066]" />
              <span>เหรียญรางวัลความสำเร็จ ({unlockedCount}/{totalBadges})</span>
            </button>
          </div>
        )}

        {/* TAB 1: PROFILE EDIT FORM */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Quick Achievements Peek Banner (When editing) */}
            {isEditing && (
              <div
                onClick={() => setActiveTab('achievements')}
                className="bg-[#FFF] hover:bg-[#FAF7F2] border border-[#E9E3D5] hover:border-[#5A5A40]/40 rounded-2xl p-3.5 cursor-pointer transition-all shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E9E3D5] flex items-center justify-center text-[#D9A066]">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#2C2C2C] flex items-center gap-1.5">
                      <span>ปลดล็อกแล้ว {unlockedCount} จาก {totalBadges} เหรียญ</span>
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#5A5A40] border border-[#E9E3D5]">
                        {unlockPercentage}%
                      </span>
                    </div>
                    <div className="text-[11px] text-[#737365]">
                      {completedLessons.length >= 3 ? '🌟 ปลดล็อกเหรียญ 3 บทแรกแล้ว!' : '🎯 พิชิต 3 บทแรกเพื่อปลดล็อกเหรียญ Milestone'}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#5A5A40] flex items-center gap-1">
                  <span>ดูทั้งหมด</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            )}

            {/* Learner Name */}
            <div>
              <label className="block text-xs font-semibold text-[#5A5A40] mb-1.5 uppercase tracking-wider">
                ชื่อหรือชื่อเล่นของคุณ
              </label>
              <input
                id="input-user-name"
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="เช่น ต้นกล้า, ใบหม่อน, อาร์ท"
                className="w-full text-sm bg-[#FFF] border border-[#E9E3D5] rounded-xl px-3.5 py-2.5 text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40]"
              />
            </div>

            {/* Question 1: Experience & Supplies */}
            <div className="bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-[#5A5A40]">
                <span className="w-5 h-5 rounded-full bg-[#5A5A40] text-[#FDFBF7] flex items-center justify-center text-[11px]">
                  1
                </span>
                <span>เคยจับพู่กันมาก่อนไหม & มีอุปกรณ์อะไรอยู่แล้วบ้าง?</span>
              </div>

              <div>
                <label className="block text-[11px] text-[#737365] mb-1">ประสบการณ์วาดภาพ</label>
                <select
                  id="select-experience"
                  value={profile.priorExperience}
                  onChange={(e) => setProfile({ ...profile, priorExperience: e.target.value })}
                  className="w-full text-xs bg-[#FAF7F2] border border-[#E9E3D5] rounded-lg px-3 py-2 text-[#2C2C2C] focus:outline-none focus:border-[#5A5A40]"
                >
                  <option value="ไม่เคยจับพู่กันหรือวาดภาพมาก่อนเลย (มือใหม่ 100%)">
                    ไม่เคยจับพู่กันหรือวาดภาพมาก่อนเลย (มือใหม่ 100%)
                  </option>
                  <option value="เคยลองวาดเล่นนิดหน่อย นานมาแล้ว">เคยลองวาดเล่นนิดหน่อย นานมาแล้ว</option>
                  <option value="พอมีพื้นฐานวาดรูปทั่วไป แต่ยังไม่คล่องสีน้ำ">
                    พอมีพื้นฐานวาดรูปทั่วไป แต่ยังไม่คล่องสีน้ำ
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] text-[#737365] mb-1">ประเภทสีที่มี</label>
                  <input
                    type="text"
                    value={profile.supplies.paintType}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        supplies: { ...profile.supplies, paintType: e.target.value },
                      })
                    }
                    placeholder="เช่น สีน้ำก้อน 12 สี, สีหลอดเด็ก"
                    className="w-full text-xs bg-[#FAF7F2] border border-[#E9E3D5] rounded-lg px-3 py-2 text-[#2C2C2C]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#737365] mb-1">พู่กันและกระดาษ</label>
                  <input
                    type="text"
                    value={profile.supplies.paper}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        supplies: { ...profile.supplies, paper: e.target.value },
                      })
                    }
                    placeholder="เช่น พู่กันกลมเบอร์ 6, กระดาษ 200 แกรม"
                    className="w-full text-xs bg-[#FAF7F2] border border-[#E9E3D5] rounded-lg px-3 py-2 text-[#2C2C2C]"
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#5A5A40] bg-[#FAF7F2] border border-[#E9E3D5] rounded-lg p-2.5 leading-relaxed">
                💡 ไม่จำเป็นต้องมีของแพงนะครับ มีแค่สีน้ำเด็กหรือเซ็ตเริ่มต้นก็เรียนได้สบายมากครับ ครูพร้อมช่วยปรับคำแนะนำให้เหมาะกับสิ่งที่คุณมี
              </p>
            </div>

            {/* Question 2: Purpose & Motivation */}
            <div className="bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-[#5A5A40]">
                <span className="w-5 h-5 rounded-full bg-[#5A5A40] text-[#FDFBF7] flex items-center justify-center text-[11px]">
                  2
                </span>
                <span>อยากวาดเพื่ออะไรเป็นหลัก?</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'ผ่อนคลายและลดความเครียด', label: '🌿 ผ่อนคลาย / ลดเครียด' },
                  { id: 'เยียวยาจิตใจและสร้างพื้นที่ปลอดภัย', label: '🤍 เยียวยาใจ / ฟื้นฟูพลัง' },
                  { id: 'สร้างสรรค์ผลงาน / ตกแต่งห้อง', label: '🎨 สร้างสรรค์ผลงาน' },
                  { id: 'งานอดิเรกใหม่ในวันว่าง', label: '☕ งานอดิเรกเพลิดเพลิน' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setProfile({ ...profile, goal: opt.id })}
                    className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                      profile.goal === opt.id
                        ? 'bg-[#FAF7F2] border-[#5A5A40] text-[#5A5A40] ring-1 ring-[#5A5A40]/30 font-semibold'
                        : 'bg-[#FAF7F2]/60 border-[#E9E3D5] text-[#737365] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 3: Practice Time */}
            <div className="bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-[#5A5A40]">
                <span className="w-5 h-5 rounded-full bg-[#5A5A40] text-[#FDFBF7] flex items-center justify-center text-[11px]">
                  3
                </span>
                <span>มีเวลาฝึกต่อสัปดาห์ประมาณเท่าไร?</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'วันละ 15-20 นาที', label: 'วันละ 15-20 นาที' },
                  { id: '1-2 ชั่วโมงต่อสัปดาห์', label: '1-2 ชม./สัปดาห์' },
                  { id: '3-5 ชั่วโมงต่อสัปดาห์', label: '3-5 ชม./สัปดาห์' },
                ].map((timeOpt) => (
                  <button
                    key={timeOpt.id}
                    type="button"
                    onClick={() => setProfile({ ...profile, practiceTimePerWeek: timeOpt.id })}
                    className={`p-2 rounded-xl border text-center font-medium transition-all ${
                      profile.practiceTimePerWeek === timeOpt.id
                        ? 'bg-[#FAF7F2] border-[#5A5A40] text-[#5A5A40] ring-1 ring-[#5A5A40]/30 font-semibold'
                        : 'bg-[#FAF7F2]/60 border-[#E9E3D5] text-[#737365] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {timeOpt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              {isEditing && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-[#737365] hover:text-[#2C2C2C] rounded-xl hover:bg-[#E9E3D5]/50"
                >
                  ยกเลิก
                </button>
              )}
              <button
                id="btn-save-onboarding"
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#464632] rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isEditing ? 'บันทึกการเปลี่ยนแปลง' : 'พร้อมเริ่มต้นเรียนรู้กับครูสีน้ำ'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: ACHIEVEMENTS & MILESTONES SECTION */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            {/* Trophy Progress Overview Box */}
            <div className="bg-[#FFF] border border-[#E9E3D5] rounded-3xl p-5 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#E9E3D5] flex items-center justify-center text-[#D9A066] shadow-2xs">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif italic font-bold text-base text-[#5A5A40]">
                      ความสำเร็จและเหรียญรางวัล (Achievements)
                    </h3>
                    <p className="text-xs text-[#737365]">
                      ปลดล็อกแล้ว <strong className="text-[#2C2C2C]">{unlockedCount}</strong> จาก {totalBadges} เหรียญ ({unlockPercentage}%)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5A5A40] bg-[#FAF7F2] border border-[#E9E3D5] px-3 py-1 rounded-full">
                    <Sparkles className="w-3 h-3 text-[#D9A066]" />
                    <span>{completedLessons.length >= 8 ? 'สำเร็จครบหลักสูตร!' : completedLessons.length >= 3 ? 'ผ่าน 3 บทแรกแล้ว' : 'กำลังก้าวหน้าอย่างมั่นคง'}</span>
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-[#FAF7F2] border border-[#E9E3D5] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#5A5A40] to-[#D9A066] rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(unlockPercentage, 3)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setBadgeFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    badgeFilter === 'all'
                      ? 'bg-[#5A5A40] text-white shadow-2xs'
                      : 'bg-[#FFF] border border-[#E9E3D5] text-[#737365] hover:text-[#2C2C2C]'
                  }`}
                >
                  ทั้งหมด ({totalBadges})
                </button>
                <button
                  type="button"
                  onClick={() => setBadgeFilter('unlocked')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    badgeFilter === 'unlocked'
                      ? 'bg-[#5A5A40] text-white shadow-2xs'
                      : 'bg-[#FFF] border border-[#E9E3D5] text-[#737365] hover:text-[#2C2C2C]'
                  }`}
                >
                  ปลดล็อกแล้ว ({unlockedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setBadgeFilter('locked')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    badgeFilter === 'locked'
                      ? 'bg-[#5A5A40] text-white shadow-2xs'
                      : 'bg-[#FFF] border border-[#E9E3D5] text-[#737365] hover:text-[#2C2C2C]'
                  }`}
                >
                  ยังไม่ปลดล็อก ({totalBadges - unlockedCount})
                </button>
              </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[48vh] overflow-y-auto pr-1">
              {filteredBadges.map((badge) => {
                const isUnlocked = badge.unlocked;
                return (
                  <div
                    key={badge.id}
                    className={`rounded-2xl p-4 border transition-all relative overflow-hidden flex flex-col justify-between ${
                      isUnlocked
                        ? 'bg-[#FFF] border-[#E9E3D5] shadow-2xs hover:border-[#5A5A40]/40'
                        : 'bg-[#FAF7F2]/70 border-[#E9E3D5]/80 opacity-75'
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center transition-all ${
                          isUnlocked
                            ? 'bg-[#FAF7F2] border border-[#E9E3D5] shadow-2xs text-[#5A5A40]'
                            : 'bg-[#E9E3D5]/40 border border-[#E9E3D5] text-[#888877]'
                        }`}
                      >
                        {getBadgeIcon(badge.iconName, isUnlocked)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-serif italic font-bold text-xs text-[#2C2C2C] truncate">
                            {badge.title}
                          </h4>
                          {isUnlocked ? (
                            <span className="flex-shrink-0 inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#5A5A40] bg-[#FAF7F2] border border-[#E9E3D5] px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-2.5 h-2.5 text-[#5A5A40]" />
                              <span>สำเร็จ</span>
                            </span>
                          ) : (
                            <span className="flex-shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium text-[#737365] bg-[#E9E3D5]/50 px-2 py-0.5 rounded-full">
                              <Lock className="w-2.5 h-2.5 text-[#888877]" />
                              <span>ล็อก</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#737365] font-mono mt-0.5">
                          {badge.englishTitle}
                        </div>
                        <p className="text-xs text-[#737365] mt-1.5 leading-relaxed">
                          {badge.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Progress Bar for partial milestones */}
                    <div className="mt-3 pt-2.5 border-t border-[#E9E3D5]/70 flex items-center justify-between text-[10px] text-[#737365]">
                      <span>
                        ความคืบหน้า:{' '}
                        <strong className="text-[#2C2C2C]">
                          {badge.progress} / {badge.maxProgress}
                        </strong>
                      </span>
                      {!isUnlocked && badge.id === 'first_three_lessons' && onSelectLesson && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onClose) onClose();
                            onSelectLesson(0);
                          }}
                          className="text-[#5A5A40] hover:underline font-semibold flex items-center gap-0.5"
                        >
                          <span>ไปฝึกบทแรก</span>
                          <ChevronRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                      {!isUnlocked && badge.id === 'course_graduate' && (
                        <span className="text-[#D9A066] font-semibold">เป้าหมายสูงสุด 🎓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E9E3D5] text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="text-xs text-[#5A5A40] hover:underline font-semibold"
              >
                ← กลับไปแก้ไขข้อมูลผู้เรียน
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#464632] rounded-xl shadow-2xs transition-colors"
                >
                  ปิดหน้าต่าง
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
