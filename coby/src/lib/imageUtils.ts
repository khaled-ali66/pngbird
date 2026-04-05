
/**
 * Compresses a data URL image to a smaller size to fit within Firestore's 1MB limit.
 * @param dataUrl The source data URL
 * @param maxWidth Maximum width of the compressed image
 * @param quality Quality of the output (0 to 1)
 * @returns A promise that resolves to the compressed data URL
 */
export async function compressImage(dataUrl: string, maxWidth = 800, quality = 0.7): Promise<string> {
  if (!dataUrl) {
    throw new Error('compressImage: No data URL provided');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width === 0 || height === 0) {
          reject(new Error('compressImage: Image has zero dimensions'));
          return;
        }

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('compressImage: Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        const compressed = canvas.toDataURL('image/png');
        
        if (compressed.length > 950000) {
          // If still too large, try smaller width
          resolve(compressImage(dataUrl, Math.floor(maxWidth * 0.7), quality));
        } else {
          resolve(compressed);
        }
      } catch (err) {
        reject(err instanceof Error ? err : new Error('compressImage: Unknown error during compression'));
      }
    };
    img.onerror = () => {
      reject(new Error('compressImage: Failed to load image for compression. The data URL might be invalid or too large.'));
    };
    img.src = dataUrl;
  });
}
