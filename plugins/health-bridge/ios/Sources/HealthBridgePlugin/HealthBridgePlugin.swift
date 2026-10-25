import Foundation
import Capacitor
import HealthKit

/// Write-only bridge to Apple Health. The app mirrors closed attacks as headache category samples so the
/// user's Health timeline (and anything they share from it) carries the diary. Nothing is ever read back.
@objc(HealthBridgePlugin)
public class HealthBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HealthBridgePlugin"
    public let jsName = "HealthBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeHeadache", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteSample", returnType: CAPPluginReturnPromise)
    ]

    private let store = HKHealthStore()
    private var headacheType: HKCategoryType? { HKObjectType.categoryType(forIdentifier: .headache) }
    private let iso: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]; return f
    }()
    private let isoPlain: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime]; return f
    }()
    private func date(_ s: String?) -> Date? { guard let s = s else { return nil }; return iso.date(from: s) ?? isoPlain.date(from: s) }

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": HKHealthStore.isHealthDataAvailable() && headacheType != nil])
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable(), let type = headacheType else { call.resolve(["granted": false]); return }
        store.requestAuthorization(toShare: [type], read: []) { [weak self] ok, _ in
            let status = self?.store.authorizationStatus(for: type) ?? .notDetermined
            call.resolve(["granted": ok && status == .sharingAuthorized])
        }
    }

    @objc func writeHeadache(_ call: CAPPluginCall) {
        guard let type = headacheType, let start = date(call.getString("start")), let end = date(call.getString("end")), end >= start else {
            call.reject("bad dates"); return
        }
        let sev = call.getInt("severity") ?? 0
        let value: HKCategoryValueSeverity = sev >= 4 ? .severe : sev == 3 ? .moderate : sev == 2 ? .mild : .unspecified
        let sample = HKCategorySample(type: type, value: value.rawValue, start: start, end: end)
        let finish: () -> Void = { [weak self] in
            self?.store.save(sample) { ok, err in
                if ok { call.resolve(["uuid": sample.uuid.uuidString]) } else { call.reject(err?.localizedDescription ?? "save failed") }
            }
        }
        if let old = call.getString("replaceUuid"), let uuid = UUID(uuidString: old) {
            deleteByUuid(uuid) { _ in finish() }
        } else { finish() }
    }

    @objc func deleteSample(_ call: CAPPluginCall) {
        guard let uuid = UUID(uuidString: call.getString("uuid") ?? "") else { call.resolve(); return }
        deleteByUuid(uuid) { _ in call.resolve() }
    }

    private func deleteByUuid(_ uuid: UUID, _ done: @escaping (Bool) -> Void) {
        guard let type = headacheType else { done(false); return }
        let pred = HKQuery.predicateForObject(with: uuid)
        let qy = HKSampleQuery(sampleType: type, predicate: pred, limit: 1, sortDescriptors: nil) { [weak self] _, results, _ in
            guard let s = results?.first else { done(false); return }
            self?.store.delete(s) { ok, _ in done(ok) }
        }
        store.execute(qy)
    }
}
