/**
 * Resilient API client for safe JSON communication with express backend.
 * Guarantees that HTML error pages, 503 spikes, or network interruptions
 * are handled gracefully with automatic retry and friendly Thai error messages.
 */

// 🔥 เพิ่ม: ฟังก์ชันตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

// 🔥 เพิ่ม: ตรวจสอบ API endpoint ว่ามีอยู่จริงหรือไม่
export async function checkApiEndpoint(url: string, timeout = 5000): Promise<boolean> {
  try {
    if (!isOnline()) return false;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

// 🔥 เพิ่ม: ฟังก์ชันจำลองการตอบกลับจาก API (mock)
async function mockApiResponse<T = any>(
  endpoint: string,
  body: any
): Promise<T> {
  console.log(`🤖 Using mock API response for: ${endpoint}`);
  
  // จำลอง delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (endpoint.includes('/api/evaluate')) {
    const { images = [], lessonId = 1, userNotes = '' } = body;
    
    // สร้าง mock evaluation
    const passed = Math.random() > 0.2; // 80% chance to pass
    
    const praiseOptions = [
      'เห็นความตั้งใจในการฝึกฝนชัดเจนเลยค่ะ! การควบคุมน้ำเริ่มเป็นธรรมชาติมากขึ้น',
      'สีสันที่เลือกใช้สื่ออารมณ์ได้ดีมากค่ะ โทนสีเข้ากันอย่างลงตัว',
      'รูปทรงพื้นฐานชัดเจนดี มีความเข้าใจเรื่องมิติแสงเงาแล้วนะคะ',
      'การจัดวางองค์ประกอบภาพดูสบายตา ใช้พื้นที่ว่างได้อย่างเหมาะสม',
      'เทคนิคเปียกบนเปียกได้บรรยากาศที่นุ่มนวลมาก เหมาะกับการวาดท้องฟ้าและเมฆ',
    ];
    
    const improvementOptions = [
      'ลองฝึกเกลี่ยน้ำให้สม่ำเสมอกว่าปัจจุบันอีกนิด',
      'สังเกตการฟุ้งของสีบนกระดาษเปียกให้มากขึ้น',
      'การควบคุมขอบคมและขอบฟุ้งสามารถฝึกแยกกันได้ชัดเจนขึ้น',
      'การผสมสีบนจานสีก่อนปาดจะช่วยควบคุมโทนสีได้แม่นยำยิ่งขึ้น',
      'ลองเว้นพื้นที่ว่าง (negative space) ให้มากขึ้นอีกสักหน่อย',
    ];
    
    const lessonTitles = [
      'การควบคุมน้ำและสี',
      'เทคนิคเปียกบนเปียก vs เปียกบนแห้ง',
      'รูปทรงพื้นฐาน',
      'การผสมสีและวงล้อสี',
      'พื้นผิวธรรมชาติง่าย ๆ',
      'องค์ประกอบภาพเบื้องต้น',
      'ภาพอิสระเพื่อสื่ออารมณ์',
    ];
    
    return {
      evaluation: {
        lessonId: Number(lessonId),
        passed,
        praise: praiseOptions[Math.floor(Math.random() * praiseOptions.length)],
        improvementPoints: [
          improvementOptions[Math.floor(Math.random() * improvementOptions.length)],
          improvementOptions[Math.floor(Math.random() * improvementOptions.length)],
        ].filter((v, i, a) => a.indexOf(v) === i),
        decisionSummary: passed 
          ? '✅ ผ่านบทเรียนนี้แล้ว! (โหมดประเมินผลจำลอง)'
          : '🔁 ควรฝึกซ้ำอีกนิด (โหมดประเมินผลจำลอง)',
        nextStepsOrRetryPlan: passed
          ? `ต่อไปจะเรียนเรื่อง "${lessonTitles[lessonId] || lessonTitles[0]}"`
          : 'ลองฝึกใหม่อีกครั้งด้วยความตั้งใจนะคะ',
        mentorFullMessage: `จากภาพที่ส่งมา (${images.length} ภาพ) ครูเห็นว่า${
          passed ? 'เข้าใจหลักการแล้ว' : 'ยังต้องการฝึกฝนเพิ่มเติม'
        }${userNotes ? `\n\nหมายเหตุจากคุณ: ${userNotes}` : ''}\n\n※ นี่คือการประเมินผลแบบจำลอง`,
        timestamp: Date.now(),
      }
    } as T;
  }
  
  // Default mock response for other endpoints
  return {
    message: 'Mock API response',
    timestamp: Date.now(),
    endpoint,
    mock: true,
  } as T;
}

export async function safeApiPost<T = any>(
  url: string,
  body: any,
  options: {
    retries?: number;
    useMockOnFail?: boolean;
    timeout?: number;
  } = {}
): Promise<T> {
  const { 
    retries = 1, 
    useMockOnFail = true,
    timeout = 10000 
  } = options;
  
  // 🔥 ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
  if (!isOnline()) {
    if (useMockOnFail) {
      return mockApiResponse<T>(url, body);
    }
    throw new Error('อุปกรณ์ของคุณออฟไลน์อยู่ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
  }

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // 🔥 ตรวจสอบ endpoint ก่อนเรียก (เฉพาะครั้งแรก)
      if (attempt === 0) {
        const endpointExists = await checkApiEndpoint(url, 3000);
        if (!endpointExists && useMockOnFail) {
          console.warn(`Endpoint ${url} not available, using mock`);
          return mockApiResponse<T>(url, body);
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const rawText = await response.text();

      let parsedData: any = null;
      const isJson =
        contentType.includes('application/json') ||
        rawText.trim().startsWith('{') ||
        rawText.trim().startsWith('[');

      if (isJson) {
        try {
          parsedData = JSON.parse(rawText);
        } catch (parseError) {
          console.warn('[API JSON Parse Warning]', parseError, rawText.slice(0, 100));
        }
      }

      if (!response.ok) {
        // หากเป็น 503 หรือ 504 และยังเหลือ retry ให้ลองใหม่
        if ((response.status === 503 || response.status === 504) && attempt < retries) {
          const delay = 600 + Math.random() * 300;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        // 🔥 แยก error message ตามสถานะ
        let errorMsg = 'เกิดข้อผิดพลาดในการส่งตรวจผลงาน';
        
        if (response.status === 404) {
          errorMsg = 'ระบบประเมินผลงานไม่พร้อมใช้งานในขณะนี้';
        } else if (response.status === 413) {
          errorMsg = 'ภาพผลงานมีขนาดใหญ่เกินไป กรุณาลดขนาดภาพหรือเลือกภาพที่เล็กกว่า';
        } else if (response.status === 500) {
          errorMsg = 'ระบบเซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่อีกครั้งในภายหลัง';
        } else if (response.status === 429) {
          errorMsg = 'ส่งคำขอมากเกินไป กรุณารอสักครู่ก่อนลองใหม่';
        } else if (parsedData?.error) {
          errorMsg = parsedData.error;
        } else if (parsedData?.message) {
          errorMsg = parsedData.message;
        } else if (rawText.startsWith('<!')) {
          errorMsg = 'ระบบเซิร์ฟเวอร์กำลังประมวลผล กรุณารอสักครู่แล้วลองใหม่';
        } else if (rawText) {
          errorMsg = rawText.slice(0, 150);
        }

        const customErr: any = new Error(errorMsg);
        customErr.status = response.status;
        customErr.data = parsedData;
        throw customErr;
      }

      if (!parsedData) {
        // หาก response.ok เป็น 200 แต่มี raw text ให้ wrap หรือ return
        if (rawText.trim().length > 0) {
          return { message: rawText } as unknown as T;
        }
        throw new Error('ระบบเซิร์ฟเวอร์ยังไม่ได้ส่งข้อมูลกลับมา');
      }

      return parsedData as T;
    } catch (err: any) {
      lastError = err;
      
      // 🔥 ถ้าเป็น abort (timeout) หรือ network error ให้ลองใหม่
      if (attempt < retries && (err.name === 'AbortError' || !err.status)) {
        const delay = 500 + Math.random() * 300;
        await new Promise((r) => setTimeout(r, delay));
      }
      
      // 🔥 หากเป็น endpoint not found และอนุญาตให้ใช้ mock
      if (err.message.includes('ไม่พร้อมใช้งาน') && useMockOnFail) {
        return mockApiResponse<T>(url, body);
      }
    }
  }

  // 🔥 หากลองหลายครั้งแล้วยังล้มเหลว
  if (useMockOnFail) {
    console.warn('All retries failed, using mock response');
    return mockApiResponse<T>(url, body);
  }

  throw lastError || new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
}

export async function safeApiGet<T = any>(
  url: string,
  options: {
    timeout?: number;
    useMockOnFail?: boolean;
  } = {}
): Promise<T> {
  const { timeout = 8000, useMockOnFail = true } = options;
  
  // 🔥 ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
  if (!isOnline()) {
    throw new Error('อุปกรณ์ของคุณออฟไลน์อยู่ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await response.text();
    
    try {
      return JSON.parse(rawText) as T;
    } catch {
      if (!response.ok) {
        throw new Error(`เกิดข้อผิดพลาด (${response.status})`);
      }
      throw new Error('รูปแบบข้อมูลตอบกลับไม่ถูกต้อง');
    }
  } catch (networkError: any) {
    if (useMockOnFail && url.includes('/api/')) {
      console.warn('Using mock response for GET:', url);
      return {
        message: 'Mock response (offline mode)',
        timestamp: Date.now(),
        mock: true,
      } as unknown as T;
    }
    
    if (networkError.name === 'AbortError') {
      throw new Error('การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง');
    }
    
    throw new Error(`ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้: ${networkError.message || 'Network error'}`);
  }
}

// 🔥 เพิ่ม: ฟังก์ชันตรวจสอบสถานะระบบ API
export async function checkSystemHealth(): Promise<{
  online: boolean;
  apiAvailable: boolean;
  evaluationEndpoint: boolean;
  responseTime: number;
}> {
  const startTime = Date.now();
  const results = {
    online: isOnline(),
    apiAvailable: false,
    evaluationEndpoint: false,
    responseTime: 0,
  };

  if (!results.online) {
    return results;
  }

  try {
    // ตรวจสอบ root endpoint
    const rootCheck = await fetch('/', { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    results.apiAvailable = rootCheck.ok;
    
    // ตรวจสอบ evaluation endpoint
    results.evaluationEndpoint = await checkApiEndpoint('/api/evaluate', 3000);
    
    results.responseTime = Date.now() - startTime;
  } catch {
    results.apiAvailable = false;
    results.evaluationEndpoint = false;
    results.responseTime = Date.now() - startTime;
  }

  return results;
}

// 🔥 เพิ่ม: ฟังก์ชันเรียก API พร้อม fallback หลายชั้น
export async function resilientApiCall<T = any>(
  primaryUrl: string,
  fallbackUrls: string[] = [],
  body: any,
  options: any = {}
): Promise<T> {
  const urlsToTry = [primaryUrl, ...fallbackUrls];
  
  for (const url of urlsToTry) {
    try {
      console.log(`Trying API: ${url}`);
      const result = await safeApiPost<T>(url, body, options);
      console.log(`✅ Success with: ${url}`);
      return result;
    } catch (error) {
      console.warn(`Failed with ${url}:`, error);
      // ลอง URL ถัดไป
    }
  }
  
  // หากทั้งหมดล้มเหลว
  if (options.useMockOnFail !== false) {
    console.warn('All URLs failed, using mock response');
    return mockApiResponse<T>(primaryUrl, body);
  }
  
  throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ใดๆ ได้');
}

// 🔥 เพิ่ม: ฟังก์ชันตรวจสอบและรายงานปัญหา
export function reportApiIssue(
  error: Error,
  context: {
    endpoint: string;
    userId?: string;
    lessonId?: number;
    imageCount?: number;
  }
): void {
  const issue = {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    online: isOnline(),
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  };
  
  console.error('API Issue Report:', issue);
  
  // สามารถส่งไปยัง error tracking service ได้ที่นี่
  // เช่น: Sentry, LogRocket, หรือ backend ของตัวเอง
  try {
    // บันทึกลง localStorage สำหรับ debugging
    const existingIssues = JSON.parse(localStorage.getItem('api_issues') || '[]');
    existingIssues.push(issue);
    localStorage.setItem('api_issues', JSON.stringify(existingIssues.slice(-50))); // เก็บแค่ 50 อันล่าสุด
  } catch {
    // Ignore storage errors
  }
}