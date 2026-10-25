export type Settings = {
    language: string;
    dailyReminderHour: number;
    units: "metric" | "imperial";
    onboardingDone: boolean;
    reviewPromptedAt: string | null;
    successEvents: number;
    checkinReminder: boolean;
    medThreshold: number;
    pinHash: string | null;
    openEpisodeReminder: boolean;
    userName: string | null;
    cycleTracking: boolean;
    baselineAttacks: string | null;
    widgetGuideSeen: boolean;
    weatherEnabled: boolean;
    weatherPlace: string | null;
    weatherLat: number | null;
    weatherLon: number | null;
    weatherFetchedAt: string | null;
    healthExport: boolean;
};
type Store = Settings & {
    load: () => Promise<void>;
    set: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
};
export declare const useSettings: import("zustand").UseBoundStore<import("zustand").StoreApi<Store>>;
export {};
