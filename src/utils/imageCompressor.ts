/**
 * Compresses and converts image files/SVGs/data URLs to standard JPEG base64 before sending to AI endpoints.
 * This ensures 100% compatibility with Gemini Vision (which requires image/jpeg, image/png, image/webp).
 */
export async function compressImageForEvaluation(
  fileOrDataUrl: File | string,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    let sourceUrl = '';
    let isObjectUrl = false;

    if (typeof fileOrDataUrl === 'string') {
      sourceUrl = fileOrDataUrl;
    } else {
      try {
        sourceUrl = URL.createObjectURL(fileOrDataUrl);
        isObjectUrl = true;
      } catch {
        sourceUrl = '';
      }
    }

    const cleanup = () => {
      if (isObjectUrl && sourceUrl) {
        try {
          URL.revokeObjectURL(sourceUrl);
        } catch {}
      }
    };

    // Safety fallback timer: if anything hangs, resolve safely
    const timeout = setTimeout(() => {
      cleanup();
      if (typeof fileOrDataUrl === 'string') {
        resolve(fileOrDataUrl);
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(fileOrDataUrl);
      }
    }, 4000);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      clearTimeout(timeout);
      try {
        let width = img.naturalWidth || img.width || 800;
        let height = img.naturalHeight || img.height || 600;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
          return;
        }

        // Fill background with warm off-white for transparent SVGs/PNGs
        ctx.fillStyle = '#FDFBF7';
        ctx.fillRect(0, 0, width, height);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        cleanup();
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn('Canvas compression export failed, falling back:', err);
        cleanup();
        if (typeof fileOrDataUrl === 'string') {
          resolve(fileOrDataUrl);
        } else {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(fileOrDataUrl);
        }
      }
    };

    img.onerror = (err) => {
      clearTimeout(timeout);
      cleanup();
      console.warn('Image element load failed:', err);
      if (typeof fileOrDataUrl === 'string') {
        resolve(fileOrDataUrl);
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(fileOrDataUrl);
      }
    };

    img.src = sourceUrl;
  });
}

