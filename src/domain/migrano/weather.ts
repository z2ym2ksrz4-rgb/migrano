import { refreshWeather } from "@/core/diary";
import { useSettings } from "@/core/settings";

/** Refresh the pressure history at most every 3 hours, only when the user turned weather tracking on. */
export async function maybeRefreshWeather(force = false): Promise<void> {
  const s = useSettings.getState();
  if (!s.weatherEnabled || s.weatherLat == null || s.weatherLon == null) return;
  const stale = !s.weatherFetchedAt || Date.now() - new Date(s.weatherFetchedAt).getTime() > 3 * 36e5;
  if (!stale && !force) return;
  try {
    await refreshWeather(s.weatherLat, s.weatherLon, s.weatherFetchedAt ? 7 : 30);
    await s.set("weatherFetchedAt", new Date().toISOString());
  } catch (e) { console.warn("[weather] refresh failed", e); }
}
