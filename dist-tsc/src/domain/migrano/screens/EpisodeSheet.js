import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { listEpisodes, updateEpisode, endEpisode, deleteEpisode, listTags, episodeTagIds, setEpisodeTags, tagUsage, episodeComparison, listMedications, listIntakes, logIntake, deleteIntake, diaryConfig, } from "@/core/diary";
import { Sheet, haptics, fmtTime, toLocalInput, fromLocalInput, hours } from "@/core/ui";
import { useSettings } from "@/core/settings";
import { usePurchases, useProGate } from "@/core/purchases";
import { maybeAskForReview } from "@/core/review";
import { TagPicker } from "../components/TagPicker";
import { useUi } from "../store";
import { removeHealthSample } from "../health";
/**
 * The attack sheet in three tempos:
 *  - quick   : right after "Attack now" — one question (how bad?), everything else can wait.
 *  - journey : when the attack ends (or the user comes back) — 4 short steps with the user's 6 most used chips each,
 *              "more…" expands, every step can be skipped. Ends with this attack vs. your average (Pro).
 *  - full    : the complete editable form (start/end, slider, all chips, medication, note, delete).
 * All writes happen immediately; the modes only change what is on screen.
 */
export function EpisodeSheet() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const id = useUi((s) => s.episodeSheetId);
    const mode = useUi((s) => s.episodeSheetMode);
    const setMode = useUi((s) => s.setMode);
    const close = useUi((s) => s.closeEpisode);
    const bump = useUi((s) => s.bump);
    const settings = useSettings();
    const isPro = usePurchases((s) => s.isPro);
    const gate = useProGate();
    const [ep, setEp] = useState(null);
    const [tags, setTags] = useState([]);
    const [usage, setUsage] = useState({});
    const [sel, setSel] = useState(new Set());
    const [meds, setMeds] = useState([]);
    const [intakes, setIntakes] = useState([]);
    const [note, setNote] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [step, setStep] = useState(0);
    const [expanded, setExpanded] = useState({});
    const [cmp, setCmp] = useState(null);
    const load = useCallback(async () => {
        if (!id)
            return;
        const e = (await listEpisodes()).find((x) => x.id === id) ?? null;
        setEp(e);
        setNote(e?.note ?? "");
        setTags(await listTags());
        setSel(new Set(await episodeTagIds(id)));
        setUsage(await tagUsage());
        setMeds(await listMedications());
        setIntakes(await listIntakes(id));
    }, [id]);
    useEffect(() => { void load(); setConfirmDelete(false); setStep(0); setExpanded({}); setCmp(null); }, [load]);
    const groups = diaryConfig().tagGroups;
    const journeyGroups = useMemo(() => groups.filter((g) => g.kind === "trigger" || g.kind === "symptom" || g.kind === "relief"), [groups]);
    const steps = useMemo(() => [...journeyGroups.map((g) => `tags:${g.key}`), "meds", "note", "done"], [journeyGroups]);
    if (!id || !ep)
        return null;
    const patch = async (p) => { await updateEpisode(ep.id, p); setEp({ ...ep, ...p }); bump(); };
    const onTags = async (n) => { setSel(n); await setEpisodeTags(ep.id, [...n]); bump(); };
    const toggleTag = (tid) => { const n = new Set(sel); if (n.has(tid))
        n.delete(tid);
    else
        n.add(tid); haptics.tap(); void onTags(n); };
    const onEnd = async () => {
        await endEpisode(ep.id);
        haptics.success();
        await settings.set("successEvents", settings.successEvents + 1);
        void maybeAskForReview();
        bump();
        await load();
        setStep(0);
        setMode("journey");
    };
    const onIntake = async (m) => { await logIntake(m.id, ep.id); haptics.tap(); setIntakes(await listIntakes(ep.id)); bump(); };
    const onDelete = async () => { await removeHealthSample(ep); await deleteEpisode(ep.id); bump(); close(); };
    const dur = ep.endedAt ? hours(ep.startedAt, ep.endedAt) : null;
    const title = ep.endedAt ? t("episode.title") : t("episode.ongoing");
    // ---- quick: one question --------------------------------------------------------------------------------
    if (mode === "quick") {
        const pick = async (v) => { await patch({ intensity: v }); haptics.thud(); close(); };
        return (_jsxs(Sheet, { open: true, onClose: close, title: t("episode.ongoing"), children: [_jsx("p", { className: "muted", children: t("episode.quickIntro") }), _jsx("h3", { style: { marginTop: 14 }, children: t("episode.howBad") }), _jsx("div", { className: "bigchoice", children: [{ v: 3, k: "mild" }, { v: 6, k: "moderate" }, { v: 9, k: "severe" }].map((o) => (_jsx("button", { type: "button", className: `big ${o.k}`, onClick: () => pick(o.v), children: t(`episode.level.${o.k}`) }, o.k))) }), _jsx("button", { type: "button", className: "linklike", style: { marginTop: 16 }, onClick: close, children: t("episode.laterLink") })] }));
    }
    // ---- live: the attack is running — one screen: how bad now, end it, or edit everything ---------------------
    if (mode === "live") {
        const cur = ep.intensity == null ? null : ep.intensity <= 3 ? "mild" : ep.intensity <= 6 ? "moderate" : "severe";
        return (_jsxs(Sheet, { open: true, onClose: close, title: t("home.openSince", { time: fmtTime(ep.startedAt, i18n.language) }), children: [_jsx("button", { className: "cta", style: { marginTop: 4 }, onClick: onEnd, children: t("home.endAttack") }), _jsx("p", { className: "muted small", style: { marginTop: 10 }, children: t("episode.liveHint") }), cur == null ? (_jsxs(_Fragment, { children: [_jsx("h3", { style: { marginTop: 14 }, children: t("episode.howBad") }), _jsx("div", { className: "bigchoice", children: [{ v: 3, k: "mild" }, { v: 6, k: "moderate" }, { v: 9, k: "severe" }].map((o) => (_jsx("button", { type: "button", className: `big ${o.k}`, onClick: () => { void patch({ intensity: o.v }); haptics.tap(); }, children: t(`episode.level.${o.k}`) }, o.k))) })] })) : (_jsxs("p", { className: "muted", style: { marginTop: 14 }, children: [t("episode.intensity"), ": ", _jsx("strong", { children: t(`episode.level.${cur}`) }), " \u00B7 ", ep.intensity, "/10"] })), _jsx("button", { type: "button", className: "linklike", style: { marginTop: 16 }, onClick: () => setMode("full"), children: t("episode.editAll") })] }));
    }
    // ---- journey: 4 short steps -------------------------------------------------------------------------------
    if (mode === "journey") {
        const cur = steps[step];
        const next = () => { haptics.tap(); if (step < steps.length - 1)
            setStep(step + 1);
        else
            close(); };
        const Dots = () => _jsx("div", { className: "dots", style: { marginBottom: 6 }, children: steps.map((s, i) => _jsx("span", { className: i === step ? "on" : i < step ? "done" : "" }, s)) });
        const Nav = ({ skip = true }) => (_jsxs("div", { className: "row between", style: { marginTop: 18 }, children: [_jsx("button", { type: "button", className: "linklike", onClick: () => setMode("full"), children: t("episode.editAll") }), _jsxs("div", { className: "row tight", children: [skip && _jsx("button", { type: "button", className: "ghost", onClick: next, children: t("episode.skip") }), _jsx("button", { type: "button", onClick: next, children: step === steps.length - 1 ? t("common.done") : t("onboarding.next") })] })] }));
        if (cur.startsWith("tags:")) {
            const gk = cur.slice(5);
            const all = tags.filter((x) => x.groupKey === gk && (!x.isHidden || sel.has(x.id)));
            const ranked = [...all].sort((a, b) => (usage[b.id] ?? 0) - (usage[a.id] ?? 0) || a.sort - b.sort);
            const top = expanded[gk] ? ranked : ranked.filter((x, i) => i < 6 || sel.has(x.id));
            return (_jsxs(Sheet, { open: true, onClose: close, title: title, children: [_jsx(Dots, {}), _jsx("h3", { children: t(`episode.journey.${gk}`, { defaultValue: t(`diary.groups.${gk}`) }) }), _jsxs("div", { className: "bigchips", children: [top.map((x) => _jsx("button", { type: "button", className: `chip ${sel.has(x.id) ? "on" : ""}`, onClick: () => toggleTag(x.id), children: x.labelKey ? t(x.labelKey) : x.label }, x.id)), !expanded[gk] && ranked.length > top.length && _jsx("button", { type: "button", className: "chip other", onClick: () => setExpanded({ ...expanded, [gk]: true }), children: t("episode.more", { n: ranked.length - top.length }) })] }), expanded[gk] && _jsx(TagPicker, { groupKey: gk, tags: [], selected: sel, onChange: onTags, onTagAdded: async () => setTags(await listTags()), compact: true }), _jsx(Nav, {})] }));
        }
        if (cur === "meds") {
            return (_jsxs(Sheet, { open: true, onClose: close, title: title, children: [_jsx(Dots, {}), _jsx("h3", { children: t("episode.journey.meds") }), meds.length === 0 ? (_jsx("button", { type: "button", className: "ghost", onClick: () => useUi.getState().setMedsOpen(true), children: t("meds.addFirst") })) : (_jsx("div", { className: "bigchips", children: meds.map((m) => { const n = intakes.filter((i) => i.medicationId === m.id).length; return _jsxs("button", { type: "button", className: `chip ${n ? "on" : ""}`, onClick: () => onIntake(m), children: [m.name, n ? ` ×${n}` : ""] }, m.id); }) })), intakes.length > 0 && _jsxs("p", { className: "muted small", children: [intakes.map((i) => `${i.name} ${fmtTime(i.takenAt, lang)}`).join(" · "), " \u00B7 ", _jsx("button", { type: "button", className: "linklike", onClick: () => setMode("full"), children: t("common.edit") })] }), _jsx(Nav, {})] }));
        }
        if (cur === "note") {
            return (_jsxs(Sheet, { open: true, onClose: close, title: title, children: [_jsx(Dots, {}), _jsx("h3", { children: t("episode.journey.note") }), _jsx("textarea", { rows: 3, value: note, onChange: (e) => setNote(e.target.value), onBlur: () => patch({ note: note.trim() || null }), placeholder: t("episode.notePh") }), _jsx(Nav, {})] }));
        }
        // done: summary + comparison
        if (!cmp)
            void episodeComparison(ep.id).then(setCmp);
        const f1 = (n) => (n == null ? "–" : n.toLocaleString(lang, { maximumFractionDigits: 1 }));
        return (_jsxs(Sheet, { open: true, onClose: close, title: t("episode.doneTitle"), children: [_jsx(Dots, {}), _jsxs("p", { className: "muted", children: [dur != null ? t("episode.duration", { h: dur.toFixed(1) }) : t("home.ongoing"), ep.intensity ? ` · ${ep.intensity}/10` : "", " \u00B7 ", [...sel].length, " ", t("episode.tagsCount")] }), isPro ? (cmp && cmp.n >= 2 ? (_jsxs("div", { className: "card col", children: [_jsx("strong", { children: t("episode.cmpTitle") }), _jsxs("div", { className: "cmp", children: [_jsxs("div", { children: [_jsx("span", { className: "muted small", children: t("episode.cmpThis") }), _jsxs("b", { children: [f1(cmp.hours), " ", t("report.hours").toLowerCase(), " \u00B7 ", cmp.intensity ?? "–", "/10"] })] }), _jsxs("div", { children: [_jsx("span", { className: "muted small", children: t("episode.cmpAvg", { n: cmp.n }) }), _jsxs("b", { children: [f1(cmp.avgHours), " ", t("report.hours").toLowerCase(), " \u00B7 ", f1(cmp.avgIntensity), "/10"] })] })] })] })) : _jsx("p", { className: "muted small", children: t("episode.cmpNeedMore") })) : (_jsxs("button", { type: "button", className: "card col tap", style: { textAlign: "left", width: "100%" }, onClick: () => gate.allow("insights"), children: [_jsx("strong", { children: t("episode.cmpTitle") }), _jsx("span", { className: "muted small", children: t("episode.cmpLocked") })] })), _jsx(Nav, { skip: false })] }));
    }
    // ---- full ----------------------------------------------------------------------------------------------
    return (_jsxs(Sheet, { open: true, onClose: close, title: title, tall: true, children: [!ep.endedAt && _jsx("button", { className: "cta", style: { marginTop: 0 }, onClick: onEnd, children: t("home.endAttack") }), _jsxs("div", { className: "row", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: t("episode.start") }), _jsx("input", { type: "datetime-local", value: toLocalInput(ep.startedAt), onChange: (e) => e.target.value && patch({ startedAt: fromLocalInput(e.target.value) }) })] }), ep.endedAt && (_jsxs("label", { className: "field", children: [_jsx("span", { children: t("episode.end") }), _jsx("input", { type: "datetime-local", value: toLocalInput(ep.endedAt), onChange: (e) => e.target.value && patch({ endedAt: fromLocalInput(e.target.value) }) })] }))] }), dur != null && _jsx("p", { className: "muted small", children: t("episode.duration", { h: dur.toFixed(1) }) }), _jsxs("div", { className: "field", children: [_jsxs("span", { children: [t("episode.intensity"), " ", ep.intensity ? `· ${ep.intensity}/10` : ""] }), _jsx("input", { type: "range", min: 1, max: 10, step: 1, value: ep.intensity ?? 5, onChange: (e) => patch({ intensity: Number(e.target.value) }) }), _jsxs("div", { className: "row between small muted", children: [_jsx("span", { children: t("episode.mildLbl") }), _jsx("span", { children: t("episode.severeLbl") })] })] }), groups.map((g) => (_jsx(TagPicker, { groupKey: g.key, tags: tags.filter((x) => x.groupKey === g.key), selected: sel, onChange: onTags, onTagAdded: async () => setTags(await listTags()) }, g.key))), _jsxs("div", { className: "field", children: [_jsx("span", { children: t("meds.title") }), meds.length === 0 ? (_jsx("button", { type: "button", className: "ghost", onClick: () => useUi.getState().setMedsOpen(true), children: t("meds.addFirst") })) : (_jsx("div", { className: "chips", children: meds.map((m) => _jsxs("button", { type: "button", className: "chip", onClick: () => onIntake(m), children: ["+ ", m.name] }, m.id)) })), intakes.length > 0 && (_jsx("ul", { className: "list", style: { margin: "6px 0 0" }, children: intakes.map((i) => (_jsxs("li", { className: "tap", style: { padding: "10px 14px" }, children: [_jsxs("span", { children: [i.name, " ", _jsx("span", { className: "muted small", children: fmtTime(i.takenAt, lang) })] }), _jsx("button", { type: "button", className: "small ghost danger", onClick: async () => { await deleteIntake(i.id); setIntakes(await listIntakes(ep.id)); bump(); }, children: "\u00D7" })] }, i.id))) }))] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("episode.note") }), _jsx("textarea", { rows: 2, value: note, onChange: (e) => setNote(e.target.value), onBlur: () => patch({ note: note.trim() || null }), placeholder: t("episode.notePh") })] }), _jsxs("div", { className: "row between", style: { marginTop: 18 }, children: [confirmDelete
                        ? _jsx("button", { type: "button", className: "ghost danger", onClick: onDelete, children: t("episode.deleteConfirm") })
                        : _jsx("button", { type: "button", className: "linklike", onClick: () => setConfirmDelete(true), children: t("common.delete") }), _jsx("button", { type: "button", onClick: close, children: t("common.done") })] })] }));
}
