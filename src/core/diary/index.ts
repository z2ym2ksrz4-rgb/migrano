import { getDb, dbWrite, newId, nowIso } from "@/core/db";
import type { DiaryConfig, Episode, Tag, Medication, DailyCheckin, CheckinStatus } from "./types";

export * from "./types";
export { diaryMigrations } from "./migrations";
export { seedMigration } from "./seed";

let config: DiaryConfig | null = null;
/** Called once by the domain before any screen renders. */
export function configureDiary(c: DiaryConfig) { config = c; }
export function diaryConfig(): DiaryConfig {
  if (!config) throw new Error("configureDiary() not called");
  return config;
}

const q = async <T,>(sql: string, params: unknown[] = []) => ((await getDb().query(sql, params)).values ?? []) as T[];

// ---- episodes -------------------------------------------------------------

export async function openEpisode(): Promise<Episode | null> {
  const rows = await q<Episode>(`SELECT * FROM episode WHERE endedAt IS NULL ORDER BY startedAt DESC LIMIT 1`);
  return rows[0] ?? null;
}

/** Starts a new open episode (the "attack now" button). Returns the existing one if one is already open. */
export async function startEpisode(startedAt = nowIso()): Promise<Episode> {
  const open = await openEpisode();
  if (open) return open;
  const id = newId(), now = nowIso();
  await dbWrite(`INSERT INTO episode(id,kind,startedAt,createdAt,updatedAt) VALUES(?,?,?,?,?)`, [id, diaryConfig().episodeKind, startedAt, now, now]);
  return (await q<Episode>(`SELECT * FROM episode WHERE id=?`, [id]))[0];
}

export async function endEpisode(id: string, endedAt = nowIso()) {
  await dbWrite(`UPDATE episode SET endedAt=?, updatedAt=? WHERE id=?`, [endedAt, nowIso(), id]);
}

export async function updateEpisode(id: string, patch: Partial<Pick<Episode, "startedAt" | "endedAt" | "intensity" | "note" | "extra">>) {
  const keys = Object.keys(patch) as (keyof typeof patch)[];
  if (!keys.length) return;
  const sets = keys.map((k) => `${k}=?`).join(", ");
  await dbWrite(`UPDATE episode SET ${sets}, updatedAt=? WHERE id=?`, [...keys.map((k) => patch[k] ?? null), nowIso(), id]);
}

export async function deleteEpisode(id: string) {
  await dbWrite(`DELETE FROM episodeTag WHERE episodeId=?`, [id]);
  await dbWrite(`DELETE FROM episode WHERE id=?`, [id]);
}

export async function listEpisodes(fromIso?: string, toIso?: string): Promise<Episode[]> {
  const where: string[] = [], params: unknown[] = [];
  if (fromIso) { where.push(`startedAt >= ?`); params.push(fromIso); }
  if (toIso) { where.push(`startedAt < ?`); params.push(toIso); }
  return q<Episode>(`SELECT * FROM episode ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY startedAt DESC`, params);
}

// ---- tags -----------------------------------------------------------------

export async function listTags(groupKey?: string): Promise<Tag[]> {
  return q<Tag>(
    `SELECT t.*, g.key AS groupKey FROM tag t JOIN tagGroup g ON g.id=t.groupId
     ${groupKey ? "WHERE g.key=?" : ""} ORDER BY g.sort, t.sort, t.label`,
    groupKey ? [groupKey] : [],
  );
}

export async function episodeTagIds(episodeId: string): Promise<string[]> {
  return (await q<{ tagId: string }>(`SELECT tagId FROM episodeTag WHERE episodeId=?`, [episodeId])).map((r) => r.tagId);
}

export async function setEpisodeTags(episodeId: string, tagIds: string[]) {
  const current = new Set(await episodeTagIds(episodeId));
  const wanted = new Set(tagIds);
  for (const id of current) if (!wanted.has(id)) await dbWrite(`DELETE FROM episodeTag WHERE episodeId=? AND tagId=?`, [episodeId, id]);
  for (const id of wanted) if (!current.has(id)) await dbWrite(`INSERT OR IGNORE INTO episodeTag(id,episodeId,tagId,updatedAt) VALUES(?,?,?,?)`, [newId(), episodeId, id, nowIso()]);
  await dbWrite(`UPDATE episode SET updatedAt=? WHERE id=?`, [nowIso(), episodeId]);
}

