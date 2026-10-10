import SwiftUI
import AVKit
import XtreamKit

/// Plein écran du direct : zapping par glissement, bandeau EPG, liste des chaînes, PiP et AirPlay.
struct LivePlayerScreen: View {
    @Environment(PlayerCoordinator.self) private var player
    @Environment(AppModel.self) private var app
    @Environment(LibraryStore.self) private var library

    @State private var showControls = true
    @State private var showChannelList = false
    @State private var fill = false
    @State private var pip = PiPHolder()
    @State private var hideTask: Task<Void, Never>?
    @State private var dragOffset: CGFloat = 0

    private var engine: PlaybackEngine { player.engine }
    private var stream: LiveStream? { player.currentLive }
    private var content: ContentStore? { app.content }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VideoSurface(player: engine.player, gravity: fill ? .resizeAspectFill : .resizeAspect) { layer in
                pip.attach(layer)
            }
            .ignoresSafeArea()
            .offset(y: dragOffset * 0.3)

            if engine.isBuffering && engine.errorMessage == nil {
                ProgressView().controlSize(.large).tint(.white)
            }
            if let error = engine.errorMessage {
                errorOverlay(error)
            }

            if showControls {
                controls.transition(.opacity)
            }

            if showChannelList {
                channelDrawer.transition(.move(edge: .trailing))
            }
        }
        .contentShape(Rectangle())
        .onTapGesture(count: 2) { withAnimation { fill.toggle() } }
        .onTapGesture { toggleControls() }
        .gesture(zapGesture)
        .statusBarHidden(!showControls)
        .persistentSystemOverlays(.hidden)
        .onAppear { scheduleHide() }
        .task(id: stream?.id) {
            guard let stream else { return }
            withAnimation { showControls = true }
            scheduleHide()
            await content?.loadEPG(for: stream.id)
        }
    }

    // MARK: Contrôles

    private var controls: some View {
        VStack(spacing: 0) {
            topBar
                .padding(.horizontal).padding(.top, 8).padding(.bottom, 30)
                .background(LinearGradient(colors: [.black.opacity(0.8), .clear], startPoint: .top, endPoint: .bottom))
            Spacer()
            bottomBar
                .padding(.horizontal).padding(.bottom, 12).padding(.top, 40)
                .background(LinearGradient(colors: [.clear, .black.opacity(0.85)], startPoint: .top, endPoint: .bottom))
        }
        .foregroundStyle(.white)
    }

    private var topBar: some View {
        HStack(spacing: 18) {
            Button { player.closeFullScreen() } label: {
                Image(systemName: "chevron.down").font(.title2.weight(.semibold))
            }
            if let stream {
                ChannelLogo(stream: stream, size: 30)
                VStack(alignment: .leading, spacing: 2) {
                    Text(stream.name).font(.headline).lineLimit(1)
                    if let n = stream.number { Text("Chaîne \(n)").font(.caption).foregroundStyle(.white.opacity(0.7)) }
                }
            }
            Spacer()
            if let stream {
                Button { library.toggleFavoriteChannel(stream.id) } label: {
                    Image(systemName: library.isFavoriteChannel(stream.id) ? "star.fill" : "star")
                        .foregroundStyle(library.isFavoriteChannel(stream.id) ? .yellow : .white)
                }
            }
            Button { withAnimation { fill.toggle() } } label: {
                Image(systemName: fill ? "arrow.down.right.and.arrow.up.left" : "arrow.up.left.and.arrow.down.right")
            }
            if pip.isSupported {
                Button { pip.toggle() } label: { Image(systemName: "pip.enter") }
            }
            RoutePicker().frame(width: 30, height: 30)
            Button { withAnimation(.snappy) { showChannelList.toggle() } } label: {
                Image(systemName: "list.bullet")
            }
        }
        .font(.title3)
    }

    @ViewBuilder
    private var bottomBar: some View {
        let now = stream.flatMap { content?.currentProgram(for: $0.id) }
        let next = stream.flatMap { content?.nextProgram(for: $0.id) }
        HStack(alignment: .bottom, spacing: 16) {
            Button { player.zap(-1) } label: { Image(systemName: "chevron.up.circle.fill").font(.largeTitle) }
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Text("DIRECT").font(.caption2.bold()).padding(.horizontal, 6).padding(.vertical, 2)
                        .background(Theme.live, in: RoundedRectangle(cornerRadius: 4))
                    Text(now?.title ?? "Aucune information de programme").font(.headline).lineLimit(1)
                }
                if let now {
                    HStack {
                        Text(now.start.hourMinute)
                        ProgressBar(value: now.progress(), color: Theme.live).frame(height: 4)
                        Text(now.end.hourMinute)
                    }
                    .font(.caption.monospacedDigit())
                }
                if let next {
                    Text("Ensuite \(next.start.hourMinute) · \(next.title)")
                        .font(.caption).foregroundStyle(.white.opacity(0.7)).lineLimit(1)
                }
            }
            .frame(maxWidth: 600, alignment: .leading)
            Button { player.zap(1) } label: { Image(systemName: "chevron.down.circle.fill").font(.largeTitle) }
        }
        .frame(maxWidth: .infinity)
    }

    private func errorOverlay(_ message: String) -> some View {
        VStack(spacing: 14) {
            Image(systemName: "exclamationmark.tv").font(.system(size: 44))
            Text("Chaîne indisponible").font(.headline)
            Text(message).font(.caption).multilineTextAlignment(.center).foregroundStyle(.secondary)
            HStack {
                Button("Réessayer") { engine.retry() }.buttonStyle(.borderedProminent)
                Button("Chaîne suivante") { player.zap(1) }.buttonStyle(.bordered)
            }
            if VLCSupport.isAvailable {
                Button {
                    player.playLiveWithVLC()
                } label: {
                    Label("Essayer avec VLC", systemImage: "play.rectangle.on.rectangle")
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(24)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
        .padding()
    }

    // MARK: Liste des chaînes

    private var channelDrawer: some View {
        HStack(spacing: 0) {
            Color.black.opacity(0.001)
                .onTapGesture { withAnimation(.snappy) { showChannelList = false } }
            ScrollViewReader { proxy in
                List(player.playlist) { item in
                    Button {
                        player.playLive(item, in: player.playlist, fullScreen: false)
                    } label: {
                        HStack(spacing: 10) {
                            ChannelLogo(stream: item, size: 26)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(item.name).font(.subheadline.weight(.medium)).lineLimit(1)
                                if let p = content?.currentProgram(for: item.id) {
                                    Text(p.title).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                                }
                            }
                        }
                    }
                    .listRowBackground(item.id == stream?.id ? Theme.accent.opacity(0.35) : Color.clear)
                    .id(item.id)
                    .task { await content?.loadEPG(for: item.id) }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
                .onAppear { if let id = stream?.id { proxy.scrollTo(id, anchor: .center) } }
            }
            .frame(width: 320)
            .background(.ultraThinMaterial)
        }
        .ignoresSafeArea(edges: .vertical)
    }

    // MARK: Gestes

    private var zapGesture: some Gesture {
        DragGesture(minimumDistance: 30)
            .onChanged { value in
                if abs(value.translation.height) > abs(value.translation.width) { dragOffset = value.translation.height }
            }
            .onEnded { value in
                let dy = value.translation.height
                withAnimation(.snappy) { dragOffset = 0 }
                guard abs(dy) > abs(value.translation.width), abs(dy) > 80 else { return }
                player.zap(dy < 0 ? 1 : -1)
            }
    }

    private func toggleControls() {
        if showChannelList { withAnimation(.snappy) { showChannelList = false }; return }
        withAnimation { showControls.toggle() }
        if showControls { scheduleHide() }
    }

    private func scheduleHide() {
        hideTask?.cancel()
        hideTask = Task {
            try? await Task.sleep(for: .seconds(5))
            guard !Task.isCancelled, !showChannelList, engine.errorMessage == nil else { return }
            withAnimation { showControls = false }
        }
    }
}

/// Picture-in-Picture pour la couche vidéo du direct.
@MainActor
@Observable
final class PiPHolder {
    @ObservationIgnored private var controller: AVPictureInPictureController?
    var isSupported: Bool { AVPictureInPictureController.isPictureInPictureSupported() }

    func attach(_ layer: AVPlayerLayer) {
        guard isSupported, controller == nil else { return }
        controller = AVPictureInPictureController(playerLayer: layer)
        controller?.canStartPictureInPictureAutomaticallyFromInline = true
    }

    func toggle() {
        guard let controller else { return }
        if controller.isPictureInPictureActive { controller.stopPictureInPicture() } else { controller.startPictureInPicture() }
    }
}
