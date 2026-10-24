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
  const steps = t("onboarding.steps", { returnObjects: true }) as { title: string; body: string }[];

  const finish = async () => {
    await ensurePermission();
    await settings.set("onboardingDone", true);
    showPaywall("onboarding");
  };

  const last = step === steps.length - 1;
  return (
    <section className="screen onboarding">
      <div className="dots">{steps.map((_, i) => <span key={i} className={i === step ? "on" : ""} />)}</div>
      <h1>{steps[step].title}</h1>
      <p>{steps[step].body}</p>
      <div className="row">
        {!last && <button className="ghost" onClick={finish}>{t("onboarding.skip")}</button>}
        <button className="cta" onClick={() => (last ? void finish() : setStep(step + 1))}>
          {last ? t("onboarding.start") : t("onboarding.next")}
        </button>
      </div>
    </section>
  );
}
