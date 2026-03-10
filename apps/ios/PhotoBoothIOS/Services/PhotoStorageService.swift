import Photos
import UIKit

@MainActor
class PhotoStorageService: ObservableObject {
    @Published var authorizationStatus: PHAuthorizationStatus = .notDetermined
    
    init() {
        checkAuthorization()
    }
    
    func checkAuthorization() {
        authorizationStatus = PHPhotoLibrary.authorizationStatus(for: .addOnly)
    }
    
    func requestAuthorization() async -> Bool {
        let status = await PHPhotoLibrary.requestAuthorization(for: .addOnly)
        authorizationStatus = status
        return status == .authorized || status == .limited
    }
    
    func saveImage(_ image: UIImage) async throws -> String {
        let status = await requestAuthorization()
        guard status else {
            throw PhotoStorageError.notAuthorized
        }
        
        var savedAssetId: String?
        
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            PHPhotoLibrary.shared().performChanges {
                let request = PHAssetChangeRequest.creationRequestForAsset(from: image)
                savedAssetId = request.placeholderForCreatedAsset?.localIdentifier
            } completionHandler: { success, error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else if success {
                    continuation.resume()
                } else {
                    continuation.resume(throwing: PhotoStorageError.saveFailed)
                }
            }
        }
        
        return savedAssetId ?? "saved"
    }
    
    func saveImageData(_ data: Data) async throws -> String {
        guard let image = UIImage(data: data) else {
            throw PhotoStorageError.invalidImageData
        }
        return try await saveImage(image)
    }
    
    func shareImage(_ image: UIImage, from viewController: UIViewController) {
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            return
        }
        
        let activityItems: [Any] = [
            UIImage(data: imageData) ?? image,
            "Shared from PhotoBooth"
        ]
        
        let activityVC = UIActivityViewController(
            activityItems: activityItems,
            applicationActivities: nil
        )
        
        viewController.present(activityVC, animated: true)
    }
}

enum PhotoStorageError: LocalizedError {
    case notAuthorized
    case saveFailed
    case invalidImageData
    
    var errorDescription: String? {
        switch self {
        case .notAuthorized:
            return "Photo library access not authorized"
        case .saveFailed:
            return "Failed to save photo"
        case .invalidImageData:
            return "Invalid image data"
        }
    }
}
