import type { Migration } from "@/core/db/migrations";
import { seedMigration } from "@/core/diary";
import { migranoConfig } from "./config";

// Engine owns 10–19; migrano starts at 20.
export const migranoMigrations: Migration[] = [seedMigration(20, migranoConfig)];
