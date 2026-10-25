import { type ReactNode } from "react";
/**
 * Bottom sheet. Closes on backdrop tap or Escape. Rises above the on-screen keyboard (visualViewport) so the
 * field being typed in stays visible, and scrolls the focused field into view.
 */
export declare function Sheet({ open, onClose, title, children, tall }: {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    tall?: boolean;
}): import("react").JSX.Element | null;
