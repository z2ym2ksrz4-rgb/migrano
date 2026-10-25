// Smoke test for the whole chain on web (sql.js). Dev build required (window.__seedDemo exists there).
// Run: RELEASE=0 NODE_ENV=development npx vite build --mode development && (npx vite preview --port 4173 &) && node smoke.mjs
import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errors = []; const out = {};
p.on("pageerror", (e) => errors.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const shot = (n) => p.screenshot({ path: `/tmp/claude-0/-home-claude/57bab718-bf6c-5cbe-9048-f1d9340fc97c/scratchpad/smoke-${n}.png` });
const go = async () => { await p.goto("http://localhost:4173/", { waitUntil: "networkidle" }); await p.waitForSelector("h1", { timeout: 15000 }); };

await go();
out.onboardingTitle = await p.textContent("h1");
for (let i = 0; i < 3; i++) await p.click(".onboarding .cta");
await p.waitForSelector(".sheet h2", { timeout: 5000 });
out.paywallTitle = await p.textContent(".sheet h2");
await p.click(".sheet-close"); await p.waitForTimeout(300);          // stay FREE first
await p.waitForSelector(".attack-btn");
out.attackBtn = await p.textContent(".attack-btn");

// 1) Attack now → sheet opens with running clock → set intensity + tags → end
await p.click(".attack-btn");
await p.waitForSelector(".sheet", { timeout: 5000 });
out.sheetTitle = await p.textContent(".sheet h2");
await p.$eval("input[type=range]", (el) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; s.call(el, "7"); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); });
const chips = await p.$$(".sheet .chip:not(.other)");
await chips[0].click(); await chips[1].click();
await p.click(".sheet .chip.other"); await p.fill(".sheet input[placeholder]", "Red wine"); await p.keyboard.press("Enter");
await p.waitForTimeout(300);
out.chipsOn = (await p.$$(".sheet .chip.on")).length;           // expect 3 (2 system + 1 user tag)
await p.click(".sheet .cta");                                     // end attack
await p.waitForTimeout(400);
out.endedShown = (await p.$(".sheet input[type=datetime-local]:nth-of-type(1)")) !== null;
await p.click(".sheet .row.between button:not(.linklike)");     // Done
await p.waitForTimeout(300);
out.recentCount = (await p.$$(".list li.tap")).length;            // expect 1
await shot("home-free");

// 2) Check-in
await p.click(".checkin button:nth-child(2)"); await p.waitForTimeout(200);
out.checkinOn = (await p.$(".checkin button.on")) !== null;

// 3) Free gate: Insights locked
await p.click(".tabbar button:nth-child(3)"); await p.waitForTimeout(300);
out.insightsLocked = (await p.textContent(".card strong")) ;
await p.click(".card button"); await p.waitForSelector(".sheet h2");
out.gateReason = await p.textContent(".sheet .muted");
await p.click(".sheet .cta"); await p.waitForTimeout(500);        // mock purchase → PRO

// 4) Seed demo data and check calendar + insights + PDF
await p.evaluate(() => window.__seedDemo("da")); await p.waitForTimeout(2500);
await p.waitForSelector(".attack-btn", { timeout: 15000 });
out.daHome = await p.textContent(".attack-btn");
out.statAttackDays = await p.$eval(".stats .stat .n", (e) => e.textContent);
await shot("home-da");
await p.click(".tabbar button:nth-child(2)"); await p.waitForSelector(".cal");
out.heatCells = (await p.$$(".cal .day.h1, .cal .day.h2, .cal .day.h3, .cal .day.h4")).length;
await shot("calendar-da");
await p.click(".tabbar button:nth-child(3)"); await p.waitForSelector(".bars");
out.bars = (await p.$$(".bars .bar")).length;                      // 12
out.freqRows = (await p.$$(".freq .f")).length;                    // > 0
await shot("insights-da");
const dl = p.waitForEvent("download", { timeout: 20000 });
await p.click(".report-btn"); await p.waitForSelector(".sheet .cta");
await p.click(".sheet .cta");
const d = await dl; out.pdfName = d.suggestedFilename();
// 5) Settings: PIN
await p.click(".tabbar button:nth-child(4)"); await p.waitForSelector("h1");
out.settingsTitle = await p.textContent("h1");
await shot("settings-da");
out.errors = errors;
console.log(JSON.stringify(out, null, 1));
await b.close();
const ok = errors.length === 0 && out.chipsOn === 3 && out.recentCount === 1 && out.bars === 12 && out.freqRows > 0 && out.heatCells > 0 && /\.pdf$/.test(out.pdfName ?? "");
process.exit(ok ? 0 : 1);
