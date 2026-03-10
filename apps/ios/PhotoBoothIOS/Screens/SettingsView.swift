import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @Binding var settings: CaptureSettings
    @StateObject private var cameraService = CameraService()
    
    var body: some View {
        ZStack {
            // Dimmed background
            Color.black.opacity(0.6)
                .ignoresSafeArea()
                .onTapGesture {
                    appState.showSettings = false
                }
            
            // Settings panel
            VStack(spacing: 0) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Settings")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Color(hex: "7f0df2"))
                            .textCase(.uppercase)
                            .tracking(0.14)
                        
                        Text("Capture Setup")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.white)
                    }
                    
                    Spacer()
                    
                    Button(action: { appState.showSettings = false }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(width: 40, height: 40)
                            .background(Color(hex: "7f0df2").opacity(0.2))
                            .clipShape(Circle())
                    }
                }
                .padding()
                .background(Color(hex: "191022"))
                
                // Settings content
                ScrollView {
                    VStack(spacing: 24) {
                        // Countdown setting
                        SettingsSection(title: "Countdown") {
                            HStack {
                                ForEach([3, 5, 10], id: \.self) { seconds in
                                    Button(action: { settings.countdownSeconds = seconds }) {
                                        Text("\(seconds)s")
                                            .font(.system(size: 16, weight: settings.countdownSeconds == seconds ? .bold : .regular))
                                            .foregroundColor(settings.countdownSeconds == seconds ? .white : Color(hex: "94a3b8"))
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 12)
                                            .background(settings.countdownSeconds == seconds ? Color(hex: "7f0df2") : Color(hex: "1e293b"))
                                            .clipShape(RoundedRectangle(cornerRadius: 12))
                                    }
                                }
                            }
                        }
                        
                        // Photo sequence
                        SettingsSection(title: "Photo Sequence") {
                            VStack(spacing: 8) {
                                ForEach(CaptureSettings.PhotoSequence.allCases) { sequence in
                                    Button(action: { settings.photoSequence = sequence }) {
                                        HStack {
                                            Text(sequence.displayName)
                                                .font(.system(size: 16))
                                                .foregroundColor(.white)
                                            
                                            Spacer()
                                            
                                            if settings.photoSequence == sequence {
                                                Image(systemName: "checkmark")
                                                    .foregroundColor(Color(hex: "7f0df2"))
                                            }
                                        }
                                        .padding()
                                        .background(settings.photoSequence == sequence ? Color(hex: "7f0df2").opacity(0.1) : Color(hex: "1e293b"))
                                        .clipShape(RoundedRectangle(cornerRadius: 12))
                                    }
                                }
                            }
                        }
                        
                        // Mirror preview
                        SettingsSection(title: "Preview") {
                            Toggle(isOn: $settings.mirrorPreview) {
                                Text("Mirror Preview")
                                    .font(.system(size: 16))
                                    .foregroundColor(.white)
                            }
                            .tint(Color(hex: "7f0df2"))
                            .padding()
                            .background(Color(hex: "1e293b"))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        
                        // Screen flash
                        SettingsSection(title: "Effects") {
                            Toggle(isOn: $settings.screenFlash) {
                                Text("Screen Flash")
                                    .font(.system(size: 16))
                                    .foregroundColor(.white)
                            }
                            .tint(Color(hex: "7f0df2"))
                            .padding()
                            .background(Color(hex: "1e293b"))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    .padding()
                }
            }
            .frame(maxWidth: 580)
            .frame(maxHeight: .infinity, alignment: .top)
            .background(
                LinearGradient(
                    colors: [Color(hex: "101328"), Color(hex: "090c1d")],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 24))
            .shadow(color: .black.opacity(0.35), radius: 80, x: -24, y: 0)
        }
    }
}

struct SettingsSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title.uppercased())
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(Color(hex: "94a3b8"))
                .tracking(0.6)
            
            content
        }
    }
}

#Preview {
    SettingsView(settings: .constant(.default))
        .environmentObject(AppState())
}
