import SwiftUI
import XtreamKit

struct SeriesDetailView: View {
    @Environment(AppModel.self) private var app
    @Environment(LibraryStore.self) private var library
    @Environment(PlayerCoordinator.self) private var player

    let series: Series
    @State private var info: SeriesInfo?
    @State private var season: Int?
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                DetailHeader(backdrop: info?.backdrops.first ?? series.backdrops.first ?? series.cover,
                             poster: series.cover,
                             title: series.name,
                             facts: facts)

                VStack(alignment: .leading, spacing: 16) {
                    HStack(spacing: 12) {
                        if let next = nextEpisode {
                            Button {
                                play(next)
                            } label: {
                                Label(library.progress(for: LibraryStore.episodeKey(next.id)) == nil
                                      ? "Lecture S\(next.season) E\(next.episodeNumber)"
                                      : "Reprendre S\(next.season) E\(next.episodeNumber)",
                                      systemImage: "play.fill")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent)
                        }
                        Button {
                            library.toggleFavoriteSeries(series.id)
                        } label: {
                            Image(systemName: library.isFavoriteSeries(series.id) ? "star.fill" : "star")
                        }
                        .buttonStyle(.bordered)
                        .tint(library.isFavoriteSeries(series.id) ? .yellow : nil)
                    }
                    .controlSize(.large)

                    if let plot = info?.plot ?? series.plot { Text(plot) }
                    if let genre = info?.genre ?? series.genre { InfoLine(title: "Genre", value: genre) }
                    if let cast = info?.cast ?? series.cast { InfoLine(title: "Avec", value: cast) }

                    if let error {
                        Label(error, systemImage: "exclamationmark.triangle").foregroundStyle(.secondary)
                    } else if let info {
                        episodesSection(info)
                    } else {
                        ProgressView().frame(maxWidth: .infinity)
                    }
                }
                .padding(.horizontal)
                .frame(maxWidth: 900, alignment: .leading)
            }
            .padding(.bottom, 30)
        }
        .background(Theme.background)
        .ignoresSafeArea(edges: .top)
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    @ViewBuilder
    private func episodesSection(_ info: SeriesInfo) -> some View {
        let seasons = info.sortedSeasonNumbers
        if seasons.isEmpty {
            Text("Aucun épisode disponible.").foregroundStyle(.secondary)
        } else {
            Picker("Saison", selection: Binding(get: { season ?? seasons[0] }, set: { season = $0 })) {
                ForEach(seasons, id: \.self) { Text(info.seasonName($0)).tag($0) }
            }
            .pickerStyle(.menu)
            .font(.headline)

            LazyVStack(spacing: 12) {
                ForEach(info.episodesBySeason[season ?? seasons[0]] ?? []) { episode in
                    EpisodeRow(episode: episode, fallbackImage: series.cover,
                               progress: library.progress(for: LibraryStore.episodeKey(episode.id))) {
                        play(episode)
                    }
                }
            }
        }
    }

    private var facts: [String] {
        var f: [String] = []
        if let year = (info?.releaseDate ?? series.releaseDate)?.prefix(4) { f.append(String(year)) }
        if let info { f.append("\(info.sortedSeasonNumbers.count) saison\(info.sortedSeasonNumbers.count > 1 ? "s" : "")") }
        if let r = series.rating { f.append(String(format: "★ %.1f", r)) }
        return f
    }

    /// Premier épisode non terminé après le dernier regardé.
    private var nextEpisode: Episode? {
        guard let info else { return nil }
        let all = info.sortedSeasonNumbers.flatMap { info.episodesBySeason[$0] ?? [] }
        let watched = all.enumerated().filter { library.progress(for: LibraryStore.episodeKey($0.element.id)) != nil }
        guard let last = watched.max(by: {
            library.progress(for: LibraryStore.episodeKey($0.element.id))!.updatedAt
                < library.progress(for: LibraryStore.episodeKey($1.element.id))!.updatedAt
        }) else { return all.first }
        let lastProgress = library.progress(for: LibraryStore.episodeKey(last.element.id))
        if lastProgress?.isFinished == true, last.offset + 1 < all.count { return all[last.offset + 1] }
        return last.element
    }

    private func play(_ episode: Episode) {
        guard let client = app.client else { return }
        season = episode.season
        Task {
            await player.playOnDemand(url: client.episodeURL(episode),
                                      title: episode.title,
                                      subtitle: "\(series.name) · S\(episode.season) E\(episode.episodeNumber)",
                                      progressKey: LibraryStore.episodeKey(episode.id))
        }
    }

    private func load() async {
        guard info == nil, let content = app.content else { return }
        do {
            let loaded = try await content.client.seriesInfo(id: series.id)
            info = loaded
            if season == nil { season = nextEpisode?.season ?? loaded.sortedSeasonNumbers.first }
        } catch {
            self.error = error.localizedDescription
        }
    }
}

private struct EpisodeRow: View {
    let episode: Episode
    let fallbackImage: URL?
    let progress: LibraryStore.Progress?
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(alignment: .top, spacing: 12) {
                RemoteImage(url: episode.image ?? fallbackImage, contentMode: .fill) {
                    ZStack { Theme.surfaceHighlight; Image(systemName: "play.fill").foregroundStyle(.secondary) }
                }
                .frame(width: 140, height: 79)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(alignment: .bottom) {
                    if let progress { ProgressBar(value: progress.fraction).frame(height: 3).padding(4) }
                }

                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("\(episode.episodeNumber). \(episode.title)").font(.subheadline.weight(.semibold)).lineLimit(2)
                        Spacer(minLength: 0)
                        if progress?.isFinished == true {
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.accent)
                        }
                    }
                    if let d = episode.durationSeconds, d > 0 {
                        Text(d.durationText).font(.caption).foregroundStyle(.secondary)
                    }
                    if let plot = episode.plot {
                        Text(plot).font(.caption).foregroundStyle(.secondary).lineLimit(3)
                    }
                }
            }
            .padding(10)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }
}
