import { seedMigration } from "@/core/diary";
import { migranoConfig } from "./config";
// Engine owns 10–19; migrano starts at 20.
export const migranoMigrations = [seedMigration(20, migranoConfig)];
