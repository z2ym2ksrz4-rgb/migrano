import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/core/settings";
import { ensurePermission } from "@/core/notifications";
import { usePaywall } from "@/core/purchases";
import { addMedication, listMedications } from "@/core/diary";
import i18n, { SUPPORTED } from "@/core/i18n";
import { haptics } from "@/core/ui";
import { Capacitor } from "@capacitor/core";
import { searchPlaces } from "@/core/diary";
import { WidgetPreview } from "@/domain/migrano/components/WidgetPreview";
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
    const [wantCycle, setWantCycle] = useState(false);
    const [wantHealth, setWantHealth] = useState(false);
    const [placeQ, setPlaceQ] = useState("");
    const [places, setPlaces] = useState([]);
    const [place, setPlace] = useState(null);
    const [placeBusy, setPlaceBusy] = useState(false);
    const ios = Capacitor.getPlatform() === "ios";
    const intro = t("onboarding.steps", { returnObjects: true });
    const medOptions = ["triptan", "ibuprofen", "paracetamol", "aspirin"];
    const total = intro.length + 4; // name, intro…, widget, setup, extras
    const SETUP = total - 2, EXTRAS = total - 1, WIDGET = intro.length + 1;
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
        if (place) {
            await settings.set("weatherPlace", [place.name, place.admin, place.country].filter(Boolean).join(", "));
            await settings.set("weatherLat", place.lat);
            await settings.set("weatherLon", place.lon);
        }
        const wishes = { cycle: wantCycle, weather: !!place, health: wantHealth && ios };
        await settings.set("onboardingWishes", wishes.cycle || wishes.weather || wishes.health ? JSON.stringify(wishes) : null);
        await ensurePermission();
        await settings.set("onboardingDone", true);
        showPaywall("onboarding");
    };
    const next = () => { haptics.tap(); setStep(step + 1); };
    if (step === 0) {
        return (_jsxs("section", { className: "screen onboarding", children: [_jsx("div", { className: "dots", children: Array.from({ length: total }, (_, i) => _jsx("span", { className: i === step ? "on" : "" }, i)) }), _jsx("h1", { children: t("onboarding.welcome") }), _jsx("p", { children: t("onboarding.welcomeBody") }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("settings.language") }), _jsx("select", { value: settings.language, onChange: async (e) => { const l = e.target.value; await settings.set("language", l); await i18n.changeLanguage(l); }, children: SUPPORTED.map((l) => _jsx("option", { value: l, children: t(`lang.${l}`) }, l)) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: t("onboarding.name") }), _jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: t("onboarding.namePh"), autoComplete: "given-name", maxLength: 40 })] }), _jsx("div", { className: "row", style: { marginTop: 10 }, children: _jsx("button", { className: "cta", onClick: next, children: t("onboarding.next") }) })] }));
    }
    if (step === WIDGET) {
        const steps = t("widget.stepsIos", { returnObjects: true });
        return (_jsxs("section", { className: "screen onboarding", children: [_jsx("div", { className: "dots", children: Array.from({ length: total }, (_, i) => _jsx("span", { className: i === step ? "on" : "" }, i)) }), _jsx("h1", { children: t("onboarding.widgetTitle") }), _jsx("p", { children: t("onboarding.widgetBody") }), _jsx(WidgetPreview, {}), _jsx("ol", { className: "steps", children: steps.map((x, i) => _jsx("li", { children: x }, i)) }), _jsx("p", { className: "muted small", children: t("onboarding.widgetLater") }), _jsxs("div", { className: "row", children: [_jsx("button", { className: "ghost", onClick: () => setStep(SETUP), children: t("onboarding.skip") }), _jsx("button", { className: "cta", onClick: next, children: t("onboarding.next") })] })] }));
    }
    if (step === EXTRAS) {
        const search = async (e) => { e.preventDefault(); if (placeQ.trim().length < 2)
            return; setPlaceBusy(true); try {
            setPlaces(await searchPlaces(placeQ, settings.language));
        }
        catch {
            setPlaces([]);
        }
        finally {
            setPlaceBusy(false);
        } };
        return (_jsxs("section", { className: "screen onboarding", children: [_jsx("div", { className: "dots", children: Array.from({ length: total }, (_, i) => _jsx("span", { className: i === step ? "on" : "" }, i)) }), _jsx("h1", { children: t("onboarding.extrasTitle") }), _jsx("p", { className: "muted", children: t("onboarding.extrasBody") }), _jsxs("label", { className: "check", children: [_jsx("input", { type: "checkbox", checked: wantCycle, onChange: (e) => setWantCycle(e.target.checked) }), " ", t("settings.cycleTracking"), " ", _jsx("span", { className: "pill pro", children: "PRO" })] }), _jsx("small", { className: "muted", style: { display: "block", marginTop: -4, marginBottom: 10 }, children: t("settings.cycleHint") }), _jsxs("div", { className: "field", children: [_jsxs("span", { children: [t("weather.title"), " ", _jsx("span", { className: "pill pro", children: "PRO" })] }), place ? (_jsxs("div", { className: "card", children: [_jsxs("div", { children: [_jsx("strong", { children: place.name }), _jsx("div", { className: "muted small", children: [place.admin, place.country].filter(Boolean).join(", ") })] }), _jsx("button", { type: "button", className: "ghost", onClick: () => { setPlace(null); setPlaces([]); }, children: t("weather.changePlace") })] })) : (_jsxs(_Fragment, { children: [_jsxs("form", { className: "row tight", onSubmit: search, children: [_jsx("input", { style: { flex: 1 }, value: placeQ, onChange: (e) => setPlaceQ(e.target.value), placeholder: t("weather.placePh") }), _jsx("button", { type: "submit", className: "ghost", disabled: placeBusy, children: t("common.search") })] }), places.length > 0 && _jsx("ul", { className: "list", style: { marginTop: 8 }, children: places.map((p, i) => _jsxs("li", { className: "tap", onClick: () => { setPlace(p); setPlaces([]); haptics.tap(); }, children: [_jsxs("div", { children: [_jsx("strong", { children: p.name }), _jsx("small", { children: [p.admin, p.country].filter(Boolean).join(", ") })] }), _jsx("span", { className: "muted", children: "\u203A" })] }, i)) })] })), _jsx("small", { className: "muted", children: t("weather.hint") })] }), ios && (_jsxs(_Fragment, { children: [_jsxs("label", { className: "check", children: [_jsx("input", { type: "checkbox", checked: wantHealth, onChange: (e) => setWantHealth(e.target.checked) }), " ", t("health.title"), " ", _jsx("span", { className: "pill pro", children: "PRO" })] }), _jsx("small", { className: "muted", style: { display: "block", marginTop: -4 }, children: t("health.hint") })] })), _jsx("p", { className: "muted small", style: { marginTop: 12 }, children: t("onboarding.extrasNote") }), _jsx("div", { className: "row", style: { marginTop: 10 }, children: _jsx("button", { className: "cta", onClick: () => void finish(), children: t("onboarding.start") }) })] }));
    }
    if (step === SETUP) {
        return (_jsxs("section", { className: "screen onboarding", children: [_jsx("div", { className: "dots", children: Array.from({ length: total }, (_, i) => _jsx("span", { className: i === step ? "on" : "" }, i)) }), _jsx("h1", { children: t("onboarding.setupTitle", { name: name.trim() || "" }).trim() }), _jsxs("div", { className: "field", children: [_jsx("span", { children: t("onboarding.attacksQ") }), _jsx("div", { className: "chips", children: ["0-3", "4-7", "8-14", "15+"].map((b) => _jsx("button", { type: "button", className: `chip ${attacks === b ? "on" : ""}`, onClick: () => setAttacks(b), children: t(`onboarding.attacks.${b}`) }, b)) })] }), _jsxs("div", { className: "field", children: [_jsx("span", { children: t("onboarding.medsQ") }), _jsx("div", { className: "chips", children: medOptions.map((k) => _jsx("button", { type: "button", className: `chip ${meds.has(k) ? "on" : ""}`, onClick: () => { const n = new Set(meds); if (n.has(k))
                                    n.delete(k);
                                else
                                    n.add(k); setMeds(n); }, children: t(`onboarding.meds.${k}`) }, k)) }), _jsx("input", { value: otherMed, onChange: (e) => setOtherMed(e.target.value), placeholder: t("onboarding.medsOther") }), _jsx("small", { className: "muted", children: t("onboarding.medsHint") })] }), _jsx("div", { className: "row", style: { marginTop: 10 }, children: _jsx("button", { className: "cta", onClick: next, children: t("onboarding.next") }) })] }));
    }
    const s = intro[step - 1];
    return (_jsxs("section", { className: "screen onboarding", children: [_jsx("div", { className: "dots", children: Array.from({ length: total }, (_, i) => _jsx("span", { className: i === step ? "on" : "" }, i)) }), _jsx("h1", { children: s.title }), _jsx("p", { children: s.body }), _jsxs("div", { className: "row", children: [_jsx("button", { className: "ghost", onClick: () => setStep(SETUP), children: t("onboarding.skip") }), _jsx("button", { className: "cta", onClick: next, children: t("onboarding.next") })] })] }));
}
