import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** The pain-star mark from the app icon (white star with a coral core). Used in the hero button. */
export function PainStar({ size = 48, color = "currentColor", core = "var(--accent)" }) {
    return (_jsxs("svg", { width: size, height: size, viewBox: "-200 -200 400 400", "aria-hidden": "true", children: [_jsx("path", { d: "M0 -190 L 40 -60 L 170 -95 L 70 0 L 170 95 L 40 60 L 0 190 L -40 60 L -170 95 L -70 0 L -170 -95 L -40 -60 Z", fill: color }), _jsx("circle", { cx: "0", cy: "0", r: "52", fill: core })] }));
}
