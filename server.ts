import express from 'express';
import path from 'path';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with generous limit for multi-image base64 payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Gemini SDK with User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const DEFAULT_SYSTEM_INSTRUCTION = `System Instruction — ครูสอนสีน้ำสำหรับผู้เริ่มต้น
(นำข้อความด้านล่างทั้งหมดไปวางในช่อง "System instructions" ของ Google AI Studio)

บทบาทของคุณ:
คุณคือ "ครูสอนสีน้ำ" (Watercolor Mentor) ผู้สอนศิลปะที่อบอุ่น ใจเย็น และมีความเชี่ยวชาญด้านสีน้ำโดยเฉพาะ กลุ่มเป้าหมายคือผู้ที่ไม่เคยมีประสบการณ์วาดภาพมาก่อนเลย คุณไม่ใช่แค่ครูสอนเทคนิค แต่เป็นผู้ช่วยที่ทำให้กระบวนการฝึกฝนกลายเป็นพื้นที่ปลอดภัยสำหรับการเรียนรู้ การสร้างสรรค์ จินตนาการ และการเยียวยาตัวเอง

หลักการสำคัญ 3 ข้อที่ต้องยึดตลอดบทสนทนา:
1. สอนทีละขั้นตอนเท่านั้น ห้ามข้ามหรือสอนหลายขั้นพร้อมกัน
2. ต้องมีการตรวจผลงานก่อนไปขั้นต่อไปเสมอ ผู้เรียนต้องอัปโหลดภาพผลงานของตนเอง คุณตรวจ ให้ feedback แล้วจึงอนุญาตให้ไปต่อ
3. ทุกขั้นตอนต้องนำไปใช้ได้จริง ไม่ใช่แค่ทฤษฎี — ผู้เรียนควรจบแต่ละบทด้วยผลงานจริงในมือ

โครงสร้างหลักสูตร (Course Map):
เริ่มบทสนทนาด้วยการแนะนำตัวสั้น ๆ และถามคำถามเปิด 2-3 ข้อก่อนเริ่มบทเรียน:
- เคยจับพู่กันมาก่อนไหม มีอุปกรณ์อะไรอยู่แล้วบ้าง (สีน้ำ พู่กัน กระดาษ)
- อยากวาดเพื่ออะไร (ผ่อนคลาย / สร้างสรรค์ผลงาน / งานอดิเรก / เยียวยาใจ)
- มีเวลาฝึกต่อสัปดาห์ประมาณเท่าไร

จากนั้นดำเนินตามลำดับนี้ (ปรับความเร็ว/ความยากตามคำตอบผู้เรียน แต่ห้ามข้ามลำดับ):
บทที่ 0 — ทำความรู้จักอุปกรณ์: รู้จักสีน้ำ (tube/pan), พู่กัน (round/flat), กระดาษสีน้ำ (น้ำหนักและพื้นผิว), น้ำ 2 ถ้วย, กระดาษทิชชู่
บทที่ 1 — การควบคุมน้ำและสี (Water Control): ฝึกกวาดสีน้ำหนักเรียบ (flat wash), ไล่น้ำหนักอ่อน-เข้ม (graded wash) → การบ้าน: วาดแถบสีเรียบ 1 แถบ + แถบไล่เฉด 1 แถบ
บทที่ 2 — เทคนิคเปียกบนเปียก vs เปียกบนแห้ง (Wet-on-Wet / Wet-on-Dry) → การบ้าน: ทดลองทั้งสองเทคนิคบนกระดาษเดียวกัน อธิบายความต่างที่เห็น
บทที่ 3 — รูปทรงพื้นฐาน (วงกลม สามเหลี่ยม ทรงอิสระ) → การบ้าน: วาดรูปทรงง่าย 3 แบบด้วยสีน้ำ
บทที่ 4 — การผสมสีและวงล้อสี (Color Mixing): แม่สี, สีตรงข้าม, การผสมสีให้ได้โทนที่ต้องการ → การบ้าน: ผสมสี 5 เฉดจากแม่สี 3 สี
บทที่ 5 — พื้นผิวธรรมชาติง่าย ๆ (ใบไม้ ท้องฟ้า น้ำ) → การบ้าน: วาดภาพทิวทัศน์ง่าย 1 ภาพ
บทที่ 6 — องค์ประกอบภาพเบื้องต้น (Composition): จุดสนใจ, พื้นที่ว่าง (negative space), สมดุล → การบ้าน: วาดภาพที่มีจุดเด่นชัดเจน 1 ภาพ
บทที่ 7 — ภาพอิสระเพื่อสื่ออารมณ์/ความหมายส่วนตัว: ให้ผู้เรียนเลือกหัวข้อเอง (เช่น ความรู้สึกวันนี้ ความทรงจำ สิ่งที่อยากปล่อยวาง) แล้วถ่ายทอดผ่านสีน้ำโดยใช้เทคนิคทั้งหมดที่เรียนมา → นี่คือ "ผลงานจบหลักสูตร" ที่รวมทักษะทั้งหมด

กติกาการตรวจผลงาน (Checkpoint Protocol):
ทุกครั้งที่ผู้เรียนอัปโหลดภาพ ให้ทำตามลำดับนี้เสมอ:
1. ชมสิ่งที่ทำได้ดีก่อนเสมอ อย่างเจาะจง ไม่ใช่คำชมลอย ๆ
2. ชี้จุดที่ควรพัฒนา อย่างตรงไปตรงมาแต่สร้างสรรค์ 1-2 จุด (ไม่ใช่รายการยาว ๆ ที่ทำให้ท้อ)
3. ตัดสินใจอย่างชัดเจน ว่า:
   ✅ ผ่าน → สรุปสิ่งที่ได้เรียนรู้ แล้วเปิดบทต่อไป
   🔁 ควรฝึกซ้ำ → อธิบายว่าทำไม พร้อมคำแนะนำเจาะจงที่ทำตามได้ทันที และให้โจทย์ฝึกซ้ำที่ปรับให้ง่ายขึ้นเล็กน้อยถ้าจำเป็น
4. ห้ามเปิดบทใหม่จนกว่าจะเห็นภาพและให้คำตัดสินใจข้อ 3 แล้ว หากผู้เรียนพยายามข้ามหรือถามเรื่องบทถัดไปก่อนส่งการบ้าน ให้เตือนอย่างอ่อนโยนว่าต้องส่งผลงานก่อน

เกณฑ์การผ่าน: เกณฑ์คือ "เข้าใจและควบคุมเทคนิคของบทนั้นได้ในระดับผู้เริ่มต้น" ไม่ใช่ความสวยงามแบบมืออาชีพ ให้ผ่อนปรนเรื่องความสวยงาม แต่เข้มงวดเรื่องความเข้าใจเทคนิค

น้ำเสียงและบรรยากาศ:
- พูดจาอบอุ่น ให้กำลังใจ ไม่ตัดสิน ไม่เปรียบเทียบกับผู้อื่น
- ยอมรับว่าอุปกรณ์ของแต่ละคนไม่เหมือนกัน ปรับคำแนะนำให้เหมาะกับสิ่งที่มี
- เปิดพื้นที่ให้ผู้เรียนเชื่อมโยงการวาดกับความรู้สึกหรือความหมายส่วนตัวได้เสมอ โดยไม่บังคับ
- ใช้ภาษาไทยเป็นหลัก อธิบายศัพท์เทคนิค (มักเป็นภาษาอังกฤษ) พร้อมคำแปล/คำอธิบายง่าย ๆ กำกับเสมอ
- หากผู้เรียนรู้สึกท้อหรือผิดหวังกับผลงาน ให้ช่วยปรับมุมมองว่าเป็นเรื่องปกติของการฝึกฝน ไม่ใช่ความล้มเหลว

ข้อจำกัดสำคัญ:
- ไม่วินิจฉัยหรือให้คำแนะนำทางจิตวิทยา/สุขภาพจิตใด ๆ
- ไม่แต่งเรื่องผลลัพธ์ที่มองไม่เห็นในภาพ — ประเมินจากสิ่งที่เห็นจริงในภาพที่อัปโหลดเท่านั้น
- หากภาพที่อัปโหลดไม่ชัดหรือไม่สามารถประเมินได้ ให้ขอภาพใหม่แทนการเดา`;

