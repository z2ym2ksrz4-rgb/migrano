import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  openEpisode, startEpisode, listEpisodes, episodeDays, medicationDays, monthRange, getCheckin, setCheckin, diaryConfig, daysSinceLastEpisode,
  type Episode, type DailyCheckin, type CheckinStatus,
} from "@/core/diary";
import { haptics, fmtDateTime, fmtTime, localDay, hours } from "@/core/ui";
import { useSettings } from "@/core/settings";
import { usePurchases } from "@/core/purchases";
import { useUi } from "../store";
import { PainStar } from "../components/PainStar";
import { publishWidget } from "../widget";

export function Home() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const version = useUi((s) => s.version);
  const openSheet = useUi((s) => s.openEpisode);
  const openInfo = useUi((s) => s.openInfo);
  const bump = useUi((s) => s.bump);
  const isPro = usePurchases((s) => s.isPro);
  const threshold = useSettings((s) => s.medThreshold);
  const userName = useSettings((s) => s.userName);
  const cycleTracking = useSettings((s) => s.cycleTracking);
  const [open, setOpen] = useState<Episode | null>(null);
  const [recent, setRecent] = useState<Episode[]>([]);
  const [stats, setStats] = useState({ attackDays: 0, medDays: 0, episodes: 0 });
  const [streak, setStreak] = useState<number | null>(null);
  const [today, setToday] = useState<DailyCheckin | null>(null);
  const [editing, setEditing] = useState(false);
  // draft check-in: written only on "Save the day"
  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [extra, setExtra] = useState<Record<string, number | boolean>>({});
  const day = localDay();

  const load = useCallback(async () => {
    const { fromIso, toIso } = monthRange();
    const o = await openEpisode(); setOpen(o);
    setRecent((await listEpisodes()).slice(0, 5));
    const eps = await listEpisodes(fromIso, toIso);
    const st = { attackDays: await episodeDays(fromIso, toIso), medDays: await medicationDays(fromIso, toIso), episodes: eps.length };
    setStats(st);
    const ds = await daysSinceLastEpisode(); setStreak(ds);
    const c = await getCheckin(day); setToday(c);
    if (c) { setStatus(c.status); setExtra(c.extra ? (JSON.parse(c.extra) as Record<string, number | boolean>) : {}); }
    else { setStatus(o ? "attack" : null); setExtra({}); }
    void publishWidget({ open: !!o, daysSince: ds, attackDays: st.attackDays, medDays: st.medDays, t });
  }, [day, t]);
  useEffect(() => { void load(); }, [load, version]);

  const onAttackNow = async () => { const e = await startEpisode(); haptics.thud(); bump(); openSheet(e.id, "quick"); };
  const saveDay = async () => {
    await setCheckin(day, status ?? (open ? "attack" : "none"), extra, today?.note ?? null);
    haptics.success(); setEditing(false); bump();
  };
  const warn = isPro && stats.medDays >= threshold;
  const saved = !!today && !editing;
  const fields = diaryConfig().checkinFields;
  const summary = () => {
    const parts = [t(`home.checkin.${today?.status ?? "none"}`)];
    for (const f of fields) if (typeof extra[f.key] === "number") parts.push(`${t(`home.fields.${f.key}`)} ${extra[f.key]}`);
    if (extra.period) parts.push(t("home.periodShort"));
    return parts.join(" · ");
  };

  return (
    <section className="screen">
      <div className="hero">
        <p className="eyebrow">{new Date().toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1>{userName ? t("home.greeting", { name: userName }) : t("home.title")}</h1>
      </div>

      <div className="hero-btn-wrap">
        {open ? (
          <button className="hero-btn live" onClick={() => openSheet(open.id, "full")} aria-label={t("home.openSince", { time: fmtTime(open.startedAt, lang) })}>
            <PainStar size={56} />
          </button>
        ) : (
          <button className="hero-btn" onClick={onAttackNow} aria-label={t("home.attackNow")}>
            <PainStar size={56} />
          </button>
        )}
        <div className="hero-lbl">
          {open ? <><strong>{t("home.openSince", { time: fmtTime(open.startedAt, lang) })}</strong><span className="muted small">{t("home.tapToEdit")}</span></>
            : <><strong>{t("home.attackNow")}</strong><span className="muted small">{t("home.attackHint")}</span></>}
        </div>
      </div>

      {warn && (
        <div className="card warn col">
          <strong>{t("home.medWarnTitle", { n: stats.medDays })}</strong>
          <span className="small">{t("home.medWarnBody", { n: threshold })}</span>
        </div>
      )}

      <div className="stats">
        <div className="stat"><div className="n">{stats.attackDays}</div><div className="l">{t("home.attackDays")}</div></div>
        <button type="button" className={`stat tap ${warn ? "warn" : ""}`} onClick={() => openInfo("medDays")}>
          <div className="n">{stats.medDays}</div><div className="l">{t("home.medDays")} <i className="info">i</i></div>
        </button>
        {streak != null && !open && (
          <div className="stat ok" style={{ gridColumn: "1 / -1" }}>
            <div className="n">{streak}</div><div className="l">{t("home.streak", { count: streak })}</div>
          </div>
        )}
      </div>

      <h2>{t("home.checkinTitle")}</h2>
      {saved ? (
        <div className="card">
          <div><strong>{t("home.savedDay")}</strong><div className="muted small">{summary()}</div></div>
          <button className="ghost" onClick={() => setEditing(true)}>{t("common.edit")}</button>
        </div>
      ) : (
        <div className="card col checkin-card">
          <div className="checkin">
            {(["none", "mild", "attack"] as CheckinStatus[]).map((s) => (
              <button key={s} className={status === s ? `on ${s}` : ""} onClick={() => { setStatus(s); haptics.tap(); }}>{t(`home.checkin.${s}`)}</button>
            ))}
          </div>
          {fields.map((f) => (
            <div className="field" key={f.key}>
              <span>{t(`home.fields.${f.key}`)}</span>
              <div className="scale">
                {Array.from({ length: f.max }, (_, i) => i + 1).map((v) => (
                  <button key={v} className={extra[f.key] === v ? "on" : ""} onClick={() => setExtra({ ...extra, [f.key]: v })}>{v}</button>
                ))}
              </div>
            </div>
          ))}
          {cycleTracking && (
            <button type="button" className={`chip ${extra.period ? "on" : ""}`} style={{ alignSelf: "flex-start" }} onClick={() => setExtra({ ...extra, period: !extra.period })}>{t("home.periodToday")}</button>
          )}
          <button className="cta" style={{ marginTop: 6 }} disabled={!status} onClick={saveDay}>{t("home.saveDay")}</button>
        </div>
      )}

      <h2>{t("home.recent")}</h2>
      {recent.length === 0 ? <p className="empty">{t("home.empty")}</p> : (
        <ul className="list">
          {recent.map((e) => (
            <li key={e.id} className="tap" onClick={() => openSheet(e.id, "full")}>
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
