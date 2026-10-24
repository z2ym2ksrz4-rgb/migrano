import { SQLiteDBConnection } from "@capacitor-community/sqlite";
/** Open the database once and run pending migrations. Call from main.tsx before rendering. */
export declare function openDb(): Promise<SQLiteDBConnection>;
export declare function getDb(): SQLiteDBConnection;
/** Persist to IndexedDB on web after writes (no-op on native). */
export declare function persist(): Promise<void>;
export declare function serialized<T>(fn: () => Promise<T>): Promise<T>;
export declare const dbRun: (sql: string, params?: unknown[]) => Promise<import("@capacitor-community/sqlite").capSQLiteChanges>;
/** Write + persist, serialised. */
export declare const dbWrite: (sql: string, params?: unknown[]) => Promise<void>;
export declare const newId: () => `${string}-${string}-${string}-${string}-${string}`;
export declare const nowIso: () => string;
/** Settings → Your data → Delete all data. Clears every table except meta (schema version), then reloads. */
export declare function wipeAllData(): Promise<void>;
