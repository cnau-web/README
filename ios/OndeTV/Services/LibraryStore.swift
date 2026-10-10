import Foundation
import Observation

/// Favoris, chaînes récentes et positions de lecture, par compte.
@MainActor
@Observable
final class LibraryStore {
    struct Snapshot: Codable {
        var favoriteChannels: [Int] = []
        var favoriteMovies: [Int] = []
        var favoriteSeries: [Int] = []
        var recentChannels: [Int] = []
        /// Clé : "movie-<id>" ou "episode-<id>" → position en secondes et durée.
        var progress: [String: Progress] = [:]
        var lastChannel: Int?
    }

    struct Progress: Codable, Hashable {
        var position: Double
        var duration: Double
        var updatedAt: Date

        var fraction: Double { duration > 0 ? min(position / duration, 1) : 0 }
        var isFinished: Bool { fraction > 0.95 }
    }

    private(set) var data = Snapshot()
    private var accountId: UUID?

    func load(accountId: UUID?) {
        self.accountId = accountId
        guard let accountId,
              let raw = UserDefaults.standard.data(forKey: Self.key(accountId)),
              let decoded = try? JSONDecoder().decode(Snapshot.self, from: raw) else {
            data = Snapshot()
            return
        }
        data = decoded
    }

    static func deleteData(accountId: UUID) {
        UserDefaults.standard.removeObject(forKey: key(accountId))
    }

    private static func key(_ id: UUID) -> String { "library.\(id.uuidString)" }

    private func save() {
        guard let accountId, let raw = try? JSONEncoder().encode(data) else { return }
        UserDefaults.standard.set(raw, forKey: Self.key(accountId))
    }

    // MARK: Favoris

    func isFavoriteChannel(_ id: Int) -> Bool { data.favoriteChannels.contains(id) }
    func isFavoriteMovie(_ id: Int) -> Bool { data.favoriteMovies.contains(id) }
    func isFavoriteSeries(_ id: Int) -> Bool { data.favoriteSeries.contains(id) }

    func toggleFavoriteChannel(_ id: Int) { toggle(id, in: \.favoriteChannels) }
    func toggleFavoriteMovie(_ id: Int) { toggle(id, in: \.favoriteMovies) }
    func toggleFavoriteSeries(_ id: Int) { toggle(id, in: \.favoriteSeries) }

    func moveFavoriteChannels(from source: IndexSet, to destination: Int) {
        data.favoriteChannels.move(fromOffsets: source, toOffset: destination)
        save()
    }

    private func toggle(_ id: Int, in keyPath: WritableKeyPath<Snapshot, [Int]>) {
        if let i = data[keyPath: keyPath].firstIndex(of: id) {
            data[keyPath: keyPath].remove(at: i)
        } else {
            data[keyPath: keyPath].append(id)
        }
        save()
    }

    // MARK: Récents

    func markWatched(channel id: Int) {
        data.recentChannels.removeAll { $0 == id }
        data.recentChannels.insert(id, at: 0)
        data.recentChannels = Array(data.recentChannels.prefix(30))
        data.lastChannel = id
        save()
    }

    func clearRecents() {
        data.recentChannels = []
        save()
    }

    // MARK: Reprise de lecture

    func progress(for key: String) -> Progress? { data.progress[key] }

    func saveProgress(_ key: String, position: Double, duration: Double) {
        guard duration > 0, position.isFinite, duration.isFinite else { return }
        if position < 10 { return }
        data.progress[key] = Progress(position: position, duration: duration, updatedAt: Date())
        save()
    }

    func clearProgress(_ key: String) {
        data.progress[key] = nil
        save()
    }

    static func movieKey(_ id: Int) -> String { "movie-\(id)" }
    static func episodeKey(_ id: String) -> String { "episode-\(id)" }
}
