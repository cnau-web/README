import SwiftUI
import AVKit

/// Vue vidéo brute (AVPlayerLayer) pour l'aperçu et le plein écran du direct.
struct VideoSurface: UIViewRepresentable {
    let player: AVPlayer
    var gravity: AVLayerVideoGravity = .resizeAspect
    var onLayerReady: ((AVPlayerLayer) -> Void)?

    final class LayerView: UIView {
        override static var layerClass: AnyClass { AVPlayerLayer.self }
        var playerLayer: AVPlayerLayer { layer as! AVPlayerLayer }
    }

    func makeUIView(context: Context) -> LayerView {
        let view = LayerView()
        view.backgroundColor = .black
        view.playerLayer.player = player
        view.playerLayer.videoGravity = gravity
        onLayerReady?(view.playerLayer)
        return view
    }

    func updateUIView(_ view: LayerView, context: Context) {
        if view.playerLayer.player !== player { view.playerLayer.player = player }
        if view.playerLayer.videoGravity != gravity {
            CATransaction.begin()
            CATransaction.setAnimationDuration(0.25)
            view.playerLayer.videoGravity = gravity
            CATransaction.commit()
        }
    }
}

/// Bouton AirPlay natif.
struct RoutePicker: UIViewRepresentable {
    func makeUIView(context: Context) -> AVRoutePickerView {
        let view = AVRoutePickerView()
        view.tintColor = .white
        view.activeTintColor = UIColor(Theme.accent)
        view.prioritizesVideoDevices = true
        return view
    }
    func updateUIView(_ uiView: AVRoutePickerView, context: Context) {}
}

/// AVPlayerViewController présenté en modal : bouton Fermer, scrubbing, pistes et PiP natifs.
final class OnDemandPlayerController: AVPlayerViewController, AVPlayerViewControllerDelegate {
    var onDismiss: (() -> Void)?
    private var didShowError = false

    init(player: AVPlayer, title: String, subtitle: String?) {
        super.init(nibName: nil, bundle: nil)
        self.player = player
        modalPresentationStyle = .fullScreen
        allowsPictureInPicturePlayback = true
        updatesNowPlayingInfoCenter = true
        delegate = self
        var metadata = [Self.metadataItem(.commonIdentifierTitle, title)]
        if let subtitle { metadata.append(Self.metadataItem(.iTunesMetadataTrackSubTitle, subtitle)) }
        player.currentItem?.externalMetadata = metadata
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) non supporté") }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        if isBeingDismissed { onDismiss?(); onDismiss = nil }
    }

    // Le lecteur reste présenté pendant le PiP pour ne pas couper la lecture.
    func playerViewControllerShouldAutomaticallyDismissAtPictureInPictureStart(_ controller: AVPlayerViewController) -> Bool {
        false
    }

    func playerViewController(_ controller: AVPlayerViewController,
                              restoreUserInterfaceForPictureInPictureStopWithCompletionHandler completionHandler: @escaping (Bool) -> Void) {
        completionHandler(true)
    }

    func showPlaybackError(_ message: String, mediaURL: URL) {
        guard !didShowError else { return }
        didShowError = true
        let alert = UIAlertController(
            title: "Lecture impossible",
            message: "\(message)\n\nCe format (souvent MKV/AVI) n'est peut-être pas pris en charge par le lecteur iOS. Essayez un lecteur externe.",
            preferredStyle: .alert)
        for external in [PlayerChoice.vlc, .infuse] {
            alert.addAction(UIAlertAction(title: "Ouvrir dans \(external.label)", style: .default) { [weak self] _ in
                Task { @MainActor in
                    let opened = await external.open(mediaURL)
                    if opened { self?.dismiss(animated: true) } else { self?.didShowError = false }
                }
            })
        }
        alert.addAction(UIAlertAction(title: "Fermer", style: .cancel) { [weak self] _ in
            self?.dismiss(animated: true)
        })
        present(alert, animated: true)
    }

    private static func metadataItem(_ id: AVMetadataIdentifier, _ value: String) -> AVMetadataItem {
        let item = AVMutableMetadataItem()
        item.identifier = id
        item.value = value as NSString
        item.extendedLanguageTag = "und"
        return item
    }
}

extension UIApplication {
    var topViewController: UIViewController? {
        let scene = connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive } ?? connectedScenes.compactMap { $0 as? UIWindowScene }.first
        var top = scene?.keyWindow?.rootViewController
        while let presented = top?.presentedViewController { top = presented }
        return top
    }
}
