import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { openEpisode, startEpisode, listEpisodes, episodeDays, medicationDays, monthRange, getCheckin, setCheckin, diaryConfig, daysSinceLastEpisode, } from "@/core/diary";
import { haptics, fmtDateTime, fmtTime, localDay, hours } from "@/core/ui";
import { useSettings } from "@/core/settings";
import { usePurchases } from "@/core/purchases";
import { useUi } from "../store";
import { PainStar } from "../components/PainStar";
import { publishWidget } from "../widget";
export function Home() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const version = useUi((s) => s.version);
    const openSheet = useUi((s) => s.openEpisode);
    const openInfo = useUi((s) => s.openInfo);
    const bump = useUi((s) => s.bump);
    const isPro = usePurchases((s) => s.isPro);
    const threshold = useSettings((s) => s.medThreshold);
    const userName = useSettings((s) => s.userName);
    const cycleTracking = useSettings((s) => s.cycleTracking);
    const [open, setOpen] = useState(null);
    const [recent, setRecent] = useState([]);
    const [stats, setStats] = useState({ attackDays: 0, medDays: 0, episodes: 0 });
    const [streak, setStreak] = useState(null);
    const [today, setToday] = useState(null);
    const [editing, setEditing] = useState(false);
    // draft check-in: written only on "Save the day"
    const [status, setStatus] = useState(null);
    const [extra, setExtra] = useState({});
    const day = localDay();
    const load = useCallback(async () => {
        const { fromIso, toIso } = monthRange();
        const o = await openEpisode();
        setOpen(o);
        setRecent((await listEpisodes()).slice(0, 5));
        const eps = await listEpisodes(fromIso, toIso);
        const st = { attackDays: await episodeDays(fromIso, toIso), medDays: await medicationDays(fromIso, toIso), episodes: eps.length };
        setStats(st);
        const ds = await daysSinceLastEpisode();
        setStreak(ds);
        const c = await getCheckin(day);
        setToday(c);
        if (c) {
            setStatus(c.status);
            setExtra(c.extra ? JSON.parse(c.extra) : {});
        }
        else {
            setStatus(o ? "attack" : null);
            setExtra({});
        }
        void publishWidget({ open: !!o, daysSince: ds, attackDays: st.attackDays, medDays: st.medDays, t });
    }, [day, t]);
    useEffect(() => { void load(); }, [load, version]);
    const onAttackNow = async () => { const e = await startEpisode(); haptics.thud(); bump(); openSheet(e.id, "quick"); };
    const saveDay = async () => {
        await setCheckin(day, status ?? (open ? "attack" : "none"), extra, today?.note ?? null);
        haptics.success();
        setEditing(false);
        bump();
    };
    const warn = isPro && stats.medDays >= threshold;
    const saved = !!today && !editing;
    const fields = diaryConfig().checkinFields;
    const summary = () => {
        const parts = [t(`home.checkin.${today?.status ?? "none"}`)];
        for (const f of fields)
            if (typeof extra[f.key] === "number")
                parts.push(`${t(`home.fields.${f.key}`)} ${extra[f.key]}`);
        if (extra.period)
            parts.push(t("home.periodShort"));
        return parts.join(" · ");
    };
    return (_jsxs("section", { className: "screen", children: [_jsxs("div", { className: "hero", children: [_jsx("p", { className: "eyebrow", children: new Date().toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" }) }), _jsx("h1", { children: userName ? t("home.greeting", { name: userName }) : t("home.title") })] }), _jsxs("div", { className: "hero-btn-wrap", children: [open ? (_jsx("button", { className: "hero-btn live", onClick: () => openSheet(open.id, "full"), "aria-label": t("home.openSince", { time: fmtTime(open.startedAt, lang) }), children: _jsx(PainStar, { size: 56 }) })) : (_jsx("button", { className: "hero-btn", onClick: onAttackNow, "aria-label": t("home.attackNow"), children: _jsx(PainStar, { size: 56 }) })), _jsx("div", { className: "hero-lbl", children: open ? _jsxs(_Fragment, { children: [_jsx("strong", { children: t("home.openSince", { time: fmtTime(open.startedAt, lang) }) }), _jsx("span", { className: "muted small", children: t("home.tapToEdit") })] })
                            : _jsxs(_Fragment, { children: [_jsx("strong", { children: t("home.attackNow") }), _jsx("span", { className: "muted small", children: t("home.attackHint") })] }) })] }), warn && (_jsxs("div", { className: "card warn col", children: [_jsx("strong", { children: t("home.medWarnTitle", { n: stats.medDays }) }), _jsx("span", { className: "small", children: t("home.medWarnBody", { n: threshold }) })] })), _jsxs("div", { className: "stats", children: [_jsxs("div", { className: "stat", children: [_jsx("div", { className: "n", children: stats.attackDays }), _jsx("div", { className: "l", children: t("home.attackDays") })] }), _jsxs("button", { type: "button", className: `stat tap ${warn ? "warn" : ""}`, onClick: () => openInfo("medDays"), children: [_jsx("div", { className: "n", children: stats.medDays }), _jsxs("div", { className: "l", children: [t("home.medDays"), " ", _jsx("i", { className: "info", children: "i" })] })] }), streak != null && !open && (_jsxs("div", { className: "stat ok", style: { gridColumn: "1 / -1" }, children: [_jsx("div", { className: "n", children: streak }), _jsx("div", { className: "l", children: t("home.streak", { count: streak }) })] }))] }), _jsx("h2", { children: t("home.checkinTitle") }), saved ? (_jsxs("div", { className: "card", children: [_jsxs("div", { children: [_jsx("strong", { children: t("home.savedDay") }), _jsx("div", { className: "muted small", children: summary() })] }), _jsx("button", { className: "ghost", onClick: () => setEditing(true), children: t("common.edit") })] })) : (_jsxs("div", { className: "card col checkin-card", children: [_jsx("div", { className: "checkin", children: ["none", "mild", "attack"].map((s) => (_jsx("button", { className: status === s ? `on ${s}` : "", onClick: () => { setStatus(s); haptics.tap(); }, children: t(`home.checkin.${s}`) }, s))) }), fields.map((f) => (_jsxs("div", { className: "field", children: [_jsx("span", { children: t(`home.fields.${f.key}`) }), _jsx("div", { className: "scale", children: Array.from({ length: f.max }, (_, i) => i + 1).map((v) => (_jsx("button", { className: extra[f.key] === v ? "on" : "", onClick: () => setExtra({ ...extra, [f.key]: v }), children: v }, v))) })] }, f.key))), cycleTracking && (_jsx("button", { type: "button", className: `chip ${extra.period ? "on" : ""}`, style: { alignSelf: "flex-start" }, onClick: () => setExtra({ ...extra, period: !extra.period }), children: t("home.periodToday") })), _jsx("button", { className: "cta", style: { marginTop: 6 }, disabled: !status, onClick: saveDay, children: t("home.saveDay") })] })), _jsx("h2", { children: t("home.recent") }), recent.length === 0 ? _jsx("p", { className: "empty", children: t("home.empty") }) : (_jsx("ul", { className: "list", children: recent.map((e) => (_jsxs("li", { className: "tap", onClick: () => openSheet(e.id, "full"), children: [_jsxs("div", { children: [_jsx("strong", { children: fmtDateTime(e.startedAt, lang) }), _jsxs("small", { children: [e.endedAt ? t("episode.duration", { h: hours(e.startedAt, e.endedAt).toFixed(1) }) : t("home.ongoing"), e.intensity ? ` · ${e.intensity}/10` : ""] })] }), _jsx("span", { className: "muted", children: "\u203A" })] }, e.id))) })), _jsx("p", { className: "disclaimer", children: t("common.disclaimer") })] }));
}
