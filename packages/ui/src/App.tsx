import {
  DEFAULT_OUTPUT_PRESET,
  buildPhotoFilename,
  composeFrame,
  type CaptureSettings,
  type FrameTemplate
} from "@photobooth/core";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { FramePicker } from "./components/FramePicker";
import { Settings } from "./components/Settings";
import { useCamera } from "./hooks/useCamera";
import {
  deleteImportedFrame,
  getSaveDirectory,
  pickDesktopFramePath,
  importFrameFromPath,
  importFrameFromWebFile,
  isElectronRuntime,
  listFrames,
  savePhoto
} from "./platform/bridge";

const SETTINGS_KEY = "photobooth_settings";
type GalleryItem = {
  id: string;
  compositedBlob: Blob;
  previewUrl: string;
  selected: boolean;
};

function loadSettings(): CaptureSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return {
        countdownSeconds: 3,
        selectedFrameId: "",
        mirrorPreview: true
      };
    }
    const parsed = JSON.parse(raw) as CaptureSettings;
    return {
      countdownSeconds: parsed.countdownSeconds ?? 3,
      selectedFrameId: parsed.selectedFrameId ?? "",
      cameraDeviceId: parsed.cameraDeviceId,
      mirrorPreview: parsed.mirrorPreview ?? true
    };
  } catch {
    return {
      countdownSeconds: 3,
      selectedFrameId: "",
      mirrorPreview: true
    };
  }
}

