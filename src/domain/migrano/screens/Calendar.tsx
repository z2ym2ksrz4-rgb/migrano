import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { listEpisodes, listCheckins, diaryConfig, type Episode, type DailyCheckin } from "@/core/diary";
import { fmtTime, localDay, hours } from "@/core/ui";
import { useProGate } from "@/core/purchases";
import { useUi } from "../store";

/** Month heatmap: colour = worst intensity that day (1–10 → 4 steps); check-in "mild" days get their own tint. */
export function Calendar() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const version = useUi((s) => s.version);
  const openSheet = useUi((s) => s.openEpisode);
  const gate = useProGate();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [eps, setEps] = useState<Episode[]>([]);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [sel, setSel] = useState<string | null>(null);

  const cursorKey = cursor.getTime();
  const { first, last } = useMemo(() => ({ first: new Date(cursorKey), last: new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0) }), [cursorKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    const from = new Date(first.getFullYear(), first.getMonth(), 1 - 7).toISOString();
    const to = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1).toISOString();
    setEps(await listEpisodes(from, to));
    setCheckins(await listCheckins(localDay(first), localDay(last)));
  }, [first, last]);
  useEffect(() => { void load(); }, [load, version]);

  const byDay = useMemo(() => {
    const m = new Map<string, { max: number; eps: Episode[]; checkin?: DailyCheckin }>();
    for (const e of eps) {
      const start = new Date(e.startedAt), end = new Date(e.endedAt ?? new Date().toISOString());
      for (let d = new Date(start.getFullYear(), start.getMonth(), start.getDate()); d <= end; d.setDate(d.getDate() + 1)) {
        const k = localDay(d); const cur = m.get(k) ?? { max: 0, eps: [] };
        cur.max = Math.max(cur.max, e.intensity ?? 5); if (!cur.eps.includes(e)) cur.eps.push(e); m.set(k, cur);
      }
    }
    for (const c of checkins) { const cur = m.get(c.date) ?? { max: 0, eps: [] }; cur.checkin = c; m.set(c.date, cur); }
    return m;
  }, [eps, checkins]);

  const freeFloor = new Date(); freeFloor.setDate(freeFloor.getDate() - diaryConfig().freeHistoryDays);
  const monthLocked = !gate.isPro && last < freeFloor;
  const go = (delta: number) => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
    const nextLast = new Date(next.getFullYear(), next.getMonth() + 1, 0);
    if (!gate.isPro && nextLast < freeFloor && !gate.allow("history")) return;
    setCursor(next); setSel(null);
  };
  const dow = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, i + 1).toLocaleDateString(lang, { weekday: "short" }).slice(0, 2)); // Mon-first
  const lead = (first.getDay() + 6) % 7;
  const today = localDay();
  const cls = (k: string) => {
    const d = byDay.get(k); if (!d) return "";
    if (d.eps.length) return `h${Math.min(4, Math.ceil(d.max / 2.5))}`;
    return d.checkin?.status === "mild" ? "mild" : d.checkin?.status === "attack" ? "h2" : "";
  };
  const selData = sel ? byDay.get(sel) : undefined;

  return (
    <section className="screen">
      <div className="cal-head">
        <button onClick={() => go(-1)} aria-label="prev">‹</button>
        <h1>{cursor.toLocaleDateString(lang, { month: "long", year: "numeric" })}</h1>
        <button onClick={() => go(1)} aria-label="next">›</button>
      </div>
      <div className="cal">
        {dow.map((d, i) => <div key={i} className="dow">{d}</div>)}
        {Array.from({ length: lead }, (_, i) => <div key={`b${i}`} className="day blank" />)}
        {Array.from({ length: last.getDate() }, (_, i) => {
          const k = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
          return (
            <button key={k} className={`day ${cls(k)} ${k === today ? "today" : ""} ${sel === k ? "sel" : ""} ${monthLocked ? "locked" : ""}`}
              onClick={() => { if (monthLocked && !gate.allow("history")) return; setSel(sel === k ? null : k); }}>{i + 1}</button>
          );
        })}
      </div>
      <div className="legend">
        <span><i style={{ background: "var(--heat-mild)" }} />{t("home.checkin.mild")}</span>
        <span><i style={{ background: "var(--heat-1)" }} />1–2</span><span><i style={{ background: "var(--heat-2)" }} />3–5</span>
        <span><i style={{ background: "var(--heat-3)" }} />6–7</span><span><i style={{ background: "var(--heat-4)" }} />8–10</span>
      </div>

      {sel && (
        <>
          <h2>{new Date(sel + "T12:00:00").toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" })}</h2>
          {selData?.checkin && <p className="muted small">{t("home.checkinTitle")}: {t(`home.checkin.${selData.checkin.status}`)}</p>}
          {!selData?.eps.length ? <p className="empty">{t("calendar.noAttacks")}</p> : (
            <ul className="list">
              {selData.eps.map((e) => (
                <li key={e.id} className="tap" onClick={() => openSheet(e.id)}>
                  <div><strong>{fmtTime(e.startedAt, lang)}{e.endedAt ? ` – ${fmtTime(e.endedAt, lang)}` : ""}</strong>
                    <small>{e.endedAt ? t("episode.duration", { h: hours(e.startedAt, e.endedAt).toFixed(1) }) : t("home.ongoing")}{e.intensity ? ` · ${e.intensity}/10` : ""}</small></div>
                  <span className="muted">›</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
