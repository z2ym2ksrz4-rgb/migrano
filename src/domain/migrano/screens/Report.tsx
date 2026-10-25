import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sheet, localDay } from "@/core/ui";
import { monthRange } from "@/core/diary";
import { useSettings } from "@/core/settings";
import { maybeAskForReview } from "@/core/review";

export function ReportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const settings = useSettings();
  const [preset, setPreset] = useState<"month" | "last" | "3m" | "custom">("3m");
  const [from, setFrom] = useState(() => localDay(new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1)));
  const [to, setTo] = useState(() => localDay());
  const [busy, setBusy] = useState(false);

  const range = () => {
    const now = new Date();
    if (preset === "month") return monthRange(now);
    if (preset === "last") return monthRange(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    if (preset === "3m") return { fromIso: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(), toIso: monthRange(now).toIso };
    return { fromIso: new Date(from + "T00:00:00").toISOString(), toIso: new Date(new Date(to + "T00:00:00").getTime() + 864e5).toISOString() };
  };
  const make = async () => {
    setBusy(true);
    try {
      const { buildReport, sharePdf } = await import("../report");
      const { fromIso, toIso } = range();
      const doc = await buildReport(fromIso, toIso, t, i18n.language);
      await sharePdf(doc, `migrano-${fromIso.slice(0, 10)}-${toIso.slice(0, 10)}.pdf`, t("report.title"));
      await settings.set("successEvents", settings.successEvents + 1); void maybeAskForReview();
      onClose();
    } finally { setBusy(false); }
  };
  return (
    <Sheet open={open} onClose={onClose} title={t("report.title")}>
      <p className="muted small">{t("report.sub")}</p>
      <div className="stack" style={{ margin: "10px 0" }}>
        {(["month", "last", "3m", "custom"] as const).map((p) => (
          <button key={p} className={`chip ${preset === p ? "on" : ""}`} style={{ textAlign: "left" }} onClick={() => setPreset(p)}>{t(`report.preset.${p}`)}</button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="row">
          <label className="field"><span>{t("report.from")}</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="field"><span>{t("report.to")}</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
      )}
      <button className="cta" onClick={make} disabled={busy}>{busy ? "…" : t("report.make")}</button>
      <p className="disclaimer">{t("report.footer", { app: "Migrano" })}</p>
    </Sheet>
  );
}