export function App() {
  const { videoRef, state: camera, hasDevices, start } = useCamera();
  const [frames, setFrames] = useState<FrameTemplate[]>([]);
  const [settings, setSettings] = useState<CaptureSettings>(loadSettings);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [savingSelected, setSavingSelected] = useState(false);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [saveDir, setSaveDir] = useState<string>("");
  const [error, setError] = useState<string>("");
  const galleryRef = useRef<GalleryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedFrame = useMemo(
    () => frames.find((frame) => frame.id === settings.selectedFrameId) ?? frames[0],
    [frames, settings.selectedFrameId]
  );

  useEffect(() => {
    void listFrames().then((value) => {
      setFrames(value);
      if (!settings.selectedFrameId && value[0]) {
        setSettings((prev) => ({ ...prev, selectedFrameId: value[0].id }));
      }
    });
    void getSaveDirectory().then(setSaveDir);
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    galleryRef.current = gallery;
  }, [gallery]);

  useEffect(() => {
    return () => {
      for (const item of galleryRef.current) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) return;

    const timer = window.setTimeout(() => {
      setCountdown((value) => (value === null ? value : value - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (countdown !== 0 || !selectedFrame) {
      return;
    }

    const run = async () => {
      if (!videoRef.current) return;

      setCapturing(true);
      setError("");
      try {
        const { compositedBlob } = await composeFrame(
          videoRef.current,
          selectedFrame.frameImagePathOrUrl,
          selectedFrame.safeArea,
          DEFAULT_OUTPUT_PRESET
        );
        const previewUrl = URL.createObjectURL(compositedBlob);
        const id = `capture-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setGallery((prev) => [{ id, compositedBlob, previewUrl, selected: false }, ...prev]);
      } catch (captureError) {
        setError(captureError instanceof Error ? captureError.message : "Failed to capture");
      } finally {
        setCapturing(false);
        setCountdown(null);
      }
    };

    void run();
  }, [countdown, selectedFrame, videoRef]);

  const startCountdown = () => {
    if (!camera.ready || !selectedFrame) {
      setError("Camera not ready or no frame selected.");
      return;
    }
    setError("");
    setCountdown(settings.countdownSeconds);
  };

  const importFrame = async () => {
    setError("");
    try {
      if (isElectronRuntime()) {
        const path = await pickDesktopFramePath();
        if (!path) return;
        await importFrameFromPath(path);
      } else {
        fileInputRef.current?.click();
        return;
      }
      const next = await listFrames();
      setFrames(next);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Failed to import frame");
    }
  };

  const onWebFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const frame = await importFrameFromWebFile(file);
      setFrames((prev) => [...prev, frame]);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Failed to import frame");
    }
  };

  const onSelectCamera = async (deviceId: string) => {
    setSettings((prev) => ({ ...prev, cameraDeviceId: deviceId }));
    await start(deviceId);
  };

  const onToggleGalleryItem = (id: string) => {
    setGallery((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const onRemoveGalleryItem = (id: string) => {
    setGallery((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const onSaveSelected = async () => {
    const selected = gallery.filter((item) => item.selected);
    if (selected.length === 0) {
      setError("Select at least one captured photo to save.");
      return;
    }

    setSavingSelected(true);
    setError("");
    try {
      const timestampRoot = buildPhotoFilename(new Date()).replace(".png", "");
      for (let index = 0; index < selected.length; index += 1) {
        const fileName = `${timestampRoot}_${String(index + 1).padStart(2, "0")}.png`;
        await savePhoto(selected[index].compositedBlob, fileName);
      }
      setGallery((prev) => prev.map((item) => (item.selected ? { ...item, selected: false } : item)));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save selected photos");
    } finally {
      setSavingSelected(false);
    }
  };

  const onDeleteFrame = async (frameId: string) => {
    setError("");
    try {
      await deleteImportedFrame(frameId);
      const next = await listFrames();
      setFrames(next);

      if (settings.selectedFrameId === frameId) {
        const fallback = next[0]?.id ?? "";
        setSettings((prev) => ({ ...prev, selectedFrameId: fallback }));
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete frame");
    }
  };

  return (
    <main className="app-shell">
      <header className="panel title-panel">
        <h1>PhotoBooth PWA</h1>
        <p>{saveDir ? `Saving to: ${saveDir}` : "Preparing save location..."}</p>
      </header>

      {error && <p className="error-banner">{error}</p>}
      {camera.error && <p className="error-banner">Camera: {camera.error}</p>}
      {!hasDevices && <p className="error-banner">No camera found. Connect a camera and retry.</p>}

      <section className="workspace">
        <section className="panel capture-panel">
          <div className="video-wrap">
            {selectedFrame && (
              <img
                className="frame-overlay"
                src={selectedFrame.frameImagePathOrUrl}
                alt="Selected frame"
                aria-hidden
              />
            )}
            <video
              ref={videoRef}
              className={settings.mirrorPreview ? "preview mirror" : "preview"}
              playsInline
              muted
            />
            {countdown !== null && countdown > 0 && <div className="countdown">{countdown}</div>}
          </div>

          <div className="controls">
            <div className="button-row">
              <button type="button" onClick={startCountdown} disabled={capturing || countdown !== null}>
                {capturing ? "Capturing..." : `Take photo (${settings.countdownSeconds}s)`}
              </button>
            </div>
          </div>
        </section>

        <div className="sidebar">
          <FramePicker
            frames={frames}
            selectedFrameId={selectedFrame?.id}
            onSelect={(frameId) => setSettings((prev) => ({ ...prev, selectedFrameId: frameId }))}
            onImport={() => void importFrame()}
            onDelete={(frameId) => void onDeleteFrame(frameId)}
          />
          
          <Settings
            settings={settings}
            onSettingsChange={setSettings}
            cameraDevices={camera.devices}
            activeDeviceId={camera.activeDeviceId}
            onSelectCamera={onSelectCamera}
          />
        </div>
      </section>

      <section className="panel result-panel">
        <div className="gallery-header">
          <h2>Captured Gallery</h2>
          <div className="gallery-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setGallery((prev) => prev.map((item) => ({ ...item, selected: true })))}
              disabled={gallery.length === 0}
            >
              Select all
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setGallery((prev) => prev.map((item) => ({ ...item, selected: false })))}
              disabled={gallery.length === 0}
            >
              Clear selection
            </button>
            <button type="button" onClick={onSaveSelected} disabled={savingSelected || gallery.every((item) => !item.selected)}>
              {savingSelected ? "Saving..." : "Save selected"}
            </button>
          </div>
        </div>

        {gallery.length === 0 ? (
          <p>No photos captured yet.</p>
        ) : (
          <div className="gallery-grid">
            {gallery.map((item) => (
              <article key={item.id} className={item.selected ? "gallery-card selected" : "gallery-card"}>
                <div className="gallery-card-controls">
                  <label className="gallery-select">
                    <input type="checkbox" checked={item.selected} onChange={() => onToggleGalleryItem(item.id)} />
                  </label>
                  <button type="button" className="gallery-delete" onClick={() => onRemoveGalleryItem(item.id)}>
                    🗑️
                  </button>
                </div>
                <button type="button" className="gallery-thumb-button" onClick={() => onToggleGalleryItem(item.id)}>
                  <img src={item.previewUrl} alt="Captured" className="result-preview" />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png"
        className="hidden-input"
        onChange={(event) => void onWebFileSelected(event)}
      />
    </main>
  );
}
