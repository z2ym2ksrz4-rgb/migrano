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
// 0) Onboarding: language+name → 3 intro → setup questions
out.onboardingTitle = await p.textContent("h1");
await p.fill(".onboarding input[autocomplete=given-name]", "Steffen");
await p.click(".onboarding .cta");
for (let i = 0; i < 3; i++) await p.click(".onboarding .cta");
out.widgetStep = (await p.$$(".onboarding .steps li")).length;            // 3 (widget intro)
await p.click(".onboarding .cta");
out.setupTitle = await p.textContent("h1");
await p.click(".onboarding .chips button:nth-child(2)");          // 4-7 attacks
await p.click(".onboarding .field:nth-of-type(2) .chips button:nth-child(1)"); // triptan
await p.click(".onboarding .cta");                                          // → extras
out.extrasChecks = (await p.$$(".onboarding input[type=checkbox]")).length; // ≥1 (cycle; health only on iOS)
await p.click(".onboarding .check input");                                  // want cycle tracking
await p.click(".onboarding .cta");                                          // start
await p.waitForSelector(".sheet h2", { timeout: 5000 });
out.paywallTitle = await p.textContent(".sheet h2");
await p.click(".sheet-close"); await p.waitForTimeout(300);          // stay FREE first
await p.waitForSelector(".hero-btn");
out.greeting = await p.textContent("h1");                            // "Hej Steffen"

// 1) Attack now → quick sheet (how bad?) → pick → closes. Reopen → full → tags → end → journey
await p.click(".hero-btn");
await p.waitForSelector(".sheet .bigchoice", { timeout: 5000 });
out.quickTitle = await p.textContent(".sheet h2");
await p.click(".sheet .bigchoice .big.moderate"); await p.waitForTimeout(300);
out.quickClosed = (await p.$(".sheet")) === null;
await p.click(".hero-btn.live"); await p.waitForSelector(".sheet .bigchoice");
out.liveTitle = await p.textContent(".sheet h2");
await p.click(".sheet .linklike"); await p.waitForSelector(".sheet input[type=range]");   // "Ret alle detaljer" → full
const chips = await p.$$(".sheet .chip:not(.other)");
await chips[0].click(); await chips[1].click();
await p.click(".sheet .chip.other"); await p.fill(".sheet input[placeholder]", "Red wine"); await p.keyboard.press("Enter");
await p.waitForTimeout(300);
out.chipsOn = (await p.$$(".sheet .chip.on")).length;           // expect 3 (2 system + 1 user tag)
await p.click(".sheet .cta");                                     // end attack → journey
await p.waitForSelector(".sheet .bigchips", { timeout: 5000 });
out.journeyQ = await p.textContent(".sheet h3");
out.journeyTopChips = (await p.$$(".sheet .bigchips .chip")).length; // ≤ 7 (6 + more)
const steps = 5;
for (let i = 0; i < steps; i++) { await p.click(".sheet .row.between .row.tight button:last-child"); await p.waitForTimeout(250); }
out.journeyClosed = (await p.$(".sheet")) === null;
out.recentCount = (await p.$$(".list li.tap")).length;            // expect 1
await shot("home-free");

// 2) Check-in with explicit save
await p.click(".checkin button:nth-child(2)"); await p.click(".checkin-card .scale button:nth-child(4)");
await p.click(".checkin-card .cta"); await p.waitForTimeout(300);
out.savedDay = await p.textContent(".card strong");

// 3) Free gate: Insights locked
await p.click(".tabbar button:nth-child(3)"); await p.waitForTimeout(300);
out.insightsLocked = (await p.textContent(".card strong"));
await p.click(".card button"); await p.waitForSelector(".sheet h2");
out.gateReason = await p.textContent(".sheet .muted");
await p.click(".sheet .cta"); await p.waitForTimeout(500);        // mock purchase → PRO

