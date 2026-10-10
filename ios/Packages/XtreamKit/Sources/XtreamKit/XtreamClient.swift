import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct XtreamCredentials: Sendable, Hashable, Codable {
    public let serverURL: URL
    public let username: String
    public let password: String

    /// Accepte "monserveur.com:8080", "http://monserveur.com:8080/", "…/player_api.php", etc.
    public init(server: String, username: String, password: String) throws {
        var raw = server.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !raw.isEmpty else { throw XtreamError.invalidServerURL }
        if !raw.lowercased().hasPrefix("http://") && !raw.lowercased().hasPrefix("https://") {
            raw = "http://" + raw
        }
        guard var comps = URLComponents(string: raw), let host = comps.host, !host.isEmpty else {
            throw XtreamError.invalidServerURL
        }
        comps.query = nil
        comps.fragment = nil
        var path = comps.path
        for suffix in ["/player_api.php", "/get.php", "/xmltv.php"] where path.hasSuffix(suffix) {
            path.removeLast(suffix.count)
        }
        while path.hasSuffix("/") { path.removeLast() }
        comps.path = path
        guard let url = comps.url else { throw XtreamError.invalidServerURL }
        self.serverURL = url
        self.username = username.trimmingCharacters(in: .whitespacesAndNewlines)
        self.password = password.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !self.username.isEmpty, !self.password.isEmpty else { throw XtreamError.missingCredentials }
    }
}

public enum XtreamError: LocalizedError, Equatable {
    case invalidServerURL
    case missingCredentials
    case http(Int)
    case authenticationFailed(String?)
    case accountInactive(String)
    case invalidResponse
    case network(String)

    public var errorDescription: String? {
        switch self {
        case .invalidServerURL: return "L'adresse du serveur est invalide."
        case .missingCredentials: return "Nom d'utilisateur et mot de passe requis."
        case .http(let code): return "Le serveur a répondu avec une erreur HTTP \(code)."
        case .authenticationFailed(let msg): return msg ?? "Identifiants refusés par le serveur."
        case .accountInactive(let status): return "Abonnement non actif (statut : \(status))."
        case .invalidResponse: return "Réponse du serveur illisible. Vérifiez l'adresse (http/https et port)."
        case .network(let msg): return "Erreur réseau : \(msg)"
        }
    }
}

public enum LiveOutputFormat: String, Sendable, Codable, CaseIterable {
    case hls = "m3u8"
    case ts = "ts"
}

public struct XtreamClient: Sendable {
    public let credentials: XtreamCredentials
    public var userAgent: String
    private let session: URLSession

    public init(credentials: XtreamCredentials, userAgent: String = "OndeTV/1.0", session: URLSession = .shared) {
        self.credentials = credentials
        self.userAgent = userAgent
        self.session = session
    }

    // MARK: API

    public func authenticate() async throws -> AuthResponse {
        let auth: AuthResponse
        do {
            auth = try await request(AuthResponse.self, action: nil)
        } catch XtreamError.invalidResponse {
            // Certains panels renvoient [] ou une page HTML quand les identifiants sont faux.
            throw XtreamError.authenticationFailed(nil)
        }
        guard auth.userInfo.isAuthenticated else {
            throw XtreamError.authenticationFailed(auth.userInfo.message)
        }
        if let status = auth.userInfo.status, !auth.userInfo.isActive {
            throw XtreamError.accountInactive(status)
        }
        return auth
    }

    public func liveCategories() async throws -> [XtreamCategory] {
        try await list(XtreamCategory.self, action: "get_live_categories")
    }

    public func liveStreams(categoryId: String? = nil) async throws -> [LiveStream] {
        try await list(LiveStream.self, action: "get_live_streams", params: categoryParam(categoryId))
    }

    public func vodCategories() async throws -> [XtreamCategory] {
        try await list(XtreamCategory.self, action: "get_vod_categories")
    }

    public func vodStreams(categoryId: String? = nil) async throws -> [VODStream] {
        try await list(VODStream.self, action: "get_vod_streams", params: categoryParam(categoryId))
    }

    public func vodInfo(id: Int) async throws -> VODInfo {
        try await request(VODInfo.self, action: "get_vod_info", params: ["vod_id": String(id)])
    }

    public func seriesCategories() async throws -> [XtreamCategory] {
        try await list(XtreamCategory.self, action: "get_series_categories")
    }

    public func series(categoryId: String? = nil) async throws -> [Series] {
        try await list(Series.self, action: "get_series", params: categoryParam(categoryId))
    }

    public func seriesInfo(id: Int) async throws -> SeriesInfo {
        try await request(SeriesInfo.self, action: "get_series_info", params: ["series_id": String(id)])
    }

