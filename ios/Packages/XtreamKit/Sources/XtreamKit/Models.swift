import Foundation

// MARK: - Authentification

public struct AuthResponse: Decodable, Sendable {
    public let userInfo: UserInfo
    public let serverInfo: ServerInfo?

    enum CodingKeys: String, CodingKey {
        case userInfo = "user_info"
        case serverInfo = "server_info"
    }
}

public struct UserInfo: Decodable, Sendable, Hashable {
    public let username: String
    public let isAuthenticated: Bool
    public let status: String?
    public let message: String?
    public let expirationDate: Date?
    public let createdAt: Date?
    public let isTrial: Bool
    public let activeConnections: Int?
    public let maxConnections: Int?
    public let allowedOutputFormats: [String]

    public var isActive: Bool { status?.lowercased() == "active" }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: AnyKey.self)
        username = c.string("username") ?? ""
        isAuthenticated = c.bool("auth")
        status = c.nonEmptyString("status")
        message = c.nonEmptyString("message")
        expirationDate = c.unixDate("exp_date")
        createdAt = c.unixDate("created_at")
        isTrial = c.bool("is_trial")
        activeConnections = c.int("active_cons")
        maxConnections = c.int("max_connections")
        allowedOutputFormats = c.stringArray("allowed_output_formats")
    }
}

public struct ServerInfo: Decodable, Sendable, Hashable {
    public let url: String?
    public let port: String?
    public let httpsPort: String?
    public let serverProtocol: String?
    public let timezone: String?
    public let timestampNow: Date?

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: AnyKey.self)
        url = c.nonEmptyString("url")
        port = c.nonEmptyString("port")
        httpsPort = c.nonEmptyString("https_port")
        serverProtocol = c.nonEmptyString("server_protocol")
        timezone = c.nonEmptyString("timezone")
        timestampNow = c.unixDate("timestamp_now")
    }
}

// MARK: - Catégories

public struct XtreamCategory: Decodable, Sendable, Hashable, Identifiable {
    public let id: String
    public let name: String
    public let parentId: String?

    public init(id: String, name: String, parentId: String? = nil) {
        self.id = id; self.name = name; self.parentId = parentId
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: AnyKey.self)
        id = c.string("category_id") ?? ""
        name = c.string("category_name") ?? "Sans nom"
        parentId = c.nonEmptyString("parent_id")
    }
}

// MARK: - Direct

public struct LiveStream: Decodable, Sendable, Hashable, Identifiable {
    public let id: Int
    public let number: Int?
    public let name: String
    public let icon: URL?
    public let epgChannelId: String?
    public let categoryId: String?
    public let hasArchive: Bool
    public let archiveDays: Int
    public let added: Date?

    public init(id: Int, number: Int? = nil, name: String, icon: URL? = nil, epgChannelId: String? = nil,
                categoryId: String? = nil, hasArchive: Bool = false, archiveDays: Int = 0, added: Date? = nil) {
        self.id = id; self.number = number; self.name = name; self.icon = icon
        self.epgChannelId = epgChannelId; self.categoryId = categoryId
        self.hasArchive = hasArchive; self.archiveDays = archiveDays; self.added = added
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: AnyKey.self)
        guard let id = c.int("stream_id") else {
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "stream_id manquant"))
        }
        self.id = id
        number = c.int("num")
        name = c.string("name")?.trimmingCharacters(in: .whitespaces) ?? "Chaîne \(id)"
        icon = c.url("stream_icon")
        epgChannelId = c.nonEmptyString("epg_channel_id")
        categoryId = c.string("category_id")
        archiveDays = c.int("tv_archive_duration") ?? 0
        hasArchive = c.bool("tv_archive") && archiveDays > 0
        added = c.unixDate("added")
    }
}

// MARK: - Films

public struct VODStream: Decodable, Sendable, Hashable, Identifiable {
    public let id: Int
    public let name: String
    public let icon: URL?
    public let categoryId: String?
    public let rating: Double?
    public let containerExtension: String
    public let added: Date?

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: AnyKey.self)
        guard let id = c.int("stream_id") else {
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "stream_id manquant"))
        }
        self.id = id
        name = c.string("name")?.trimmingCharacters(in: .whitespaces) ?? "Film \(id)"
        icon = c.url("stream_icon")
        categoryId = c.string("category_id")
        rating = c.double("rating").flatMap { $0 > 0 ? $0 : nil }
        containerExtension = c.nonEmptyString("container_extension") ?? "mp4"
        added = c.unixDate("added")
    }
}