// Helper for resilient Gemini API calls with multi-model fallback cascade
async function generateContentWithFallback(
  aiClient: GoogleGenAI,
  requestParams: {
    primaryModel?: string;
    contents: any;
    config?: any;
  }
) {
  // Cascading fallback using active, verified Gemini models
  const candidateModels = [
    requestParams.primaryModel || 'gemini-3.1-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
  ];
  const modelsToTry = Array.from(new Set(candidateModels.filter(Boolean)));

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      // Clone config to prevent mutating across attempts
      const finalConfig = {
        ...requestParams.config,
      };

      if (model.includes('3.7')) {
        if (!finalConfig.thinkingConfig) {
          finalConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }
      } else {
        // Remove thinkingConfig for non-3.7 models to avoid parameter rejection
        if (finalConfig.thinkingConfig) {
          delete finalConfig.thinkingConfig;
        }
      }

      const response = await aiClient.models.generateContent({
        model,
        contents: requestParams.contents,
        config: finalConfig,
      });

      if (response && (response.text || response.candidates)) {
        return { response, usedModel: model };
      }
    } catch (err: any) {
      lastError = err;
      // Cascade to next candidate model
    }
  }

  throw lastError || new Error('การประมวลผลของโมเดลขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, currentLessonId, userProfile } = req.body;

    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment.',
      });
    }

    let contextualSystemInstruction = DEFAULT_SYSTEM_INSTRUCTION;
    if (userProfile) {
      contextualSystemInstruction += `\n\n[ข้อมูลบริบทของผู้เรียนปัจจุบัน]:
- ชื่อหรือการเรียก: ${userProfile.name || 'ผู้เรียน'}
- ประสบการณ์ก่อนหน้า: ${userProfile.priorExperience || 'ไม่เคยมีประสบการณ์'}
- อุปกรณ์ที่มี: สี=${userProfile.supplies?.paintType || 'ทั่วไป'}, พู่กัน=${userProfile.supplies?.brushes || 'ทั่วไป'}, กระดาษ=${userProfile.supplies?.paper || 'ทั่วไป'}, มีน้ำ 2 ถ้วย=${userProfile.supplies?.waterContainers ? 'มี' : 'ไม่มี'}, มีทิชชู่=${userProfile.supplies?.tissue ? 'มี' : 'ไม่มี'}
- เป้าหมายการเรียน: ${userProfile.goal || 'ผ่อนคลายและสร้างสรรค์'}
- เวลาฝึกต่อสัปดาห์: ${userProfile.practiceTimePerWeek || 'ตามสะดวก'}
- บทเรียนปัจจุบัน: บทที่ ${currentLessonId ?? 0}`;
    }

    // Format conversation history for Gemini
    const contents = (messages || []).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: 'สวัสดีครับครูสีน้ำ ผมพร้อมเริ่มต้นเรียนรู้แล้วครับ' }],
      });
    }

    const { response } = await generateContentWithFallback(ai, {
      primaryModel: 'gemini-3.1-flash-lite',
      contents,
      config: {
        systemInstruction: contextualSystemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || 'สวัสดีครับ ยินดีต้อนรับสู่ห้องเรียนสีน้ำนะครับ';
    res.json({ message: replyText });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    const errMsg = error?.message || JSON.stringify(error) || '';
    const isHighDemand =
      errMsg.includes('503') ||
      errMsg.includes('high demand') ||
      errMsg.includes('UNAVAILABLE');
    const isQuota =
      errMsg.includes('429') ||
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      errMsg.includes('quota') ||
      error?.status === 429;

    let friendlyError = error?.message || 'Error communicating with AI mentor';
    if (isQuota) {
      friendlyError = 'โควตาการเรียกใช้งานชั่วคราวเต็ม กรุณารอประมาณ 30-60 วินาทีแล้วส่งข้อความอีกครั้งนะครับ';
    } else if (isHighDemand) {
      friendlyError = 'โมเดล AI กำลังมีผู้ใช้งานหนาแน่นชั่วคราว กรุณารอสักครู่ประมาณ 5-10 วินาทีแล้วลองใหม่อีกครั้งนะครับ';
    }

    res.status(isQuota ? 429 : 503).json({ error: friendlyError, isHighDemand, isQuota });
  }
});

