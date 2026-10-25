import { create } from "zustand";
export const useUi = create((set) => ({
    episodeSheetId: null,
    medsOpen: false,
    version: 0,
    openEpisode: (id) => set({ episodeSheetId: id }),
    closeEpisode: () => set({ episodeSheetId: null }),
    setMedsOpen: (medsOpen) => set({ medsOpen }),
    bump: () => set((s) => ({ version: s.version + 1 })),
}));
