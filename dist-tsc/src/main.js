import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import ReactDOM from "react-dom/client";
import { defineCustomElements as defineJeepSqlite } from "jeep-sqlite/loader";
import { Capacitor } from "@capacitor/core";
import App from "./app/App";
import { openDb } from "@/core/db";
import { useSettings } from "@/core/settings";
import { initI18n, detectLanguage } from "@/core/i18n";
import "./styles.css";
import { isRelease } from "@/core/release";
async function boot() {
    if (Capacitor.getPlatform() === "web")
        defineJeepSqlite(window);
    await openDb();
    await useSettings.getState().load();
    const s = useSettings.getState();
    const lang = s.language || detectLanguage();
    if (!s.language)
        await s.set("language", lang);
    await initI18n(lang);
    if (!isRelease) {
        const { seedDemo } = await import("@/domain/migrano/demo");
        window.__seedDemo = async (l) => {
            if (l) {
                await s.set("language", l);
                await initI18n(l);
            }
            await s.set("onboardingDone", true);
            await seedDemo();
            location.reload();
        };
    }
    ReactDOM.createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
}
void boot();
