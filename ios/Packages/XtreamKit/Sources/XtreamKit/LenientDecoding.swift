import Foundation

// Les panels Xtream renvoient les mêmes champs tantôt en nombre, tantôt en chaîne,
// tantôt en tableau vide. Ces helpers décodent de façon tolérante.

struct AnyKey: CodingKey {
    var stringValue: String
    var intValue: Int?
    init(_ string: String) { self.stringValue = string; self.intValue = nil }
    init?(stringValue: String) { self.init(stringValue) }
    init?(intValue: Int) { self.stringValue = String(intValue); self.intValue = intValue }
}

extension KeyedDecodingContainer where Key == AnyKey {
    func string(_ key: String) -> String? {
        let k = AnyKey(key)
        if let v = try? decodeIfPresent(String.self, forKey: k) { return v }
        if let v = try? decodeIfPresent(Int.self, forKey: k) { return String(v) }
        if let v = try? decodeIfPresent(Double.self, forKey: k) { return String(v) }
        if let v = try? decodeIfPresent(Bool.self, forKey: k) { return v ? "1" : "0" }
        return nil
    }

    func nonEmptyString(_ key: String) -> String? {
        guard let v = string(key)?.trimmingCharacters(in: .whitespacesAndNewlines), !v.isEmpty else { return nil }
        return v
    }

    func int(_ key: String) -> Int? {
        let k = AnyKey(key)
        if let v = try? decodeIfPresent(Int.self, forKey: k) { return v }
        if let v = try? decodeIfPresent(Double.self, forKey: k) { return Int(v) }
        if let s = try? decodeIfPresent(String.self, forKey: k) {
            let t = s.trimmingCharacters(in: .whitespaces)
            if let v = Int(t) { return v }
            if let d = Double(t) { return Int(d) }
        }
        return nil
    }

    func double(_ key: String) -> Double? {
        let k = AnyKey(key)
        if let v = try? decodeIfPresent(Double.self, forKey: k) { return v }
        if let s = try? decodeIfPresent(String.self, forKey: k) {
            return Double(s.trimmingCharacters(in: .whitespaces).replacingOccurrences(of: ",", with: "."))
        }
        return nil
    }

    func bool(_ key: String) -> Bool {
        let k = AnyKey(key)
        if let v = try? decodeIfPresent(Bool.self, forKey: k) { return v }
        if let v = int(key) { return v != 0 }
        if let s = try? decodeIfPresent(String.self, forKey: k) { return ["true", "yes"].contains(s.lowercased()) }
        return false
    }

    /// Timestamp Unix (secondes) envoyé en nombre ou en chaîne.
    func unixDate(_ key: String) -> Date? {
        guard let t = double(key), t > 0 else { return nil }
        return Date(timeIntervalSince1970: t)
    }

    func url(_ key: String) -> URL? {
        URL(lenient: string(key))
    }

    /// Champ pouvant être une chaîne ou un tableau de chaînes (ex. backdrop_path).
    func urls(_ key: String) -> [URL] {
        let k = AnyKey(key)
        if let arr = try? decodeIfPresent([String].self, forKey: k) { return arr.compactMap { URL(lenient: $0) } }
        if let u = url(key) { return [u] }
        return []
    }

    func stringArray(_ key: String) -> [String] {
        (try? decodeIfPresent([String].self, forKey: AnyKey(key))) ?? []
    }
}

extension URL {
    /// Construit une URL à partir d'une chaîne potentiellement sale (espaces, vide…).
    init?(lenient raw: String?) {
        guard let raw = raw?.trimmingCharacters(in: .whitespacesAndNewlines), !raw.isEmpty,
              raw.lowercased().hasPrefix("http") else { return nil }
        if let u = URL(string: raw) { self = u; return }
        guard let escaped = raw.addingPercentEncoding(withAllowedCharacters: .urlFragmentAllowed),
              let u = URL(string: escaped) else { return nil }
        self = u
    }
}

extension String {
    /// Les titres/descriptions EPG Xtream sont encodés en base64.
    var base64DecodedOrSelf: String {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        var padded = trimmed
        let rem = padded.count % 4
        if rem > 0 { padded += String(repeating: "=", count: 4 - rem) }
        if let data = Data(base64Encoded: padded), let s = String(data: data, encoding: .utf8), !s.isEmpty {
            return s
        }
        return self
    }
}
