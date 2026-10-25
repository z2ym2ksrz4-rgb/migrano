export type DomainTab = "home" | "calendar" | "insights";
export declare const domainTabs: {
    key: DomainTab;
    labelKey: string;
}[];
export declare function MigranoRoutes({ tab }: {
    tab: DomainTab;
}): import("react").JSX.Element;
