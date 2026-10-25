import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/core/settings";
import { ensurePermission } from "@/core/notifications";
import { usePaywall } from "@/core/purchases";
import { addMedication, listMedications } from "@/core/diary";
import i18n, { SUPPORTED, type Lang } from "@/core/i18n";
import { haptics } from "@/core/ui";
import { Capacitor } from "@capacitor/core";
import { searchPlaces, type Place } from "@/core/diary";
import { WidgetPreview } from "@/domain/migrano/components/WidgetPreview";

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
  const [wantCycle, setWantCycle] = useState(false);
  const [wantHealth, setWantHealth] = useState(false);
  const [placeQ, setPlaceQ] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [place, setPlace] = useState<Place | null>(null);
  const [placeBusy, setPlaceBusy] = useState(false);
  const ios = Capacitor.getPlatform() === "ios";
  const intro = t("onboarding.steps", { returnObjects: true }) as { title: string; body: string }[];
  const medOptions = ["triptan", "ibuprofen", "paracetamol", "aspirin"] as const;
  const total = intro.length + 4; // name, intro…, widget, setup, extras
  const SETUP = total - 2, EXTRAS = total - 1, WIDGET = intro.length + 1;

  const finish = async () => {
    const n = name.trim();
    await settings.set("userName", n || null);
    if (attacks) await settings.set("baselineAttacks", attacks);
    const existing = (await listMedications(true)).map((m) => m.name.toLowerCase());
    for (const k of meds) { const label = t(`onboarding.meds.${k}`); if (!existing.includes(label.toLowerCase())) await addMedication(label, "acute"); }
    if (otherMed.trim() && !existing.includes(otherMed.trim().toLowerCase())) await addMedication(otherMed.trim(), "acute");
    // Threshold follows the guidance: 10 days for triptans/combinations, 15 for simple analgesics only.
    await settings.set("medThreshold", meds.has("triptan") || meds.size === 0 ? 10 : 15);
    if (place) { await settings.set("weatherPlace", [place.name, place.admin, place.country].filter(Boolean).join(", ")); await settings.set("weatherLat", place.lat); await settings.set("weatherLon", place.lon); }
    const wishes = { cycle: wantCycle, weather: !!place, health: wantHealth && ios };
    await settings.set("onboardingWishes", wishes.cycle || wishes.weather || wishes.health ? JSON.stringify(wishes) : null);
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

  if (step === WIDGET) {
    const steps = t("widget.stepsIos", { returnObjects: true }) as string[];
    return (
      <section className="screen onboarding">
        <div className="dots">{Array.from({ length: total }, (_, i) => <span key={i} className={i === step ? "on" : ""} />)}</div>
        <h1>{t("onboarding.widgetTitle")}</h1>
        <p>{t("onboarding.widgetBody")}</p>
        <WidgetPreview />
        <ol className="steps">{steps.map((x, i) => <li key={i}>{x}</li>)}</ol>
        <p className="muted small">{t("onboarding.widgetLater")}</p>
        <div className="row">
          <button className="ghost" onClick={() => setStep(SETUP)}>{t("onboarding.skip")}</button>
          <button className="cta" onClick={next}>{t("onboarding.next")}</button>
        </div>
      </section>
    );
  }

  if (step === EXTRAS) {
    const search = async (e: FormEvent) => { e.preventDefault(); if (placeQ.trim().length < 2) return; setPlaceBusy(true); try { setPlaces(await searchPlaces(placeQ, settings.language)); } catch { setPlaces([]); } finally { setPlaceBusy(false); } };
    return (
      <section className="screen onboarding">
        <div className="dots">{Array.from({ length: total }, (_, i) => <span key={i} className={i === step ? "on" : ""} />)}</div>
        <h1>{t("onboarding.extrasTitle")}</h1>
        <p className="muted">{t("onboarding.extrasBody")}</p>
        <label className="check"><input type="checkbox" checked={wantCycle} onChange={(e) => setWantCycle(e.target.checked)} /> {t("settings.cycleTracking")} <span className="pill pro">PRO</span></label>
        <small className="muted" style={{ display: "block", marginTop: -4, marginBottom: 10 }}>{t("settings.cycleHint")}</small>
        <div className="field"><span>{t("weather.title")} <span className="pill pro">PRO</span></span>
          {place ? (
            <div className="card"><div><strong>{place.name}</strong><div className="muted small">{[place.admin, place.country].filter(Boolean).join(", ")}</div></div><button type="button" className="ghost" onClick={() => { setPlace(null); setPlaces([]); }}>{t("weather.changePlace")}</button></div>
          ) : (
            <>
              <form className="row tight" onSubmit={search}>
                <input style={{ flex: 1 }} value={placeQ} onChange={(e) => setPlaceQ(e.target.value)} placeholder={t("weather.placePh")} />
                <button type="submit" className="ghost" disabled={placeBusy}>{t("common.search")}</button>
              </form>
              {places.length > 0 && <ul className="list" style={{ marginTop: 8 }}>{places.map((p, i) => <li key={i} className="tap" onClick={() => { setPlace(p); setPlaces([]); haptics.tap(); }}><div><strong>{p.name}</strong><small>{[p.admin, p.country].filter(Boolean).join(", ")}</small></div><span className="muted">›</span></li>)}</ul>}
            </>
          )}
          <small className="muted">{t("weather.hint")}</small>
        </div>
        {ios && (
          <>
            <label className="check"><input type="checkbox" checked={wantHealth} onChange={(e) => setWantHealth(e.target.checked)} /> {t("health.title")} <span className="pill pro">PRO</span></label>
            <small className="muted" style={{ display: "block", marginTop: -4 }}>{t("health.hint")}</small>
          </>
        )}
        <p className="muted small" style={{ marginTop: 12 }}>{t("onboarding.extrasNote")}</p>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="cta" onClick={() => void finish()}>{t("onboarding.start")}</button>
        </div>
      </section>
    );
  }

  if (step === SETUP) {
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
          <button className="cta" onClick={next}>{t("onboarding.next")}</button>
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
        <button className="ghost" onClick={() => setStep(SETUP)}>{t("onboarding.skip")}</button>
        <button className="cta" onClick={next}>{t("onboarding.next")}</button>
      </div>
    </section>
  );
}
