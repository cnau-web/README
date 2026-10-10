import SwiftUI
import XtreamKit

struct ChannelListView: View {
    @Environment(AppModel.self) private var app
    @Environment(LibraryStore.self) private var library
    @Environment(PlayerCoordinator.self) private var player

    let categoryId: String
    let title: String
    /// Fourni sur iPad (sélection → aperçu). nil sur iPhone (toucher → plein écran).
    var selection: Binding<Int?>?

    @State private var search = ""

    var body: some View {
        if let content = app.content {
            let all = LiveCategoryList.channels(for: categoryId, content: content, library: library)
            let channels = search.isEmpty ? all : all.filter { $0.name.localizedStandardContains(search) }

            Group {
                if channels.isEmpty {
                    ContentUnavailableView(emptyTitle, systemImage: categoryId == LiveSection.favorites ? "star" : "tv",
                                           description: Text(emptyMessage))
                } else if let selection {
                    List(selection: selection) {
                        ForEach(channels) { stream in
                            ChannelRow(stream: stream)
                                .tag(stream.id as Int?)
                                .contextMenu { menu(stream, channels) }
                        }
                        .onMove(perform: categoryId == LiveSection.favorites ? library.moveFavoriteChannels : nil)
                    }
                } else {
                    List {
                        ForEach(channels) { stream in
                            HStack {
                                Button {
                                    player.playLive(stream, in: channels, fullScreen: true)
                                } label: {
                                    ChannelRow(stream: stream).contentShape(Rectangle())
                                }
                                .buttonStyle(.plain)
                                NavigationLink(value: ChannelRoute(stream: stream, playlist: channels)) {
                                    Image(systemName: "info.circle").foregroundStyle(.secondary)
                                }
                                .fixedSize()
                            }
                            .contextMenu { menu(stream, channels) }
                        }
                        .onMove(perform: categoryId == LiveSection.favorites ? library.moveFavoriteChannels : nil)
                    }
                }
            }
            .listStyle(.plain)
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $search, prompt: "Rechercher une chaîne")
            .toolbar {
                if categoryId == LiveSection.recents && !all.isEmpty {
                    Button("Effacer") { library.clearRecents() }
                }
                if categoryId == LiveSection.favorites && all.count > 1 {
                    EditButton()
                }
            }
        }
    }

    @ViewBuilder
    private func menu(_ stream: LiveStream, _ list: [LiveStream]) -> some View {
        Button {
            player.playLive(stream, in: list, fullScreen: true)
        } label: { Label("Regarder en plein écran", systemImage: "play.fill") }
        Button {
            library.toggleFavoriteChannel(stream.id)
        } label: {
            library.isFavoriteChannel(stream.id)
                ? Label("Retirer des favoris", systemImage: "star.slash")
                : Label("Ajouter aux favoris", systemImage: "star")
        }
    }

    private var emptyTitle: String {
        if !search.isEmpty { return "Aucun résultat" }
        switch categoryId {
        case LiveSection.favorites: return "Aucun favori"
        case LiveSection.recents: return "Aucune chaîne récente"
        default: return "Aucune chaîne"
        }
    }

    private var emptyMessage: String {
        if !search.isEmpty { return "Aucune chaîne ne correspond à « \(search) »." }
        switch categoryId {
        case LiveSection.favorites: return "Appui long sur une chaîne → Ajouter aux favoris."
        case LiveSection.recents: return "Les chaînes regardées apparaîtront ici."
        default: return "Cette catégorie est vide."
        }
    }
}

struct ChannelRow: View {
    @Environment(AppModel.self) private var app
    @Environment(LibraryStore.self) private var library
    @Environment(PlayerCoordinator.self) private var player
    let stream: LiveStream

    var body: some View {
        let program = app.content?.currentProgram(for: stream.id)
        HStack(spacing: 12) {
            if let n = stream.number {
                Text("\(n)")
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.secondary)
                    .frame(minWidth: 28, alignment: .trailing)
            }
            ChannelLogo(stream: stream, size: 34)
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(stream.name).font(.body.weight(.medium)).lineLimit(1)
                    if player.currentLive?.id == stream.id {
                        Image(systemName: "speaker.wave.2.fill").font(.caption).foregroundStyle(Theme.accent)
                    }
                    if library.isFavoriteChannel(stream.id) {
                        Image(systemName: "star.fill").font(.caption2).foregroundStyle(.yellow)
                    }
                    if stream.hasArchive {
                        Image(systemName: "clock.arrow.circlepath").font(.caption2).foregroundStyle(.secondary)
                    }
                }
                if let program {
                    Text(program.title).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                    ProgressBar(value: program.progress()).frame(height: 3)
                }
            }
        }
        .padding(.vertical, 4)
        .task(id: stream.id) { await app.content?.loadEPG(for: stream.id) }
    }
}
