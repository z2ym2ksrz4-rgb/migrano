import type { DiaryConfig, Episode, Tag, Medication, DailyCheckin, CheckinStatus } from "./types";
export * from "./types";
export { diaryMigrations } from "./migrations";
export { seedMigration } from "./seed";
/** Called once by the domain before any screen renders. */
export declare function configureDiary(c: DiaryConfig): void;
export declare function diaryConfig(): DiaryConfig;
export declare function openEpisode(): Promise<Episode | null>;
/** Starts a new open episode (the "attack now" button). Returns the existing one if one is already open. */
export declare function startEpisode(startedAt?: string): Promise<Episode>;
export declare function endEpisode(id: string, endedAt?: string): Promise<void>;
export declare function updateEpisode(id: string, patch: Partial<Pick<Episode, "startedAt" | "endedAt" | "intensity" | "note" | "extra">>): Promise<void>;
export declare function deleteEpisode(id: string): Promise<void>;
export declare function listEpisodes(fromIso?: string, toIso?: string): Promise<Episode[]>;
export declare function listTags(groupKey?: string): Promise<Tag[]>;
export declare function episodeTagIds(episodeId: string): Promise<string[]>;
export declare function setEpisodeTags(episodeId: string, tagIds: string[]): Promise<void>;
/** "Other…" → a user tag in that group. */
export declare function addUserTag(groupKey: string, label: string): Promise<Tag>;
export declare function setTagHidden(tagId: string, hidden: boolean): Promise<void>;
export declare function listMedications(includeHidden?: boolean): Promise<Medication[]>;
export declare function addMedication(name: string, kind?: Medication["kind"], unit?: string | null): Promise<string>;
export type Intake = {
    id: string;
    episodeId: string | null;
    medicationId: string;
    takenAt: string;
    amount: number | null;
    name: string;
    kind: string;
};
export declare function listIntakes(episodeId: string): Promise<Intake[]>;
export declare function deleteIntake(id: string): Promise<void>;
export declare function updateMedication(id: string, patch: Partial<Pick<Medication, "name" | "kind" | "unit" | "isHidden">>): Promise<void>;
export declare function logIntake(medicationId: string, episodeId: string | null, takenAt?: string, amount?: number | null): Promise<void>;
/** Distinct calendar days with at least one acute intake in [fromIso, toIso). The number the warning compares against. */
export declare function medicationDays(fromIso: string, toIso: string): Promise<number>;
export declare function getCheckin(date: string): Promise<DailyCheckin | null>;
export declare function setCheckin(date: string, status: CheckinStatus, extra?: Record<string, unknown> | null, note?: string | null): Promise<void>;
export declare function listCheckins(fromDate: string, toDate: string): Promise<DailyCheckin[]>;
/** Distinct calendar days touched by an episode in [fromIso, toIso) — multi-day episodes count every day. */
export declare function episodeDays(fromIso: string, toIso: string): Promise<number>;
/** Tag frequency across the episodes in a range: share of episodes carrying each tag, per group. */
export declare function tagFrequency(fromIso: string, toIso: string): Promise<{
    groupKey: string;
    tagId: string;
    labelKey: string | null;
    label: string | null;
    n: number;
    total: number;
}[]>;
/** Per-month episode counts and attack days for the last `months` months, oldest first. */
export declare function monthlySeries(months?: number): Promise<{
    month: string;
    episodes: number;
    attackDays: number;
}[]>;
export declare function episodeSummary(fromIso: string, toIso: string): Promise<{
    episodes: number;
    attackDays: number;
    avgHours: number | null;
    avgIntensity: number | null;
    medDays: number;
}>;
export declare const monthRange: (d?: Date) => {
    fromIso: string;
    toIso: string;
};
/** All-time usage count per tag (for "your most frequent" in the attack journey). */
export declare function tagUsage(): Promise<Record<string, number>>;
/** Most recent closed episode end (ISO) or null. */
export declare function lastEpisodeEnd(): Promise<string | null>;
/** Whole days since the last episode ended (0 if an episode is open or ended today); null if no episodes at all. */
export declare function daysSinceLastEpisode(): Promise<number | null>;
/** Medication days for each of the last `months` months, oldest first. */
export declare function medDaysByMonth(months?: number): Promise<{
    month: string;
    medDays: number;
}[]>;
/** This episode vs. the average of all other closed episodes (duration, intensity). */
export declare function episodeComparison(id: string): Promise<{
    hours: number | null;
    intensity: number | null;
    avgHours: number | null;
    avgIntensity: number | null;
    n: number;
} | null>;
export type Patterns = {
    attacks: number;
    checkins: number;
    /** weekday 0-6 (Sunday=0) with the most attack starts and its share, when it stands out */
    weekday: {
        day: number;
        share: number;
    } | null;
    /** part of day with most starts: "night" | "morning" | "afternoon" | "evening" */
    timeOfDay: {
        part: "night" | "morning" | "afternoon" | "evening";
        share: number;
    } | null;
    /** per check-in field: avg the day before an attack day vs. before a calm day */
    fields: {
        key: string;
        beforeAttack: number;
        beforeCalm: number;
        n: number;
    }[];
    /** share of attacks starting on a period day (±1) when period tracking has data */
    period: {
        share: number;
        n: number;
    } | null;
};
/**
 * Descriptive patterns only: where do attacks cluster (weekday, time of day) and how did the night before look.
 * No causality claims — the UI phrases everything as "your attacks have often…".
 */
export declare function patterns(days?: number): Promise<Patterns>;
