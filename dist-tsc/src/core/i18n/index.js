import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en.json";
import da from "@/locales/da.json";
import de from "@/locales/de.json";
import sv from "@/locales/sv.json";
import nb from "@/locales/nb.json";
export const SUPPORTED = ["en", "da", "de", "sv", "nb"];
export function detectLanguage() {
    const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    const map = { no: "nb", nn: "nb" };
    const l = (map[nav] ?? nav);
    return SUPPORTED.includes(l) ? l : "en";
}
export async function initI18n(lang) {
    await i18n.use(initReactI18next).init({
        resources: { en: { translation: en }, da: { translation: da }, de: { translation: de }, sv: { translation: sv }, nb: { translation: nb } },
        lng: lang,
        fallbackLng: "en",
        interpolation: { escapeValue: false },
    });
    return i18n;
}
export default i18n;
