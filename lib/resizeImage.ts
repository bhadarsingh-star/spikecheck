// Shrinks a phone photo in the browser so the upload is small and fast.
// Returns a JPEG as base64 (without the "data:" prefix), or throws if the
// browser can't open the file (for example, a corrupt file).

const MAX_SIDE = 1024;

function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("unreadable"));
    el.src = url;
  }).finally(() => URL.revokeObjectURL(url));
}

// iPhone HEIC photos open in Safari but not in Chrome on a computer.
// When the browser can't open one, convert it to JPEG first. The converter
// is large, so it only loads when it's needed.
async function openPhoto(file: File): Promise<HTMLImageElement> {
  try {
    return await loadImage(file);
  } catch (error) {
    if (!isHeic(file)) throw error;
    const { default: heic2any } = await import("heic2any");
    const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    return loadImage(Array.isArray(converted) ? converted[0] : converted);
  }
}

export async function resizeImage(file: File): Promise<string> {
  const img = await openPhoto(file);

  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
}
