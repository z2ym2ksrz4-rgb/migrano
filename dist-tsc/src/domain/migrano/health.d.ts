import { type Episode } from "@/core/diary";
/**
 * Apple Health mirror (iOS only). Closed attacks become headache samples; intensity 1–3 mild, 4–6 moderate, 7–10 severe.
 * Idempotent: episodes carry the sample uuid + sync time, so edits replace the sample and nothing is written twice.
 */
export declare const healthAvailable: () => boolean;
export declare function requestHealthAccess(): Promise<boolean>;
/** Write every closed, unsynced (or edited) episode. Returns how many were written. Safe to call often. */
export declare function syncHealth(): Promise<number>;
export declare function removeHealthSample(e: Episode): Promise<void>;
/** Turning the toggle off: forget sync state so a later re-enable writes everything again (samples stay in Health). */
export declare function resetHealthSync(): Promise<void>;
