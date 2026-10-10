import SwiftUI
import UIKit
#if canImport(MobileVLCKit)
import MobileVLCKit
#endif

/// Lecteur intégré basé sur VLCKit (MobileVLCKit, via CocoaPods) : MKV, AVI, MPEG-TS, pistes audio et sous-titres.
/// Sans `pod install`, le module est absent : l'app compile quand même et se replie sur VLC/Infuse.
enum VLCSupport {
    #if canImport(MobileVLCKit)
    static let isAvailable = true
    #else
    static let isAvailable = false
    #endif

    /// Extensions lues nativement par AVFoundation ; le reste part vers VLCKit en mode automatique.
    static let nativeExtensions: Set<String> = ["mp4", "m4v", "mov", "m3u8", "mp3", "m4a"]

    static func prefersVLC(for url: URL) -> Bool {
        !nativeExtensions.contains(url.pathExtension.lowercased())
    }
}

#if canImport(MobileVLCKit)
struct VLCTrack: Identifiable, Hashable {
    let id: Int32
    let name: String
}

@MainActor
@Observable
final class VLCPlaybackModel: NSObject, VLCMediaPlayerDelegate {
    @ObservationIgnored let mediaPlayer = VLCMediaPlayer()

    private(set) var isPlaying = false
    private(set) var isBuffering = true
    private(set) var errorMessage: String?
    private(set) var hasEnded = false
    /// Millisecondes.
    private(set) var time: Int = 0
    private(set) var length: Int = 0
    private(set) var audioTracks: [VLCTrack] = []
    private(set) var subtitleTracks: [VLCTrack] = []
    private(set) var currentAudio: Int32 = -1
    private(set) var currentSubtitle: Int32 = -1

    var isSeekable: Bool { length > 0 && mediaPlayer.isSeekable }

    @ObservationIgnored var onProgress: ((Double, Double) -> Void)?
    @ObservationIgnored private var lastSavedSecond = 0

    let url: URL

    init(url: URL, startAt: Double?, userAgent: String?) {
        self.url = url
        super.init()
        let media = VLCMedia(url: url)
        media.addOption(":network-caching=1500")
        if let userAgent { media.addOption(":http-user-agent=\(userAgent)") }
        if let startAt, startAt > 0 { media.addOption(":start-time=\(Int(startAt))") }
        mediaPlayer.media = media
        mediaPlayer.delegate = self
    }

    func attach(to view: UIView) {
        mediaPlayer.drawable = view
    }

    func play() { mediaPlayer.play() }

    func togglePlay() {
        if mediaPlayer.isPlaying { mediaPlayer.pause() } else { mediaPlayer.play() }
    }

    func jump(seconds: Int) {
        if seconds >= 0 { mediaPlayer.jumpForward(Int32(seconds)) } else { mediaPlayer.jumpBackward(Int32(-seconds)) }
    }

    func seek(toFraction fraction: Double) {
        guard isSeekable else { return }
        mediaPlayer.position = Float(min(max(fraction, 0), 1))
        time = Int(Double(length) * fraction)
    }

    func selectAudio(_ id: Int32) {
        mediaPlayer.currentAudioTrackIndex = id
        currentAudio = id
    }

    func selectSubtitle(_ id: Int32) {
        mediaPlayer.currentVideoSubTitleIndex = id
        currentSubtitle = id
    }

    func retry() {
        errorMessage = nil
        hasEnded = false
        mediaPlayer.stop()
        mediaPlayer.play()
    }

    func stop() {
        saveProgress()
        mediaPlayer.delegate = nil
        mediaPlayer.stop()
        mediaPlayer.drawable = nil
    }

    func saveProgress() {
        guard length > 0 else { return }
        onProgress?(Double(time) / 1000, Double(length) / 1000)
    }

    // MARK: VLCMediaPlayerDelegate (notifications envoyées sur le thread principal)

    nonisolated func mediaPlayerStateChanged(_ aNotification: Notification) {
        Task { @MainActor in self.refreshState() }
    }

