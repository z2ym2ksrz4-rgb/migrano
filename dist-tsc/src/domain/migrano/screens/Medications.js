import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listMedications, addMedication, updateMedication } from "@/core/diary";
import { Sheet } from "@/core/ui";
import { useUi } from "../store";
/** The user's own preparations. No catalogue, no doses, no advice — just names and whether they are acute or preventive. */
export function MedicationsSheet() {
    const { t } = useTranslation();
    const open = useUi((s) => s.medsOpen);
    const setOpen = useUi((s) => s.setMedsOpen);
    const bump = useUi((s) => s.bump);
    const [meds, setMeds] = useState([]);
    const [name, setName] = useState("");
    const [kind, setKind] = useState("acute");
    const load = useCallback(async () => setMeds(await listMedications(true)), []);
    useEffect(() => { if (open)
        void load(); }, [open, load]);
    const add = async () => { if (!name.trim())
        return; await addMedication(name, kind); setName(""); await load(); bump(); };
    return (_jsxs(Sheet, { open: open, onClose: () => setOpen(false), title: t("meds.title"), children: [_jsx("p", { className: "muted small", children: t("meds.sub") }), _jsx("div", { className: "row", children: _jsxs("label", { className: "field grow", children: [_jsx("span", { children: t("meds.name") }), _jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: t("meds.namePh"), onKeyDown: (e) => e.key === "Enter" && add() })] }) }), _jsxs("div", { className: "segment", style: { margin: "6px 0 10px" }, children: [_jsx("button", { className: kind === "acute" ? "active" : "", onClick: () => setKind("acute"), children: t("meds.acute") }), _jsx("button", { className: kind === "preventive" ? "active" : "", onClick: () => setKind("preventive"), children: t("meds.preventive") })] }), _jsx("button", { className: "cta", style: { marginTop: 0 }, onClick: add, disabled: !name.trim(), children: t("common.add") }), _jsx("p", { className: "muted small", children: t("meds.acuteHint") }), _jsx("ul", { className: "list", children: meds.map((m) => (_jsxs("li", { className: "tap", style: { opacity: m.isHidden ? 0.5 : 1 }, children: [_jsxs("div", { children: [_jsx("strong", { children: m.name }), _jsx("small", { children: t(`meds.${m.kind}`) })] }), _jsxs("div", { className: "row tight", children: [_jsx("button", { className: "small ghost", onClick: async () => { await updateMedication(m.id, { kind: m.kind === "acute" ? "preventive" : "acute" }); await load(); }, children: "\u21C4" }), _jsx("button", { className: "small ghost", onClick: async () => { await updateMedication(m.id, { isHidden: m.isHidden ? 0 : 1 }); await load(); bump(); }, children: m.isHidden ? t("meds.show") : t("meds.hide") })] })] }, m.id))) })] }));
}
