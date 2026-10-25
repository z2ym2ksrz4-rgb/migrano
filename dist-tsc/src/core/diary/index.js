import { getDb, dbWrite, newId, nowIso } from "@/core/db";
export * from "./types";
export { diaryMigrations } from "./migrations";
export { seedMigration } from "./seed";
export * from "./weather";
import { pressurePattern } from "./weather";
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
// ---- added for v1.0 feedback round: journey, streak, patterns, comparison ------------------------
/** All-time usage count per tag (for "your most frequent" in the attack journey). */
export async function tagUsage() {
    const rows = await q(`SELECT tagId, COUNT(*) AS n FROM episodeTag GROUP BY tagId`);
    return Object.fromEntries(rows.map((r) => [r.tagId, r.n]));
}
/** Most recent closed episode end (ISO) or null. */
export async function lastEpisodeEnd() {
    const rows = await q(`SELECT endedAt FROM episode WHERE endedAt IS NOT NULL ORDER BY endedAt DESC LIMIT 1`);
    return rows[0]?.endedAt ?? null;
}
/** Whole days since the last episode ended (0 if an episode is open or ended today); null if no episodes at all. */
export async function daysSinceLastEpisode() {
    if (await openEpisode())
        return 0;
    const end = await lastEpisodeEnd();
    if (!end)
        return null;
    const a = new Date(end);
    a.setHours(0, 0, 0, 0);
    const b = new Date();
    b.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((b.getTime() - a.getTime()) / 864e5));
}
/** Medication days for each of the last `months` months, oldest first. */
export async function medDaysByMonth(months = 3) {
    const out = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const { fromIso, toIso } = monthRange(d);
        out.push({ month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, medDays: await medicationDays(fromIso, toIso) });
    }
    return out;
}
/** This episode vs. the average of all other closed episodes (duration, intensity). */
export async function episodeComparison(id) {
    const eps = await listEpisodes();
    const me = eps.find((e) => e.id === id);
    if (!me)
        return null;
    const others = eps.filter((e) => e.id !== id && e.endedAt);
    const dur = (e) => (new Date(e.endedAt).getTime() - new Date(e.startedAt).getTime()) / 36e5;
    const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
    return {
        hours: me.endedAt ? dur(me) : null,
        intensity: me.intensity,
        avgHours: avg(others.map(dur).filter((h) => h >= 0)),
        avgIntensity: avg(others.map((e) => e.intensity).filter((x) => x != null)),
        n: others.length,
    };
}
/**
 * Descriptive patterns only: where do attacks cluster (weekday, time of day) and how did the night before look.
 * No causality claims — the UI phrases everything as "your attacks have often…".
 */
export async function patterns(days = 180) {
    const from = new Date(Date.now() - days * 864e5).toISOString();
    const eps = await listEpisodes(from);
    const checkins = await listCheckins(from.slice(0, 10), new Date().toISOString().slice(0, 10));
    const res = { attacks: eps.length, checkins: checkins.length, weekday: null, timeOfDay: null, fields: [], period: null, pressure: null };
    if (eps.length >= 5) {
        const wd = [0, 0, 0, 0, 0, 0, 0];
        const tod = { night: 0, morning: 0, afternoon: 0, evening: 0 };
        for (const e of eps) {
            const d = new Date(e.startedAt);
            wd[d.getDay()]++;
            const h = d.getHours();
            tod[h < 6 ? "night" : h < 12 ? "morning" : h < 18 ? "afternoon" : "evening"]++;
        }
        const bestWd = wd.indexOf(Math.max(...wd));
        if (wd[bestWd] / eps.length >= 0.3)
            res.weekday = { day: bestWd, share: wd[bestWd] / eps.length };
        const parts = Object.entries(tod);
        const bestTod = parts.sort((a, b) => b[1] - a[1])[0];
        if (bestTod[1] / eps.length >= 0.4)
            res.timeOfDay = { part: bestTod[0], share: bestTod[1] / eps.length };
    }
    if (checkins.length >= 14 && eps.length >= 3) {
        const attackDays = new Set(eps.map((e) => e.startedAt.slice(0, 10)));
        const byDate = new Map(checkins.map((c) => [c.date, c]));
        const keys = diaryConfig().checkinFields.map((f) => f.key);
        for (const k of keys) {
            const before = [], calm = [];
            for (const c of checkins) {
                const extra = c.extra ? JSON.parse(c.extra) : {};
                const v = extra[k];
                if (typeof v !== "number")
                    continue;
                const next = new Date(c.date + "T12:00:00");
                next.setDate(next.getDate() + 1);
                const nd = next.toISOString().slice(0, 10);
                (attackDays.has(nd) ? before : calm).push(v);
                void byDate;
            }
            if (before.length >= 3 && calm.length >= 5)
                res.fields.push({ key: k, beforeAttack: before.reduce((a, b) => a + b, 0) / before.length, beforeCalm: calm.reduce((a, b) => a + b, 0) / calm.length, n: before.length });
        }
        const periodDays = new Set(checkins.filter((c) => c.extra && JSON.parse(c.extra).period).map((c) => c.date));
        if (periodDays.size >= 3) {
            const near = (iso) => { const d = new Date(iso.slice(0, 10) + "T12:00:00"); for (const off of [-1, 0, 1]) {
                const x = new Date(d);
                x.setDate(x.getDate() + off);
                if (periodDays.has(x.toISOString().slice(0, 10)))
                    return true;
            } return false; };
            const n = eps.filter((e) => near(e.startedAt)).length;
            res.period = { share: n / eps.length, n };
        }
    }
    res.pressure = await pressurePattern(eps.map((e) => e.startedAt));
    return res;
}
// ---- Apple Health / Health Connect mirror ---------------------------------------------------------------------
/** Closed episodes whose health sample is missing or older than the last edit. */
export async function episodesNeedingHealthSync() {
    return q(`SELECT * FROM episode WHERE endedAt IS NOT NULL AND (healthSyncedAt IS NULL OR healthSyncedAt < updatedAt) ORDER BY startedAt`);
}
export async function markHealthSynced(id, uuid) {
    // does not bump updatedAt on purpose: that would re-trigger the sync and change backup precedence
    await dbWrite(`UPDATE episode SET healthUuid=?, healthSyncedAt=? WHERE id=?`, [uuid, nowIso(), id]);
}
export async function clearHealthSync() {
    await dbWrite(`UPDATE episode SET healthUuid=NULL, healthSyncedAt=NULL`);
}
