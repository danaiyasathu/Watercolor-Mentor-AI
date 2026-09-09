import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Camera,
  MessageSquare,
  ArrowRight,
  Info,
  Check,
  Award,
  FileEdit,
  Save,
  Clock,
} from 'lucide-react';
import { Lesson, Submission } from '../types';

interface LessonDetailProps {
  lesson: Lesson;
  isCompleted: boolean;
  latestSubmission?: Submission;
  draftNotes: string;
  onSaveNotes: (notes: string) => void;
  onSubmitHomework: () => void;
  onOpenChat: () => void;
  onNextLesson?: () => void;
  hasNextLesson: boolean;
}

export const LessonDetail: React.FC<LessonDetailProps> = ({
  lesson,
  isCompleted,
  latestSubmission,
  draftNotes,
  onSaveNotes,
  onSubmitHomework,
  onOpenChat,
  onNextLesson,
  hasNextLesson,
}) => {
  const [localNotes, setLocalNotes] = useState(draftNotes);
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    setLocalNotes(draftNotes);
  }, [draftNotes, lesson.id]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalNotes(val);
    setIsSaved(false);
    onSaveNotes(val);
    setTimeout(() => setIsSaved(true), 600);
  };
  return (
    <div id="lesson-detail-container" className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Lesson Header Banner */}
      <div className="bg-[#FFF] border border-[#E9E3D5] rounded-3xl p-6 sm:p-8 shadow-2xs relative overflow-hidden">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#FFE8D6] text-[#D9A066] border border-[#D9A066]/30">
              {lesson.title.split('—')[0].trim()}
            </span>
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#E9F5DB] text-[#5A5A40] border border-[#5A5A40]/30">
                <CheckCircle className="w-3.5 h-3.5" />
                ผ่านการประเมินแล้ว
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#FAF7F2] text-[#737365] border border-[#E9E3D5]">
                รอส่งการบ้าน
              </span>
            )}
          </div>

          <h2 className="font-serif italic font-bold text-2xl sm:text-3xl text-[#5A5A40] leading-tight">
            {lesson.thaiTitle}
          </h2>

          <p className="text-sm text-[#737365] leading-relaxed max-w-2xl">
            {lesson.objective}
          </p>
        </div>
      </div>

      {/* Passed Checkpoint Summary (if completed) */}
      {isCompleted && (
        latestSubmission ? (
          <div className="bg-[#FAF7F2] border border-[#5A5A40]/30 rounded-3xl p-5 sm:p-6 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[#5A5A40] font-serif italic font-bold text-sm">
                <Award className="w-4 h-4 text-[#5A5A40]" />
                <span>บันทึกการผ่านบทเรียนนี้จากครูสอนสีน้ำ</span>
              </div>
              <span className="text-[11px] font-mono text-[#737365]">
                {new Date(latestSubmission.createdAt).toLocaleDateString('th-TH')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {(() => {
                const rawImgs =
                  latestSubmission.imageUrls && latestSubmission.imageUrls.length > 0
                    ? latestSubmission.imageUrls
                    : latestSubmission.imageUrl
                    ? [latestSubmission.imageUrl]
                    : [];
                const imgs = rawImgs.filter(
                  (u): u is string => typeof u === 'string' && u.trim().length > 0
                );

                if (imgs.length === 0) return null;

                if (imgs.length === 1) {
                  return (
                    <div className="rounded-2xl overflow-hidden border border-[#E9E3D5] bg-white aspect-4/3 flex items-center justify-center shadow-2xs">
                      <img
                        src={imgs[0]}
                        alt="Artwork submitted"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                }

                return (
                  <div className="rounded-2xl overflow-hidden border border-[#E9E3D5] bg-white p-2.5 shadow-2xs space-y-1.5">
                    <div className="text-[10px] text-[#737365] font-medium px-1 flex items-center justify-between">
                      <span>ภาพผลงานที่ส่งตรวจ</span>
                      <span className="text-[#5A5A40] font-semibold">{imgs.length} ภาพ</span>
                    </div>
                    <div className={`grid gap-1.5 ${imgs.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      {imgs.map((im, idx) => (
                        <div
                          key={idx}
                          className="aspect-square rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#E9E3D5]/70 relative group"
                        >
                          <img
                            src={im}
                            alt={`Artwork piece ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div
                className={`${
                  (latestSubmission.imageUrls?.some((u) => typeof u === 'string' && u.trim().length > 0) ||
                   (typeof latestSubmission.imageUrl === 'string' && latestSubmission.imageUrl.trim().length > 0))
                    ? 'md:col-span-2'
                    : 'md:col-span-3'
                } space-y-2 text-xs text-[#2C2C2C]`}
              >
                <div className="bg-white rounded-2xl p-3.5 border border-[#E9E3D5] shadow-2xs">
                  <div className="font-semibold text-[#5A5A40] mb-1">🌟 สิ่งที่ทำได้ดี:</div>
                  <p className="leading-relaxed text-[#737365]">{latestSubmission.evaluation.praise}</p>
                </div>

                {latestSubmission.evaluation.improvementPoints?.length > 0 && (
                  <div className="bg-white rounded-2xl p-3.5 border border-[#E9E3D5] shadow-2xs">
                    <div className="font-semibold text-[#5A5A40] mb-1">💡 จุดพัฒนาต่อเนื่อง:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-[#737365]">
                      {latestSubmission.evaluation.improvementPoints.map((pt, idx) => (
                        <li key={idx}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestSubmission.evaluation.nextStepsOrRetryPlan && (
                  <div className="bg-[#FAF7F2] rounded-2xl p-3 border border-[#E9E3D5] text-[11px] text-[#5A5A40] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D9A066] flex-shrink-0" />
                    <span className="leading-relaxed">{latestSubmission.evaluation.nextStepsOrRetryPlan}</span>
                  </div>
                )}
              </div>
            </div>

            {hasNextLesson && onNextLesson && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onNextLesson}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5A5A40] hover:bg-[#464632] text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                >
                  <span>ไปเรียนบทถัดไป</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#FAF7F2] border border-[#5A5A40]/30 rounded-3xl p-5 sm:p-6 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-[#5A5A40] font-serif italic font-bold text-sm">
              <Award className="w-4 h-4 text-[#5A5A40]" />
              <span>คุณได้ผ่านบทเรียนนี้แล้ว 🎉</span>
            </div>
            <p className="text-xs text-[#737365] leading-relaxed">
              บทเรียนนี้บันทึกว่าผ่านการประเมินแล้ว คุณสามารถส่งภาพผลงานชิ้นใหม่เข้ามาเพื่อให้ครูประเมินเพิ่มเติม หรือกดไปเรียนบทถัดไปได้เลยครับ
            </p>
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={onSubmitHomework}
                className="px-4 py-2 bg-white border border-[#5A5A40]/40 hover:border-[#5A5A40] rounded-xl text-xs text-[#5A5A40] font-semibold transition-colors"
              >
                อัปโหลดภาพเพื่อบันทึกการประเมิน
              </button>
              {hasNextLesson && onNextLesson && (
                <button
                  type="button"
                  onClick={onNextLesson}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5A5A40] hover:bg-[#464632] text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                >
                  <span>ไปเรียนบทถัดไป</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )
      )}

      {/* Technical Concepts Cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <BookOpen className="w-4 h-4 text-[#5A5A40]" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#737365]">
            เนื้อหาและเทคนิคสำคัญประจำบท
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {lesson.concepts.map((concept, idx) => (
            <div
              key={idx}
              className="bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-4 sm:p-5 space-y-2.5 hover:border-[#5A5A40]/40 transition-colors shadow-2xs"
            >
              <h4 className="font-semibold text-xs text-[#2C2C2C] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5A5A40]" />
                <span>{concept.title}</span>
              </h4>
              <p className="text-xs text-[#737365] leading-relaxed">
                {concept.description}
              </p>
              {concept.techniqueTip && (
                <div className="bg-[#FAF7F2] border border-[#E9E3D5] rounded-xl p-2.5 text-[11px] text-[#5A5A40] leading-relaxed flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#D9A066] flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>เคล็ดลับจากครู:</strong> {concept.techniqueTip}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Homework Assignment Card (The Checkpoint) */}
      <div className="bg-[#FFF] border-2 border-dashed border-[#5A5A40]/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#D9A066] bg-[#FFE8D6] px-2.5 py-0.5 rounded-full border border-[#D9A066]/30">
              <Camera className="w-3 h-3" />
              <span>การบ้านประจำบท (Checkpoint Assignment)</span>
            </div>
            <h3 className="font-serif italic font-bold text-xl sm:text-2xl text-[#5A5A40]">
              {lesson.homework.title}
            </h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#2C2C2C] leading-relaxed bg-[#FAF7F2] border border-[#E9E3D5] rounded-2xl p-4">
          {lesson.homework.instruction}
        </p>

        {/* Deliverable & Evaluation Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          <div className="bg-[#FAF7F2] border border-[#E9E3D5] rounded-2xl p-4 space-y-2">
            <div className="font-semibold text-[#5A5A40] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#888877]" />
              <span>สิ่งที่ต้องส่งให้คุณครู:</span>
            </div>
            <p className="text-[#737365] leading-relaxed pl-5">
              {lesson.homework.deliverable}
            </p>
          </div>

          <div className="bg-[#FAF7F2] border border-[#E9E3D5] rounded-2xl p-4 space-y-2">
            <div className="font-semibold text-[#5A5A40] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>เกณฑ์การประเมิน (เน้นความเข้าใจ ไม่เน้นความเป๊ะ):</span>
            </div>
            <ul className="space-y-1 pl-5 text-[#737365]">
              {lesson.homework.evaluationChecklist.map((item, idx) => (
                <li key={idx} className="list-disc">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {lesson.homework.easierAlternative && (
          <p className="text-[11px] text-[#737365] bg-[#FAF7F2] border border-[#E9E3D5] rounded-xl p-3">
            🌱 <strong>โจทย์ทางเลือกหากรู้สึกยาก:</strong> {lesson.homework.easierAlternative}
          </p>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            id="btn-submit-homework-cta"
            type="button"
            onClick={onSubmitHomework}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#5A5A40] hover:bg-[#464632] text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all hover:scale-[1.01]"
          >
            <Camera className="w-4 h-4" />
            <span>{isCompleted ? 'ส่งผลงานชิ้นใหม่เพื่อตรวจซ้ำ' : 'อัปโหลดภาพผลงานส่งคุณครู'}</span>
          </button>

          <button
            id="btn-open-chat-cta"
            type="button"
            onClick={onOpenChat}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#FAF7F2] hover:bg-[#E9E3D5]/70 text-[#2C2C2C] border border-[#E9E3D5] text-xs sm:text-sm font-medium transition-colors shadow-2xs"
          >
            <MessageSquare className="w-4 h-4 text-[#5A5A40]" />
            <span>ถามข้อสงสัยกับครู</span>
          </button>
        </div>
      </div>

      {/* Personal Lesson Scratchpad & Notes Draft */}
      <div className="bg-[#FFF] border border-[#E9E3D5] rounded-3xl p-5 sm:p-6 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileEdit className="w-4 h-4 text-[#5A5A40]" />
            <h3 className="font-serif italic font-bold text-sm text-[#5A5A40]">
              สมุดบันทึกส่วนตัวประจำบท (Personal Notes)
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#737365]">
            <Clock className="w-3 h-3 text-[#5A5A40]" />
            <span>{isSaved ? 'บันทึกอัตโนมัติแล้ว' : 'กำลังบันทึก...'}</span>
          </div>
        </div>

        <p className="text-xs text-[#737365]">
          บันทึกความรู้สึก เทคนิคที่ได้ค้นพบ หรือคำถามที่ยังค้างคาใจ ข้อมูลจะถูกจัดเก็บไว้ตลอด แม้เรียนไม่เสร็จในครั้งเดียว
        </p>

        <textarea
          id={`lesson-notes-${lesson.id}`}
          rows={3}
          value={localNotes}
          onChange={handleNotesChange}
          placeholder="พิมพ์บันทึกการฝึกฝนของคุณที่นี่ เช่น 'ผสมสีเหลืองกับแดงได้ส้มอบอุ่นพอดี แต่ตอนแรกใส่น้ำเยอะไปหน่อย...'"
          className="w-full text-xs bg-[#FAF7F2] border border-[#E9E3D5] rounded-2xl p-3.5 text-[#2C2C2C] placeholder-[#888877] focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] transition-colors leading-relaxed"
        />
      </div>

      {/* Gentle Tips */}
      <div className="bg-[#FAF7F2] border border-[#E9E3D5] rounded-2xl p-4 text-xs text-[#737365] flex items-start gap-3 shadow-2xs">
        <span className="text-base">☕</span>
        <div className="space-y-1">
          <span className="font-semibold text-[#5A5A40]">คำแนะนำอบอุ่นจากครู:</span>
          {lesson.tips.map((tip, i) => (
            <p key={i} className="leading-relaxed">
              "{tip}"
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

