import SwiftUI
import AVFoundation

struct ViewfinderView: View {
    let selectedFrame: FrameTemplate?
    let mirrorPreview: Bool
    let onSettingsTap: () -> Void
    
    var body: some View {
        ZStack {
            // Camera preview placeholder (would be replaced with actual camera feed)
            CameraPreviewView(mirror: mirrorPreview)
                .overlay(
                    // Frame overlay
                    Group {
                        if let frame = selectedFrame {
                            FrameOverlayView(frame: frame)
                        }
                    }
                )
                .overlay(
                    // Vignette overlay
                    Rectangle()
                        .fill(
                            RadialGradient(
                                colors: [.clear, .black.opacity(0.3)],
                                center: .center,
                                startRadius: 100,
                                endRadius: 400
                            )
                        )
                )
                .overlay(
                    // Border
                    RoundedRectangle(cornerRadius: 24)
                        .strokeBorder(Color(hex: "1e293b").opacity(0.5), lineWidth: 3)
                )
                .clipShape(RoundedRectangle(cornerRadius: 24))
                .shadow(
                    color: Color(hex: "7f0df2").opacity(0.18),
                    radius: 25,
                    x: 0,
                    y: 0
                )
            
            // Settings button overlay
            VStack {
                HStack {
                    Spacer()
                    Button(action: onSettingsTap) {
                        ZStack {
                            Circle()
                                .fill(Color.black.opacity(0.4))
                                .frame(width: 40, height: 40)
                            
                            Image(systemName: "gearshape.fill")
                                .foregroundColor(.white)
                                .font(.system(size: 16))
                        }
                    }
                    .padding(.trailing, 12)
                    .padding(.top, 12)
                }
                Spacer()
            }
        }
    }
}

struct CameraPreviewView: View {
    let mirror: Bool
    
    var body: some View {
        ZStack {
            // Placeholder - in real app this would be AVCaptureVideoPreviewLayer
            Rectangle()
                .fill(
                    RadialGradient(
                        colors: [
                            Color(hex: "264571").opacity(0.8),
                            Color(hex: "080f1e").opacity(0.98)
                        ],
                        center: .center,
                        startRadius: 100,
                        endRadius: 500
                    )
                )
            
            // Grid overlay
            GeometryReader { geometry in
                Path { path in
                    let width = geometry.size.width
                    let height = geometry.size.height
                    
                    // Vertical lines
                    path.move(to: CGPoint(x: width * 0.33, y: 0))
                    path.addLine(to: CGPoint(x: width * 0.33, y: height))
                    
                    path.move(to: CGPoint(x: width * 0.66, y: 0))
                    path.addLine(to: CGPoint(x: width * 0.66, y: height))
                    
                    // Horizontal lines
                    path.move(to: CGPoint(x: 0, y: height * 0.33))
                    path.addLine(to: CGPoint(x: width, y: height * 0.33))
                    
                    path.move(to: CGPoint(x: 0, y: height * 0.66))
                    path.addLine(to: CGPoint(x: width, y: height * 0.66))
                }
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
            }
        }
    }
}

struct FrameOverlayView: View {
    let frame: FrameTemplate
    
    var body: some View {
        ZStack {
            // Frame placeholder - in real app would load frame image
            Rectangle()
                .fill(.clear)
                .background(
                    Rectangle()
                        .fill(frameGradient)
                        .opacity(0.3)
                )
        }
    }
    
    private var frameGradient: LinearGradient {
        switch frame.id {
        case "ivory-classic":
            return LinearGradient(
                colors: [Color.white.opacity(0.1), Color.white.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case "gold-vintage":
            return LinearGradient(
                colors: [Color(hex: "eca32e").opacity(0.2), Color(hex: "9a6d12").opacity(0.1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        default:
            return LinearGradient(
                colors: [.clear, .clear],
                startPoint: .top,
                endPoint: .bottom
            )
        }
    }
}

#Preview {
    ViewfinderView(
        selectedFrame: BundledFrames.all.first,
        mirrorPreview: true,
        onSettingsTap: {}
    )
    .frame(width: 341, height: 455)
    .background(Color(hex: "0f172a"))
}
