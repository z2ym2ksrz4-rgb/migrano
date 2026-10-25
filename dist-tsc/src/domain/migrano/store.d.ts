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
export declare const useUi: import("zustand").UseBoundStore<import("zustand").StoreApi<Ui>>;
export {};
