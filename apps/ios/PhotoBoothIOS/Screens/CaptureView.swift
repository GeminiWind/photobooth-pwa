import SwiftUI
import UIKit

struct CaptureView: View {
    @EnvironmentObject var appState: AppState
    @Binding var frames: [FrameTemplate]
    @Binding var settings: CaptureSettings
    @Binding var countdown: Int?
    @Binding var isCapturing: Bool
    @Binding var screenFlashVisible: Bool
    @Binding var sequenceShotsRemaining: Int
    @Binding var sequenceShotsTotal: Int
    
    @StateObject private var cameraService = CameraService()
    @State private var captureTimer: Timer?
    @State private var error: String?
    @State private var activeSequenceId: String?
    @State private var capturedSequenceIds: [String] = []
    
    private var selectedFrame: FrameTemplate? {
        frames.first { $0.id == settings.selectedFrameId } ?? frames.first
    }
    
    var body: some View {
        ZStack {
            // Background gradient
            RadialGradient(
                colors: [
                    Color(hex: "22406b").opacity(0.45),
                    Color(hex: "160321")
                ],
                center: UnitPoint(x: 0.6, y: 0.48),
                startRadius: 0,
                endRadius: 500
            )
            .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                TopNavBar(
                    title: "Simple Photobooth",
                    showSettingsButton: false,
                    showGalleryButton: true,
                    onSettingsTap: { appState.showSettings = true },
                    onGalleryTap: { appState.showGallery = true }
                )
                
                Spacer()
                
                // Viewfinder
                ViewfinderView(
                    selectedFrame: selectedFrame,
                    mirrorPreview: settings.mirrorPreview,
                    onSettingsTap: { appState.showSettings = true }
                )
                .frame(width: 341, height: 455)
                .padding(.horizontal, 16)
                
                Spacer()
                
                // Bottom controls
                VStack(spacing: 24) {
                    // Frame picker
                    FramePicker(
                        frames: $frames,
                        selectedFrameId: $settings.selectedFrameId,
                        onSelect: { frameId in
                            settings.selectedFrameId = frameId
                        },
                        onImport: {
                            // Import custom frame
                        }
                    )
                    
                    // Capture button row
                    HStack {
                        // Gallery button
                        Button(action: { appState.showGallery = true }) {
                            VStack(spacing: 4) {
                                Image(systemName: "photo.on.rectangle")
                                    .font(.system(size: 20))
                                    .foregroundColor(Color(hex: "94a3b8"))
                                
                                Text("Gallery")
                                    .font(.system(size: 10, weight: .medium))
                                    .foregroundColor(Color(hex: "94a3b8"))
                            }
                            .frame(width: 64, height: 50)
                        }
                        
                        Spacer()
                        
                        // Capture button
                        CaptureButton(
                            isCapturing: isCapturing,
                            countdown: countdown,
                            disabled: isCapturing || countdown != nil
                        ) {
                            startCapture()
                        }
                        
                        Spacer()
                        
                        // Save button (disabled)
                        VStack(spacing: 4) {
                            Image(systemName: "square.and.arrow.down")
                                .font(.system(size: 20))
                                .foregroundColor(Color(hex: "94a3b8"))
                                .opacity(0.5)
                            
                            Text("Save")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(Color(hex: "7f0df2"))
                        }
                        .frame(width: 64, height: 50)
                    }
                    .padding(.horizontal, 32)
                }
                .padding(.vertical, 24)
                .background(
                    Rectangle()
                        .fill(Color(hex: "191022").opacity(0.8))
                        .background(.ultraThinMaterial)
                )
                .clipShape(
                    RoundedRectangle(cornerRadius: 24)
                )
            }
            
            // Error banner
            if let error = error {
                VStack {
                    HStack {
                        Text(error)
                            .font(.system(size: 14))
                            .foregroundColor(.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(Color.red.opacity(0.8))
                            .clipShape(Capsule())
                        
                        Spacer()
                    }
                    .padding()
                    
                    Spacer()
                }
            }
            
            // Screen flash
            if screenFlashVisible {
                Color.white
                    .ignoresSafeArea()
                    .transition(.opacity)
            }
        }
        .onAppear {
            cameraService.start()
        }
        .onChange(of: countdown) { newValue in
            handleCountdownChange(newValue)
        }
    }
    
