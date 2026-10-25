import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { listEpisodes, listCheckins, diaryConfig } from "@/core/diary";
import { fmtTime, localDay, hours } from "@/core/ui";
import { useProGate } from "@/core/purchases";
import { useUi } from "../store";
/** Month heatmap: colour = worst intensity that day (1–10 → 4 steps); check-in "mild" days get their own tint. */
export function Calendar() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const version = useUi((s) => s.version);
    const openSheet = useUi((s) => s.openEpisode);
    const gate = useProGate();
    const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const [eps, setEps] = useState([]);
    const [checkins, setCheckins] = useState([]);
    const [sel, setSel] = useState(null);
    const cursorKey = cursor.getTime();
    const { first, last } = useMemo(() => ({ first: new Date(cursorKey), last: new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0) }), [cursorKey]); // eslint-disable-line react-hooks/exhaustive-deps
    const load = useCallback(async () => {
        const from = new Date(first.getFullYear(), first.getMonth(), 1 - 7).toISOString();
        const to = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1).toISOString();
        setEps(await listEpisodes(from, to));
        setCheckins(await listCheckins(localDay(first), localDay(last)));
    }, [first, last]);
    useEffect(() => { void load(); }, [load, version]);
    const byDay = useMemo(() => {
        const m = new Map();
        for (const e of eps) {
            const start = new Date(e.startedAt), end = new Date(e.endedAt ?? new Date().toISOString());
            for (let d = new Date(start.getFullYear(), start.getMonth(), start.getDate()); d <= end; d.setDate(d.getDate() + 1)) {
                const k = localDay(d);
                const cur = m.get(k) ?? { max: 0, eps: [] };
                cur.max = Math.max(cur.max, e.intensity ?? 5);
                if (!cur.eps.includes(e))
                    cur.eps.push(e);
                m.set(k, cur);
            }
        }
        for (const c of checkins) {
            const cur = m.get(c.date) ?? { max: 0, eps: [] };
            cur.checkin = c;
            m.set(c.date, cur);
        }
        return m;
    }, [eps, checkins]);
    const freeFloor = new Date();
    freeFloor.setDate(freeFloor.getDate() - diaryConfig().freeHistoryDays);
    const monthLocked = !gate.isPro && last < freeFloor;
    const go = (delta) => {
        const next = new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
        const nextLast = new Date(next.getFullYear(), next.getMonth() + 1, 0);
        if (!gate.isPro && nextLast < freeFloor && !gate.allow("history"))
            return;
        setCursor(next);
        setSel(null);
    };
    const dow = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, i + 1).toLocaleDateString(lang, { weekday: "short" }).slice(0, 2)); // Mon-first
    const lead = (first.getDay() + 6) % 7;
    const today = localDay();
    const cls = (k) => {
        const d = byDay.get(k);
        if (!d)
            return "";
        if (d.eps.length)
            return `h${Math.min(4, Math.ceil(d.max / 2.5))}`;
        return d.checkin?.status === "mild" ? "mild" : d.checkin?.status === "attack" ? "h2" : "";
    };
    const selData = sel ? byDay.get(sel) : undefined;
    return (_jsxs("section", { className: "screen", children: [_jsxs("div", { className: "cal-head", children: [_jsx("button", { onClick: () => go(-1), "aria-label": "prev", children: "\u2039" }), _jsx("h1", { children: cursor.toLocaleDateString(lang, { month: "long", year: "numeric" }) }), _jsx("button", { onClick: () => go(1), "aria-label": "next", children: "\u203A" })] }), _jsxs("div", { className: "cal", children: [dow.map((d, i) => _jsx("div", { className: "dow", children: d }, i)), Array.from({ length: lead }, (_, i) => _jsx("div", { className: "day blank" }, `b${i}`)), Array.from({ length: last.getDate() }, (_, i) => {
                        const k = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                        return (_jsx("button", { className: `day ${cls(k)} ${k === today ? "today" : ""} ${sel === k ? "sel" : ""} ${monthLocked ? "locked" : ""}`, onClick: () => { if (monthLocked && !gate.allow("history"))
                                return; setSel(sel === k ? null : k); }, children: i + 1 }, k));
                    })] }), _jsxs("div", { className: "legend", children: [_jsxs("span", { children: [_jsx("i", { style: { background: "var(--heat-mild)" } }), t("home.checkin.mild")] }), _jsxs("span", { children: [_jsx("i", { style: { background: "var(--heat-1)" } }), "1\u20132"] }), _jsxs("span", { children: [_jsx("i", { style: { background: "var(--heat-2)" } }), "3\u20135"] }), _jsxs("span", { children: [_jsx("i", { style: { background: "var(--heat-3)" } }), "6\u20137"] }), _jsxs("span", { children: [_jsx("i", { style: { background: "var(--heat-4)" } }), "8\u201310"] })] }), sel && (_jsxs(_Fragment, { children: [_jsx("h2", { children: new Date(sel + "T12:00:00").toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" }) }), selData?.checkin && _jsxs("p", { className: "muted small", children: [t("home.checkinTitle"), ": ", t(`home.checkin.${selData.checkin.status}`)] }), !selData?.eps.length ? _jsx("p", { className: "empty", children: t("calendar.noAttacks") }) : (_jsx("ul", { className: "list", children: selData.eps.map((e) => (_jsxs("li", { className: "tap", onClick: () => openSheet(e.id), children: [_jsxs("div", { children: [_jsxs("strong", { children: [fmtTime(e.startedAt, lang), e.endedAt ? ` – ${fmtTime(e.endedAt, lang)}` : ""] }), _jsxs("small", { children: [e.endedAt ? t("episode.duration", { h: hours(e.startedAt, e.endedAt).toFixed(1) }) : t("home.ongoing"), e.intensity ? ` · ${e.intensity}/10` : ""] })] }), _jsx("span", { className: "muted", children: "\u203A" })] }, e.id))) }))] }))] }));
}
