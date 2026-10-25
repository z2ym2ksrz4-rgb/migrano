import { create } from "zustand";
export const useUi = create((set) => ({
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
