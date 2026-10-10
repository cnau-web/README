import SwiftUI
import XtreamKit

struct ChannelLogo: View {
    let stream: LiveStream
    var size: CGFloat = 44

    var body: some View {
        RemoteImage(url: stream.icon) {
            Text(initials)
                .font(.system(size: size * 0.32, weight: .bold))
                .foregroundStyle(.secondary)
        }
        .frame(width: size * 1.4, height: size)
        .padding(4)
        .background(Theme.surfaceHighlight, in: RoundedRectangle(cornerRadius: 8))
    }

    private var initials: String {
        stream.name.split(separator: " ").prefix(2).compactMap(\.first).map(String.init).joined().uppercased()
    }
}

struct PosterCard: View {
    let title: String
    let image: URL?
    var rating: Double?
    var progress: Double?

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            RemoteImage(url: image, contentMode: .fill) {
                ZStack {
                    Theme.surfaceHighlight
                    Image(systemName: "film").font(.largeTitle).foregroundStyle(.tertiary)
                }
            }
            .frame(minWidth: 0, maxWidth: .infinity)
            .aspectRatio(2 / 3, contentMode: .fit)
            .clipped()
            .overlay(alignment: .topTrailing) {
                if let rating {
                    Label(String(format: "%.1f", rating), systemImage: "star.fill")
                        .font(.caption2.bold())
                        .padding(.horizontal, 6).padding(.vertical, 3)
                        .background(.ultraThinMaterial, in: Capsule())
                        .padding(6)
                }
            }
            .overlay(alignment: .bottom) {
                if let progress, progress > 0 {
                    ProgressBar(value: progress).frame(height: 3)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 10))

            Text(title)
                .font(.caption)
                .lineLimit(2)
                .foregroundStyle(.primary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct ProgressBar: View {
    let value: Double
    var color: Color = Theme.accent

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.white.opacity(0.15))
                Capsule().fill(color).frame(width: geo.size.width * min(max(value, 0), 1))
            }
        }
    }
}

struct LoadFailedView: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        ContentUnavailableView {
            Label("Chargement impossible", systemImage: "wifi.exclamationmark")
        } description: {
            Text(message)
        } actions: {
            Button("Réessayer", action: retry).buttonStyle(.borderedProminent)
        }
    }
}

struct CategoryChips: View {
    let categories: [XtreamCategory]
    @Binding var selection: String

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(categories) { cat in
                        Button {
                            selection = cat.id
                        } label: {
                            Text(cat.name)
                                .font(.subheadline.weight(.medium))
                                .padding(.horizontal, 14).padding(.vertical, 8)
                                .background(selection == cat.id ? Theme.accent : Theme.surface, in: Capsule())
                                .foregroundStyle(selection == cat.id ? .white : .primary)
                        }
                        .buttonStyle(.plain)
                        .id(cat.id)
                    }
                }
                .padding(.horizontal)
            }
            .onAppear { proxy.scrollTo(selection, anchor: .center) }
        }
    }
}

extension Date {
    var hourMinute: String { formatted(.dateTime.hour().minute()) }
}

extension Int {
    /// 5400 → "1 h 30 min"
    var durationText: String {
        let h = self / 3600, m = (self % 3600) / 60
        if h > 0 { return m > 0 ? "\(h) h \(m) min" : "\(h) h" }
        return "\(m) min"
    }
}

extension XtreamCategory {
    static let all = XtreamCategory(id: ContentStore.allCategoryId, name: "Tout")
}
