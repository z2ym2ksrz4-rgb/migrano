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
export async function buildReport(fromIso, toIso, t, lang, opts = {}) {
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
    const period = `${fmtDate(fromIso, lang, { day: "numeric", month: "long", year: "numeric" })} – ${fmtDate(new Date(new Date(toIso).getTime() - 1).toISOString(), lang, { day: "numeric", month: "long", year: "numeric" })}`;
    doc.text(opts.name ? `${opts.name} · ${period}` : period, M, 22);
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
    // ---- monthly bars (attack days + medication days) --------------------------------------------------------
    const months = opts.monthly ?? [];
    if (months.length >= 2) {
        doc.setTextColor(...BRAND);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(t("report.chartTitle"), M, y + 4);
        y += 8;
        const chartH = 38, chartW = W - 2 * M, base = y + chartH, maxV = Math.max(1, ...months.map((m) => Math.max(m.attackDays, m.medDays)));
        const slot = chartW / months.length, bw = Math.min(10, slot / 3);
        doc.setDrawColor(222, 220, 234);
        doc.line(M, base, M + chartW, base);
        months.forEach((m, i) => {
            const x = M + i * slot + slot / 2;
            const h1 = (m.attackDays / maxV) * chartH, h2 = (m.medDays / maxV) * chartH;
            doc.setFillColor(...BRAND);
            doc.rect(x - bw - 1, base - h1, bw, h1, "F");
            doc.setFillColor(232, 87, 63);
            doc.rect(x + 1, base - h2, bw, h2, "F");
            doc.setFontSize(7);
            doc.setTextColor(...MUTED);
            doc.text(new Date(m.month + "-01T12:00:00").toLocaleDateString(lang, { month: "short" }), x, base + 4, { align: "center" });
            doc.setTextColor(...INK);
            if (m.attackDays)
                doc.text(String(m.attackDays), x - bw / 2 - 1, base - h1 - 1, { align: "center" });
            if (m.medDays)
                doc.text(String(m.medDays), x + bw / 2 + 1, base - h2 - 1, { align: "center" });
        });
        y = base + 9;
        doc.setFontSize(7.5);
        doc.setFillColor(...BRAND);
        doc.rect(M, y - 2.5, 3, 3, "F");
        doc.setTextColor(...MUTED);
        doc.text(t("insights.attackDays"), M + 5, y);
        doc.setFillColor(232, 87, 63);
        doc.rect(M + 48, y - 2.5, 3, 3, "F");
        doc.text(t("report.medDays"), M + 53, y);
        y += 9;
    }
    if (opts.learning?.length) {
        doc.setTextColor(...BRAND);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(t("insights.learnTitle"), M, y + 4);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...INK);
        for (const l of opts.learning) {
            const lines = doc.splitTextToSize("• " + l, W - 2 * M);
            doc.text(lines, M, y + 2);
            y += lines.length * 4.6 + 1.5;
        }
        doc.setFontSize(7.5);
        doc.setTextColor(...MUTED);
        const n = doc.splitTextToSize(t("insights.learnNote"), W - 2 * M);
        doc.text(n, M, y + 3);
        y += n.length * 3.8 + 8;
    }
    if (opts.notes?.trim()) {
        doc.setTextColor(...BRAND);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(t("report.notesTitle"), M, y + 4);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...INK);
        const lines = doc.splitTextToSize(opts.notes.trim(), W - 2 * M);
        doc.text(lines, M, y + 2);
        y += lines.length * 5 + 8;
    }
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
    const hasP = !!opts.pressure && eps.some((e) => opts.pressure.has(e.startedAt.slice(0, 10)));
    for (const e of eps) {
        const ids = await episodeTagIds(e.id);
        const byGroup = (g) => ids.map((id) => tags.get(id)).filter((x) => x && x.groupKey === g).map((x) => label(x.id)).join(", ");
        const meds = (await listIntakes(e.id)).map((i) => `${i.name} ${fmtTime(i.takenAt, lang)}`).join(", ");
        rows.push([
            `${fmtDate(e.startedAt, lang)} ${fmtTime(e.startedAt, lang)}`,
            e.endedAt ? fmt1(hours(e.startedAt, e.endedAt)) : "–",
            e.intensity != null ? String(e.intensity) : "–",
            byGroup("symptom"), byGroup("trigger"), meds, e.note ?? "",
            ...(hasP ? [(() => { const w = opts.pressure.get(e.startedAt.slice(0, 10)); return w ? `${w.p}${w.delta != null ? ` (${w.delta > 0 ? "+" : ""}${w.delta})` : ""}` : "–"; })()] : []),
        ]);
    }
    section(t("report.attacks"), [t("episode.start"), t("report.hours"), t("report.intensityShort"), t("diary.groups.symptom"), t("diary.groups.trigger"), t("meds.title"), t("episode.note"), ...(hasP ? [t("report.pressureCol")] : [])], rows, t("home.empty"), hasP ? { 0: { cellWidth: 26 }, 1: { cellWidth: 12 }, 2: { cellWidth: 12 }, 7: { cellWidth: 18 } } : { 0: { cellWidth: 26 }, 1: { cellWidth: 12 }, 2: { cellWidth: 12 } });
    if (hasP) {
        doc.setFontSize(7.5);
        doc.setTextColor(...MUTED);
        doc.text(t("report.pressureNote"), M, y - 4);
        y += 2;
    }
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
