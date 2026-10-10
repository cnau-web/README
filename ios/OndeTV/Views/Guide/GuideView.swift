import SwiftUI
import XtreamKit

/// Grille des programmes : chaînes en lignes, temps en colonnes (de -1 h à +8 h).
struct GuideView: View {
    @Environment(AppModel.self) private var app
    @Environment(LibraryStore.self) private var library
    @Environment(PlayerCoordinator.self) private var player
    @Environment(\.horizontalSizeClass) private var sizeClass

    @State private var category: String = LiveSection.favorites
    @State private var selected: SelectedProgram?
    @State private var windowStart = GuideView.roundedNow()

    private var pointsPerMinute: CGFloat { sizeClass == .compact ? 4 : 6 }
    private var channelColumnWidth: CGFloat { sizeClass == .compact ? 96 : 200 }
    private let rowHeight: CGFloat = 64
    private let windowHours = 9.0

    struct SelectedProgram: Identifiable {
        let stream: LiveStream
        let program: EPGProgram
        var id: String { "\(stream.id)-\(program.id)" }
    }

    var body: some View {
        NavigationStack {
            Group {
                if let content = app.content {
                    switch content.liveState {
                    case .loaded: grid(content)
                    case .failed(let message): LoadFailedView(message: message) { Task { await content.loadLive(force: true) } }
                    default: ProgressView()
                    }
                }
            }
            .background(Theme.background)
            .navigationTitle("Guide TV")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { categoryMenu }
            .task {
                await app.content?.loadLive()
                if library.data.favoriteChannels.isEmpty { category = app.content?.liveCategories.first?.id ?? "" }
            }
            .sheet(item: $selected) { sel in
                ProgramSheet(stream: sel.stream, program: sel.program)
                    .presentationDetents([.medium, .large])
            }
        }
    }

    @ToolbarContentBuilder
    private var categoryMenu: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            if let content = app.content {
                Menu {
                    Picker("Catégorie", selection: $category) {
                        Text("Favoris").tag(LiveSection.favorites)
                        Text("Récents").tag(LiveSection.recents)
                        ForEach(content.liveCategories) { Text($0.name).tag($0.id) }
                    }
                } label: {
                    Label(LiveCategoryList.title(for: category, in: content), systemImage: "line.3.horizontal.decrease.circle")
                        .labelStyle(.titleAndIcon)
                }
            }
        }
        ToolbarItem(placement: .topBarLeading) {
            Button("Maintenant") { windowStart = Self.roundedNow() }
        }
    }

    // MARK: Grille

    private func grid(_ content: ContentStore) -> some View {
        let channels = LiveCategoryList.channels(for: category, content: content, library: library)
        let totalWidth = CGFloat(windowHours * 60) * pointsPerMinute

        return Group {
            if channels.isEmpty {
                ContentUnavailableView("Aucune chaîne", systemImage: "calendar",
                                       description: Text("Choisissez une autre catégorie avec le menu en haut à droite."))
            } else {
                ScrollView(.vertical) {
                    HStack(alignment: .top, spacing: 0) {
                        // Colonne fixe des chaînes
                        LazyVStack(spacing: 1, pinnedViews: [.sectionHeaders]) {
                            Section {
                                ForEach(channels) { stream in
                                    channelCell(stream, playlist: channels)
                                }
                            } header: {
                                Color.clear.frame(height: 32).background(Theme.surface)
                            }
                        }
                        .frame(width: channelColumnWidth)

                        // Timeline défilant horizontalement
                        ScrollView(.horizontal, showsIndicators: false) {
                            LazyVStack(alignment: .leading, spacing: 1, pinnedViews: [.sectionHeaders]) {
                                Section {
                                    ForEach(channels) { stream in
                                        ProgramRow(stream: stream, windowStart: windowStart, windowHours: windowHours,
                                                   pointsPerMinute: pointsPerMinute, height: rowHeight) { program in
                                            selected = SelectedProgram(stream: stream, program: program)
                                        }
                                    }
                                } header: {
                                    timeHeader(width: totalWidth)
                                }
                            }
                            .frame(width: totalWidth)
                            .overlay(alignment: .topLeading) { nowLine }
                        }
                    }
                }
            }
        }
    }

    private func channelCell(_ stream: LiveStream, playlist: [LiveStream]) -> some View {
        Button {
            player.playLive(stream, in: playlist, fullScreen: true)
        } label: {
            HStack(spacing: 8) {
                ChannelLogo(stream: stream, size: 26)
                if sizeClass != .compact {
                    Text(stream.name).font(.caption.weight(.medium)).lineLimit(2)
                    Spacer(minLength: 0)
                }
            }
            .padding(.horizontal, 8)
            .frame(width: channelColumnWidth, height: rowHeight)
            .background(Theme.surface)
        }
        .buttonStyle(.plain)
    }

    private func timeHeader(width: CGFloat) -> some View {
        ZStack(alignment: .topLeading) {
            Theme.surface
            ForEach(0..<Int(windowHours * 2), id: \.self) { i in
                let date = windowStart.addingTimeInterval(Double(i) * 1800)
                Text(date.hourMinute)
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(.secondary)
                    .padding(.leading, 4)
                    .frame(height: 32)
                    .offset(x: CGFloat(i * 30) * pointsPerMinute)
            }
        }
        .frame(width: width, height: 32)
    }

    private var nowLine: some View {
        TimelineView(.periodic(from: .now, by: 60)) { context in
            let minutes = context.date.timeIntervalSince(windowStart) / 60
            if minutes >= 0 && minutes <= windowHours * 60 {
                Rectangle()
                    .fill(Theme.live)
                    .frame(width: 2)
                    .frame(maxHeight: .infinity)
                    .offset(x: CGFloat(minutes) * pointsPerMinute)
                    .allowsHitTesting(false)
            }
        }
    }

    static func roundedNow() -> Date {
        let now = Date().addingTimeInterval(-1800)
        let t = (now.timeIntervalSince1970 / 1800).rounded(.down) * 1800
        return Date(timeIntervalSince1970: t)
    }
}

