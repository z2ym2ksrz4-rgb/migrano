import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { Sheet } from "@/core/ui";
import { useSettings } from "@/core/settings";
import { useUi } from "../store";
import { PainStar } from "../components/PainStar";
/** Explainers opened from several places: what medication days are, and how to add the widget. */
export function InfoSheets() {
    const { t } = useTranslation();
    const which = useUi((s) => s.infoSheet);
    const openInfo = useUi((s) => s.openInfo);
    const threshold = useSettings((s) => s.medThreshold);
    const close = () => openInfo(null);
    const ios = Capacitor.getPlatform() !== "android";
    return (_jsxs(_Fragment, { children: [_jsxs(Sheet, { open: which === "medDays", onClose: close, title: t("medDays.title"), children: [_jsx("p", { children: t("medDays.what") }), _jsx("p", { children: t("medDays.why") }), _jsxs("div", { className: "card col", children: [_jsx("strong", { children: t("medDays.yourLimit", { n: threshold }) }), _jsx("span", { className: "muted small", children: t("medDays.limitHint") })] }), _jsx("p", { className: "disclaimer", children: t("medDays.disclaimer") }), _jsx("button", { className: "cta", onClick: close, children: t("common.done") })] }), _jsxs(Sheet, { open: which === "widget", onClose: close, title: t("widget.title"), children: [_jsxs("div", { className: "widget-preview", children: [_jsxs("div", { className: "wp-tile", children: [_jsx(PainStar, { size: 40, color: "#FFF4EC", core: "#D63E3E" }), _jsx("span", { children: t("widget.attackNow") })] }), _jsxs("div", { className: "wp-text", children: [_jsx("strong", { children: t("widget.previewLine1") }), _jsx("span", { className: "muted small", children: t("widget.previewLine2") })] })] }), _jsx("p", { className: "muted", children: t("widget.intro") }), _jsx("ol", { className: "steps", children: t(ios ? "widget.stepsIos" : "widget.stepsAndroid", { returnObjects: true }).map((s, i) => _jsx("li", { children: s }, i)) }), ios && _jsx("p", { className: "muted small", children: t("widget.lockscreen") }), _jsx("button", { className: "cta", onClick: close, children: t("common.done") })] })] }));
}
