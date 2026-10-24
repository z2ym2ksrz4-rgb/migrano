export type Settings = {
    language: string;
    dailyReminderHour: number;
    units: "metric" | "imperial";
    onboardingDone: boolean;
    reviewPromptedAt: string | null;
    successEvents: number;
};
type Store = Settings & {
    load: () => Promise<void>;
    set: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
};
export declare const useSettings: import("zustand").UseBoundStore<import("zustand").StoreApi<Store>>;
export {};