private struct ProgramRow: View {
    @Environment(AppModel.self) private var app
    let stream: LiveStream
    let windowStart: Date
    let windowHours: Double
    let pointsPerMinute: CGFloat
    let height: CGFloat
    let onSelect: (EPGProgram) -> Void

    var body: some View {
        let windowEnd = windowStart.addingTimeInterval(windowHours * 3600)
        let programs = (app.content?.epg[stream.id] ?? []).filter { $0.end > windowStart && $0.start < windowEnd }

        ZStack(alignment: .topLeading) {
            Theme.background
            if programs.isEmpty {
                Text("Pas d'information")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .padding(.horizontal, 10)
                    .frame(height: height)
            }
            ForEach(programs) { program in
                let start = max(program.start, windowStart)
                let end = min(program.end, windowEnd)
                let x = CGFloat(start.timeIntervalSince(windowStart) / 60) * pointsPerMinute
                let w = max(CGFloat(end.timeIntervalSince(start) / 60) * pointsPerMinute - 1, 1)
                ProgramCell(program: program, width: w, height: height) { onSelect(program) }
                    .offset(x: x)
            }
        }
        .frame(height: height)
        .clipped()
        .task(id: stream.id) { await app.content?.loadEPG(for: stream.id) }
    }
}

private struct ProgramCell: View {
    let program: EPGProgram
    let width: CGFloat
    let height: CGFloat
    let action: () -> Void

    var body: some View {
        let live = program.isLive()
        Button(action: action) {
            VStack(alignment: .leading, spacing: 3) {
                Text(program.title).font(.caption.weight(.semibold)).lineLimit(1)
                Text("\(program.start.hourMinute) – \(program.end.hourMinute)")
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            .padding(.horizontal, 8)
            .frame(width: width, height: height, alignment: .leading)
            .background(live ? Theme.accent.opacity(0.28) : Theme.surface)
            .overlay(alignment: .bottomLeading) {
                if live {
                    Theme.accent.frame(width: width * program.progress(), height: 2)
                }
            }
        }
        .buttonStyle(.plain)
        .opacity(program.end < Date() ? 0.6 : 1)
    }
}

/// Détail d'un programme depuis le guide.
struct ProgramSheet: View {
    @Environment(AppModel.self) private var app
    @Environment(PlayerCoordinator.self) private var player
    @Environment(\.dismiss) private var dismiss
    let stream: LiveStream
    let program: EPGProgram

    var body: some View {
        let now = Date()
        let canReplay = program.end < now && stream.hasArchive
            && program.start > now.addingTimeInterval(-Double(stream.archiveDays) * 86_400)
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    HStack(spacing: 12) {
                        ChannelLogo(stream: stream, size: 36)
                        VStack(alignment: .leading) {
                            Text(stream.name).font(.subheadline.weight(.semibold))
                            Text("\(program.start.formatted(.dateTime.weekday(.wide).day().month())) · \(program.start.hourMinute) – \(program.end.hourMinute)")
                                .font(.caption).foregroundStyle(.secondary)
                        }
                    }
                    Text(program.title).font(.title2.bold())
                    if program.isLive(at: now) {
                        ProgressBar(value: program.progress(at: now), color: Theme.live).frame(height: 4)
                    }
                    if let desc = program.description { Text(desc).font(.body).foregroundStyle(.secondary) }

                    HStack {
                        if program.isLive(at: now) {
                            Button {
                                dismiss()
                                player.playLive(stream, in: [], fullScreen: true)
                            } label: { Label("Regarder en direct", systemImage: "play.fill").frame(maxWidth: .infinity) }
                                .buttonStyle(.borderedProminent)
                        } else if canReplay {
                            Button {
                                dismiss()
                                Task { await player.playCatchup(stream, program: program, serverTimeZone: app.serverTimeZone) }
                            } label: { Label("Revoir", systemImage: "gobackward").frame(maxWidth: .infinity) }
                                .buttonStyle(.borderedProminent)
                        } else if program.start > now {
                            Label("À venir", systemImage: "clock").foregroundStyle(.secondary)
                        }
                    }
                    .controlSize(.large)
                }
                .padding()
            }
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("OK") { dismiss() } }
            }
        }
    }
}
