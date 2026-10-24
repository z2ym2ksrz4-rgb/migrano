/**
 * Backup = one encrypted JSON file with every table. Used for both backup/restore and household sharing
 * (export on one phone, import on another). Merge rule on import: newest updatedAt per row id wins.
 * Encryption: AES-GCM with a key derived from a user passphrase (PBKDF2). No server involved.
 */
type Dump = {
    app: string;
    schemaVersion: number;
    exportedAt: string;
    tables: Record<string, Record<string, unknown>[]>;
};
export declare function createDump(): Promise<Dump>;
export declare function encryptDump(dump: Dump, passphrase: string): Promise<string>;
export declare function decryptDump(text: string, passphrase: string): Promise<Dump>;
/** Export: write to cache and open the system share sheet (AirDrop, Nearby Share, mail, Files). */
export declare function exportBackup(passphrase: string): Promise<void>;
/** Import with merge: rows are upserted; if both sides have updatedAt, the newer wins. */
export declare function importBackup(text: string, passphrase: string): Promise<void>;
export {};
