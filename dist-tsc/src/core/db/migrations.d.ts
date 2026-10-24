/**
 * Database migrations. Append a new entry for every schema change; never edit an old one.
 * Each app adds its own domain tables in src/domain/<app>/migrations.ts and registers them in domain/index.ts.
 */
export type Migration = {
    version: number;
    name: string;
    sql: string[];
};
export declare const coreMigrations: Migration[];
