import { useTranslation } from "react-i18next";
import { useSettings } from "@/core/settings";
import { SUPPORTED, type Lang } from "@/core/i18n";
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
  return (
    <section className="screen">
      <h1>{t("nav.settings")}</h1>
      <div className="card">
        <strong>{isPro ? t("plan.pro") : t("plan.free")}</strong>
        {!isPro && <button onClick={() => showPaywall("settings")}>{t("plan.upgrade")}</button>}
      </div>
      <label>{t("settings.language")}
        <select value={s.language} onChange={async (e) => { const l = e.target.value as Lang; await s.set("language", l); await i18n.changeLanguage(l); }}>
          {SUPPORTED.map((l) => <option key={l} value={l}>{t(`lang.${l}`)}</option>)}
        </select>
      </label>
      <label>{t("settings.dailyReminder")}
        <input type="number" min={0} max={23} value={s.dailyReminderHour} onChange={(e) => s.set("dailyReminderHour", Number(e.target.value))} />
      </label>
      <button onClick={() => { const p = prompt(t("backup.passphrase")); if (p) void exportBackup(p); }}>{t("backup.export")}</button>
      <button className="ghost danger" onClick={async () => { if (!confirm(t("backup.wipeConfirm"))) return; await wipeAllData(); alert(t("backup.wiped")); location.reload(); }}>{t("backup.wipe")}</button>
      <p className="muted">
        <a href={appConfig.privacyUrl}>{t("settings.privacy")}</a> · <a href={`mailto:${appConfig.supportEmail}`}>{t("settings.support")}</a>
      </p>
    </section>
  );
}
