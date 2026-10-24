import type { Migration } from "@/core/db/migrations";
/**
 * Symptom-diary engine tables. Generic on purpose: nothing here knows about migraine.
 * A condition (migraine, IBS, tinnitus…) only seeds rows into tagGroup/tag and configures check-in fields.
 * Versions 10–19 are reserved for the engine; the app domain starts at 20.
 * Every table has `id` + `updatedAt` so the core backup/merge (newest wins) works unchanged.
 */
export declare const diaryMigrations: Migration[];
