import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { openEpisode, startEpisode, endEpisode, listEpisodes, listTags, medicationDays, episodeDays, monthRange, } from "@/core/diary";
/**
 * Phase 2 placeholder home: proves engine + seed + i18n end to end (start/stop an attack, see this month's numbers,
 * see seeded tags in the active language). Real screens arrive in phase 3.
 */
export function MigranoRoutes() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(null);
    const [recent, setRecent] = useState([]);
    const [tags, setTags] = useState([]);
    const [stats, setStats] = useState({ attackDays: 0, medDays: 0 });
    const load = useCallback(async () => {
        const { fromIso, toIso } = monthRange();
        setOpen(await openEpisode());
        setRecent((await listEpisodes()).slice(0, 10));
        setTags(await listTags("trigger"));
        setStats({ attackDays: await episodeDays(fromIso, toIso), medDays: await medicationDays(fromIso, toIso) });
    }, []);
    useEffect(() => { void load(); }, [load]);
    const onAttackNow = async () => { await startEpisode(); await load(); };
    const onEnd = async () => { if (open) {
        await endEpisode(open.id);
        await load();
    } };
    return (_jsxs("section", { className: "screen", children: [_jsx("h1", { children: t("home.title") }), open ? (_jsxs("div", { className: "card", children: [_jsx("p", { children: t("home.openSince", { time: new Date(open.startedAt).toLocaleTimeString() }) }), _jsx("button", { onClick: onEnd, children: t("home.endAttack") })] })) : (_jsx("button", { className: "primary", onClick: onAttackNow, children: t("home.attackNow") })), _jsx("p", { children: t("home.monthStats", { attackDays: stats.attackDays, medDays: stats.medDays }) }), _jsx("h2", { children: t("home.recent") }), _jsx("ul", { className: "list", children: recent.map((e) => (_jsxs("li", { children: [new Date(e.startedAt).toLocaleString(), " ", e.endedAt ? "" : `· ${t("home.ongoing")}`] }, e.id))) }), _jsx("h2", { children: t("diary.groups.trigger") }), _jsx("div", { className: "chips", children: tags.filter((x) => !x.isHidden).map((x) => (_jsx("span", { className: "chip", children: x.labelKey ? t(x.labelKey) : x.label }, x.id))) })] }));
}