    nonisolated func mediaPlayerTimeChanged(_ aNotification: Notification) {
        Task { @MainActor in self.refreshTime() }
    }

    private func refreshState() {
        let state = mediaPlayer.state
        isPlaying = mediaPlayer.isPlaying
        switch state {
        case .opening, .buffering:
            isBuffering = !mediaPlayer.isPlaying
        case .playing:
            isBuffering = false
        case .error:
            isBuffering = false
            errorMessage = "VLC n'a pas pu lire ce flux. Vérifiez votre connexion ou essayez plus tard."
        case .ended:
            isBuffering = false
            hasEnded = true
            saveProgress()
        case .esAdded:
            refreshTracks()
        default:
            isBuffering = false
        }
    }

    private func refreshTime() {
        isBuffering = false
        isPlaying = mediaPlayer.isPlaying
        time = Int(mediaPlayer.time.intValue)
        if let ms = mediaPlayer.media?.length.intValue, ms > 0 { length = Int(ms) }
        if audioTracks.isEmpty { refreshTracks() }
        let second = time / 1000
        if second - lastSavedSecond >= 10 {
            lastSavedSecond = second
            saveProgress()
        }
    }

    private func refreshTracks() {
        audioTracks = Self.tracks(names: mediaPlayer.audioTrackNames, indexes: mediaPlayer.audioTrackIndexes)
        subtitleTracks = Self.tracks(names: mediaPlayer.videoSubTitlesNames, indexes: mediaPlayer.videoSubTitlesIndexes)
        currentAudio = mediaPlayer.currentAudioTrackIndex
        currentSubtitle = mediaPlayer.currentVideoSubTitleIndex
    }

    private static func tracks(names: [Any], indexes: [Any]) -> [VLCTrack] {
        zip(indexes, names).compactMap { index, name in
            guard let id = (index as? NSNumber)?.int32Value else { return nil }
            return VLCTrack(id: id, name: (name as? String) ?? "Piste \(id)")
        }
    }
}

private struct VLCVideoSurface: UIViewRepresentable {
    let model: VLCPlaybackModel

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.backgroundColor = .black
        model.attach(to: view)
        model.play()
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {}
}

/// Plein écran VLCKit : lecture/pause, sauts, barre de progression, pistes audio et sous-titres.
struct VLCPlayerScreen: View {
    let model: VLCPlaybackModel
    let title: String
    let subtitle: String?
    let onClose: () -> Void

    @State private var showControls = true
    @State private var hideTask: Task<Void, Never>?
    @State private var scrubbing: Double?
    @State private var fill = false

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            VLCVideoSurface(model: model)
                .ignoresSafeArea()
                .scaleEffect(fill ? 1.33 : 1)
                .clipped()

