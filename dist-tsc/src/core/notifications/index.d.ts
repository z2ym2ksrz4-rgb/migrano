/**
 * One daily digest at the user's chosen hour + optional per-item alerts.
 * We schedule at most 60 days ahead and re-plan on every app start (iOS caps pending notifications at 64).
 */
export declare function ensurePermission(): Promise<boolean>;
export declare function replanAll(dailyHour: number, digestTitle: string, digestBodyFor: (date: Date) => Promise<string | null>): Promise<void>;
/** Items due on a given day, from the generic reminders table (domain modules write into it). */
export declare function remindersOn(date: Date): Promise<{
    title: string;
    body: string;
}[]>;
