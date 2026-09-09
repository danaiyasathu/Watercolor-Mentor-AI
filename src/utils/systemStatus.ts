// 🔥 สร้างไฟล์ใหม่สำหรับแสดงสถานะระบบ
import { checkSystemHealth } from './apiClient';
import { checkStorageHealth } from './storage';
import { getFirestoreStatus } from '../lib/firebase';

export interface SystemStatus {
  timestamp: number;
  online: boolean;
  storage: {
    localStorage: boolean;
    indexedDB: boolean;
    firebaseStorage: boolean;
  };
  api: {
    available: boolean;
    evaluationEndpoint: boolean;
  };
  firestore: {
    connected: boolean;
    databaseId: string;
  };
  recommendations: string[];
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const timestamp = Date.now();
  const recommendations: string[] = [];

  // ตรวจสอบทุกส่วนแบบ parallel
  const [storageHealth, apiHealth, firestoreStatus] = await Promise.all([
    checkStorageHealth(),
    checkSystemHealth(),
    getFirestoreStatus(),
  ]);

  // วิเคราะห์ปัญหาและให้คำแนะนำ
  if (!apiHealth.online) {
    recommendations.push('📶 อุปกรณ์ออฟไลน์อยู่ - ผลงานจะถูกบันทึกเฉพาะในอุปกรณ์นี้');
  }
  
  if (!apiHealth.evaluationEndpoint) {
    recommendations.push('🤖 ระบบ AI ประเมินผลไม่พร้อม - ใช้โหมดประเมินผลแบบออฟไลน์');
  }
  
  if (!storageHealth.indexedDB) {
    recommendations.push('💾 IndexedDB ไม่พร้อม - ผลงานอาจไม่ถูกบันทึกถาวร');
  }
  
  if (!firestoreStatus.connected) {
    recommendations.push('☁️ Firebase ไม่เชื่อมต่อ - ผลงานจะไม่ถูก sync ไปยังคลาวด์');
  }

  return {
    timestamp,
    online: apiHealth.online,
    storage: storageHealth,
    api: {
      available: apiHealth.apiAvailable,
      evaluationEndpoint: apiHealth.evaluationEndpoint,
    },
    firestore: firestoreStatus,
    recommendations,
  };
}

// 🔥 ฟังก์ชันแสดงสถานะใน UI
export function renderSystemStatus(status: SystemStatus): string {
  const statusEmoji = status.online ? '✅' : '⚠️';
  const messages = [
    `${statusEmoji} สถานะระบบ: ${status.online ? 'ออนไลน์' : 'ออฟไลน์'}`,
    `📦 Storage: ${status.storage.indexedDB ? 'พร้อม' : 'ไม่พร้อม'}`,
    `🤖 AI Evaluation: ${status.api.evaluationEndpoint ? 'พร้อม' : 'ออฟไลน์'}`,
    `☁️ Cloud Sync: ${status.firestore.connected ? 'พร้อม' : 'ไม่พร้อม'}`,
  ];

  if (status.recommendations.length > 0) {
    messages.push('');
    messages.push('📝 คำแนะนำ:');
    messages.push(...status.recommendations);
  }

  return messages.join('\n');
}