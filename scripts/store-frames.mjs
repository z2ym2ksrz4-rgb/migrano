// Compose App Store / Play marketing screenshots from the raw captures in store/screenshots/<lang>/.
// Usage: node scripts/store-frames.mjs [lang...]   (run scripts/screenshots.mjs first)
// Output: store/screenshots/<lang>/store-<device>-<n>.png — exact store pixel sizes, no paywall shot.
import { chromium } from "playwright";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const LANGS = process.argv.slice(2).length ? process.argv.slice(2) : ["en", "da", "de", "sv", "nb"];
const DEVICES = { "iphone-6.7": { w: 1290, h: 2796, radius: 150 }, "iphone-6.1": { w: 1179, h: 2556, radius: 140 }, "android": { w: 1080, h: 2400, radius: 110 } };
const SHOTS = ["home", "attack", "calendar", "insights", "triggers", "report"]; // settings/paywall intentionally excluded
const COPY = {
  en: ["One tap when it starts", "Details when you feel better", "Your month at a glance", "The numbers your doctor asks for", "Which triggers come up most", "A PDF for the neurologist"],
  da: ["Ét tryk, når det starter", "Detaljer, når du har det bedre", "Din måned på ét blik", "Tallene, lægen spørger om", "De triggere, der går igen", "En PDF til neurologen"],
  de: ["Ein Tipp, wenn es losgeht", "Details, wenn es besser geht", "Dein Monat auf einen Blick", "Die Zahlen, die der Arzt braucht", "Welche Auslöser sich häufen", "Ein PDF für den Neurologen"],
  sv: ["Ett tryck när det börjar", "Detaljer när du mår bättre", "Din månad på en blick", "Siffrorna läkaren frågar efter", "Vilka triggers som återkommer", "En PDF till neurologen"],
  nb: ["Ett trykk når det starter", "Detaljer når du har det bedre", "Måneden din på ett blikk", "Tallene legen spør om", "Triggerne som går igjen", "En PDF til nevrologen"],
};
const SUB = { en: "No account. Your diary stays on your phone.", da: "Ingen konto. Din dagbog bliver på din telefon.", de: "Kein Konto. Dein Tagebuch bleibt auf dem Handy.", sv: "Inget konto. Din dagbok stannar i telefonen.", nb: "Ingen konto. Dagboken din blir på telefonen." };

const html = ({ w, h, radius, title, sub, img, last }) => `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}
  body{font-family:-apple-system,Inter,"Segoe UI",Roboto,sans-serif;background:linear-gradient(160deg,#5B59A0 0%,#36355C 100%);color:#F4F3F9;position:relative}
  .copy{position:absolute;top:${Math.round(h*0.055)}px;left:0;right:0;text-align:center;padding:0 ${Math.round(w*0.08)}px}
  h1{margin:0;font-size:${Math.round(w*0.082)}px;line-height:1.1;font-weight:800;letter-spacing:-0.02em}
  p{margin:${Math.round(w*0.02)}px 0 0;font-size:${Math.round(w*0.036)}px;opacity:.85;font-weight:500}
  .device{position:absolute;left:50%;transform:translateX(-50%);top:${Math.round(h*0.235)}px;width:${Math.round(w*0.80)}px;height:${Math.round(w*0.80*(h/w))}px;border-radius:${radius}px;background:#111;padding:${Math.round(w*0.018)}px;box-sizing:border-box;box-shadow:0 ${Math.round(w*0.05)}px ${Math.round(w*0.12)}px rgba(0,0,0,.35)}
  .device img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:${radius-Math.round(w*0.018)}px;display:block}
  .mark{position:absolute;right:${Math.round(w*0.06)}px;bottom:${Math.round(h*0.03)}px;width:${Math.round(w*0.10)}px;opacity:.4}
</style></head><body>
  <div class="copy"><h1>${title}</h1><p>${last ? sub : ""}</p></div>
  <div class="device"><img src="${img}"></div>
  <svg class="mark" viewBox="0 0 64 64"><path d="M27 12 C18 12,12 19,12 28 C12 33,14 37,17 40 L17 48 C17 50,18 51,20 51 L35 51 L35 44 L39 44 C41 44,42 42,41 41 L40 37 C44 35,46 31,46 26 C46 18,37 12,27 12 Z" fill="#FFF4EC"/><path transform="translate(41 26) scale(0.075)" d="M0 -190 L 40 -60 L 170 -95 L 70 0 L 170 95 L 40 60 L 0 190 L -40 60 L -170 95 L -70 0 L -170 -95 L -40 -60 Z" fill="#FF7A59"/><circle cx="41" cy="26" r="3.5" fill="#FFF4EC"/></svg>
</body></html>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium" });
for (const lang of LANGS) {
  for (const [device, d] of Object.entries(DEVICES)) {
    const page = await browser.newPage({ viewport: { width: d.w, height: d.h }, deviceScaleFactor: 1 });
    let n = 0;
    for (const [i, shot] of SHOTS.entries()) {
      const src = resolve(`store/screenshots/${lang}/${device}-${i + 1}-${shot}.png`);
      if (!existsSync(src)) { console.warn("missing", src); continue; }
      const img = `data:image/png;base64,${readFileSync(src).toString("base64")}`;
      await page.setContent(html({ ...d, title: COPY[lang][i], sub: SUB[lang], img, last: i === 0 }));
      await page.screenshot({ path: `store/screenshots/${lang}/store-${device}-${++n}.png`, clip: { x: 0, y: 0, width: d.w, height: d.h } });
    }
    await page.close(); console.log(`${lang}/${device}: ${n} store images`);
  }
}
await browser.close();
