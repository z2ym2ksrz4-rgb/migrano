import { create } from "zustand";

/** Cross-screen UI state: which episode sheet is open, and a bump counter so screens reload after writes. */
type Ui = {
  episodeSheetId: string | null;
  medsOpen: boolean;
  version: number;
  openEpisode: (id: string) => void;
  closeEpisode: () => void;
  setMedsOpen: (v: boolean) => void;
  bump: () => void;
};
export const useUi = create<Ui>((set) => ({
  episodeSheetId: null,
  medsOpen: false,
  version: 0,
  openEpisode: (id) => set({ episodeSheetId: id }),
  closeEpisode: () => set({ episodeSheetId: null }),
  setMedsOpen: (medsOpen) => set({ medsOpen }),
  bump: () => set((s) => ({ version: s.version + 1 })),
}));
