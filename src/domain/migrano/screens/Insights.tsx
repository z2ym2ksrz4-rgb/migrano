import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { monthlySeries, episodeSummary, tagFrequency, monthRange } from "@/core/diary";
import { useProGate } from "@/core/purchases";
import { useSettings } from "@/core/settings";
import { useUi } from "../store";
import { ReportSheet } from "./Report";

/** Descriptive statistics only: counts, averages and shares. No scoring, no classification, no advice. */
export function Insights() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const gate = useProGate();
  const version = useUi((s) => s.version);
  const threshold = useSettings((s) => s.medThreshold);
  const [series, setSeries] = useState<{ month: string; episodes: number; attackDays: number }[]>([]);
  const [sum, setSum] = useState<Awaited<ReturnType<typeof episodeSummary>> | null>(null);
  const [freq, setFreq] = useState<Awaited<ReturnType<typeof tagFrequency>>>([]);
  const [range, setRange] = useState<"month" | "3m" | "12m">("3m");
  const [reportOpen, setReportOpen] = useState(false);

  const load = useCallback(async () => {
    if (!gate.isPro) return;
    const now = new Date();
    const months = range === "month" ? 1 : range === "3m" ? 3 : 12;
    const fromIso = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1).toISOString();
    const toIso = monthRange(now).toIso;
    setSeries(await monthlySeries(12));
    setSum(await episodeSummary(fromIso, toIso));
    setFreq(await tagFrequency(fromIso, toIso));
  }, [gate.isPro, range]);
  useEffect(() => { void load(); }, [load, version]);

  if (!gate.isPro) {
    return (
      <section className="screen">
        <h1>{t("insights.title")}</h1>
        <div className="card col">
          <strong>{t("insights.lockedTitle")}</strong>
          <p className="muted">{t("insights.lockedBody")}</p>
          <button onClick={() => gate.allow("insights")}>{t("plan.upgrade")}</button>
        </div>
      </section>
    );
  }

  const max = Math.max(1, ...series.map((s) => s.attackDays));
  const top = (group: string) => freq.filter((f) => f.groupKey === group).slice(0, 5);
  const Freq = ({ group }: { group: string }) => {
    const rows = top(group);
    if (!rows.length) return <p className="muted small">{t("insights.noData")}</p>;
    return (
      <div className="freq">
        {rows.map((f) => {
          const pct = f.total ? Math.round((f.n / f.total) * 100) : 0;
          return (
            <div className="f" key={f.tagId}>
              <span>{f.labelKey ? t(f.labelKey) : f.label}</span><span className="muted">{pct}%</span>
              <div className="track"><div className="fill" style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="screen">
      <h1>{t("insights.title")}</h1>
      <button className="cta report-btn" style={{ marginTop: 4 }} onClick={() => setReportOpen(true)}>📄 {t("report.cta")}</button>

      <h2>{t("insights.attackDaysPerMonth")}</h2>
      <div className="bars">
        {series.map((s, i) => <div key={s.month} className={`bar ${i === series.length - 1 ? "cur" : ""}`} style={{ height: `${(s.attackDays / max) * 100}%` }} title={`${s.month}: ${s.attackDays}`} />)}
      </div>
      <div className="barlbl">{series.map((s) => <span key={s.month}>{new Date(s.month + "-01T12:00:00").toLocaleDateString(lang, { month: "narrow" })}</span>)}</div>

      <div className="segment" style={{ margin: "16px 0 8px" }}>
        {(["month", "3m", "12m"] as const).map((r) => <button key={r} className={range === r ? "active" : ""} onClick={() => setRange(r)}>{t(`insights.range.${r}`)}</button>)}
      </div>
      {sum && (
        <div className="stats">
          <div className="stat"><div className="n">{sum.episodes}</div><div className="l">{t("insights.attacks")}</div></div>
          <div className="stat"><div className="n">{sum.attackDays}</div><div className="l">{t("insights.attackDays")}</div></div>
          <div className="stat"><div className="n">{sum.avgHours != null ? sum.avgHours.toFixed(1) : "–"}</div><div className="l">{t("insights.avgHours")}</div></div>
          <div className="stat"><div className="n">{sum.avgIntensity != null ? sum.avgIntensity.toFixed(1) : "–"}</div><div className="l">{t("insights.avgIntensity")}</div></div>
          <div className={`stat ${range === "month" && sum.medDays >= threshold ? "warn" : ""}`} style={{ gridColumn: "1 / -1" }}>
            <div className="n">{sum.medDays}</div><div className="l">{t("insights.medDays", { n: threshold })}</div>
          </div>
        </div>
      )}

      <h2>{t("diary.groups.trigger")} <span className="muted" style={{ textTransform: "none", letterSpacing: 0 }}>· {t("insights.shareOfAttacks")}</span></h2>
      <Freq group="trigger" />
      <h2>{t("diary.groups.symptom")}</h2>
      <Freq group="symptom" />
      <h2>{t("diary.groups.relief")}</h2>
      <Freq group="relief" />
      <p className="disclaimer">{t("insights.disclaimer")}</p>
      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} />
    </section>
  );
}
