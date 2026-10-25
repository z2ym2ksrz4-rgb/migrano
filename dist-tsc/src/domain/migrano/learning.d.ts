import type { TFunction } from "i18next";
import type { Patterns } from "@/core/diary";
type Freq = {
    groupKey: string;
    labelKey: string | null;
    label: string | null;
    n: number;
    total: number;
}[];
/**
 * "What it looks like" in plain sentences. Everything is phrased as an observation about the user's own log
 * ("your attacks have often…"), never as a cause or a diagnosis. Shown on Insights and in the PDF.
 */
export declare function learningSentences(pat: Patterns | null, freq: Freq, t: TFunction, lang: string, medDaysLatest: number, threshold: number): string[];
export {};
