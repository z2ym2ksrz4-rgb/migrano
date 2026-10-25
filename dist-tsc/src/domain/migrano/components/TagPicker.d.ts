import { type Tag } from "@/core/diary";
/** One tag group as chips. "Other…" turns into an input; the typed text becomes a user tag in this group. */
export declare function TagPicker({ groupKey, tags, selected, onChange, onTagAdded, compact }: {
    groupKey: string;
    tags: Tag[];
    selected: Set<string>;
    onChange: (next: Set<string>) => void;
    onTagAdded: () => void;
    compact?: boolean;
}): import("react").JSX.Element;
