import SwiftUI

struct SharedPhotoView: View {
    @EnvironmentObject var appState: AppState
    @State private var notice: String = ""
    @State private var error: String = ""
    
    private var sharedPhoto: SharedPhotoItem? {
        appState.sharedPhoto
    }
    
    var body: some View {
        ZStack {
            // Background
            LinearGradient(
                colors: [Color(hex: "160321"), Color(hex: "14001b")],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                HStack {
                    Button(action: closeSharedPhoto) {
                        HStack(spacing: 8) {
                            Image(systemName: "camera.fill")
                                .font(.system(size: 14))
                            Text("PhotoBooth")
                                .font(.system(size: 16, weight: .bold))
                        }
                        .foregroundColor(.white)
                    }
                    
                    Spacer()
                    
                    Button(action: closeSharedPhoto) {
                        Image(systemName: "xmark")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(width: 40, height: 40)
                            .background(Color(hex: "7f0df2").opacity(0.2))
                            .clipShape(Circle())
                    }
                }
                .padding()
                
                Spacer()
                
                // Photo
                if let photo = sharedPhoto {
                    ZStack {
                        // Glow effect
                        Rectangle()
                            .fill(
                                LinearGradient(
                                    colors: [Color(hex: "7f0df2"), Color(hex: "d946ef")],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .opacity(0.25)
                            .blur(radius: 4)
                            .padding(-4)
                        
                        photo.image
                            .resizable()
                            .aspectRatio(2/3, contentMode: .fit)
                            .clipShape(RoundedRectangle(cornerRadius: 24))
                            .shadow(color: .black.opacity(0.25), radius: 25)
                    }
                    .padding(.horizontal, 40)
                }
                
                Spacer()
                
                // Content
                VStack(spacing: 12) {
                    Text("Opened from shared link")
                        .font(.system(size: 28, weight: .heavy))
                        .foregroundColor(.white)
                        .tracking(-0.04)
                    
                    Text("This is a compact preview shared without backend storage.")
                        .font(.system(size: 16))
                        .foregroundColor(Color(hex: "94a3b8"))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                }
                
                if !notice.isEmpty {
                    Text(notice)
                        .font(.system(size: 14))
                        .foregroundColor(.green)
                        .padding()
                        .background(Color.green.opacity(0.2))
                        .clipShape(Capsule())
                        .padding(.top, 8)
                }
                
                if !error.isEmpty {
                    Text(error)
                        .font(.system(size: 14))
                        .foregroundColor(.red)
                        .padding()
                        .background(Color.red.opacity(0.2))
                        .clipShape(Capsule())
                        .padding(.top, 8)
                }
                
                Spacer()
                
                // Action buttons
                VStack(spacing: 12) {
                    Button(action: saveSharedPhoto) {
                        Label("Save Preview", systemImage: "square.and.arrow.down")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                LinearGradient(
                                    colors: [Color(hex: "9333ea"), Color(hex: "7f0df2")],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 28))
                            .shadow(color: Color(hex: "7f0df2").opacity(0.2), radius: 10)
                    }
                    
                    Button(action: closeSharedPhoto) {
                        Label("Open Camera", systemImage: "arrow.counterclockwise")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(Color(hex: "94a3b8"))
                            .padding(.vertical, 14)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
        }
    }
    
    private func closeSharedPhoto() {
        appState.sharedPhoto = nil
    }
    
    private func saveSharedPhoto() {
        guard let photo = sharedPhoto,
              let image = photo.uiImage else {
            error = "No image to save"
            return
        }
        
        Task {
            do {
                _ = try await PhotoStorageService().saveImage(image)
                notice = "Saved to Photos!"
                try? await Task.sleep(nanoseconds: 2_000_000_000)
                notice = ""
            } catch {
                self.error = "Failed to save"
            }
        }
    }
}

#Preview {
    SharedPhotoView()
        .environmentObject(AppState())
}
