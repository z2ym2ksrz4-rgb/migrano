export const coreMigrations = [
    {
        version: 1,
        name: "core_settings_and_meta",
        sql: [
            `CREATE TABLE IF NOT EXISTS meta (
         key TEXT PRIMARY KEY,
         value TEXT NOT NULL
       );`,
            `CREATE TABLE IF NOT EXISTS settings (
         key TEXT PRIMARY KEY,
         value TEXT NOT NULL,
         updatedAt TEXT NOT NULL
       );`,
            `CREATE TABLE IF NOT EXISTS reminders (
         id TEXT PRIMARY KEY,
         sourceType TEXT NOT NULL,
         sourceId TEXT NOT NULL,
         fireAt TEXT NOT NULL,
         title TEXT NOT NULL,
         body TEXT NOT NULL,
         delivered INTEGER NOT NULL DEFAULT 0
       );`,
            `CREATE INDEX IF NOT EXISTS idx_reminders_fireAt ON reminders(fireAt);`,
        ],
    },
];
