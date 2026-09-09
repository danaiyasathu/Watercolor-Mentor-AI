import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Submission } from '../types';

// 1. Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Auth
export const auth = getAuth(app);

// 3. Initialize Firestore with specific database ID (asia-east1 configured)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// 4. Test connection on boot as mandated by skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firestore] Successfully verified connection to Firestore (asia-east1)');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Client is offline or database initializing.');
    }
    return false;
  }
}

// 5. Auth listener with automatic anonymous sign-in
export function initAuthListener(onUserChanged: (user: User | null) => void): () => void {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      onUserChanged(user);
    } else {
      try {
        const cred = await signInAnonymously(auth);
        onUserChanged(cred.user);
      } catch (err) {
        console.warn('[Auth] Anonymous sign-in failed, proceeding in offline mode:', err);
        onUserChanged(null);
      }
    }
  });
  return unsubscribe;
}

// 🔥 แก้ไข: ฟังก์ชันบันทึก submission ไปยัง Firestore
export async function saveSubmissionToFirestore(
  userId: string,
  submission: Submission
): Promise<boolean> {
  if (!userId || !submission || !submission.id) {
    console.warn('Invalid submission data:', { userId, submission });
    return false;
  }
  
  try {
    const subDocRef = doc(db, 'users', userId, 'submissions', String(submission.id));

    // ตรวจสอบและเตรียม imageUrls array
    let safeImageUrls: string[] = [];
    
    // ตรวจสอบ imageUrls array
    if (Array.isArray(submission.imageUrls) && submission.imageUrls.length > 0) {
      // แยก storage URLs และ base64 URLs
      const storageUrls = submission.imageUrls.filter(url => 
        url.startsWith('https://firebasestorage.googleapis.com/')
      );
      const base64Urls = submission.imageUrls.filter(url => 
        url.startsWith('data:image/')
      );
      
      // ให้ความสำคัญกับ storage URLs ก่อน (เก็บได้มากกว่าเพราะเป็นลิงก์)
      safeImageUrls = [
        ...storageUrls.slice(0, 10), // สามารถเก็บ storage URLs ได้มาก
        ...base64Urls.slice(0, 2)    // เก็บ base64 ได้น้อยเพราะขนาดใหญ่
      ];
      
      // กรองเฉพาะ string ที่ไม่ใหญ่เกินไป (Firestore limit ~1MB)
      safeImageUrls = safeImageUrls.filter((u): u is string => 
        typeof u === 'string' && u.length <= 1000000 // 1MB limit
      );
    }
    
    // ถ้า imageUrls ว่างเปล่า แต่มี imageUrl เดียว
    if (safeImageUrls.length === 0 && submission.imageUrl) {
      if (typeof submission.imageUrl === 'string') {
        // ตรวจสอบขนาด
        if (submission.imageUrl.length <= 1000000) {
          safeImageUrls = [submission.imageUrl];
        } else {
          console.warn('Single imageUrl too large for Firestore, skipping');
        }
      }
    }

    // ตรวจสอบว่าเป็น storage URL หรือ base64
    const hasStorageUrl = safeImageUrls.some(url => 
      url.startsWith('https://firebasestorage.googleapis.com/')
    );
    const hasBase64Url = safeImageUrls.some(url => 
      url.startsWith('data:image/')
    );

    const payload = {
      id: String(submission.id),
      userId,
      lessonId: Number(submission.lessonId),
      imageUrl: safeImageUrls[0] || '', // ใช้ตัวแรกจาก array
      imageUrls: safeImageUrls, // ← เก็บ array ทั้งหมด
      userNotes: submission.userNotes || '',
      evaluation: {
        lessonId: Number(submission.evaluation?.lessonId || submission.lessonId),
        passed: Boolean(submission.evaluation?.passed),
        praise: submission.evaluation?.praise || '',
        improvementPoints: Array.isArray(submission.evaluation?.improvementPoints)
          ? submission.evaluation.improvementPoints
          : [],
        decisionSummary: submission.evaluation?.decisionSummary || '',
        nextStepsOrRetryPlan: submission.evaluation?.nextStepsOrRetryPlan || '',
        mentorFullMessage: submission.evaluation?.mentorFullMessage || '',
        timestamp: submission.evaluation?.timestamp || submission.createdAt || Date.now(),
        imageUrl: safeImageUrls[0] || '',
        imageUrls: safeImageUrls,
      },
      createdAt: submission.createdAt || Date.now(),
      storageType: hasStorageUrl ? 'firebase' : (hasBase64Url ? 'base64' : 'none'),
      hasImages: safeImageUrls.length > 0,
      imageCount: safeImageUrls.length,
      _firestoreTimestamp: Timestamp.now(),
      _syncedAt: Timestamp.now(),
    };

    await setDoc(subDocRef, payload, { merge: true });
    console.log(`✅ Saved submission ${submission.id} to Firestore with ${safeImageUrls.length} images`);
    return true;
  } catch (err: any) {
    console.warn('[Firestore] Error saving submission:', err);
    
    // ตรวจสอบว่าเป็น quota error หรือไม่
    if (err instanceof Error && (
      err.message.includes('quota') || 
      err.message.includes('limit') ||
      err.message.includes('exceeds')
    )) {
      console.error('Firestore quota exceeded, image data too large');
      // ลองบันทึกแบบไม่มีภาพ
      try {
        const subDocRef = doc(db, 'users', userId, 'submissions', String(submission.id));
        const fallbackPayload = {
          id: String(submission.id),
          userId,
          lessonId: Number(submission.lessonId),
          imageUrl: '',
          imageUrls: [],
          userNotes: submission.userNotes || '',
          evaluation: {
            lessonId: Number(submission.evaluation?.lessonId || submission.lessonId),
            passed: Boolean(submission.evaluation?.passed),
            praise: submission.evaluation?.praise || '',
            improvementPoints: submission.evaluation?.improvementPoints || [],
            decisionSummary: submission.evaluation?.decisionSummary || '',
            nextStepsOrRetryPlan: submission.evaluation?.nextStepsOrRetryPlan || '',
            mentorFullMessage: submission.evaluation?.mentorFullMessage || '',
            timestamp: submission.evaluation?.timestamp || submission.createdAt || Date.now(),
          },
          createdAt: submission.createdAt || Date.now(),
          storageType: 'none',
          hasImages: false,
          imageCount: 0,
          _firestoreTimestamp: Timestamp.now(),
          _syncedAt: Timestamp.now(),
        };
        await setDoc(subDocRef, fallbackPayload, { merge: true });
        console.log(`✅ Saved submission ${submission.id} without images (quota exceeded)`);
        return true;
      } catch (fallbackErr) {
        console.error('Fallback save also failed:', fallbackErr);
        return false;
      }
    }
    
    return false;
  }
}

