# PhotoBooth PWA + Electron

A shared React + TypeScript photobooth app that runs as:
- Installable web PWA
- Electron desktop app (macOS/Windows target)

## Features

- Camera preview with device picker
- 3-second countdown capture flow
- Frame selection before capture
- Composited PNG output (camera image + selected frame)
- Save output locally (Electron: `~/Pictures/Photobooth`)
- Result preview with retake
- Bundled frames + user frame import
- PWA manifest + service worker + offline fallback page

## Monorepo Layout

- `apps/web`: Vite web app shell and PWA assets
- `apps/desktop`: Electron main/preload and packaging
- `packages/core`: shared types and core logic
- `packages/ui`: shared React UI and platform bridge

## Key Types

From `@photobooth/core`:
- `FrameTemplate`
- `CaptureSettings`
- `CaptureResult`

IPC contract exposed by preload (`window.photobooth`):
- `listFrames(): Promise<FrameTemplate[]>`
- `importFrame(filePath: string): Promise<FrameTemplate>`
- `savePhoto(pngBytes: Uint8Array, filenameHint: string): Promise<{ absolutePath: string }>`
- `getSaveDirectory(): Promise<string>`

## Setup

```bash
npm install
```

## Development

Run web PWA:

```bash
npm run dev:web
```

Run Electron desktop + web dev server:

```bash
npm run dev:desktop
```

## Build

Build web assets:

```bash
npm run build:web
```

Build Electron distributables (dmg + nsis target config):

```bash
npm run build:desktop
```

## Validation

Typecheck all workspaces:

```bash
npm run typecheck
```

Run tests:

```bash
npm test
```

## Camera Permissions

- Browser mode requires camera permission and secure context rules.
- Desktop mode uses Chromium camera permissions inside Electron.

If capture fails:
- verify camera permission is granted
- ensure another app is not locking the camera
- switch camera in the picker

## Frame Import

- Bundled frames are included in `apps/web/public/frames`
- Web mode import uses file input and stores frame data in localStorage
- Electron mode import currently prompts for an absolute PNG path and stores a managed copy in app data

## Save Behavior

- Electron writes PNGs to `~/Pictures/Photobooth`
- Filename pattern: `YYYYMMDD_HHMMSS.png`
- Collision handling: appends `_1`, `_2`, etc.
- Web mode triggers browser download with the same filename pattern

## Notes

- Linux packaging is out of scope for v1.
- Auto-print and cloud upload are out of scope for v1.
