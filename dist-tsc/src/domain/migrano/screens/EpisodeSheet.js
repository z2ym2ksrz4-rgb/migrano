import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listEpisodes, updateEpisode, endEpisode, deleteEpisode, listTags, episodeTagIds, setEpisodeTags, listMedications, listIntakes, logIntake, deleteIntake, diaryConfig, } from "@/core/diary";
import { Sheet, haptics, fmtTime, toLocalInput, fromLocalInput, hours } from "@/core/ui";
import { useSettings } from "@/core/settings";
import { maybeAskForReview } from "@/core/review";
import { TagPicker } from "../components/TagPicker";
import { useUi } from "../store";
/**
 * The attack sheet. Opens right after "Attack now" with only the clock running; everything else is optional and
 * can be filled in later (during an attack nobody wants a form). Writes happen immediately on every change.
 */
export function EpisodeSheet() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const id = useUi((s) => s.episodeSheetId);
    const close = useUi((s) => s.closeEpisode);
    const bump = useUi((s) => s.bump);
    const settings = useSettings();
    const [ep, setEp] = useState(null);
    const [tags, setTags] = useState([]);
    const [sel, setSel] = useState(new Set());
    const [meds, setMeds] = useState([]);
    const [intakes, setIntakes] = useState([]);
    const [note, setNote] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const load = useCallback(async () => {
        if (!id)
            return;
        const e = (await listEpisodes()).find((x) => x.id === id) ?? null;
        setEp(e);
        setNote(e?.note ?? "");
        setTags(await listTags());
        setSel(new Set(await episodeTagIds(id)));
        setMeds(await listMedications());
        setIntakes(await listIntakes(id));
    }, [id]);
    useEffect(() => { void load(); setConfirmDelete(false); }, [load]);
    if (!id || !ep)
        return null;
    const groups = diaryConfig().tagGroups;
    const patch = async (p) => { await updateEpisode(ep.id, p); setEp({ ...ep, ...p }); bump(); };
    const onTags = async (n) => { setSel(n); await setEpisodeTags(ep.id, [...n]); bump(); };
    const onEnd = async () => {
        await endEpisode(ep.id);
        haptics.success();
        await settings.set("successEvents", settings.successEvents + 1);
        void maybeAskForReview();
        bump();
        await load();
    };
    const onIntake = async (m) => { await logIntake(m.id, ep.id); haptics.tap(); setIntakes(await listIntakes(ep.id)); bump(); };
    const onDelete = async () => { await deleteEpisode(ep.id); bump(); close(); };
    const dur = ep.endedAt ? hours(ep.startedAt, ep.endedAt) : null;
    return (_jsxs(Sheet, { open: true, onClose: close, title: ep.endedAt ? t("episode.title") : t("episode.ongoing"), tall: true, children: [!ep.endedAt && _jsx("button", { className: "cta", style: { marginTop: 0 }, onClick: onEnd, children: t("home.endAttack") }), _jsxs("div", { className: "row", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: t("episode.start") }), _jsx("input", { type: "datetime-local", value: toLocalInput(ep.startedAt), onChange: (e) => e.target.value && patch({ startedAt: fromLocalInput(e.target.value) }) })] }), ep.endedAt && (_jsxs("label", { className: "field", children: [_jsx("span", { children: t("episode.end") }), _jsx("input", { type: "datetime-local", value: toLocalInput(ep.endedAt), onChange: (e) => e.target.value && patch({ endedAt: fromLocalInput(e.target.value) }) })] }))] }), dur != null && _jsx("p", { className: "muted small", children: t("episode.duration", { h: dur.toFixed(1) }) }), _jsxs("div", { className: "field", children: [_jsxs("span", { children: [t("episode.intensity"), " ", ep.intensity ? `· ${ep.intensity}/10` : ""] }), _jsx("input", { type: "range", min: 1, max: 10, step: 1, value: ep.intensity ?? 5, onChange: (e) => patch({ intensity: Number(e.target.value) }) }), _jsxs("div", { className: "row between small muted", children: [_jsx("span", { children: t("episode.mildLbl") }), _jsx("span", { children: t("episode.severeLbl") })] })] }), groups.map((g) => (_jsx(TagPicker, { groupKey: g.key, tags: tags.filter((x) => x.groupKey === g.key), selected: sel, onChange: onTags, onTagAdded: async () => setTags(await listTags()) }, g.key))), _jsxs("div", { className: "field", children: [_jsx("span", { children: t("meds.title") }), meds.length === 0 ? (_jsx("button", { type: "button", className: "ghost", onClick: () => useUi.getState().setMedsOpen(true), children: t("meds.addFirst") })) : (_jsx("div", { className: "chips", children: meds.map((m) => _jsxs("button", { type: "button", className: "chip", onClick: () => onIntake(m), children: ["+ ", m.name] }, m.id)) })), intakes.length > 0 && (_jsx("ul", { className: "list", style: { margin: "6px 0 0" }, children: intakes.map((i) => (_jsxs("li", { className: "tap", style: { padding: "10px 14px" }, children: [_jsxs("span", { children: [i.name, " ", _jsx("span", { className: "muted small", children: fmtTime(i.takenAt, lang) })] }), _jsx("button", { type: "button", className: "small ghost danger", onClick: async () => { await deleteIntake(i.id); setIntakes(await listIntakes(ep.id)); bump(); }, children: "\u00D7" })] }, i.id))) }))] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("episode.note") }), _jsx("textarea", { rows: 2, value: note, onChange: (e) => setNote(e.target.value), onBlur: () => patch({ note: note.trim() || null }), placeholder: t("episode.notePh") })] }), _jsxs("div", { className: "row between", style: { marginTop: 18 }, children: [confirmDelete
                        ? _jsx("button", { type: "button", className: "ghost danger", onClick: onDelete, children: t("episode.deleteConfirm") })
                        : _jsx("button", { type: "button", className: "linklike", onClick: () => setConfirmDelete(true), children: t("common.delete") }), _jsx("button", { type: "button", onClick: close, children: t("common.done") })] })] }));
}
