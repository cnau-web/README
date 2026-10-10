import SwiftUI
import XtreamKit

/// Fiche chaîne : aperçu vidéo intégré, programme complet, replay.
struct ChannelDetailView: View {
    @Environment(AppModel.self) private var app
    @Environment(LibraryStore.self) private var library
    @Environment(PlayerCoordinator.self) private var player

    let stream: LiveStream
    let playlist: [LiveStream]

    @State private var programs: [EPGProgram] = []
    @State private var loadingEPG = false
    @State private var expanded: String?

    var body: some View {
        ScrollViewReader { proxy in
            List {
                Section {
                    preview
                        .listRowInsets(EdgeInsets())
                    header
                }
                epgSections
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle(stream.name)
            .navigationBarTitleDisplayMode(.inline)
            .task(id: stream.id) {
                startPreviewIfNeeded()
                await loadEPG()
                if let live = programs.first(where: { $0.isLive() }) {
                    withAnimation { proxy.scrollTo(live.id, anchor: .center) }
                }
            }
        }
        .onAppear {
            player.visiblePreviews += 1
            startPreviewIfNeeded()
        }
        .onDisappear {
            player.visiblePreviews -= 1
            if player.visiblePreviews == 0 { player.stopPreview() }
        }
    }

    // MARK: Aperçu

    private var preview: some View {
        let engine = player.engine
        let isCurrent = player.currentLive?.id == stream.id
        return ZStack {
            Color.black
            if isCurrent {
                VideoSurface(player: engine.player)
            }
            if engine.isBuffering && engine.errorMessage == nil {
                ProgressView().tint(.white)
            }
            if let error = engine.errorMessage, isCurrent {
                VStack(spacing: 8) {
                    Image(systemName: "exclamationmark.tv").font(.title)
                    Text(error).font(.caption).multilineTextAlignment(.center).lineLimit(3)
                    Button("Réessayer") { engine.retry() }.buttonStyle(.bordered)
                }
                .foregroundStyle(.white)
                .padding()
            }
        }
        .aspectRatio(16 / 9, contentMode: .fit)
        .overlay(alignment: .bottomTrailing) {
            HStack(spacing: 14) {
                Button {
                    engine.isMuted.toggle()
                } label: {
                    Image(systemName: engine.isMuted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                }
                Button {
                    player.playLive(stream, in: playlist, fullScreen: true)
                } label: {
                    Image(systemName: "arrow.up.left.and.arrow.down.right")
                }
            }
            .font(.title3)
            .foregroundStyle(.white)
            .padding(10)
            .background(.black.opacity(0.4), in: Capsule())
            .padding(10)
        }
        .contentShape(Rectangle())
        .onTapGesture { player.playLive(stream, in: playlist, fullScreen: true) }
    }

    private var header: some View {
        HStack(spacing: 14) {
            ChannelLogo(stream: stream, size: 40)
            VStack(alignment: .leading, spacing: 4) {
                Text(stream.name).font(.headline)
                HStack(spacing: 10) {
                    if let n = stream.number { Text("N° \(n)") }
                    if stream.hasArchive { Label("Replay \(stream.archiveDays) j", systemImage: "clock.arrow.circlepath") }
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            Spacer()
            Button {
                library.toggleFavoriteChannel(stream.id)
            } label: {
                Image(systemName: library.isFavoriteChannel(stream.id) ? "star.fill" : "star")
                    .font(.title2)
                    .foregroundStyle(library.isFavoriteChannel(stream.id) ? .yellow : .secondary)
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, 4)
    }

    // MARK: Programme

    @ViewBuilder
    private var epgSections: some View {
        if loadingEPG && programs.isEmpty {
            Section { HStack { Spacer(); ProgressView(); Spacer() } }
        } else if programs.isEmpty {
            Section {
                Text("Aucun programme disponible pour cette chaîne.").foregroundStyle(.secondary)
            }
        } else {
            let days = Dictionary(grouping: programs) { Calendar.current.startOfDay(for: $0.start) }
            ForEach(days.keys.sorted(), id: \.self) { day in
                Section(day.formatted(.dateTime.weekday(.wide).day().month(.wide))) {
                    ForEach(days[day] ?? []) { program in
                        programRow(program).id(program.id)
                    }
                }
            }
        }
    }

    private func programRow(_ program: EPGProgram) -> some View {
        let now = Date()
        let isLive = program.isLive(at: now)
        let canReplay = program.end < now && isReplayable(program)
        return Button {
            if canReplay {
                Task { await player.playCatchup(stream, program: program, serverTimeZone: app.serverTimeZone) }
            } else if isLive {
                player.playLive(stream, in: playlist, fullScreen: true)
            } else {
                withAnimation { expanded = expanded == program.id ? nil : program.id }
            }
        } label: {
            HStack(alignment: .top, spacing: 12) {
                Text(program.start.hourMinute)
                    .font(.subheadline.monospacedDigit())
                    .foregroundStyle(isLive ? Theme.live : .secondary)
                    .frame(width: 52, alignment: .leading)
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(program.title).font(.subheadline.weight(isLive ? .bold : .regular)).lineLimit(2)
                        Spacer(minLength: 4)
                        if isLive {
                            Text("EN DIRECT").font(.caption2.bold()).foregroundStyle(Theme.live)
                        } else if canReplay {
                            Image(systemName: "play.circle.fill").foregroundStyle(Theme.accent)
                        }
                    }
                    if isLive { ProgressBar(value: program.progress(at: now), color: Theme.live).frame(height: 3) }
                    if let desc = program.description {
                        Text(desc)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(expanded == program.id ? nil : 2)
                    }
                }
            }
            .opacity(program.end < now && !canReplay ? 0.55 : 1)
        }
        .buttonStyle(.plain)
        .contextMenu {
            if program.description != nil {
                Button { expanded = program.id } label: { Label("Détails", systemImage: "text.alignleft") }
            }
            if canReplay {
                Button {
                    Task { await player.playCatchup(stream, program: program, serverTimeZone: app.serverTimeZone) }
                } label: { Label("Revoir", systemImage: "gobackward") }
            }
        }
    }

    private func startPreviewIfNeeded() {
        guard player.presented == nil, player.currentLive?.id != stream.id || player.engine.currentURL == nil else { return }
        // Ne pas interrompre un film ou un replay en cours.
        if player.currentLive == nil && player.engine.currentURL != nil { return }
        player.playLive(stream, in: playlist, fullScreen: false)
    }

    private func isReplayable(_ program: EPGProgram) -> Bool {
        guard stream.hasArchive else { return false }
        if program.hasArchive { return true }
        return program.start > Date().addingTimeInterval(-Double(stream.archiveDays) * 86_400)
    }

    private func loadEPG() async {
        guard let content = app.content else { return }
        loadingEPG = true
        defer { loadingEPG = false }
        let list = (try? await content.fullEPG(for: stream.id)) ?? []
        let horizon = Date().addingTimeInterval(-Double(max(stream.archiveDays, 0)) * 86_400 - 3600)
        programs = list.filter { $0.end > horizon }
    }
}
