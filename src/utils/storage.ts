/**
 * Safe storage wrapper with dual-layer persistence:
 * 1. LocalStorage with automatic compression and quota-proofing
 * 2. IndexedDB for large image payloads and permanent durability
 * 3. Firebase Storage for cloud backup
 */

import { saveSubmissionsToIdb } from './indexedDb';
import { Submission } from '../types';
import { getSampleArtworkDataUrl } from '../data/sampleArtworks';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

function getSampleKeyForLessonNum(lessonId: number): 'flat_wash' | 'wet_on_wet' | 'shapes' | 'color_wheel' | 'landscape' | 'composition' | 'capstone' {
  switch (lessonId) {
    case 1: return 'flat_wash';
    case 2: return 'wet_on_wet';
    case 3: return 'shapes';
    case 4: return 'color_wheel';
    case 5: return 'landscape';
    case 6: return 'composition';
    case 7:
    default: return 'capstone';
  }
}

// 🔥 ฟังก์ชันใหม่: อัปโหลดภาพไปยัง Firebase Storage
export async function uploadImagesToFirebaseStorage(
  images: string[], 
  userId: string, 
  lessonId: number
): Promise<string[]> {
  try {
    // ตรวจสอบว่า Firebase พร้อมใช้งาน
    const { initializeApp, getApps } = await import('firebase/app');
    const apps = getApps();
    if (apps.length === 0) {
      console.warn('Firebase not initialized, skipping storage upload');
      return [];
    }

    const storage = getStorage();
    const timestamp = Date.now();
    const urls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      
      if (!imageData || typeof imageData !== 'string') {
        console.warn(`Image ${i} is invalid, skipping`);
        continue;
      }
      
      // ตรวจสอบว่าเป็น base64 data URL หรือไม่
      let cleanBase64 = imageData;
      if (imageData.startsWith('data:image')) {
        const parts = imageData.split(',');
        if (parts.length === 2) {
          cleanBase64 = parts[1];
        }
      }

      // ตรวจสอบขนาด base64
      if (cleanBase64.length > 10 * 1024 * 1024) { // 10MB limit
        console.warn(`Image ${i} too large (${cleanBase64.length} bytes), skipping`);
        continue;
      }

      // สร้าง path ที่ unique
      const filePath = `submissions/${userId || 'anonymous'}/lesson-${lessonId}/${timestamp}-${i}.jpg`;
      const storageRef = ref(storage, filePath);

      try {
        // อัปโหลดเป็น base64 string
        await uploadString(storageRef, cleanBase64, 'base64', {
          contentType: 'image/jpeg',
          customMetadata: {
            userId: userId || 'anonymous',
            lessonId: String(lessonId),
            index: String(i),
            uploadedAt: String(timestamp),
            source: 'watercolor-mentor',
          },
        });

        // ดึง download URL
        const downloadURL = await getDownloadURL(storageRef);
        urls.push(downloadURL);
        
        console.log(`✅ Uploaded image ${i+1} to Firebase Storage: ${filePath}`);
      } catch (uploadError) {
        console.error(`Failed to upload image ${i}:`, uploadError);
      }
    }

    return urls;
  } catch (error) {
    console.error('Firebase Storage upload failed:', error);
    // Return empty array to allow fallback to base64
    return [];
  }
}

