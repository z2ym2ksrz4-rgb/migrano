import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DomainRoutes, domainTabs } from "@/domain";
import { SettingsScreen } from "./SettingsScreen";
import { TestMenu } from "./TestMenu";
import { Onboarding } from "./onboarding/Onboarding";
import { Paywall } from "./paywall/Paywall";
import { LockScreen } from "./LockScreen";
import { isRelease } from "@/core/release";
import { useSettings } from "@/core/settings";
import { usePurchases } from "@/core/purchases";
export default function App() {
    const { t } = useTranslation();
    const [tab, setTab] = useState(domainTabs[0].key);
    const onboardingDone = useSettings((s) => s.onboardingDone);
    const initPurchases = usePurchases((s) => s.init);
    useEffect(() => { void initPurchases(); }, [initPurchases]);
    useEffect(() => { import("@fontsource-variable/fraunces"); }, []);
    return (_jsxs("div", { className: "app", children: [_jsx(LockScreen, {}), _jsx("main", { children: !onboardingDone ? _jsx(Onboarding, {}) : tab === "settings" ? _jsx(SettingsScreen, {}) : _jsx(DomainRoutes, { tab: tab }) }), onboardingDone && (_jsxs("nav", { className: "tabbar", children: [domainTabs.map((d) => (_jsx("button", { className: tab === d.key ? "active" : "", onClick: () => setTab(d.key), children: t(d.labelKey) }, d.key))), _jsx("button", { className: tab === "settings" ? "active" : "", onClick: () => setTab("settings"), children: t("nav.settings") })] })), _jsx(Paywall, {}), !isRelease && _jsx(TestMenu, {})] }));
}
