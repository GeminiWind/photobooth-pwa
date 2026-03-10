import SwiftUI

struct GalleryView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedItems: Set<String> = []
    @State private var showingDeleteConfirm = false
    @State private var savingSelected = false
    @State private var saveMessage = ""
    
    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]
    
    var body: some View {
        ZStack {
            // Background
            Color(hex: "160321")
                .ignoresSafeArea()
                .onTapGesture {
                    appState.showGallery = false
                }
            
            // Main content
            VStack(spacing: 0) {
                // Header
                HStack {
                    Button(action: { appState.showGallery = false }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(width: 40, height: 40)
                            .background(Color.white.opacity(0.1))
                            .clipShape(Circle())
                    }
                    
                    Spacer()
                    
                    Text("Gallery")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    if !selectedItems.isEmpty {
                        Button(action: { showingDeleteConfirm = true }) {
                            Image(systemName: "trash")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.red)
                                .frame(width: 40, height: 40)
                                .background(Color.red.opacity(0.2))
                                .clipShape(Circle())
                        }
                    } else {
                        Spacer()
                            .frame(width: 40)
                    }
                }
                .padding()

                HStack(spacing: 10) {
                    Label("\(appState.capturedPhotos.count) photos", systemImage: "photo.on.rectangle")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(Color(hex: "94a3b8"))

                    Text("•")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(Color(hex: "475569"))

                    Text("\(selectedItems.count) selected")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(Color(hex: "94a3b8"))

                    Spacer()
                }
                .padding(.horizontal)

                HStack(spacing: 8) {
                    Button(action: selectAll) {
                        Text("Select all")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.white.opacity(0.08))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .disabled(appState.capturedPhotos.isEmpty)

                    Button(action: clearSelection) {
                        Text("Clear")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.white.opacity(0.08))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .disabled(selectedItems.isEmpty)

                    Spacer()

                    Button(action: saveSelected) {
                        Label(savingSelected ? "Saving..." : "Save selected", systemImage: "square.and.arrow.down")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(
                                LinearGradient(
                                    colors: [Color(hex: "9333ea"), Color(hex: "7f0df2")],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .disabled(selectedItems.isEmpty || savingSelected)
                }
                .padding(.horizontal)
                .padding(.top, 8)

                if !saveMessage.isEmpty {
                    Text(saveMessage)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(Color(hex: "cbd5e1"))
                        .padding(.horizontal)
                        .padding(.top, 6)
                }
                
                if appState.capturedPhotos.isEmpty {
                    Spacer()
                    VStack(spacing: 16) {
                        Image(systemName: "photo.on.rectangle")
                            .font(.system(size: 48))
                            .foregroundColor(Color(hex: "94a3b8"))
                        
                        Text("No photos yet")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(Color(hex: "94a3b8"))
                        
                        Text("Take some photos to see them here")
                            .font(.system(size: 14))
                            .foregroundColor(Color(hex: "64748b"))
                    }
                    Spacer()
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 12) {
                            ForEach(appState.capturedPhotos) { item in
                                ZStack(alignment: .topTrailing) {
                                    GalleryItemView(
                                        item: item,
                                        isSelected: selectedItems.contains(item.id)
                                    )
                                    .onTapGesture {
                                        if !selectedItems.isEmpty {
                                            toggleSelection(item.id)
                                        } else {
                                            appState.activeCaptureId = item.id
                                            appState.showGallery = false
                                        }
                                    }

                                    Button(action: { toggleSelection(item.id) }) {
                                        Image(systemName: selectedItems.contains(item.id) ? "checkmark.circle.fill" : "circle")
                                            .font(.system(size: 22, weight: .semibold))
                                            .foregroundColor(selectedItems.contains(item.id) ? Color(hex: "7f0df2") : .white)
                                            .padding(8)
                                    }
                                }
                            }
                        }
                        .padding()
                    }
                }
            }
            
            // Bottom bar
            if !selectedItems.isEmpty {
                VStack {
                    Spacer()
                    
                    HStack {
                        Button(action: saveSelected) {
                            Label(savingSelected ? "Saving..." : "Save", systemImage: "square.and.arrow.down")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(
                                    LinearGradient(
                                        colors: [Color(hex: "9333ea"), Color(hex: "7f0df2")],
                                        startPoint: .top,
                                        endPoint: .bottom
                                    )
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                        }
                        .disabled(savingSelected)
                        
                        Button(action: clearSelection) {
                            Label("Clear", systemImage: "xmark.circle")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Color(hex: "7f0df2").opacity(0.3))
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                        }
                    }
                    .padding()
                    .background(Color(hex: "191022"))
                }
            }
        }
        .alert("Delete Photos?", isPresented: $showingDeleteConfirm) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                deleteSelected()
            }
        } message: {
            Text("Are you sure you want to delete \(selectedItems.count) photo(s)?")
        }
    }
    
    private func selectAll() {
        selectedItems = Set<String>(appState.capturedPhotos.map { $0.id })
    }

    private func clearSelection() {
        selectedItems.removeAll()
        saveMessage = ""
    }

    private func toggleSelection(_ id: String) {
        if selectedItems.contains(id) {
            selectedItems.remove(id)
        } else {
            selectedItems.insert(id)
        }
    }
    
    private func deleteSelected() {
        appState.capturedPhotos.removeAll { selectedItems.contains($0.id) }
        selectedItems.removeAll()
    }
    
    private func saveSelected() {
        let itemsToSave = appState.capturedPhotos.filter { selectedItems.contains($0.id) }
        guard !itemsToSave.isEmpty else { return }

        Task {
            savingSelected = true
            defer { savingSelected = false }

            do {
                var savedCount = 0
                for item in itemsToSave {
                    if let image = item.uiImage {
                        _ = try await appState.photoStorage.saveImage(image)
                        savedCount += 1
                    }
                }

                if savedCount == 0 {
                    saveMessage = "No valid photos to save."
                    return
                }

                saveMessage = "Saved \(savedCount) photo\(savedCount == 1 ? "" : "s") to Photos."
                selectedItems.removeAll()
            } catch {
                saveMessage = error.localizedDescription
            }
        }
    }
}

struct GalleryItemView: View {
    let item: GalleryItem
    let isSelected: Bool
    
    var body: some View {
        ZStack {
            item.image
                .resizable()
                .aspectRatio(2/3, contentMode: .fill)
                .clipShape(RoundedRectangle(cornerRadius: 16))
            
            if isSelected {
                RoundedRectangle(cornerRadius: 16)
                    .strokeBorder(Color(hex: "7f0df2"), lineWidth: 3)
                
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 24))
                    .foregroundColor(Color(hex: "7f0df2"))
                    .background(Color.white.clipShape(Circle()))
            }
        }
    }
}

#Preview {
    GalleryView()
        .environmentObject(AppState())
}
