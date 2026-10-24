import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/core/settings";
import { ensurePermission } from "@/core/notifications";
import { usePaywall } from "@/core/purchases";
/**
 * Three short screens, then the notification permission, then the paywall (hard paywall after onboarding,
 * which converts ~5x better than freemium per RevenueCat 2026 while keeping retention equal).
 * The user can always close the paywall and use the free tier.
 */
export function Onboarding() {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);
    const settings = useSettings();
    const showPaywall = usePaywall((s) => s.show);
    const steps = t("onboarding.steps", { returnObjects: true });
    const finish = async () => {
        await ensurePermission();
        await settings.set("onboardingDone", true);
        showPaywall("onboarding");
    };
    const last = step === steps.length - 1;
    return (_jsxs("section", { className: "screen onboarding", children: [_jsx("div", { className: "dots", children: steps.map((_, i) => _jsx("span", { className: i === step ? "on" : "" }, i)) }), _jsx("h1", { children: steps[step].title }), _jsx("p", { children: steps[step].body }), _jsxs("div", { className: "row", children: [!last && _jsx("button", { className: "ghost", onClick: finish, children: t("onboarding.skip") }), _jsx("button", { className: "cta", onClick: () => (last ? void finish() : setStep(step + 1)), children: last ? t("onboarding.start") : t("onboarding.next") })] })] }));
}
