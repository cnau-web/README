import SwiftUI
import XtreamKit

enum VODSection {
    static let favorites = "__favorites"
    static let continueWatching = "__continue"
}

struct MoviesView: View {
    @Environment(AppModel.self) private var app
    @Environment(LibraryStore.self) private var library
    @Environment(\.horizontalSizeClass) private var sizeClass

    @State private var category = ContentStore.allCategoryId
    @State private var items: [VODStream] = []
    @State private var state: LoadState = .idle
    @State private var search = ""

    var body: some View {
        NavigationStack {
            Group {
                if let content = app.content {
                    switch content.vodState {
                    case .failed(let message):
                        LoadFailedView(message: message) { Task { await content.loadVODCategories(force: true) } }
                    case .loaded:
                        VStack(spacing: 0) {
                            CategoryChips(categories: chips(content), selection: $category)
                                .padding(.vertical, 8)
                            gridContent
                        }
                    default:
                        ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                }
            }
            .background(Theme.background)
            .navigationTitle("Films")
            .searchable(text: $search, prompt: "Rechercher un film")
            .navigationDestination(for: VODStream.self) { MovieDetailView(movie: $0) }
            .task { await app.content?.loadVODCategories() }
            .task(id: category) { await load() }
        }
    }

    private func chips(_ content: ContentStore) -> [XtreamCategory] {
        [XtreamCategory(id: VODSection.favorites, name: "★ Favoris"),
         XtreamCategory(id: VODSection.continueWatching, name: "Reprendre"),
         .all] + content.vodCategories
    }

    @ViewBuilder
    private var gridContent: some View {
        let filtered = search.isEmpty ? items : items.filter { $0.name.localizedStandardContains(search) }
        switch state {
        case .failed(let message):
            LoadFailedView(message: message) { Task { await load(force: true) } }
        case .loaded where filtered.isEmpty:
            ContentUnavailableView(search.isEmpty ? "Aucun film" : "Aucun résultat", systemImage: "film")
        case .loaded:
            ScrollView {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: sizeClass == .compact ? 105 : 150), spacing: 14)], spacing: 18) {
                    ForEach(filtered) { movie in
                        NavigationLink(value: movie) {
                            PosterCard(title: movie.name, image: movie.icon, rating: movie.rating,
                                       progress: library.progress(for: LibraryStore.movieKey(movie.id))?.fraction)
                        }
                        .buttonStyle(.plain)
                        .contextMenu {
                            Button {
                                library.toggleFavoriteMovie(movie.id)
                            } label: {
                                library.isFavoriteMovie(movie.id)
                                    ? Label("Retirer des favoris", systemImage: "star.slash")
                                    : Label("Ajouter aux favoris", systemImage: "star")
                            }
                        }
                    }
                }
                .padding()
            }
            .refreshable { await load(force: true) }
        default:
            ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    private func load(force: Bool = false) async {
        guard let content = app.content else { return }
        state = .loading
        do {
            switch category {
            case VODSection.favorites, VODSection.continueWatching:
                // Ces sections se construisent à partir du catalogue complet.
                let all = try await content.vod(in: ContentStore.allCategoryId, force: force)
                let ids: [Int]
                if category == VODSection.favorites {
                    ids = library.data.favoriteMovies
                } else {
                    ids = library.data.progress
                        .filter { $0.key.hasPrefix("movie-") && !$0.value.isFinished }
                        .sorted { $0.value.updatedAt > $1.value.updatedAt }
                        .compactMap { Int($0.key.dropFirst("movie-".count)) }
                }
                let byId = Dictionary(all.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
                items = ids.compactMap { byId[$0] }
            default:
                items = try await content.vod(in: category, force: force)
            }
            state = .loaded
        } catch is CancellationError {
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}