// 4) Seed demo data and check calendar + insights + PDF
await p.evaluate(() => window.__seedDemo("da")); await p.waitForTimeout(2500);
await p.waitForSelector(".hero-btn", { timeout: 15000 });
out.daHome = await p.textContent(".hero-lbl strong");
out.statAttackDays = await p.$eval(".stats .stat .n", (e) => e.textContent);
out.streak = (await p.$(".stat.ok")) !== null;
out.periodChip = (await p.$(".period-row .chip")) !== null;         // cycle wish applied after Pro
await p.click(".stat.tap"); await p.waitForSelector(".sheet h2");
out.medDaysInfo = await p.textContent(".sheet h2"); await p.click(".sheet .cta"); await p.waitForTimeout(200);
await shot("home-da");
await p.click(".tabbar button:nth-child(2)"); await p.waitForSelector(".cal");
out.heatCells = (await p.$$(".cal .day.h1, .cal .day.h2, .cal .day.h3, .cal .day.h4")).length;
await shot("calendar-da");
await p.click(".tabbar button:nth-child(3)"); await p.waitForSelector(".bars");
out.bars = (await p.$$(".bars .bar")).length;                      // 12
out.freqRows = (await p.$$(".freq .f")).length;                    // > 0
out.patternCards = (await p.$$(".card.col strong")).length;
out.learnLines = (await p.$$(".learn p")).length;                  // > 0 (prose learning)
out.moh = (await p.$$(".moh .stat")).length;                       // 3
out.patPressure = (await p.textContent(".screen")).toLowerCase().includes("lufttryk"); // weather pattern card (seeded weatherDay)
await shot("insights-da");
const dl = p.waitForEvent("download", { timeout: 20000 });
await p.click(".report-btn"); await p.waitForSelector(".sheet .cta");
await p.fill(".sheet textarea", "Spørgsmål til lægen: skal jeg skifte triptan?");
await p.click(".sheet .cta");
const d = await dl; out.pdfName = d.suggestedFilename();
// 5) Settings: plan sheet, widget guide, PIN 6 digits
await p.click(".tabbar button:nth-child(4)"); await p.waitForSelector("h1");
out.settingsTitle = await p.textContent("h1");
await p.click(".card.tap"); await p.waitForSelector(".sheet h2"); out.planSheet = await p.textContent(".sheet h2"); await p.click(".sheet-close");
await p.waitForTimeout(200);
out.widgetGuideSteps = 0;
const widgetBtn = await p.$$("button.ghost");
for (const w of widgetBtn) { if ((await w.textContent())?.trim() === "Tilføj") { await w.click(); break; } }
await p.waitForSelector(".sheet .steps li", { timeout: 3000 }).catch(() => null);
out.widgetGuideSteps = (await p.$$(".sheet .steps li")).length;     // 3
await p.click(".sheet-close"); await p.waitForTimeout(200);
// weather: place picker opens (Pro), search needs network so only the sheet is checked
const chooseBtn = await p.$$("button.ghost");
for (const w of chooseBtn) { if ((await w.textContent())?.trim() === "Vælg sted") { await w.click(); break; } }
await p.waitForSelector(".sheet input[placeholder]", { timeout: 3000 }).catch(() => null);
out.placeSheet = (await p.$(".sheet input[placeholder]")) !== null;
await p.click(".sheet-close"); await p.waitForTimeout(200);
await shot("settings-da");
out.errors = errors;
console.log(JSON.stringify(out, null, 1));
await b.close();
const ok = errors.length === 0 && out.quickClosed && out.chipsOn === 3 && out.journeyClosed && out.recentCount === 1 && out.bars === 12 && out.freqRows > 0 && out.heatCells > 0 && out.moh === 3 && out.widgetGuideSteps === 3 && out.widgetStep === 3 && out.learnLines > 0 && out.periodChip && out.patPressure && out.placeSheet && /\.pdf$/.test(out.pdfName ?? "");
process.exit(ok ? 0 : 1);
