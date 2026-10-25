/** Refresh the pressure history at most every 3 hours, only when the user turned weather tracking on. */
export declare function maybeRefreshWeather(force?: boolean): Promise<void>;
