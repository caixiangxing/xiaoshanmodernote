export function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        // TODO: Switch to S3/OSS upload for production
        const base64 = canvas.toDataURL(mimeType, quality);
        resolve(base64);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function extractTextFromJSON(json: any): string {
  if (!json) return '';

  if (typeof json === 'string') {
    try {
      const parsed = JSON.parse(json);
      return extractTextFromJSON(parsed);
    } catch {
      return json.replace(/<[^>]*>/g, '');
    }
  }

  if (json.type === 'text') {
    return json.text || '';
  }

  if (json.content && Array.isArray(json.content)) {
    return json.content.map(extractTextFromJSON).join('\n');
  }

  return '';
}

export function isJSONContent(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return typeof parsed === 'object' && parsed !== null && 'type' in parsed;
  } catch {
    return false;
  }
}
