import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CameraState = {
  devices: MediaDeviceInfo[];
  activeDeviceId?: string;
  error?: string;
  ready: boolean;
};

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>({ devices: [], ready: false });

  const attachStreamToVideo = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
    if (!video || !streamRef.current) {
      return;
    }

    if (video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current;
    }

    void video.play().catch(() => {
      setState((prev) => ({
        ...prev,
        ready: false,
        error: "Unable to resume camera preview."
      }));
    });
  }, []);

  const loadDevices = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((item) => item.kind === "videoinput");
    setState((prev) => ({ ...prev, devices: cameras }));
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setState((prev) => ({ ...prev, ready: false }));
  }, []);

  const start = useCallback(async (deviceId?: string) => {
    try {
      stop();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings();
      setState((prev) => ({
        ...prev,
        activeDeviceId: settings.deviceId,
        ready: true,
        error: undefined
      }));
      await loadDevices();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        ready: false,
        error: error instanceof Error ? error.message : "Camera error"
      }));
    }
  }, [loadDevices, stop]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setState((prev) => ({ ...prev, error: "Camera API is not available in this browser." }));
        }
        return;
      }

      await loadDevices();
      await start();
    };

    const onDeviceChange = async () => {
      await loadDevices();
    };

    void init();
    navigator.mediaDevices?.addEventListener("devicechange", onDeviceChange);

    return () => {
      cancelled = true;
      navigator.mediaDevices?.removeEventListener("devicechange", onDeviceChange);
      stop();
    };
  }, [loadDevices, start, stop]);

  const hasDevices = useMemo(() => state.devices.length > 0, [state.devices.length]);

  return {
    videoRef,
    attachStreamToVideo,
    state,
    hasDevices,
    start,
    stop
  };
}
