/**
 * Configuration contract between the diary engine and a condition domain.
 * The domain (src/domain/<slug>/config.ts) fills this in; the engine reads only this.
 */
export type TagGroupKind = "trigger" | "symptom" | "relief" | "location" | "custom";
export type TagGroupDef = {
    key: string;
    kind: TagGroupKind;
    tags: string[];
};
export type CheckinStatus = "none" | "mild" | "attack";
/** A per-day scalar the domain wants on the daily check-in (stored in dailyCheckin.extra as JSON). */
export type CheckinField = {
    key: string;
    kind: "scale";
    max: number;
};
export type DiaryConfig = {
    slug: string;
    /** What an episode is called in this app ("attack", "spike", "meal"); used as episode.kind. */
    episodeKind: string;
    tagGroups: TagGroupDef[];
    checkinFields: CheckinField[];
    /** Medication-days-per-month thresholds the user can choose between; first is the default. */
    medicationDayThresholds: number[];
    /** Days of history visible on the free plan. */
    freeHistoryDays: number;
};
export type Episode = {
    id: string;
    kind: string;
    startedAt: string;
    endedAt: string | null;
    intensity: number | null;
    note: string | null;
    extra: string | null;
    healthUuid: string | null;
    healthSyncedAt: string | null;
    createdAt: string;
    updatedAt: string;
};
export type WeatherDay = {
    id: string;
    date: string;
    pressureMean: number | null;
    pressureMin: number | null;
    pressureMax: number | null;
    tempMax: number | null;
    updatedAt: string;
};
export type Tag = {
    id: string;
    groupId: string;
    groupKey: string;
    key: string;
    labelKey: string | null;
    label: string | null;
    isSystem: number;
    isHidden: number;
    sort: number;
};
export type Medication = {
    id: string;
    name: string;
    kind: "acute" | "preventive";
    unit: string | null;
    isHidden: number;
    sort: number;
};
export type DailyCheckin = {
    id: string;
    date: string;
    status: CheckinStatus;
    extra: string | null;
    note: string | null;
    updatedAt: string;
};
