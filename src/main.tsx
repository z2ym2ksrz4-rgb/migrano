import React from "react";
import ReactDOM from "react-dom/client";
import { defineCustomElements as defineJeepSqlite } from "jeep-sqlite/loader";
import { Capacitor } from "@capacitor/core";
import App from "./app/App";
import { openDb } from "@/core/db";
import { useSettings } from "@/core/settings";
import { initI18n, detectLanguage, type Lang } from "@/core/i18n";
import "./styles.css";

async function boot() {
  if (Capacitor.getPlatform() === "web") defineJeepSqlite(window);
  await openDb();
  await useSettings.getState().load();
  const s = useSettings.getState();
  const lang = (s.language as Lang) || detectLanguage();
  if (!s.language) await s.set("language", lang);
  await initI18n(lang);
  ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
}
void boot();
