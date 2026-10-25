import { create } from "zustand";
import { getDb, nowIso, dbWrite } from "@/core/db";
import appConfig from "../../../app.config.json";
const defaults = {
    language: "en",
    dailyReminderHour: appConfig.dailyReminderHour,
    units: "metric",
    onboardingDone: false,
    reviewPromptedAt: null,
    successEvents: 0,
    checkinReminder: true,
    medThreshold: 10,
    pinHash: null,
    openEpisodeReminder: true,
    userName: null,
    cycleTracking: false,
    baselineAttacks: null,
    widgetGuideSeen: false,
    weatherEnabled: false,
    weatherPlace: null,
    weatherLat: null,
    weatherLon: null,
    weatherFetchedAt: null,
    healthExport: false,
    onboardingWishes: null,
};
export const useSettings = create((setState, get) => ({
    ...defaults,
    async load() {
        const res = await getDb().query(`SELECT key, value FROM settings`);
        const patch = {};
        for (const r of res.values ?? [])
            patch[r.key] = JSON.parse(r.value);
        setState({ ...defaults, ...patch });
    },
    async set(key, value) {
        setState({ [key]: value });
        await dbWrite(`INSERT OR REPLACE INTO settings(key,value,updatedAt) VALUES(?,?,?)`, [key, JSON.stringify(value), nowIso()]);
        void get; // keep signature stable
    },
}));
