import SwiftUI
import AVFoundation

@main
struct OndeTVApp: App {
    @State private var app = AppModel()
    @State private var library = LibraryStore()

    init() {
        URLCache.shared = URLCache(memoryCapacity: 64 * 1024 * 1024, diskCapacity: 512 * 1024 * 1024)
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .moviePlayback)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(app)
                .environment(library)
                .preferredColorScheme(.dark)
                .tint(Theme.accent)
                .task { await app.restoreSession() }
                .onChange(of: app.activeAccount?.id) { _, id in library.load(accountId: id) }
        }
    }
}

struct RootView: View {
    @Environment(AppModel.self) private var app

    var body: some View {
        Group {
            switch app.phase {
            case .launching:
                ZStack {
                    Theme.background.ignoresSafeArea()
                    ProgressView().controlSize(.large)
                }
            case .loggedOut:
                LoginView()
            case .ready:
                MainTabView()
                    .id(app.activeAccount?.id)
            }
        }
        .animation(.easeInOut, value: app.phase)
    }
}

enum Theme {
    static let accent = Color(red: 0.20, green: 0.62, blue: 1.0)
    static let background = Color(red: 0.05, green: 0.06, blue: 0.09)
    static let surface = Color(red: 0.10, green: 0.11, blue: 0.15)
    static let surfaceHighlight = Color(red: 0.16, green: 0.18, blue: 0.24)
    static let live = Color(red: 0.95, green: 0.25, blue: 0.30)
}
