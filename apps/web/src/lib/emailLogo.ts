const RASTER_DATA_URL = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i;

/**
 * Rasterize an image data URL (PNG, JPEG, GIF, WebP, SVG, …) to a PNG data URL
 * suitable for inline email `<img src="…">`.
 *
 * Uses `fetch` + `createImageBitmap` first (often succeeds where SVG + canvas taint fails).
 * If conversion fails but the source is already a raster data URL, returns it unchanged
 * so emails can still show the logo.
 */
export async function dataUrlToEmailPngDataUrl(
  dataUrl: string,
  maxWidth = 320,
): Promise<string | null> {
  if (!dataUrl.startsWith('data:image/')) return null;

  async function toPngFromBitmap(blob: Blob): Promise<string | null> {
    let bmp: ImageBitmap | null = null;
    try {
      bmp = await createImageBitmap(blob);
      const nw = bmp.width;
      const nh = bmp.height;
      if (!nw || !nh) return null;
      const w = Math.min(maxWidth, nw);
      const h = Math.max(1, Math.round((nh / nw) * w));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(bmp, 0, 0, w, h);
      return canvas.toDataURL('image/png');
    } catch {
      return null;
    } finally {
      bmp?.close();
    }
  }

  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const fromFetch = await toPngFromBitmap(blob);
    if (fromFetch) return fromFetch;
  } catch {
    /* fall through */
  }

  const fromImage = await new Promise<string | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const nw = img.naturalWidth || img.width;
      const nh = img.naturalHeight || img.height;
      if (!nw || !nh) {
        resolve(null);
        return;
      }
      const w = Math.min(maxWidth, nw);
      const h = Math.max(1, Math.round((nh / nw) * w));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      try {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });

  if (fromImage) return fromImage;

  if (RASTER_DATA_URL.test(dataUrl)) {
    return dataUrl;
  }

  return null;
}
