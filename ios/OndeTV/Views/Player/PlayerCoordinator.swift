import SwiftUI
import UIKit
import Observation
import XtreamKit

/// Présentation plein écran du direct (les films/séries/replay passent par AVPlayerViewController).
struct PlayerRequest: Identifiable, Equatable {
    let id = UUID()
}

/// Choix du lecteur pour les films, séries et replay.
enum PlayerChoice: String, CaseIterable, Identifiable {
    /// Lecteur iOS pour MP4/HLS, VLCKit pour le reste (MKV, AVI, TS…). Valeur brute historique conservée.
    case auto = "builtIn"
    case vlcKit
    case avPlayer
    case vlc
    case infuse

    var id: String { rawValue }

    static var available: [PlayerChoice] {
        VLCSupport.isAvailable ? allCases : [.auto, .vlc, .infuse]
    }

    var label: String {
        switch self {
        case .auto: return VLCSupport.isAvailable ? "Intégré (automatique)" : "Lecteur intégré"
        case .vlcKit: return "Intégré — VLC"
        case .avPlayer: return "Intégré — lecteur iOS"
        case .vlc: return "App VLC"
        case .infuse: return "App Infuse"
        }
    }

    var isExternal: Bool { self == .vlc || self == .infuse }

    func url(for media: URL) -> URL? {
        let encoded = media.absoluteString.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? media.absoluteString
        switch self {
        case .vlc: return URL(string: "vlc-x-callback://x-callback-url/stream?url=\(encoded)")
        case .infuse: return URL(string: "infuse://x-callback-url/play?url=\(encoded)")
        default: return nil
        }
    }

    /// Ouvre le flux dans l'app externe. Renvoie false si l'app n'est pas installée.
    @MainActor
    func open(_ media: URL) async -> Bool {
        guard let url = url(for: media) else { return false }
        return await UIApplication.shared.open(url)
    }
}

/// Orchestre la lecture : chaîne courante, zapping, plein écran, lecteurs externes.
@MainActor
@Observable
final class PlayerCoordinator {
    let engine = PlaybackEngine()

    var presented: PlayerRequest?
    private(set) var currentLive: LiveStream?
    private(set) var playlist: [LiveStream] = []
    /// Nombre d'aperçus intégrés visibles (iPad) : on ne coupe pas le son en quittant le plein écran.
    @ObservationIgnored var visiblePreviews = 0

    @ObservationIgnored weak var library: LibraryStore?
    @ObservationIgnored var client: XtreamClient?

    /// Le lecteur iOS ne lit pas le MPEG-TS brut : le direct passe toujours en HLS.
    let liveFormat: LiveOutputFormat = .hls

    var onDemandPlayer: PlayerChoice {
        let choice = PlayerChoice(rawValue: UserDefaults.standard.string(forKey: "vodPlayer") ?? "") ?? .auto
        return PlayerChoice.available.contains(choice) ? choice : .auto
    }

    // MARK: Direct

    func playLive(_ stream: LiveStream, in list: [LiveStream], fullScreen: Bool) {
        guard let client else { return }
        if !list.isEmpty { playlist = list }
        currentLive = stream
        library?.markWatched(channel: stream.id)
        engine.onPeriodicTime = nil
        engine.load(client.liveURL(stream, format: liveFormat), userAgent: client.userAgent)
        if fullScreen, presented == nil { presented = PlayerRequest() }
    }

    func zap(_ offset: Int) {
        guard let current = currentLive, !playlist.isEmpty else { return }
        let index = playlist.firstIndex(of: current) ?? 0
        let next = playlist[(index + offset + playlist.count) % playlist.count]
        playLive(next, in: playlist, fullScreen: false)
    }

    // MARK: À la demande

    func playCatchup(_ stream: LiveStream, program: EPGProgram, serverTimeZone: TimeZone?) async {
        guard let client else { return }
        let url = client.catchupURL(stream: stream, program: program, timeZone: serverTimeZone, format: liveFormat)
        let subtitle = "\(stream.name) · \(program.start.formatted(date: .abbreviated, time: .shortened))"
        await playOnDemand(url: url, title: program.title, subtitle: subtitle, progressKey: nil)
    }

