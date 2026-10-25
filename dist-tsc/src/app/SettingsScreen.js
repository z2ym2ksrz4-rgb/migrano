import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/core/settings";
import { SUPPORTED } from "@/core/i18n";
import i18n from "@/core/i18n";
import { exportBackup, importBackup } from "@/core/backup";
import { wipeAllData } from "@/core/db";
import { Sheet, sha256 } from "@/core/ui";
import { appVersion } from "@/core/release";
import appConfig from "../../app.config.json";
import { usePurchases, usePaywall, useProGate } from "@/core/purchases";
import { useUi } from "@/domain/migrano/store";
import { diaryConfig } from "@/core/diary";
export function SettingsScreen() {
    const { t } = useTranslation();
    const s = useSettings();
    const isPro = usePurchases((p) => p.isPro);
    const restore = usePurchases((p) => p.restore);
    const showPaywall = usePaywall((p) => p.show);
    const gate = useProGate();
    const setMedsOpen = useUi((u) => u.setMedsOpen);
    const [pinOpen, setPinOpen] = useState(false);
    const [pin1, setPin1] = useState("");
    const [pin2, setPin2] = useState("");
    const [importOpen, setImportOpen] = useState(false);
    const [importText, setImportText] = useState("");
    const [importPass, setImportPass] = useState("");
    const [msg, setMsg] = useState(null);
    const toast = (m) => { setMsg(m); setTimeout(() => setMsg(null), 2500); };
    const savePin = async () => {
        if (pin1.length < 4 || pin1 !== pin2) {
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
    return (_jsxs("section", { className: "screen", children: [_jsx("h1", { children: t("nav.settings") }), _jsxs("div", { className: "card", children: [_jsxs("div", { children: [_jsx("strong", { children: isPro ? t("plan.pro") : t("plan.free") }), _jsx("div", { className: "muted small", children: isPro ? t("settings.proThanks") : t("settings.freeHint") })] }), !isPro ? _jsx("button", { onClick: () => showPaywall("settings"), children: t("plan.upgrade") }) : _jsx("span", { className: "pill pro", children: "PRO" })] }), _jsx("h2", { children: t("settings.diary") }), _jsxs("div", { className: "card", children: [_jsx("span", { children: t("meds.title") }), _jsx("button", { className: "ghost", onClick: () => setMedsOpen(true), children: t("settings.manage") })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("settings.medThreshold") }), _jsx("div", { className: "segment", children: diaryConfig().medicationDayThresholds.map((n) => _jsx("button", { className: s.medThreshold === n ? "active" : "", onClick: () => s.set("medThreshold", n), children: t("settings.daysPerMonth", { n }) }, n)) }), _jsx("small", { className: "muted", children: t("settings.medThresholdHint") })] }), _jsx("h2", { children: t("settings.reminders") }), _jsxs("label", { className: "check", children: [_jsx("input", { type: "checkbox", checked: s.checkinReminder, onChange: (e) => s.set("checkinReminder", e.target.checked) }), " ", t("settings.checkinReminder")] }), s.checkinReminder && (_jsxs("label", { className: "field", children: [_jsx("span", { children: t("settings.reminderTime") }), _jsx("input", { type: "time", value: `${String(s.dailyReminderHour).padStart(2, "0")}:00`, step: 3600, onChange: (e) => e.target.value && s.set("dailyReminderHour", Number(e.target.value.slice(0, 2))) })] })), _jsxs("label", { className: "check", children: [_jsx("input", { type: "checkbox", checked: s.openEpisodeReminder, onChange: (e) => s.set("openEpisodeReminder", e.target.checked) }), " ", t("settings.openEpisodeReminder")] }), _jsx("h2", { children: t("settings.privacy") }), _jsxs("div", { className: "card", children: [_jsxs("div", { children: [_jsx("strong", { children: t("settings.pin") }), _jsx("div", { className: "muted small", children: s.pinHash ? t("settings.pinOn") : t("settings.pinOff") })] }), s.pinHash
                        ? _jsx("button", { className: "ghost", onClick: () => { void s.set("pinHash", null); toast(t("settings.pinRemoved")); }, children: t("settings.pinRemove") })
                        : _jsx("button", { className: "ghost", onClick: () => { if (gate.allow("pin"))
                                setPinOpen(true); }, children: t("settings.pinSetup") })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("settings.language") }), _jsx("select", { value: s.language, onChange: async (e) => { const l = e.target.value; await s.set("language", l); await i18n.changeLanguage(l); }, children: SUPPORTED.map((l) => _jsx("option", { value: l, children: t(`lang.${l}`) }, l)) })] }), _jsx("h2", { children: t("settings.data") }), _jsxs("div", { className: "stack", children: [_jsx("button", { className: "ghost", onClick: () => { if (!gate.allow("backup"))
                            return; const p = prompt(t("backup.passphrase")); if (p)
                            void exportBackup(p).then(() => toast(t("backup.exported"))); }, children: t("backup.export") }), _jsx("button", { className: "ghost", onClick: () => { if (gate.allow("backup"))
                            setImportOpen(true); }, children: t("backup.import") }), _jsx("button", { className: "ghost danger", onClick: async () => { if (!confirm(t("backup.wipeConfirm")))
                            return; await wipeAllData(); alert(t("backup.wiped")); location.reload(); }, children: t("backup.wipe") })] }), _jsx("p", { className: "muted small", children: t("settings.dataNote") }), _jsx("h2", { children: t("settings.about") }), _jsxs("div", { className: "stack", children: [_jsx("a", { className: "ghost btn-like", style: { display: "block", padding: 12, borderRadius: 12, textDecoration: "none", textAlign: "center" }, href: `mailto:${appConfig.supportEmail}?subject=${encodeURIComponent(`Feedback ${facts}`)}&body=${encodeURIComponent(`\n\n—\n${facts}`)}`, children: t("settings.feedback") }), _jsx("button", { className: "linklike", onClick: () => void restore().then(() => toast(t("settings.restored"))), children: t("paywall.restore") })] }), _jsxs("p", { className: "muted small", children: [_jsx("a", { href: appConfig.privacyUrl, children: t("settings.privacyPolicy") }), " \u00B7 ", _jsx("a", { href: appConfig.termsUrl, children: t("paywall.terms") }), " \u00B7 ", _jsx("a", { href: `mailto:${appConfig.supportEmail}`, children: t("settings.support") })] }), _jsx("p", { className: "disclaimer", children: t("common.disclaimer") }), appVersion && _jsxs("p", { className: "muted small", children: [appConfig.appName, " ", appVersion] }), _jsxs(Sheet, { open: pinOpen, onClose: () => setPinOpen(false), title: t("settings.pinSetup"), children: [_jsx("p", { className: "muted small", children: t("settings.pinHint") }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("settings.pinNew") }), _jsx("input", { type: "password", inputMode: "numeric", pattern: "[0-9]*", maxLength: 6, value: pin1, onChange: (e) => setPin1(e.target.value.replace(/\D/g, "")) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("settings.pinRepeat") }), _jsx("input", { type: "password", inputMode: "numeric", pattern: "[0-9]*", maxLength: 6, value: pin2, onChange: (e) => setPin2(e.target.value.replace(/\D/g, "")) })] }), _jsx("button", { className: "cta", onClick: savePin, disabled: pin1.length < 4, children: t("common.save") })] }), _jsxs(Sheet, { open: importOpen, onClose: () => setImportOpen(false), title: t("backup.import"), children: [_jsx("p", { className: "muted small", children: t("backup.importHint") }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("backup.file") }), _jsx("input", { type: "file", accept: ".json,.txt,.migrano,*/*", onChange: (e) => { const f = e.target.files?.[0]; if (f)
                                    void f.text().then(setImportText); } })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("backup.passphraseShort") }), _jsx("input", { type: "password", value: importPass, onChange: (e) => setImportPass(e.target.value) })] }), _jsx("button", { className: "cta", disabled: !importText || !importPass, onClick: async () => { try {
                            await importBackup(importText, importPass);
                            setImportOpen(false);
                            toast(t("backup.imported"));
                            useUi.getState().bump();
                        }
                        catch {
                            toast(t("backup.importFailed"));
                        } }, children: t("backup.import") })] }), msg && _jsx("div", { className: "toast", children: msg })] }));
}
