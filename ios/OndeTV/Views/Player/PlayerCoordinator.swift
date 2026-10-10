import SwiftUI
import UIKit
import Observation
import XtreamKit

/// Présentation plein écran du direct (les films/séries/replay passent par AVPlayerViewController).
struct PlayerRequest: Identifiable, Equatable {
    let id = UUID()
}

enum ExternalPlayer: String, CaseIterable, Identifiable {
    case builtIn, vlc, infuse

    var id: String { rawValue }

    var label: String {
        switch self {
        case .builtIn: return "Lecteur intégré"
        case .vlc: return "VLC"
        case .infuse: return "Infuse"
        }
    }

    func url(for media: URL) -> URL? {
        let encoded = media.absoluteString.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? media.absoluteString
        switch self {
        case .builtIn: return nil
        case .vlc: return URL(string: "vlc-x-callback://x-callback-url/stream?url=\(encoded)")
        case .infuse: return URL(string: "infuse://x-callback-url/play?url=\(encoded)")
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

    var onDemandPlayer: ExternalPlayer {
        ExternalPlayer(rawValue: UserDefaults.standard.string(forKey: "vodPlayer") ?? "") ?? .builtIn
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
        let external = onDemandPlayer
        if external != .builtIn, await external.open(url) { return }

        presented = nil
        currentLive = nil
        let start = progressKey.flatMap { library?.progress(for: $0) }.flatMap { $0.isFinished ? nil : $0.position }
        engine.load(url, startAt: start, userAgent: client?.userAgent)
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
        engine.onError = { [weak controller] message in
            controller?.showPlaybackError(message, mediaURL: url)
        }
        UIApplication.shared.topViewController?.present(controller, animated: true)
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
