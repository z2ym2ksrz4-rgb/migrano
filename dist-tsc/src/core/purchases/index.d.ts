/**
 * Purchases: thin wrapper around RevenueCat. On web (dev) a mock lets you test the paywall and gating
 * without a store account. Products are configured in RevenueCat as an Offering with two packages:
 *   - "annual"   : auto-renewing yearly subscription with a 7-day free trial
 *   - "lifetime" : non-consumable one-time purchase
 * Both grant the entitlement named in app.config.json (default "pro").
 */
export type Package = {
    id: "annual" | "lifetime";
    priceString: string;
    introPriceString?: string | null;
    raw?: unknown;
};
export type Subscription = {
    /** "annual" | "lifetime" | null when free */
    plan: "annual" | "lifetime" | null;
    productId: string | null;
    expiresAt: string | null;
    willRenew: boolean;
    inTrial: boolean;
    managementUrl: string | null;
    store: string | null;
};
type Store = {
    ready: boolean;
    isPro: boolean;
    packages: Package[];
    sub: Subscription;
    init: () => Promise<void>;
    purchase: (pkg: Package) => Promise<boolean>;
    restore: () => Promise<boolean>;
    manage: () => Promise<void>;
};
export declare const usePurchases: import("zustand").UseBoundStore<import("zustand").StoreApi<Store>>;
/** Use in any screen: `const gate = useProGate(); if (!gate.allow("secondPet")) return;` opens the paywall otherwise. */
export declare const usePaywall: import("zustand").UseBoundStore<import("zustand").StoreApi<{
    open: boolean;
    reason: string | null;
    show: (reason: string) => void;
    hide: () => void;
}>>;
export declare function useProGate(): {
    isPro: boolean;
    allow(reason: string): boolean;
};
export {};