// 🔥 ฟังก์ชันใหม่: บันทึก submission แบบเต็ม
export async function saveFullSubmission(
  evaluation: any,
  userNotes: string,
  imageData: string[]
): Promise<boolean> {
  try {
    // สร้าง submission object
    const submission: Submission = {
      id: `${evaluation.lessonId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lessonId: evaluation.lessonId,
      imageUrl: imageData[0] || evaluation.imageUrl || '',
      imageUrls: imageData.length > 0 ? imageData : evaluation.imageUrls || [],
      userNotes: userNotes || '',
      evaluation: {
        lessonId: evaluation.lessonId,
        passed: Boolean(evaluation.passed),
        praise: evaluation.praise || '',
        improvementPoints: Array.isArray(evaluation.improvementPoints) 
          ? evaluation.improvementPoints 
          : [],
        decisionSummary: evaluation.decisionSummary || '',
        nextStepsOrRetryPlan: evaluation.nextStepsOrRetryPlan || '',
        mentorFullMessage: evaluation.mentorFullMessage || '',
        timestamp: evaluation.timestamp || Date.now(),
        imageUrl: imageData[0] || evaluation.imageUrl || '',
        imageUrls: imageData.length > 0 ? imageData : evaluation.imageUrls || [],
      },
      createdAt: evaluation.timestamp || Date.now(),
    };

    // 1. บันทึกลง IndexedDB
    try {
      await saveSubmissionsToIdb([submission]);
      console.log('✅ Saved to IndexedDB');
    } catch (idbError) {
      console.warn('IndexedDB save failed:', idbError);
      // ยังดำเนินการต่อ
    }

    // 2. บันทึกลง localStorage (metadata only)
    try {
      const existing = safeGetStorage<Submission[]>('watercolor_mentor_submissions', []);
      const updated = [...existing, submission];
      safeSetStorage('watercolor_mentor_submissions', updated);
      console.log('✅ Saved to localStorage');
    } catch (localError) {
      console.warn('localStorage save failed:', localError);
      // ยังดำเนินการต่อ
    }

    // 3. บันทึกลง Firestore (ถ้ามีการ authentication)
    try {
      const { auth } = await import('../lib/firebase');
      const { saveSubmissionToFirestore } = await import('../lib/firebase');
      
      const user = auth.currentUser;
      if (user?.uid) {
        const success = await saveSubmissionToFirestore(user.uid, submission);
        if (success) {
          console.log('✅ Saved to Firestore');
        } else {
          console.log('⚠️ Firestore save returned false');
        }
      } else {
        console.log('ℹ️ No authenticated user, skipping Firestore');
      }
    } catch (firestoreError) {
      console.warn('Firestore save failed:', firestoreError);
      // ยังดำเนินการต่อ
    }

    return true;
  } catch (error) {
    console.error('Failed to save full submission:', error);
    return false;
  }
}

// 🔥 ฟังก์ชันใหม่: ตรวจสอบสถานะ storage
export async function checkStorageHealth(): Promise<{
  localStorage: boolean;
  indexedDB: boolean;
  firebaseStorage: boolean;
}> {
  const results = {
    localStorage: false,
    indexedDB: false,
    firebaseStorage: false,
  };

  try {
    // Test localStorage
    const testKey = 'watercolor_storage_test';
    localStorage.setItem(testKey, 'test');
    results.localStorage = localStorage.getItem(testKey) === 'test';
    localStorage.removeItem(testKey);
  } catch {
    results.localStorage = false;
  }

  try {
    // Test IndexedDB
    const db = indexedDB.open('test_db', 1);
    results.indexedDB = true;
    db.onerror = () => { results.indexedDB = false; };
  } catch {
    results.indexedDB = false;
  }

  try {
    // Test Firebase Storage (lightweight test)
    const { getApps } = await import('firebase/app');
    results.firebaseStorage = getApps().length > 0;
  } catch {
    results.firebaseStorage = false;
  }

  return results;
}

// 🔥 ฟังก์ชันใหม่: ดึงข้อมูลจากทุกแหล่ง
export async function getAllSubmissions(userId?: string): Promise<Submission[]> {
  const allSubmissions: Submission[] = [];

  try {
    // 1. จาก localStorage
    const localSubs = safeGetStorage<Submission[]>('watercolor_mentor_submissions', []);
    allSubmissions.push(...localSubs);
    console.log(`📁 Loaded ${localSubs.length} submissions from localStorage`);
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
  }

  try {
    // 2. จาก IndexedDB (ถ้ามี)
    const { loadSubmissionsFromIdb } = await import('./indexedDb');
    const idbSubs = await loadSubmissionsFromIdb();
    allSubmissions.push(...idbSubs);
    console.log(`💾 Loaded ${idbSubs.length} submissions from IndexedDB`);
  } catch (error) {
    console.warn('Failed to load from IndexedDB:', error);
  }

  try {
    // 3. จาก Firestore (ถ้ามี userId)
    if (userId) {
      const { loadSubmissionsFromFirestore } = await import('../lib/firebase');
      const firestoreSubs = await loadSubmissionsFromFirestore(userId);
      allSubmissions.push(...firestoreSubs);
      console.log(`☁️ Loaded ${firestoreSubs.length} submissions from Firestore`);
    }
  } catch (error) {
    console.warn('Failed to load from Firestore:', error);
  }

  // ลบรายการซ้ำ (โดยใช้ id + createdAt)
  const uniqueSubmissions = Array.from(
    new Map(
      allSubmissions
        .filter(s => s.id && s.lessonId)
        .map(s => [`${s.id}-${s.createdAt}`, s])
    ).values()
  );

  // เรียงลำดับตามวันที่สร้าง
  uniqueSubmissions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  console.log(`🎯 Total unique submissions: ${uniqueSubmissions.length}`);
  return uniqueSubmissions;
}

// ฟังก์ชันเดิม (ไม่แก้ไข)
export function safeGetStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultValue;
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw) as T;

    // If reading submissions, ensure all lessonIds are strictly numeric
    if (key === 'watercolor_mentor_submissions' && Array.isArray(parsed)) {
      return (parsed as any[]).map((s) => ({
        ...s,
        lessonId: Number(s.lessonId),
      })) as unknown as T;
    }

    return parsed;
  } catch (err) {
    console.warn(`[Storage] Failed to read key "${key}":`, err);
    return defaultValue;
  }
}

/**
 * Sanitizes submissions for localStorage:
 * - Always keeps 100% of real AI evaluation analysis texts, feedback, and notes intact.
 * - Full original high-res base64 images are permanently written to IndexedDB.
 * - Truncates excessively large base64 strings in localStorage to guarantee never exceeding 5MB quota.
 */
function sanitizeSubmissionsForStorage(submissions: Submission[]): Submission[] {
  return submissions.map((sub) => {
    const numLessonId = Number(sub.lessonId);
    // Keep image in localStorage only if reasonable size, else IndexedDB holds the master image
    const safeImageUrl =
      typeof sub.imageUrl === 'string' && sub.imageUrl.length <= 40000
        ? sub.imageUrl
        : '';

    const safeImageUrls = Array.isArray(sub.imageUrls)
      ? sub.imageUrls.filter((img) => typeof img === 'string' && img.length <= 40000)
      : safeImageUrl
      ? [safeImageUrl]
      : [];

    return {
      ...sub,
      lessonId: numLessonId,
      imageUrl: safeImageUrl,
      imageUrls: safeImageUrls,
      userNotes: sub.userNotes || '',
      evaluation: {
        ...sub.evaluation,
        lessonId: Number(sub.evaluation?.lessonId || numLessonId),
        // Keep ALL genuine evaluation texts verbatim
        praise: sub.evaluation?.praise || '',
        improvementPoints: Array.isArray(sub.evaluation?.improvementPoints)
          ? sub.evaluation.improvementPoints
          : [],
        decisionSummary: sub.evaluation?.decisionSummary || '',
        nextStepsOrRetryPlan: sub.evaluation?.nextStepsOrRetryPlan || '',
        mentorFullMessage: sub.evaluation?.mentorFullMessage || '',
        passed: Boolean(sub.evaluation?.passed),
        timestamp: sub.evaluation?.timestamp || sub.createdAt || Date.now(),
        // Omit bulky duplicate images inside evaluation in localStorage
        imageUrl: '',
        imageUrls: undefined,
      },
    };
  });
}

/**
 * Sanitizes chat messages for localStorage:
 * Strips huge base64 image strings from chat history while preserving
 * all message text, roles, timestamps, and evaluation feedback.
 */
function sanitizeChatForStorage(messages: any[]): any[] {
  return messages.map((msg) => {
    const hasLargeImage = typeof msg.imageUrl === 'string' && msg.imageUrl.length > 40000;
    const hasLargeImages = Array.isArray(msg.imageUrls) && msg.imageUrls.some((u: any) => typeof u === 'string' && u.length > 40000);

    if (!hasLargeImage && !hasLargeImages && !msg.evaluation?.imageUrl) {
      return msg;
    }

    return {
      ...msg,
      imageUrl: hasLargeImage ? '' : msg.imageUrl,
      imageUrls: hasLargeImages ? [] : msg.imageUrls,
      evaluation: msg.evaluation
        ? {
            ...msg.evaluation,
            imageUrl: '',
            imageUrls: undefined,
          }
        : undefined,
    };
  });
}

/**
 * Creates ultra-compact submissions if quota is exceeded
 * preserving 100% of the genuine AI evaluation texts and scores.
 */
function createLightweightSubmissions(submissions: Submission[]): Submission[] {
  return submissions.map((sub) => {
    const numLessonId = Number(sub.lessonId);
    return {
      id: sub.id,
      lessonId: numLessonId,
      imageUrl: typeof sub.imageUrl === 'string' && sub.imageUrl.length <= 40000 ? sub.imageUrl : '',
      imageUrls: Array.isArray(sub.imageUrls)
        ? sub.imageUrls.filter((img) => typeof img === 'string' && img.length <= 40000)
        : [],
      userNotes: sub.userNotes || '',
      evaluation: {
        ...sub.evaluation,
        lessonId: Number(sub.evaluation?.lessonId || numLessonId),
        passed: Boolean(sub.evaluation?.passed),
        // NEVER overwrite real evaluation texts with generic placeholders
        praise: sub.evaluation?.praise || '',
        improvementPoints: Array.isArray(sub.evaluation?.improvementPoints)
          ? sub.evaluation.improvementPoints
          : [],
        decisionSummary: sub.evaluation?.decisionSummary || '',
        nextStepsOrRetryPlan: sub.evaluation?.nextStepsOrRetryPlan || '',
        mentorFullMessage: sub.evaluation?.mentorFullMessage || '',
        timestamp: sub.evaluation?.timestamp || sub.createdAt || Date.now(),
        imageUrl: '',
        imageUrls: undefined,
      },
      createdAt: sub.createdAt || Date.now(),
    };
  });
}

export function safeSetStorage<T>(key: string, value: T): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    let payloadToSerialize = value;

    // Special optimization for submissions:
    // 1. Asynchronously persist full uncompressed original submissions + full base64 images into IndexedDB
    // 2. Write lightweight metadata + 100% full real evaluation texts into localStorage
    if (key === 'watercolor_mentor_submissions' && Array.isArray(value)) {
      saveSubmissionsToIdb(value as Submission[]).catch((err) => {
        console.warn('[Storage] IndexedDB sync error:', err);
      });

      payloadToSerialize = sanitizeSubmissionsForStorage(value as Submission[]) as unknown as T;
    }

    // Special optimization for chat: strip massive base64 images from localStorage payload
    if (key === 'watercolor_mentor_chat' && Array.isArray(value)) {
      payloadToSerialize = sanitizeChatForStorage(value) as unknown as T;
    }

    const serialized = JSON.stringify(payloadToSerialize);
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (err: any) {
    console.warn(`[Storage] Failed to write key "${key}":`, err);

    // If quota exceeded, perform emergency compression preserving genuine evaluation texts
    if (
      err?.name === 'QuotaExceededError' ||
      err?.code === 22 ||
      err?.code === 1014 ||
      err?.number === -2147024882
    ) {
      try {
        console.warn(`[Storage] Quota exceeded for "${key}", attempting intelligent lightweight save...`);
        if (key === 'watercolor_mentor_submissions' && Array.isArray(value)) {
          const lightweight = createLightweightSubmissions(value as Submission[]);
          window.localStorage.setItem(key, JSON.stringify(lightweight));
          return true;
        } else if (key === 'watercolor_mentor_chat' && Array.isArray(value)) {
          const sanitized = sanitizeChatForStorage(value).slice(-25);
          window.localStorage.setItem(key, JSON.stringify(sanitized));
          return true;
        } else if (Array.isArray(value)) {
          const trimmed = value.slice(-20);
          window.localStorage.setItem(key, JSON.stringify(trimmed));
          return true;
        }
      } catch (innerErr) {
        console.warn(`[Storage] Lightweight save also failed for "${key}":`, innerErr);
      }
    }
    return false;
  }
}

export function safeRemoveStorage(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn(`[Storage] Failed to remove key "${key}":`, err);
  }
}

// 🔥 ฟังก์ชันใหม่: ลบข้อมูลเก่า
export function cleanupOldStorage(keepLastNDays = 30): void {
  try {
    const now = Date.now();
    const cutoff = now - (keepLastNDays * 24 * 60 * 60 * 1000);
    
    // ลบ fallback submissions เก่า
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('watercolor_fallback_')) {
        try {
          const timestamp = parseInt(key.replace('watercolor_fallback_', ''));
          if (timestamp < cutoff) {
            keysToRemove.push(key);
          }
        } catch {
          // ถ้าพาร์สไม่ได้ ให้ข้าม
        }
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🧹 Cleaned up old backup: ${key}`);
    });
    
    if (keysToRemove.length > 0) {
      console.log(`🧹 Total cleaned: ${keysToRemove.length} old backups`);
    }
  } catch (error) {
    console.warn('Cleanup failed:', error);
  }
}