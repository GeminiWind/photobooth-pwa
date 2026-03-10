import SwiftUI

struct CaptureButton: View {
    let isCapturing: Bool
    let countdown: Int?
    let disabled: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            ZStack {
                // Outer ring
                Circle()
                    .strokeBorder(Color.white.opacity(0.3), lineWidth: 4)
                    .frame(width: 80, height: 80)
                
                // Inner button
                if let countdown = countdown, countdown > 0 {
                    // Countdown state - show number
                    Circle()
                        .fill(Color(hex: "7f0df2"))
                        .frame(width: 64, height: 64)
                        .shadow(color: Color(hex: "7f0df2").opacity(0.4), radius: 10, x: 0, y: 4)
                    
                    Text("\(countdown)")
                        .font(.system(size: 28, weight: .heavy))
                        .foregroundColor(.white)
                } else if isCapturing {
                    // Capturing state
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: "9333ea"), Color(hex: "7f0df2")],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .frame(width: 64, height: 64)
                        .shadow(color: Color(hex: "7f0df2").opacity(0.4), radius: 10, x: 0, y: 4)
                    
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(1.5)
                } else {
                    // Normal state - camera icon
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: "9333ea"), Color(hex: "7f0df2")],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .frame(width: 64, height: 64)
                        .shadow(color: Color(hex: "7f0df2").opacity(0.4), radius: 10, x: 0, y: 4)
                    
                    Image(systemName: "camera.fill")
                        .font(.system(size: 24))
                        .foregroundColor(.white)
                }
            }
        }
        .disabled(disabled)
        .opacity(disabled ? 0.7 : 1.0)
    }
}

struct CaptureButtonLabel: View {
    let isCapturing: Bool
    let countdown: Int?
    let sequenceShotsTotal: Int
    let sequenceShotsRemaining: Int
    
    var body: some View {
        Text(buttonText)
            .font(.system(size: 14, weight: .bold))
            .foregroundColor(Color(hex: "94a3b8"))
            .tracking(0.12)
            .textCase(.uppercase)
    }
    
    private var buttonText: String {
        if isCapturing {
            return "Capturing..."
        }
        if let countdown = countdown, countdown > 0 {
            if sequenceShotsTotal > 1 {
                return "Shot \(sequenceShotsTotal - sequenceShotsRemaining + 1)/\(sequenceShotsTotal)"
            }
            return "Get Ready..."
        }
        return "Take Photo"
    }
}

#Preview {
    VStack(spacing: 20) {
        CaptureButton(
            isCapturing: false,
            countdown: nil,
            disabled: false,
            action: {}
        )
        
        CaptureButton(
            isCapturing: false,
            countdown: 3,
            disabled: true,
            action: {}
        )
        
        CaptureButton(
            isCapturing: true,
            countdown: nil,
            disabled: true,
            action: {}
        )
        
        CaptureButtonLabel(
            isCapturing: false,
            countdown: nil,
            sequenceShotsTotal: 1,
            sequenceShotsRemaining: 0
        )
        
        CaptureButtonLabel(
            isCapturing: false,
            countdown: 3,
            sequenceShotsTotal: 3,
            sequenceShotsRemaining: 2
        )
    }
    .padding()
    .background(Color(hex: "191022"))
}
