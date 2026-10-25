import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/core/settings";
import { ensurePermission } from "@/core/notifications";
import { usePaywall } from "@/core/purchases";
import { addMedication, listMedications } from "@/core/diary";
import i18n, { SUPPORTED } from "@/core/i18n";
import { haptics } from "@/core/ui";
/**
 * Onboarding: (0) language + first name, (1-3) three short intro screens, (4) two setup questions
 * (attacks per month, acute medication) so the diary is configured before the first attack. Then notification
 * permission and the paywall (user can always close it and use the free tier).
 */
export function Onboarding() {
    const { t } = useTranslation();
    const settings = useSettings();
    const showPaywall = usePaywall((s) => s.show);
    const [step, setStep] = useState(0);
    const [name, setName] = useState(settings.userName ?? "");
    const [attacks, setAttacks] = useState(null);
    const [meds, setMeds] = useState(new Set());
    const [otherMed, setOtherMed] = useState("");
    const intro = t("onboarding.steps", { returnObjects: true });
    const medOptions = ["triptan", "ibuprofen", "paracetamol", "aspirin"];
    const total = intro.length + 2; // name, intro…, setup
    const finish = async () => {
        const n = name.trim();
        await settings.set("userName", n || null);
        if (attacks)
            await settings.set("baselineAttacks", attacks);
        const existing = (await listMedications(true)).map((m) => m.name.toLowerCase());
        for (const k of meds) {
            const label = t(`onboarding.meds.${k}`);
            if (!existing.includes(label.toLowerCase()))
                await addMedication(label, "acute");
        }
        if (otherMed.trim() && !existing.includes(otherMed.trim().toLowerCase()))
            await addMedication(otherMed.trim(), "acute");
        // Threshold follows the guidance: 10 days for triptans/combinations, 15 for simple analgesics only.
        await settings.set("medThreshold", meds.has("triptan") || meds.size === 0 ? 10 : 15);
        await ensurePermission();
        await settings.set("onboardingDone", true);
        showPaywall("onboarding");
    };
    const next = () => { haptics.tap(); setStep(step + 1); };
    if (step === 0) {
        return (_jsxs("section", { className: "screen onboarding", children: [_jsx("div", { className: "dots", children: Array.from({ length: total }, (_, i) => _jsx("span", { className: i === step ? "on" : "" }, i)) }), _jsx("h1", { children: t("onboarding.welcome") }), _jsx("p", { children: t("onboarding.welcomeBody") }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("settings.language") }), _jsx("select", { value: settings.language, onChange: async (e) => { const l = e.target.value; await settings.set("language", l); await i18n.changeLanguage(l); }, children: SUPPORTED.map((l) => _jsx("option", { value: l, children: t(`lang.${l}`) }, l)) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("onboarding.name") }), _jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: t("onboarding.namePh"), autoComplete: "given-name", maxLength: 40 })] }), _jsx("div", { className: "row", style: { marginTop: 10 }, children: _jsx("button", { className: "cta", onClick: next, children: t("onboarding.next") }) })] }));
    }
    if (step === total - 1) {
        return (_jsxs("section", { className: "screen onboarding", children: [_jsx("div", { className: "dots", children: Array.from({ length: total }, (_, i) => _jsx("span", { className: i === step ? "on" : "" }, i)) }), _jsx("h1", { children: t("onboarding.setupTitle", { name: name.trim() || "" }).trim() }), _jsxs("div", { className: "field", children: [_jsx("span", { children: t("onboarding.attacksQ") }), _jsx("div", { className: "chips", children: ["0-3", "4-7", "8-14", "15+"].map((b) => _jsx("button", { type: "button", className: `chip ${attacks === b ? "on" : ""}`, onClick: () => setAttacks(b), children: t(`onboarding.attacks.${b}`) }, b)) })] }), _jsxs("div", { className: "field", children: [_jsx("span", { children: t("onboarding.medsQ") }), _jsx("div", { className: "chips", children: medOptions.map((k) => _jsx("button", { type: "button", className: `chip ${meds.has(k) ? "on" : ""}`, onClick: () => { const n = new Set(meds); if (n.has(k))
                                    n.delete(k);
                                else
                                    n.add(k); setMeds(n); }, children: t(`onboarding.meds.${k}`) }, k)) }), _jsx("input", { value: otherMed, onChange: (e) => setOtherMed(e.target.value), placeholder: t("onboarding.medsOther") }), _jsx("small", { className: "muted", children: t("onboarding.medsHint") })] }), _jsx("div", { className: "row", style: { marginTop: 10 }, children: _jsx("button", { className: "cta", onClick: () => void finish(), children: t("onboarding.start") }) })] }));
    }
    const s = intro[step - 1];
    return (_jsxs("section", { className: "screen onboarding", children: [_jsx("div", { className: "dots", children: Array.from({ length: total }, (_, i) => _jsx("span", { className: i === step ? "on" : "" }, i)) }), _jsx("h1", { children: s.title }), _jsx("p", { children: s.body }), _jsxs("div", { className: "row", children: [_jsx("button", { className: "ghost", onClick: () => setStep(total - 1), children: t("onboarding.skip") }), _jsx("button", { className: "cta", onClick: next, children: t("onboarding.next") })] })] }));
}
