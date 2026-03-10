import Foundation
import SwiftUI
import UIKit

struct GalleryItem: Identifiable, Equatable {
    let id: String
    let compositedImageData: Data
    let capturedAt: Date
    let sequenceId: String?
    let shotIndex: Int?
    let sequenceCount: Int?
    var selected: Bool
    
    var image: Image {
        Image(uiImage: UIImage(data: compositedImageData) ?? UIImage())
    }
    
    var uiImage: UIImage? {
        UIImage(data: compositedImageData)
    }
    
    init(
        id: String = UUID().uuidString,
        compositedImage: UIImage,
        capturedAt: Date = Date(),
        sequenceId: String? = nil,
        shotIndex: Int? = nil,
        sequenceCount: Int? = nil,
        selected: Bool = false
    ) {
        self.id = id
        self.compositedImageData = compositedImage.pngData() ?? Data()
        self.capturedAt = capturedAt
        self.sequenceId = sequenceId
        self.shotIndex = shotIndex
        self.sequenceCount = sequenceCount
        self.selected = selected
    }

    init(
        id: String = UUID().uuidString,
        compositedImageData: Data,
        capturedAt: Date = Date(),
        sequenceId: String? = nil,
        shotIndex: Int? = nil,
        sequenceCount: Int? = nil,
        selected: Bool = false
    ) {
        self.id = id
        self.compositedImageData = compositedImageData
        self.capturedAt = capturedAt
        self.sequenceId = sequenceId
        self.shotIndex = shotIndex
        self.sequenceCount = sequenceCount
        self.selected = selected
    }
    
    static func == (lhs: GalleryItem, rhs: GalleryItem) -> Bool {
        lhs.id == rhs.id
    }
}

struct SharedPhotoItem: Identifiable {
    let id: String
    let imageData: Data
    let previewUrl: String
    
    var image: Image {
        Image(uiImage: UIImage(data: imageData) ?? UIImage())
    }
    
    var uiImage: UIImage? {
        UIImage(data: imageData)
    }
    
    init(id: String = UUID().uuidString, imageData: Data, previewUrl: String = "") {
        self.id = id
        self.imageData = imageData
        self.previewUrl = previewUrl
    }
    
    init(id: String = UUID().uuidString, image: UIImage, previewUrl: String = "") {
        self.id = id
        self.imageData = image.pngData() ?? Data()
        self.previewUrl = previewUrl
    }
}
