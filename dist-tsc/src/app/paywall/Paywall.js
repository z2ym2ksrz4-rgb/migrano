import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePaywall, usePurchases } from "@/core/purchases";
import appConfig from "../../../app.config.json";
/**
 * Hard paywall sheet. Shown on demand (useProGate) or at the end of onboarding.
 * Default selection is the annual plan with trial; lifetime is the honest one-time alternative.
 */
export function Paywall() {
    const { t } = useTranslation();
    const { open, reason, hide } = usePaywall();
    const { packages, purchase, restore, ready } = usePurchases();
    const [busy, setBusy] = useState(false);
    const [selected, setSelected] = useState("annual");
    if (!open)
        return null;
    const pkg = packages.find((p) => p.id === selected);
    const buy = async () => {
        if (!pkg)
            return;
        setBusy(true);
        const ok = await purchase(pkg);
        setBusy(false);
        if (ok)
            hide();
    };
    return (_jsx("div", { className: "sheet-backdrop", onClick: hide, children: _jsxs("div", { className: "sheet", onClick: (e) => e.stopPropagation(), children: [_jsx("button", { className: "sheet-close", onClick: hide, "aria-label": t("common.cancel"), children: "\u00D7" }), _jsx("h2", { children: t("paywall.title") }), reason && _jsx("p", { className: "muted", children: t(`paywall.reasons.${reason}`, { defaultValue: "" }) }), _jsx("ul", { className: "benefits", children: t("paywall.benefits", { returnObjects: true }).map((b) => _jsx("li", { children: b }, b)) }), !ready ? _jsx("p", { className: "muted", children: "\u2026" }) : (_jsx("div", { className: "plans", children: packages.map((p) => (_jsxs("button", { className: `plan ${selected === p.id ? "selected" : ""}`, onClick: () => setSelected(p.id), children: [_jsx("strong", { children: t(`paywall.plan.${p.id}`) }), _jsx("span", { children: p.priceString }), p.id === "annual" && p.introPriceString && _jsx("em", { children: t("paywall.trial") })] }, p.id))) })), _jsx("button", { className: "cta", disabled: busy || !pkg, onClick: buy, children: selected === "annual" ? t("paywall.ctaTrial") : t("paywall.ctaBuy") }), _jsxs("p", { className: "legal muted", children: [t("paywall.legal"), " \u00B7 ", _jsx("button", { className: "linklike", onClick: () => void restore(), children: t("paywall.restore") }), " \u00B7", " ", _jsx("a", { href: appConfig.termsUrl, children: t("paywall.terms") }), " \u00B7 ", _jsx("a", { href: appConfig.privacyUrl, children: t("settings.privacy") })] })] }) }));
}
