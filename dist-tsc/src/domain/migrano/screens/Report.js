import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sheet, localDay } from "@/core/ui";
import { monthRange, monthlySeries, medDaysByMonth, patterns, tagFrequency, weatherDays } from "@/core/diary";
import { learningSentences } from "../learning";
import { useSettings } from "@/core/settings";
import { maybeAskForReview } from "@/core/review";
export function ReportSheet({ open, onClose }) {
    const { t, i18n } = useTranslation();
    const settings = useSettings();
    const [preset, setPreset] = useState("3m");
    const [from, setFrom] = useState(() => localDay(new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1)));
    const [to, setTo] = useState(() => localDay());
    const [busy, setBusy] = useState(false);
    const [notes, setNotes] = useState("");
    const range = () => {
        const now = new Date();
        if (preset === "month")
            return monthRange(now);
        if (preset === "last")
            return monthRange(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        if (preset === "3m")
            return { fromIso: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(), toIso: monthRange(now).toIso };
        return { fromIso: new Date(from + "T00:00:00").toISOString(), toIso: new Date(new Date(to + "T00:00:00").getTime() + 864e5).toISOString() };
    };
    const make = async () => {
        setBusy(true);
        try {
            const { buildReport, sharePdf } = await import("../report");
            const { fromIso, toIso } = range();
            const months = Math.max(2, Math.min(12, Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / (30 * 864e5))));
            const series = await monthlySeries(months);
            const med = await medDaysByMonth(months);
            const monthly = series.map((m, i) => ({ month: m.month, attackDays: m.attackDays, medDays: med[i]?.medDays ?? 0 }));
            const pat = await patterns();
            const freq = await tagFrequency(fromIso, toIso);
            const learning = learningSentences(pat, freq, t, i18n.language, med[med.length - 1]?.medDays ?? 0, settings.medThreshold);
            const wd = await weatherDays(fromIso.slice(0, 10), toIso.slice(0, 10));
            const byDate = new Map(wd.map((w) => [w.date, w.pressureMean]));
            const pressure = new Map();
            for (const w of wd) {
                if (w.pressureMean == null)
                    continue;
                const d = new Date(w.date + "T12:00:00");
                d.setDate(d.getDate() - 1);
                const prev = byDate.get(d.toISOString().slice(0, 10));
                pressure.set(w.date, { p: Math.round(w.pressureMean), delta: prev != null ? Math.round(w.pressureMean - prev) : null });
            }
            const doc = await buildReport(fromIso, toIso, t, i18n.language, { name: settings.userName, notes, monthly, learning, pressure: settings.weatherEnabled ? pressure : undefined });
            await sharePdf(doc, `migrano-${fromIso.slice(0, 10)}-${toIso.slice(0, 10)}.pdf`, t("report.title"));
            await settings.set("successEvents", settings.successEvents + 1);
            void maybeAskForReview();
            onClose();
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsxs(Sheet, { open: open, onClose: onClose, title: t("report.title"), children: [_jsx("p", { className: "muted small", children: t("report.sub") }), _jsx("div", { className: "stack", style: { margin: "10px 0" }, children: ["month", "last", "3m", "custom"].map((p) => (_jsx("button", { className: `chip ${preset === p ? "on" : ""}`, style: { textAlign: "left" }, onClick: () => setPreset(p), children: t(`report.preset.${p}`) }, p))) }), preset === "custom" && (_jsxs("div", { className: "row", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: t("report.from") }), _jsx("input", { type: "date", value: from, onChange: (e) => setFrom(e.target.value) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("report.to") }), _jsx("input", { type: "date", value: to, onChange: (e) => setTo(e.target.value) })] })] })), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("report.notesTitle") }), _jsx("textarea", { rows: 3, value: notes, onChange: (e) => setNotes(e.target.value), placeholder: t("report.notesPh") })] }), _jsx("button", { className: "cta", onClick: make, disabled: busy, children: busy ? "…" : t("report.make") }), _jsx("p", { className: "disclaimer", children: t("report.footer", { app: "Migrano" }) })] }));
}
