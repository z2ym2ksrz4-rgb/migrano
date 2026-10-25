import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
/**
 * Bottom sheet. Closes on backdrop tap or Escape. Rises above the on-screen keyboard (visualViewport) so the
 * field being typed in stays visible, and scrolls the focused field into view.
 */
export function Sheet({ open, onClose, title, children, tall }) {
    const ref = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const h = (e) => { if (e.key === "Escape")
            onClose(); };
        window.addEventListener("keydown", h);
        const vv = window.visualViewport;
        const onVV = () => {
            if (!ref.current || !vv)
                return;
            const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
            ref.current.style.setProperty("--kb", `${kb}px`);
            const el = document.activeElement;
            if (kb > 0 && el && ref.current.contains(el))
                setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 50);
        };
        vv?.addEventListener("resize", onVV);
        vv?.addEventListener("scroll", onVV);
        onVV();
        const onFocus = (e) => { const el = e.target; if (ref.current?.contains(el))
            setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 250); };
        document.addEventListener("focusin", onFocus);
        return () => { window.removeEventListener("keydown", h); vv?.removeEventListener("resize", onVV); vv?.removeEventListener("scroll", onVV); document.removeEventListener("focusin", onFocus); };
    }, [open, onClose]);
    if (!open)
        return null;
    return (_jsx("div", { className: "sheet-wrap", onClick: onClose, role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: `sheet ${tall ? "tall" : ""}`, ref: ref, onClick: (e) => e.stopPropagation(), children: [_jsx("button", { className: "sheet-close", onClick: onClose, "aria-label": "close", children: "\u00D7" }), title && _jsx("h2", { children: title }), children] }) }));
}
