import { getDb, dbWrite, newId, nowIso } from "@/core/db";
/**
 * Air-pressure history for the "weather as trigger" pattern.
 * Source: Open-Meteo (free, no key, no cookies). The user picks a place by name; the app never reads device
 * location. Only the place's coordinates leave the device. Everything else is descriptive statistics on-device.
 */
const q = async (sql, params = []) => ((await getDb().query(sql, params)).values ?? []);
/** Place search (city/town). `lang` picks the localised names where Open-Meteo has them. */
export async function searchPlaces(query, lang = "en") {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=${encodeURIComponent(lang.slice(0, 2))}&format=json`;
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`geocoding ${res.status}`);
    const j = (await res.json());
    return (j.results ?? []).map((r) => ({ name: r.name, admin: r.admin1 ?? null, country: r.country ?? null, lat: r.latitude, lon: r.longitude }));
}
/** Fetch the last `pastDays` days + today and upsert one weatherDay row per local calendar day. */
export async function refreshWeather(lat, lon, pastDays = 7) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&hourly=pressure_msl,temperature_2m&past_days=${pastDays}&forecast_days=1&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`weather ${res.status}`);
    const j = (await res.json());
    const h = j.hourly;
    if (!h)
        return 0;
    const days = new Map();
    h.time.forEach((ts, i) => {
        const d = ts.slice(0, 10);
        const e = days.get(d) ?? { p: [], t: [] };
        const p = h.pressure_msl[i], t = h.temperature_2m[i];
        if (typeof p === "number")
            e.p.push(p);
        if (typeof t === "number")
            e.t.push(t);
        days.set(d, e);
    });
    const today = new Date().toISOString().slice(0, 10);
    let n = 0;
    for (const [date, e] of days) {
        if (date > today || !e.p.length)
            continue;
        const mean = e.p.reduce((a, b) => a + b, 0) / e.p.length;
        const existing = (await q(`SELECT id FROM weatherDay WHERE date=?`, [date]))[0];
        const vals = [Math.round(mean * 10) / 10, Math.min(...e.p), Math.max(...e.p), e.t.length ? Math.max(...e.t) : null, nowIso()];
        if (existing)
            await dbWrite(`UPDATE weatherDay SET pressureMean=?, pressureMin=?, pressureMax=?, tempMax=?, updatedAt=? WHERE id=?`, [...vals, existing.id]);
        else
            await dbWrite(`INSERT INTO weatherDay(id,date,pressureMean,pressureMin,pressureMax,tempMax,updatedAt) VALUES(?,?,?,?,?,?,?)`, [newId(), date, ...vals]);
        n++;
    }
    return n;
}
export async function weatherDays(fromDate, toDate) {
    return q(`SELECT * FROM weatherDay WHERE date >= ? AND date <= ? ORDER BY date`, [fromDate, toDate]);
}
/** Today's pressure and the change since yesterday (hPa), when both rows exist. */
export async function pressureToday() {
    const today = new Date().toISOString().slice(0, 10);
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    const rows = await weatherDays(y, today);
    const t = rows.find((r) => r.date === today), p = rows.find((r) => r.date === y);
    if (!t?.pressureMean)
        return null;
    return { pressure: Math.round(t.pressureMean), delta: p?.pressureMean != null ? Math.round(t.pressureMean - p.pressureMean) : null };
}
/**
 * Share of attacks that started on a day where the mean pressure fell >= `threshold` hPa from the day before,
 * against the share of all tracked days with such a drop. Descriptive only.
 */
export async function pressurePattern(attackStarts, threshold = 5) {
    if (!attackStarts.length)
        return null;
    const rows = await q(`SELECT * FROM weatherDay ORDER BY date`);
    if (rows.length < 14)
        return null;
    const by = new Map(rows.map((r) => [r.date, r.pressureMean]));
    const prev = (d) => { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() - 1); return x.toISOString().slice(0, 10); };
    const isDrop = (d) => { const a = by.get(d), b = by.get(prev(d)); return a != null && b != null ? a - b <= -threshold : null; };
    let dropDays = 0, known = 0;
    for (const r of rows) {
        const x = isDrop(r.date);
        if (x != null) {
            known++;
            if (x)
                dropDays++;
        }
    }
    let attacks = 0, onDrop = 0;
    for (const s of attackStarts) {
        const x = isDrop(s.slice(0, 10));
        if (x != null) {
            attacks++;
            if (x)
                onDrop++;
        }
    }
    if (attacks < 5 || !known)
        return null;
    return { attacksOnDrop: onDrop, attacks, dropShareAll: dropDays / known, threshold };
}
