import type { TFunction } from "i18next";
/**
 * Two reminders, re-planned on every start:
 *  - daily check-in at the chosen hour (skipped for today if today already has a check-in),
 *  - "is the attack over?" 24 h after an episode was opened and left open.
 * Nothing else. No medication reminders (that would be a care plan, not a diary).
 */
export declare function replanReminders(t: TFunction): Promise<void>;