// 7. Firestore: Load all submissions for user
export async function loadSubmissionsFromFirestore(userId: string): Promise<Submission[]> {
  if (!userId) return [];
  try {
    const subsColl = collection(db, 'users', userId, 'submissions');
    const q = query(subsColl, orderBy('createdAt', 'desc')); // เรียงใหม่ล่าสุดก่อน
    const snapshot = await getDocs(q);

    const results: Submission[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const imageUrls = Array.isArray(data.imageUrls) 
        ? data.imageUrls 
        : data.imageUrl 
          ? [data.imageUrl] 
          : [];
      
      // แปลง Firestore Timestamp เป็น milliseconds
      const createdAt = data.createdAt 
        ? (data.createdAt.toMillis ? data.createdAt.toMillis() : data.createdAt)
        : Date.now();
      
      results.push({
        id: data.id || docSnap.id,
        lessonId: Number(data.lessonId),
        imageUrl: imageUrls[0] || '',
        imageUrls: imageUrls,
        userNotes: data.userNotes || '',
        evaluation: {
          lessonId: Number(data.evaluation?.lessonId || data.lessonId),
          passed: Boolean(data.evaluation?.passed),
          praise: data.evaluation?.praise || '',
          improvementPoints: Array.isArray(data.evaluation?.improvementPoints)
            ? data.evaluation.improvementPoints
            : [],
          decisionSummary: data.evaluation?.decisionSummary || '',
          nextStepsOrRetryPlan: data.evaluation?.nextStepsOrRetryPlan || '',
          mentorFullMessage: data.evaluation?.mentorFullMessage || '',
          timestamp: data.evaluation?.timestamp || createdAt,
          imageUrl: imageUrls[0] || '',
          imageUrls: imageUrls,
        },
        createdAt: createdAt,
      });
    });

    console.log(`✅ Loaded ${results.length} submissions from Firestore`);
    return results;
  } catch (err) {
    console.warn('[Firestore] Error loading submissions:', err);
    return [];
  }
}

