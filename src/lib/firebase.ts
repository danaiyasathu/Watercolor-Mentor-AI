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

// 6. Firestore: Save single submission
export async function saveSubmissionToFirestore(
  userId: string,
  submission: Submission
): Promise<boolean> {
  if (!userId || !submission || !submission.id) return false;
  try {
    const subDocRef = doc(db, 'users', userId, 'submissions', String(submission.id));

    // Firestore has a 1MB doc size limit.
    // Strip master high-res base64 image strings if too large to prevent document overflow,
    // while keeping 100% of the real AI evaluation text, analysis, and scores intact.
    const safeImageUrl =
      typeof submission.imageUrl === 'string' && submission.imageUrl.length <= 150000
        ? submission.imageUrl
        : '';

    const safeImageUrls = Array.isArray(submission.imageUrls)
      ? submission.imageUrls.filter((u) => typeof u === 'string' && u.length <= 150000)
      : safeImageUrl
      ? [safeImageUrl]
      : [];

    const payload = {
      id: String(submission.id),
      userId,
      lessonId: Number(submission.lessonId),
      imageUrl: safeImageUrl,
      imageUrls: safeImageUrls,
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
      },
      createdAt: submission.createdAt || Date.now(),
    };

    await setDoc(subDocRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving submission:', err);
    return false;
  }
}

// 7. Firestore: Load all submissions for user
export async function loadSubmissionsFromFirestore(userId: string): Promise<Submission[]> {
  if (!userId) return [];
  try {
    const subsColl = collection(db, 'users', userId, 'submissions');
    const q = query(subsColl, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);

    const results: Submission[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: data.id || docSnap.id,
        lessonId: Number(data.lessonId),
        imageUrl: data.imageUrl || '',
        imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : data.imageUrl ? [data.imageUrl] : [],
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
          timestamp: data.evaluation?.timestamp || data.createdAt || Date.now(),
          imageUrl: data.imageUrl || '',
        },
        createdAt: data.createdAt || Date.now(),
      });
    });

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
        updatedAt: Date.now(),
      },
      { merge: true }
    );
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
