import { app, BrowserWindow, dialog, ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import {
  BUNDLED_FRAMES,
  buildPhotoFilename,
  resolveCollision,
  type FrameTemplate
} from "../../../packages/core/src/index";

type UserFrameRecord = FrameTemplate & { fileName?: string };
type AppPreferences = {
  saveDirectory?: string;
};

function userFramesRoot() {
  return path.join(app.getPath("userData"), "frames");
}

function userFramesDb() {
  return path.join(userFramesRoot(), "frames.json");
}

function preferencesPath() {
  return path.join(app.getPath("userData"), "preferences.json");
}

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readUserFrames(): Promise<UserFrameRecord[]> {
  await ensureDir(userFramesRoot());
  try {
    const value = await fs.readFile(userFramesDb(), "utf8");
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as UserFrameRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeUserFrames(frames: UserFrameRecord[]) {
  await ensureDir(userFramesRoot());
  await fs.writeFile(userFramesDb(), JSON.stringify(frames, null, 2), "utf8");
}

function getDefaultSaveDirectory() {
  return path.join(app.getPath("pictures"), "Photobooth");
}

async function readPreferences(): Promise<AppPreferences> {
  try {
    const raw = await fs.readFile(preferencesPath(), "utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as AppPreferences) : {};
  } catch {
    return {};
  }
}

async function writePreferences(preferences: AppPreferences) {
  await ensureDir(app.getPath("userData"));
  await fs.writeFile(preferencesPath(), JSON.stringify(preferences, null, 2), "utf8");
}

async function resolveWritableSaveDirectory(): Promise<string> {
  const preferences = await readPreferences();
  const candidates = [
    preferences.saveDirectory,
    getDefaultSaveDirectory(),
    path.join(app.getPath("documents"), "Photobooth"),
    path.join(app.getPath("userData"), "Photobooth")
  ].filter((value): value is string => Boolean(value));

  let lastError: unknown;
  for (const dir of candidates) {
    try {
      await ensureDir(dir);
      const probe = path.join(dir, `.write-test-${Date.now()}.tmp`);
      await fs.writeFile(probe, "");
      await fs.rm(probe, { force: true });
      return dir;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("No writable save directory available.");
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js")
    }
  });

  const debugEnabled = process.argv.includes("--debug") || process.env.ELECTRON_DEBUG === "1";
  if (debugEnabled) {
    window.webContents.openDevTools({ mode: "detach" });
  }

  window.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error("Renderer failed to load", { errorCode, errorDescription, validatedURL });
  });

  window.webContents.on("render-process-gone", (_event, details) => {
    console.error("Renderer process gone", details);
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    await window.loadURL(devServerUrl);
    return;
  }

  const appHtml = path.join(__dirname, "../../../web/dist/index.html");
  await window.loadFile(appHtml);
}

ipcMain.handle("photobooth:listFrames", async () => {
  const userFrames = await readUserFrames();
  return [...BUNDLED_FRAMES, ...userFrames];
});

ipcMain.handle("photobooth:pickFrameFile", async () => {
  const result = await dialog.showOpenDialog({
    title: "Select PNG Frame",
    properties: ["openFile"],
    filters: [{ name: "PNG Images", extensions: ["png"] }]
  });
  if (result.canceled) {
    return null;
  }
  return result.filePaths[0] ?? null;
});

ipcMain.handle("photobooth:importFrame", async (_event, filePath: string) => {
  if (!filePath || !filePath.toLowerCase().endsWith(".png")) {
    throw new Error("Only PNG frame files are supported.");
  }

  const source = path.resolve(filePath);
  const stats = await fs.stat(source);
  if (!stats.isFile()) {
    throw new Error("Frame path is not a file.");
  }

  await ensureDir(userFramesRoot());
  const existing = new Set(await fs.readdir(userFramesRoot()));
  const originalName = path.basename(source);
  const targetName = resolveCollision(originalName, existing);
  const destination = path.join(userFramesRoot(), targetName);
  await fs.copyFile(source, destination);
  const bytes = await fs.readFile(destination);
  const dataUrl = `data:image/png;base64,${bytes.toString("base64")}`;

  const existingFrames = await readUserFrames();
  const frame: UserFrameRecord = {
    id: `user-${Date.now()}`,
    name: path.basename(targetName, ".png"),
    source: "user",
    frameImagePathOrUrl: dataUrl,
    previewPathOrUrl: dataUrl,
    safeArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
    fileName: targetName
  };

  await writeUserFrames([...existingFrames, frame]);
  return frame;
});

ipcMain.handle("photobooth:deleteFrame", async (_event, frameId: string) => {
  const existingFrames = await readUserFrames();
  const target = existingFrames.find((frame) => frame.id === frameId);
  if (!target) {
    return;
  }

  if (target.fileName) {
    const filePath = path.join(userFramesRoot(), target.fileName);
    await fs.rm(filePath, { force: true });
  }

  const next = existingFrames.filter((frame) => frame.id !== frameId);
  await writeUserFrames(next);
});

ipcMain.handle("photobooth:getSaveDirectory", async () => {
  const dir = await resolveWritableSaveDirectory();
  return dir;
});

ipcMain.handle("photobooth:pickSaveDirectory", async () => {
  const currentDirectory = await resolveWritableSaveDirectory().catch(() => getDefaultSaveDirectory());
  const result = await dialog.showOpenDialog({
    title: "Choose Photo Save Folder",
    defaultPath: currentDirectory,
    properties: ["openDirectory", "createDirectory"]
  });

  if (result.canceled) {
    return null;
  }

  const selected = result.filePaths[0];
  if (!selected) {
    return null;
  }

  await ensureDir(selected);
  const probe = path.join(selected, `.write-test-${Date.now()}.tmp`);
  await fs.writeFile(probe, "");
  await fs.rm(probe, { force: true });

  const preferences = await readPreferences();
  await writePreferences({ ...preferences, saveDirectory: selected });
  return selected;
});

ipcMain.handle(
  "photobooth:savePhoto",
  async (_event, pngBytes: ArrayBuffer, filenameHint: string): Promise<{ absolutePath: string }> => {
    const saveDir = await resolveWritableSaveDirectory();

    const fileNames = new Set(await fs.readdir(saveDir));
    const requested = filenameHint?.trim() || buildPhotoFilename(new Date());
    const fileName = resolveCollision(requested, fileNames);
    const fullPath = path.join(saveDir, fileName);
    await fs.writeFile(fullPath, Buffer.from(new Uint8Array(pngBytes)));
    return { absolutePath: fullPath };
  }
);

app.whenReady().then(async () => {
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
