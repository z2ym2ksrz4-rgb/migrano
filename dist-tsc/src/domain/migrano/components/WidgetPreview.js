import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { PainStar } from "./PainStar";
/** The little mock of the home-screen widget, shared by the onboarding intro and the settings guide. */
export function WidgetPreview() {
    const { t } = useTranslation();
    return (_jsxs("div", { className: "widget-preview", children: [_jsxs("div", { className: "wp-tile", children: [_jsx(PainStar, { size: 40, color: "#FFF4EC", core: "#D63E3E" }), _jsx("span", { children: t("widget.attackNow") })] }), _jsxs("div", { className: "wp-text", children: [_jsx("strong", { children: t("widget.previewLine1") }), _jsx("span", { className: "muted small", children: t("widget.previewLine2") })] })] }));
}
