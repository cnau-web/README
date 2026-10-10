import SwiftUI
import XtreamKit

enum LiveSection {
    static let favorites = "__favorites"
    static let recents = "__recents"
}

/// Onglet Direct. iPad : 3 colonnes (catégories | chaînes | aperçu + EPG). iPhone : navigation empilée.
struct LiveTVView: View {
    @Environment(AppModel.self) private var app
    @Environment(LibraryStore.self) private var library
    @Environment(\.horizontalSizeClass) private var sizeClass

    @State private var category: String? = ContentStore.allCategoryId
    @State private var selectedChannel: Int?
    @State private var columns: NavigationSplitViewVisibility = .all

    var body: some View {
        Group {
            if let content = app.content {
                switch content.liveState {
                case .idle, .loading:
                    ProgressView("Chargement des chaînes…").frame(maxWidth: .infinity, maxHeight: .infinity)
                case .failed(let message):
                    LoadFailedView(message: message) { Task { await content.loadLive(force: true) } }
                case .loaded:
                    if sizeClass == .compact { compactLayout } else { splitLayout(content) }
                }
            }
        }
        .background(Theme.background)
        .task { await app.content?.loadLive() }
    }

    private var compactLayout: some View {
        NavigationStack {
            LiveCategoryList(selection: nil)
                .navigationTitle("Direct")
                .navigationDestination(for: LiveCategoryRoute.self) { route in
                    ChannelListView(categoryId: route.id, title: route.title, selection: nil)
                }
                .navigationDestination(for: ChannelRoute.self) { route in
                    ChannelDetailView(stream: route.stream, playlist: route.playlist)
                }
        }
    }

    private func splitLayout(_ content: ContentStore) -> some View {
        NavigationSplitView(columnVisibility: $columns) {
            LiveCategoryList(selection: $category)
                .navigationTitle("Direct")
                .navigationSplitViewColumnWidth(min: 200, ideal: 240)
        } content: {
            if let category {
                ChannelListView(categoryId: category, title: LiveCategoryList.title(for: category, in: content),
                                selection: $selectedChannel)
                    .navigationSplitViewColumnWidth(min: 300, ideal: 360)
            }
        } detail: {
            if let id = selectedChannel, let stream = content.liveStream(id: id) {
                ChannelDetailView(stream: stream, playlist: channels(for: category ?? "", content: content))
            } else {
                ContentUnavailableView("Choisissez une chaîne", systemImage: "tv",
                                       description: Text("L'aperçu et le guide des programmes s'afficheront ici."))
            }
        }
        .navigationSplitViewStyle(.balanced)
    }

    private func channels(for category: String, content: ContentStore) -> [LiveStream] {
        LiveCategoryList.channels(for: category, content: content, library: library)
    }
}

struct LiveCategoryRoute: Hashable {
    let id: String
    let title: String
}

struct ChannelRoute: Hashable {
    let stream: LiveStream
    let playlist: [LiveStream]
}

struct LiveCategoryList: View {
    @Environment(AppModel.self) private var app
    @Environment(LibraryStore.self) private var library
    var selection: Binding<String?>?

    var body: some View {
        if let content = app.content {
            let items = makeRows(content)

            if let selection {
                List(selection: selection) {
                    ForEach(items, id: \.id) { row in
                        label(row.title, row.icon, row.count).tag(row.id as String?)
                    }
                }
                .refreshable { await content.loadLive(force: true) }
            } else {
                List(items, id: \.id) { row in
                    NavigationLink(value: LiveCategoryRoute(id: row.id, title: row.title)) {
                        label(row.title, row.icon, row.count)
                    }
                }
                .refreshable { await content.loadLive(force: true) }
            }
        }
    }

    private struct Row {
        let id: String, title: String, icon: String, count: Int
    }

    private func makeRows(_ content: ContentStore) -> [Row] {
        var rows = [
            Row(id: LiveSection.favorites, title: "Favoris", icon: "star.fill", count: library.data.favoriteChannels.count),
            Row(id: LiveSection.recents, title: "Récents", icon: "clock.arrow.circlepath", count: library.data.recentChannels.count),
            Row(id: ContentStore.allCategoryId, title: "Toutes les chaînes", icon: "square.grid.2x2", count: content.liveStreams.count),
        ]
        for cat in content.liveCategories {
            rows.append(Row(id: cat.id, title: cat.name, icon: "folder", count: content.liveStreams(in: cat.id).count))
        }
        return rows
    }

    private func label(_ title: String, _ icon: String, _ count: Int) -> some View {
        HStack {
            Label(title, systemImage: icon).lineLimit(1)
            Spacer()
            Text("\(count)").font(.caption.monospacedDigit()).foregroundStyle(.secondary)
        }
    }

    static func title(for id: String, in content: ContentStore) -> String {
        switch id {
        case LiveSection.favorites: return "Favoris"
        case LiveSection.recents: return "Récents"
        case ContentStore.allCategoryId: return "Toutes les chaînes"
        default: return content.liveCategories.first { $0.id == id }?.name ?? "Chaînes"
        }
    }

    @MainActor
    static func channels(for id: String, content: ContentStore, library: LibraryStore?) -> [LiveStream] {
        switch id {
        case LiveSection.favorites:
            return (library?.data.favoriteChannels ?? []).compactMap(content.liveStream(id:))
        case LiveSection.recents:
            return (library?.data.recentChannels ?? []).compactMap(content.liveStream(id:))
        default:
            return content.liveStreams(in: id)
        }
    }
}
