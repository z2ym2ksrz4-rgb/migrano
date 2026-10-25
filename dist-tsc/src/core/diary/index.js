import { getDb, dbWrite, newId, nowIso } from "@/core/db";
export * from "./types";
export { diaryMigrations } from "./migrations";
export { seedMigration } from "./seed";
let config = null;
/** Called once by the domain before any screen renders. */
export function configureDiary(c) { config = c; }
export function diaryConfig() {
    if (!config)
        throw new Error("configureDiary() not called");
    return config;
}
const q = async (sql, params = []) => ((await getDb().query(sql, params)).values ?? []);
// ---- episodes -------------------------------------------------------------
export async function openEpisode() {
    const rows = await q(`SELECT * FROM episode WHERE endedAt IS NULL ORDER BY startedAt DESC LIMIT 1`);
    return rows[0] ?? null;
}
/** Starts a new open episode (the "attack now" button). Returns the existing one if one is already open. */
export async function startEpisode(startedAt = nowIso()) {
    const open = await openEpisode();
    if (open)
        return open;
    const id = newId(), now = nowIso();
    await dbWrite(`INSERT INTO episode(id,kind,startedAt,createdAt,updatedAt) VALUES(?,?,?,?,?)`, [id, diaryConfig().episodeKind, startedAt, now, now]);
    return (await q(`SELECT * FROM episode WHERE id=?`, [id]))[0];
}
export async function endEpisode(id, endedAt = nowIso()) {
    await dbWrite(`UPDATE episode SET endedAt=?, updatedAt=? WHERE id=?`, [endedAt, nowIso(), id]);
}
export async function updateEpisode(id, patch) {
    const keys = Object.keys(patch);
    if (!keys.length)
        return;
    const sets = keys.map((k) => `${k}=?`).join(", ");
    await dbWrite(`UPDATE episode SET ${sets}, updatedAt=? WHERE id=?`, [...keys.map((k) => patch[k] ?? null), nowIso(), id]);
}
export async function deleteEpisode(id) {
    await dbWrite(`DELETE FROM episodeTag WHERE episodeId=?`, [id]);
    await dbWrite(`DELETE FROM episode WHERE id=?`, [id]);
}
export async function listEpisodes(fromIso, toIso) {
    const where = [], params = [];
    if (fromIso) {
        where.push(`startedAt >= ?`);
        params.push(fromIso);
    }
    if (toIso) {
        where.push(`startedAt < ?`);
        params.push(toIso);
    }
    return q(`SELECT * FROM episode ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY startedAt DESC`, params);
}
// ---- tags -----------------------------------------------------------------
export async function listTags(groupKey) {
    return q(`SELECT t.*, g.key AS groupKey FROM tag t JOIN tagGroup g ON g.id=t.groupId
     ${groupKey ? "WHERE g.key=?" : ""} ORDER BY g.sort, t.sort, t.label`, groupKey ? [groupKey] : []);
}
export async function episodeTagIds(episodeId) {
    return (await q(`SELECT tagId FROM episodeTag WHERE episodeId=?`, [episodeId])).map((r) => r.tagId);
}
export async function setEpisodeTags(episodeId, tagIds) {
    const current = new Set(await episodeTagIds(episodeId));
    const wanted = new Set(tagIds);
    for (const id of current)
        if (!wanted.has(id))
            await dbWrite(`DELETE FROM episodeTag WHERE episodeId=? AND tagId=?`, [episodeId, id]);
    for (const id of wanted)
        if (!current.has(id))
            await dbWrite(`INSERT OR IGNORE INTO episodeTag(id,episodeId,tagId,updatedAt) VALUES(?,?,?,?)`, [newId(), episodeId, id, nowIso()]);
    await dbWrite(`UPDATE episode SET updatedAt=? WHERE id=?`, [nowIso(), episodeId]);
}
/** "Other…" → a user tag in that group. */
export async function addUserTag(groupKey, label) {
    const g = (await q(`SELECT id FROM tagGroup WHERE key=?`, [groupKey]))[0];
    if (!g)
        throw new Error(`unknown tag group ${groupKey}`);
    const id = newId();
    const key = `user_${id.slice(0, 8)}`;
    await dbWrite(`INSERT INTO tag(id,groupId,key,labelKey,label,isSystem,isHidden,sort,updatedAt) VALUES(?,?,?,NULL,?,0,0,999,?)`, [id, g.id, key, label.trim(), nowIso()]);
    return (await listTags(groupKey)).find((t) => t.id === id);
}
export async function setTagHidden(tagId, hidden) {
    await dbWrite(`UPDATE tag SET isHidden=?, updatedAt=? WHERE id=?`, [hidden ? 1 : 0, nowIso(), tagId]);
}
// ---- medication -----------------------------------------------------------
export async function listMedications(includeHidden = false) {
    return q(`SELECT * FROM medication ${includeHidden ? "" : "WHERE isHidden=0"} ORDER BY sort, name`);
}
export async function addMedication(name, kind = "acute", unit = null) {
    const id = newId();
    await dbWrite(`INSERT INTO medication(id,name,kind,unit,isHidden,sort,updatedAt) VALUES(?,?,?,?,0,0,?)`, [id, name.trim(), kind, unit, nowIso()]);
    return id;
}
export async function listIntakes(episodeId) {
    return q(`SELECT i.*, m.name, m.kind FROM medicationIntake i JOIN medication m ON m.id=i.medicationId WHERE i.episodeId=? ORDER BY i.takenAt`, [episodeId]);
}
export async function deleteIntake(id) { await dbWrite(`DELETE FROM medicationIntake WHERE id=?`, [id]); }
export async function updateMedication(id, patch) {
    const keys = Object.keys(patch);
    if (!keys.length)
        return;
    await dbWrite(`UPDATE medication SET ${keys.map((k) => `${k}=?`).join(", ")}, updatedAt=? WHERE id=?`, [...keys.map((k) => patch[k] ?? null), nowIso(), id]);
}
export async function logIntake(medicationId, episodeId, takenAt = nowIso(), amount = null) {
    await dbWrite(`INSERT INTO medicationIntake(id,episodeId,medicationId,takenAt,amount,updatedAt) VALUES(?,?,?,?,?,?)`, [newId(), episodeId, medicationId, takenAt, amount, nowIso()]);
}
/** Distinct calendar days with at least one acute intake in [fromIso, toIso). The number the warning compares against. */
export async function medicationDays(fromIso, toIso) {
    const rows = await q(`SELECT COUNT(DISTINCT substr(i.takenAt,1,10)) AS n FROM medicationIntake i JOIN medication m ON m.id=i.medicationId
     WHERE m.kind='acute' AND i.takenAt >= ? AND i.takenAt < ?`, [fromIso, toIso]);
    return rows[0]?.n ?? 0;
}
// ---- daily check-in -------------------------------------------------------
export async function getCheckin(date) {
    return (await q(`SELECT * FROM dailyCheckin WHERE date=?`, [date]))[0] ?? null;
}
export async function setCheckin(date, status, extra = null, note = null) {
    const existing = await getCheckin(date);
    if (existing) {
        await dbWrite(`UPDATE dailyCheckin SET status=?, extra=?, note=?, updatedAt=? WHERE id=?`, [status, extra ? JSON.stringify(extra) : null, note, nowIso(), existing.id]);
    }
    else {
        await dbWrite(`INSERT INTO dailyCheckin(id,date,status,extra,note,updatedAt) VALUES(?,?,?,?,?,?)`, [newId(), date, status, extra ? JSON.stringify(extra) : null, note, nowIso()]);
    }
}
export async function listCheckins(fromDate, toDate) {
    return q(`SELECT * FROM dailyCheckin WHERE date >= ? AND date <= ? ORDER BY date`, [fromDate, toDate]);
}
// ---- stats (descriptive only) --------------------------------------------
/** Distinct calendar days touched by an episode in [fromIso, toIso) — multi-day episodes count every day. */
export async function episodeDays(fromIso, toIso) {
    const eps = await listEpisodes(fromIso, toIso);
    const days = new Set();
    for (const e of eps) {
        const start = new Date(e.startedAt), end = new Date(e.endedAt ?? nowIso());
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1))
            days.add(d.toISOString().slice(0, 10));
    }
    return days.size;
}
/** Tag frequency across the episodes in a range: share of episodes carrying each tag, per group. */
export async function tagFrequency(fromIso, toIso) {
    const total = (await q(`SELECT COUNT(*) AS n FROM episode WHERE startedAt >= ? AND startedAt < ?`, [fromIso, toIso]))[0]?.n ?? 0;
    const rows = await q(`SELECT g.key AS groupKey, t.id AS tagId, t.labelKey, t.label, COUNT(*) AS n
     FROM episodeTag et JOIN episode e ON e.id=et.episodeId JOIN tag t ON t.id=et.tagId JOIN tagGroup g ON g.id=t.groupId
     WHERE e.startedAt >= ? AND e.startedAt < ? GROUP BY t.id ORDER BY n DESC`, [fromIso, toIso]);
    return rows.map((r) => ({ ...r, total }));
}
/** Per-month episode counts and attack days for the last `months` months, oldest first. */
export async function monthlySeries(months = 12) {
    const out = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const { fromIso, toIso } = monthRange(d);
        const episodes = (await q(`SELECT COUNT(*) AS n FROM episode WHERE startedAt >= ? AND startedAt < ?`, [fromIso, toIso]))[0]?.n ?? 0;
        out.push({ month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, episodes, attackDays: await episodeDays(fromIso, toIso) });
    }
    return out;
}
export async function episodeSummary(fromIso, toIso) {
    const eps = await listEpisodes(fromIso, toIso);
    const closed = eps.filter((e) => e.endedAt);
    const hours = closed.map((e) => (new Date(e.endedAt).getTime() - new Date(e.startedAt).getTime()) / 36e5).filter((h) => h >= 0);
    const ints = eps.map((e) => e.intensity).filter((x) => x != null);
    return {
        episodes: eps.length,
        attackDays: await episodeDays(fromIso, toIso),
        avgHours: hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : null,
        avgIntensity: ints.length ? ints.reduce((a, b) => a + b, 0) / ints.length : null,
        medDays: await medicationDays(fromIso, toIso),
    };
}
export const monthRange = (d = new Date()) => {
    const from = new Date(d.getFullYear(), d.getMonth(), 1);
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return { fromIso: from.toISOString(), toIso: to.toISOString() };
};
