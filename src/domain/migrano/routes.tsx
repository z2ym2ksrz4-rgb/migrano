import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  openEpisode, startEpisode, endEpisode, listEpisodes, listTags, medicationDays, episodeDays, monthRange,
  type Episode, type Tag,
} from "@/core/diary";

/**
 * Phase 2 placeholder home: proves engine + seed + i18n end to end (start/stop an attack, see this month's numbers,
 * see seeded tags in the active language). Real screens arrive in phase 3.
 */
export function MigranoRoutes() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<Episode | null>(null);
  const [recent, setRecent] = useState<Episode[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stats, setStats] = useState({ attackDays: 0, medDays: 0 });

  const load = useCallback(async () => {
    const { fromIso, toIso } = monthRange();
    setOpen(await openEpisode());
    setRecent((await listEpisodes()).slice(0, 10));
    setTags(await listTags("trigger"));
    setStats({ attackDays: await episodeDays(fromIso, toIso), medDays: await medicationDays(fromIso, toIso) });
  }, []);
  useEffect(() => { void load(); }, [load]);

  const onAttackNow = async () => { await startEpisode(); await load(); };
  const onEnd = async () => { if (open) { await endEpisode(open.id); await load(); } };

  return (
    <section className="screen">
      <h1>{t("home.title")}</h1>
      {open ? (
        <div className="card">
          <p>{t("home.openSince", { time: new Date(open.startedAt).toLocaleTimeString() })}</p>
          <button onClick={onEnd}>{t("home.endAttack")}</button>
        </div>
      ) : (
        <button className="primary" onClick={onAttackNow}>{t("home.attackNow")}</button>
      )}
      <p>{t("home.monthStats", { attackDays: stats.attackDays, medDays: stats.medDays })}</p>
      <h2>{t("home.recent")}</h2>
      <ul className="list">
        {recent.map((e) => (
          <li key={e.id}>{new Date(e.startedAt).toLocaleString()} {e.endedAt ? "" : `· ${t("home.ongoing")}`}</li>
        ))}
      </ul>
      <h2>{t("diary.groups.trigger")}</h2>
      <div className="chips">
        {tags.filter((x) => !x.isHidden).map((x) => (
          <span key={x.id} className="chip">{x.labelKey ? t(x.labelKey) : x.label}</span>
        ))}
      </div>
    </section>
  );
}
