import type { WeatherDay } from "./types";
export type Place = {
    name: string;
    admin: string | null;
    country: string | null;
    lat: number;
    lon: number;
};
/** Place search (city/town). `lang` picks the localised names where Open-Meteo has them. */
export declare function searchPlaces(query: string, lang?: string): Promise<Place[]>;
/** Fetch the last `pastDays` days + today and upsert one weatherDay row per local calendar day. */
export declare function refreshWeather(lat: number, lon: number, pastDays?: number): Promise<number>;
export declare function weatherDays(fromDate: string, toDate: string): Promise<WeatherDay[]>;
/** Today's pressure and the change since yesterday (hPa), when both rows exist. */
export declare function pressureToday(): Promise<{
    pressure: number;
    delta: number | null;
} | null>;
export type PressurePattern = {
    attacksOnDrop: number;
    attacks: number;
    dropShareAll: number;
    threshold: number;
} | null;
/**
 * Share of attacks that started on a day where the mean pressure fell >= `threshold` hPa from the day before,
 * against the share of all tracked days with such a drop. Descriptive only.
 */
export declare function pressurePattern(attackStarts: string[], threshold?: number): Promise<PressurePattern>;
