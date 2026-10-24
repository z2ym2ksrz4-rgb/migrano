import type { Migration } from "@/core/db/migrations";
import type { DiaryConfig } from "./types";
/**
 * Builds the domain's seed migration from its config. Ids are deterministic (`tg_<group>`, `tag_<group>_<key>`)
 * so two devices seed identical rows and backup merge never duplicates a tag.
 * INSERT OR IGNORE keeps user edits (hidden/sort) on re-run.
 */
export declare function seedMigration(version: number, config: DiaryConfig): Migration;