public struct VODInfo: Sendable, Hashable {
    public let streamId: Int
    public let name: String?
    public let plot: String?
    public let cast: String?
    public let director: String?
    public let genre: String?
    public let releaseDate: String?
    public let durationSeconds: Int?
    public let rating: Double?
    public let poster: URL?
    public let backdrops: [URL]
    public let youtubeTrailer: String?
    public let containerExtension: String

    public var trailerURL: URL? {
        guard let id = youtubeTrailer, !id.isEmpty else { return nil }
        if id.hasPrefix("http") { return URL(string: id) }
        return URL(string: "https://www.youtube.com/watch?v=\(id)")
    }
}

extension VODInfo: Decodable {
    public init(from decoder: Decoder) throws {
        let root = try decoder.container(keyedBy: AnyKey.self)
        // "info" vaut parfois [] quand le panel n'a pas de métadonnées.
        let info = try? root.nestedContainer(keyedBy: AnyKey.self, forKey: AnyKey("info"))
        let data = try? root.nestedContainer(keyedBy: AnyKey.self, forKey: AnyKey("movie_data"))
        streamId = data?.int("stream_id") ?? 0
        name = data?.nonEmptyString("name") ?? info?.nonEmptyString("name")
        plot = info?.nonEmptyString("plot") ?? info?.nonEmptyString("description")
        cast = info?.nonEmptyString("cast") ?? info?.nonEmptyString("actors")
        director = info?.nonEmptyString("director")
        genre = info?.nonEmptyString("genre")
        releaseDate = info?.nonEmptyString("releasedate") ?? info?.nonEmptyString("release_date")
        durationSeconds = info?.int("duration_secs")
        rating = info?.double("rating").flatMap { $0 > 0 ? $0 : nil }
        poster = info?.url("movie_image") ?? info?.url("cover_big")
        backdrops = info?.urls("backdrop_path") ?? []
        youtubeTrailer = info?.nonEmptyString("youtube_trailer")
        containerExtension = data?.nonEmptyString("container_extension") ?? "mp4"
    }
}

// MARK: - Séries

public struct Series: Decodable, Sendable, Hashable, Identifiable {
    public let id: Int
    public let name: String
    public let cover: URL?
    public let plot: String?
    public let cast: String?
    public let director: String?
    public let genre: String?
    public let releaseDate: String?
    public let rating: Double?
    public let categoryId: String?
    public let backdrops: [URL]
    public let lastModified: Date?

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: AnyKey.self)
        guard let id = c.int("series_id") else {
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "series_id manquant"))
        }
        self.id = id
        name = c.string("name")?.trimmingCharacters(in: .whitespaces) ?? "Série \(id)"
        cover = c.url("cover")
        plot = c.nonEmptyString("plot")
        cast = c.nonEmptyString("cast")
        director = c.nonEmptyString("director")
        genre = c.nonEmptyString("genre")
        releaseDate = c.nonEmptyString("releaseDate") ?? c.nonEmptyString("release_date")
        rating = c.double("rating").flatMap { $0 > 0 ? $0 : nil }
        categoryId = c.string("category_id")
        backdrops = c.urls("backdrop_path")
        lastModified = c.unixDate("last_modified")
    }
}

public struct Season: Sendable, Hashable, Identifiable {
    public let number: Int
    public let name: String
    public let cover: URL?
    public var id: Int { number }
}

extension Season: Decodable {
    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: AnyKey.self)
        guard let n = c.int("season_number") else {
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "season_number manquant"))
        }
        number = n
        name = c.nonEmptyString("name") ?? "Saison \(n)"
        cover = c.url("cover_big") ?? c.url("cover")
    }
}

public struct Episode: Sendable, Hashable, Identifiable {
    public let id: String
    public let episodeNumber: Int
    public let season: Int
    public let title: String
    public let containerExtension: String
    public let plot: String?
    public let image: URL?
    public let durationSeconds: Int?
    public let rating: Double?
}

extension Episode: Decodable {
    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: AnyKey.self)
        guard let id = c.string("id") else {
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "id d'épisode manquant"))
        }
        self.id = id
        episodeNumber = c.int("episode_num") ?? 0
        season = c.int("season") ?? 0
        containerExtension = c.nonEmptyString("container_extension") ?? "mp4"
        let info = try? c.nestedContainer(keyedBy: AnyKey.self, forKey: AnyKey("info"))
        title = c.nonEmptyString("title") ?? "Épisode \(episodeNumber)"
        plot = info?.nonEmptyString("plot")
        image = info?.url("movie_image")
        durationSeconds = info?.int("duration_secs")
        rating = info?.double("rating").flatMap { $0 > 0 ? $0 : nil }
    }
}

