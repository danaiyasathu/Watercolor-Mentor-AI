import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Sparkles,
  RotateCcw,
  Loader2,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Award,
  Zap,
  Plus,
  Trash2,
  Eye,
} from 'lucide-react';
import { Lesson, CheckpointEvaluation, UserProfile } from '../types';
import { getSampleArtworkDataUrl } from '../data/sampleArtworks';
import { playPassSound, playZenBell } from '../utils/audio';
import { fireWatercolorConfetti } from '../utils/celebration';
import { compressImageForEvaluation } from '../utils/imageCompressor';
import { safeApiPost } from '../utils/apiClient';

interface ArtworkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson;
  userProfile: UserProfile;
  onEvaluationComplete: (
    evaluation: CheckpointEvaluation,
    imageUrl: string,
    notes: string,
    imageUrls?: string[]
  ) => void;
  onNextLesson?: () => void;
}

export const ArtworkUploadModal: React.FC<ArtworkUploadModalProps> = ({
  isOpen,
  onClose,
  lesson,
  userProfile,
  onEvaluationComplete,
  onNextLesson,
}) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [previewingIndex, setPreviewingIndex] = useState<number | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [evalProgressStep, setEvalProgressStep] = useState(0);
  const [evaluationResult, setEvaluationResult] = useState<CheckpointEvaluation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rotate helpful progress status text while evaluating
  useEffect(() => {
    let timer: any;
    if (isEvaluating) {
      setEvalProgressStep(0);
      timer = setInterval(() => {
        setEvalProgressStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 900);
    } else {
      setEvalProgressStep(0);
    }
    return () => clearInterval(timer);
  }, [isEvaluating]);

  if (!isOpen) return null;

  const EVAL_STATUS_MESSAGES = [
    'กำลังเตรียมความละเอียดภาพให้เหมาะสม...',
    'ส่งภาพผลงานไปยังห้องตรวจสีน้ำของคุณครู...',
    'คุณครูกำลังตรวจเทคนิคการคุมน้ำและรอยพู่กันในทุกชิ้นงาน...',
    'กำลังสรุปคำแนะนำและข้อเสนอแนะ...',
  ];

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    try {
      setIsCompressing(true);
      setErrorMessage(null);

      // Compress all images in parallel (max 1200px and ~150KB for fast analysis)
      const compressedList = await Promise.all(
        fileArray.map((file) => compressImageForEvaluation(file, 1200, 1200, 0.82))
      );

      setSelectedImages((prev) => {
        const combined = [...prev, ...compressedList];
        // Allow up to 6 images per submission
        return combined.slice(0, 6);
      });
      setEvaluationResult(null);
    } catch (err) {
      console.warn('Image compression fallback:', err);
      // Fallback: read directly via FileReader
      const readPromises = fileArray.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          })
      );
      const results = await Promise.all(readPromises);
      const validResults = results.filter(Boolean);
      setSelectedImages((prev) => [...prev, ...validResults].slice(0, 6));
      setEvaluationResult(null);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset input value so re-selecting same file works
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    if (previewingIndex === index) {
      setPreviewingIndex(null);
    }
  };

  const handleSelectSample = async () => {
    const sampleKeys: Record<number, any> = {
      0: 'flat_wash',
      1: 'flat_wash',
      2: 'wet_on_wet',
      3: 'shapes',
      4: 'color_wheel',
      5: 'landscape',
      6: 'composition',
      7: 'capstone',
    };
    const sampleKey = sampleKeys[lesson.id] || 'flat_wash';
    const sampleUrl1 = getSampleArtworkDataUrl(sampleKey);
    
    // For lesson 1 or 2, add a second sample exercise if applicable
    let sampleUrl2 = '';
    if (lesson.id === 1) {
      sampleUrl2 = getSampleArtworkDataUrl('graded_wash');
    }

    const rawSamples = sampleUrl2 ? [sampleUrl1, sampleUrl2] : [sampleUrl1];
    
    try {
      setIsCompressing(true);
      const convertedSamples = await Promise.all(
        rawSamples.map((s) => compressImageForEvaluation(s, 1200, 1200, 0.85))
      );
      setSelectedImages(convertedSamples);
    } catch {
      setSelectedImages(rawSamples);
    } finally {
      setIsCompressing(false);
    }

    setUserNotes(`ผมฝึกวาดตามโจทย์ของบทที่ ${lesson.id} แล้วครับ ใช้พู่กันและสีที่มีครับ`);
    setEvaluationResult(null);
    setErrorMessage(null);
  };

  const handleSubmitEvaluation = async () => {
    if (selectedImages.length === 0) {
      setErrorMessage('กรุณาเลือกหรืออัปโหลดภาพผลงานอย่างน้อย 1 ภาพก่อนส่งตรวจครับ');
      return;
    }

    setIsEvaluating(true);
    setErrorMessage(null);

    try {
      // Ensure all images are converted to standard JPEG base64
      const processedImages = await Promise.all(
        selectedImages.map(async (img) => {
          try {
            return await compressImageForEvaluation(img, 1200, 1200, 0.82);
          } catch {
            return img;
          }
        })
      );

      const data = await safeApiPost<{ evaluation: CheckpointEvaluation }>('/api/evaluate', {
        images: processedImages,
        imageBase64: processedImages[0],
        lessonId: lesson.id,
        lessonTitle: lesson.thaiTitle,
        userNotes,
        userProfile,
      });

      const evaluation: CheckpointEvaluation = {
        ...data.evaluation,
        lessonId: Number(lesson.id),
        imageUrl: processedImages[0],
        imageUrls: processedImages,
      };

      setEvaluationResult(evaluation);

      if (evaluation.passed) {
        playPassSound();
        const isGraduation = lesson.id === 7;
        fireWatercolorConfetti(isGraduation);
      } else {
        playZenBell(392, 1.2);
      }

      onEvaluationComplete(evaluation, processedImages[0], userNotes, processedImages);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'ไม่สามารถส่งตรวจผลงานได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setSelectedImages([]);
    setUserNotes('');
    setEvaluationResult(null);
    setErrorMessage(null);
    setPreviewingIndex(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-[#FAF7F2] border border-[#E9E3D5] rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-7 relative animate-in fade-in zoom-in-95 duration-200">
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
            <Camera className="w-3 h-3" />
            <span>จุดตรวจผลงาน (Checkpoint Protocol)</span>
          </div>
          <h2 className="font-serif italic font-bold text-xl text-[#5A5A40]">
            ส่งผลงานการบ้าน: {lesson.thaiTitle.split('—')[0].trim()}
          </h2>
          <p className="text-xs text-[#737365] mt-0.5">
            {lesson.homework.deliverable}
          </p>
        </div>

        {/* Evaluation Result View (If already evaluated) */}
        {evaluationResult ? (
          <div className="space-y-4">
            {/* Result Header Banner */}
            <div
              className={`p-5 rounded-2xl border ${
                evaluationResult.passed
                  ? 'bg-[#5A5A40]/10 border-[#5A5A40]/30 text-[#2C2C2C]'
                  : 'bg-[#D9A066]/10 border-[#D9A066]/40 text-[#2C2C2C]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    evaluationResult.passed
                      ? 'bg-[#5A5A40] text-white'
                      : 'bg-[#D9A066] text-white'
                  }`}
                >
                  {evaluationResult.passed ? (
                    <Award className="w-6 h-6" />
                  ) : (
                    <RotateCcw className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#5A5A40]">
                    {evaluationResult.passed ? '✅ ผ่านบทเรียนนี้แล้ว!' : '🔁 ควรฝึกซ้ำอีกนิดเพื่อความมั่นใจ'}
                  </h3>
                  <p className="text-xs opacity-90 mt-0.5 text-[#737365]">
                    {evaluationResult.decisionSummary}
                  </p>
                </div>
              </div>
            </div>

            {/* Submitted Artworks Preview */}
            {selectedImages.length > 0 && (
              <div className="bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-3 shadow-2xs">
                <div className="text-[11px] font-semibold text-[#5A5A40] mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>ภาพผลงานที่ส่งตรวจ ({selectedImages.length} ภาพ):</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedImages
                    .filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
                    .map((img, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl overflow-hidden border border-[#E9E3D5] bg-[#FAF7F2] aspect-4/3 flex items-center justify-center group"
                      >
                        <img src={img} alt={`Work ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute bottom-1 left-1 bg-[#2C2C2C]/80 text-white text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-xs font-medium">
                          ชิ้นงานที่ {idx + 1}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Checkpoint Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Praise */}
              <div className="bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <div className="font-semibold text-[#5A5A40] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#5A5A40]" />
                  <span>1. สิ่งที่ทำได้ดี (Praise):</span>
                </div>
                <p className="text-[#2C2C2C] leading-relaxed">
                  {evaluationResult.praise}
                </p>
              </div>

              {/* Improvements */}
              <div className="bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <div className="font-semibold text-[#D9A066] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#D9A066]" />
                  <span>2. จุดที่ควรพัฒนา (1-2 จุด):</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[#2C2C2C] leading-relaxed">
                  {evaluationResult.improvementPoints.map((pt, idx) => (
                    <li key={idx}>{pt}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Next step recommendation */}
            <div className="bg-[#FAF7F2] border border-[#E9E3D5] rounded-2xl p-4 text-xs space-y-1">
              <span className="font-semibold text-[#5A5A40]">
                {evaluationResult.passed ? '🎉 สิ่งที่ได้เรียนรู้และก้าวต่อไป:' : '🌱 คำแนะนำสำหรับฝึกซ้ำ:'}
              </span>
              <p className="text-[#737365] leading-relaxed">
                {evaluationResult.nextStepsOrRetryPlan}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              {evaluationResult.passed ? (
                <button
                  type="button"
                  onClick={() => fireWatercolorConfetti(lesson.id === 7)}
                  className="px-3.5 py-2.5 text-xs font-semibold text-[#5A5A40] bg-[#FAF7F2] hover:bg-[#E9E3D5] border border-[#E9E3D5] rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D9A066]" />
                  <span>ฉลองความสำเร็จอีกครั้ง 🎉</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 text-xs font-semibold text-[#2C2C2C] bg-[#E9E3D5] hover:bg-[#DDD5C5] rounded-xl transition-colors"
                >
                  ลองถ่ายภาพหรือส่งใหม่อีกครั้ง
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                {evaluationResult.passed && onNextLesson && lesson.id < 7 && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNextLesson();
                    }}
                    className="px-6 py-2.5 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#464632] rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
                  >
                    <span>ไปยังบทเรียนถัดไป (บทที่ {lesson.id + 1})</span>
                    <span>→</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-5 py-2.5 text-xs font-semibold rounded-xl transition-colors shadow-2xs ${
                    evaluationResult.passed && onNextLesson && lesson.id < 7
                      ? 'text-[#5A5A40] bg-[#FAF7F2] hover:bg-[#E9E3D5] border border-[#E9E3D5]'
                      : 'text-white bg-[#5A5A40] hover:bg-[#464632]'
                  }`}
                >
                  {evaluationResult.passed ? (lesson.id === 7 ? 'จบหลักสูตรแล้ว 🎉' : 'ดูผลแล้วปิดหน้าต่าง') : 'ปิดหน้าต่าง'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Upload & Notes Form */
          <div className="space-y-4">
            {/* Hidden Multi-file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Selected Images Grid or Dropzone */}
            {selectedImages.length > 0 ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#5A5A40] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>ภาพที่เลือก ({selectedImages.length}/6 ภาพ)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedImages.length < 6 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-semibold text-[#5A5A40] hover:text-[#2C2C2C] bg-[#FFF] hover:bg-[#E9E3D5]/40 border border-[#E9E3D5] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>เพิ่มภาพอีกภาพ</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedImages([])}
                      className="text-[11px] text-[#737365] hover:text-red-600 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>ล้างทั้งหมด</span>
                    </button>
                  </div>
                </div>

                {/* Grid of Image Thumbnails */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-[#FFF] border rounded-2xl transition-all ${
                    isDragging ? 'border-[#5A5A40] bg-[#FAF7F2] ring-2 ring-[#5A5A40]/20' : 'border-[#E9E3D5]'
                  }`}
                >
                  {selectedImages
                    .filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
                    .map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-[#E9E3D5] bg-[#FAF7F2] aspect-4/3 flex items-center justify-center shadow-2xs"
                    >
                      <img
                        src={img}
                        alt={`Work ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Badge */}
                      <div className="absolute top-2 left-2 bg-[#2C2C2C]/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-md backdrop-blur-xs">
                        ชิ้นงานที่ {idx + 1}
                      </div>

                      {/* Action buttons overlay */}
                      <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewingIndex(idx)}
                          className="p-1.5 rounded-full bg-white/90 text-[#2C2C2C] hover:bg-white hover:scale-110 transition-all shadow-sm"
                          title="ดูภาพขยาย"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 hover:scale-110 transition-all shadow-sm"
                          title="ลบภาพนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add more button slot */}
                  {selectedImages.length < 6 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#5A5A40]/30 hover:border-[#5A5A40] bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] rounded-xl aspect-4/3 flex flex-col items-center justify-center text-[#5A5A40] transition-colors p-3 text-center group"
                    >
                      <Plus className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-semibold">เพิ่มชิ้นงาน</span>
                      <span className="text-[9px] text-[#737365]">คลิกหรือลากวาง</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Dropzone when no images selected yet */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all space-y-3 ${
                  isDragging
                    ? 'border-[#5A5A40] bg-[#FAF7F2] ring-2 ring-[#5A5A40]/20'
                    : 'border-[#5A5A40]/30 hover:border-[#5A5A40] bg-[#FFF] hover:bg-[#FAF7F2]'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] mx-auto flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#2C2C2C]">
                    คลิกเพื่อเลือกภาพผลงาน (เลือกได้พร้อมกันมากกว่า 1 ภาพ)
                  </p>
                  <p className="text-[11px] text-[#737365] mt-1">
                    รองรับการอัปโหลดพร้อมกันหลายชิ้นงาน (เช่น ชิ้นงานที่ 1 และ 2) JPG, PNG หรือภาพถ่ายจากมือถือ
                  </p>
                </div>
              </div>
            )}

            {/* Quick Sample Option for Testing */}
            {selectedImages.length === 0 && (
              <div className="flex items-center justify-between bg-[#FFF] border border-[#E9E3D5] rounded-xl p-2.5 text-xs text-[#737365]">
                <span className="text-[11px]">
                  💡 ไม่มีสีน้ำอยู่ตรงหน้าตอนนี้?
                </span>
                <button
                  type="button"
                  onClick={handleSelectSample}
                  className="text-[11px] font-semibold text-[#5A5A40] hover:text-[#2C2C2C] hover:underline"
                >
                  ใช้ภาพตัวอย่างสำหรับทดสอบระบบ ({lesson.id === 1 ? '2 ชิ้นงาน' : '1 ชิ้นงาน'})
                </button>
              </div>
            )}

            {/* Learner Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#5A5A40] mb-1 uppercase tracking-wider">
                บันทึกหรือความรู้สึกของคุณขณะวาด (ไม่บังคับ)
              </label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="เช่น ส่งภาพแบบฝึกหัด 2 ชิ้นงาน: แถบสีเรียบกับแถบไล่เฉดครับ รู้สึกว่าตอนเกลี่ยน้ำยังไม่สม่ำเสมอเท่าไหร่ อยากให้ครูช่วยแนะนำครับ"
                rows={3}
                className="w-full text-xs bg-[#FFF] border border-[#E9E3D5] rounded-xl p-3 text-[#2C2C2C] placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40]"
              />
            </div>

            {/* Error Display */}
            {errorMessage && (
              <div className="flex items-start justify-between gap-3 text-xs text-amber-900 bg-amber-50/90 border border-amber-300/80 rounded-2xl p-3.5 shadow-2xs animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">แจ้งเตือนระบบ</p>
                    <p className="text-amber-800/90 mt-0.5 leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSubmitEvaluation}
                  disabled={isEvaluating}
                  className="px-3 py-1.5 text-[11px] font-semibold text-amber-900 bg-amber-200/70 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors flex-shrink-0"
                >
                  ลองส่งอีกครั้ง
                </button>
              </div>
            )}

            {/* Evaluation In-Progress Status Bar */}
            {isEvaluating && (
              <div className="bg-[#FAF7F2] border border-[#E9E3D5] rounded-2xl p-4 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-semibold text-[#5A5A40]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D9A066]" />
                    <span>{EVAL_STATUS_MESSAGES[evalProgressStep]}</span>
                  </span>
                  <span className="text-[11px] text-[#737365] flex items-center gap-1 font-medium">
                    <Zap className="w-3 h-3 text-[#D9A066]" />
                    <span>ตรวจ {selectedImages.length} ชิ้นงาน</span>
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-1.5 bg-[#E9E3D5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5A5A40] rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(92, (evalProgressStep + 1) * 25)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#737365]">
                <Zap className="w-3.5 h-3.5 text-[#D9A066]" />
                <span>รองรับการส่งภาพพร้อมกันสูงสุด 6 ภาพ</span>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isEvaluating || isCompressing}
                  className="px-4 py-2.5 text-xs font-medium text-[#737365] hover:text-[#2C2C2C] rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  id="btn-submit-evaluation-confirm"
                  type="button"
                  onClick={handleSubmitEvaluation}
                  disabled={selectedImages.length === 0 || isEvaluating || isCompressing}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#464632] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-2xs transition-all flex items-center gap-2"
                >
                  {isCompressing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังเตรียมภาพ...</span>
                    </>
                  ) : isEvaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังตรวจ {selectedImages.length} ชิ้นงาน...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        ส่งให้ครูตรวจ {selectedImages.length > 1 ? `(${selectedImages.length} ภาพ)` : ''}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Enlarge Preview */}
        {previewingIndex !== null &&
          selectedImages[previewingIndex] &&
          selectedImages[previewingIndex].trim().length > 0 && (
          <div
            onClick={() => setPreviewingIndex(null)}
            className="fixed inset-0 z-60 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div className="relative max-w-3xl max-h-[85vh] bg-[#FAF7F2] rounded-2xl overflow-hidden p-2">
              <img
                src={selectedImages[previewingIndex]}
                alt="Enlarged preview"
                className="max-h-[80vh] w-auto object-contain rounded-xl"
              />
              <button
                type="button"
                onClick={() => setPreviewingIndex(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-stone-900/70 text-white hover:bg-stone-900"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 left-4 bg-stone-900/80 text-white text-xs px-3 py-1 rounded-full font-medium">
                ชิ้นงานที่ {previewingIndex + 1} จาก {selectedImages.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
