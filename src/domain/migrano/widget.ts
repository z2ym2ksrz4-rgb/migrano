import { Capacitor } from "@capacitor/core";
import type { TFunction } from "i18next";
import appConfig from "../../../app.config.json";

/**
 * Snapshot the home-screen / lock-screen widgets render. Strings are pre-localised here so the native side stays dumb.
 * Published after every Home load (cheap: one JSON write into the app group).
 */
export async function publishWidget(d: { open: boolean; daysSince: number | null; attackDays: number; medDays: number; t: TFunction }) {
  if (Capacitor.getPlatform() !== "ios") return;
  try {
    const { WidgetBridge } = await import("widget-bridge");
    const data = {
      cta: d.open ? d.t("widget.openAttack") : d.t("widget.attackNow"),
      open: d.open,
      line1: d.daysSince == null ? d.t("widget.noData") : d.open ? d.t("widget.ongoing") : d.t("home.streak", { count: d.daysSince }).replace(/^\d+\s*/, `${d.daysSince} `),
      line2: `${d.attackDays} ${d.t("home.attackDays")} · ${d.medDays} ${d.t("home.medDays")}`,
      url: d.open ? "migrano://episode/open" : "migrano://episode/new",
      updatedAt: new Date().toISOString(),
    };
    await WidgetBridge.setData({ json: JSON.stringify(data), group: `group.${appConfig.appId}`, widgetClass: `${appConfig.appId}.AttackWidget` });
  } catch (e) { console.warn("[widget] publish failed", e); }
}
