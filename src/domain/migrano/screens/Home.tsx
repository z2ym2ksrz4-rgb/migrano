import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  openEpisode, startEpisode, listEpisodes, episodeDays, medicationDays, monthRange, getCheckin, setCheckin, diaryConfig,
  type Episode, type DailyCheckin, type CheckinStatus,
} from "@/core/diary";
import { haptics, fmtDateTime, fmtTime, localDay, hours } from "@/core/ui";
import { useSettings } from "@/core/settings";
import { usePurchases } from "@/core/purchases";
import { useUi } from "../store";

export function Home() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const version = useUi((s) => s.version);
  const openSheet = useUi((s) => s.openEpisode);
  const bump = useUi((s) => s.bump);
  const isPro = usePurchases((s) => s.isPro);
  const threshold = useSettings((s) => s.medThreshold);
  const [open, setOpen] = useState<Episode | null>(null);
  const [recent, setRecent] = useState<Episode[]>([]);
  const [stats, setStats] = useState({ attackDays: 0, medDays: 0, episodes: 0 });
  const [today, setToday] = useState<DailyCheckin | null>(null);
  const [extra, setExtra] = useState<Record<string, number>>({});
  const day = localDay();

  const load = useCallback(async () => {
    const { fromIso, toIso } = monthRange();
    setOpen(await openEpisode());
    setRecent((await listEpisodes()).slice(0, 5));
    const eps = await listEpisodes(fromIso, toIso);
    setStats({ attackDays: await episodeDays(fromIso, toIso), medDays: await medicationDays(fromIso, toIso), episodes: eps.length });
    const c = await getCheckin(day); setToday(c);
    setExtra(c?.extra ? (JSON.parse(c.extra) as Record<string, number>) : {});
  }, [day]);
  useEffect(() => { void load(); }, [load, version]);

  const onAttackNow = async () => { const e = await startEpisode(); haptics.thud(); bump(); openSheet(e.id); };
  const onStatus = async (s: CheckinStatus) => { await setCheckin(day, s, extra, today?.note ?? null); haptics.tap(); bump(); };
  const onExtra = async (k: string, v: number) => { const n = { ...extra, [k]: v }; setExtra(n); await setCheckin(day, today?.status ?? "none", n, today?.note ?? null); bump(); };
  const status = today?.status ?? (open ? "attack" : null);
  const warn = isPro && stats.medDays >= threshold;

  return (
    <section className="screen">
      <div className="hero"><p className="eyebrow">{new Date().toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" })}</p><h1>{t("home.title")}</h1></div>

      {open ? (
        <button className="attack-btn live" onClick={() => openSheet(open.id)}>
          {t("home.openSince", { time: fmtTime(open.startedAt, lang) })}<br /><span className="small" style={{ fontFamily: "var(--body)", fontWeight: 500 }}>{t("home.tapToEdit")}</span>
        </button>
      ) : (
        <button className="attack-btn" onClick={onAttackNow}>{t("home.attackNow")}</button>
      )}

      {warn && (
        <div className="card warn col" style={{ marginTop: 12 }}>
          <strong>{t("home.medWarnTitle", { n: stats.medDays })}</strong>
          <span className="small">{t("home.medWarnBody", { n: threshold })}</span>
        </div>
      )}

      <div className="stats">
        <div className="stat"><div className="n">{stats.attackDays}</div><div className="l">{t("home.attackDays")}</div></div>
        <div className={`stat ${warn ? "warn" : ""}`}><div className="n">{stats.medDays}</div><div className="l">{t("home.medDays")}</div></div>
      </div>

      <h2>{t("home.checkinTitle")}</h2>
      <div className="checkin">
        {(["none", "mild", "attack"] as CheckinStatus[]).map((s) => (
          <button key={s} className={status === s ? `on ${s}` : ""} onClick={() => onStatus(s)}>{t(`home.checkin.${s}`)}</button>
        ))}
      </div>
      {diaryConfig().checkinFields.map((f) => (
        <div className="field" key={f.key}>
          <span>{t(`home.fields.${f.key}`)}</span>
          <div className="scale">
            {Array.from({ length: f.max }, (_, i) => i + 1).map((v) => (
              <button key={v} className={extra[f.key] === v ? "on" : ""} onClick={() => onExtra(f.key, v)}>{v}</button>
            ))}
          </div>
        </div>
      ))}

      <h2>{t("home.recent")}</h2>
      {recent.length === 0 ? <p className="empty">{t("home.empty")}</p> : (
        <ul className="list">
          {recent.map((e) => (
            <li key={e.id} className="tap" onClick={() => openSheet(e.id)}>
              <div><strong>{fmtDateTime(e.startedAt, lang)}</strong>
                <small>{e.endedAt ? t("episode.duration", { h: hours(e.startedAt, e.endedAt).toFixed(1) }) : t("home.ongoing")}{e.intensity ? ` · ${e.intensity}/10` : ""}</small></div>
              <span className="muted">›</span>
            </li>
          ))}
        </ul>
      )}
      <p className="disclaimer">{t("common.disclaimer")}</p>
    </section>
  );
}
