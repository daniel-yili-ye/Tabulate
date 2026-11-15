const MAX_EDGE = 1600;

/**
 * Shrink a photo to a size that uploads quickly and is still easy to read,
 * re-encoding it as JPEG. This also strips EXIF data such as GPS location and
 * guarantees every stored receipt can be displayed in any browser.
 */
export async function toJpeg(file: File): Promise<Blob> {
  let blob: Blob | null = null;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
  } catch {
    // Not an image this browser can decode (for example HEIC outside Safari).
  }

  if (!blob) {
    throw new Error("We couldn't open that photo. Try a JPG or PNG instead.");
  }
  return blob;
}
