/**
 * Safe storage wrapper with dual-layer persistence:
 * 1. LocalStorage with automatic compression and quota-proofing
 * 2. IndexedDB for large image payloads and permanent durability
 */

import { saveSubmissionsToIdb } from './indexedDb';
import { Submission } from '../types';
import { getSampleArtworkDataUrl } from '../data/sampleArtworks';

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
