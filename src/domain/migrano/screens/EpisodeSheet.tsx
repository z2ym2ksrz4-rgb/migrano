import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  listEpisodes, updateEpisode, endEpisode, deleteEpisode, listTags, episodeTagIds, setEpisodeTags,
  listMedications, listIntakes, logIntake, deleteIntake, diaryConfig, type Episode, type Tag, type Medication, type Intake,
} from "@/core/diary";
import { Sheet, haptics, fmtTime, toLocalInput, fromLocalInput, hours } from "@/core/ui";
import { useSettings } from "@/core/settings";
import { maybeAskForReview } from "@/core/review";
import { TagPicker } from "../components/TagPicker";
import { useUi } from "../store";

/**
 * The attack sheet. Opens right after "Attack now" with only the clock running; everything else is optional and
 * can be filled in later (during an attack nobody wants a form). Writes happen immediately on every change.
 */
export function EpisodeSheet() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const id = useUi((s) => s.episodeSheetId);
  const close = useUi((s) => s.closeEpisode);
  const bump = useUi((s) => s.bump);
  const settings = useSettings();
  const [ep, setEp] = useState<Episode | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [meds, setMeds] = useState<Medication[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const e = (await listEpisodes()).find((x) => x.id === id) ?? null;
    setEp(e); setNote(e?.note ?? "");
    setTags(await listTags()); setSel(new Set(await episodeTagIds(id)));
    setMeds(await listMedications()); setIntakes(await listIntakes(id));
  }, [id]);
  useEffect(() => { void load(); setConfirmDelete(false); }, [load]);

  if (!id || !ep) return null;
  const groups = diaryConfig().tagGroups;
  const patch = async (p: Parameters<typeof updateEpisode>[1]) => { await updateEpisode(ep.id, p); setEp({ ...ep, ...p } as Episode); bump(); };
  const onTags = async (n: Set<string>) => { setSel(n); await setEpisodeTags(ep.id, [...n]); bump(); };
  const onEnd = async () => {
    await endEpisode(ep.id); haptics.success();
    await settings.set("successEvents", settings.successEvents + 1); void maybeAskForReview();
    bump(); await load();
  };
  const onIntake = async (m: Medication) => { await logIntake(m.id, ep.id); haptics.tap(); setIntakes(await listIntakes(ep.id)); bump(); };
  const onDelete = async () => { await deleteEpisode(ep.id); bump(); close(); };
  const dur = ep.endedAt ? hours(ep.startedAt, ep.endedAt) : null;

  return (
    <Sheet open onClose={close} title={ep.endedAt ? t("episode.title") : t("episode.ongoing")} tall>
      {!ep.endedAt && <button className="cta" style={{ marginTop: 0 }} onClick={onEnd}>{t("home.endAttack")}</button>}

      <div className="row">
        <label className="field"><span>{t("episode.start")}</span>
          <input type="datetime-local" value={toLocalInput(ep.startedAt)} onChange={(e) => e.target.value && patch({ startedAt: fromLocalInput(e.target.value) })} />
        </label>
        {ep.endedAt && (
          <label className="field"><span>{t("episode.end")}</span>
            <input type="datetime-local" value={toLocalInput(ep.endedAt)} onChange={(e) => e.target.value && patch({ endedAt: fromLocalInput(e.target.value) })} />
          </label>
        )}
      </div>
      {dur != null && <p className="muted small">{t("episode.duration", { h: dur.toFixed(1) })}</p>}

      <div className="field">
        <span>{t("episode.intensity")} {ep.intensity ? `· ${ep.intensity}/10` : ""}</span>
        <input type="range" min={1} max={10} step={1} value={ep.intensity ?? 5} onChange={(e) => patch({ intensity: Number(e.target.value) })} />
        <div className="row between small muted"><span>{t("episode.mildLbl")}</span><span>{t("episode.severeLbl")}</span></div>
      </div>

      {groups.map((g) => (
        <TagPicker key={g.key} groupKey={g.key} tags={tags.filter((x) => x.groupKey === g.key)} selected={sel} onChange={onTags} onTagAdded={async () => setTags(await listTags())} />
      ))}

      <div className="field">
        <span>{t("meds.title")}</span>
        {meds.length === 0 ? (
          <button type="button" className="ghost" onClick={() => useUi.getState().setMedsOpen(true)}>{t("meds.addFirst")}</button>
        ) : (
          <div className="chips">
            {meds.map((m) => <button type="button" key={m.id} className="chip" onClick={() => onIntake(m)}>+ {m.name}</button>)}
          </div>
        )}
        {intakes.length > 0 && (
          <ul className="list" style={{ margin: "6px 0 0" }}>
            {intakes.map((i) => (
              <li key={i.id} className="tap" style={{ padding: "10px 14px" }}>
                <span>{i.name} <span className="muted small">{fmtTime(i.takenAt, lang)}</span></span>
                <button type="button" className="small ghost danger" onClick={async () => { await deleteIntake(i.id); setIntakes(await listIntakes(ep.id)); bump(); }}>×</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <label className="field"><span>{t("episode.note")}</span>
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => patch({ note: note.trim() || null })} placeholder={t("episode.notePh")} />
      </label>

      <div className="row between" style={{ marginTop: 18 }}>
        {confirmDelete
          ? <button type="button" className="ghost danger" onClick={onDelete}>{t("episode.deleteConfirm")}</button>
          : <button type="button" className="linklike" onClick={() => setConfirmDelete(true)}>{t("common.delete")}</button>}
        <button type="button" onClick={close}>{t("common.done")}</button>
      </div>
    </Sheet>
  );
}
