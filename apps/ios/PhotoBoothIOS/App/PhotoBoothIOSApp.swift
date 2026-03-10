import SwiftUI

@main
struct PhotoBoothIOSApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .preferredColorScheme(.dark)
        }
    }
}

@MainActor
class AppState: ObservableObject {
    @Published var showGallery = false
    @Published var showSettings = false
    @Published var capturedPhotos: [GalleryItem] = []
    @Published var activeCaptureId: String?
    @Published var sharedPhoto: SharedPhotoItem?
    @Published var error: String = ""
    @Published var notice: String = ""
    
    let settingsManager = SettingsManager.shared
    let cameraService = CameraService()
    let photoStorage = PhotoStorageService()
    
    init() {
        setupDeepLinkHandler()
    }
    
    private func setupDeepLinkHandler() {
        // Handle deep links when app launches with URL
    }
}
