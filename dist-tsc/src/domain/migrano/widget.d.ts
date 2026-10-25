import type { TFunction } from "i18next";
/**
 * Snapshot the home-screen / lock-screen widgets render. Strings are pre-localised here so the native side stays dumb.
 * Published after every Home load (cheap: one JSON write into the app group).
 */
export declare function publishWidget(d: {
    open: boolean;
    daysSince: number | null;
    attackDays: number;
    medDays: number;
    t: TFunction;
}): Promise<void>;
