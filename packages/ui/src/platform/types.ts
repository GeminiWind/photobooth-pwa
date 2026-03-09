import type { FrameTemplate } from "@photobooth/core";

export type SavePhotoResponse = { absolutePath: string };

export type PhotoboothBridge = {
  listFrames: () => Promise<FrameTemplate[]>;
  pickFrameFile: () => Promise<string | null>;
  importFrame: (filePath: string) => Promise<FrameTemplate>;
  deleteFrame: (frameId: string) => Promise<void>;
  savePhoto: (pngBytes: ArrayBuffer, filenameHint: string) => Promise<SavePhotoResponse>;
  getSaveDirectory: () => Promise<string>;
  pickSaveDirectory: () => Promise<string | null>;
};

declare global {
  interface Window {
    photobooth?: PhotoboothBridge;
  }
}
