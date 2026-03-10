import AVFoundation
import SwiftUI
import UIKit

@MainActor
class CameraService: NSObject, ObservableObject {
    @Published var isAuthorized = false
    @Published var isRunning = false
    @Published var error: String?
    @Published var devices: [AVCaptureDevice] = []
    @Published var activeDeviceId: String?
    @Published var previewLayer: AVCaptureVideoPreviewLayer?
    
    let session = AVCaptureSession()
    private var videoOutput: AVCaptureVideoDataOutput?
    private var photoOutput: AVCapturePhotoOutput?
    private var currentDeviceInput: AVCaptureDeviceInput?
    
    var onPhotoCaptured: ((UIImage) -> Void)?
    
    override init() {
        super.init()
        checkAuthorization()
    }
    
    func checkAuthorization() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            isAuthorized = true
            setupSession()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                Task { @MainActor in
                    self?.isAuthorized = granted
                    if granted {
                        self?.setupSession()
                    }
                }
            }
        case .denied, .restricted:
            isAuthorized = false
            error = "Camera access denied. Please enable in Settings."
        @unknown default:
            isAuthorized = false
        }
    }
    
    private func setupSession() {
        session.beginConfiguration()
        session.sessionPreset = .photo
        
        // Add video input
        guard let videoDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front)
                ?? AVCaptureDevice.default(for: .video) else {
            error = "No camera available"
            session.commitConfiguration()
            return
        }
        
        do {
            let input = try AVCaptureDeviceInput(device: videoDevice)
            if session.canAddInput(input) {
                session.addInput(input)
                currentDeviceInput = input
                activeDeviceId = videoDevice.uniqueID
            }
            
            // Add video output for preview
            let videoOutput = AVCaptureVideoDataOutput()
            videoOutput.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
            videoOutput.setSampleBufferDelegate(self, queue: DispatchQueue(label: "camera.frame.queue"))
            
            if session.canAddOutput(videoOutput) {
                session.addOutput(videoOutput)
                self.videoOutput = videoOutput
            }
            
            // Add photo output for capturing
            let photoOutput = AVCapturePhotoOutput()
            if session.canAddOutput(photoOutput) {
                session.addOutput(photoOutput)
                self.photoOutput = photoOutput
                photoOutput.isHighResolutionCaptureEnabled = true
            }
            
            // Get all available devices
            let discoverySession = AVCaptureDevice.DiscoverySession(
                deviceTypes: [.builtInWideAngleCamera],
                mediaType: .video,
                position: .unspecified
            )
            devices = discoverySession.devices
            
        } catch {
            self.error = "Failed to setup camera: \(error.localizedDescription)"
        }
        
        session.commitConfiguration()
    }
    
    func start() {
        guard isAuthorized, !session.isRunning else { return }
        
        Task {
            do {
                try session.startRunning()
                await MainActor.run {
                    isRunning = true
                }
            } catch {
                await MainActor.run {
                    self.error = "Failed to start camera: \(error.localizedDescription)"
                }
            }
        }
    }
    
    func stop() {
        guard session.isRunning else { return }
        session.stopRunning()
        isRunning = false
    }
    
    func switchCamera(to deviceId: String) {
        guard let device = devices.first(where: { $0.uniqueID == deviceId }) else { return }
        
        session.beginConfiguration()
        
        // Remove existing input
        if let currentInput = currentDeviceInput {
            session.removeInput(currentInput)
        }
        
        // Add new input
        do {
            let input = try AVCaptureDeviceInput(device: device)
            if session.canAddInput(input) {
                session.addInput(input)
                currentDeviceInput = input
                activeDeviceId = deviceId
            }
        } catch {
            self.error = "Failed to switch camera: \(error.localizedDescription)"
        }
        
        session.commitConfiguration()
    }
    
    func capturePhoto() {
        guard let photoOutput = photoOutput else {
            error = "Photo output not available"
            return
        }
        
        let settings = AVCapturePhotoSettings()
        settings.isHighResolutionPhotoEnabled = true
        
        photoOutput.capturePhoto(with: settings, delegate: self)
    }
}

extension CameraService: AVCaptureVideoDataOutputSampleBufferDelegate {
    nonisolated func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        // Frame processing handled by preview layer
    }
}

extension CameraService: AVCapturePhotoCaptureDelegate {
    nonisolated func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        if let error = error {
            Task { @MainActor in
                self.error = "Failed to capture photo: \(error.localizedDescription)"
            }
            return
        }
        
        guard let imageData = photo.fileDataRepresentation(),
              let image = UIImage(data: imageData) else {
            Task { @MainActor in
                self.error = "Failed to process captured photo"
            }
            return
        }
        
        Task { @MainActor in
            self.onPhotoCaptured?(image)
        }
    }
}
