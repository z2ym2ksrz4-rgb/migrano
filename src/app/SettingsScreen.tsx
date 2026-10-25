import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/core/settings";
import { SUPPORTED, type Lang } from "@/core/i18n";
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
  const [pin1, setPin1] = useState(""); const [pin2, setPin2] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState(""); const [importPass, setImportPass] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const toast = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2500); };

  const savePin = async () => {
    if (pin1.length < 4 || pin1 !== pin2) { toast(t("settings.pinMismatch")); return; }
    await s.set("pinHash", await sha256(pin1)); setPinOpen(false); setPin1(""); setPin2(""); toast(t("settings.pinSet"));
  };
  const facts = `${appConfig.appName} ${appVersion} · ${navigator.platform} · ${i18n.language}`;

  return (
    <section className="screen">
      <h1>{t("nav.settings")}</h1>

      <div className="card">
        <div><strong>{isPro ? t("plan.pro") : t("plan.free")}</strong><div className="muted small">{isPro ? t("settings.proThanks") : t("settings.freeHint")}</div></div>
        {!isPro ? <button onClick={() => showPaywall("settings")}>{t("plan.upgrade")}</button> : <span className="pill pro">PRO</span>}
      </div>

      <h2>{t("settings.diary")}</h2>
      <div className="card"><span>{t("meds.title")}</span><button className="ghost" onClick={() => setMedsOpen(true)}>{t("settings.manage")}</button></div>
      <label className="field"><span>{t("settings.medThreshold")}</span>
        <div className="segment">
          {diaryConfig().medicationDayThresholds.map((n) => <button key={n} className={s.medThreshold === n ? "active" : ""} onClick={() => s.set("medThreshold", n)}>{t("settings.daysPerMonth", { n })}</button>)}
        </div>
        <small className="muted">{t("settings.medThresholdHint")}</small>
      </label>

      <h2>{t("settings.reminders")}</h2>
      <label className="check"><input type="checkbox" checked={s.checkinReminder} onChange={(e) => s.set("checkinReminder", e.target.checked)} /> {t("settings.checkinReminder")}</label>
      {s.checkinReminder && (
        <label className="field"><span>{t("settings.reminderTime")}</span>
          <input type="time" value={`${String(s.dailyReminderHour).padStart(2, "0")}:00`} step={3600} onChange={(e) => e.target.value && s.set("dailyReminderHour", Number(e.target.value.slice(0, 2)))} />
        </label>
      )}
      <label className="check"><input type="checkbox" checked={s.openEpisodeReminder} onChange={(e) => s.set("openEpisodeReminder", e.target.checked)} /> {t("settings.openEpisodeReminder")}</label>

      <h2>{t("settings.privacy")}</h2>
      <div className="card">
        <div><strong>{t("settings.pin")}</strong><div className="muted small">{s.pinHash ? t("settings.pinOn") : t("settings.pinOff")}</div></div>
        {s.pinHash
          ? <button className="ghost" onClick={() => { void s.set("pinHash", null); toast(t("settings.pinRemoved")); }}>{t("settings.pinRemove")}</button>
          : <button className="ghost" onClick={() => { if (gate.allow("pin")) setPinOpen(true); }}>{t("settings.pinSetup")}</button>}
      </div>
      <label className="field"><span>{t("settings.language")}</span>
        <select value={s.language} onChange={async (e) => { const l = e.target.value as Lang; await s.set("language", l); await i18n.changeLanguage(l); }}>
          {SUPPORTED.map((l) => <option key={l} value={l}>{t(`lang.${l}`)}</option>)}
        </select>
      </label>

      <h2>{t("settings.data")}</h2>
      <div className="stack">
        <button className="ghost" onClick={() => { if (!gate.allow("backup")) return; const p = prompt(t("backup.passphrase")); if (p) void exportBackup(p).then(() => toast(t("backup.exported"))); }}>{t("backup.export")}</button>
        <button className="ghost" onClick={() => { if (gate.allow("backup")) setImportOpen(true); }}>{t("backup.import")}</button>
        <button className="ghost danger" onClick={async () => { if (!confirm(t("backup.wipeConfirm"))) return; await wipeAllData(); alert(t("backup.wiped")); location.reload(); }}>{t("backup.wipe")}</button>
      </div>
      <p className="muted small">{t("settings.dataNote")}</p>

      <h2>{t("settings.about")}</h2>
      <div className="stack">
        <a className="ghost btn-like" style={{ display: "block", padding: 12, borderRadius: 12, textDecoration: "none", textAlign: "center" }} href={`mailto:${appConfig.supportEmail}?subject=${encodeURIComponent(`Feedback ${facts}`)}&body=${encodeURIComponent(`\n\n—\n${facts}`)}`}>{t("settings.feedback")}</a>
        <button className="linklike" onClick={() => void restore().then(() => toast(t("settings.restored")))}>{t("paywall.restore")}</button>
      </div>
      <p className="muted small">
        <a href={appConfig.privacyUrl}>{t("settings.privacyPolicy")}</a> · <a href={appConfig.termsUrl}>{t("paywall.terms")}</a> · <a href={`mailto:${appConfig.supportEmail}`}>{t("settings.support")}</a>
      </p>
      <p className="disclaimer">{t("common.disclaimer")}</p>
      {appVersion && <p className="muted small">{appConfig.appName} {appVersion}</p>}

      <Sheet open={pinOpen} onClose={() => setPinOpen(false)} title={t("settings.pinSetup")}>
        <p className="muted small">{t("settings.pinHint")}</p>
        <label className="field"><span>{t("settings.pinNew")}</span><input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={pin1} onChange={(e) => setPin1(e.target.value.replace(/\D/g, ""))} /></label>
        <label className="field"><span>{t("settings.pinRepeat")}</span><input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))} /></label>
        <button className="cta" onClick={savePin} disabled={pin1.length < 4}>{t("common.save")}</button>
      </Sheet>
      <Sheet open={importOpen} onClose={() => setImportOpen(false)} title={t("backup.import")}>
        <p className="muted small">{t("backup.importHint")}</p>
        <label className="field"><span>{t("backup.file")}</span><input type="file" accept=".json,.txt,.migrano,*/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void f.text().then(setImportText); }} /></label>
        <label className="field"><span>{t("backup.passphraseShort")}</span><input type="password" value={importPass} onChange={(e) => setImportPass(e.target.value)} /></label>
        <button className="cta" disabled={!importText || !importPass} onClick={async () => { try { await importBackup(importText, importPass); setImportOpen(false); toast(t("backup.imported")); useUi.getState().bump(); } catch { toast(t("backup.importFailed")); } }}>{t("backup.import")}</button>
      </Sheet>
      {msg && <div className="toast">{msg}</div>}
    </section>
  );
}
