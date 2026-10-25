import type { TFunction } from "i18next";
import type { Patterns } from "@/core/diary";

type Freq = { groupKey: string; labelKey: string | null; label: string | null; n: number; total: number }[];

/**
 * "What it looks like" in plain sentences. Everything is phrased as an observation about the user's own log
 * ("your attacks have often…"), never as a cause or a diagnosis. Shown on Insights and in the PDF.
 */
export function learningSentences(pat: Patterns | null, freq: Freq, t: TFunction, lang: string, medDaysLatest: number, threshold: number): string[] {
  const out: string[] = [];
  const pct = (x: number) => Math.round(x * 100);
  const fmt = (n: number) => n.toLocaleString(lang, { maximumFractionDigits: 1 });
  if (pat?.weekday) out.push(t("learn.weekday", { day: new Date(2024, 0, 7 + pat.weekday.day).toLocaleDateString(lang, { weekday: "long" }), pct: pct(pat.weekday.share) }));
  if (pat?.timeOfDay) out.push(t("learn.time", { part: t(`insights.part.${pat.timeOfDay.part}`), pct: pct(pat.timeOfDay.share) }));
  for (const f of pat?.fields ?? []) {
    const diff = f.beforeAttack - f.beforeCalm;
    if (Math.abs(diff) >= 0.4) out.push(t(diff < 0 ? "learn.fieldLower" : "learn.fieldHigher", { field: t(`home.fields.${f.key}`).toLowerCase(), before: fmt(f.beforeAttack), calm: fmt(f.beforeCalm) }));
  }
  if (pat?.period && pat.period.share >= 0.25) out.push(t("learn.period", { pct: pct(pat.period.share) }));
  if (pat?.pressure) {
    const share = pat.pressure.attacksOnDrop / pat.pressure.attacks;
    if (share >= pat.pressure.dropShareAll + 0.15) out.push(t("learn.pressureYes", { pct: pct(share), all: pct(pat.pressure.dropShareAll), hpa: pat.pressure.threshold }));
    else out.push(t("learn.pressureNo", { pct: pct(share), all: pct(pat.pressure.dropShareAll) }));
  }
  const top = (g: string) => freq.filter((f) => f.groupKey === g && f.total >= 5).sort((a, b) => b.n - a.n)[0];
  const tr = top("trigger"); if (tr && tr.n / tr.total >= 0.3) out.push(t("learn.trigger", { tag: tr.labelKey ? t(tr.labelKey) : tr.label ?? "", pct: pct(tr.n / tr.total) }));
  const sy = top("symptom"); if (sy && sy.n / sy.total >= 0.5) out.push(t("learn.symptom", { tag: sy.labelKey ? t(sy.labelKey) : sy.label ?? "", pct: pct(sy.n / sy.total) }));
  if (medDaysLatest >= threshold) out.push(t("learn.medDays", { n: medDaysLatest, limit: threshold }));
  return out;
}