    func playOnDemand(url: URL, title: String, subtitle: String?, progressKey: String?) async {
        let choice = onDemandPlayer
        if choice.isExternal, await choice.open(url) { return }

        let useVLC = VLCSupport.isAvailable
            && (choice == .vlcKit || (choice != .avPlayer && VLCSupport.prefersVLC(for: url)))
        if useVLC {
            presentVLC(url: url, title: title, subtitle: subtitle, progressKey: progressKey)
            return
        }

        presented = nil
        currentLive = nil
        engine.load(url, startAt: resumePosition(progressKey), userAgent: client?.userAgent)
        if let progressKey {
            engine.onPeriodicTime = { [weak self] position, duration in
                self?.library?.saveProgress(progressKey, position: position, duration: duration)
            }
        }

        let controller = OnDemandPlayerController(player: engine.player, title: title, subtitle: subtitle)
        controller.onDismiss = { [weak self] in
            guard let self else { return }
            if let progressKey {
                self.library?.saveProgress(progressKey, position: self.engine.currentTime, duration: self.engine.duration)
            }
            self.engine.onError = nil
            self.engine.stop()
        }
        engine.onError = { [weak self, weak controller] message in
            guard let controller else { return }
            if VLCSupport.isAvailable {
                // Format refusé par AVFoundation : on bascule automatiquement sur VLCKit.
                self?.engine.onError = nil
                controller.dismiss(animated: true) {
                    self?.presentVLC(url: url, title: title, subtitle: subtitle, progressKey: progressKey)
                }
            } else {
                controller.showPlaybackError(message, mediaURL: url)
            }
        }
        UIApplication.shared.topViewController?.present(controller, animated: true)
    }

    /// Direct impossible en HLS : on retente le flux MPEG-TS avec VLCKit.
    func playLiveWithVLC() {
        guard VLCSupport.isAvailable, let stream = currentLive, let client else { return }
        let url = client.liveURL(stream, format: .ts)
        presented = nil
        engine.stop()
        currentLive = nil
        Task {
            // Laisser le plein écran du direct se fermer avant de présenter VLC.
            try? await Task.sleep(for: .milliseconds(600))
            presentVLC(url: url, title: stream.name, subtitle: "Direct", progressKey: nil)
        }
    }

    private func resumePosition(_ progressKey: String?) -> Double? {
        progressKey.flatMap { library?.progress(for: $0) }.flatMap { $0.isFinished ? nil : $0.position }
    }

    private func presentVLC(url: URL, title: String, subtitle: String?, progressKey: String?) {
        #if canImport(MobileVLCKit)
        presented = nil
        engine.stop()
        currentLive = nil

        let model = VLCPlaybackModel(url: url, startAt: resumePosition(progressKey), userAgent: client?.userAgent)
        if let progressKey {
            model.onProgress = { [weak self] position, duration in
                self?.library?.saveProgress(progressKey, position: position, duration: duration)
            }
        }
        let box = WeakViewController()
        let screen = VLCPlayerScreen(model: model, title: title, subtitle: subtitle) {
            box.controller?.dismiss(animated: true)
        }
        let host = VLCPlayerHostingController(rootView: screen)
        host.modalPresentationStyle = .fullScreen
        host.view.backgroundColor = .black
        box.controller = host
        UIApplication.shared.topViewController?.present(host, animated: true)
        #endif
    }

    // MARK: Fermeture

    func closeFullScreen() {
        presented = nil
        // On laisse le temps à un éventuel aperçu (iPad / fiche chaîne) de réapparaître.
        Task {
            try? await Task.sleep(for: .milliseconds(700))
            if presented == nil && visiblePreviews == 0 && currentLive != nil {
                engine.stop()
                currentLive = nil
            }
        }
    }

    /// Coupe l'aperçu du direct quand plus aucune vue ne l'affiche (ne touche pas aux films/replay).
    func stopPreview() {
        guard presented == nil, currentLive != nil else { return }
        engine.stop()
        currentLive = nil
    }
}

private final class WeakViewController {
    weak var controller: UIViewController?
}