public struct SeriesInfo: Sendable, Hashable {
    public let seasons: [Season]
    public let episodesBySeason: [Int: [Episode]]
    public let plot: String?
    public let cast: String?
    public let genre: String?
    public let releaseDate: String?
    public let cover: URL?
    public let backdrops: [URL]

    /// Saisons triées, en incluant celles qui ont des épisodes mais ne sont pas déclarées.
    public var sortedSeasonNumbers: [Int] {
        Set(episodesBySeason.keys).sorted()
    }

    public func seasonName(_ number: Int) -> String {
        if let s = seasons.first(where: { $0.number == number }), !s.name.isEmpty { return s.name }
        return "Saison \(number)"
    }
}

extension SeriesInfo: Decodable {
    public init(from decoder: Decoder) throws {
        let root = try decoder.container(keyedBy: AnyKey.self)

        let seasonList = (try? root.decode([Lossy<Season>].self, forKey: AnyKey("seasons"))) ?? []
        let seasons = seasonList.compactMap(\.value)
        self.seasons = seasons

        // "episodes" est soit un dictionnaire { "1": [...] }, soit un tableau de tableaux.
        var episodes: [Int: [Episode]] = [:]
        if let dict = try? root.decode([String: [Lossy<Episode>]].self, forKey: AnyKey("episodes")) {
            for (key, list) in dict {
                let eps = list.compactMap(\.value)
                let season = Int(key) ?? eps.first?.season ?? 0
                episodes[season, default: []].append(contentsOf: eps)
            }
        } else if let arr = try? root.decode([[Lossy<Episode>]].self, forKey: AnyKey("episodes")) {
            for list in arr {
                for ep in list.compactMap(\.value) { episodes[ep.season, default: []].append(ep) }
            }
        }
        self.episodesBySeason = episodes.mapValues { $0.sorted { $0.episodeNumber < $1.episodeNumber } }

        let info = try? root.nestedContainer(keyedBy: AnyKey.self, forKey: AnyKey("info"))
        plot = info?.nonEmptyString("plot")
        cast = info?.nonEmptyString("cast")
        genre = info?.nonEmptyString("genre")
        releaseDate = info?.nonEmptyString("releaseDate") ?? info?.nonEmptyString("release_date")
        cover = info?.url("cover")
        backdrops = info?.urls("backdrop_path") ?? []
    }
}

// MARK: - EPG

public struct EPGProgram: Sendable, Hashable, Identifiable {
    public let id: String
    public let title: String
    public let description: String?
    public let start: Date
    public let end: Date
    public let hasArchive: Bool

    public init(id: String, title: String, description: String? = nil, start: Date, end: Date, hasArchive: Bool = false) {
        self.id = id; self.title = title; self.description = description
        self.start = start; self.end = end; self.hasArchive = hasArchive
    }

    public var duration: TimeInterval { end.timeIntervalSince(start) }

    public func isLive(at date: Date = Date()) -> Bool { start <= date && date < end }

    public func progress(at date: Date = Date()) -> Double {
        guard duration > 0 else { return 0 }
        return min(max(date.timeIntervalSince(start) / duration, 0), 1)
    }
}

extension EPGProgram: Decodable {
    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: AnyKey.self)
        guard let start = c.unixDate("start_timestamp"),
              let end = c.unixDate("stop_timestamp") ?? c.unixDate("end_timestamp") else {
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "horaires EPG manquants"))
        }
        self.start = start
        self.end = end
        id = c.string("id") ?? "\(Int(start.timeIntervalSince1970))"
        title = (c.string("title") ?? "").base64DecodedOrSelf
        description = c.nonEmptyString("description")?.base64DecodedOrSelf
        hasArchive = c.bool("has_archive")
    }
}

struct EPGResponse: Decodable {
    let listings: [EPGProgram]

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: AnyKey.self)
        listings = ((try? c.decode([Lossy<EPGProgram>].self, forKey: AnyKey("epg_listings"))) ?? [])
            .compactMap(\.value)
            .sorted { $0.start < $1.start }
    }
}

// MARK: - Helpers de décodage

/// Ignore un élément invalide au lieu de faire échouer toute la liste.
struct Lossy<T: Decodable>: Decodable {
    let value: T?
    init(from decoder: Decoder) throws { value = try? T(from: decoder) }
}
