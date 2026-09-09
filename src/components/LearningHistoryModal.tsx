import React, { useState, useRef } from 'react';
import {
  History,
  Clock,
  CheckCircle2,
  BookOpen,
  Calendar,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  ArrowRight,
  FileText,
  MessageSquare,
  X,
  AlertTriangle,
  Check,
  Award,
} from 'lucide-react';
import {
  UserProfile,
  Submission,
  LessonDraft,
  ActivityLogItem,
  LearningStateBackup,
} from '../types';
import { safeGetStorage } from '../utils/storage';
import { COURSE_LESSONS } from '../data/courseData';

interface LearningHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  currentLessonId: number;
  completedLessons: number[];
  submissions: Submission[];
  lessonDrafts: Record<number, LessonDraft>;
  activityLogs: ActivityLogItem[];
  lastSavedAt: number;
  onResumeLesson: (lessonId: number) => void;
  onRestoreBackup: (backup: LearningStateBackup) => void;
  onResetProgress: () => void;
}

export const LearningHistoryModal: React.FC<LearningHistoryModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  currentLessonId,
  completedLessons,
  submissions,
  lessonDrafts,
  activityLogs,
  lastSavedAt,
  onResumeLesson,
  onRestoreBackup,
  onResetProgress,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'backup'>('timeline');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentLesson = COURSE_LESSONS.find((l) => l.id === currentLessonId) || COURSE_LESSONS[0];
  const progressPercent = Math.round((completedLessons.length / COURSE_LESSONS.length) * 100);

  // Export JSON backup
  const handleExport = () => {
    const backup: LearningStateBackup = {
      version: '1.0',
      exportedAt: Date.now(),
      userProfile,
      currentLessonId,
      completedLessons,
      submissions,
      messages: safeGetStorage('watercolor_mentor_chat', []),
      lessonDrafts,
      activityLogs,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const dateStr = new Date().toISOString().slice(0, 10);
    const userName = userProfile.name ? `_${userProfile.name}` : '';
    downloadAnchor.setAttribute('download', `watercolor_mentor_backup${userName}_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON backup
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as LearningStateBackup;

        if (
          !parsed ||
          typeof parsed.currentLessonId !== 'number' ||
          !Array.isArray(parsed.completedLessons)
        ) {
          throw new Error('รูปแบบไฟล์สำรองไม่ถูกต้องหรือไม่สมบูรณ์');
        }

        onRestoreBackup(parsed);
        setImportSuccess(true);
        setImportError(null);
        setTimeout(() => {
          setImportSuccess(false);
          onClose();
        }, 1500);
      } catch (err: any) {
        setImportError(err.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์');
      }
    };
    reader.readAsText(file);
  };

  const draftsList: LessonDraft[] = (Object.values(lessonDrafts) as LessonDraft[]).filter(
    (d) => d && d.notes && d.notes.trim().length > 0
  );

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
        <div className="mb-5 pr-8">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5A5A40] bg-[#E9E3D5]/60 border border-[#E9E3D5] px-2.5 py-0.5 rounded-full mb-1">
            <History className="w-3.5 h-3.5" />
            <span>ระบบบันทึกประวัติการเรียนรู้ (Learning History & Resume)</span>
          </div>
          <h2 className="font-serif italic font-bold text-xl sm:text-2xl text-[#5A5A40]">
            ประวัติการเรียนรู้ของคุณ {userProfile.name || ''}
          </h2>
          <p className="text-xs text-[#737365] mt-1">
            ระบบบันทึกความคืบหน้า โน้ตส่วนตัว และการบ้านทุกอย่างให้อัตโนมัติ สามารถกลับมาเรียนต่อเมื่อไรก็ได้
          </p>
        </div>

        {/* Summary Banner & Resume CTA */}
        <div className="bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-4 sm:p-5 shadow-2xs mb-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5A5A40] animate-pulse" />
                <span className="text-xs text-[#737365] uppercase tracking-wider">บทเรียนล่าสุด:</span>
                <span className="font-serif italic font-bold text-sm text-[#2C2C2C]">
                  {currentLesson.thaiTitle.split('—')[0].trim()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#737365]">
                <Clock className="w-3 h-3 text-[#5A5A40]" />
                <span>
                  บันทึกล่าสุด:{' '}
                  {lastSavedAt
                    ? new Date(lastSavedAt).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) + ' น.'
                    : 'เมื่อสักครู่'}
                </span>
                <span>·</span>
                <span className="text-[#5A5A40] font-semibold">สำเร็จแล้ว {progressPercent}%</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onResumeLesson(currentLessonId);
                onClose();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5A5A40] hover:bg-[#464632] text-white text-xs font-semibold shadow-2xs transition-all hover:scale-[1.02]"
            >
              <span>กลับไปเรียนต่อจากจุดเดิม</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Stat Pill Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E9E3D5] text-xs">
            <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E9E3D5]/60 text-center">
              <div className="text-[10px] text-[#737365]">ผ่านแล้ว</div>
              <div className="font-serif font-bold text-sm text-[#5A5A40]">
                {completedLessons.length} / {COURSE_LESSONS.length} บท
              </div>
            </div>
            <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E9E3D5]/60 text-center">
              <div className="text-[10px] text-[#737365]">ผลงานที่ส่ง</div>
              <div className="font-serif font-bold text-sm text-[#5A5A40]">
                {submissions.length} ชิ้น
              </div>
            </div>
            <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E9E3D5]/60 text-center">
              <div className="text-[10px] text-[#737365]">โน้ตที่จดไว้</div>
              <div className="font-serif font-bold text-sm text-[#5A5A40]">
                {draftsList.length} บท
              </div>
            </div>
            <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E9E3D5]/60 text-center">
              <div className="text-[10px] text-[#737365]">สถานะบันทึก</div>
              <div className="font-serif font-bold text-sm text-[#5A5A40] flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span>Auto-saved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E9E3D5] mb-4 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-[#5A5A40] text-[#5A5A40]'
                : 'border-transparent text-[#737365] hover:text-[#2C2C2C]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>ไทม์ไลน์กิจกรรม ({activityLogs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'border-[#5A5A40] text-[#5A5A40]'
                : 'border-transparent text-[#737365] hover:text-[#2C2C2C]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>บันทึกย่อประจำบท ({draftsList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-[#5A5A40] text-[#5A5A40]'
                : 'border-transparent text-[#737365] hover:text-[#2C2C2C]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>สำรอง / กู้คืนข้อมูล</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto min-h-[220px]">
          {/* TAB 1: Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              {activityLogs.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#737365] bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-6">
                  <Clock className="w-8 h-8 mx-auto text-[#737365]/40 mb-2" />
                  <p>เริ่มบันทึกกิจกรรมเมื่อคุณเปิดบทเรียนหรือส่งการบ้าน</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-3 border-l-2 border-[#E9E3D5] ml-3 my-2">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="relative group">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#5A5A40] ring-4 ring-[#FAF7F2]" />
                      <div className="bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-3.5 shadow-2xs hover:border-[#5A5A40]/40 transition-colors">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-[#5A5A40]">{log.title}</span>
                          <span className="text-[#737365] font-mono">
                            {new Date(log.timestamp).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'short',
                            })}{' '}
                            {new Date(log.timestamp).toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {log.detail && (
                          <p className="text-xs text-[#2C2C2C] leading-relaxed mt-0.5">
                            {log.detail}
                          </p>
                        )}
                        {typeof log.lessonId === 'number' && (
                          <button
                            type="button"
                            onClick={() => {
                              onResumeLesson(log.lessonId!);
                              onClose();
                            }}
                            className="mt-2 text-[10px] text-[#D9A066] hover:text-[#C2874C] font-semibold flex items-center gap-1"
                          >
                            <span>เปิดดูบทที่ {log.lessonId}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Notes & Drafts */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              {draftsList.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#737365] bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-6 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-[#737365]/40" />
                  <p className="font-medium text-[#2C2C2C]">ยังไม่มีบันทึกย่อประจำบท</p>
                  <p className="text-[11px] text-[#737365] max-w-sm mx-auto">
                    คุณสามารถพิมพ์จดบันทึกความรู้สึก เทคนิคที่เพิ่งค้นพบ หรือสิ่งที่อยากลองในช่อง "สมุดบันทึกส่วนตัว" ของแต่ละบทเรียนได้ตลอดเวลา
                  </p>
                </div>
              ) : (
                draftsList.map((draft) => {
                  const lesson = COURSE_LESSONS.find((l) => Number(l.id) === Number(draft.lessonId));
                  return (
                    <div
                      key={draft.lessonId}
                      className="bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-4 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#5A5A40] text-white flex items-center justify-center text-[10px] font-bold">
                            {draft.lessonId}
                          </span>
                          <span className="font-semibold text-[#2C2C2C]">
                            {lesson?.thaiTitle || `บทที่ ${draft.lessonId}`}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#737365] font-mono">
                          แก้ไขเมื่อ{' '}
                          {new Date(draft.lastUpdated).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E9E3D5] text-xs text-[#2C2C2C] whitespace-pre-wrap leading-relaxed">
                        {draft.notes}
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            onResumeLesson(draft.lessonId);
                            onClose();
                          }}
                          className="text-xs text-[#5A5A40] hover:underline font-semibold flex items-center gap-1"
                        >
                          <span>ไปที่บทเรียนนี้</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: Backup & Restore */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* Export Box */}
              <div className="bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#5A5A40] uppercase tracking-wider">
                  <Download className="w-4 h-4 text-[#5A5A40]" />
                  <span>ส่งออกข้อมูลสำรอง (Export Backup)</span>
                </div>
                <p className="text-xs text-[#737365] leading-relaxed">
                  ดาวน์โหลดข้อมูลการเรียนทั้งหมด (โปรไฟล์ผู้เรียน, ประวัติบทที่เรียนจบ, รูปการบ้าน, บันทึกย่อ และประวัติแชต) เป็นไฟล์ <code>.json</code> สำหรับเก็บไว้เป็นความทรงจำ หรือนำไปเปิดต่อในเครื่องอื่น
                </p>
                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#464632] text-white text-xs font-semibold shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดไฟล์สำรองข้อมูล (.json)</span>
                </button>
              </div>

              {/* Import Box */}
              <div className="bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#5A5A40] uppercase tracking-wider">
                  <Upload className="w-4 h-4 text-[#5A5A40]" />
                  <span>กู้คืนข้อมูลจากการสำรอง (Restore from Backup)</span>
                </div>
                <p className="text-xs text-[#737365] leading-relaxed">
                  เลือกไฟล์ <code>.json</code> ที่เคยส่งออกไว้ เพื่อกู้คืนสถานะการเรียนและประวัติการฝึกฝนกลับมาทั้งหมดทันที
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileImport}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#E9E3D5]/70 text-[#2C2C2C] border border-[#E9E3D5] text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#5A5A40]" />
                    <span>เลือกไฟล์ .json เพื่อกู้คืน</span>
                  </button>

                  {importSuccess && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#5A5A40] font-semibold bg-[#E9F5DB] px-3 py-1.5 rounded-xl border border-[#5A5A40]/30">
                      <Check className="w-3.5 h-3.5" />
                      กู้คืนข้อมูลสำเร็จแล้ว!
                    </span>
                  )}
                </div>

                {importError && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    ❌ {importError}
                  </p>
                )}
              </div>

              {/* Reset Box */}
              <div className="bg-[#FAF7F2] border border-[#E9E3D5] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#2C2C2C] block">
                      ต้องการเริ่มเรียนใหม่ตั้งแต่ต้น?
                    </span>
                    <span className="text-[11px] text-[#737365]">
                      ล้างประวัติการเรียนและเริ่มตั้งค่าใหม่ทั้งหมด (แนะนำให้ส่งออกข้อมูลเก็บไว้ก่อน)
                    </span>
                  </div>
                  {!showResetConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
                    >
                      เริ่มใหม่
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onResetProgress();
                          setShowResetConfirm(false);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                      >
                        ยืนยันล้างข้อมูล
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="px-2.5 py-1.5 rounded-xl text-xs text-[#737365] hover:bg-[#E9E3D5]/50"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-[#E9E3D5] flex items-center justify-between text-xs text-[#737365]">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#5A5A40]" />
            <span>ข้อมูลจะถูกบันทึกในเบราว์เซอร์ของคุณตลอดไป</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#464632] rounded-xl shadow-2xs transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
