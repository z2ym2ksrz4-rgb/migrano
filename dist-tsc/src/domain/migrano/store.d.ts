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
export declare const useUi: import("zustand").UseBoundStore<import("zustand").StoreApi<Ui>>;
export {};
