import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  COURSE_LESSONS,
  SYSTEM_INSTRUCTION_TEXT,
} from './data/courseData';
import {
  UserProfile,
  ChatMessage,
  Submission,
  CheckpointEvaluation,
  LessonDraft,
  ActivityLogItem,
  LearningStateBackup,
} from './types';
import { Navbar } from './components/Navbar';
import { CourseSidebar } from './components/CourseSidebar';
import { LessonDetail } from './components/LessonDetail';
import { ChatMentor } from './components/ChatMentor';
import { OnboardingModal } from './components/OnboardingModal';
import { ArtworkUploadModal } from './components/ArtworkUploadModal';
import { ColorWheelStudio } from './components/ColorWheelStudio';
import { ArtworkGallery } from './components/ArtworkGallery';
import { SystemInstructionModal } from './components/SystemInstructionModal';
import { LearningHistoryModal } from './components/LearningHistoryModal';
import { CelebrationToast } from './components/CelebrationToast';
import { SystemStatusModal } from './components/SystemStatusModal';
import { playZenBell, playWarmChime } from './utils/audio';
import { fireWatercolorConfetti } from './utils/celebration';
import { safeApiPost, checkSystemHealth, isOnline } from './utils/apiClient';
import { 
  safeGetStorage, 
  safeSetStorage, 
  safeRemoveStorage,
  uploadImagesToFirebaseStorage,
  saveFullSubmission,
  checkStorageHealth
} from './utils/storage';
import {
  getAllSubmissionsFromIdb,
  saveSingleSubmissionToIdb,
  clearAllSubmissionsFromIdb,
} from './utils/indexedDb';
import {
  initAuthListener,
  testFirestoreConnection,
  saveSubmissionToFirestore,
  loadSubmissionsFromFirestore,
  saveProgressToFirestore,
  loadProgressFromFirestore,
  getFirestoreStatus,
} from './lib/firebase';
import { initializeSystemCheck } from './utils/systemStatus';
import type { User } from 'firebase/auth';
import { getSampleKeyForLesson } from './data/lessonEvaluations';
import { getSampleArtworkDataUrl } from './data/sampleArtworks';
import { BookOpen, MessageSquare, Sparkles, ChevronRight, History, AlertCircle, Check, CloudOff, WifiOff } from 'lucide-react';

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  priorExperience: 'ไม่เคยจับพู่กันหรือวาดภาพมาก่อนเลย (มือใหม่ 100%)',
  supplies: {
    paintType: 'สีน้ำก้อน/หลอดทั่วไป',
    brushes: 'พู่กันกลมเบอร์ 6 หรือ 8',
    paper: 'กระดาษสีน้ำ 200-300 แกรม',
    waterContainers: true,
    tissue: true,
  },
  goal: 'ผ่อนคลายและเยียวยาจิตใจ',
  practiceTimePerWeek: '1-2 ชั่วโมงต่อสัปดาห์',
  isOnboarded: false,
};

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    safeGetStorage<UserProfile>('watercolor_mentor_profile', DEFAULT_PROFILE)
  );

  const [currentLessonId, setCurrentLessonId] = useState<number>(() =>
    Number(safeGetStorage<number>('watercolor_mentor_current_lesson', 0)) || 0
  );

  const [completedLessons, setCompletedLessons] = useState<number[]>(() =>
    safeGetStorage<number[]>('watercolor_mentor_completed_lessons', [])
  );

  const [submissions, setSubmissions] = useState<Submission[]>(() =>
    safeGetStorage<Submission[]>('watercolor_mentor_submissions', [])
  );

  const [lessonDrafts, setLessonDrafts] = useState<Record<number, LessonDraft>>(() =>
    safeGetStorage<Record<number, LessonDraft>>('watercolor_mentor_drafts', {})
  );

  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(() =>
    safeGetStorage<ActivityLogItem[]>('watercolor_mentor_activity_logs', [
      {
        id: 'init-1',
        type: 'onboard',
        title: 'เริ่มต้นการเรียนรู้สีน้ำ',
        detail: 'เปิดใช้งานคอร์สและพื้นที่ฝึกฝนส่วนตัว',
        timestamp: Date.now(),
      },
    ])
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    safeGetStorage<ChatMessage[]>('watercolor_mentor_chat', [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: `สวัสดีครับ! ครูคือ "ครูสอนสีน้ำ" (Watercolor Mentor) ยินดีต้อนรับสู่พื้นที่ปลอดภัยสำหรับการเรียนรู้ศิลปะและการเยียวยาใจนะครับ 🌿\n\nเราจะค่อย ๆ เรียนรู้ไปด้วยกันทีละขั้นตอนอย่างผ่อนคลาย โดยเริ่มตั้งแต่การรู้จักอุปกรณ์ การคุมน้ำ และเทคนิคต่าง ๆ จนได้ผลงานชิ้นเอกของคุณเอง\n\nพร้อมเริ่มต้น บทที่ 0 — ทำความรู้จักอุปกรณ์ หรือยังครับ? หากมีคำถามหรือสงสัยตรงไหน ถามครูได้ตลอดเลยนะ!`,
        timestamp: Date.now(),
      },
    ])
  );

  const [lastSavedAt, setLastSavedAt] = useState<number>(Date.now());
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(!userProfile.isOnboarded);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showColorStudio, setShowColorStudio] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showSystemInstruction, setShowSystemInstruction] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSystemStatus, setShowSystemStatus] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mobileTab, setMobileTab] = useState<'lesson' | 'chat'>('lesson');
  const [celebrationToast, setCelebrationToast] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    lessonNumber: number;
    praise: string;
    isMilestone?: boolean;
  } | null>(null);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'synced' | 'connecting' | 'offline'>('connecting');
  const [systemStatus, setSystemStatus] = useState<{
    online: boolean;
    storage: { localStorage: boolean; indexedDB: boolean; firebaseStorage: boolean };
    api: { available: boolean; evaluationEndpoint: boolean };
    firestore: { connected: boolean; databaseId: string };
  } | null>(null);

  // Helper to add activity log item
  const addActivityLog = useCallback(
    (item: Omit<ActivityLogItem, 'id' | 'timestamp'>) => {
      const newLog: ActivityLogItem = {
        ...item,
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
      };
      setActivityLogs((prev) => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
      setLastSavedAt(Date.now());
    },
    []
  );

  // Persistence to localStorage using safe wrappers
  useEffect(() => {
    safeSetStorage('watercolor_mentor_profile', userProfile);
    setLastSavedAt(Date.now());
  }, [userProfile]);

  useEffect(() => {
    safeSetStorage('watercolor_mentor_current_lesson', currentLessonId);
    setLastSavedAt(Date.now());
  }, [currentLessonId]);

  useEffect(() => {
    safeSetStorage('watercolor_mentor_completed_lessons', completedLessons);
    setLastSavedAt(Date.now());
  }, [completedLessons]);

  useEffect(() => {
    safeSetStorage('watercolor_mentor_submissions', submissions);
    setLastSavedAt(Date.now());
  }, [submissions]);

  useEffect(() => {
    safeSetStorage('watercolor_mentor_drafts', lessonDrafts);
    setLastSavedAt(Date.now());
  }, [lessonDrafts]);

  useEffect(() => {
    safeSetStorage('watercolor_mentor_activity_logs', activityLogs);
  }, [activityLogs]);

  useEffect(() => {
    safeSetStorage('watercolor_mentor_chat', messages);
    setLastSavedAt(Date.now());
  }, [messages]);

  // Initialize system check
  useEffect(() => {
    initializeSystemCheck().then(() => {
      // Check system status periodically
      checkSystemHealth().then(health => {
        setSystemStatus({
          online: health.online,
          storage: { localStorage: true, indexedDB: true, firebaseStorage: false },
          api: health,
          firestore: { connected: false, databaseId: '(default)' }
        });
      });
    });
  }, []);

  // Synchronize and load full submissions from IndexedDB (overcomes browser localStorage 5MB quota)
  useEffect(() => {
    let isMounted = true;
    getAllSubmissionsFromIdb().then((idbSubs) => {
      if (!isMounted || !idbSubs || idbSubs.length === 0) return;
      setSubmissions((prev) => {
        const mergedMap = new Map<number, Submission>();
        // First populate with localStorage cache
        for (const s of prev) {
          mergedMap.set(Number(s.lessonId), { ...s, lessonId: Number(s.lessonId) });
        }
        // Enrich or update with full master uncompressed records from IndexedDB
        for (const s of idbSubs) {
          const numId = Number(s.lessonId);
          const existing = mergedMap.get(numId);
          if (!existing) {
            mergedMap.set(numId, { ...s, lessonId: numId });
          } else {
            mergedMap.set(numId, {
              ...existing,
              ...s,
              lessonId: numId,
              imageUrl: s.imageUrl || existing.imageUrl,
              imageUrls:
                s.imageUrls && s.imageUrls.length > 0 ? s.imageUrls : existing.imageUrls,
              evaluation: {
                ...existing.evaluation,
                ...s.evaluation,
                lessonId: numId,
              },
            });
          }
        }
        return Array.from(mergedMap.values());
      });
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Firebase Firestore (asia-east1) Cloud Synchronization
  useEffect(() => {
    let isSubscribed = true;

    // 1. Verify cloud connection
    testFirestoreConnection().then((connected) => {
      if (isSubscribed) {
        setCloudStatus(connected ? 'synced' : 'offline');
      }
    });

    // 2. Listen to authentication state & load user cloud data
    const unsubscribeAuth = initAuthListener(async (user) => {
      if (!isSubscribed) return;
      setFirebaseUser(user);

      if (user) {
        setCloudStatus('synced');

        // 🔥 Update system status with Firestore connection
        const firestoreStatus = await getFirestoreStatus();
        setSystemStatus(prev => prev ? {
          ...prev,
          firestore: firestoreStatus,
          storage: { ...prev.storage, firebaseStorage: firestoreStatus.connected }
        } : null);

        // Sync cloud progress
        try {
          const cloudProgress = await loadProgressFromFirestore(user.uid);
          if (cloudProgress && isSubscribed) {
            if (
              Array.isArray(cloudProgress.completedLessons) &&
              cloudProgress.completedLessons.length > 0
            ) {
              setCompletedLessons((prev) => {
                const combined = Array.from(
                  new Set([...prev.map(Number), ...cloudProgress.completedLessons!.map(Number)])
                );
                return combined;
              });
            }
          }
        } catch (e) {
          console.warn('[Firebase] Could not restore cloud progress:', e);
        }

        // Sync cloud submissions
        try {
          const cloudSubs = await loadSubmissionsFromFirestore(user.uid);
          if (cloudSubs && cloudSubs.length > 0 && isSubscribed) {
            setSubmissions((prev) => {
              const mergedMap = new Map<number, Submission>();
              for (const s of prev) {
                mergedMap.set(Number(s.lessonId), s);
              }
              for (const cs of cloudSubs) {
                const numId = Number(cs.lessonId);
                const existing = mergedMap.get(numId);
                if (!existing) {
                  mergedMap.set(numId, cs);
                } else {
                  mergedMap.set(numId, {
                    ...cs,
                    imageUrl: existing.imageUrl || cs.imageUrl,
                    imageUrls:
                      existing.imageUrls && existing.imageUrls.length > 0
                        ? existing.imageUrls
                        : cs.imageUrls,
                  });
                }
              }
              return Array.from(mergedMap.values());
            });
          }
        } catch (e) {
          console.warn('[Firebase] Could not restore cloud submissions:', e);
        }
      } else {
        // No user, update system status
        setSystemStatus(prev => prev ? {
          ...prev,
          firestore: { connected: false, databaseId: '(default)' },
          storage: { ...prev.storage, firebaseStorage: false }
        } : null);
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribeAuth();
    };
  }, []);

  // Save progress changes to Cloud Firestore
  useEffect(() => {
    if (firebaseUser?.uid) {
      saveProgressToFirestore(firebaseUser.uid, currentLessonId, completedLessons).catch((err) => {
        console.warn('[Firebase] Auto-sync progress error:', err);
        // If sync fails, update cloud status to offline
        setCloudStatus('offline');
      });
    }
  }, [firebaseUser, currentLessonId, completedLessons]);

  const currentLesson = COURSE_LESSONS.find((l) => l.id === currentLessonId) || COURSE_LESSONS[0];
  const isLessonCompleted = completedLessons.map(Number).includes(Number(currentLessonId));

  // Resilient latest submission finder grounded strictly in real evaluated data
  const latestSubmission = useMemo(() => {
    // 1. First check submissions array (latest matching real evaluated item)
    const found = [...submissions].reverse().find(
      (s) => Number(s.lessonId) === Number(currentLessonId)
    );
    if (found) {
      return found;
    }

    // 2. Check chat messages for genuine AI evaluation of this lesson
    const evalMsg = [...messages].reverse().find(
      (m) => m.evaluation && Number(m.evaluation.lessonId) === Number(currentLessonId)
    );
    if (evalMsg && evalMsg.evaluation) {
      const validImgs = (evalMsg.imageUrls || (evalMsg.imageUrl ? [evalMsg.imageUrl] : [])).filter(
        (u): u is string => typeof u === 'string' && u.trim().length > 0
      );
      return {
        id: evalMsg.id || `eval-${evalMsg.timestamp}`,
        lessonId: Number(currentLessonId),
        imageUrl: validImgs[0] || '',
        imageUrls: validImgs,
        userNotes: evalMsg.evaluation.userNotes || '',
        evaluation: evalMsg.evaluation,
        createdAt: evalMsg.timestamp || Date.now(),
      };
    }

    // 3. Strictly no fake generated history: return undefined if never submitted
    return undefined;
  }, [submissions, messages, currentLessonId]);

  const currentDraftNotes = lessonDrafts[currentLessonId]?.notes || '';

  const handleSaveLessonNotes = (notes: string) => {
    setLessonDrafts((prev) => ({
      ...prev,
      [currentLessonId]: {
        lessonId: currentLessonId,
        notes,
        lastUpdated: Date.now(),
      },
    }));
  };

  const handleSaveProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    setShowOnboarding(false);
    setIsEditingProfile(false);

    addActivityLog({
      type: 'onboard',
      title: 'บันทึกการตั้งค่าผู้เรียน',
      detail: `เป้าหมาย: ${profile.goal} · อุปกรณ์: ${profile.supplies.paintType}`,
    });

    if (soundEnabled) playWarmChime();

    // Add a personalized greeting to chat
    const personalizedWelcome: ChatMessage = {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: `ยินดีที่ได้รู้จักครับคุณ ${profile.name || 'ผู้เรียน'}! ครูดีใจมากที่คุณเลือกมาเรียนรู้สีน้ำเพื่อ${profile.goal}นะครับ ✨\n\nครูรับทราบแล้วว่าคุณใช้อุปกรณ์: ${profile.supplies.paintType} และวางแผนฝึก ${profile.practiceTimePerWeek}\n\nเรามาเริ่มต้นที่ **บทที่ 0 — ทำความรู้จักอุปกรณ์** กันได้เลยครับ จัดวางอุปกรณ์แล้วถ่ายภาพส่งการบ้านให้ครูตรวจได้เลยนะครับ!`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, personalizedWelcome]);
  };

  const handleSelectLesson = (id: number) => {
    setCurrentLessonId(id);
    setMobileTab('lesson');
    if (soundEnabled) playZenBell(440, 0.8);

    const targetLesson = COURSE_LESSONS.find((l) => l.id === id);
    addActivityLog({
      type: 'start_lesson',
      lessonId: id,
      title: `เข้าเรียน: ${targetLesson?.thaiTitle.split('—')[0].trim() || `บทที่ ${id}`}`,
      detail: targetLesson?.objective,
    });
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsChatLoading(true);

    addActivityLog({
      type: 'chat',
      lessonId: currentLessonId,
      title: 'ปรึกษาข้อสงสัยกับครูสอนสีน้ำ',
      detail: text.length > 50 ? `${text.substring(0, 50)}...` : text,
    });

    try {
      // 🔥 Check if online before sending
      if (!isOnline()) {
        throw new Error('อุปกรณ์ออฟไลน์อยู่ ระบบใช้โหมดแชทออฟไลน์');
      }

      const data = await safeApiPost<{ message: string }>('/api/chat', {
        messages: newMessages.slice(-10), // Send last 10 messages for context
        currentLessonId,
        userProfile,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message || 'ครูได้รับข้อความแล้วครับ มีอะไรให้ครูช่วยแนะนำเพิ่มเติมไหมครับ?',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (soundEnabled) playWarmChime();
    } catch (err: any) {
      console.error('[Chat Send Error]', err);
      
      // 🔥 Create helpful offline response if API fails
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: err?.message.includes('ออฟไลน์') 
          ? `ครูกำลังใช้โหมดออฟไลน์นะครับ! 🎨\n\nสำหรับบทเรียนนี้ (${currentLesson.thaiTitle}) ครูแนะนำให้ลอง:\n\n1. **ฝึก ${currentLesson.homework.title}**\n2. **ทดลอง ${currentLesson.concepts?.[0]?.title || 'เทคนิคพื้นฐาน'}**\n3. **บันทึกผลงานและคำถามไว้** เพื่อปรึกษาครูเมื่อกลับมาออนไลน์\n\n✨ ครูเชื่อว่าคุณทำได้แน่นอน!`
          : 'ขออภัยครับ เกิดข้อขัดข้องชั่วคราวในการเชื่อมต่อกับครู กรุณารอสักครู่แล้วลองใหม่อีกครั้งนะครับ',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleEvaluationComplete = (
    evaluation: CheckpointEvaluation,
    imageUrl: string,
    notes: string,
    imageUrls?: string[]
  ) => {
    const numLessonId = Number(evaluation.lessonId ?? currentLessonId);
    const rawImages = imageUrls && imageUrls.length > 0 ? imageUrls : [imageUrl];
    const filteredImages = rawImages.filter(
      (img): img is string => typeof img === 'string' && img.trim().length > 0
    );
    const fallbackImage = getSampleArtworkDataUrl(getSampleKeyForLesson(numLessonId));
    const images = filteredImages.length > 0 ? filteredImages : [fallbackImage];
    const primaryImage = images[0];

    const newSubmission: Submission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lessonId: numLessonId,
      imageUrl: primaryImage,
      imageUrls: images,
      userNotes: notes,
      evaluation: {
        ...evaluation,
        lessonId: numLessonId,
        imageUrl: primaryImage,
        imageUrls: images,
      },
      createdAt: Date.now(),
    };

    // 🔥 Immediately persist real uncompressed evaluation and images into IndexedDB master store
    saveSingleSubmissionToIdb(newSubmission).catch((err) => {
      console.warn('[Storage] Immediate IndexedDB save error:', err);
    });

    // 🔥 Save to Cloud Firestore (asia-east1)
    if (firebaseUser?.uid) {
      saveSubmissionToFirestore(firebaseUser.uid, newSubmission).then(success => {
        if (success) {
          console.log('✅ Successfully saved to Firestore');
          setCloudStatus('synced');
        } else {
          console.warn('⚠️ Firestore save failed, keeping offline');
          setCloudStatus('offline');
        }
      }).catch((err) => {
        console.warn('[Firebase] Cloud Firestore submission save error:', err);
        setCloudStatus('offline');
      });
    }

    // 🔥 Upload images to Firebase Storage (if available)
    if (firebaseUser?.uid && images.length > 0) {
      uploadImagesToFirebaseStorage(images, firebaseUser.uid, numLessonId)
        .then(storageUrls => {
          if (storageUrls.length > 0) {
            console.log(`✅ Uploaded ${storageUrls.length} images to Firebase Storage`);
            // Update submission with storage URLs
            newSubmission.imageUrl = storageUrls[0];
            newSubmission.imageUrls = storageUrls;
            newSubmission.evaluation.imageUrl = storageUrls[0];
            newSubmission.evaluation.imageUrls = storageUrls;
            
            // Update in state
            setSubmissions(prev => {
              const filtered = prev.filter((s) => Number(s.lessonId) !== numLessonId);
              return [...filtered, newSubmission];
            });
          }
        })
        .catch(err => {
          console.warn('Firebase Storage upload failed, using base64:', err);
        });
    }

    // Update submissions (replace previous if exists for this lesson)
    setSubmissions((prev) => {
      const filtered = prev.filter((s) => Number(s.lessonId) !== numLessonId);
      return [...filtered, newSubmission];
    });

    // If passed, mark lesson as completed
    if (evaluation.passed) {
      const currentCompletedNums = completedLessons.map(Number);
      const willHaveCompleted = currentCompletedNums.includes(numLessonId)
        ? currentCompletedNums
        : [...currentCompletedNums, numLessonId];

      const isMilestone =
        willHaveCompleted.length === 3 || willHaveCompleted.length === 8 || numLessonId === 7;

      setCompletedLessons((prev) => {
        const numPrev = prev.map(Number);
        if (!numPrev.includes(numLessonId)) {
          return [...numPrev, numLessonId];
        }
        return numPrev;
      });

      addActivityLog({
        type: 'pass_checkpoint',
        lessonId: numLessonId,
        title: `🎉 ผ่านบทเรียน: ${currentLesson.thaiTitle.split('—')[0].trim()}`,
        detail: `คำชมจากครู: ${evaluation.praise}`,
      });

      // Show celebratory positive reinforcement toast
      setCelebrationToast({
        isOpen: true,
        title: currentLesson.thaiTitle.split('—')[0].trim(),
        subtitle: currentLesson.objective,
        lessonNumber: numLessonId,
        praise: evaluation.praise,
        isMilestone,
      });

      fireWatercolorConfetti(isMilestone);
    } else {
      addActivityLog({
        type: 'submit_homework',
        lessonId: numLessonId,
        title: `ส่งการบ้าน: ${currentLesson.thaiTitle.split('—')[0].trim()}`,
        detail: `คำแนะนำ: ${evaluation.improvementPoints?.[0] || 'ฝึกฝนเพิ่มเติมเพื่อความมั่นใจ'}`,
      });
    }

    // Append mentor feedback into the ongoing chat log as well
    const checkpointChatMsg: ChatMessage = {
      id: `eval-${Date.now()}`,
      role: 'assistant',
      content: `🎨 **ผลการตรวจการบ้าน: ${currentLesson.thaiTitle}**\n\n🌟 **สิ่งที่ทำได้ดี:** ${evaluation.praise}\n\n💡 **จุดที่ควรพัฒนา:**\n${evaluation.improvementPoints.map((pt) => `• ${pt}`).join('\n')}\n\n🎯 **คำตัดสิน:** ${
        evaluation.passed ? '✅ ผ่านบทเรียนนี้แล้ว!' : '🔁 ควรฝึกซ้ำอีกนิดเพื่อความมั่นใจ'
      }\n\n${evaluation.nextStepsOrRetryPlan}`,
      timestamp: Date.now(),
      imageUrl: primaryImage,
      imageUrls: images,
      evaluation: {
        ...evaluation,
        lessonId: numLessonId,
        imageUrl: primaryImage,
        imageUrls: images,
      },
    };
    setMessages((prev) => [...prev, checkpointChatMsg]);
  };

  const handleNextLesson = () => {
    if (currentLessonId < COURSE_LESSONS.length - 1) {
      const nextId = currentLessonId + 1;
      handleSelectLesson(nextId);
      if (soundEnabled) playZenBell(528, 1.0);
    }
  };

  const handleRestoreBackup = (backup: LearningStateBackup) => {
    if (backup.userProfile) setUserProfile(backup.userProfile);
    if (typeof backup.currentLessonId === 'number') setCurrentLessonId(Number(backup.currentLessonId));
    if (Array.isArray(backup.completedLessons)) setCompletedLessons(backup.completedLessons.map(Number));
    if (Array.isArray(backup.submissions)) {
      const sanitized = backup.submissions.map((s) => ({
        ...s,
        lessonId: Number(s.lessonId),
        evaluation: {
          ...s.evaluation,
          lessonId: Number(s.evaluation?.lessonId ?? s.lessonId),
        },
      }));
      setSubmissions(sanitized);
    }
    if (Array.isArray(backup.messages) && backup.messages.length > 0) setMessages(backup.messages);
    if (backup.lessonDrafts) setLessonDrafts(backup.lessonDrafts);
    if (Array.isArray(backup.activityLogs)) {
      setActivityLogs([
        {
          id: `log-restore-${Date.now()}`,
          type: 'resume',
          title: 'กู้คืนข้อมูลสำเร็จจากไฟล์สำรอง',
          detail: `สำเร็จแล้ว ${backup.completedLessons.length} บทเรียน`,
          timestamp: Date.now(),
        },
        ...backup.activityLogs,
      ]);
    }
    if (soundEnabled) playWarmChime();
  };

  const handleResetProgress = () => {
    safeRemoveStorage('watercolor_mentor_profile');
    safeRemoveStorage('watercolor_mentor_current_lesson');
    safeRemoveStorage('watercolor_mentor_completed_lessons');
    safeRemoveStorage('watercolor_mentor_submissions');
    safeRemoveStorage('watercolor_mentor_drafts');
    safeRemoveStorage('watercolor_mentor_activity_logs');
    safeRemoveStorage('watercolor_mentor_chat');
    clearAllSubmissionsFromIdb().catch(console.warn);

    setUserProfile(DEFAULT_PROFILE);
    setCurrentLessonId(0);
    setCompletedLessons([]);
    setSubmissions([]);
    setLessonDrafts({});
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `สวัสดีครับ! เริ่มต้นเส้นทางสีน้ำครั้งใหม่ด้วยใจที่เบาสบายนะครับ 🌿\n\nพร้อมเมื่อไหร่ แจ้งครูเพื่อเริ่มบทที่ 0 ได้เลยครับ!`,
        timestamp: Date.now(),
      },
    ]);
    setActivityLogs([
      {
        id: `log-reset-${Date.now()}`,
        type: 'onboard',
        title: 'เริ่มต้นการเรียนรู้ใหม่',
        detail: 'ล้างข้อมูลประวัติและเตรียมพร้อมสำหรับบทเรียนใหม่',
        timestamp: Date.now(),
      },
    ]);
    setShowOnboarding(true);
  };

  // 🔥 Function to check system status
  const checkAndShowSystemStatus = async () => {
    try {
      const [storageHealth, apiHealth, firestoreStatus] = await Promise.all([
        checkStorageHealth(),
        checkSystemHealth(),
        getFirestoreStatus(),
      ]);

      const status = {
        online: apiHealth.online,
        storage: storageHealth,
        api: apiHealth,
        firestore: firestoreStatus,
      };

      setSystemStatus(status);
      setShowSystemStatus(true);
    } catch (error) {
      console.error('Failed to check system status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2C2C] flex flex-col font-sans selection:bg-[#FFE8D6] selection:text-[#D9A066]">
      {/* Top Navbar */}
      <Navbar
        currentLessonId={currentLessonId}
        completedLessons={completedLessons}
        onOpenSystemInstruction={() => setShowSystemInstruction(true)}
        onOpenColorStudio={() => setShowColorStudio(true)}
        onOpenGallery={() => setShowGallery(true)}
        onOpenHistory={() => setShowHistoryModal(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        lastSavedAt={lastSavedAt}
        cloudStatus={cloudStatus}
        onCheckSystemStatus={checkAndShowSystemStatus}
      />

      {/* System Status Banner */}
      {!isOnline() && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2 text-xs flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span className="font-medium">คุณกำลังใช้อุปกรณ์ในโหมดออฟไลน์</span>
          <button 
            onClick={checkAndShowSystemStatus}
            className="text-amber-700 hover:text-amber-900 underline text-xs ml-2"
          >
            ตรวจสอบสถานะ
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl w-full mx-auto">
        {/* Left: Course Curriculum Sidebar */}
        <CourseSidebar
          currentLessonId={currentLessonId}
          completedLessons={completedLessons}
          onSelectLesson={handleSelectLesson}
          userProfile={userProfile}
          onEditProfile={() => setIsEditingProfile(true)}
          onOpenHistory={() => setShowHistoryModal(true)}
        />

        {/* Mobile Tab Switcher */}
        <div className="lg:hidden flex border-b border-[#E9E3D5] bg-[#FAF7F2] p-1.5 m-3 rounded-2xl">
          <button
            type="button"
            onClick={() => setMobileTab('lesson')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'lesson'
                ? 'bg-[#FFF] text-[#5A5A40] shadow-2xs'
                : 'text-[#737365] hover:text-[#2C2C2C]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>เนื้อหาบทเรียน & การบ้าน</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('chat')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'chat'
                ? 'bg-[#FFF] text-[#5A5A40] shadow-2xs'
                : 'text-[#737365] hover:text-[#2C2C2C]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>ปรึกษาครูสีน้ำ</span>
          </button>
        </div>

        {/* Middle: Lesson Details */}
        <main
          className={`flex-1 p-4 lg:p-7 overflow-y-auto ${
            mobileTab === 'lesson' ? 'block' : 'hidden lg:block'
          }`}
        >
          <LessonDetail
            lesson={currentLesson}
            isCompleted={isLessonCompleted}
            latestSubmission={latestSubmission}
            draftNotes={currentDraftNotes}
            onSaveNotes={handleSaveLessonNotes}
            onSubmitHomework={() => setShowUploadModal(true)}
            onOpenChat={() => setMobileTab('chat')}
            onNextLesson={handleNextLesson}
            hasNextLesson={currentLessonId < COURSE_LESSONS.length - 1}
          />
        </main>

        {/* Right: Live Chat Mentor Panel */}
        <div
          className={`w-full lg:w-96 p-4 lg:p-6 lg:pl-0 flex-shrink-0 flex flex-col h-[600px] lg:h-[calc(100vh-65px)] ${
            mobileTab === 'chat' ? 'block' : 'hidden lg:flex'
          }`}
        >
          <ChatMentor
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
            currentLesson={currentLesson}
            userProfile={userProfile}
            soundEnabled={soundEnabled}
          />
        </div>
      </div>

      {/* Modals */}
      <OnboardingModal
        isOpen={showOnboarding || isEditingProfile}
        initialProfile={userProfile}
        onSave={handleSaveProfile}
        onClose={() => setIsEditingProfile(false)}
        isEditing={isEditingProfile}
        completedLessons={completedLessons}
        submissions={submissions}
        lessonDrafts={lessonDrafts}
        onSelectLesson={handleSelectLesson}
      />

      <ArtworkUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        lesson={currentLesson}
        userProfile={userProfile}
        onEvaluationComplete={handleEvaluationComplete}
        onNextLesson={handleNextLesson}
      />

      <ColorWheelStudio
        isOpen={showColorStudio}
        onClose={() => setShowColorStudio(false)}
      />

      <ArtworkGallery
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        submissions={submissions}
        userProfile={userProfile}
        completedCount={completedLessons.length}
      />

      <LearningHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        userProfile={userProfile}
        currentLessonId={currentLessonId}
        completedLessons={completedLessons}
        submissions={submissions}
        lessonDrafts={lessonDrafts}
        activityLogs={activityLogs}
        lastSavedAt={lastSavedAt}
        onResumeLesson={handleSelectLesson}
        onRestoreBackup={handleRestoreBackup}
        onResetProgress={handleResetProgress}
      />

      <SystemInstructionModal
        isOpen={showSystemInstruction}
        onClose={() => setShowSystemInstruction(false)}
      />

      <SystemStatusModal
        isOpen={showSystemStatus}
        onClose={() => setShowSystemStatus(false)}
        status={systemStatus}
      />

      {celebrationToast && (
        <CelebrationToast
          isOpen={celebrationToast.isOpen}
          onClose={() => setCelebrationToast(null)}
          title={celebrationToast.title}
          subtitle={celebrationToast.subtitle}
          lessonNumber={celebrationToast.lessonNumber}
          praise={celebrationToast.praise}
          isMilestone={celebrationToast.isMilestone}
          onContinue={handleNextLesson}
        />
      )}
    </div>
  );
}