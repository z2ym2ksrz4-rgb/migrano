import { Capacitor } from "@capacitor/core";
import { episodesNeedingHealthSync, markHealthSynced, clearHealthSync, type Episode } from "@/core/diary";
import { useSettings } from "@/core/settings";

/**
 * Apple Health mirror (iOS only). Closed attacks become headache samples; intensity 1–3 mild, 4–6 moderate, 7–10 severe.
 * Idempotent: episodes carry the sample uuid + sync time, so edits replace the sample and nothing is written twice.
 */
export const healthAvailable = () => Capacitor.getPlatform() === "ios";

const severity = (i: number | null) => (i == null ? 0 : i <= 3 ? 2 : i <= 6 ? 3 : 4);

export async function requestHealthAccess(): Promise<boolean> {
  if (!healthAvailable()) return false;
  const { HealthBridge } = await import("health-bridge");
  const { available } = await HealthBridge.isAvailable();
  if (!available) return false;
  return (await HealthBridge.requestAuthorization()).granted;
}

/** Write every closed, unsynced (or edited) episode. Returns how many were written. Safe to call often. */
export async function syncHealth(): Promise<number> {
  if (!healthAvailable() || !useSettings.getState().healthExport) return 0;
  const { HealthBridge } = await import("health-bridge");
  const todo = await episodesNeedingHealthSync();
  let n = 0;
  for (const e of todo) {
    try {
      const { uuid } = await HealthBridge.writeHeadache({ start: e.startedAt, end: e.endedAt!, severity: severity(e.intensity), replaceUuid: e.healthUuid });
      await markHealthSynced(e.id, uuid); n++;
    } catch (err) { console.warn("[health] write failed", err); break; }
  }
  return n;
}

export async function removeHealthSample(e: Episode) {
  if (!healthAvailable() || !e.healthUuid) return;
  try { const { HealthBridge } = await import("health-bridge"); await HealthBridge.deleteSample({ uuid: e.healthUuid }); } catch { /* best effort */ }
}

/** Turning the toggle off: forget sync state so a later re-enable writes everything again (samples stay in Health). */
export async function resetHealthSync() { await clearHealthSync(); }
