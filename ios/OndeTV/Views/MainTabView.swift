import SwiftUI

struct MainTabView: View {
    @Environment(AppModel.self) private var app
    @Environment(LibraryStore.self) private var library
    @State private var player = PlayerCoordinator()

    var body: some View {
        @Bindable var player = player
        TabView {
            LiveTVView()
                .tabItem { Label("Direct", systemImage: "tv") }
            GuideView()
                .tabItem { Label("Guide TV", systemImage: "calendar") }
            MoviesView()
                .tabItem { Label("Films", systemImage: "film") }
            SeriesListView()
                .tabItem { Label("Séries", systemImage: "rectangle.stack") }
            SettingsView()
                .tabItem { Label("Réglages", systemImage: "gearshape") }
        }
        .environment(player)
        .onAppear {
            player.client = app.client
            player.library = library
        }
        .fullScreenCover(item: $player.presented) { _ in
            LivePlayerScreen()
                .environment(player)
                .environment(app)
                .environment(library)
        }
    }
}
