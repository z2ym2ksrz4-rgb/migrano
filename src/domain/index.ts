/**
 * Domain registry. Migrano = the generic symptom-diary engine (src/core/diary) configured for migraine
 * (src/domain/migrano). A sibling app (IBS, tinnitus) swaps only this folder.
 */
import { diaryMigrations, configureDiary } from "@/core/diary";
import { migranoMigrations } from "./migrano/migrations";
import { migranoConfig } from "./migrano/config";
import { MigranoRoutes, domainTabs, type DomainTab } from "./migrano/routes";

configureDiary(migranoConfig);

export const domainMigrations = [...diaryMigrations, ...migranoMigrations];
export const DomainRoutes = MigranoRoutes;
export { domainTabs };
export type { DomainTab };