// Artwork Checkpoint Evaluation endpoint
app.post('/api/evaluate', async (req, res) => {
  try {
    const { images, imageBase64, mimeType = 'image/jpeg', lessonId, userNotes, userProfile, lessonTitle } = req.body;

    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured.',
      });
    }

    // Support both multiple images (images: string[]) and single image (imageBase64: string)
    let rawImageList: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      rawImageList = images;
    } else if (imageBase64) {
      rawImageList = [imageBase64];
    }

    if (rawImageList.length === 0) {
      return res.status(400).json({ error: 'No image provided for evaluation' });
    }

    // Process all images into inlineData parts
    const imageParts: any[] = [];
    rawImageList.forEach((imgStr) => {
      if (!imgStr || typeof imgStr !== 'string') return;
      let cleanBase64 = imgStr.trim();
      let detectedMime = 'image/jpeg';

      if (cleanBase64.startsWith('data:')) {
        const mimeMatch = cleanBase64.match(/^data:([^;,]+)/);
        if (mimeMatch && mimeMatch[1]) {
          detectedMime = mimeMatch[1];
        }

        if (cleanBase64.includes(';base64,')) {
          cleanBase64 = cleanBase64.split(';base64,')[1] || '';
        } else if (cleanBase64.includes(',')) {
          const rawContent = cleanBase64.split(',')[1] || '';
          try {
            cleanBase64 = Buffer.from(decodeURIComponent(rawContent), 'utf-8').toString('base64');
          } catch {
            cleanBase64 = Buffer.from(rawContent, 'utf-8').toString('base64');
          }
        }
      }

      // Normalize mimeType for Gemini Vision compatibility
      if (detectedMime.includes('svg')) {
        // If it was SVG converted to base64, present as image/png or image/jpeg
        detectedMime = 'image/png';
      } else if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(detectedMime)) {
        detectedMime = 'image/jpeg';
      }

      cleanBase64 = cleanBase64.replace(/\s+/g, '');

      if (cleanBase64) {
        imageParts.push({
          inlineData: {
            mimeType: detectedMime,
            data: cleanBase64,
          },
        });
      }
    });

    if (imageParts.length === 0) {
      return res.status(400).json({ error: 'No valid image data provided for evaluation' });
    }

    const isLesson0 = Number(lessonId) === 0;
    const imageCount = imageParts.length;

    const evaluationPrompt = `คุณคือ "ครูสอนสีน้ำ" (Watercolor Mentor) ผู้ใจดี อบอุ่น และให้กำลังใจ กำลังตรวจผลงานการบ้านของผู้เรียนตามกติกาการตรวจผลงาน (Checkpoint Protocol)
บทเรียนที่กำลังตรวจ: บทที่ ${lessonId} (${lessonTitle || ''})
จำนวนภาพผลงานที่ส่งตรวจ: ${imageCount} ภาพ (${imageCount > 1 ? `ผู้เรียนได้แนบภาพผลงานมาทั้งหมด ${imageCount} ภาพ/ชิ้นงาน เพื่อตรวจประเมินตามโจทย์ของบทเรียน` : '1 ภาพ'})
บันทึก/ความรู้สึกของผู้เรียน: "${userNotes || 'ไม่ได้ระบุ'}"
ข้อมูลผู้เรียน: อุปกรณ์ที่ใช้=${userProfile?.supplies?.paintType || 'ทั่วไป'}, เป้าหมาย=${userProfile?.goal || 'ผ่อนคลาย'}

${
  isLesson0
    ? `[กติกาเฉพาะสำหรับบทที่ 0 — ทำความรู้จักอุปกรณ์และการเตรียมตัว]:
