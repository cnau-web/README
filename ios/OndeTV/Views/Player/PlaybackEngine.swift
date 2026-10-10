import AVFoundation
import Observation

/// Enveloppe AVPlayer : un seul lecteur partagé entre l'aperçu et le plein écran.
@MainActor
@Observable
final class PlaybackEngine {
    let player = AVPlayer()

    private(set) var currentURL: URL?
    private(set) var isBuffering = false
    private(set) var isPlaying = false
    private(set) var errorMessage: String?
    private(set) var currentTime: Double = 0
    private(set) var duration: Double = 0

    var isMuted: Bool {
        get { player.isMuted }
        set { player.isMuted = newValue }
    }

    @ObservationIgnored private var controlObservation: NSKeyValueObservation?
    @ObservationIgnored private var statusObservation: NSKeyValueObservation?
    @ObservationIgnored private var timeObserver: Any?
    @ObservationIgnored private var failureObserver: NSObjectProtocol?
    @ObservationIgnored private var stallObserver: NSObjectProtocol?
    @ObservationIgnored var onPeriodicTime: ((Double, Double) -> Void)?
    @ObservationIgnored var onError: ((String) -> Void)?

    private func fail(_ message: String) {
        errorMessage = message
        onError?(message)
    }

    init() {
        player.allowsExternalPlayback = true
        controlObservation = player.observe(\.timeControlStatus, options: [.initial, .new]) { [weak self] p, _ in
            let status = p.timeControlStatus
            Task { @MainActor in
                self?.isBuffering = status == .waitingToPlayAtSpecifiedRate
                self?.isPlaying = status == .playing
            }
        }
        timeObserver = player.addPeriodicTimeObserver(forInterval: CMTime(seconds: 1, preferredTimescale: 1), queue: .main) { [weak self] time in
            MainActor.assumeIsolated {
                guard let self else { return }
                self.currentTime = time.seconds.isFinite ? time.seconds : 0
                let d = self.player.currentItem?.duration.seconds ?? 0
                self.duration = d.isFinite ? d : 0
                if Int(self.currentTime) % 10 == 0 { self.onPeriodicTime?(self.currentTime, self.duration) }
            }
        }
    }

    func load(_ url: URL, startAt: Double? = nil, userAgent: String? = nil) {
        if url == currentURL, player.currentItem?.status != .failed {
            player.play()
            return
        }
        errorMessage = nil
        currentURL = url
        currentTime = 0
        duration = 0

        var options: [String: Any] = [:]
        if let userAgent { options["AVURLAssetHTTPHeaderFieldsKey"] = ["User-Agent": userAgent] }
        let asset = AVURLAsset(url: url, options: options)
        let item = AVPlayerItem(asset: asset)
        item.preferredForwardBufferDuration = 4
        observe(item)
        player.replaceCurrentItem(with: item)
        if let startAt, startAt > 0 {
            player.seek(to: CMTime(seconds: startAt, preferredTimescale: 600), toleranceBefore: .zero, toleranceAfter: .zero)
        }
        player.play()
    }

    func retry() {
        guard let url = currentURL else { return }
        currentURL = nil
        load(url)
    }

    func stop() {
        player.pause()
        player.replaceCurrentItem(with: nil)
        currentURL = nil
        errorMessage = nil
        onPeriodicTime = nil
    }

    func togglePlay() {
        if player.timeControlStatus == .paused { player.play() } else { player.pause() }
    }

    private func observe(_ item: AVPlayerItem) {
        statusObservation = item.observe(\.status, options: [.new]) { [weak self] item, _ in
            let failed = item.status == .failed
            let message = item.error?.localizedDescription
            Task { @MainActor in
                if failed { self?.fail(message ?? "Lecture impossible.") }
            }
        }
        if let failureObserver { NotificationCenter.default.removeObserver(failureObserver) }
        failureObserver = NotificationCenter.default.addObserver(forName: .AVPlayerItemFailedToPlayToEndTime, object: item, queue: .main) { [weak self] note in
            let error = note.userInfo?[AVPlayerItemFailedToPlayToEndTimeErrorKey] as? Error
            MainActor.assumeIsolated {
                self?.fail(error?.localizedDescription ?? "Le flux s'est interrompu.")
            }
        }
        if let stallObserver { NotificationCenter.default.removeObserver(stallObserver) }
        // Flux direct qui cale : on relance la lecture.
        stallObserver = NotificationCenter.default.addObserver(forName: .AVPlayerItemPlaybackStalled, object: item, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.player.play() }
        }
    }
}
