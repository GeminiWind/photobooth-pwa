import UIKit

class FrameCompositor {
    static let shared = FrameCompositor()
    
    private let outputWidth: CGFloat = 1200
    private let outputHeight: CGFloat = 1800
    
    private init() {}
    
    func composeFrame(
        capturedImage: UIImage,
        frameTemplate: FrameTemplate,
        mirror: Bool = true
    ) -> UIImage? {
        let size = CGSize(width: outputWidth, height: outputHeight)
        
        UIGraphicsBeginImageContextWithOptions(size, true, 1.0)
        guard let context = UIGraphicsGetCurrentContext() else {
            UIGraphicsEndImageContext()
            return nil
        }
        
        // Fill background
        UIColor(red: 0.06, green: 0.09, blue: 0.16, alpha: 1.0).setFill()
        context.fill(CGRect(origin: .zero, size: size))
        
        // Calculate safe area for the captured image
        let safeArea = frameTemplate.safeArea
        let safeRect = CGRect(
            x: safeArea.x * outputWidth,
            y: safeArea.y * outputHeight,
            width: safeArea.width * outputWidth,
            height: safeArea.height * outputHeight
        )
        
        // Draw the captured image with cover fit
        if let drawnImage = drawImageCoverFit(
            capturedImage,
            in: safeRect,
            context: context,
            mirror: mirror
        ) {
            context.draw(drawnImage, in: safeRect)
        }
        
        // Draw the frame overlay - support both bundled and user-imported frames
        if let frameData = frameTemplate.frameImageData,
           let frameImage = UIImage(data: frameData) {
            frameImage.draw(in: safeRect)
        } else if let frameImage = loadFrameImage(named: frameTemplate.frameImagePathOrUrl) {
            frameImage.draw(in: safeRect)
        }
        
        // Draw date stamp at bottom
        drawDateStamp(in: context, rect: safeRect)
        
        let composedImage = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        
        return composedImage
    }
    
    private func drawImageCoverFit(
        _ image: UIImage,
        in targetRect: CGRect,
        context: CGContext,
        mirror: Bool
    ) -> CGImage? {
        let srcWidth = image.size.width
        let srcHeight = image.size.height
        let targetWidth = targetRect.width
        let targetHeight = targetRect.height
        
        let srcRatio = srcWidth / srcHeight
        let targetRatio = targetWidth / targetHeight
        
        var drawWidth: CGFloat
        var drawHeight: CGFloat
        var dx: CGFloat
        var dy: CGFloat
        
        if srcRatio > targetRatio {
            drawHeight = targetHeight
            drawWidth = drawHeight * srcRatio
            dx = (targetWidth - drawWidth) / 2
            dy = 0
        } else {
            drawWidth = targetWidth
            drawHeight = drawWidth / srcRatio
            dx = 0
            dy = (targetHeight - drawHeight) / 2
        }
        
        let drawRect = CGRect(x: dx, y: dy, width: drawWidth, height: drawHeight)
        
        // Create flipped context if mirroring
        let finalImage: UIImage
        if mirror {
            UIGraphicsBeginImageContextWithOptions(image.size, false, image.scale)
            guard let flipContext = UIGraphicsGetCurrentContext() else {
                UIGraphicsEndImageContext()
                return image.cgImage
            }
            
            flipContext.translateBy(x: image.size.width, y: image.size.height)
            flipContext.scaleBy(x: -1, y: -1)
            image.draw(at: .zero)
            
            finalImage = UIGraphicsGetImageFromCurrentImageContext() ?? image
            UIGraphicsEndImageContext()
        } else {
            finalImage = image
        }
        
        return finalImage.cgImage
    }
    
    private func loadFrameImage(named name: String) -> UIImage? {
        // Try to load from asset catalog first
        if let image = UIImage(named: name) {
            return image
        }
        
        // For bundled frames, generate a gradient placeholder
        return generateFramePlaceholder(for: name)
    }
    
    private func generateFramePlaceholder(for name: String) -> UIImage {
        let size = CGSize(width: outputWidth, height: outputHeight)
        
        UIGraphicsBeginImageContextWithOptions(size, false, 1.0)
        guard let context = UIGraphicsGetCurrentContext() else {
            return UIImage()
        }
        
        // Create gradient based on frame type
        let colors: [CGColor]
        
        switch name {
        case "ivory-classic":
            colors = [
                UIColor(white: 0.95, alpha: 1).cgColor,
                UIColor(white: 0.85, alpha: 1).cgColor
            ]
        case "gold-vintage":
            colors = [
                UIColor(red: 0.8, green: 0.6, blue: 0.2, alpha: 1).cgColor,
                UIColor(red: 0.6, green: 0.4, blue: 0.1, alpha: 1).cgColor
            ]
        case "blue-elegant":
            colors = [
                UIColor(red: 0.2, green: 0.4, blue: 0.8, alpha: 1).cgColor,
                UIColor(red: 0.1, green: 0.2, blue: 0.5, alpha: 1).cgColor
            ]
        case "red-passion":
            colors = [
                UIColor(red: 0.8, green: 0.2, blue: 0.2, alpha: 1).cgColor,
                UIColor(red: 0.5, green: 0.1, blue: 0.1, alpha: 1).cgColor
            ]
        case "pastel-cute":
            colors = [
                UIColor(red: 1.0, green: 0.8, blue: 0.9, alpha: 1).cgColor,
                UIColor(red: 0.9, green: 0.7, blue: 0.8, alpha: 1).cgColor
            ]
        default:
            colors = [
                UIColor(white: 0.9, alpha: 1).cgColor,
                UIColor(white: 0.8, alpha: 1).cgColor
            ]
        }
        
        let gradient = CGGradient(
            colorsSpace: CGColorSpaceCreateDeviceRGB(),
            colors: colors as CFArray,
            locations: [0, 1]
        )!
        
        context.drawLinearGradient(
            gradient,
            start: CGPoint(x: 0, y: 0),
            end: CGPoint(x: size.width, y: size.height),
            options: []
        )
        
        let image = UIGraphicsGetImageFromCurrentImageContext() ?? UIImage()
        UIGraphicsEndImageContext()
        
        return image
    }
    
    private func drawDateStamp(in context: CGContext, rect: CGRect) {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "MMM yyyy"
        let dateString = dateFormatter.string(from: Date())
        
        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 24, weight: .medium),
            .foregroundColor: UIColor(white: 0.6, alpha: 1)
        ]
        
        let textSize = dateString.size(withAttributes: attributes)
        let textRect = CGRect(
            x: rect.midX - textSize.width / 2,
            y: rect.maxY - textSize.height - 40,
            width: textSize.width,
            height: textSize.height
        )
        
        dateString.draw(in: textRect, withAttributes: attributes)
    }
}