/** "Other…" → a user tag in that group. */
export async function addUserTag(groupKey: string, label: string): Promise<Tag> {
  const g = (await q<{ id: string }>(`SELECT id FROM tagGroup WHERE key=?`, [groupKey]))[0];
  if (!g) throw new Error(`unknown tag group ${groupKey}`);
  const id = newId();
  const key = `user_${id.slice(0, 8)}`;
  await dbWrite(`INSERT INTO tag(id,groupId,key,labelKey,label,isSystem,isHidden,sort,updatedAt) VALUES(?,?,?,NULL,?,0,0,999,?)`, [id, g.id, key, label.trim(), nowIso()]);
  return (await listTags(groupKey)).find((t) => t.id === id)!;
}

export async function setTagHidden(tagId: string, hidden: boolean) {
  await dbWrite(`UPDATE tag SET isHidden=?, updatedAt=? WHERE id=?`, [hidden ? 1 : 0, nowIso(), tagId]);
}

// ---- medication -----------------------------------------------------------

export async function listMedications(includeHidden = false): Promise<Medication[]> {
  return q<Medication>(`SELECT * FROM medication ${includeHidden ? "" : "WHERE isHidden=0"} ORDER BY sort, name`);
}

export async function addMedication(name: string, kind: Medication["kind"] = "acute", unit: string | null = null): Promise<string> {
  const id = newId();
  await dbWrite(`INSERT INTO medication(id,name,kind,unit,isHidden,sort,updatedAt) VALUES(?,?,?,?,0,0,?)`, [id, name.trim(), kind, unit, nowIso()]);
  return id;
}

export async function logIntake(medicationId: string, episodeId: string | null, takenAt = nowIso(), amount: number | null = null) {
  await dbWrite(`INSERT INTO medicationIntake(id,episodeId,medicationId,takenAt,amount,updatedAt) VALUES(?,?,?,?,?,?)`, [newId(), episodeId, medicationId, takenAt, amount, nowIso()]);
}

/** Distinct calendar days with at least one acute intake in [fromIso, toIso). The number the warning compares against. */
export async function medicationDays(fromIso: string, toIso: string): Promise<number> {
  const rows = await q<{ n: number }>(
    `SELECT COUNT(DISTINCT substr(i.takenAt,1,10)) AS n FROM medicationIntake i JOIN medication m ON m.id=i.medicationId
     WHERE m.kind='acute' AND i.takenAt >= ? AND i.takenAt < ?`,
    [fromIso, toIso],
  );
  return rows[0]?.n ?? 0;
}

// ---- daily check-in -------------------------------------------------------

export async function getCheckin(date: string): Promise<DailyCheckin | null> {
  return (await q<DailyCheckin>(`SELECT * FROM dailyCheckin WHERE date=?`, [date]))[0] ?? null;
}

export async function setCheckin(date: string, status: CheckinStatus, extra: Record<string, unknown> | null = null, note: string | null = null) {
  const existing = await getCheckin(date);
  if (existing) {
    await dbWrite(`UPDATE dailyCheckin SET status=?, extra=?, note=?, updatedAt=? WHERE id=?`, [status, extra ? JSON.stringify(extra) : null, note, nowIso(), existing.id]);
  } else {
    await dbWrite(`INSERT INTO dailyCheckin(id,date,status,extra,note,updatedAt) VALUES(?,?,?,?,?,?)`, [newId(), date, status, extra ? JSON.stringify(extra) : null, note, nowIso()]);
  }
}

export async function listCheckins(fromDate: string, toDate: string): Promise<DailyCheckin[]> {
  return q<DailyCheckin>(`SELECT * FROM dailyCheckin WHERE date >= ? AND date <= ? ORDER BY date`, [fromDate, toDate]);
}

// ---- stats (descriptive only) --------------------------------------------

/** Distinct calendar days touched by an episode in [fromIso, toIso) — multi-day episodes count every day. */
export async function episodeDays(fromIso: string, toIso: string): Promise<number> {
  const eps = await listEpisodes(fromIso, toIso);
  const days = new Set<string>();
  for (const e of eps) {
    const start = new Date(e.startedAt), end = new Date(e.endedAt ?? nowIso());
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.add(d.toISOString().slice(0, 10));
  }
  return days.size;
}

export const monthRange = (d = new Date()) => {
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { fromIso: from.toISOString(), toIso: to.toISOString() };
};
