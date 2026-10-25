import { create } from "zustand";

export type SheetMode = "quick" | "journey" | "full";

/** Cross-screen UI state: which episode sheet is open (and in which mode), and a bump counter so screens reload after writes. */
type Ui = {
  episodeSheetId: string | null;
  episodeSheetMode: SheetMode;
  medsOpen: boolean;
  infoSheet: "medDays" | "widget" | "plan" | null;
  version: number;
  openEpisode: (id: string, mode?: SheetMode) => void;
  closeEpisode: () => void;
  setMode: (mode: SheetMode) => void;
  setMedsOpen: (v: boolean) => void;
  openInfo: (which: Ui["infoSheet"]) => void;
  bump: () => void;
};
export const useUi = create<Ui>((set) => ({
  episodeSheetId: null,
  episodeSheetMode: "full",
  medsOpen: false,
  infoSheet: null,
  version: 0,
  openEpisode: (id, mode = "full") => set({ episodeSheetId: id, episodeSheetMode: mode }),
  closeEpisode: () => set({ episodeSheetId: null }),
  setMode: (episodeSheetMode) => set({ episodeSheetMode }),
  setMedsOpen: (medsOpen) => set({ medsOpen }),
  openInfo: (infoSheet) => set({ infoSheet }),
  bump: () => set((s) => ({ version: s.version + 1 })),
}));
