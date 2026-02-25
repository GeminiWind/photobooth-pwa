import type { FrameTemplate } from "./types";

export const BUNDLED_FRAMES: FrameTemplate[] = [
  {
    id: "bundled-red",
    name: "Classic Red",
    source: "bundled",
    frameImagePathOrUrl: "frames/red.png",
    previewPathOrUrl: "frames/red.png",
    safeArea: { x: 0.08, y: 0.08, width: 0.84, height: 0.84 }
  },
  {
    id: "bundled-blue",
    name: "Ocean Blue",
    source: "bundled",
    frameImagePathOrUrl: "frames/blue.png",
    previewPathOrUrl: "frames/blue.png",
    safeArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 }
  },
  {
    id: "simple-frame",
    name: "Simple Frame",
    source: "bundled",
    frameImagePathOrUrl: "frames/cute-pastel-colors-frame-png.png",
    previewPathOrUrl: "frames/cute-pastel-colors-frame-png.png",
    safeArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 }
  }
];
