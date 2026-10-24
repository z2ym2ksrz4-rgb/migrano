import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/core/settings";
import { SUPPORTED } from "@/core/i18n";
import i18n from "@/core/i18n";
import { exportBackup } from "@/core/backup";
import { wipeAllData } from "@/core/db";
import appConfig from "../../app.config.json";
import { usePurchases, usePaywall } from "@/core/purchases";
export function SettingsScreen() {
    const { t } = useTranslation();
    const s = useSettings();
    const isPro = usePurchases((p) => p.isPro);
    const showPaywall = usePaywall((p) => p.show);
    return (_jsxs("section", { className: "screen", children: [_jsx("h1", { children: t("nav.settings") }), _jsxs("div", { className: "card", children: [_jsx("strong", { children: isPro ? t("plan.pro") : t("plan.free") }), !isPro && _jsx("button", { onClick: () => showPaywall("settings"), children: t("plan.upgrade") })] }), _jsxs("label", { children: [t("settings.language"), _jsx("select", { value: s.language, onChange: async (e) => { const l = e.target.value; await s.set("language", l); await i18n.changeLanguage(l); }, children: SUPPORTED.map((l) => _jsx("option", { value: l, children: t(`lang.${l}`) }, l)) })] }), _jsxs("label", { children: [t("settings.dailyReminder"), _jsx("input", { type: "number", min: 0, max: 23, value: s.dailyReminderHour, onChange: (e) => s.set("dailyReminderHour", Number(e.target.value)) })] }), _jsx("button", { onClick: () => { const p = prompt(t("backup.passphrase")); if (p)
                    void exportBackup(p); }, children: t("backup.export") }), _jsx("button", { className: "ghost danger", onClick: async () => { if (!confirm(t("backup.wipeConfirm")))
                    return; await wipeAllData(); alert(t("backup.wiped")); location.reload(); }, children: t("backup.wipe") }), _jsxs("p", { className: "muted", children: [_jsx("a", { href: appConfig.privacyUrl, children: t("settings.privacy") }), " \u00B7 ", _jsx("a", { href: `mailto:${appConfig.supportEmail}`, children: t("settings.support") })] })] }));
}