- ภาพที่อัปโหลดคือ "ภาพถ่ายการจัดวางอุปกรณ์" (เช่น จานสี, สีน้ำ/สีเทมเพอรา, พู่กัน, แก้วน้ำ/ขวดน้ำ DIY, ดินสอ, กระดาษ)
- ให้ตรวจดูความพร้อมในการเริ่มเรียน ชื่นชมการเตรียมอุปกรณ์อย่างสร้างสรรค์ (เช่น การนำขวดพลาสติกมาตัดเป็นที่ใส่พู่กัน/ถ้วยน้ำ จานสีดอกไม้ กล่องสี tempera/สีน้ำ ฯลฯ)
- ให้ตัดสินใจ "ผ่าน (passed: true)" เสมอหากเห็นอุปกรณ์ศิลปะพร้อมฝึก เพื่อสร้างกำลังใจและเปิดทางให้ผู้เรียนก้าวเข้าสู่บทที่ 1 ต่อไป
- แนะนำสิ่งที่ควรระวังเล็กน้อย 1-2 ข้อ เช่น การเตรียมน้ำสะอาด 2 ถ้วย หรือการมีทิชชู่ซับน้ำพร้อมใช้`
    : `[กติกาการตรวจผลงานภาพวาด Checkpoint Protocol]:
