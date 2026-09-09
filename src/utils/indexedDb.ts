/**
 * IndexedDB helper for storing Watercolor Mentor submissions and artworks.
 * IndexedDB provides hundreds of megabytes of reliable storage in browser,
 * completely avoiding the 5MB quota limit of localStorage for base64 image data.
 */

import { Submission } from '../types';

const DB_NAME = 'watercolor_mentor_db';
const DB_VERSION = 1;
const STORE_NAME = 'submissions';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('lessonId', 'lessonId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSingleSubmissionToIdb(submission: Submission): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.put({
      ...submission,
      lessonId: Number(submission.lessonId),
    });

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.warn('[IndexedDB] Transaction error while saving single submission:', tx.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not save single submission:', err);
    return false;
  }
}

export async function saveSubmissionsToIdb(submissions: Submission[]): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Save all submissions
    for (const sub of submissions) {
      store.put({
        ...sub,
        lessonId: Number(sub.lessonId),
      });
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.warn('[IndexedDB] Transaction error while saving:', tx.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not save submissions:', err);
    return false;
  }
}

export async function getAllSubmissionsFromIdb(): Promise<Submission[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = (request.result as Submission[]) || [];
        // Ensure lessonId is always numeric
        const normalized = result.map((s) => ({
          ...s,
          lessonId: Number(s.lessonId),
        }));
        resolve(normalized);
      };
      request.onerror = () => {
        console.warn('[IndexedDB] Error loading submissions:', request.error);
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not load submissions:', err);
    return [];
  }
}

export async function clearAllSubmissionsFromIdb(): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not clear submissions:', err);
    return false;
  }
}
