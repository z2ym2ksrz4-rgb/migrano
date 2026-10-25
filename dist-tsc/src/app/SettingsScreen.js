import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/core/settings";
import { SUPPORTED } from "@/core/i18n";
import i18n from "@/core/i18n";
import { exportBackup, importBackup } from "@/core/backup";
import { wipeAllData } from "@/core/db";
import { Sheet, sha256, fmtDate } from "@/core/ui";
import { appVersion } from "@/core/release";
import appConfig from "../../app.config.json";
import { usePurchases, usePaywall, useProGate } from "@/core/purchases";
import { useUi } from "@/domain/migrano/store";
import { diaryConfig } from "@/core/diary";
import { InfoSheets } from "@/domain/migrano/screens/InfoSheets";
import { searchPlaces } from "@/core/diary";
import { maybeRefreshWeather } from "@/domain/migrano/weather";
import { healthAvailable, requestHealthAccess, syncHealth, resetHealthSync } from "@/domain/migrano/health";
export function SettingsScreen() {
    const { t, i18n: i } = useTranslation();
    const s = useSettings();
    const isPro = usePurchases((p) => p.isPro);
    const sub = usePurchases((p) => p.sub);
    const restore = usePurchases((p) => p.restore);
    const manage = usePurchases((p) => p.manage);
    const showPaywall = usePaywall((p) => p.show);
    const gate = useProGate();
    const setMedsOpen = useUi((u) => u.setMedsOpen);
    const openInfo = useUi((u) => u.openInfo);
    const [pinOpen, setPinOpen] = useState(false);
    const [pin1, setPin1] = useState("");
    const [pin2, setPin2] = useState("");
    const [importOpen, setImportOpen] = useState(false);
    const [planOpen, setPlanOpen] = useState(false);
    const [importText, setImportText] = useState("");
    const [importPass, setImportPass] = useState("");
    const [name, setName] = useState(s.userName ?? "");
    const [placeOpen, setPlaceOpen] = useState(false);
    const [placeQ, setPlaceQ] = useState("");
    const [places, setPlaces] = useState([]);
    const [placeBusy, setPlaceBusy] = useState(false);
    const [healthBusy, setHealthBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    const toast = (m) => { setMsg(m); setTimeout(() => setMsg(null), 2500); };
    const savePin = async () => {
        if (pin1.length !== 6 || pin1 !== pin2) {
            toast(t("settings.pinMismatch"));
            return;
        }
        await s.set("pinHash", await sha256(pin1));
        setPinOpen(false);
        setPin1("");
        setPin2("");
        toast(t("settings.pinSet"));
    };
    const facts = `${appConfig.appName} ${appVersion} · ${navigator.platform} · ${i18n.language}`;
    return (_jsxs("section", { className: "screen", children: [_jsx("h1", { children: t("nav.settings") }), _jsxs("button", { type: "button", className: "card tap", style: { width: "100%", textAlign: "left" }, onClick: () => (isPro ? setPlanOpen(true) : showPaywall("settings")), children: [_jsxs("div", { children: [_jsx("strong", { children: isPro ? t("plan.pro") : t("plan.free") }), _jsx("div", { className: "muted small", children: isPro ? (sub.plan === "lifetime" ? t("settings.planLifetime") : sub.expiresAt ? t("settings.planYearly", { date: fmtDate(sub.expiresAt, i.language) }) : t("settings.proThanks")) : t("settings.freeHint") })] }), !isPro ? _jsx("span", { className: "pill", children: t("plan.upgrade") }) : _jsx("span", { className: "pill pro", children: "PRO \u203A" })] }), _jsx("h2", { children: t("settings.profile") }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("onboarding.name") }), _jsx("input", { value: name, onChange: (e) => setName(e.target.value), onBlur: () => void s.set("userName", name.trim() || null), placeholder: t("onboarding.namePh"), maxLength: 40 })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("settings.language") }), _jsx("select", { value: s.language, onChange: async (e) => { const l = e.target.value; await s.set("language", l); await i18n.changeLanguage(l); }, children: SUPPORTED.map((l) => _jsx("option", { value: l, children: t(`lang.${l}`) }, l)) })] }), _jsx("h2", { children: t("settings.diary") }), _jsxs("div", { className: "card", children: [_jsx("span", { children: t("meds.title") }), _jsx("button", { className: "ghost", onClick: () => setMedsOpen(true), children: t("settings.manage") })] }), _jsxs("label", { className: "field", children: [_jsxs("span", { children: [t("settings.medThreshold"), " ", _jsx("button", { type: "button", className: "linklike small", onClick: () => openInfo("medDays"), children: t("settings.whatIsThis") })] }), _jsx("div", { className: "segment", children: diaryConfig().medicationDayThresholds.map((n) => _jsx("button", { className: s.medThreshold === n ? "active" : "", onClick: () => s.set("medThreshold", n), children: t("settings.daysPerMonth", { n }) }, n)) }), _jsx("small", { className: "muted", children: t("settings.medThresholdHint") })] }), _jsxs("label", { className: "check", children: [_jsx("input", { type: "checkbox", checked: s.cycleTracking, onChange: (e) => { if (e.target.checked && !gate.allow("cycle"))
                            return; void s.set("cycleTracking", e.target.checked); } }), " ", t("settings.cycleTracking"), " ", !isPro && _jsx("span", { className: "pill pro", children: "PRO" })] }), _jsx("small", { className: "muted", style: { display: "block", marginTop: -4 }, children: t("settings.cycleHint") }), _jsx("h2", { children: t("settings.triggers") }), _jsxs("div", { className: "card", children: [_jsxs("div", { children: [_jsxs("strong", { children: [t("weather.title"), " ", !isPro && _jsx("span", { className: "pill pro", children: "PRO" })] }), _jsx("div", { className: "muted small", children: s.weatherEnabled && s.weatherPlace ? t("weather.on", { place: s.weatherPlace }) : t("weather.hint") })] }), s.weatherEnabled
                        ? _jsx("button", { className: "ghost", onClick: () => { void s.set("weatherEnabled", false); toast(t("weather.off")); }, children: t("common.off") })
                        : _jsx("button", { className: "ghost", onClick: () => { if (gate.allow("weather")) {
                                setPlaceQ(s.weatherPlace ?? "");
                                setPlaces([]);
                                setPlaceOpen(true);
                            } }, children: t("weather.choose") })] }), s.weatherEnabled && _jsx("button", { className: "linklike small", onClick: () => { setPlaceQ(s.weatherPlace ?? ""); setPlaces([]); setPlaceOpen(true); }, children: t("weather.changePlace") }), healthAvailable() && (_jsxs("div", { className: "card", style: { marginTop: 10 }, children: [_jsxs("div", { children: [_jsxs("strong", { children: [t("health.title"), " ", !isPro && _jsx("span", { className: "pill pro", children: "PRO" })] }), _jsx("div", { className: "muted small", children: s.healthExport ? t("health.on") : t("health.hint") })] }), s.healthExport
                        ? _jsx("button", { className: "ghost", onClick: async () => { await s.set("healthExport", false); await resetHealthSync(); toast(t("health.offToast")); }, children: t("common.off") })
                        : _jsx("button", { className: "ghost", disabled: healthBusy, onClick: async () => {
                                if (!gate.allow("health"))
                                    return;
                                setHealthBusy(true);
                                try {
                                    const ok = await requestHealthAccess();
                                    if (!ok) {
                                        toast(t("health.denied"));
                                        return;
                                    }
                                    await s.set("healthExport", true);
                                    const n = await syncHealth();
                                    toast(t("health.synced", { n }));
                                }
                                finally {
                                    setHealthBusy(false);
                                }
                            }, children: t("common.on") })] })), _jsx("h2", { children: t("settings.widget") }), _jsxs("div", { className: "card", children: [_jsxs("div", { children: [_jsx("strong", { children: t("widget.title") }), _jsx("div", { className: "muted small", children: t("widget.settingsHint") })] }), _jsx("button", { className: "ghost", onClick: () => openInfo("widget"), children: t("widget.guideBtn") })] }), _jsx("h2", { children: t("settings.reminders") }), _jsxs("label", { className: "check", children: [_jsx("input", { type: "checkbox", checked: s.checkinReminder, onChange: (e) => s.set("checkinReminder", e.target.checked) }), " ", t("settings.checkinReminder")] }), s.checkinReminder && (_jsxs("label", { className: "field", children: [_jsx("span", { children: t("settings.reminderTime") }), _jsx("input", { type: "time", value: `${String(s.dailyReminderHour).padStart(2, "0")}:00`, step: 3600, onChange: (e) => e.target.value && s.set("dailyReminderHour", Number(e.target.value.slice(0, 2))) })] })), _jsxs("label", { className: "check", children: [_jsx("input", { type: "checkbox", checked: s.openEpisodeReminder, onChange: (e) => s.set("openEpisodeReminder", e.target.checked) }), " ", t("settings.openEpisodeReminder")] }), _jsx("h2", { children: t("settings.privacy") }), _jsxs("div", { className: "card", children: [_jsxs("div", { children: [_jsx("strong", { children: t("settings.pin") }), _jsx("div", { className: "muted small", children: s.pinHash ? t("settings.pinOn") : t("settings.pinOff") })] }), s.pinHash
                        ? _jsx("button", { className: "ghost", onClick: () => { void s.set("pinHash", null); toast(t("settings.pinRemoved")); }, children: t("settings.pinRemove") })
                        : _jsx("button", { className: "ghost", onClick: () => { if (gate.allow("pin"))
                                setPinOpen(true); }, children: t("settings.pinSetup") })] }), _jsx("h2", { children: t("settings.data") }), _jsxs("div", { className: "stack", children: [_jsx("button", { className: "ghost", onClick: () => { if (!gate.allow("backup"))
                            return; const p = prompt(t("backup.passphrase")); if (p)
                            void exportBackup(p).then(() => toast(t("backup.exported"))); }, children: t("backup.export") }), _jsx("button", { className: "ghost", onClick: () => { if (gate.allow("backup"))
                            setImportOpen(true); }, children: t("backup.import") }), _jsx("button", { className: "ghost danger", onClick: async () => { if (!confirm(t("backup.wipeConfirm")))
                            return; await wipeAllData(); alert(t("backup.wiped")); location.reload(); }, children: t("backup.wipe") })] }), _jsx("p", { className: "muted small", children: t("settings.dataNote") }), _jsx("h2", { children: t("settings.about") }), _jsxs("div", { className: "stack", children: [_jsx("a", { className: "ghost btn-like", style: { display: "block", padding: 12, borderRadius: 12, textDecoration: "none", textAlign: "center" }, href: `mailto:${appConfig.supportEmail}?subject=${encodeURIComponent(`Feedback ${facts}`)}&body=${encodeURIComponent(`\n\n—\n${facts}`)}`, children: t("settings.feedback") }), _jsx("button", { className: "linklike", onClick: () => void restore().then(() => toast(t("settings.restored"))), children: t("paywall.restore") })] }), _jsxs("p", { className: "muted small", children: [_jsx("a", { href: appConfig.privacyUrl, children: t("settings.privacyPolicy") }), " \u00B7 ", _jsx("a", { href: appConfig.termsUrl, children: t("paywall.terms") }), " \u00B7 ", _jsx("a", { href: `mailto:${appConfig.supportEmail}`, children: t("settings.support") })] }), _jsx("p", { className: "disclaimer", children: t("common.disclaimer") }), appVersion && _jsxs("p", { className: "muted small", children: [appConfig.appName, " ", appVersion] }), _jsxs(Sheet, { open: planOpen, onClose: () => setPlanOpen(false), title: t("plan.pro"), children: [_jsxs("div", { className: "card col", children: [_jsx("strong", { children: sub.plan === "lifetime" ? t("paywall.plan.lifetime") : t("paywall.plan.annual") }), _jsx("span", { className: "muted small", children: sub.plan === "lifetime" ? t("settings.planLifetime")
                                    : sub.inTrial ? t("settings.planTrial", { date: sub.expiresAt ? fmtDate(sub.expiresAt, i.language) : "–" })
                                        : sub.willRenew ? t("settings.planRenews", { date: sub.expiresAt ? fmtDate(sub.expiresAt, i.language) : "–" })
                                            : t("settings.planEnds", { date: sub.expiresAt ? fmtDate(sub.expiresAt, i.language) : "–" }) })] }), sub.plan !== "lifetime" && (_jsxs(_Fragment, { children: [_jsx("button", { className: "cta", onClick: () => { setPlanOpen(false); showPaywall("switchLifetime"); }, children: t("settings.switchLifetime") }), _jsx("p", { className: "muted small", children: t("settings.switchLifetimeHint") }), _jsx("button", { className: "ghost", style: { width: "100%" }, onClick: () => void manage(), children: t("settings.manageSub") })] })), _jsx("p", { className: "muted small", style: { marginTop: 12 }, children: t("settings.planStore", { store: sub.store === "APP_STORE" || sub.store === "app_store" ? "App Store" : sub.store === "PLAY_STORE" || sub.store === "play_store" ? "Google Play" : sub.store ?? "–" }) })] }), _jsxs(Sheet, { open: placeOpen, onClose: () => setPlaceOpen(false), title: t("weather.pickTitle"), children: [_jsx("p", { className: "muted small", children: t("weather.pickHint") }), _jsxs("form", { className: "row tight", onSubmit: async (e) => { e.preventDefault(); if (placeQ.trim().length < 2)
                            return; setPlaceBusy(true); try {
                            setPlaces(await searchPlaces(placeQ, i.language));
                        }
                        catch {
                            toast(t("weather.searchFailed"));
                        }
                        finally {
                            setPlaceBusy(false);
                        } }, children: [_jsx("input", { style: { flex: 1 }, value: placeQ, onChange: (e) => setPlaceQ(e.target.value), placeholder: t("weather.placePh"), autoFocus: true }), _jsx("button", { type: "submit", className: "ghost", disabled: placeBusy, children: t("common.search") })] }), places.length > 0 && (_jsx("ul", { className: "list", style: { marginTop: 10 }, children: places.map((p, idx) => (_jsxs("li", { className: "tap", onClick: async () => {
                                const label = [p.name, p.admin, p.country].filter(Boolean).join(", ");
                                await s.set("weatherPlace", label);
                                await s.set("weatherLat", p.lat);
                                await s.set("weatherLon", p.lon);
                                await s.set("weatherFetchedAt", null);
                                await s.set("weatherEnabled", true);
                                setPlaceOpen(false);
                                toast(t("weather.on", { place: label }));
                                void maybeRefreshWeather(true).then(() => useUi.getState().bump());
                            }, children: [_jsxs("div", { children: [_jsx("strong", { children: p.name }), _jsx("small", { children: [p.admin, p.country].filter(Boolean).join(", ") })] }), _jsx("span", { className: "muted", children: "\u203A" })] }, idx))) })), _jsx("p", { className: "muted small", style: { marginTop: 12 }, children: t("weather.privacy") })] }), _jsxs(Sheet, { open: pinOpen, onClose: () => setPinOpen(false), title: t("settings.pinSetup"), children: [_jsx("p", { className: "muted small", children: t("settings.pinHint") }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("settings.pinNew") }), _jsx("input", { type: "password", inputMode: "numeric", pattern: "[0-9]*", maxLength: 6, value: pin1, onChange: (e) => setPin1(e.target.value.replace(/\D/g, "")) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("settings.pinRepeat") }), _jsx("input", { type: "password", inputMode: "numeric", pattern: "[0-9]*", maxLength: 6, value: pin2, onChange: (e) => setPin2(e.target.value.replace(/\D/g, "")) })] }), _jsx("button", { className: "cta", onClick: savePin, disabled: pin1.length !== 6 || pin2.length !== 6, children: t("common.save") })] }), _jsxs(Sheet, { open: importOpen, onClose: () => setImportOpen(false), title: t("backup.import"), children: [_jsx("p", { className: "muted small", children: t("backup.importHint") }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("backup.file") }), _jsx("input", { type: "file", accept: ".json,.txt,.migrano,*/*", onChange: (e) => { const f = e.target.files?.[0]; if (f)
                                    void f.text().then(setImportText); } })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("backup.passphraseShort") }), _jsx("input", { type: "password", value: importPass, onChange: (e) => setImportPass(e.target.value) })] }), _jsx("button", { className: "cta", disabled: !importText || !importPass, onClick: async () => { try {
                            await importBackup(importText, importPass);
                            setImportOpen(false);
                            toast(t("backup.imported"));
                            useUi.getState().bump();
                        }
                        catch {
                            toast(t("backup.importFailed"));
                        } }, children: t("backup.import") })] }), _jsx(InfoSheets, {}), msg && _jsx("div", { className: "toast", children: msg })] }));
}
