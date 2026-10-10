import SwiftUI
import XtreamKit

struct SettingsView: View {
    @Environment(AppModel.self) private var app
    @Environment(LibraryStore.self) private var library

    @AppStorage("vodPlayer") private var vodPlayer = ExternalPlayer.builtIn.rawValue

    @State private var showAddAccount = false
    @State private var switchError: String?
    @State private var confirmLogout = false

    var body: some View {
        NavigationStack {
            Form {
                subscriptionSection
                accountsSection
                playbackSection
                dataSection
                aboutSection
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle("Réglages")
            .refreshable { await app.refreshAccountInfo() }
            .sheet(isPresented: $showAddAccount) {
                NavigationStack { LoginView(isAddingAccount: true) }
            }
            .alert("Connexion impossible", isPresented: Binding(get: { switchError != nil }, set: { if !$0 { switchError = nil } })) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(switchError ?? "")
            }
        }
    }

    private var subscriptionSection: some View {
        Section("Abonnement") {
            if let account = app.activeAccount {
                LabeledContent("Playlist", value: account.name)
                LabeledContent("Utilisateur", value: account.username)
                LabeledContent("Serveur", value: account.server)
            }
            if let info = app.userInfo {
                LabeledContent("Statut") {
                    Text(info.status ?? "—").foregroundStyle(info.isActive ? .green : .orange)
                }
                LabeledContent("Expiration",
                               value: info.expirationDate?.formatted(date: .long, time: .omitted) ?? "Illimité")
                if let max = info.maxConnections {
                    LabeledContent("Connexions", value: "\(info.activeConnections ?? 0) / \(max)")
                }
                if info.isTrial { LabeledContent("Type", value: "Essai") }
            } else {
                Button("Actualiser les informations") { Task { await app.refreshAccountInfo() } }
            }
        }
    }

    private var accountsSection: some View {
        Section {
            ForEach(app.accounts) { account in
                Button {
                    guard account.id != app.activeAccount?.id else { return }
                    Task {
                        do { try await app.switchTo(account) } catch { switchError = error.localizedDescription }
                    }
                } label: {
                    HStack {
                        VStack(alignment: .leading) {
                            Text(account.name).foregroundStyle(.primary)
                            Text(account.username).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        if account.id == app.activeAccount?.id {
                            Image(systemName: "checkmark").foregroundStyle(Theme.accent)
                        }
                    }
                }
                .swipeActions {
                    Button(role: .destructive) { app.remove(account) } label: { Label("Supprimer", systemImage: "trash") }
                }
            }
            Button { showAddAccount = true } label: { Label("Ajouter une playlist", systemImage: "plus") }
            Button("Se déconnecter", role: .destructive) { confirmLogout = true }
                .confirmationDialog("Se déconnecter ?", isPresented: $confirmLogout) {
                    Button("Se déconnecter", role: .destructive) { app.logout() }
                } message: {
                    Text("Le compte reste enregistré et pourra être rouvert depuis l'écran de connexion.")
                }
        } header: {
            Text("Playlists")
        } footer: {
            Text("Balayez vers la gauche pour supprimer une playlist.")
        }
    }

    private var playbackSection: some View {
        Section {
            Picker("Films et séries", selection: $vodPlayer) {
                ForEach(ExternalPlayer.allCases) { Text($0.label).tag($0.rawValue) }
            }
        } header: {
            Text("Lecture")
        } footer: {
            Text("Le lecteur iOS lit le HLS, le MP4 et le MOV. Pour les fichiers MKV/AVI, choisissez VLC ou Infuse (à installer depuis l'App Store). Le direct et le replay utilisent toujours le flux HLS.")
        }
    }

    private var dataSection: some View {
        Section("Données") {
            Button("Actualiser chaînes et catalogue") {
                Task {
                    await app.content?.loadLive(force: true)
                    await app.content?.loadVODCategories(force: true)
                    await app.content?.loadSeriesCategories(force: true)
                }
            }
            Button("Effacer l'historique des chaînes", role: .destructive) { library.clearRecents() }
            Button("Vider le cache des images", role: .destructive) { URLCache.shared.removeAllCachedResponses() }
        }
    }

    private var aboutSection: some View {
        Section {
            LabeledContent("Version", value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")
        } footer: {
            Text("OndeTV est un lecteur : il ne fournit aucun contenu. Utilisez uniquement des abonnements IPTV légaux.")
        }
    }
}
