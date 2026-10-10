import SwiftUI
import XtreamKit

struct MovieDetailView: View {
    @Environment(AppModel.self) private var app
    @Environment(LibraryStore.self) private var library
    @Environment(PlayerCoordinator.self) private var player
    @Environment(\.openURL) private var openURL

    let movie: VODStream
    @State private var info: VODInfo?

    private var progressKey: String { LibraryStore.movieKey(movie.id) }

    var body: some View {
        let progress = library.progress(for: progressKey)
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                DetailHeader(backdrop: info?.backdrops.first ?? info?.poster ?? movie.icon,
                             poster: info?.poster ?? movie.icon,
                             title: movie.name,
                             facts: facts)

                VStack(alignment: .leading, spacing: 16) {
                    HStack(spacing: 12) {
                        Button {
                            play()
                        } label: {
                            Label(progress.map { !$0.isFinished } == true ? "Reprendre" : "Lecture",
                                  systemImage: "play.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)

                        if progress != nil {
                            Button {
                                library.clearProgress(progressKey)
                                play()
                            } label: { Image(systemName: "gobackward") }
                                .buttonStyle(.bordered)
                                .accessibilityLabel("Reprendre du début")
                        }
                        Button {
                            library.toggleFavoriteMovie(movie.id)
                        } label: {
                            Image(systemName: library.isFavoriteMovie(movie.id) ? "star.fill" : "star")
                        }
                        .buttonStyle(.bordered)
                        .tint(library.isFavoriteMovie(movie.id) ? .yellow : nil)

                        if let trailer = info?.trailerURL {
                            Button { openURL(trailer) } label: { Image(systemName: "play.rectangle") }
                                .buttonStyle(.bordered)
                                .accessibilityLabel("Bande-annonce")
                        }
                    }
                    .controlSize(.large)

                    if let progress, !progress.isFinished {
                        HStack {
                            ProgressBar(value: progress.fraction).frame(height: 4)
                            Text("\(Int(progress.duration - progress.position).durationText) restantes")
                                .font(.caption).foregroundStyle(.secondary)
                        }
                    }

                    if let plot = info?.plot { Text(plot).font(.body) }
                    if let genre = info?.genre { InfoLine(title: "Genre", value: genre) }
                    if let director = info?.director { InfoLine(title: "Réalisation", value: director) }
                    if let cast = info?.cast { InfoLine(title: "Avec", value: cast) }
                }
                .padding(.horizontal)
                .frame(maxWidth: 900, alignment: .leading)
            }
            .padding(.bottom, 30)
        }
        .background(Theme.background)
        .ignoresSafeArea(edges: .top)
        .navigationBarTitleDisplayMode(.inline)
        .task { info = try? await app.content?.client.vodInfo(id: movie.id) }
    }

    private var facts: [String] {
        var f: [String] = []
        if let year = info?.releaseDate?.prefix(4) { f.append(String(year)) }
        if let d = info?.durationSeconds, d > 0 { f.append(d.durationText) }
        if let r = info?.rating ?? movie.rating { f.append(String(format: "★ %.1f", r)) }
        f.append((info?.containerExtension ?? movie.containerExtension).uppercased())
        return f
    }

    private func play() {
        guard let client = app.client else { return }
        let ext = info?.containerExtension ?? movie.containerExtension
        Task {
            await player.playOnDemand(url: client.movieURL(id: movie.id, containerExtension: ext),
                                      title: movie.name, subtitle: nil, progressKey: progressKey)
        }
    }
}

/// Bandeau image + affiche + titre, partagé entre films et séries.
struct DetailHeader: View {
    let backdrop: URL?
    let poster: URL?
    let title: String
    let facts: [String]

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            RemoteImage(url: backdrop, contentMode: .fill) { Theme.surface }
                .frame(height: 300)
                .frame(maxWidth: .infinity)
                .clipped()
                .blur(radius: backdrop == poster ? 18 : 0)
                .overlay(LinearGradient(colors: [.clear, Theme.background], startPoint: .center, endPoint: .bottom))

            HStack(alignment: .bottom, spacing: 16) {
                RemoteImage(url: poster, contentMode: .fill) { Theme.surfaceHighlight }
                    .frame(width: 110, height: 165)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .shadow(radius: 10)
                VStack(alignment: .leading, spacing: 6) {
                    Text(title).font(.title2.bold()).lineLimit(3)
                    Text(facts.joined(separator: " · ")).font(.subheadline).foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal)
            .offset(y: 40)
        }
        .padding(.bottom, 40)
    }
}

struct InfoLine: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            Text(value).font(.subheadline)
        }
    }
}
