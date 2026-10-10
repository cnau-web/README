import Foundation
import Observation
import XtreamKit

struct Account: Codable, Identifiable, Hashable {
    var id = UUID()
    var name: String
    var server: String
    var username: String
}

@MainActor
@Observable
final class AppModel {
    enum Phase: Equatable { case launching, loggedOut, ready }

    private(set) var phase: Phase = .launching
    private(set) var accounts: [Account] = []
    private(set) var activeAccount: Account?
    private(set) var client: XtreamClient?
    private(set) var userInfo: UserInfo?
    private(set) var serverInfo: ServerInfo?
    private(set) var content: ContentStore?

    private let accountsKey = "accounts.v1"
    private let activeKey = "accounts.active"

    var serverTimeZone: TimeZone? {
        serverInfo?.timezone.flatMap(TimeZone.init(identifier:))
    }

    init() {
        if let data = UserDefaults.standard.data(forKey: accountsKey),
           let saved = try? JSONDecoder().decode([Account].self, from: data) {
            accounts = saved
        }
    }

    func restoreSession() async {
        guard phase == .launching else { return }
        let activeId = UserDefaults.standard.string(forKey: activeKey).flatMap(UUID.init(uuidString:))
        guard let account = accounts.first(where: { $0.id == activeId }) ?? accounts.first,
              let password = Keychain.password(for: account.id) else {
            phase = .loggedOut
            return
        }
        do {
            try await activate(account, password: password)
        } catch {
            // Pas de réseau au lancement : on ouvre quand même, les écrans afficheront l'erreur.
            if let creds = try? XtreamCredentials(server: account.server, username: account.username, password: password) {
                setActive(account, client: XtreamClient(credentials: creds), auth: nil)
            } else {
                phase = .loggedOut
            }
        }
    }

    /// Ajoute (ou met à jour) un compte après vérification auprès du serveur.
    func login(name: String, server: String, username: String, password: String) async throws {
        let creds = try XtreamCredentials(server: server, username: username, password: password)
        let client = XtreamClient(credentials: creds)
        let auth = try await client.authenticate()

        var account = accounts.first { $0.server == creds.serverURL.absoluteString && $0.username == creds.username }
            ?? Account(name: "", server: creds.serverURL.absoluteString, username: creds.username)
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        account.name = trimmed.isEmpty ? (creds.serverURL.host ?? "Ma playlist") : trimmed

        Keychain.setPassword(creds.password, for: account.id)
        if let i = accounts.firstIndex(where: { $0.id == account.id }) { accounts[i] = account } else { accounts.append(account) }
        saveAccounts()
        setActive(account, client: client, auth: auth)
    }

    func switchTo(_ account: Account) async throws {
        guard let password = Keychain.password(for: account.id) else { throw XtreamError.missingCredentials }
        try await activate(account, password: password)
    }

    func remove(_ account: Account) {
        Keychain.deletePassword(for: account.id)
        accounts.removeAll { $0.id == account.id }
        saveAccounts()
        LibraryStore.deleteData(accountId: account.id)
        if activeAccount?.id == account.id { logout() }
    }

    func logout() {
        activeAccount = nil
        client = nil
        content = nil
        userInfo = nil
        serverInfo = nil
        UserDefaults.standard.removeObject(forKey: activeKey)
        phase = .loggedOut
    }

    func refreshAccountInfo() async {
        guard let client, let auth = try? await client.authenticate() else { return }
        userInfo = auth.userInfo
        serverInfo = auth.serverInfo
    }

    private func activate(_ account: Account, password: String) async throws {
        let creds = try XtreamCredentials(server: account.server, username: account.username, password: password)
        let client = XtreamClient(credentials: creds)
        let auth = try await client.authenticate()
        setActive(account, client: client, auth: auth)
    }

    private func setActive(_ account: Account, client: XtreamClient, auth: AuthResponse?) {
        activeAccount = account
        self.client = client
        userInfo = auth?.userInfo
        serverInfo = auth?.serverInfo
        content = ContentStore(client: client)
        UserDefaults.standard.set(account.id.uuidString, forKey: activeKey)
        phase = .ready
    }

    private func saveAccounts() {
        if let data = try? JSONEncoder().encode(accounts) {
            UserDefaults.standard.set(data, forKey: accountsKey)
        }
    }
}
