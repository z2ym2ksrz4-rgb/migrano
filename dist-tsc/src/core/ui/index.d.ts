export { Sheet } from "./Sheet";
export * as haptics from "./haptics";
export { sha256 } from "./pin";
export declare const fmtDate: (iso: string, lang: string, opts?: Intl.DateTimeFormatOptions) => string;
export declare const fmtTime: (iso: string, lang: string) => string;
export declare const fmtDateTime: (iso: string, lang: string) => string;
/** Local calendar day as YYYY-MM-DD (never toISOString: that shifts the day west of Greenwich). */
export declare const localDay: (d?: Date) => string;
/** For <input type=datetime-local>. */
export declare const toLocalInput: (iso: string) => string;
export declare const fromLocalInput: (v: string) => string;
export declare const hours: (fromIso: string, toIso: string) => number;