            if model.isBuffering && model.errorMessage == nil {
                ProgressView().controlSize(.large).tint(.white)
            }
            if let error = model.errorMessage {
                VStack(spacing: 12) {
                    Image(systemName: "exclamationmark.triangle").font(.largeTitle)
                    Text(error).multilineTextAlignment(.center)
                    HStack {
                        Button("Réessayer") { model.retry() }.buttonStyle(.borderedProminent)
                        Button("Fermer", action: close).buttonStyle(.bordered)
                    }
                }
                .foregroundStyle(.white)
                .padding(24)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
            }
            if showControls { controls.transition(.opacity) }
        }
        .contentShape(Rectangle())
        .onTapGesture(count: 2) { withAnimation { fill.toggle() } }
        .onTapGesture {
            withAnimation { showControls.toggle() }
            if showControls { scheduleHide() }
        }
        .statusBarHidden(!showControls)
        .persistentSystemOverlays(.hidden)
        .onAppear { scheduleHide() }
        .onChange(of: model.hasEnded) { _, ended in if ended { close() } }
    }

    private var controls: some View {
        VStack {
            HStack(spacing: 16) {
                Button(action: close) { Image(systemName: "xmark").font(.title3.weight(.semibold)) }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.headline).lineLimit(1)
                    if let subtitle { Text(subtitle).font(.caption).foregroundStyle(.white.opacity(0.7)).lineLimit(1) }
                }
                Spacer()
                tracksMenu
                Button { withAnimation { fill.toggle() } } label: {
                    Image(systemName: fill ? "arrow.down.right.and.arrow.up.left" : "arrow.up.left.and.arrow.down.right")
                }
            }
            .font(.title3)
            .padding()
            .background(LinearGradient(colors: [.black.opacity(0.8), .clear], startPoint: .top, endPoint: .bottom))

            Spacer()

            HStack(spacing: 48) {
                Button { model.jump(seconds: -10); scheduleHide() } label: { Image(systemName: "gobackward.10") }
                Button { model.togglePlay(); scheduleHide() } label: {
                    Image(systemName: model.isPlaying ? "pause.fill" : "play.fill").font(.system(size: 44))
                }
                Button { model.jump(seconds: 30); scheduleHide() } label: { Image(systemName: "goforward.30") }
            }
            .font(.system(size: 30))
            .disabled(!model.isSeekable && !model.isPlaying)

            Spacer()

            if model.length > 0 {
                VStack(spacing: 6) {
                    Slider(value: Binding(
                        get: { scrubbing ?? Double(model.time) / Double(max(model.length, 1)) },
                        set: { scrubbing = $0 }
                    ), in: 0...1, onEditingChanged: { editing in
                        if !editing, let value = scrubbing {
                            model.seek(toFraction: value)
                            scrubbing = nil
                            scheduleHide()
                        } else {
                            hideTask?.cancel()
                        }
                    })
                    HStack {
                        Text(Self.format(scrubbing.map { Int($0 * Double(model.length)) } ?? model.time))
                        Spacer()
                        Text("-" + Self.format(model.length - (scrubbing.map { Int($0 * Double(model.length)) } ?? model.time)))
                    }
                    .font(.caption.monospacedDigit())
                }
                .padding()
                .background(LinearGradient(colors: [.clear, .black.opacity(0.8)], startPoint: .top, endPoint: .bottom))
            }
        }
        .foregroundStyle(.white)
        .tint(Theme.accent)
    }

    private var tracksMenu: some View {
        Menu {
            if model.audioTracks.count > 1 {
                Section("Audio") {
                    ForEach(model.audioTracks) { track in
                        Button {
                            model.selectAudio(track.id)
                        } label: {
                            if track.id == model.currentAudio { Label(track.name, systemImage: "checkmark") } else { Text(track.name) }
                        }
                    }
                }
            }
            if !model.subtitleTracks.isEmpty {
                Section("Sous-titres") {
                    ForEach(model.subtitleTracks) { track in
                        Button {
                            model.selectSubtitle(track.id)
                        } label: {
                            if track.id == model.currentSubtitle { Label(track.name, systemImage: "checkmark") } else { Text(track.name) }
                        }
                    }
                }
            }
            if model.audioTracks.count <= 1 && model.subtitleTracks.isEmpty {
                Text("Aucune autre piste")
            }
        } label: {
            Image(systemName: "captions.bubble")
        }
    }

    private func close() {
        hideTask?.cancel()
        model.stop()
        onClose()
    }

    private func scheduleHide() {
        hideTask?.cancel()
        hideTask = Task {
            try? await Task.sleep(for: .seconds(4))
            guard !Task.isCancelled, model.isPlaying, scrubbing == nil else { return }
            withAnimation { showControls = false }
        }
    }

    static func format(_ ms: Int) -> String {
        let total = max(ms, 0) / 1000
        let h = total / 3600, m = (total % 3600) / 60, s = total % 60
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%d:%02d", m, s)
    }
}

/// Conteneur UIKit plein écran (présenté comme le lecteur AVPlayer, au-dessus de tout).
final class VLCPlayerHostingController: UIHostingController<VLCPlayerScreen> {
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .allButUpsideDown }
}
#endif
