import type { FrameTemplate, NormalizedRect } from "./types";

export type OutputPreset = {
  width: number;
  height: number;
};

export const DEFAULT_OUTPUT_PRESET: OutputPreset = {
  width: 1200,
  height: 1800
};

export function validateNormalizedRect(rect: NormalizedRect): boolean {
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }
  if (rect.x < 0 || rect.y < 0) {
    return false;
  }
  if (rect.x + rect.width > 1 || rect.y + rect.height > 1) {
    return false;
  }
  return true;
}

export function validateFrameTemplate(frame: FrameTemplate): boolean {
  if (!frame.id.trim() || !frame.name.trim() || !frame.frameImagePathOrUrl.trim()) {
    return false;
  }
  return validateNormalizedRect(frame.safeArea);
}

export function toPixelRect(rect: NormalizedRect, width: number, height: number) {
  return {
    x: Math.round(rect.x * width),
    y: Math.round(rect.y * height),
    width: Math.round(rect.width * width),
    height: Math.round(rect.height * height)
  };
}

export function computeCoverFit(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
) {
  const srcRatio = srcWidth / srcHeight;
  const targetRatio = targetWidth / targetHeight;

  if (srcRatio > targetRatio) {
    const drawHeight = targetHeight;
    const drawWidth = drawHeight * srcRatio;
    return {
      dx: (targetWidth - drawWidth) / 2,
      dy: 0,
      dw: drawWidth,
      dh: drawHeight
    };
  }

  const drawWidth = targetWidth;
  const drawHeight = drawWidth / srcRatio;
  return {
    dx: 0,
    dy: (targetHeight - drawHeight) / 2,
    dw: drawWidth,
    dh: drawHeight
  };
}