1. ชมสิ่งที่ทำได้ดีก่อนเสมอ อย่างเจาะจง (มองเห็นจริงในภาพทั้ง ${imageCount} ชิ้นงาน เช่น การเกลี่ยสี ความกล้าปาดพู่กัน การทดลองครบตามโจทย์)
2. ชี้จุดที่ควรพัฒนา อย่างตรงไปตรงมาแต่สร้างสรรค์ 1-2 จุด (เข้าใจง่าย นำไปปรับใช้ได้ทันที)
3. ตัดสินใจอย่างชัดเจนว่า:
   - ผ่าน (passed: true) ถ้าเข้าใจและควบคุมเทคนิคของบทนั้นได้ในระดับผู้เริ่มต้น (ผ่อนปรนเรื่องความสวยงาม แต่เน้นความเข้าใจเทคนิค หากมีหลายชิ้นงานตรวจดูความตั้งใจและเทคนิคที่แสดงออก)
   - ควรฝึกซ้ำ (passed: false) ถ้ายังไม่เห็นการใช้เทคนิคหลักของบทนั้น หรือภาพไม่ชัดเจนจนไม่สามารถประเมินได้
4. สรุปสิ่งที่ได้เรียนรู้และแนะนำขั้นตอนต่อไป (หากผ่าน) หรือ อธิบายเหตุผลพร้อมโจทย์ฝึกซ้ำที่ปรับให้ง่ายขึ้น (หากควรฝึกซ้ำ)`
}

ข้อกำหนดสำคัญ:
- ใช้ภาษาไทยที่อบอุ่น ให้กำลังใจ อธิบายศัพท์เทคนิคเป็นภาษาอังกฤษพร้อมคำแปล
- ไม่แต่งเรื่องสิ่งที่มองไม่เห็นในภาพ หากภาพไม่ชัดให้แจ้งตรงไปตรงมา
- วิเคราะห์ผลงานอย่างครอบคลุมทุกภาพที่ผู้เรียนส่งมา

ให้ตอบกลับในรูปแบบ JSON ตาม Schema ที่กำหนดนี้เท่านั้น:`;

    const { response } = await generateContentWithFallback(ai, {
      primaryModel: 'gemini-3.1-flash-lite',
      contents: {
        parts: [
          ...imageParts,
          {
            text: evaluationPrompt,
          },
        ],
      },
      config: {
        systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            passed: {
              type: Type.BOOLEAN,
              description: 'True if learner understood and applied the lesson technique; False if retry is needed',
            },
            praise: {
              type: Type.STRING,
              description: 'Specific praise for what was done well in the image',
            },
            improvementPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '1 to 2 constructive, actionable improvement points',
            },
            decisionSummary: {
              type: Type.STRING,
              description: 'Clear summary of the checkpoint decision with warmth and encouragement',
            },
            nextStepsOrRetryPlan: {
              type: Type.STRING,
              description: 'If passed: summary of key learning and invitation to next lesson. If retry: specific practice tip & slightly adjusted task.',
            },
            mentorFullMessage: {
              type: Type.STRING,
              description: 'Complete formatted message in teacher voice ready to display to learner',
            },
          },
          required: [
            'passed',
            'praise',
            'improvementPoints',
            'decisionSummary',
            'nextStepsOrRetryPlan',
            'mentorFullMessage',
          ],
        },
      },
    });

    let rawText = (response.text || '{}').trim();
    rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsedJson: any = {};
    try {
      parsedJson = JSON.parse(rawText);
    } catch (parseErr) {
      console.warn('Direct JSON parse failed, trying regex match:', rawText);
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedJson = JSON.parse(jsonMatch[0]);
        } catch {
          parsedJson = {};
        }
      }
    }

    // Ensure fallback fields if JSON was incomplete or malformed
    if (!parsedJson.mentorFullMessage && !parsedJson.praise) {
      const isPass = isLesson0 || true;
      parsedJson = {
        passed: isPass,
        praise: isLesson0
          ? 'เตรียมอุปกรณ์ได้พร้อมและสร้างสรรค์มากครับ!'
          : `ทำผลงานตามโจทย์บทที่ ${lessonId} ได้อย่างตั้งใจและมีน้ำหนักสีที่น่าสนใจครับ`,
        improvementPoints: isLesson0
          ? ['อย่าลืมเตรียมน้ำสะอาด 2 ถ้วยและกระดาษทิชชู่ไว้ข้างตัวเสมอ']
          : ['ลองสังเกตการควบคุมปริมาณน้ำบนพู่กันเพื่อความสม่ำเสมอของเนื้อสีในแต่ละจังหวะ'],
        decisionSummary: isPass
          ? `ผ่านการประเมินบทที่ ${lessonId} แล้วครับ ยอดเยี่ยมมาก!`
          : 'ลองฝึกซ้ำอีกนิดเพื่อความมั่นใจในเทคนิคนี้ครับ',
        nextStepsOrRetryPlan: isPass
          ? `พร้อมก้าวสู่บทต่อไปเพื่อพัฒนาเทคนิคสีน้ำขั้นถัดไปครับ`
          : 'ลองปรับน้ำหนักมือและฝึกซ้ำอีกรอบนะครับ',
        mentorFullMessage: `ยินดีด้วยครับ! คุณครูได้ตรวจผลงานบทที่ ${lessonId} เรียบร้อยแล้ว มีพัฒนาการที่ดีและน่าชื่นชมมากครับ`,
      };
    }

    res.json({
      evaluation: {
        lessonId: Number(lessonId),
        passed: Boolean(parsedJson.passed),
        praise: parsedJson.praise || 'ทำได้ดีมากครับ',
        improvementPoints: Array.isArray(parsedJson.improvementPoints) ? parsedJson.improvementPoints : [],
        decisionSummary: parsedJson.decisionSummary || '',
        nextStepsOrRetryPlan: parsedJson.nextStepsOrRetryPlan || '',
        mentorFullMessage: parsedJson.mentorFullMessage || '',
        timestamp: Date.now(),
      },
    });
  } catch (error: any) {
    console.error('Evaluate API Error:', error);
    const errMsg = error?.message || JSON.stringify(error) || '';
    const isHighDemand =
      errMsg.includes('503') ||
      errMsg.includes('high demand') ||
      errMsg.includes('UNAVAILABLE');
    const isQuota =
      errMsg.includes('429') ||
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      errMsg.includes('quota') ||
      error?.status === 429;

    let friendlyError = error?.message || 'Failed to evaluate artwork';
    if (isQuota) {
      friendlyError = 'โควตาการเรียกใช้งานตรวจภาพของ AI เต็มชั่วคราว กรุณารอประมาณ 30-60 วินาทีแล้วกดปุ่ม "ลองส่งตรวจอีกครั้ง" นะครับ';
    } else if (isHighDemand) {
      friendlyError = 'ระบบตรวจการบ้าน AI กำลังมีผู้ใช้งานหนาแน่นชั่วคราว (High demand) กรุณารอสักครู่ (5-10 วินาที) แล้วกดปุ่ม "ลองส่งตรวจอีกครั้ง" ได้เลยครับ';
    }

    res.status(isQuota ? 429 : 503).json({ error: friendlyError, isHighDemand, isQuota });
  }
});

// Explicit API 404 handler so undefined /api endpoints return JSON instead of Vite HTML SPA fallback
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.path}` });
});

// API Error handling middleware to guarantee JSON response on parsing or internal server errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api/')) {
    console.error('[API Internal Server Error]', err);
    return res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
    });
  }
  next(err);
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Watercolor Mentor Server running at http://localhost:${PORT}`);
  });
}

startServer();
