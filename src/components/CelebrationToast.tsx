import React, { useEffect } from 'react';
import { Sparkles, Trophy, CheckCircle2, ChevronRight, PartyPopper, X } from 'lucide-react';
import { fireWatercolorConfetti } from '../utils/celebration';

interface CelebrationToastProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  lessonNumber: number;
  praise: string;
  onContinue?: () => void;
  isMilestone?: boolean;
}

export const CelebrationToast: React.FC<CelebrationToastProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  lessonNumber,
  praise,
  onContinue,
  isMilestone = false,
}) => {
  useEffect(() => {
    if (isOpen) {
      fireWatercolorConfetti(isMilestone);
    }
  }, [isOpen, isMilestone]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] animate-in slide-in-from-bottom-8 fade-in duration-300">
      <div className="bg-[#FFF] border-2 border-[#5A5A40]/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#D9A066]/15 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-[#5A5A40]/10 rounded-full blur-xl pointer-events-none" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-[#737365] hover:text-[#2C2C2C] hover:bg-[#FAF7F2] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5A5A40] to-[#464632] text-[#FDFBF7] flex-shrink-0 flex items-center justify-center shadow-md animate-bounce duration-1000">
            {isMilestone ? (
              <Trophy className="w-6 h-6 text-[#D9A066]" />
            ) : (
              <PartyPopper className="w-6 h-6 text-[#D9A066]" />
            )}
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#5A5A40] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#D9A066]" />
              <span>{isMilestone ? '🎉 ก้าวสำคัญ (Milestone Unlocked!)' : '✨ ยินดีด้วยครับ! ผ่านบทเรียนแล้ว'}</span>
            </div>

            <h4 className="font-serif italic font-bold text-sm text-[#2C2C2C] mt-0.5 truncate">
              {title}
            </h4>

            <p className="text-xs text-[#5A5A40] font-medium mt-1 line-clamp-2 leading-relaxed">
              "{praise}"
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fireWatercolorConfetti(isMilestone)}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-[#5A5A40] bg-[#FAF7F2] hover:bg-[#E9E3D5] border border-[#E9E3D5] rounded-xl transition-all flex items-center gap-1"
              >
                <span>ยิงพลุอีกครั้ง 🎊</span>
              </button>

              {onContinue && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onContinue();
                  }}
                  className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[#5A5A40] hover:bg-[#464632] rounded-xl transition-all shadow-2xs flex items-center gap-1"
                >
                  <span>ไปบทถัดไป</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
