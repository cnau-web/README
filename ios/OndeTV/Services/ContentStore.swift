import Foundation
import Observation
import XtreamKit

enum LoadState: Equatable {
    case idle, loading, loaded
    case failed(String)
}

/// Cache en mémoire du contenu du compte actif (catégories, chaînes, films, séries, EPG).
@MainActor
@Observable
final class ContentStore {
    let client: XtreamClient

    // Direct
    private(set) var liveCategories: [XtreamCategory] = []
    private(set) var liveStreams: [LiveStream] = []
    private(set) var liveState: LoadState = .idle
    @ObservationIgnored private var liveById: [Int: LiveStream] = [:]
    @ObservationIgnored private var liveByCategory: [String: [LiveStream]] = [:]

    // Films
    private(set) var vodCategories: [XtreamCategory] = []
    private(set) var vodByCategory: [String: [VODStream]] = [:]
    private(set) var vodState: LoadState = .idle

    // Séries
    private(set) var seriesCategories: [XtreamCategory] = []
    private(set) var seriesByCategory: [String: [Series]] = [:]
    private(set) var seriesState: LoadState = .idle

    // EPG
    private(set) var epg: [Int: [EPGProgram]] = [:]
    @ObservationIgnored private var epgFetchedAt: [Int: Date] = [:]
    @ObservationIgnored private var epgInFlight: Set<Int> = []
    @ObservationIgnored private let limiter = AsyncLimiter(limit: 6)

    static let allCategoryId = ""

    init(client: XtreamClient) {
        self.client = client
    }

    // MARK: Direct

    func loadLive(force: Bool = false) async {
        if liveState == .loading || (liveState == .loaded && !force) { return }
        liveState = .loading
        do {
            async let cats = client.liveCategories()
            async let streams = client.liveStreams()
            let (c, s) = try await (cats, streams)
            liveCategories = c
            let sorted = s.sorted { ($0.number ?? .max, $0.name) < ($1.number ?? .max, $1.name) }
            liveById = Dictionary(sorted.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
            liveByCategory = Dictionary(grouping: sorted) { $0.categoryId ?? "" }
            liveStreams = sorted
            liveState = .loaded
        } catch {
            liveState = .failed(error.localizedDescription)
        }
    }

    func liveStreams(in categoryId: String) -> [LiveStream] {
        categoryId == Self.allCategoryId ? liveStreams : liveByCategory[categoryId] ?? []
    }

    func liveStream(id: Int) -> LiveStream? {
        liveById[id]
    }

    // MARK: Films

    func loadVODCategories(force: Bool = false) async {
        if vodState == .loading || (vodState == .loaded && !force) { return }
        vodState = .loading
        do {
            vodCategories = try await client.vodCategories()
            vodState = .loaded
        } catch {
            vodState = .failed(error.localizedDescription)
        }
    }

    func vod(in categoryId: String, force: Bool = false) async throws -> [VODStream] {
        if !force, let cached = vodByCategory[categoryId] { return cached }
        let items = try await client.vodStreams(categoryId: categoryId == Self.allCategoryId ? nil : categoryId)
        let sorted = items.sorted { ($0.added ?? .distantPast) > ($1.added ?? .distantPast) }
        vodByCategory[categoryId] = sorted
        return sorted
    }

    // MARK: Séries

    func loadSeriesCategories(force: Bool = false) async {
        if seriesState == .loading || (seriesState == .loaded && !force) { return }
        seriesState = .loading
        do {
            seriesCategories = try await client.seriesCategories()
            seriesState = .loaded
        } catch {
            seriesState = .failed(error.localizedDescription)
        }
    }

    func series(in categoryId: String, force: Bool = false) async throws -> [Series] {
        if !force, let cached = seriesByCategory[categoryId] { return cached }
        let items = try await client.series(categoryId: categoryId == Self.allCategoryId ? nil : categoryId)
        let sorted = items.sorted { ($0.lastModified ?? .distantPast) > ($1.lastModified ?? .distantPast) }
        seriesByCategory[categoryId] = sorted
        return sorted
    }

    // MARK: EPG

    /// Charge l'EPG court d'une chaîne (cache 15 min, requêtes limitées en parallèle).
    func loadEPG(for streamId: Int) async {
        if epgInFlight.contains(streamId) { return }
        if let at = epgFetchedAt[streamId], Date().timeIntervalSince(at) < 15 * 60,
           let list = epg[streamId], list.last.map({ $0.end > Date() }) ?? true {
            return
        }
        epgInFlight.insert(streamId)
        defer { epgInFlight.remove(streamId) }
        let client = self.client
        let programs = await limiter.run { try? await client.shortEPG(streamId: streamId, limit: 24) }
        guard let programs else { return }
        epg[streamId] = programs.filter { $0.end > Date().addingTimeInterval(-3 * 3600) }
        epgFetchedAt[streamId] = Date()
    }

    func currentProgram(for streamId: Int, at date: Date = Date()) -> EPGProgram? {
        epg[streamId]?.first { $0.isLive(at: date) }
    }

    func nextProgram(for streamId: Int, at date: Date = Date()) -> EPGProgram? {
        epg[streamId]?.first { $0.start >= date }
    }

    /// EPG complet (passé inclus) pour la fiche chaîne et le replay.
    func fullEPG(for streamId: Int) async throws -> [EPGProgram] {
        let full = try await client.fullEPG(streamId: streamId)
        if full.isEmpty { await loadEPG(for: streamId); return epg[streamId] ?? [] }
        return full
    }
}

/// Limite le nombre de tâches réseau simultanées.
actor AsyncLimiter {
    private let limit: Int
    private var running = 0
    private var waiters: [CheckedContinuation<Void, Never>] = []

    init(limit: Int) { self.limit = limit }

    func run<T: Sendable>(_ work: @Sendable () async -> T) async -> T {
        await acquire()
        defer { release() }
        return await work()
    }

    private func acquire() async {
        if running < limit { running += 1; return }
        await withCheckedContinuation { waiters.append($0) }
    }

    private func release() {
        if waiters.isEmpty { running -= 1 } else { waiters.removeFirst().resume() }
    }
}
