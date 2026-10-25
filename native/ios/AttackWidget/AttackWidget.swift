import WidgetKit
import SwiftUI

// Reads the JSON snapshot the app writes to the App Group (see plugins/widget-bridge). All strings arrive pre-localised.
// Tapping any family opens the app through the deep link: migrano://episode/new starts an attack immediately.
struct Data: Decodable { let cta: String; let open: Bool; let line1: String; let line2: String; let url: String; let updatedAt: String }
struct Entry: TimelineEntry { let date: Date; let data: Data? }

struct Provider: TimelineProvider {
    static let group = "group.com.ilumie.migrano"
    func load() -> Data? {
        guard let s = UserDefaults(suiteName: Provider.group)?.string(forKey: "widgetData"), let d = s.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(Data.self, from: d)
    }
    func placeholder(in context: Context) -> Entry { Entry(date: Date(), data: Data(cta: "Attack now", open: false, line1: "12 days without an attack", line2: "2 attack days · 1 medication day", url: "migrano://episode/new", updatedAt: "")) }
    func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) { completion(Entry(date: Date(), data: load() ?? placeholder(in: context).data)) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        let next = Calendar.current.date(byAdding: .hour, value: 6, to: Date())!
        completion(Timeline(entries: [Entry(date: Date(), data: load())], policy: .after(next)))
    }
}

let coral = Color(red: 0.91, green: 0.34, blue: 0.25)
let coralDark = Color(red: 0.84, green: 0.24, blue: 0.24)
let plum = Color(red: 0.17, green: 0.11, blue: 0.23)

struct Star: Shape {
    func path(in r: CGRect) -> Path {
        let pts: [(CGFloat, CGFloat)] = [(0,-190),(40,-60),(170,-95),(70,0),(170,95),(40,60),(0,190),(-40,60),(-170,95),(-70,0),(-170,-95),(-40,-60)]
        var p = Path(); let s = min(r.width, r.height) / 380; let c = CGPoint(x: r.midX, y: r.midY)
        for (i, pt) in pts.enumerated() { let q = CGPoint(x: c.x + pt.0 * s, y: c.y + pt.1 * s); if i == 0 { p.move(to: q) } else { p.addLine(to: q) } }
        p.closeSubpath(); return p
    }
}

struct StarMark: View {
    var size: CGFloat
    var body: some View { ZStack { Star().fill(Color(red: 1, green: 0.96, blue: 0.93)).frame(width: size, height: size); Circle().fill(coralDark).frame(width: size * 0.27, height: size * 0.27) } }
}

struct SmallView: View {
    let data: Data?
    var body: some View {
        ZStack {
            ContainerRelativeShape().fill(LinearGradient(colors: data?.open == true ? [plum, plum] : [Color(red: 1, green: 0.48, blue: 0.35), coralDark], startPoint: .topLeading, endPoint: .bottomTrailing))
            VStack(spacing: 8) {
                StarMark(size: 54)
                Text(data?.cta ?? "Attack now").font(.system(.headline, design: .serif)).foregroundColor(.white).multilineTextAlignment(.center).lineLimit(2)
            }.padding(12)
        }
    }
}

struct MediumView: View {
    let data: Data?
    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 22).fill(LinearGradient(colors: data?.open == true ? [plum, plum] : [Color(red: 1, green: 0.48, blue: 0.35), coralDark], startPoint: .topLeading, endPoint: .bottomTrailing))
                VStack(spacing: 6) { StarMark(size: 44); Text(data?.cta ?? "Attack now").font(.system(.subheadline, design: .serif).weight(.medium)).foregroundColor(.white).multilineTextAlignment(.center).lineLimit(2) }.padding(8)
            }.frame(width: 120)
            VStack(alignment: .leading, spacing: 6) {
                Text("Migrano").font(.system(.headline, design: .serif))
                Text(data?.line1 ?? "").font(.footnote.weight(.semibold)).lineLimit(2)
                Text(data?.line2 ?? "").font(.caption).foregroundColor(.secondary).lineLimit(2)
                Spacer(minLength: 0)
            }
            Spacer(minLength: 0)
        }.padding(14)
    }
}

struct LockRectView: View {
    let data: Data?
    var body: some View {
        HStack(spacing: 8) {
            StarMark(size: 28)
            VStack(alignment: .leading, spacing: 1) {
                Text(data?.cta ?? "Attack now").font(.headline).lineLimit(1)
                Text(data?.line1 ?? "").font(.caption2).foregroundColor(.secondary).lineLimit(1)
            }
        }
    }
}

struct LockCircleView: View {
    var body: some View { ZStack { AccessoryWidgetBackground(); StarMark(size: 30) } }
}

struct AttackEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: Entry
    var body: some View {
        switch family {
        case .systemSmall: SmallView(data: entry.data)
        case .accessoryRectangular: LockRectView(data: entry.data)
        case .accessoryCircular: LockCircleView()
        default: MediumView(data: entry.data)
        }
    }
}

@main
struct AttackWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "AttackWidget", provider: Provider()) { entry in
            let view = AttackEntryView(entry: entry).widgetURL(URL(string: entry.data?.url ?? "migrano://episode/new"))
            if #available(iOS 17.0, *) { view.containerBackground(.background, for: .widget) } else { view }
        }
        .configurationDisplayName("Migrano")
        .description("Log an attack with one tap.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryCircular])
        .contentMarginsDisabled()
    }
}
