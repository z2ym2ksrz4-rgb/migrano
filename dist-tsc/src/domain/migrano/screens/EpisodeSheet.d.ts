/**
 * The attack sheet in three tempos:
 *  - quick   : right after "Attack now" — one question (how bad?), everything else can wait.
 *  - journey : when the attack ends (or the user comes back) — 4 short steps with the user's 6 most used chips each,
 *              "more…" expands, every step can be skipped. Ends with this attack vs. your average (Pro).
 *  - full    : the complete editable form (start/end, slider, all chips, medication, note, delete).
 * All writes happen immediately; the modes only change what is on screen.
 */
export declare function EpisodeSheet(): import("react").JSX.Element | null;