    /// Programmes à venir (dont le programme en cours) d'une chaîne.
    public func shortEPG(streamId: Int, limit: Int = 10) async throws -> [EPGProgram] {
        try await request(EPGResponse.self, action: "get_short_epg",
                          params: ["stream_id": String(streamId), "limit": String(limit)]).listings
    }

    /// EPG complet disponible (passé + futur) avec l'indicateur de replay.
    public func fullEPG(streamId: Int) async throws -> [EPGProgram] {
        try await request(EPGResponse.self, action: "get_simple_data_table",
                          params: ["stream_id": String(streamId)]).listings
    }

    // MARK: URLs de lecture

    private var base: String { credentials.serverURL.absoluteString }
    private var userPath: String { "\(escape(credentials.username))/\(escape(credentials.password))" }

    public func liveURL(_ stream: LiveStream, format: LiveOutputFormat = .hls) -> URL {
        URL(string: "\(base)/live/\(userPath)/\(stream.id).\(format.rawValue)")!
    }

    public func movieURL(id: Int, containerExtension: String) -> URL {
        URL(string: "\(base)/movie/\(userPath)/\(id).\(containerExtension)")!
    }

    public func episodeURL(_ episode: Episode) -> URL {
        URL(string: "\(base)/series/\(userPath)/\(episode.id).\(episode.containerExtension)")!
    }

    /// URL de replay (catch-up). `timeZone` = fuseau horaire du serveur (server_info.timezone).
    public func catchupURL(stream: LiveStream, program: EPGProgram, timeZone: TimeZone?,
                           format: LiveOutputFormat = .hls) -> URL {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = timeZone ?? .current
        formatter.dateFormat = "yyyy-MM-dd:HH-mm"
        let start = formatter.string(from: program.start)
        let minutes = max(1, Int((program.duration / 60).rounded(.up)))
        return URL(string: "\(base)/timeshift/\(userPath)/\(minutes)/\(start)/\(stream.id).\(format.rawValue)")!
    }

    // MARK: Réseau

    private func categoryParam(_ id: String?) -> [String: String] {
        guard let id, !id.isEmpty else { return [:] }
        return ["category_id": id]
    }

    func apiURL(action: String?, params: [String: String] = [:]) -> URL {
        var comps = URLComponents(url: credentials.serverURL.appendingPathComponent("player_api.php"),
                                  resolvingAgainstBaseURL: false)!
        var items = [URLQueryItem(name: "username", value: credentials.username),
                     URLQueryItem(name: "password", value: credentials.password)]
        if let action { items.append(URLQueryItem(name: "action", value: action)) }
        items += params.sorted { $0.key < $1.key }.map { URLQueryItem(name: $0.key, value: $0.value) }
        comps.queryItems = items
        return comps.url!
    }

    private func data(action: String?, params: [String: String]) async throws -> Data {
        var req = URLRequest(url: apiURL(action: action, params: params))
        req.setValue(userAgent, forHTTPHeaderField: "User-Agent")
        req.timeoutInterval = 30
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: req)
        } catch is CancellationError {
            throw CancellationError()
        } catch let error as URLError where error.code == .cancelled {
            throw CancellationError()
        } catch {
            throw XtreamError.network(error.localizedDescription)
        }
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            if http.statusCode == 401 || http.statusCode == 403 { throw XtreamError.authenticationFailed(nil) }
            throw XtreamError.http(http.statusCode)
        }
        return data
    }

    private func request<T: Decodable>(_ type: T.Type, action: String?, params: [String: String] = [:]) async throws -> T {
        let data = try await data(action: action, params: params)
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw XtreamError.invalidResponse
        }
    }

    /// Les listes vides peuvent arriver sous forme de `{}` ou `null` : on renvoie [].
    private func list<T: Decodable>(_ type: T.Type, action: String, params: [String: String] = [:]) async throws -> [T] {
        let data = try await data(action: action, params: params)
        return try XtreamClient.decodeList(T.self, from: data)
    }

    static func decodeList<T: Decodable>(_ type: T.Type, from data: Data) throws -> [T] {
        let decoder = JSONDecoder()
        if let items = try? decoder.decode([Lossy<T>].self, from: data) {
            return items.compactMap(\.value)
        }
        if let dict = try? decoder.decode([String: Lossy<T>].self, from: data) {
            return dict.values.compactMap(\.value)
        }
        let trimmed = String(decoding: data.prefix(16), as: UTF8.self).trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty || trimmed == "null" || trimmed == "{}" || trimmed == "[]" { return [] }
        throw XtreamError.invalidResponse
    }

    private func escape(_ s: String) -> String {
        s.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed.subtracting(CharacterSet(charactersIn: "/"))) ?? s
    }
}
