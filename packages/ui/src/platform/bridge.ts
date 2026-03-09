import { BUNDLED_FRAMES, type FrameTemplate } from "@photobooth/core";
import type { PhotoboothBridge } from "./types";

const USER_FRAMES_KEY = "photobooth_user_frames";

function parseStoredFrames(): FrameTemplate[] {
  try {
    const raw = localStorage.getItem(USER_FRAMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FrameTemplate[]) : [];
  } catch {
    return [];
  }
}

function storeUserFrames(frames: FrameTemplate[]) {
  localStorage.setItem(USER_FRAMES_KEY, JSON.stringify(frames));
}

export function isElectronRuntime(): boolean {
  return Boolean(window.photobooth);
}

export async function listFrames(): Promise<FrameTemplate[]> {
  const bridge = window.photobooth as PhotoboothBridge | undefined;
  if (bridge) {
    return bridge.listFrames();
  }
  return [...BUNDLED_FRAMES, ...parseStoredFrames()];
}

export async function importFrameFromPath(filePath: string): Promise<FrameTemplate> {
  const bridge = window.photobooth as PhotoboothBridge | undefined;
  if (!bridge) {
    throw new Error("Frame path import is only available in desktop mode");
  }
  return bridge.importFrame(filePath);
}

export async function pickDesktopFramePath(): Promise<string | null> {
  const bridge = window.photobooth as PhotoboothBridge | undefined;
  if (!bridge) {
    throw new Error("Frame picker is only available in desktop mode");
  }
  return bridge.pickFrameFile();
}

export async function importFrameFromWebFile(file: File): Promise<FrameTemplate> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read frame"));
    reader.readAsDataURL(file);
  });

  const frame: FrameTemplate = {
    id: `user-${Date.now()}`,
    name: file.name.replace(/\.[^.]+$/, ""),
    source: "user",
    frameImagePathOrUrl: dataUrl,
    previewPathOrUrl: dataUrl,
    safeArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 }
  };

  const next = [...parseStoredFrames(), frame];
  storeUserFrames(next);
  return frame;
}

export async function deleteImportedFrame(frameId: string): Promise<void> {
  const bridge = window.photobooth as PhotoboothBridge | undefined;
  if (bridge) {
    await bridge.deleteFrame(frameId);
    return;
  }
  const next = parseStoredFrames().filter((frame) => frame.id !== frameId);
  storeUserFrames(next);
}

export async function savePhoto(blob: Blob, filenameHint: string): Promise<{ pathLabel: string }> {
  const buffer = await blob.arrayBuffer();
  const bridge = window.photobooth as PhotoboothBridge | undefined;
  if (bridge) {
    const result = await bridge.savePhoto(buffer, filenameHint);
    return { pathLabel: result.absolutePath };
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filenameHint;
  anchor.click();
  URL.revokeObjectURL(url);
  return { pathLabel: filenameHint };
}

export async function getSaveDirectory(): Promise<string> {
  const bridge = window.photobooth as PhotoboothBridge | undefined;
  if (bridge) {
    return bridge.getSaveDirectory();
  }
  return "Browser Downloads";
}

export async function pickSaveDirectory(): Promise<string | null> {
  const bridge = window.photobooth as PhotoboothBridge | undefined;
  if (!bridge) {
    throw new Error("Changing the save folder is only available in desktop mode");
  }
  return bridge.pickSaveDirectory();
}
