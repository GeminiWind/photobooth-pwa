import { computeCoverFit, toPixelRect, type OutputPreset } from "./frame";
import type { NormalizedRect } from "./types";

async function imageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

export async function composeFrame(
  video: HTMLVideoElement,
  frameImageUrl: string,
  safeArea: NormalizedRect,
  preset: OutputPreset
): Promise<{ rawBlob: Blob; compositedBlob: Blob }> {
  const canvas = document.createElement("canvas");
  canvas.width = preset.width;
  canvas.height = preset.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to create drawing context");
  }

  const safe = toPixelRect(safeArea, preset.width, preset.height);
  const fit = computeCoverFit(video.videoWidth, video.videoHeight, safe.width, safe.height);

  ctx.fillStyle = "#101018";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, safe.x + fit.dx, safe.y + fit.dy, fit.dw, fit.dh);

  const rawBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode raw image"))), "image/png");
  });

  const frameImg = await imageFromUrl(frameImageUrl);
  const frameFit = computeCoverFit(frameImg.width, frameImg.height, preset.width, preset.height);
  ctx.drawImage(frameImg, frameFit.dx, frameFit.dy, frameFit.dw, frameFit.dh);

  const compositedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode composited image"))), "image/png");
  });

  return { rawBlob, compositedBlob };
}
