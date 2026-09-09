import React from 'react';
import { X, Award, Sparkles, Image as ImageIcon, Calendar, CheckCircle2, Download } from 'lucide-react';
import { Submission, UserProfile } from '../types';
import { COURSE_LESSONS } from '../data/courseData';

interface ArtworkGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: Submission[];
  userProfile: UserProfile;
  completedCount: number;
}

export const ArtworkGallery: React.FC<ArtworkGalleryProps> = ({
  isOpen,
  onClose,
  submissions,
  userProfile,
  completedCount,
}) => {
  if (!isOpen) return null;

  const isGraduated = completedCount === COURSE_LESSONS.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-[#FAF7F2] border border-[#E9E3D5] rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#737365] hover:text-[#2C2C2C] hover:bg-[#E9E3D5]/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 pr-8">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5A5A40] bg-[#E9E3D5]/60 border border-[#E9E3D5] px-2.5 py-0.5 rounded-full mb-1">
            <ImageIcon className="w-3 h-3" />
            <span>พอร์ตโฟลิโอส่วนตัว (Personal Portfolio)</span>
          </div>
          <h2 className="font-serif italic font-bold text-2xl text-[#5A5A40]">
            แกลเลอรีผลงานสีน้ำของ {userProfile.name || 'คุณ'}
          </h2>
          <p className="text-xs text-[#737365] mt-0.5">
            รวบรวมทุกผลงานที่คุณได้ลงมือฝึกฝนและผ่านการประเมินจากครูสอนสีน้ำ
          </p>
        </div>

        {/* Graduation Certificate Banner (if completed all lessons) */}
        {isGraduated && (
          <div className="mb-6 bg-[#FFF] border-2 border-[#5A5A40] rounded-3xl p-6 text-center space-y-3 shadow-md relative overflow-hidden">
            <Award className="w-12 h-12 mx-auto text-[#5A5A40] animate-bounce" />
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#5A5A40]">
                ใบประกาศนียบัตรสำเร็จหลักสูตร
              </span>
              <h3 className="font-serif italic font-bold text-2xl text-[#2C2C2C]">
                ยินดีด้วยอย่างยิ่ง แด่คุณ {userProfile.name || 'ผู้เรียนคนเก่ง'}
              </h3>
              <p className="text-xs text-[#737365] max-w-lg mx-auto leading-relaxed">
                ได้สำเร็จหลักสูตร "สีน้ำสำหรับผู้เริ่มต้น (Watercolor Mentor)" ครบทั้ง 8 บทเรียน
                คุณได้สร้างพื้นที่แห่งความสงบ จินตนาการ และทักษะสีน้ำที่จะอยู่เคียงข้างคุณเสมอ
              </p>
            </div>
            <div className="text-[11px] font-mono text-[#737365] pt-1">
              ออกให้ ณ วันที่ {new Date().toLocaleDateString('th-TH')} โดย ครูสอนสีน้ำ AI
            </div>
          </div>
        )}

        {/* Submissions Grid */}
        {submissions.length === 0 ? (
          <div className="bg-[#FFF] border border-[#E9E3D5] rounded-3xl p-12 text-center text-[#737365] space-y-3">
            <ImageIcon className="w-12 h-12 mx-auto text-[#737365]/40" />
            <p className="text-sm font-medium text-[#2C2C2C]">ยังไม่มีผลงานที่ผ่านการตรวจ</p>
            <p className="text-xs text-[#737365] max-w-xs mx-auto">
              เมื่อคุณอัปโหลดภาพผลงานและผ่านการประเมินจากคุณครู ผลงานจะถูกจัดแสดงในแกลเลอรีนี้
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submissions.map((sub) => {
              const lesson = COURSE_LESSONS.find((l) => Number(l.id) === Number(sub.lessonId));
              return (
                <div
                  key={sub.id}
                  className="bg-[#FFF] border border-[#E9E3D5] rounded-2xl overflow-hidden shadow-2xs hover:border-[#5A5A40] transition-colors flex flex-col"
                >
                  {/* Artwork Image */}
                  {(() => {
                    const rawImgs =
                      sub.imageUrls && sub.imageUrls.length > 0
                        ? sub.imageUrls
                        : sub.imageUrl
                        ? [sub.imageUrl]
                        : [];
                    const imgs = rawImgs.filter(
                      (u): u is string => typeof u === 'string' && u.trim().length > 0
                    );

                    if (imgs.length === 0) {
                      return (
                        <div className="aspect-16/10 bg-[#FAF7F2] flex items-center justify-center p-4 border-b border-[#E9E3D5] text-center">
                          <div className="flex flex-col items-center gap-1.5 text-[#737365]">
                            <ImageIcon className="w-6 h-6 text-[#5A5A40]/40" />
                            <span className="text-xs font-medium">บันทึกผลงานบทเรียน</span>
                            <span className="text-[10px] text-[#737365]/80">
                              {lesson?.thaiTitle.split('—')[0].trim()}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (imgs.length === 1) {
                      return (
                        <div className="aspect-16/10 bg-[#FAF7F2] overflow-hidden relative group">
                          <img
                            src={imgs[0]}
                            alt={lesson?.thaiTitle || 'Artwork'}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#2C2C2C]/80 text-[#FDFBF7] backdrop-blur-xs">
                            {lesson?.thaiTitle.split('—')[0].trim()}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="bg-[#FAF7F2] relative">
                        <div className="grid grid-cols-2 gap-1 p-1">
                          {imgs.map((im, i) => (
                            <div key={i} className="aspect-4/3 relative overflow-hidden rounded-lg">
                              <img
                                src={im}
                                alt={`Work ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-1 left-1 bg-[#2C2C2C]/80 text-white text-[9px] px-1 py-0.5 rounded backdrop-blur-xs font-medium">
                                ชิ้นงานที่ {i + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#2C2C2C]/80 text-[#FDFBF7] backdrop-blur-xs">
                          {lesson?.thaiTitle.split('—')[0].trim()} ({imgs.length} ชิ้นงาน)
                        </div>
                      </div>
                    );
                  })()}

                  {/* Artwork Info */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-xs text-[#2C2C2C]">
                        {lesson?.thaiTitle}
                      </h4>
                      <p className="text-[11px] text-[#2C2C2C] mt-1 bg-[#FAF7F2] border border-[#E9E3D5] rounded-lg p-2 leading-relaxed">
                        🌟 <strong>คำชมจากครู:</strong> {sub.evaluation.praise}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#E9E3D5] flex items-center justify-between text-[10px] text-[#737365]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(sub.createdAt).toLocaleDateString('th-TH')}</span>
                      </span>
                      <span className="flex items-center gap-1 text-[#5A5A40] font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ผ่านการประเมิน</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-[#E9E3D5] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#464632] rounded-xl shadow-2xs"
          >
            ปิดหน้าต่างแกลเลอรี
          </button>
        </div>
      </div>
    </div>
  );
};
