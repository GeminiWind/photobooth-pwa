import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var cameraService = CameraService()
    @State private var frames: [FrameTemplate] = []
    @State private var settings: CaptureSettings
    @State private var countdown: Int? = nil
    @State private var isCapturing = false
    @State private var screenFlashVisible = false
    @State private var sequenceShotsRemaining = 0
    @State private var sequenceShotsTotal = 1
    
    init() {
        _settings = State(initialValue: SettingsManager.shared.loadSettings())
    }
    
    var body: some View {
        ZStack {
            Color(hex: "160321")
                .ignoresSafeArea()
            
            if appState.sharedPhoto != nil {
                SharedPhotoView()
            } else if appState.activeCaptureId != nil {
                PreviewView()
            } else {
                CaptureView(
                    frames: $frames,
                    settings: $settings,
                    countdown: $countdown,
                    isCapturing: $isCapturing,
                    screenFlashVisible: $screenFlashVisible,
                    sequenceShotsRemaining: $sequenceShotsRemaining,
                    sequenceShotsTotal: $sequenceShotsTotal
                )
            }
            
            if appState.showGallery {
                GalleryView()
            }
            
            if appState.showSettings {
                SettingsView(settings: $settings)
            }
        }
        .onAppear {
            loadFrames()
        }
        .onChange(of: settings) { newValue in
            SettingsManager.shared.saveSettings(newValue)
        }
    }
    
    private func loadFrames() {
        if frames.isEmpty {
            frames = BundledFrames.all
        }

        if settings.selectedFrameId.isEmpty || !frames.contains(where: { $0.id == settings.selectedFrameId }),
           let firstFrame = frames.first {
            settings.selectedFrameId = firstFrame.id
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
}
