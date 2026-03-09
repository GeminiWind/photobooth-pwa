export type FrameSource = "bundled" | "user";

export type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FrameTemplate = {
  id: string;
  name: string;
  source: FrameSource;
  frameImagePathOrUrl: string;
  previewPathOrUrl?: string;
  safeArea: NormalizedRect;
};

export type CaptureSettings = {
  countdownSeconds: number;
  selectedFrameId: string;
  cameraDeviceId?: string;
  mirrorPreview: boolean;
  photoSequence: 'single' | '3photos' | '4photos' | '5photos';
  screenFlash: boolean;
};

export type CaptureResult = {
  rawImageBlob?: Blob;
  compositedImageBlob?: Blob;
  savedPath?: string;
  savedAt: string;
};
