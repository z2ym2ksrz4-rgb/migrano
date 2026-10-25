import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { listEpisodes, episodeSummary, tagFrequency, listTags, episodeTagIds, listIntakes, dbWrite, newId, nowIso } from "./reportDeps";
import { fmtDate, fmtTime, hours } from "@/core/ui";
import appConfig from "../../../app.config.json";
const BRAND = [75, 74, 122];
const INK = [27, 26, 46];
const MUTED = [107, 106, 128];
/**
 * The doctor's report: what a neurologist asks for at a glance (frequency, duration, intensity, medication days),
 * then one row per attack with triggers/symptoms/medication, then trigger and symptom shares. Plain facts only.
 */
export async function buildReport(fromIso, toIso, t, lang) {
    const eps = (await listEpisodes(fromIso, toIso)).reverse();
    const sum = await episodeSummary(fromIso, toIso);
    const freq = await tagFrequency(fromIso, toIso);
    const tags = new Map((await listTags()).map((x) => [x.id, x]));
    const label = (id) => { const x = tags.get(id); return x ? (x.labelKey ? t(x.labelKey) : x.label ?? "") : ""; };
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth(), M = 16;
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, W, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(t("report.title"), M, 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.text(`${fmtDate(fromIso, lang, { day: "numeric", month: "long", year: "numeric" })} – ${fmtDate(new Date(new Date(toIso).getTime() - 1).toISOString(), lang, { day: "numeric", month: "long", year: "numeric" })}`, M, 22);
    let y = 40;
    const fmt1 = (n) => (n == null ? "–" : n.toLocaleString(lang, { maximumFractionDigits: 1 }));
    autoTable(doc, {
        startY: y, margin: { left: M, right: M }, theme: "plain",
        body: [
            [t("insights.attacks"), String(sum.episodes)], [t("insights.attackDays"), String(sum.attackDays)],
            [t("insights.avgHours"), fmt1(sum.avgHours)], [t("insights.avgIntensity"), fmt1(sum.avgIntensity)],
            [t("report.medDays"), String(sum.medDays)],
        ],
        styles: { fontSize: 10, cellPadding: 1.8, textColor: INK }, columnStyles: { 0: { textColor: MUTED, cellWidth: 70 }, 1: { fontStyle: "bold" } },
    });
    y = doc.lastAutoTable.finalY + 8;
    const section = (title, head, rows, empty, widths) => {
        doc.setTextColor(...BRAND);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(title, M, y + 4);
        y += 7;
        autoTable(doc, {
            startY: y, margin: { left: M, right: M }, head: [head], body: rows.length ? rows : [[empty]],
            theme: "grid", styles: { fontSize: 8.5, cellPadding: 1.6, textColor: INK, lineColor: [222, 220, 234], lineWidth: 0.2, overflow: "linebreak" },
            headStyles: { fillColor: [234, 232, 242], textColor: INK, fontStyle: "bold" }, alternateRowStyles: { fillColor: [249, 248, 252] }, columnStyles: widths,
        });
        y = doc.lastAutoTable.finalY + 8;
    };
    const rows = [];
    for (const e of eps) {
        const ids = await episodeTagIds(e.id);
        const byGroup = (g) => ids.map((id) => tags.get(id)).filter((x) => x && x.groupKey === g).map((x) => label(x.id)).join(", ");
        const meds = (await listIntakes(e.id)).map((i) => `${i.name} ${fmtTime(i.takenAt, lang)}`).join(", ");
        rows.push([
            `${fmtDate(e.startedAt, lang)} ${fmtTime(e.startedAt, lang)}`,
            e.endedAt ? fmt1(hours(e.startedAt, e.endedAt)) : "–",
            e.intensity != null ? String(e.intensity) : "–",
            byGroup("symptom"), byGroup("trigger"), meds, e.note ?? "",
        ]);
    }
    section(t("report.attacks"), [t("episode.start"), t("report.hours"), t("report.intensityShort"), t("diary.groups.symptom"), t("diary.groups.trigger"), t("meds.title"), t("episode.note")], rows, t("home.empty"), { 0: { cellWidth: 26 }, 1: { cellWidth: 12 }, 2: { cellWidth: 12 } });
    const share = (g) => freq.filter((f) => f.groupKey === g).slice(0, 10).map((f) => [f.labelKey ? t(f.labelKey) : f.label ?? "", `${f.n} (${f.total ? Math.round((f.n / f.total) * 100) : 0}%)`]);
    section(`${t("diary.groups.trigger")} · ${t("insights.shareOfAttacks")}`, [t("diary.groups.trigger"), t("report.count")], share("trigger"), "–");
    section(`${t("diary.groups.symptom")} · ${t("insights.shareOfAttacks")}`, [t("diary.groups.symptom"), t("report.count")], share("symptom"), "–");
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setFontSize(7.5);
        doc.setTextColor(...MUTED);
        doc.text(`${t("report.footer", { app: appConfig.appName })} · ${p}/${pages}`, W / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
    }
    await dbWrite(`INSERT INTO report(id,fromDate,toDate,fileName,createdAt,updatedAt) VALUES(?,?,?,?,?,?)`, [newId(), fromIso.slice(0, 10), toIso.slice(0, 10), null, nowIso(), nowIso()]);
    return doc;
}
export async function sharePdf(doc, filename, title) {
    if (Capacitor.getPlatform() === "web") {
        doc.save(filename);
        return;
    }
    const data = doc.output("datauristring").split(",")[1];
    const f = await Filesystem.writeFile({ path: filename, data, directory: Directory.Cache });
    await Share.share({ title, url: f.uri });
}
