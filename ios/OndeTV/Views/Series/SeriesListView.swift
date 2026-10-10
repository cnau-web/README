import SwiftUI
import XtreamKit

struct SeriesListView: View {
    @Environment(AppModel.self) private var app
    @Environment(LibraryStore.self) private var library
    @Environment(\.horizontalSizeClass) private var sizeClass

    @State private var category = ContentStore.allCategoryId
    @State private var items: [Series] = []
    @State private var state: LoadState = .idle
    @State private var search = ""

    var body: some View {
        NavigationStack {
            Group {
                if let content = app.content {
                    switch content.seriesState {
                    case .failed(let message):
                        LoadFailedView(message: message) { Task { await content.loadSeriesCategories(force: true) } }
                    case .loaded:
                        VStack(spacing: 0) {
                            CategoryChips(categories: [XtreamCategory(id: VODSection.favorites, name: "★ Favoris"), .all]
                                          + content.seriesCategories, selection: $category)
                                .padding(.vertical, 8)
                            gridContent
                        }
                    default:
                        ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                }
            }
            .background(Theme.background)
            .navigationTitle("Séries")
            .searchable(text: $search, prompt: "Rechercher une série")
            .navigationDestination(for: Series.self) { SeriesDetailView(series: $0) }
            .task { await app.content?.loadSeriesCategories() }
            .task(id: category) { await load() }
        }
    }

    @ViewBuilder
    private var gridContent: some View {
        let filtered = search.isEmpty ? items : items.filter { $0.name.localizedStandardContains(search) }
        switch state {
        case .failed(let message):
            LoadFailedView(message: message) { Task { await load(force: true) } }
        case .loaded where filtered.isEmpty:
            ContentUnavailableView(search.isEmpty ? "Aucune série" : "Aucun résultat", systemImage: "rectangle.stack")
        case .loaded:
            ScrollView {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: sizeClass == .compact ? 105 : 150), spacing: 14)], spacing: 18) {
                    ForEach(filtered) { series in
                        NavigationLink(value: series) {
                            PosterCard(title: series.name, image: series.cover, rating: series.rating)
                        }
                        .buttonStyle(.plain)
                        .contextMenu {
                            Button {
                                library.toggleFavoriteSeries(series.id)
                            } label: {
                                library.isFavoriteSeries(series.id)
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
            if category == VODSection.favorites {
                let all = try await content.series(in: ContentStore.allCategoryId, force: force)
                let byId = Dictionary(all.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
                items = library.data.favoriteSeries.compactMap { byId[$0] }
            } else {
                items = try await content.series(in: category, force: force)
            }
            state = .loaded
        } catch is CancellationError {
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}