    private func startCapture() {
        guard selectedFrame != nil else {
            error = "No frame selected"
            return
        }
        
        error = nil
        
        let totalShots = settings.photoSequence.count
        sequenceShotsTotal = totalShots
        sequenceShotsRemaining = totalShots
        activeSequenceId = totalShots > 1 ? UUID().uuidString : nil
        capturedSequenceIds = []
        
        countdown = settings.countdownSeconds
    }
    
    private func handleCountdownChange(_ newValue: Int?) {
        if newValue == 0 {
            capturePhoto()
        } else if let value = newValue, value > 0 {
            // Continue countdown
            DispatchQueue.main.asyncAfter(deadline: .now() + 1) { [self] in
                if countdown != nil && countdown! > 0 {
                    countdown = countdown! - 1
                }
            }
        }
    }
    
    private func capturePhoto() {
        isCapturing = true
        
        if settings.screenFlash {
            screenFlashVisible = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.16) {
                screenFlashVisible = false
            }
        }
        
        cameraService.capturePhoto()
        
        // For now, create a placeholder
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [self] in
            // Create placeholder image for demo
            let placeholderImage = createPlaceholderImage()
            composeAndSave(placeholderImage)
        }
    }
    
    private func createPlaceholderImage() -> UIImage {
        let size = CGSize(width: 1200, height: 1800)
        UIGraphicsBeginImageContextWithOptions(size, true, 1.0)
        
        // Background
        UIColor(red: 0.06, green: 0.09, blue: 0.16, alpha: 1.0).setFill()
        UIRectFill(CGRect(origin: .zero, size: size))
        
        // Add some gradient
        let gradientColors = [UIColor.purple.withAlphaComponent(0.3).cgColor, UIColor.clear.cgColor] as CFArray
        guard let gradient = CGGradient(
            colorsSpace: CGColorSpaceCreateDeviceRGB(),
            colors: gradientColors,
            locations: [0, 1]
        ) else {
            UIGraphicsEndImageContext()
            return UIGraphicsGetImageFromCurrentImageContext() ?? UIImage()
        }
        
        UIGraphicsGetCurrentContext()?.drawLinearGradient(
            gradient,
            start: CGPoint(x: 0, y: 0),
            end: CGPoint(x: size.width, y: size.height),
            options: []
        )
        
        let image = UIGraphicsGetImageFromCurrentImageContext() ?? UIImage()
        UIGraphicsEndImageContext()
        
        return image
    }
    
    private func composeAndSave(_ image: UIImage) {
        guard let frame = selectedFrame else { return }
        
        let composed = FrameCompositor.shared.composeFrame(
            capturedImage: image,
            frameTemplate: frame,
            mirror: settings.mirrorPreview
        ) ?? image
        
        let currentShotIndex = sequenceShotsTotal - sequenceShotsRemaining
        let item = GalleryItem(
            compositedImage: composed,
            sequenceId: activeSequenceId,
            shotIndex: sequenceShotsTotal > 1 ? currentShotIndex : nil,
            sequenceCount: sequenceShotsTotal > 1 ? sequenceShotsTotal : nil
        )
        
        DispatchQueue.main.async { [self] in
            appState.capturedPhotos.insert(item, at: 0)
            capturedSequenceIds.append(item.id)
            isCapturing = false
            countdown = nil
            
            // Handle sequence
            sequenceShotsRemaining -= 1
            if sequenceShotsRemaining > 0 {
                countdown = settings.countdownSeconds
            } else {
                appState.activeCaptureId = capturedSequenceIds.first ?? item.id
                capturedSequenceIds = []
                activeSequenceId = nil
                sequenceShotsRemaining = 0
            }
        }
    }
}

#Preview {
    CaptureView(
        frames: .constant(BundledFrames.all),
        settings: .constant(.default),
        countdown: .constant(nil),
        isCapturing: .constant(false),
        screenFlashVisible: .constant(false),
        sequenceShotsRemaining: .constant(0),
        sequenceShotsTotal: .constant(1)
    )
    .environmentObject(AppState())
}
