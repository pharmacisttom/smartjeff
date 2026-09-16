export interface WatermarkMetadata {
  employeeName: string;
  timestamp: Date | string;
  lat: number;
  lng: number;
  siteName: string;
}

/**
 * Compress photo file/blob to WebP format and stamp watermark
 */
export async function compressAndWatermarkPhoto(
  imageSource: Blob | File | HTMLImageElement | string,
  metadata: WatermarkMetadata,
  maxWidth: number = 1280,
  quality: number = 0.8
): Promise<{ blob: Blob; dataUrl: string; hash: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = async () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Cannot get canvas context"));
        return;
      }

      // Draw original image resized
      ctx.drawImage(img, 0, 0, width, height);

      // Draw Watermark Overlay Bar at bottom left
      const barHeight = Math.max(50, Math.round(height * 0.1));
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.fillRect(0, height - barHeight, width, barHeight);

      // Watermark Text styling
      const fontSize = Math.max(14, Math.round(height * 0.026));
      ctx.font = `600 ${fontSize}px "IBM Plex Sans Thai", sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textBaseline = "middle";

      const timeStr = typeof metadata.timestamp === "string" 
        ? metadata.timestamp 
        : metadata.timestamp.toLocaleString("th-TH");
      
      const line1 = `📍 ${metadata.siteName} | ${metadata.employeeName}`;
      const line2 = `⏰ ${timeStr} | GPS: ${metadata.lat.toFixed(5)}, ${metadata.lng.toFixed(5)}`;

      const padding = 15;
      const lineY1 = height - barHeight + (barHeight / 3);
      const lineY2 = height - barHeight + (barHeight * 2 / 3);

      ctx.fillText(line1, padding, lineY1);
      ctx.fillStyle = "#34d399"; // emerald color for GPS/Time line
      ctx.fillText(line2, padding, lineY2);

      // Convert Canvas to WebP Blob
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image canvas to Blob"));
            return;
          }
          const dataUrl = canvas.toDataURL("image/webp", quality);
          const hash = await generatePhotoHash(blob);

          resolve({ blob, dataUrl, hash });
        },
        "image/webp",
        quality
      );
    };

    img.onerror = (err) => reject(err);

    if (typeof imageSource === "string") {
      img.src = imageSource;
    } else if (imageSource instanceof Blob || imageSource instanceof File) {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}

/**
 * Generate SHA-256 hash of a Blob for idempotency duplicate prevention
 */
export async function generatePhotoHash(blob: Blob): Promise<string> {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    const arrayBuffer = await blob.arrayBuffer();
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback hash based on size and timestamp
  return `hash_${blob.size}_${Date.now()}`;
}
