import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DomainRoutes } from "@/domain";
import { SettingsScreen } from "./SettingsScreen";
import { TestMenu } from "./TestMenu";
import { Onboarding } from "./onboarding/Onboarding";
import { Paywall } from "./paywall/Paywall";
import { isRelease } from "@/core/release";
import { useSettings } from "@/core/settings";
import { usePurchases } from "@/core/purchases";

export default function App() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"home" | "settings">("home");
  const onboardingDone = useSettings((s) => s.onboardingDone);
  const initPurchases = usePurchases((s) => s.init);
  useEffect(() => { void initPurchases(); }, [initPurchases]);

  return (
    <div className="app">
      <main>
        {!onboardingDone ? <Onboarding /> : tab === "home" ? <DomainRoutes /> : <SettingsScreen />}
      </main>
      {onboardingDone && (
        <nav className="tabbar">
          <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")}>{t("nav.home")}</button>
          <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}>{t("nav.settings")}</button>
        </nav>
      )}
      <Paywall />
      {!isRelease && <TestMenu />}
    </div>
  );
}
