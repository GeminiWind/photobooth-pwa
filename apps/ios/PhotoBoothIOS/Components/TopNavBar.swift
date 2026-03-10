import SwiftUI

struct TopNavBar: View {
    let title: String
    let showSettingsButton: Bool
    let showGalleryButton: Bool
    let onSettingsTap: () -> Void
    let onGalleryTap: () -> Void
    
    var body: some View {
        HStack {
            // Left side - empty for balance or settings
            if showSettingsButton {
                Button(action: onSettingsTap) {
                    ZStack {
                        Circle()
                            .fill(Color.white.opacity(0.1))
                            .frame(width: 40, height: 40)
                        
                        Image(systemName: "gearshape.fill")
                            .foregroundColor(Color(hex: "7f0df2"))
                            .font(.system(size: 16))
                    }
                }
            } else {
                Spacer()
                    .frame(width: 40)
            }
            
            // Center title
            Text(title)
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(Color(hex: "f1f5f9"))
                .tracking(-0.45)
            
            // Right side - gallery button
            if showGalleryButton {
                Button(action: onGalleryTap) {
                    ZStack {
                        Circle()
                            .fill(Color.white.opacity(0.1))
                            .frame(width: 40, height: 40)
                        
                        Image(systemName: "photo.on.rectangle")
                            .foregroundColor(Color(hex: "94a3b8"))
                            .font(.system(size: 16))
                    }
                }
            } else {
                Spacer()
                    .frame(width: 40)
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 48)
        .padding(.bottom, 16)
    }
}

struct TopNavBarSimple: View {
    let onBack: (() -> Void)?
    let title: String
    let onSettings: (() -> Void)?
    
    var body: some View {
        HStack {
            if let onBack = onBack {
                Button(action: onBack) {
                    ZStack {
                        Circle()
                            .fill(Color.white.opacity(0.1))
                            .frame(width: 40, height: 40)
                        
                        Image(systemName: "chevron.left")
                            .foregroundColor(Color(hex: "f1f5f9"))
                            .font(.system(size: 14, weight: .semibold))
                    }
                }
            } else {
                Spacer()
                    .frame(width: 40)
            }
            
            Spacer()
            
            Text(title)
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(Color(hex: "f1f5f9"))
                .tracking(-0.45)
            
            Spacer()
            
            if let onSettings = onSettings {
                Button(action: onSettings) {
                    ZStack {
                        Circle()
                            .fill(Color.white.opacity(0.1))
                            .frame(width: 40, height: 40)
                        
                        Image(systemName: "gearshape.fill")
                            .foregroundColor(Color(hex: "94a3b8"))
                            .font(.system(size: 16))
                    }
                }
            } else {
                Spacer()
                    .frame(width: 40)
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 48)
        .padding(.bottom, 16)
    }
}

#Preview {
    VStack(spacing: 20) {
        TopNavBar(
            title: "Simple Photobooth",
            showSettingsButton: true,
            showGalleryButton: true,
            onSettingsTap: {},
            onGalleryTap: {}
        )
        
        TopNavBarSimple(
            onBack: {},
            title: "Photobooth",
            onSettings: {}
        )
    }
    .background(Color(hex: "191022"))
}
