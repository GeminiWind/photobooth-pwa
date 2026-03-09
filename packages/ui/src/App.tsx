import {
  DEFAULT_OUTPUT_PRESET,
  buildPhotoFilename,
  composeFrame,
  type CaptureSettings,
  type FrameTemplate
} from "@photobooth/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateLeft,
  faCamera,
  faChevronLeft,
  faChevronRight,
  faCopy,
  faDownload,
  faGear,
  faImages,
  faRectangleList,
  faShareNodes,
  faVideo,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { FramePicker } from "./components/FramePicker";
import { Settings } from "./components/Settings";
import { useCamera } from "./hooks/useCamera";
import {
  deleteImportedFrame,
  getSaveDirectory,
  pickDesktopFramePath,
  pickSaveDirectory,
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
        mirrorPreview: true,
        photoSequence: 'single',
        screenFlash: true
      };
    }
    const parsed = JSON.parse(raw) as CaptureSettings;
    return {
      countdownSeconds: parsed.countdownSeconds ?? 3,
      selectedFrameId: parsed.selectedFrameId ?? "",
      cameraDeviceId: parsed.cameraDeviceId,
      mirrorPreview: parsed.mirrorPreview ?? true,
      photoSequence: parsed.photoSequence ?? 'single',
      screenFlash: parsed.screenFlash ?? true
    };
  } catch {
    return {
      countdownSeconds: 3,
      selectedFrameId: "",
      mirrorPreview: true,
      photoSequence: 'single',
      screenFlash: true
    };
  }
}

function formatPhotoSequence(sequence: CaptureSettings["photoSequence"]) {
  if (sequence === "single") {
    return "Single Shot";
  }
  if (sequence === "3photos") {
    return "3 Photos";
  }
  if (sequence === "4photos") {
    return "4 Photos";
  }
  return "5 Photos";
}

function getPhotoSequenceLength(sequence: CaptureSettings["photoSequence"]): number {
  if (sequence === "3photos") {
    return 3;
  }
  if (sequence === "4photos") {
    return 4;
  }
  if (sequence === "5photos") {
    return 5;
  }
  return 1;
}

const overlayButtonClasses =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-black/40 text-slate-100 backdrop-blur-md transition hover:bg-black/55";

const modalButtonClasses =
  "min-h-11 rounded-[14px] px-[18px] text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55";

const shareTargets = [
  { id: "messenger", label: "Messenger", color: "bg-sky-500", accent: "✉" },
  {
    id: "instagram",
    label: "Instagram",
    color: "bg-[linear-gradient(45deg,#f9ce34_0%,#ee2a7b_50%,#6228d7_100%)]",
    accent: "◎"
  },
  { id: "pinterest", label: "Pinterest", color: "bg-red-600", accent: "P" },
  { id: "zalo", label: "Zalo", color: "bg-sky-400", accent: "Z" }
] as const;

const SHARE_IMAGE_MAX_EDGE = 480;
const SHARE_IMAGE_QUALITY = 0.55;
const SHARE_LINK_MAX_LENGTH = 3500;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function resizeForShare(blob: Blob): Promise<Blob> {
  const srcUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Failed to prepare image for sharing."));
      element.src = srcUrl;
    });

    const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = longestEdge > SHARE_IMAGE_MAX_EDGE ? SHARE_IMAGE_MAX_EDGE / longestEdge : 1;
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to render share preview.");
    }
    ctx.drawImage(image, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (nextBlob) => {
          if (!nextBlob) {
            reject(new Error("Failed to encode share preview."));
            return;
          }
          resolve(nextBlob);
        },
        "image/jpeg",
        SHARE_IMAGE_QUALITY
      );
    });
  } finally {
    URL.revokeObjectURL(srcUrl);
  }
}

async function buildSharePayloadFromBlob(blob: Blob): Promise<string> {
  const compactBlob = await resizeForShare(blob);
  const bytes = new Uint8Array(await compactBlob.arrayBuffer());
  return `1.${bytesToBase64Url(bytes)}`;
}

function decodeSharePayload(payload: string): Blob {
  const [version, data] = payload.split(".", 2);
  if (version !== "1" || !data) {
    throw new Error("Unsupported share link format.");
  }
  const bytes = base64UrlToBytes(data);
  const normalized = Uint8Array.from(bytes);
  return new Blob([normalized], { type: "image/jpeg" });
}

function buildShareLinkFromPayload(payload: string): string {
  const url = new URL(window.location.href);
  url.hash = `s=${payload}`;
  return url.toString();
}

