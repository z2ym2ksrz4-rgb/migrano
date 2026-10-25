import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/core/settings";
import { ensurePermission } from "@/core/notifications";
import { usePaywall } from "@/core/purchases";
import { addMedication, listMedications } from "@/core/diary";
import i18n, { SUPPORTED, type Lang } from "@/core/i18n";
import { haptics } from "@/core/ui";

/**
 * Onboarding: (0) language + first name, (1-3) three short intro screens, (4) two setup questions
 * (attacks per month, acute medication) so the diary is configured before the first attack. Then notification
 * permission and the paywall (user can always close it and use the free tier).
 */
export function Onboarding() {
  const { t } = useTranslation();
  const settings = useSettings();
  const showPaywall = usePaywall((s) => s.show);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.userName ?? "");
  const [attacks, setAttacks] = useState<string | null>(null);
  const [meds, setMeds] = useState<Set<string>>(new Set());
  const [otherMed, setOtherMed] = useState("");
  const intro = t("onboarding.steps", { returnObjects: true }) as { title: string; body: string }[];
  const medOptions = ["triptan", "ibuprofen", "paracetamol", "aspirin"] as const;
  const total = intro.length + 2; // name, intro…, setup

  const finish = async () => {
    const n = name.trim();
    await settings.set("userName", n || null);
    if (attacks) await settings.set("baselineAttacks", attacks);
    const existing = (await listMedications(true)).map((m) => m.name.toLowerCase());
    for (const k of meds) { const label = t(`onboarding.meds.${k}`); if (!existing.includes(label.toLowerCase())) await addMedication(label, "acute"); }
    if (otherMed.trim() && !existing.includes(otherMed.trim().toLowerCase())) await addMedication(otherMed.trim(), "acute");
    // Threshold follows the guidance: 10 days for triptans/combinations, 15 for simple analgesics only.
    await settings.set("medThreshold", meds.has("triptan") || meds.size === 0 ? 10 : 15);
    await ensurePermission();
    await settings.set("onboardingDone", true);
    showPaywall("onboarding");
  };
  const next = () => { haptics.tap(); setStep(step + 1); };

  if (step === 0) {
    return (
      <section className="screen onboarding">
        <div className="dots">{Array.from({ length: total }, (_, i) => <span key={i} className={i === step ? "on" : ""} />)}</div>
        <h1>{t("onboarding.welcome")}</h1>
        <p>{t("onboarding.welcomeBody")}</p>
        <label className="field"><span>{t("settings.language")}</span>
          <select value={settings.language} onChange={async (e) => { const l = e.target.value as Lang; await settings.set("language", l); await i18n.changeLanguage(l); }}>
            {SUPPORTED.map((l) => <option key={l} value={l}>{t(`lang.${l}`)}</option>)}
          </select>
        </label>
        <label className="field"><span>{t("onboarding.name")}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("onboarding.namePh")} autoComplete="given-name" maxLength={40} />
        </label>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="cta" onClick={next}>{t("onboarding.next")}</button>
        </div>
      </section>
    );
  }

  if (step === total - 1) {
    return (
      <section className="screen onboarding">
        <div className="dots">{Array.from({ length: total }, (_, i) => <span key={i} className={i === step ? "on" : ""} />)}</div>
        <h1>{t("onboarding.setupTitle", { name: name.trim() || "" }).trim()}</h1>
        <div className="field"><span>{t("onboarding.attacksQ")}</span>
          <div className="chips">
            {["0-3", "4-7", "8-14", "15+"].map((b) => <button key={b} type="button" className={`chip ${attacks === b ? "on" : ""}`} onClick={() => setAttacks(b)}>{t(`onboarding.attacks.${b}`)}</button>)}
          </div>
        </div>
        <div className="field"><span>{t("onboarding.medsQ")}</span>
          <div className="chips">
            {medOptions.map((k) => <button key={k} type="button" className={`chip ${meds.has(k) ? "on" : ""}`} onClick={() => { const n = new Set(meds); if (n.has(k)) n.delete(k); else n.add(k); setMeds(n); }}>{t(`onboarding.meds.${k}`)}</button>)}
          </div>
          <input value={otherMed} onChange={(e) => setOtherMed(e.target.value)} placeholder={t("onboarding.medsOther")} />
          <small className="muted">{t("onboarding.medsHint")}</small>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="cta" onClick={() => void finish()}>{t("onboarding.start")}</button>
        </div>
      </section>
    );
  }

  const s = intro[step - 1];
  return (
    <section className="screen onboarding">
      <div className="dots">{Array.from({ length: total }, (_, i) => <span key={i} className={i === step ? "on" : ""} />)}</div>
      <h1>{s.title}</h1>
      <p>{s.body}</p>
      <div className="row">
        <button className="ghost" onClick={() => setStep(total - 1)}>{t("onboarding.skip")}</button>
        <button className="cta" onClick={next}>{t("onboarding.next")}</button>
      </div>
    </section>
  );
}
