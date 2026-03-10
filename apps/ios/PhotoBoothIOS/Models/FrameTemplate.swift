import Foundation

struct FrameTemplate: Identifiable, Equatable {
    let id: String
    let name: String
    let source: FrameSource
    let frameImagePathOrUrl: String
    let previewPathOrUrl: String?
    let safeArea: NormalizedRect
    let frameImageData: Data?
    let previewImageData: Data?
    
    enum FrameSource: String {
        case bundled
        case user
    }
    
    init(id: String, name: String, source: FrameSource, frameImagePathOrUrl: String, previewPathOrUrl: String?, safeArea: NormalizedRect, frameImageData: Data? = nil, previewImageData: Data? = nil) {
        self.id = id
        self.name = name
        self.source = source
        self.frameImagePathOrUrl = frameImagePathOrUrl
        self.previewPathOrUrl = previewPathOrUrl
        self.safeArea = safeArea
        self.frameImageData = frameImageData
        self.previewImageData = previewImageData
    }
}

struct NormalizedRect: Equatable {
    let x: Double
    let y: Double
    let width: Double
    let height: Double
    
    static let fullFrame = NormalizedRect(x: 0, y: 0, width: 1, height: 1)
}

struct BundledFrames {
    static let all: [FrameTemplate] = [
        FrameTemplate(
            id: "ivory-classic",
            name: "Classic",
            source: .bundled,
            frameImagePathOrUrl: "ivory-classic",
            previewPathOrUrl: "ivory-classic-preview",
            safeArea: .fullFrame
        ),
        FrameTemplate(
            id: "gold-vintage",
            name: "Vintage",
            source: .bundled,
            frameImagePathOrUrl: "gold-vintage",
            previewPathOrUrl: "gold-vintage-preview",
            safeArea: .fullFrame
        ),
        FrameTemplate(
            id: "blue-elegant",
            name: "Elegant",
            source: .bundled,
            frameImagePathOrUrl: "blue-elegant",
            previewPathOrUrl: "blue-elegant-preview",
            safeArea: .fullFrame
        ),
        FrameTemplate(
            id: "red-passion",
            name: "Passion",
            source: .bundled,
            frameImagePathOrUrl: "red-passion",
            previewPathOrUrl: "red-passion-preview",
            safeArea: .fullFrame
        ),
        FrameTemplate(
            id: "pastel-cute",
            name: "Cute",
            source: .bundled,
            frameImagePathOrUrl: "pastel-cute",
            previewPathOrUrl: "pastel-cute-preview",
            safeArea: .fullFrame
        )
    ]
}
