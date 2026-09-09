/**
 * Resilient API client for safe JSON communication with express backend.
 * Guarantees that HTML error pages, 503 spikes, or network interruptions
 * are handled gracefully with automatic retry and friendly Thai error messages.
 */

export async function safeApiPost<T = any>(
  url: string,
  body: any,
  retries = 1
): Promise<T> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

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
        // If 503 or 504 and we have retries left, wait briefly and retry
        if ((response.status === 503 || response.status === 504) && attempt < retries) {
          const delay = 600 + Math.random() * 300;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        const errorMsg =
          parsedData?.error ||
          parsedData?.message ||
          (rawText.startsWith('<!')
            ? `ระบบเซิร์ฟเวอร์กำลังประมวลผล กรุณารอสักครู่แล้วลองใหม่ครับ`
            : rawText.slice(0, 150) || `เกิดข้อผิดพลาด (${response.status})`);

        const customErr: any = new Error(errorMsg);
        customErr.status = response.status;
        customErr.data = parsedData;
        throw customErr;
      }

      if (!parsedData) {
        // If response.ok was 200 with raw text, wrap it or return
        if (rawText.trim().length > 0) {
          return { message: rawText } as unknown as T;
        }
        throw new Error('ระบบเซิร์ฟเวอร์ยังไม่ได้ส่งข้อมูลกลับมา กรุณาลองใหม่อีกครั้งครับ');
      }

      return parsedData as T;
    } catch (err: any) {
      lastError = err;
      if (attempt < retries && !err.status) {
        // Network-level error, retry once
        const delay = 500 + Math.random() * 300;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
}

export async function safeApiGet<T = any>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  } catch (networkError: any) {
    throw new Error(`ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้: ${networkError.message || 'Network error'}`);
  }

  const rawText = await response.text();
  try {
    return JSON.parse(rawText) as T;
  } catch {
    if (!response.ok) {
      throw new Error(`เกิดข้อผิดพลาด (${response.status})`);
    }
    throw new Error('รูปแบบข้อมูลตอบกลับไม่ถูกต้อง');
  }
}
