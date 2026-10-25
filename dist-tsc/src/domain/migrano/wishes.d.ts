/** Pro extras the user asked for during onboarding; applied the moment the account is Pro (trial counts). */
export type Wishes = {
    cycle?: boolean;
    weather?: boolean;
    health?: boolean;
};
export declare function applyOnboardingWishes(): Promise<void>;