export function App() {
  const { videoRef, attachStreamToVideo, state: camera, hasDevices, start } = useCamera();
  const [frames, setFrames] = useState<FrameTemplate[]>([]);
  const [settings, setSettings] = useState<CaptureSettings>(loadSettings);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [savingSelected, setSavingSelected] = useState(false);
  const [changingSaveLocation, setChangingSaveLocation] = useState(false);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [saveDir, setSaveDir] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [notice, setNotice] = useState<string>("");
  const [showGallery, setShowGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeCaptureId, setActiveCaptureId] = useState<string | null>(null);
  const [previewCaptureIds, setPreviewCaptureIds] = useState<string[]>([]);
  const [previewCaptureIndex, setPreviewCaptureIndex] = useState(0);
  const [sequenceShotsTotal, setSequenceShotsTotal] = useState(1);
  const [sequenceShotsRemaining, setSequenceShotsRemaining] = useState(0);
  const [shareLink, setShareLink] = useState<string>("");
  const [shareLinkError, setShareLinkError] = useState<string>("");
  const [sharedPhoto, setSharedPhoto] = useState<{ blob: Blob; previewUrl: string } | null>(null);
  const galleryRef = useRef<GalleryItem[]>([]);
  const sequenceCaptureIdsRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedFrame = useMemo(
    () => frames.find((frame) => frame.id === settings.selectedFrameId) ?? frames[0],
    [frames, settings.selectedFrameId]
  );

  const selectedCount = useMemo(
    () => gallery.reduce((total, item) => total + (item.selected ? 1 : 0), 0),
    [gallery]
  );

  const cameraLabel = useMemo(() => {
    const activeDevice =
      camera.devices.find((device) => device.deviceId === camera.activeDeviceId) ?? camera.devices[0];
    return activeDevice?.label || (hasDevices ? "Camera ready" : "No camera detected");
  }, [camera.activeDeviceId, camera.devices, hasDevices]);

  const activeCapture = useMemo(
    () => gallery.find((item) => item.id === activeCaptureId) ?? null,
    [activeCaptureId, gallery]
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
    if (!showSettings) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowSettings(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showSettings]);

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
    return () => {
      if (sharedPhoto) {
        URL.revokeObjectURL(sharedPhoto.previewUrl);
      }
    };
  }, [sharedPhoto]);

  useEffect(() => {
    const applySharedLink = () => {
      if (!window.location.hash.startsWith("#s=")) {
        return;
      }

      const payload = window.location.hash.slice(3);
      if (!payload) {
        return;
      }

      try {
        const blob = decodeSharePayload(payload);
        const previewUrl = URL.createObjectURL(blob);
        setSharedPhoto((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev.previewUrl);
          }
          return { blob, previewUrl };
        });
        setActiveCaptureId(null);
        setPreviewCaptureIds([]);
        setPreviewCaptureIndex(0);
        setShowShareModal(false);
        setShowGallery(false);
        setError("");
        setNotice("Opened shared photo link.");
      } catch (decodeError) {
        setError(decodeError instanceof Error ? decodeError.message : "Invalid share link");
      }
    };

    applySharedLink();
    window.addEventListener("hashchange", applySharedLink);
    return () => window.removeEventListener("hashchange", applySharedLink);
  }, []);

  useEffect(() => {
    if (!activeCapture) {
      setShareLink("");
      setShareLinkError("");
      return;
    }

    let cancelled = false;
    const build = async () => {
      try {
        const payload = await buildSharePayloadFromBlob(activeCapture.compositedBlob);
        const link = buildShareLinkFromPayload(payload);
        if (link.length > SHARE_LINK_MAX_LENGTH) {
          throw new Error("Link is too large for reliable opening. Use Share or Save Photo.");
        }
        if (!cancelled) {
          setShareLink(link);
          setShareLinkError("");
        }
      } catch (linkError) {
        if (!cancelled) {
          setShareLink("");
          setShareLinkError(linkError instanceof Error ? linkError.message : "Failed to create share link");
        }
      }
    };

    void build();
    return () => {
      cancelled = true;
    };
  }, [activeCapture]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      return;
    }

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
      if (!videoRef.current) {
        return;
      }

      setCapturing(true);
      setError("");
      setNotice("");
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

        sequenceCaptureIdsRef.current = [...sequenceCaptureIdsRef.current, id];
        const remainingAfterCapture = sequenceShotsRemaining - 1;

        if (remainingAfterCapture > 0) {
          setSequenceShotsRemaining(remainingAfterCapture);
          setCountdown(settings.countdownSeconds);
          return;
        }

        const completedIds = sequenceCaptureIdsRef.current;
        setSequenceShotsRemaining(0);
        setPreviewCaptureIds(completedIds);
        setPreviewCaptureIndex(0);
        setActiveCaptureId(completedIds[0] ?? id);
        setCountdown(null);
      } catch (captureError) {
        setError(captureError instanceof Error ? captureError.message : "Failed to capture");
        setSequenceShotsRemaining(0);
        sequenceCaptureIdsRef.current = [];
        setCountdown(null);
      } finally {
        setCapturing(false);
      }
    };

    void run();
  }, [countdown, selectedFrame, settings.countdownSeconds, sequenceShotsRemaining, sequenceShotsTotal, videoRef]);

  const startCountdown = () => {
    if (!camera.ready || !selectedFrame) {
      setError("Camera not ready or no frame selected.");
      return;
    }
    setError("");
    setNotice("");
    const totalShots = getPhotoSequenceLength(settings.photoSequence);
    sequenceCaptureIdsRef.current = [];
    setSequenceShotsTotal(totalShots);
    setSequenceShotsRemaining(totalShots);
    setPreviewCaptureIds([]);
    setPreviewCaptureIndex(0);
    setCountdown(settings.countdownSeconds);
  };

  const importFrame = async () => {
    setError("");
    setNotice("");
    try {
      if (isElectronRuntime()) {
        const path = await pickDesktopFramePath();
        if (!path) {
          return;
        }
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
    if (!file) {
      return;
    }

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

  const onSelectFrame = (frameId: string) => {
    setSettings((prev) => ({ ...prev, selectedFrameId: frameId }));
    setError("");
    setNotice("");
  };

  const onChangeSaveLocation = async () => {
    setError("");
    setNotice("");
    setChangingSaveLocation(true);
    try {
      const nextDirectory = await pickSaveDirectory();
      if (!nextDirectory) {
        return;
      }
      setSaveDir(nextDirectory);
      setNotice(`Save location updated to ${nextDirectory}`);
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "Failed to change save location");
    } finally {
      setChangingSaveLocation(false);
    }
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
    if (activeCaptureId === id) {
      setActiveCaptureId(null);
      setShowShareModal(false);
    }
  };

  const saveCapture = async (item: GalleryItem) => {
    const fileName = buildPhotoFilename(new Date());
    const result = await savePhoto(item.compositedBlob, fileName);
    setNotice(`Saved to ${result.pathLabel}`);
  };

  const onSaveSelected = async () => {
    const selected = gallery.filter((item) => item.selected);
    if (selected.length === 0) {
      setError("Select at least one captured photo to save.");
      return;
    }

    setSavingSelected(true);
    setError("");
    setNotice("");
    try {
      const timestampRoot = buildPhotoFilename(new Date()).replace(".png", "");
      for (let index = 0; index < selected.length; index += 1) {
        const fileName = `${timestampRoot}_${String(index + 1).padStart(2, "0")}.png`;
        await savePhoto(selected[index].compositedBlob, fileName);
      }
      setGallery((prev) => prev.map((item) => (item.selected ? { ...item, selected: false } : item)));
      setNotice(`Saved ${selected.length} photo${selected.length === 1 ? "" : "s"}${saveDir ? ` to ${saveDir}` : ""}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save selected photos");
    } finally {
      setSavingSelected(false);
    }
  };

  const onDeleteFrame = async (frameId: string) => {
    setError("");
    setNotice("");
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

  const liveSafeAreaStyle =
    selectedFrame == null
      ? undefined
      : {
          left: `${selectedFrame.safeArea.x * 100}%`,
          top: `${selectedFrame.safeArea.y * 100}%`,
          width: `${selectedFrame.safeArea.width * 100}%`,
          height: `${selectedFrame.safeArea.height * 100}%`
        };

  const saveActiveCapture = async () => {
    if (!activeCapture) {
      return;
    }

    setError("");
    setNotice("");
    try {
      await saveCapture(activeCapture);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save photo");
    }
  };

  const shareExternally = async () => {
    if (!activeCapture) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const file = new File([activeCapture.compositedBlob], buildPhotoFilename(new Date()), {
        type: "image/png"
      });
      const shareData: ShareData = {
        title: "PhotoBooth Photo",
        text: "Shared from PhotoBooth Pro",
        files: [file]
      };

      if (typeof navigator !== "undefined" && "canShare" in navigator && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        setNotice("Share sheet opened.");
        return;
      }

      await saveCapture(activeCapture);
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === "AbortError") {
        return;
      }
      setError(shareError instanceof Error ? shareError.message : "Failed to share photo");
    }
  };

  const copyShareLink = async () => {
    setError("");
    setNotice("");

    try {
      if (!shareLink) {
        throw new Error(shareLinkError || "Preparing lightweight link. Try again in a moment.");
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareLink);
      } else {
        throw new Error("Clipboard access is not available.");
      }
      setNotice("Share link copied.");
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : "Failed to copy link");
    }
  };

  const onShareTarget = async () => {
    await shareExternally();
  };

  const showPreviewCaptureAt = (index: number) => {
    const captureId = previewCaptureIds[index];
    if (!captureId) {
      return;
    }
    setPreviewCaptureIndex(index);
    setActiveCaptureId(captureId);
    setShowShareModal(false);
  };

  const showPreviousPreviewCapture = () => {
    if (previewCaptureIds.length <= 1) {
      return;
    }
    const nextIndex =
      previewCaptureIndex === 0 ? previewCaptureIds.length - 1 : previewCaptureIndex - 1;
    showPreviewCaptureAt(nextIndex);
  };

  const showNextPreviewCapture = () => {
    if (previewCaptureIds.length <= 1) {
      return;
    }
    const nextIndex = (previewCaptureIndex + 1) % previewCaptureIds.length;
    showPreviewCaptureAt(nextIndex);
  };

  const exitPreview = () => {
    setActiveCaptureId(null);
    setPreviewCaptureIds([]);
    setPreviewCaptureIndex(0);
    setSequenceShotsRemaining(0);
    sequenceCaptureIdsRef.current = [];
    setError("");
    setNotice("");
    setShowShareModal(false);
  };

  const closeSharedPhoto = () => {
    setSharedPhoto(null);
    setError("");
    if (window.location.hash.startsWith("#s=")) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  };

  const saveSharedPhoto = async () => {
    if (!sharedPhoto) {
      return;
    }
    setError("");
    setNotice("");
    try {
      const fileName = buildPhotoFilename(new Date()).replace(/\.png$/, ".jpg");
      const result = await savePhoto(sharedPhoto.blob, fileName);
      setNotice(`Saved to ${result.pathLabel}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save shared photo");
    }
  };

  return (
    <>
      {sharedPhoto ? (
        <main className="mx-auto my-0 grid min-h-screen w-full grid-rows-[auto_1fr] overflow-hidden bg-[linear-gradient(180deg,#160321_0%,#14011b_100%)] text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.45)] lg:my-3 lg:min-h-[calc(100vh-24px)] lg:w-[min(1400px,calc(100vw-32px))] lg:border lg:border-[#7f0df229]">
          <header className="flex min-h-[74px] items-center justify-between border-b border-[#7f0df238] bg-[rgba(18,10,34,0.96)] px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-[linear-gradient(180deg,#8c2eff_0%,#6d0fd2_100%)] text-white">
                <FontAwesomeIcon icon={faCamera} />
              </div>
              <h1 className="m-0 text-xl font-extrabold tracking-[-0.03em]">Shared Photo</h1>
            </div>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full bg-[#7f0df229] text-slate-100 transition hover:bg-[#7f0df240]"
              onClick={closeSharedPhoto}
              aria-label="Close shared photo"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </header>

          <section className="flex min-h-0 items-center justify-center px-5 py-8 sm:px-10 lg:px-20">
            <div className="flex w-full max-w-[1080px] flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center">
              <div className="relative w-full max-w-[620px]">
                <div className="absolute inset-[-4px] rounded-2xl bg-[linear-gradient(90deg,#7f0df2_0%,#d946ef_100%)] opacity-25 blur-[4px]" />
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[24px] bg-slate-800 p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
                  <div className="h-full w-full overflow-hidden rounded-2xl bg-slate-900">
                    <img src={sharedPhoto.previewUrl} alt="Shared photo preview" className="h-full w-full object-cover" />
                  </div>
                </div>
              </div>

              <div className="flex w-full max-w-[420px] flex-col gap-6">
                <h2 className="m-0 text-[2.2rem] font-extrabold leading-none tracking-[-0.04em] text-slate-100">
                  Opened from shared link
                </h2>
                <p className="m-0 text-base leading-7 text-slate-400">
                  This is a compact preview shared without backend storage. Save it or return to camera.
                </p>
                {(error || notice) && (
                  <div className="grid gap-2">
                    {error && (
                      <p className="m-0 rounded-[14px] border border-red-400/30 bg-red-900/70 px-[14px] py-3 backdrop-blur-md">
                        {error}
                      </p>
                    )}
                    {notice && (
                      <p className="m-0 rounded-[14px] border border-emerald-400/25 bg-emerald-900/30 px-[14px] py-3 text-emerald-100 backdrop-blur-md">
                        {notice}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    className="flex h-14 items-center justify-center gap-2 rounded-3xl bg-[linear-gradient(180deg,#9333ea_0%,#7f0df2_100%)] px-5 text-lg font-bold text-white shadow-[0_10px_15px_-3px_rgba(127,13,242,0.2),0_4px_6px_-4px_rgba(127,13,242,0.2)]"
                    onClick={() => void saveSharedPhoto()}
                  >
                    <FontAwesomeIcon icon={faDownload} />
                    <span>Save Preview</span>
                  </button>
                  <button
                    type="button"
                    className="flex h-14 items-center justify-center gap-2 rounded-3xl bg-slate-800 px-5 text-lg font-semibold text-slate-300 transition hover:bg-slate-700"
                    onClick={closeSharedPhoto}
                  >
                    <FontAwesomeIcon icon={faArrowRotateLeft} />
                    <span>Open Camera</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      ) : activeCapture ? (
        <main className="mx-auto my-0 grid min-h-screen w-full grid-rows-[auto_1fr] overflow-hidden bg-[linear-gradient(180deg,#160321_0%,#14011b_100%)] text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.45)] lg:my-3 lg:min-h-[calc(100vh-24px)] lg:w-[min(1400px,calc(100vw-32px))] lg:border lg:border-[#7f0df229]">
          <header className="flex min-h-[74px] items-center justify-between border-b border-[#7f0df238] bg-[rgba(18,10,34,0.96)] px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-[linear-gradient(180deg,#8c2eff_0%,#6d0fd2_100%)] text-white">
                <FontAwesomeIcon icon={faCamera} />
              </div>
              <h1 className="m-0 text-xl font-extrabold tracking-[-0.03em]">Photobooth</h1>
            </div>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full bg-[#7f0df229] text-slate-100 transition hover:bg-[#7f0df240]"
              onClick={exitPreview}
              aria-label="Close preview"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </header>

          <section className="flex min-h-0 items-center justify-center px-5 py-8 sm:px-10 lg:px-20">
            <div className="flex w-full max-w-[1152px] flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-8">
              <div className="relative w-full max-w-[640px]">
                <div className="absolute inset-[-4px] rounded-2xl bg-[linear-gradient(90deg,#7f0df2_0%,#d946ef_100%)] opacity-25 blur-[4px]" />
              <div className="group relative aspect-[2/3] w-full overflow-hidden rounded-[24px] bg-slate-800 p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
                  <div className="h-full w-full overflow-hidden rounded-2xl bg-slate-900">
                    <img src={activeCapture.previewUrl} alt="Captured preview" className="h-full w-full object-cover" />
                  </div>
                  {previewCaptureIds.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="absolute top-1/2 left-6 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-[rgba(3,6,18,0.64)] text-white opacity-0 transition hover:bg-[rgba(3,6,18,0.82)] group-hover:opacity-100 group-focus-within:opacity-100"
                        onClick={showPreviousPreviewCapture}
                        aria-label="Previous photo"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} />
                      </button>
                      <button
                        type="button"
                        className="absolute top-1/2 right-6 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-[rgba(3,6,18,0.64)] text-white opacity-0 transition hover:bg-[rgba(3,6,18,0.82)] group-hover:opacity-100 group-focus-within:opacity-100"
                        onClick={showNextPreviewCapture}
                        aria-label="Next photo"
                      >
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>
                      <div className="absolute right-1/2 bottom-4 translate-x-1/2 rounded-full border border-white/15 bg-[rgba(3,6,18,0.64)] px-3 py-1 text-xs font-bold tracking-[0.08em] text-slate-100">
                        {previewCaptureIndex + 1} / {previewCaptureIds.length}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex w-full max-w-[448px] flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <div className="inline-flex w-fit rounded-full bg-[#7f0df21a] px-3 py-1">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7f0df2]">
                      Reviewing Shot
                    </span>
                  </div>
                  <h2 className="m-0 text-[2.5rem] font-extrabold leading-none tracking-[-0.04em] text-slate-100 sm:text-[3rem]">
                    Looking sharp!
                  </h2>
                  <p className="m-0 text-lg leading-7 text-slate-400">
                    Your moment is captured. Save it to your gallery or share it instantly with friends.
                  </p>
                </div>

                {(error || notice) && (
                  <div className="grid gap-2">
                    {error && (
                      <p className="m-0 rounded-[14px] border border-red-400/30 bg-red-900/70 px-[14px] py-3 backdrop-blur-md">
                        {error}
                      </p>
                    )}
                    {notice && (
                      <p className="m-0 rounded-[14px] border border-emerald-400/25 bg-emerald-900/30 px-[14px] py-3 text-emerald-100 backdrop-blur-md">
                        {notice}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      className="flex h-14 items-center justify-center gap-2 rounded-3xl bg-[linear-gradient(180deg,#9333ea_0%,#7f0df2_100%)] px-5 text-lg font-bold text-white shadow-[0_10px_15px_-3px_rgba(127,13,242,0.2),0_4px_6px_-4px_rgba(127,13,242,0.2)]"
                      onClick={() => void saveActiveCapture()}
                    >
                      <FontAwesomeIcon icon={faDownload} />
                      <span>Save Photo</span>
                    </button>
                    <button
                      type="button"
                      className="flex h-14 items-center justify-center gap-2 rounded-3xl bg-[#7f0df233] px-5 text-lg font-bold text-white transition hover:bg-[#7f0df244]"
                      onClick={() => {
                        setError("");
                        setNotice("");
                        setShowShareModal(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faShareNodes} />
                      <span>Share</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="flex h-14 items-center justify-center gap-2 rounded-3xl bg-slate-800 px-5 text-lg font-semibold text-slate-300 transition hover:bg-slate-700"
                    onClick={exitPreview}
                  >
                    <FontAwesomeIcon icon={faArrowRotateLeft} />
                    <span>Retake Photo</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {showShareModal && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgba(25,16,34,0.6)] px-4 py-10 backdrop-blur-[6px] sm:px-8">
              <section className="w-full max-w-[512px] overflow-hidden rounded-[24px] border border-[#7f0df233] bg-[rgba(25,16,34,0.95)] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-[#7f0df21a] px-6 pt-6 pb-[25px]">
                  <h3 className="m-0 text-2xl font-bold tracking-[-0.6px] text-slate-100">Share Your Photo</h3>
                  <button
                    type="button"
                    className="grid size-10 place-items-center rounded-full bg-transparent text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
                    onClick={() => setShowShareModal(false)}
                    aria-label="Close share screen"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>

                <div className="space-y-6 p-6">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-[#7f0df20d]">
                    <img src={activeCapture.previewUrl} alt="Share preview" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs font-medium text-white">
                      <FontAwesomeIcon icon={faCamera} className="text-[10px]" />
                      <span>Capture #{gallery.findIndex((item) => item.id === activeCapture.id) + 1}</span>
                    </div>
                  </div>

                  {(error || notice) && (
                    <div className="grid gap-2">
                      {error && (
                        <p className="m-0 rounded-[14px] border border-red-400/30 bg-red-900/70 px-[14px] py-3 text-sm backdrop-blur-md">
                          {error}
                        </p>
                      )}
                      {notice && (
                        <p className="m-0 rounded-[14px] border border-emerald-400/25 bg-emerald-900/30 px-[14px] py-3 text-sm text-emerald-100 backdrop-blur-md">
                          {notice}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-[14px]">
                    {shareTargets.map((target) => (
                      <button
                        key={target.id}
                        type="button"
                        className="flex flex-col items-center justify-center gap-3 rounded-[24px] border border-[#7f0df21a] bg-[#7f0df20d] px-6 py-[21px] text-slate-100 transition hover:border-[#7f0df244] hover:bg-[#7f0df218]"
                        onClick={() => void onShareTarget()}
                      >
                        <span
                          className={`grid size-12 place-items-center rounded-full text-lg font-bold text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] ${target.color}`}
                        >
                          {target.accent}
                        </span>
                        <span className="text-sm font-bold">{target.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4 rounded-[24px] border border-[#7f0df233] bg-[#7f0df20d] p-[17px]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="m-0 text-sm font-bold text-slate-100">Link Sharing</p>
                        <span className="inline-flex rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-200">
                          Compact Preview
                        </span>
                      </div>
                      <p className="m-0 text-xs text-slate-400">Lightweight preview link for broad compatibility</p>
                    </div>
                    <div className="flex items-center gap-2 overflow-hidden rounded-2xl border border-[#7f0df21a] bg-[#191022] p-[5px]">
                      <div className="min-w-0 flex-1 rounded-[inherit] px-3 py-2 text-left text-sm text-slate-500">
                        <span className="block truncate">{shareLink || shareLinkError || "Preparing lightweight link..."}</span>
                      </div>
                      <button
                        type="button"
                        className="flex min-h-10 items-center gap-2 rounded-2xl bg-[#7f0df2] px-4 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => void copyShareLink()}
                        disabled={!shareLink}
                      >
                        <FontAwesomeIcon icon={faCopy} className="text-xs" />
                        <span>Copy Link</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center bg-[#7f0df20d] px-6 py-6">
                  <button
                    type="button"
                    className="bg-transparent text-sm font-bold uppercase tracking-[0.7px] text-slate-500 transition hover:text-slate-300"
                    onClick={() => {
                      setShowShareModal(false);
                      setShowGallery(true);
                    }}
                  >
                    Return to Gallery
                  </button>
                </div>
              </section>
            </div>
          )}
        </main>
      ) : (
        <main className="mx-auto my-0 grid min-h-screen w-full grid-rows-[auto_1fr_auto] overflow-hidden bg-[radial-gradient(circle_at_60%_48%,rgba(34,64,107,0.45),transparent_28%),linear-gradient(180deg,#160321_0%,#14011b_100%)] text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.45)] lg:my-3 lg:min-h-[calc(100vh-24px)] lg:w-[min(1400px,calc(100vw-32px))] lg:border lg:border-[#7f0df229]">
        <header className="flex min-h-[74px] items-center justify-between border-b border-[#7f0df238] bg-[rgba(18,10,34,0.96)] px-[18px] py-3 sm:px-8 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-[14px] bg-[linear-gradient(180deg,#8c2eff_0%,#6d0fd2_100%)] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
              <FontAwesomeIcon icon={faCamera} />
            </div>
            <h1 className="m-0 text-xl font-bold tracking-[-0.04em] sm:text-[1.75rem]">PhotoBooth Pro</h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-transparent p-0 text-sm text-slate-400 transition hover:text-slate-100"
              onClick={() => setShowGallery(true)}
            >
              <FontAwesomeIcon icon={faImages} />
              <span className="hidden sm:inline">Gallery</span>
            </button>
            <span className="h-[22px] w-px bg-[#7f0df23d]" aria-hidden />
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-full bg-[#7f0df229] text-violet-400 transition hover:text-white"
              onClick={() => setShowSettings(true)}
            >
              <FontAwesomeIcon icon={faGear} />
            </button>
          </div>
        </header>

        <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[300px_1fr]">
          <aside className="min-h-0 max-h-[90vh] overflow-hidden border-b border-[#7f0df224] bg-[rgba(9,11,39,0.76)] px-[18px] pt-[18px] pb-[18px] lg:border-r lg:border-b-0 lg:pb-0">
            <FramePicker
              frames={frames}
              selectedFrameId={selectedFrame?.id}
              onSelect={onSelectFrame}
              onImport={() => void importFrame()}
              onDelete={(frameId) => void onDeleteFrame(frameId)}
            />
          </aside>

          <section className="relative flex min-h-0 min-w-0 flex-col items-center justify-center px-[18px] pt-6 pb-8 sm:px-8">
            {(error || notice || camera.error || !hasDevices) && (
              <div className="absolute top-[18px] right-[18px] left-[18px] z-[3] grid gap-2 sm:right-8 sm:left-8">
                {error && (
                  <p className="m-0 rounded-[14px] border border-red-400/30 bg-red-900/70 px-[14px] py-3 backdrop-blur-md">
                    {error}
                  </p>
                )}
                {notice && (
                  <p className="m-0 rounded-[14px] border border-emerald-400/25 bg-emerald-900/30 px-[14px] py-3 text-emerald-100 backdrop-blur-md">
                    {notice}
                  </p>
                )}
                {camera.error && (
                  <p className="m-0 rounded-[14px] border border-red-400/30 bg-red-900/70 px-[14px] py-3 backdrop-blur-md">
                    Camera: {camera.error}
                  </p>
                )}
                {!hasDevices && (
                  <p className="m-0 rounded-[14px] border border-amber-300/30 bg-amber-900/70 px-[14px] py-3 backdrop-blur-md">
                    No camera found. Connect a camera and retry.
                  </p>
                )}
              </div>
            )}

            <div className="flex w-full justify-center">
              <div className="relative h-[min(78vh,760px)] aspect-[2/3] w-auto max-w-full overflow-hidden rounded-[24px] border-[3px] border-[rgba(31,58,96,0.5)] bg-[radial-gradient(circle_at_center,rgba(38,71,113,0.8),rgba(8,15,30,0.98)),#0f172a] shadow-[inset_0_0_0_1px_rgba(127,13,242,0.18),0_25px_50px_rgba(15,23,42,0.3)] sm:h-[min(84vh,860px)] lg:h-[min(88vh,940px)] lg:max-h-[calc(100vh-170px)]">
                <video
                  ref={attachStreamToVideo}
                  className={`absolute inset-0 h-full w-full object-cover bg-[radial-gradient(circle_at_center,rgba(48,77,116,0.6),rgba(8,15,30,0.92)),#0f172a] ${settings.mirrorPreview ? "-scale-x-100" : ""}`}
                  playsInline
                  muted
                />
                {selectedFrame && (
                  <img
                    src={selectedFrame.frameImagePathOrUrl}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <div
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(6,11,23,0.08),rgba(3,8,20,0.62)),radial-gradient(circle_at_center,transparent_32%,rgba(0,0,0,0.42)_100%)]"
                  aria-hidden
                />


                <button
                  type="button"
                  className={`${overlayButtonClasses} absolute top-5 right-5 size-10 rounded-2xl`}
                  aria-label="Open settings"
                  onClick={() => setShowSettings(true)}
                >
                  <FontAwesomeIcon icon={faGear} />
                </button>

                {countdown !== null && countdown > 0 && (
                  <div className="absolute right-6 bottom-6 grid size-[76px] place-items-center rounded-full border border-fuchsia-200/45 bg-[#7f0df247] text-[2rem] font-extrabold text-white backdrop-blur-md">
                    {countdown}
                  </div>
                )}
              </div>
            </div>

            <div className="grid justify-items-center gap-3 pt-[34px]">
              <button
                type="button"
                className="grid size-24 place-items-center rounded-full bg-[#7f0df22e] shadow-[0_0_30px_rgba(127,13,242,0.55)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 sm:size-[118px]"
                onClick={startCountdown}
                disabled={capturing || countdown !== null}
              >
                <span className="grid size-[68px] place-items-center rounded-full border-4 border-slate-700/90 bg-[linear-gradient(180deg,#9333ea_0%,#7f0df2_100%)] text-[1.7rem] text-white sm:size-[82px] sm:text-[2rem]">
                  <FontAwesomeIcon icon={faCamera} />
                </span>
              </button>
              <span className="w-24 text-center text-sm font-bold uppercase tracking-[0.12em] text-slate-400">
                {capturing
                  ? "Capturing..."
                  : countdown !== null
                    ? sequenceShotsTotal > 1
                      ? `Shot ${sequenceShotsTotal - sequenceShotsRemaining + 1}/${sequenceShotsTotal}`
                      : `Starting ${countdown}`
                    : "Take Photo"}
              </span>
            </div>
          </section>
        </div>

        <footer className="flex min-h-9 flex-col items-start justify-between gap-1 border-t border-[#7f0df224] bg-[rgba(18,10,34,0.96)] px-6 py-2 text-[0.69rem] uppercase tracking-[0.16em] text-slate-500 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-[10px]">
            <FontAwesomeIcon icon={faVideo} />
            <span>{cameraLabel}</span>
          </div>
          <div className="flex flex-wrap items-center gap-[10px]">
            <span>Timer: {settings.countdownSeconds}s</span>
            <span className="text-slate-500/40">•</span>
            <span>Photo Sequence: {formatPhotoSequence(settings.photoSequence)}</span>
          </div>
        </footer>
        </main>
      )}

      {showSettings && (
        <div
          className="fixed inset-0 z-10 overflow-hidden bg-[rgba(7,6,18,0.14)] backdrop-blur-[6px]"
          onClick={() => setShowSettings(false)}
        >
          <div className="flex min-h-full items-stretch justify-end">
            <section
              className="flex min-h-full w-full max-w-[580px] flex-col border-l border-[#7f0df238] bg-[linear-gradient(180deg,rgba(16,19,44,0.94),rgba(9,12,29,0.96)),#0f1126] shadow-[-24px_0_80px_rgba(0,0,0,0.35)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/8 px-6 pt-7 pb-6">
                <div className="space-y-2">
                  <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-violet-400">
                    Settings
                  </p>
                  <h2 className="m-0 text-[2rem] font-bold tracking-[-0.03em] text-slate-100">
                    Capture Setup
                  </h2>
                  <p className="m-0 max-w-[28rem] text-sm leading-6 text-slate-400">
                    Adjust the camera source, countdown timing, and live preview behavior without leaving
                    the booth screen.
                  </p>
                </div>
                <button
                  type="button"
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-[#7f0df224] text-slate-100 transition hover:bg-[#7f0df238]"
                  onClick={() => setShowSettings(false)}
                  aria-label="Close settings"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                <Settings
                  settings={settings}
                  onSettingsChange={setSettings}
                  cameraDevices={camera.devices}
                  activeDeviceId={camera.activeDeviceId}
                  onSelectCamera={onSelectCamera}
                  saveDir={saveDir}
                  onChangeSaveLocation={() => void onChangeSaveLocation()}
                  changingSaveLocation={changingSaveLocation}
                  canChangeSaveLocation={isElectronRuntime()}
                  showScreenFlash={isElectronRuntime()}
                />
              </div>

              <div className="border-t border-white/8 px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/8 bg-slate-950/35 px-4 py-3">
                  <div>
                    <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-violet-400">
                      Active Camera
                    </p>
                    <p className="mt-1 mb-0 text-sm text-slate-300">{cameraLabel}</p>
                  </div>
                  <button
                    type="button"
                    className="min-h-11 rounded-[14px] bg-[linear-gradient(180deg,#9333ea_0%,#7f0df2_100%)] px-[18px] text-sm font-semibold text-white transition hover:brightness-110"
                    onClick={() => setShowSettings(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {showGallery && (
        <div
          className="fixed inset-0 z-10 grid place-items-center bg-[rgba(3,6,18,0.7)] p-3 backdrop-blur-md sm:p-6"
          onClick={() => setShowGallery(false)}
        >
          <section
            className="max-h-[88vh] w-full max-w-[960px] overflow-auto rounded-[28px] border border-[#7f0df238] bg-[linear-gradient(180deg,rgba(16,19,44,0.98),rgba(9,12,29,0.98)),#0f1126] pb-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-6 pt-6">
              <div>
                <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-violet-400">
                  Captured
                </p>
                <h2 className="mt-[6px] mb-0 text-[1.7rem] font-bold">Gallery</h2>
              </div>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-full bg-[#7f0df224] text-slate-100 transition hover:bg-[#7f0df238]"
                onClick={() => setShowGallery(false)}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-5">
              <div className="flex items-center gap-[10px] text-slate-400">
                <FontAwesomeIcon icon={faRectangleList} />
                <span>{gallery.length} photos</span>
                <span className="text-slate-500/40">•</span>
                <span>{selectedCount} selected</span>
              </div>
              <div className="flex flex-wrap items-center gap-[10px]">
                <button
                  type="button"
                  className={`${modalButtonClasses} border border-slate-400/15 bg-slate-900/82 text-slate-100`}
                  onClick={() => setGallery((prev) => prev.map((item) => ({ ...item, selected: true })))}
                  disabled={gallery.length === 0}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className={`${modalButtonClasses} border border-slate-400/15 bg-slate-900/82 text-slate-100`}
                  onClick={() => setGallery((prev) => prev.map((item) => ({ ...item, selected: false })))}
                  disabled={gallery.length === 0}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className={`${modalButtonClasses} bg-[linear-gradient(180deg,#9333ea_0%,#7f0df2_100%)] text-white`}
                  onClick={onSaveSelected}
                  disabled={savingSelected || selectedCount === 0}
                >
                  {savingSelected ? "Saving..." : "Save selected"}
                </button>
              </div>
            </div>

            {gallery.length === 0 ? (
              <div className="grid min-h-[320px] place-content-center gap-3 px-6 text-center text-slate-400">
                <div className="justify-self-center text-4xl">
                  <FontAwesomeIcon icon={faImages} />
                </div>
                <p className="m-0">No photos captured yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-[18px] px-[18px] pt-6 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:px-6">
                {gallery.map((item) => (
                  <article
                    key={item.id}
                    className={`group relative overflow-hidden rounded-[20px] border bg-slate-900/72 transition ${
                      item.selected
                        ? "border-fuchsia-500/90 -translate-y-px"
                        : "border-slate-400/10"
                    }`}
                  >
                    <div className="absolute top-3 right-3 left-3 z-[1] flex items-center justify-between">
                      <label
                        className={`grid size-[34px] place-items-center rounded-full border border-white/14 bg-[rgba(3,6,18,0.68)] transition ${
                          item.selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                        aria-label="Select captured photo"
                      >
                        <input
                          type="checkbox"
                          className="size-[14px] accent-[#7f0df2]"
                          checked={item.selected}
                          onChange={() => onToggleGalleryItem(item.id)}
                        />
                      </label>
                      <button
                        type="button"
                        className="grid size-[34px] place-items-center rounded-full border border-white/14 bg-[rgba(3,6,18,0.68)] p-0 text-white opacity-0 transition group-hover:opacity-100"
                        aria-label="Delete captured photo"
                        onClick={() => onRemoveGalleryItem(item.id)}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="group block w-full bg-transparent p-0"
                      onClick={() => onToggleGalleryItem(item.id)}
                    >
                      <img src={item.previewUrl} alt="Captured" className="block aspect-[2/3] w-full object-cover" />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={(event) => void onWebFileSelected(event)}
      />
    </>
  );
}
