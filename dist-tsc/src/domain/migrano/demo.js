import { getDb, persist, newId } from "@/core/db";
import { listTags, addMedication, setEpisodeTags, logIntake, setCheckin } from "@/core/diary";
import { localDay } from "@/core/ui";
/**
 * Demo data for screenshots and smoke tests (dev builds only; wired to window.__seedDemo in main.tsx).
 * Deterministic: same attacks every run so screenshots are reproducible.
 */
export async function seedDemo() {
    const db = getDb();
    await db.execute(`DELETE FROM episodeTag; DELETE FROM medicationIntake; DELETE FROM episode; DELETE FROM medication; DELETE FROM dailyCheckin; DELETE FROM report;`);
    const tags = await listTags();
    const byKey = (g, k) => tags.find((t) => t.groupKey === g && t.key === k).id;
    const trip = await addMedication("Sumatriptan 50 mg", "acute");
    const ibu = await addMedication("Ibuprofen 400 mg", "acute");
    await addMedication("Candesartan 16 mg", "preventive");
    // ~14 attacks over the last 100 days with a weekly-ish rhythm, varied intensity and tags
    const now = new Date();
    const attacks = [2, 6, 11, 17, 19, 26, 33, 38, 44, 52, 59, 67, 75, 88].map((daysAgo, i) => ({ daysAgo, hour: [7, 14, 19, 10, 16][i % 5], hours: [6, 18, 9, 30, 12, 4][i % 6], intensity: [7, 5, 8, 6, 4, 9, 6][i % 7] }));
    for (const [i, a] of attacks.entries()) {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - a.daysAgo, a.hour, 15);
        const end = new Date(start.getTime() + a.hours * 36e5);
        const id = newId();
        await db.run(`INSERT INTO episode(id,kind,startedAt,endedAt,intensity,note,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?)`, [id, "attack", start.toISOString(), end.toISOString(), a.intensity, i === 0 ? "Started after a long meeting" : null, start.toISOString(), end.toISOString()], false);
        const trig = [["stress", "sleep_lack"], ["skipped_meal", "stress"], ["weather", "bright_light"], ["stress", "alcohol"], ["menstruation"], ["sleep_lack", "screen_time"]][i % 6];
        const sym = [["throbbing", "one_sided", "photophobia"], ["nausea", "throbbing"], ["aura_visual", "photophobia", "phonophobia"], ["one_sided", "worse_movement"]][i % 4];
        await setEpisodeTags(id, [...trig.map((k) => byKey("trigger", k)), ...sym.map((k) => byKey("symptom", k)), byKey("location", i % 2 ? "left" : "right"), byKey("relief", "dark_room")]);
        if (a.intensity >= 6)
            await logIntake(trip, id, new Date(start.getTime() + 30 * 6e4).toISOString());
        else if (i % 3 === 0)
            await logIntake(ibu, id, new Date(start.getTime() + 60 * 6e4).toISOString());
    }
    for (let d = 1; d <= 45; d++) {
        const date = localDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - d));
        const hit = attacks.some((a) => a.daysAgo === d);
        if (!hit && d % 9 === 4)
            await setCheckin(date, "mild", { sleep: 3, stress: 4 });
        else if (!hit && d % 2 === 0)
            await setCheckin(date, "none", { sleep: 4, stress: 2 });
    }
    await persist();
}
