import { jsPDF } from "jspdf";
import type { TFunction } from "i18next";
/**
 * The doctor's report: what a neurologist asks for at a glance (frequency, duration, intensity, medication days),
 * then one row per attack with triggers/symptoms/medication, then trigger and symptom shares. Plain facts only.
 */
export declare function buildReport(fromIso: string, toIso: string, t: TFunction, lang: string, opts?: {
    name?: string | null;
    notes?: string | null;
    monthly?: {
        month: string;
        attackDays: number;
        medDays: number;
    }[];
    learning?: string[];
    pressure?: Map<string, {
        p: number;
        delta: number | null;
    }>;
}): Promise<jsPDF>;
export declare function sharePdf(doc: jsPDF, filename: string, title: string): Promise<void>;
