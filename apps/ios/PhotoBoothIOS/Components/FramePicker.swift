import SwiftUI
import PhotosUI
import UIKit

struct FramePicker: View {
    @Binding var frames: [FrameTemplate]
    @Binding var selectedFrameId: String
    let onSelect: (String) -> Void
    let onImport: () -> Void
    
    @State private var showingImagePicker = false
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var importedFrames: [FrameTemplate] = []
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Choose Frame")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(Color(hex: "94a3b8"))
                .tracking(0.6)
                .textCase(.uppercase)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    // Add New Frame Button
                    Button(action: { showingImagePicker = true }) {
                        VStack(spacing: 4) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(Color(hex: "1e293b"))
                                    .frame(width: 64, height: 64)
                                
                                Image(systemName: "plus")
                                    .foregroundColor(Color(hex: "94a3b8"))
                            }
                            
                            Text("Add New")
                                .font(.system(size: 10))
                                .foregroundColor(Color(hex: "94a3b8"))
                        }
                    }
                    .buttonStyle(.plain)
                    .photosPicker(isPresented: $showingImagePicker, selection: $selectedPhotoItem, matching: .images)
                    .onChange(of: selectedPhotoItem) { newItem in
                        handleImageImport(newItem)
                    }
                    
                    // Frame Options
                    ForEach(frames) { frame in
                        FrameThumbnail(
                            frame: frame,
                            isSelected: frame.id == selectedFrameId,
                            onSelect: { onSelect(frame.id) },
                            onDelete: frame.source == .user ? { deleteFrame(frame.id) } : nil
                        )
                    }
                }
                .padding(.horizontal, 4)
            }
        }
    }
    
    private func handleImageImport(_ item: PhotosPickerItem?) {
        guard let item = item else { return }
        
        Task {
            if let data = try? await item.loadTransferable(type: Data.self) {
                await MainActor.run {
                    let newFrame = FrameTemplate(
                        id: UUID().uuidString,
                        name: "Custom \(frames.count + 1)",
                        source: .user,
                        frameImagePathOrUrl: "",
                        previewPathOrUrl: nil,
                        safeArea: .fullFrame,
                        frameImageData: data,
                        previewImageData: data
                    )
                    frames.append(newFrame)
                    selectedFrameId = newFrame.id
                    onImport()
                    selectedPhotoItem = nil
                }
            }
        }
    }
    
    private func deleteFrame(_ id: String) {
        frames.removeAll { $0.id == id }
        if selectedFrameId == id {
            selectedFrameId = frames.first?.id ?? ""
        }
    }
}

struct FrameThumbnail: View {
    let frame: FrameTemplate
    let isSelected: Bool
    let onSelect: () -> Void
    let onDelete: (() -> Void)?
    
    var body: some View {
        Button(action: onSelect) {
            VStack(spacing: 4) {
                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(frameGradient)
                        .frame(width: 64, height: 64)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(
                                    isSelected ? Color(hex: "7f0df2") : Color.clear,
                                    lineWidth: 2
                                )
                        )
                        .shadow(
                            color: isSelected ? Color(hex: "7f0df2").opacity(0.2) : Color.clear,
                            radius: 4
                        )
                    
                    if let previewData = frame.previewImageData,
                       let uiImage = UIImage(data: previewData) {
                        Image(uiImage: uiImage)
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: 64, height: 64)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                    } else if let previewName = frame.previewPathOrUrl {
                        Image(previewName)
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: 64, height: 64)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                    } else {
                        Image(systemName: "photo")
                            .foregroundColor(.white.opacity(0.5))
                    }
                    
                    if let onDelete = onDelete {
                        Button(action: onDelete) {
                            ZStack {
                                Circle()
                                    .fill(Color.black.opacity(0.6))
                                    .frame(width: 20, height: 20)
                                Image(systemName: "xmark")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.white)
                            }
                        }
                        .position(x: 54, y: 10)
                    }
                }
                
                Text(frame.name)
                    .font(.system(size: 10, weight: isSelected ? .bold : .regular))
                    .foregroundColor(isSelected ? Color(hex: "7f0df2") : Color(hex: "94a3b8"))
            }
        }
        .buttonStyle(.plain)
    }
    
    private var frameGradient: LinearGradient {
        switch frame.id {
        case "ivory-classic":
            return LinearGradient(
                colors: [Color(white: 0.95), Color(white: 0.85)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case "gold-vintage":
            return LinearGradient(
                colors: [Color(hex: "eca32e"), Color(hex: "9a6d12")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case "blue-elegant":
            return LinearGradient(
                colors: [Color(hex: "3b82f6"), Color(hex: "1e40af")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case "red-passion":
            return LinearGradient(
                colors: [Color(hex: "ef4444"), Color(hex: "991b1b")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case "pastel-cute":
            return LinearGradient(
                colors: [Color(hex: "fbcfe8"), Color(hex: "f9a8d4")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        default:
            return LinearGradient(
                colors: [Color(hex: "334155"), Color(hex: "1e293b")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

#Preview {
    FramePicker(
        frames: .constant(BundledFrames.all),
        selectedFrameId: .constant("ivory-classic"),
        onSelect: { _ in },
        onImport: {}
    )
    .padding()
    .background(Color(hex: "191022"))
}
