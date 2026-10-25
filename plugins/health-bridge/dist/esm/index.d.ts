export interface HealthBridgePlugin {
  /** HealthKit present on this device (false on iPad/web). */
  isAvailable(): Promise<{ available: boolean }>;
  /** Ask for write access to the headache category. Resolves granted=false when the user declines. */
  requestAuthorization(): Promise<{ granted: boolean }>;
  /** Write one headache sample; severity 0 unspecified, 2 mild, 3 moderate, 4 severe. Returns the sample uuid. */
  writeHeadache(options: { start: string; end: string; severity: number; replaceUuid?: string | null }): Promise<{ uuid: string }>;
  /** Delete a sample this app wrote. */
  deleteSample(options: { uuid: string }): Promise<void>;
}
export declare const HealthBridge: HealthBridgePlugin;
