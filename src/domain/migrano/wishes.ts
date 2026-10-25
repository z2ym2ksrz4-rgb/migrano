import { useSettings } from "@/core/settings";
import { requestHealthAccess } from "./health";
import { maybeRefreshWeather } from "./weather";

/** Pro extras the user asked for during onboarding; applied the moment the account is Pro (trial counts). */
export type Wishes = { cycle?: boolean; weather?: boolean; health?: boolean };

export async function applyOnboardingWishes(): Promise<void> {
  const s = useSettings.getState();
  if (!s.onboardingWishes) return;
  let w: Wishes = {};
  try { w = JSON.parse(s.onboardingWishes) as Wishes; } catch { /* ignore */ }
  await s.set("onboardingWishes", null); // one shot, even if a step below fails
  if (w.cycle) await s.set("cycleTracking", true);
  if (w.weather && s.weatherLat != null && s.weatherLon != null) { await s.set("weatherEnabled", true); void maybeRefreshWeather(true); }
  if (w.health && (await requestHealthAccess())) await s.set("healthExport", true);
}
