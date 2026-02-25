import type { CaptureSettings } from "@photobooth/core";

type Props = {
  settings: CaptureSettings;
  onSettingsChange: (settings: CaptureSettings) => void;
  cameraDevices: MediaDeviceInfo[];
  activeDeviceId?: string;
  onSelectCamera: (deviceId: string) => void;
};

export function Settings({ 
  settings, 
  onSettingsChange, 
  cameraDevices, 
  activeDeviceId, 
  onSelectCamera 
}: Props) {
  return (
    <section className="panel settings-panel">
      <h2>Settings</h2>
      
      <div className="settings-controls">
        <label>
          Camera
          <select
            value={activeDeviceId ?? settings.cameraDeviceId ?? ""}
            onChange={(event) => onSelectCamera(event.target.value)}
          >
            <option value="">Default Camera</option>
            {cameraDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </label>

        <label>
          Countdown (seconds)
          <input
            type="number"
            min={1}
            max={10}
            value={settings.countdownSeconds}
            onChange={(event) =>
              onSettingsChange({
                ...settings,
                countdownSeconds: Math.max(1, Math.min(10, Number(event.target.value) || 3))
              })
            }
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={settings.mirrorPreview}
            onChange={(event) => 
              onSettingsChange({ ...settings, mirrorPreview: event.target.checked })
            }
          />
          Mirror preview
        </label>
      </div>
    </section>
  );
}