// 8. Firestore: Save user learning progress
export async function saveProgressToFirestore(
  userId: string,
  currentLessonId: number,
  completedLessons: number[]
): Promise<boolean> {
  if (!userId) return false;
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        uid: userId,
        currentLessonId: Number(currentLessonId),
        completedLessons: completedLessons.map(Number),
        updatedAt: Timestamp.now(),
        lastActive: Timestamp.now(),
        appVersion: '1.0.0',
        platform: typeof window !== 'undefined' ? 'web' : 'unknown',
      },
      { merge: true }
    );
    console.log(`✅ Saved progress for user ${userId}`);
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving progress:', err);
    return false;
  }
}

// 9. Firestore: Load user learning progress
export async function loadProgressFromFirestore(
  userId: string
): Promise<{ currentLessonId?: number; completedLessons?: number[] } | null> {
  if (!userId) return null;
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(`✅ Loaded progress for user ${userId}`);
      return {
        currentLessonId: data.currentLessonId ? Number(data.currentLessonId) : undefined,
        completedLessons: Array.isArray(data.completedLessons)
          ? data.completedLessons.map(Number)
          : undefined,
      };
    }
    return null;
  } catch (err) {
    console.warn('[Firestore] Error loading progress:', err);
    return null;
  }
}

// 🔥 เพิ่ม: ฟังก์ชันตรวจสอบสถานะ Firestore
export async function getFirestoreStatus(): Promise<{
  connected: boolean;
  databaseId: string;
  region?: string;
  lastSync?: number;
}> {
  try {
    const isConnected = await testFirestoreConnection();
    const lastSync = Date.now();
    
    return {
      connected: isConnected,
      databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
      region: 'asia-east1',
      lastSync,
    };
  } catch (error) {
    console.warn('Firestore status check failed:', error);
    return {
      connected: false,
      databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
    };
  }
}

// 🔥 เพิ่ม: ฟังก์ชัน sync ข้อมูลจาก local ไปยัง cloud
export async function syncLocalToCloud(
  userId: string,
  localSubmissions: Submission[]
): Promise<{ success: number; failed: number }> {
  if (!userId || localSubmissions.length === 0) {
    return { success: 0, failed: 0 };
  }

  const results = { success: 0, failed: 0 };
  
  for (const submission of localSubmissions) {
    try {
      const success = await saveSubmissionToFirestore(userId, submission);
      if (success) {
        results.success++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.warn(`Failed to sync submission ${submission.id}:`, error);
      results.failed++;
    }
  }

  console.log(`🔄 Sync completed: ${results.success} success, ${results.failed} failed`);
  return results;
}

// 🔥 เพิ่ม: ฟังก์ชันลบ submission จาก Firestore
export async function deleteSubmissionFromFirestore(
  userId: string,
  submissionId: string
): Promise<boolean> {
  if (!userId || !submissionId) return false;
  
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const subDocRef = doc(db, 'users', userId, 'submissions', submissionId);
    await deleteDoc(subDocRef);
    console.log(`🗑️ Deleted submission ${submissionId} from Firestore`);
    return true;
  } catch (error) {
    console.warn('Failed to delete submission from Firestore:', error);
    return false;
  }
}

// 🔥 เพิ่ม: ฟังก์ชันนับจำนวน submissions
export async function countSubmissionsInFirestore(userId: string): Promise<number> {
  if (!userId) return 0;
  
  try {
    const subsColl = collection(db, 'users', userId, 'submissions');
    const snapshot = await getDocs(subsColl);
    return snapshot.size;
  } catch (error) {
    console.warn('Failed to count submissions:', error);
    return 0;
  }
}