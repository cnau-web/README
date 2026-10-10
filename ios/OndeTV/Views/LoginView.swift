import SwiftUI

struct LoginView: View {
    @Environment(AppModel.self) private var app
    @Environment(\.dismiss) private var dismiss

    /// true quand l'écran est présenté depuis les réglages pour ajouter un compte.
    var isAddingAccount = false

    @State private var name = ""
    @State private var server = ""
    @State private var username = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var isLoading = false
    @State private var errorMessage: String?

    private enum Field { case name, server, username, password }
    @FocusState private var focus: Field?

    var body: some View {
        ZStack {
            LinearGradient(colors: [Theme.background, Color(red: 0.06, green: 0.10, blue: 0.20)],
                           startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 28) {
                    header
                    form
                    if !app.accounts.isEmpty && !isAddingAccount { savedAccounts }
                }
                .frame(maxWidth: 460)
                .padding(24)
                .frame(maxWidth: .infinity)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .toolbar {
            if isAddingAccount {
                ToolbarItem(placement: .cancellationAction) { Button("Annuler") { dismiss() } }
            }
        }
    }

    private var header: some View {
        VStack(spacing: 10) {
            Image(systemName: "dot.radiowaves.left.and.right")
                .font(.system(size: 54, weight: .semibold))
                .foregroundStyle(Theme.accent.gradient)
            Text("OndeTV").font(.largeTitle.bold())
            Text("Connectez votre abonnement Xtream Codes")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(.top, 40)
    }

    private var form: some View {
        VStack(spacing: 14) {
            field("Nom de la playlist (facultatif)", text: $name, icon: "tag", field: .name)
                .textInputAutocapitalization(.words)
            field("http://serveur.com:8080", text: $server, icon: "server.rack", field: .server)
                .keyboardType(.URL)
            field("Nom d'utilisateur", text: $username, icon: "person", field: .username)

            HStack {
                Image(systemName: "lock").frame(width: 24).foregroundStyle(.secondary)
                Group {
                    if showPassword {
                        TextField("Mot de passe", text: $password)
                    } else {
                        SecureField("Mot de passe", text: $password)
                    }
                }
                .focused($focus, equals: .password)
                .submitLabel(.go)
                .onSubmit(submit)
                Button { showPassword.toggle() } label: {
                    Image(systemName: showPassword ? "eye.slash" : "eye").foregroundStyle(.secondary)
                }
            }
            .modifier(FieldStyle())

            if let errorMessage {
                Label(errorMessage, systemImage: "exclamationmark.triangle.fill")
                    .font(.footnote)
                    .foregroundStyle(Theme.live)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            Button(action: submit) {
                ZStack {
                    if isLoading { ProgressView().tint(.white) } else { Text("Se connecter").bold() }
                }
                .frame(maxWidth: .infinity, minHeight: 50)
            }
            .buttonStyle(.borderedProminent)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .disabled(isLoading || server.isEmpty || username.isEmpty || password.isEmpty)
        }
        .textInputAutocapitalization(.never)
        .autocorrectionDisabled()
    }

    private var savedAccounts: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Comptes enregistrés").font(.headline)
            ForEach(app.accounts) { account in
                Button {
                    Task { await connect(account) }
                } label: {
                    HStack {
                        Image(systemName: "person.crop.circle")
                        VStack(alignment: .leading) {
                            Text(account.name).bold()
                            Text(account.username).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right").foregroundStyle(.tertiary)
                    }
                    .modifier(FieldStyle())
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func field(_ placeholder: String, text: Binding<String>, icon: String, field: Field) -> some View {
        HStack {
            Image(systemName: icon).frame(width: 24).foregroundStyle(.secondary)
            TextField(placeholder, text: text)
                .focused($focus, equals: field)
                .submitLabel(.next)
                .onSubmit { focusNext(after: field) }
        }
        .modifier(FieldStyle())
    }

    private func focusNext(after field: Field) {
        switch field {
        case .name: focus = .server
        case .server: focus = .username
        case .username: focus = .password
        case .password: submit()
        }
    }

    private func submit() {
        guard !isLoading, !server.isEmpty, !username.isEmpty, !password.isEmpty else { return }
        focus = nil
        isLoading = true
        errorMessage = nil
        Task {
            defer { isLoading = false }
            do {
                try await app.login(name: name, server: server, username: username, password: password)
                if isAddingAccount { dismiss() }
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func connect(_ account: Account) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            try await app.switchTo(account)
        } catch {
            errorMessage = error.localizedDescription
            server = account.server
            username = account.username
            name = account.name
        }
    }
}

private struct FieldStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(.horizontal, 14)
            .frame(minHeight: 50)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.08)))
    }
}
