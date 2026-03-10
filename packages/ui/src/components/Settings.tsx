import type { CaptureSettings } from "@photobooth/core";

type Props = {
  settings: CaptureSettings;
  onSettingsChange: (settings: CaptureSettings) => void;
  cameraDevices: MediaDeviceInfo[];
  activeDeviceId?: string;
  onSelectCamera: (deviceId: string) => void;
  saveDir: string;
  onChangeSaveLocation: () => void;
  changingSaveLocation: boolean;
  canChangeSaveLocation: boolean;
  showScreenFlash: boolean;
};

// Toggle Switch Component
function ToggleSwitch({
  checked,
  onChange,
  id,
  disabled = false
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={`relative inline-flex items-center ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        id={id}
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <div className="relative h-8 w-14 rounded-full bg-slate-600 transition-colors duration-200 peer-checked:bg-purple-500">
      </div>
      <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform duration-200 peer-checked:translate-x-6"></div>
    </label>
  );
}

// Option Button Component
function OptionButton({ 
  children, 
  selected, 
  onClick, 
  className = "" 
}: { 
  children: React.ReactNode; 
  selected: boolean; 
  onClick: () => void; 
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
        selected 
          ? "bg-purple-500 text-white shadow-lg" 
          : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Settings({
  settings,
  onSettingsChange,
  cameraDevices,
  activeDeviceId,
  onSelectCamera,
  saveDir,
  onChangeSaveLocation,
  changingSaveLocation,
  canChangeSaveLocation,
  showScreenFlash
}: Props) {
  return (
    <section className="space-y-8 p-6">
      {/* Countdown Timer */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
            <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-300 uppercase tracking-wide">Countdown Timer</h3>
        </div>
        <div className="flex flex-wrap gap-2 rounded-full bg-slate-800/50 p-1">
          <OptionButton
            selected={settings.countdownSeconds === 0}
            onClick={() => onSettingsChange({ ...settings, countdownSeconds: 0 })}
          >
            Off
          </OptionButton>
          <OptionButton
            selected={settings.countdownSeconds === 3}
            onClick={() => onSettingsChange({ ...settings, countdownSeconds: 3 })}
          >
            3s
          </OptionButton>
          <OptionButton
            selected={settings.countdownSeconds === 5}
            onClick={() => onSettingsChange({ ...settings, countdownSeconds: 5 })}
          >
            5s
          </OptionButton>
          <OptionButton
            selected={settings.countdownSeconds === 10}
            onClick={() => onSettingsChange({ ...settings, countdownSeconds: 10 })}
          >
            10s
          </OptionButton>
          <OptionButton
            selected={![0, 3, 5, 10].includes(settings.countdownSeconds)}
            onClick={() => {/* Custom timer logic could go here */}}
          >
            Custom
          </OptionButton>
        </div>
      </div>

      {/* Camera Source */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
            <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-300 uppercase tracking-wide">Camera Source</h3>
        </div>
        <div className="relative">
          <select
            className="w-full appearance-none rounded-xl border border-slate-600/50 bg-slate-800/60 px-4 py-4 pr-10 text-slate-200 transition-colors focus:border-purple-400 focus:outline-none"
            value={activeDeviceId ?? settings.cameraDeviceId ?? ""}
            onChange={(event) => onSelectCamera(event.target.value)}
          >
              <option value="">Default camera</option>
            {cameraDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Photo Sequence */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
            <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-300 uppercase tracking-wide">Photo Sequence</h3>
        </div>
        <div className="flex flex-wrap gap-2 rounded-full bg-slate-800/50 p-1">
          <OptionButton 
            selected={settings.photoSequence === 'single'} 
            onClick={() => onSettingsChange({ ...settings, photoSequence: 'single' })}
          >
            Single Shot
          </OptionButton>
          <OptionButton 
            selected={settings.photoSequence === '3photos'} 
            onClick={() => onSettingsChange({ ...settings, photoSequence: '3photos' })}
          >
            3 Photos
          </OptionButton>
          <OptionButton 
            selected={settings.photoSequence === '4photos'} 
            onClick={() => onSettingsChange({ ...settings, photoSequence: '4photos' })}
          >
            4 Photos
          </OptionButton>
          <OptionButton 
            selected={settings.photoSequence === '5photos'} 
            onClick={() => onSettingsChange({ ...settings, photoSequence: '5photos' })}
          >
            5 Photos
          </OptionButton>
        </div>
      </div>

      {/* Screen Flash & Mirror Image */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center">
                <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-slate-200 font-medium">Screen Flash</span>
            </div>
            <ToggleSwitch
              id="screen-flash"
              checked={settings.screenFlash}
              onChange={(checked) => onSettingsChange({ ...settings, screenFlash: checked })}
              disabled={!showScreenFlash}
            />
          </div>
          {!showScreenFlash && (
            <p className="mt-2 mb-0 text-xs text-slate-400">Available in desktop mode only.</p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center">
              <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="text-slate-200 font-medium">Mirror Image</span>
          </div>
          <ToggleSwitch 
            id="mirror-image" 
            checked={settings.mirrorPreview} 
            onChange={(checked) => onSettingsChange({ ...settings, mirrorPreview: checked })} 
          />
        </div>
      </div>

      {/* Save Location */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
            <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-300 uppercase tracking-wide">Save Location</h3>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-600/50 bg-slate-800/60 px-4 py-4">
          <div className="flex-1">
            <div className="text-sm text-slate-400 mb-1">Current destination</div>
            <div className="text-slate-200 font-mono text-sm break-all">
              {saveDir || "/Users/admin/Pictures/Photobooth_App/"}
            </div>
            {!canChangeSaveLocation && (
              <div className="mt-2 text-xs text-slate-400">Folder selection is available in desktop mode.</div>
            )}
          </div>
          <button
            type="button"
            className="ml-4 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onChangeSaveLocation}
            disabled={!canChangeSaveLocation || changingSaveLocation}
          >
            {changingSaveLocation ? "Opening..." : "Change"}
          </button>
        </div>
      </div>


    </section>
  );
}
