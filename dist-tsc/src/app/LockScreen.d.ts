/**
 * PIN lock (Pro). Locks on cold start and when the app was in the background for more than a minute.
 * A health diary on a shared or lost phone should not open to anyone — this is the one place we add friction.
 */
export declare function LockScreen(): import("react").JSX.Element | null;
