import SwiftUI
import UIKit

struct PreviewView: View {
    @EnvironmentObject var appState: AppState
    @State private var showingShareSheet = false
    @State private var notice: String = ""
    @State private var shareImage: UIImage?
    @State private var selectedPreviewId: String?
    
    private var activeItem: GalleryItem? {
        appState.capturedPhotos.first { $0.id == appState.activeCaptureId }
    }

    private var previewItems: [GalleryItem] {
        guard let activeItem else { return [] }
        guard let sequenceId = activeItem.sequenceId else { return [activeItem] }

        let grouped = appState.capturedPhotos
            .filter { $0.sequenceId == sequenceId }
            .sorted { ($0.shotIndex ?? 0) < ($1.shotIndex ?? 0) }

        return grouped.isEmpty ? [activeItem] : grouped
    }

    private var selectedItem: GalleryItem? {
        guard let selectedPreviewId else { return previewItems.first }
        return previewItems.first { $0.id == selectedPreviewId } ?? previewItems.first
    }

    private var selectedIndex: Int {
        guard let selectedPreviewId,
              let index = previewItems.firstIndex(where: { $0.id == selectedPreviewId }) else {
            return 0
        }
        return index
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
                    Button(action: { appState.activeCaptureId = nil }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(width: 40, height: 40)
                            .background(Color(hex: "7f0df2").opacity(0.2))
                            .clipShape(Circle())
                    }
                    
                    Spacer()
                    
                    HStack(spacing: 8) {
                        Image(systemName: "camera.fill")
                            .font(.system(size: 14))
                        Text("Reviewing \(selectedIndex + 1)/\(previewItems.count)")
                            .font(.system(size: 12, weight: .bold))
                    }
                    .foregroundColor(Color(hex: "7f0df2"))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color(hex: "7f0df2").opacity(0.1))
                    .clipShape(Capsule())
                    
                    Spacer()
                    
                    Color.clear
                        .frame(width: 40, height: 40)
                }
                .padding()
                
                Spacer()
                
                // Photo preview
                if !previewItems.isEmpty {
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
                        
                        TabView(selection: $selectedPreviewId) {
                            ForEach(previewItems) { item in
                                item.image
                                    .resizable()
                                    .aspectRatio(2/3, contentMode: .fit)
                                    .clipShape(RoundedRectangle(cornerRadius: 24))
                                    .shadow(color: .black.opacity(0.25), radius: 25)
                                    .tag(item.id as String?)
                            }
                        }
                        .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))

                        if previewItems.count > 1 {
                            HStack {
                                Button(action: showPreviousPhoto) {
                                    Image(systemName: "chevron.left")
                                        .font(.system(size: 18, weight: .bold))
                                        .foregroundColor(.white)
                                        .frame(width: 40, height: 40)
                                        .background(Color.black.opacity(0.4))
                                        .clipShape(Circle())
                                }

                                Spacer()

                                Button(action: showNextPhoto) {
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 18, weight: .bold))
                                        .foregroundColor(.white)
                                        .frame(width: 40, height: 40)
                                        .background(Color.black.opacity(0.4))
                                        .clipShape(Circle())
                                }
                            }
                            .padding(.horizontal, 20)
                        }
                    }
                    .padding(.horizontal, 20)
                }
                
                Spacer()
                
                // Title and description
                VStack(spacing: 8) {
                    Text("Looking sharp!")
                        .font(.system(size: 36, weight: .heavy))
                        .foregroundColor(.white)
                        .tracking(-0.04)
                    
                    Text("Your moment is captured. Save it or share with friends.")
                        .font(.system(size: 16))
                        .foregroundColor(Color(hex: "94a3b8"))
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, 24)
                
                if !notice.isEmpty {
                    Text(notice)
                        .font(.system(size: 14))
                        .foregroundColor(.green)
                        .padding()
                        .background(Color.green.opacity(0.2))
                        .clipShape(Capsule())
                        .padding(.top, 8)
                }
                
                Spacer()
                
                // Action buttons
                VStack(spacing: 12) {
                    // Save button
                    Button(action: savePhoto) {
                        Label("Save Photo", systemImage: "square.and.arrow.down")
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
                    
                    // Share button
                    Button(action: {
                        shareImage = selectedItem?.uiImage
                        showingShareSheet = true
                    }) {
                        Label("Share", systemImage: "square.and.arrow.up")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color(hex: "7f0df2").opacity(0.3))
                            .clipShape(RoundedRectangle(cornerRadius: 28))
                    }
                    
                    // Retake button
                    Button(action: { appState.activeCaptureId = nil }) {
                        Label("Retake Photo", systemImage: "arrow.counterclockwise")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(Color(hex: "94a3b8"))
                            .padding(.vertical, 14)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
        }
        .onAppear {
            syncSelectedPreview()
        }
        .onChange(of: appState.activeCaptureId) { _ in
            syncSelectedPreview()
        }
        .sheet(isPresented: $showingShareSheet) {
            if let image = shareImage {
                ShareSheet(activityItems: [image, "Shared from PhotoBooth"])
            }
        }
    }
    
    private func savePhoto() {
        guard let item = selectedItem,
              let image = item.uiImage else { return }
        
        Task {
            do {
                _ = try await PhotoStorageService().saveImage(image)
                notice = "Saved to Photos!"
                try? await Task.sleep(nanoseconds: 2_000_000_000)
                notice = ""
            } catch {
                notice = "Failed to save"
            }
        }
    }

    private func syncSelectedPreview() {
        if let activeItem {
            selectedPreviewId = activeItem.id
        } else {
            selectedPreviewId = nil
        }
    }

    private func showPreviousPhoto() {
        guard previewItems.count > 1 else { return }
        let nextIndex = (selectedIndex - 1 + previewItems.count) % previewItems.count
        selectedPreviewId = previewItems[nextIndex].id
    }

    private func showNextPhoto() {
        guard previewItems.count > 1 else { return }
        let nextIndex = (selectedIndex + 1) % previewItems.count
        selectedPreviewId = previewItems[nextIndex].id
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

#Preview {
    PreviewView()
        .environmentObject(AppState())
}
