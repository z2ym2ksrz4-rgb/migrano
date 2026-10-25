import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { monthlySeries, episodeSummary, tagFrequency, monthRange, patterns as loadPatterns, medDaysByMonth } from "@/core/diary";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import appConfig from "../../../../app.config.json";
import { useProGate } from "@/core/purchases";
import { useSettings } from "@/core/settings";
import { useUi } from "../store";
import { ReportSheet } from "./Report";
import { learningSentences } from "../learning";
/** Descriptive statistics only: counts, averages and shares. No scoring, no classification, no advice. */
export function Insights() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const gate = useProGate();
    const version = useUi((s) => s.version);
    const openInfo = useUi((s) => s.openInfo);
    const threshold = useSettings((s) => s.medThreshold);
    const [series, setSeries] = useState([]);
    const [sum, setSum] = useState(null);
    const [freq, setFreq] = useState([]);
    const [range, setRange] = useState("3m");
    const [reportOpen, setReportOpen] = useState(false);
    const [pat, setPat] = useState(null);
    const [moh, setMoh] = useState([]);
    const load = useCallback(async () => {
        if (!gate.isPro)
            return;
        const now = new Date();
        const months = range === "month" ? 1 : range === "3m" ? 3 : 12;
        const fromIso = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1).toISOString();
        const toIso = monthRange(now).toIso;
        setSeries(await monthlySeries(12));
        setSum(await episodeSummary(fromIso, toIso));
        setFreq(await tagFrequency(fromIso, toIso));
        setPat(await loadPatterns());
        setMoh(await medDaysByMonth(3));
    }, [gate.isPro, range]);
    useEffect(() => { void load(); }, [load, version]);
    if (!gate.isPro) {
        return (_jsxs("section", { className: "screen", children: [_jsx("h1", { children: t("insights.title") }), _jsxs("div", { className: "card col", children: [_jsx("strong", { children: t("insights.lockedTitle") }), _jsx("p", { className: "muted", children: t("insights.lockedBody") }), _jsx("button", { onClick: () => gate.allow("insights"), children: t("plan.upgrade") })] })] }));
    }
    const max = Math.max(1, ...series.map((s) => s.attackDays));
    const top = (group) => freq.filter((f) => f.groupKey === group).slice(0, 5);
    const Freq = ({ group }) => {
        const rows = top(group);
        if (!rows.length)
            return _jsx("p", { className: "muted small", children: t("insights.noData") });
        return (_jsx("div", { className: "freq", children: rows.map((f) => {
                const pct = f.total ? Math.round((f.n / f.total) * 100) : 0;
                return (_jsxs("div", { className: "f", children: [_jsx("span", { children: f.labelKey ? t(f.labelKey) : f.label }), _jsxs("span", { className: "muted", children: [pct, "%"] }), _jsx("div", { className: "track", children: _jsx("div", { className: "fill", style: { width: `${pct}%` } }) })] }, f.tagId));
            }) }));
    };
    return (_jsxs("section", { className: "screen", children: [_jsx("h1", { children: t("insights.title") }), _jsxs("button", { className: "cta report-btn", style: { marginTop: 4 }, onClick: () => setReportOpen(true), children: ["\uD83D\uDCC4 ", t("report.cta")] }), _jsx("h2", { children: t("insights.attackDaysPerMonth") }), _jsx("div", { className: "bars", children: series.map((s, i) => _jsx("div", { className: `bar ${i === series.length - 1 ? "cur" : ""}`, style: { height: `${(s.attackDays / max) * 100}%` }, title: `${s.month}: ${s.attackDays}` }, s.month)) }), _jsx("div", { className: "barlbl", children: series.map((s) => _jsx("span", { children: new Date(s.month + "-01T12:00:00").toLocaleDateString(lang, { month: "narrow" }) }, s.month)) }), _jsx("div", { className: "segment", style: { margin: "16px 0 8px" }, children: ["month", "3m", "12m"].map((r) => _jsx("button", { className: range === r ? "active" : "", onClick: () => setRange(r), children: t(`insights.range.${r}`) }, r)) }), sum && (_jsxs("div", { className: "stats", children: [_jsxs("div", { className: "stat", children: [_jsx("div", { className: "n", children: sum.episodes }), _jsx("div", { className: "l", children: t("insights.attacks") })] }), _jsxs("div", { className: "stat", children: [_jsx("div", { className: "n", children: sum.attackDays }), _jsx("div", { className: "l", children: t("insights.attackDays") })] }), _jsxs("div", { className: "stat", children: [_jsx("div", { className: "n", children: sum.avgHours != null ? sum.avgHours.toFixed(1) : "–" }), _jsx("div", { className: "l", children: t("insights.avgHours") })] }), _jsxs("div", { className: "stat", children: [_jsx("div", { className: "n", children: sum.avgIntensity != null ? sum.avgIntensity.toFixed(1) : "–" }), _jsx("div", { className: "l", children: t("insights.avgIntensity") })] }), _jsxs("div", { className: `stat ${range === "month" && sum.medDays >= threshold ? "warn" : ""}`, style: { gridColumn: "1 / -1" }, children: [_jsx("div", { className: "n", children: sum.medDays }), _jsx("div", { className: "l", children: t("insights.medDays", { n: threshold }) })] })] })), _jsx("h2", { children: t("insights.learnTitle") }), (() => {
                const lines = learningSentences(pat, freq, t, lang, moh[moh.length - 1]?.medDays ?? 0, threshold);
                return lines.length
                    ? _jsxs("div", { className: "card col learn", children: [lines.map((l, i) => _jsx("p", { children: l }, i)), _jsx("span", { className: "muted small", children: t("insights.learnNote") })] })
                    : _jsx("p", { className: "muted small", children: t("insights.learnEmpty") });
            })(), _jsx("h2", { children: t("insights.patterns") }), pat && (pat.weekday || pat.timeOfDay || pat.fields.length || pat.period || pat.pressure) ? (_jsxs("div", { className: "stack", children: [pat.weekday && _jsxs("div", { className: "card col", children: [_jsx("strong", { children: t("insights.patWeekday", { day: new Date(2024, 0, 7 + pat.weekday.day).toLocaleDateString(lang, { weekday: "long" }), pct: Math.round(pat.weekday.share * 100) }) }), _jsx("span", { className: "muted small", children: t("insights.patBasis", { n: pat.attacks }) })] }), pat.timeOfDay && _jsxs("div", { className: "card col", children: [_jsx("strong", { children: t("insights.patTime", { part: t(`insights.part.${pat.timeOfDay.part}`), pct: Math.round(pat.timeOfDay.share * 100) }) }), _jsx("span", { className: "muted small", children: t("insights.patBasis", { n: pat.attacks }) })] }), pat.fields.map((f) => (_jsxs("div", { className: "card col", children: [_jsx("strong", { children: t("insights.patField", { field: t(`home.fields.${f.key}`).toLowerCase(), before: f.beforeAttack.toLocaleString(lang, { maximumFractionDigits: 1 }), calm: f.beforeCalm.toLocaleString(lang, { maximumFractionDigits: 1 }) }) }), _jsx("span", { className: "muted small", children: t("insights.patFieldBasis", { n: f.n }) })] }, f.key))), pat.pressure && _jsxs("div", { className: "card col", children: [_jsx("strong", { children: t("insights.patPressure", { pct: Math.round((pat.pressure.attacksOnDrop / pat.pressure.attacks) * 100), all: Math.round(pat.pressure.dropShareAll * 100), hpa: pat.pressure.threshold }) }), _jsxs("span", { className: "muted small", children: [t("insights.patBasis", { n: pat.pressure.attacks }), " \u00B7 ", _jsx("button", { type: "button", className: "linklike small", onClick: () => openInfo("pressure"), children: t("weather.whatIsIt") })] })] }), pat.period && _jsxs("div", { className: "card col", children: [_jsx("strong", { children: t("insights.patPeriod", { pct: Math.round(pat.period.share * 100) }) }), _jsx("span", { className: "muted small", children: t("insights.patBasis", { n: pat.attacks }) })] }), _jsx("p", { className: "muted small", children: t("insights.patNote") })] })) : _jsx("p", { className: "muted small", children: t("insights.patNeed", { a: Math.max(0, 5 - (pat?.attacks ?? 0)), c: Math.max(0, 14 - (pat?.checkins ?? 0)) }) }), _jsx("h2", { children: t("insights.mohTitle") }), _jsx("div", { className: "moh", children: moh.map((m) => (_jsxs("div", { className: `stat ${m.medDays >= threshold ? "warn" : ""}`, children: [_jsx("div", { className: "n", children: m.medDays }), _jsx("div", { className: "l", children: new Date(m.month + "-01T12:00:00").toLocaleDateString(lang, { month: "short" }) })] }, m.month))) }), moh.length === 3 && moh.every((m) => m.medDays >= threshold) ? (_jsxs("div", { className: "card bad col", children: [_jsx("strong", { children: t("insights.mohAlert", { n: threshold }) }), _jsx("span", { className: "small", children: t("insights.mohBody") }), _jsx("button", { className: "small", style: { alignSelf: "flex-start", background: "var(--bad-fg)", color: "#fff" }, onClick: async () => {
                            const text = t("insights.mohShare", { months: moh.map((m) => `${new Date(m.month + "-01T12:00:00").toLocaleDateString(lang, { month: "long" })}: ${m.medDays}`).join(", "), n: threshold, app: appConfig.appName });
                            if (Capacitor.getPlatform() === "web") {
                                await navigator.clipboard?.writeText(text);
                                return;
                            }
                            await Share.share({ text });
                        }, children: t("insights.mohShareBtn") })] })) : _jsx("p", { className: "muted small", children: t("insights.mohHint", { n: threshold }) }), _jsxs("h2", { children: [t("diary.groups.trigger"), " ", _jsxs("span", { className: "muted", style: { textTransform: "none", letterSpacing: 0 }, children: ["\u00B7 ", t("insights.shareOfAttacks")] })] }), _jsx(Freq, { group: "trigger" }), _jsx("h2", { children: t("diary.groups.symptom") }), _jsx(Freq, { group: "symptom" }), _jsx("h2", { children: t("diary.groups.relief") }), _jsx(Freq, { group: "relief" }), _jsx("p", { className: "disclaimer", children: t("insights.disclaimer") }), _jsx(ReportSheet, { open: reportOpen, onClose: () => setReportOpen(false) })] }));
}
