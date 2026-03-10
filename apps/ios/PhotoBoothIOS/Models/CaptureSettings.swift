import Foundation

struct CaptureSettings: Equatable {
    var countdownSeconds: Int
    var selectedFrameId: String
    var cameraDeviceId: String?
    var mirrorPreview: Bool
    var photoSequence: PhotoSequence
    var screenFlash: Bool
    
    enum PhotoSequence: String, CaseIterable, Identifiable {
        case single = "single"
        case threePhotos = "3photos"
        case fourPhotos = "4photos"
        case fivePhotos = "5photos"
        
        var id: String { rawValue }
        
        var displayName: String {
            switch self {
            case .single: return "Single Shot"
            case .threePhotos: return "3 Photos"
            case .fourPhotos: return "4 Photos"
            case .fivePhotos: return "5 Photos"
            }
        }
        
        var count: Int {
            switch self {
            case .single: return 1
            case .threePhotos: return 3
            case .fourPhotos: return 4
            case .fivePhotos: return 5
            }
        }
    }
    
    static let `default` = CaptureSettings(
        countdownSeconds: 3,
        selectedFrameId: "",
        cameraDeviceId: nil,
        mirrorPreview: true,
        photoSequence: .single,
        screenFlash: true
    )
}
