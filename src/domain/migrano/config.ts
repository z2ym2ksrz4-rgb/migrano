import type { DiaryConfig } from "@/core/diary";
import { migraineTagGroups } from "./tagsets";

export const migranoConfig: DiaryConfig = {
  slug: "migrano",
  episodeKind: "attack",
  tagGroups: migraineTagGroups,
  checkinFields: [
    { key: "sleep", kind: "scale", max: 5 },
    { key: "stress", kind: "scale", max: 5 },
  ],
  // Medication-overuse guidance commonly uses 10 (triptans/combination) or 15 (simple analgesics) days per month.
  // The app only counts days and says "talk to your doctor" — it never classifies.
  medicationDayThresholds: [10, 15],
  freeHistoryDays: 90,
};
