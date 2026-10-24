import i18n from "i18next";
export declare const SUPPORTED: readonly ["en", "da", "de", "sv", "nb"];
export type Lang = (typeof SUPPORTED)[number];
export declare function detectLanguage(): Lang;
export declare function initI18n(lang: Lang): Promise<import("i18next").i18n>;
export default i18n;
