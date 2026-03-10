import Foundation

final class SettingsManager {
    static let shared = SettingsManager()
    
    private let settingsKey = "photobooth_settings"
    private let defaults = UserDefaults.standard
    
    private init() {}
    
    func loadSettings() -> CaptureSettings {
        guard let data = defaults.data(forKey: settingsKey),
              let decoded = try? JSONDecoder().decode(CaptureSettingsData.self, from: data) else {
            return .default
        }
        
        return CaptureSettings(
            countdownSeconds: decoded.countdownSeconds ?? 3,
            selectedFrameId: decoded.selectedFrameId ?? "",
            cameraDeviceId: decoded.cameraDeviceId,
            mirrorPreview: decoded.mirrorPreview ?? true,
            photoSequence: CaptureSettings.PhotoSequence(rawValue: decoded.photoSequence ?? "single") ?? .single,
            screenFlash: decoded.screenFlash ?? true
        )
    }
    
    func saveSettings(_ settings: CaptureSettings) {
        let data = CaptureSettingsData(
            countdownSeconds: settings.countdownSeconds,
            selectedFrameId: settings.selectedFrameId,
            cameraDeviceId: settings.cameraDeviceId,
            mirrorPreview: settings.mirrorPreview,
            photoSequence: settings.photoSequence.rawValue,
            screenFlash: settings.screenFlash
        )
        
        if let encoded = try? JSONEncoder().encode(data) {
            defaults.set(encoded, forKey: settingsKey)
        }
    }
}

private struct CaptureSettingsData: Codable {
    let countdownSeconds: Int?
    let selectedFrameId: String?
    let cameraDeviceId: String?
    let mirrorPreview: Bool?
    let photoSequence: String?
    let screenFlash: Bool?
}
