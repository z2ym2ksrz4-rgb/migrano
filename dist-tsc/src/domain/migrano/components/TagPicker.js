import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { addUserTag } from "@/core/diary";
import { haptics } from "@/core/ui";
/** One tag group as chips. "Other…" turns into an input; the typed text becomes a user tag in this group. */
export function TagPicker({ groupKey, tags, selected, onChange, onTagAdded, compact }) {
    const { t } = useTranslation();
    const [adding, setAdding] = useState(false);
    const [text, setText] = useState("");
    const toggle = (id) => { const n = new Set(selected); if (n.has(id))
        n.delete(id);
    else
        n.add(id); haptics.tap(); onChange(n); };
    const commit = async () => {
        const label = text.trim();
        setAdding(false);
        setText("");
        if (!label)
            return;
        const tag = await addUserTag(groupKey, label);
        const n = new Set(selected);
        n.add(tag.id);
        onChange(n);
        onTagAdded();
    };
    return (_jsxs("div", { className: compact ? "chips" : "field", children: [!compact && _jsx("span", { children: t(`diary.groups.${groupKey}`) }), _jsxs("div", { className: "chips", children: [tags.filter((x) => !x.isHidden || selected.has(x.id)).map((x) => (_jsx("button", { type: "button", className: `chip ${selected.has(x.id) ? "on" : ""}`, onClick: () => toggle(x.id), children: x.labelKey ? t(x.labelKey) : x.label }, x.id))), adding ? (_jsx("input", { autoFocus: true, value: text, onChange: (e) => setText(e.target.value), placeholder: t("common.typeOwn"), style: { maxWidth: 200 }, onKeyDown: (e) => { if (e.key === "Enter")
                            void commit(); if (e.key === "Escape") {
                            setAdding(false);
                            setText("");
                        } }, onBlur: () => void commit() })) : (_jsxs("button", { type: "button", className: "chip other", onClick: () => setAdding(true), children: ["+ ", t("common.other")] }))] })] }));
}
