#!/usr/bin/env python3
"""Generates the static site for migrano.app (GitHub Pages) into ../migrano-site (or $OUT).
Usage: python3 scripts/site-gen.py [out_dir]  — then copy a web build into <out>/demo/ if wanted.
Same layout and style.css as furkeep-site/abonnia-site; only copy, colours and the mark differ."""
import os, sys, shutil, datetime

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "..", "migrano-site")
DOMAIN = "migrano.app"; BRAND = "#4B4A7A"; UPDATED = datetime.date.today().strftime("%-d %B %Y"); UPDATED_DA = datetime.date.today().strftime("%-d. %B %Y")
MARK = f'<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="{BRAND}"/><g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"><path d="M14 44a18 18 0 0 1 36 0" opacity=".4"/><path d="M20 44a12 12 0 0 1 24 0" opacity=".7"/><path d="M26 44a6 6 0 0 1 12 0"/></g><circle cx="32" cy="44" r="3" fill="#fff"/></svg>'
FAVICON = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="{BRAND}"/><g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"><path d="M14 44a18 18 0 0 1 36 0" opacity=".4"/><path d="M20 44a12 12 0 0 1 24 0" opacity=".7"/><path d="M26 44a6 6 0 0 1 12 0"/></g><circle cx="32" cy="44" r="3" fill="#fff"/></svg>'

STYLE = """:root{--bg:#f6f5fa;--fg:#1b1a2e;--muted:#6b6a80;--card:#fff;--brand:#4B4A7A;--max:760px}
@media(prefers-color-scheme:dark){:root{--bg:#0f0e1a;--fg:#eeedf5;--muted:#9a99b0;--card:#1a1929;--brand:#a9a3e4}}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--bg);color:var(--fg);line-height:1.6}
header,main,footer{max-width:var(--max);margin:0 auto;padding:0 20px}
header{display:flex;align-items:center;justify-content:space-between;padding-top:20px;padding-bottom:12px}
.logo{display:flex;align-items:center;gap:10px;font-weight:700;text-decoration:none;color:var(--fg);font-size:1.15rem}.logo svg{width:32px;height:32px}
nav a{color:var(--muted);text-decoration:none;margin-left:16px;font-size:.95rem}nav a:hover{color:var(--brand)}
.hero{padding:56px 0 32px}.hero h1{font-size:2.4rem;line-height:1.15;margin:0 0 12px}.hero p{font-size:1.15rem;color:var(--muted);max-width:560px}
.badges{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px}.badge{display:inline-block;padding:12px 18px;border-radius:12px;background:var(--fg);color:var(--bg);text-decoration:none;font-weight:600}.badge.soon{opacity:.5}
.badge small{display:block;font-weight:400;font-size:.75rem;opacity:.8}
.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:32px 0}
.card{background:var(--card);border-radius:16px;padding:20px}.card h3{margin:0 0 6px;font-size:1.05rem}.card p{margin:0;color:var(--muted);font-size:.95rem}
.privacy-callout{border-left:4px solid var(--brand);padding:12px 16px;background:var(--card);border-radius:0 12px 12px 0;margin:24px 0}
.shots{display:flex;gap:12px;overflow-x:auto;padding:8px 0 16px}.shots img{height:420px;border-radius:18px;flex:none;box-shadow:0 8px 30px rgba(0,0,0,.15)}
.disclaimer{font-size:.9rem;color:var(--muted);border-top:1px solid #8884;padding-top:16px;margin-top:32px}
h2{margin-top:36px}article h2{font-size:1.25rem}article h3{font-size:1.05rem;margin-top:24px}.muted{color:var(--muted)}
footer{padding:40px 20px;color:var(--muted);font-size:.9rem;border-top:1px solid #ddd3;margin-top:48px}footer a{color:var(--muted)}.lang{font-size:.85rem}
@media(max-width:600px){.hero h1{font-size:1.9rem}.shots img{height:340px}}
"""

def page(lang, path, title, desc, body, alt):
    other = "da" if lang == "en" else "en"
    nav = {"en": ("Privacy", "Terms", "Support"), "da": ("Privatliv", "Vilkår", "Support")}[lang]
    pre = "" if lang == "en" else "/da"
    opre = "" if other == "en" else "/da"
    foot = {"en": f"© 2026 Therkildsen Group · CVR 46203798 · Migrano is an <a href=\"https://ilumie.com\">Ilumie</a> app · <a href=\"mailto:support@{DOMAIN}\">support@{DOMAIN}</a>",
            "da": f"© 2026 Therkildsen Group · CVR 46203798 · Migrano er en <a href=\"https://ilumie.com\">Ilumie</a>-app · <a href=\"mailto:support@{DOMAIN}\">support@{DOMAIN}</a>"}[lang]
    return f"""<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><meta name="description" content="{desc}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css">
<link rel="alternate" hreflang="en" href="https://{DOMAIN}{alt}"><link rel="alternate" hreflang="da" href="https://{DOMAIN}/da{alt}"></head><body>
<header><a class="logo" href="{pre}/">{MARK}Migrano</a><nav><a href="{pre}/privacy">{nav[0]}</a><a href="{pre}/terms">{nav[1]}</a><a href="{pre}/support">{nav[2]}</a><a class="lang" href="{opre}{alt}">{other.upper()}</a></nav></header>
<main>{body}</main>
<footer>{foot}</footer>
</body></html>"""

def shots(lang):
    return '<div class="shots">' + "".join(f'<img src="/store-assets/{lang}/store-iphone-6.7-{i}.png" alt="" loading="lazy">' for i in range(1, 7)) + "</div>"

INDEX = {
"en": ("Migrano – private migraine tracker & headache diary", "One tap when a migraine starts. Attack days, medication days and a PDF report for your doctor. No account.", f"""
<section class="hero"><h1>The migraine diary you'll actually keep.</h1>
<p>One tap when an attack starts, details when you feel better, and a PDF your neurologist reads in a minute. On your phone, nowhere else.</p>
<div class="badges"><a class="badge soon" href="#" title="Coming soon">App Store<small>Coming soon</small></a><a class="badge soon" href="#" title="Coming soon">Google Play<small>Coming soon</small></a><a class="badge" href="/demo/">Web demo<small>Try it in your browser</small></a></div></section>
{shots('en')}
<section class="features">
<div class="card"><h3>Attack now</h3><p>Starts the clock with one tap. Intensity, triggers, symptoms and medication can wait.</p></div>
<div class="card"><h3>Attack days &amp; medication days</h3><p>The two numbers every neurologist asks for, counted for you each month.</p></div>
<div class="card"><h3>Calendar heatmap</h3><p>Your month at a glance, with a daily 5-second check-in for the days without pain.</p></div>
<div class="card"><h3>Insights</h3><p>Average duration and intensity, and which triggers and symptoms come up most.</p></div>
<div class="card"><h3>PDF report</h3><p>Any period, one row per attack, formatted for the doctor's visit.</p></div>
<div class="card"><h3>Medication-day warning</h3><p>Tells you when you pass the limit you chose (10 or 15 days). Never a diagnosis.</p></div></section>
<div class="privacy-callout"><strong>Private by design.</strong> No account, no cloud, no analytics. Protect the diary with a PIN and export an encrypted backup whenever you want. <a href="/privacy">Read the privacy policy</a>.</div>
<section><h2>Free and Pro</h2><p>Logging, check-ins, the calendar and medication days are free, forever. Migrano Pro adds insights, the PDF report, the medication-day warning, PIN lock, backup and unlimited history — yearly with a 7-day free trial, or one lifetime purchase. No ads, ever.</p></section>
<p class="disclaimer">Migrano is a self-observation diary, not a medical device. It does not diagnose or recommend treatment. Talk to your doctor about what you log.</p>"""),
"da": ("Migrano – privat migrænedagbog & hovedpinedagbog", "Ét tryk, når migrænen starter. Anfaldsdage, medicindage og en PDF-rapport til lægen. Ingen konto.", f"""
<section class="hero"><h1>Migrænedagbogen, du faktisk får ført.</h1>
<p>Ét tryk, når anfaldet starter, detaljer, når du har det bedre, og en PDF, din neurolog læser på et minut. På din telefon – ingen andre steder.</p>
<div class="badges"><a class="badge soon" href="#" title="Kommer snart">App Store<small>Kommer snart</small></a><a class="badge soon" href="#" title="Kommer snart">Google Play<small>Kommer snart</small></a><a class="badge" href="/demo/">Web-demo<small>Prøv i browseren</small></a></div></section>
{shots('da')}
<section class="features">
<div class="card"><h3>Anfald nu</h3><p>Starter uret med ét tryk. Intensitet, triggere, symptomer og medicin kan vente.</p></div>
<div class="card"><h3>Anfaldsdage &amp; medicindage</h3><p>De to tal, enhver neurolog spørger om – talt op for dig hver måned.</p></div>
<div class="card"><h3>Kalender-heatmap</h3><p>Din måned på ét blik, med et dagligt 5-sekunders check-in på dagene uden smerte.</p></div>
<div class="card"><h3>Indsigt</h3><p>Gennemsnitlig varighed og intensitet, og hvilke triggere og symptomer der går igen.</p></div>
<div class="card"><h3>PDF-rapport</h3><p>Valgfri periode, én linje pr. anfald, formateret til lægebesøget.</p></div>
<div class="card"><h3>Medicindage-advarsel</h3><p>Siger til, når du passerer den grænse, du har valgt (10 eller 15 dage). Aldrig en diagnose.</p></div></section>
<div class="privacy-callout"><strong>Privat fra bunden.</strong> Ingen konto, ingen sky, ingen analytics. Beskyt dagbogen med PIN og eksportér en krypteret backup, når du vil. <a href="/da/privacy">Læs privatlivspolitikken</a>.</div>
<section><h2>Gratis og Pro</h2><p>Logning, check-ins, kalender og medicindage er gratis – for altid. Migrano Pro giver indsigt, PDF-rapport, medicindage-advarsel, PIN-lås, backup og ubegrænset historik – årligt med 7 dages gratis prøve eller ét livstidskøb. Aldrig reklamer.</p></section>
<p class="disclaimer">Migrano er en selvobservations-dagbog, ikke medicinsk udstyr. Den stiller ikke diagnoser og anbefaler ikke behandling. Tal med din læge om det, du logger.</p>"""),
}

PRIVACY = {
"en": ("Privacy policy – Migrano", "Migrano stores all data on your device and collects nothing.", f"""<article><h1>Privacy policy</h1><p class="muted">Last updated {UPDATED}</p>
<p>Migrano is a headache diary. Health data is the most private data there is, so the app is built so that we never see it. This policy explains what that means in practice.</p>
<h2>Who we are</h2><p>Migrano is published by Therkildsen Group, CVR 46203798, Teglkrogen 10, 8800 Viborg, Denmark, under the Ilumie brand. Contact: <a href="mailto:support@{DOMAIN}">support@{DOMAIN}</a>.</p>
<h2>What data the app handles</h2><p>Attacks (times, intensity, triggers, symptoms, location, notes), medication names and intake times, daily check-ins and your settings. All of it is stored in a local database on your device. It is not transmitted to us or to anyone else, and we have no server that could receive it. It is not stored in iCloud or Google Drive by the app.</p>
<h2>What we collect</h2><p>Nothing. Migrano contains no analytics, no advertising SDKs and no crash reporting that identifies you.</p>
<h2>Purchases</h2><p>Subscriptions and one-time purchases are processed by Apple or Google. To recognise your purchase across reinstalls we use RevenueCat, which receives an anonymous app-user ID and purchase receipts from the store. RevenueCat never receives your diary. See <a href="https://www.revenuecat.com/privacy">RevenueCat's privacy policy</a>.</p>
<h2>Backups, reports and sharing</h2><p>When you export a backup, the app writes an encrypted file (AES-256, key derived from a passphrase you choose) and hands it to your device's share sheet. The PDF report is generated on the device and shared the same way. Where a file goes from there (AirDrop, mail, your doctor's portal) is your choice, and that recipient's terms apply. We never receive the file.</p>
<h2>PIN lock</h2><p>If you set a PIN, only a salted hash is stored on the device. We cannot recover a forgotten PIN.</p>
<h2>Notifications</h2><p>Reminders are scheduled locally on your device. No push server is involved.</p>
<h2>Your rights</h2><p>Because we hold no personal data about you, there is nothing for us to access, correct or delete on request. Deleting the app deletes all data on that device. If you have questions, write to <a href="mailto:support@{DOMAIN}">support@{DOMAIN}</a>. You may also complain to Datatilsynet (the Danish Data Protection Agency).</p>
<h2 id="deletion">Data deletion</h2><p>Migrano has no accounts and no server-side data, so you delete it yourself:</p><ul><li><strong>Delete all data in the app:</strong> Settings → Your data → Delete all data.</li><li><strong>Uninstall the app:</strong> removes the app and all its data from the device.</li><li><strong>Backup files and PDFs</strong> you exported are under your control; delete them wherever you saved them.</li></ul><p>Purchase records are held by Apple or Google under your store account, and an anonymous purchase identifier by RevenueCat. If you want the RevenueCat record erased, e-mail <a href="mailto:support@{DOMAIN}">support@{DOMAIN}</a> and we will request deletion within 30 days.</p>
<h2>Not a medical device</h2><p>Migrano is a self-observation diary. It does not diagnose, classify headache types or recommend treatment. The medication-day warning is a count against a limit you set yourself, shown so you can raise it with your doctor.</p>
<h2>Children</h2><p>Migrano is not directed at children under 13 and does not knowingly collect data from them (it collects none from anyone).</p>
<h2>Changes</h2><p>If this policy changes, the new version will be published here with a new date. The app links to this page.</p></article>"""),
"da": ("Privatlivspolitik – Migrano", "Migrano gemmer alle data på din enhed og indsamler intet.", f"""<article><h1>Privatlivspolitik</h1><p class="muted">Sidst opdateret {UPDATED_DA}</p>
<p>Migrano er en hovedpinedagbog. Helbredsdata er de mest private data, der findes, så appen er bygget, så vi aldrig ser dem. Denne politik forklarer, hvad det betyder i praksis.</p>
<h2>Hvem vi er</h2><p>Migrano udgives af Therkildsen Group, CVR 46203798, Teglkrogen 10, 8800 Viborg, under brandet Ilumie. Kontakt: <a href="mailto:support@{DOMAIN}">support@{DOMAIN}</a>.</p>
<h2>Hvilke data appen håndterer</h2><p>Anfald (tidspunkter, intensitet, triggere, symptomer, placering, noter), medicinnavne og indtagelsestidspunkter, daglige check-ins og dine indstillinger. Alt gemmes i en lokal database på din enhed. Det sendes ikke til os eller andre, og vi har ingen server, der kunne modtage det. Appen gemmer det ikke i iCloud eller Google Drev.</p>
<h2>Hvad vi indsamler</h2><p>Intet. Migrano indeholder ingen analytics, ingen reklame-SDK'er og ingen fejlrapportering, der identificerer dig.</p>
<h2>Køb</h2><p>Abonnementer og engangskøb behandles af Apple eller Google. For at genkende dit køb efter geninstallation bruger vi RevenueCat, som modtager et anonymt app-bruger-id og købskvitteringer fra butikken. RevenueCat modtager aldrig din dagbog. Se <a href="https://www.revenuecat.com/privacy">RevenueCats privatlivspolitik</a>.</p>
<h2>Backup, rapporter og deling</h2><p>Når du eksporterer en backup, skriver appen en krypteret fil (AES-256, nøgle afledt af en adgangssætning, du vælger) og giver den til enhedens delingsark. PDF-rapporten genereres på enheden og deles på samme måde. Hvor en fil ender (AirDrop, mail, lægens portal), er dit valg, og modtagerens vilkår gælder. Vi modtager aldrig filen.</p>
<h2>PIN-lås</h2><p>Sætter du en PIN, gemmes kun en saltet hash på enheden. Vi kan ikke gendanne en glemt PIN.</p>
<h2>Notifikationer</h2><p>Påmindelser planlægges lokalt på din enhed. Ingen push-server er involveret.</p>
<h2>Dine rettigheder</h2><p>Da vi ikke har personoplysninger om dig, er der intet, vi kan give indsigt i, rette eller slette på anmodning. Sletter du appen, slettes alle data på den enhed. Spørgsmål: <a href="mailto:support@{DOMAIN}">support@{DOMAIN}</a>. Du kan også klage til Datatilsynet.</p>
<h2 id="deletion">Sletning af data</h2><p>Migrano har ingen konti og ingen data på servere, så du sletter selv:</p><ul><li><strong>Slet alle data i appen:</strong> Indstillinger → Dine data → Slet alle data.</li><li><strong>Afinstallér appen:</strong> fjerner appen og alle dens data fra enheden.</li><li><strong>Backup-filer og PDF'er</strong>, du har eksporteret, er under din kontrol; slet dem, hvor du gemte dem.</li></ul><p>Købsoplysninger ligger hos Apple eller Google under din butikskonto og et anonymt købs-id hos RevenueCat. Vil du have RevenueCat-posten slettet, så skriv til <a href="mailto:support@{DOMAIN}">support@{DOMAIN}</a>, og vi anmoder om sletning inden 30 dage.</p>
<h2>Ikke medicinsk udstyr</h2><p>Migrano er en selvobservations-dagbog. Den stiller ikke diagnoser, klassificerer ikke hovedpinetyper og anbefaler ikke behandling. Medicindage-advarslen er en optælling mod en grænse, du selv sætter, vist så du kan tage det op med din læge.</p>
<h2>Børn</h2><p>Migrano henvender sig ikke til børn under 13 og indsamler ikke bevidst data fra dem (den indsamler ingen fra nogen).</p>
<h2>Ændringer</h2><p>Ændres denne politik, offentliggøres den nye version her med ny dato. Appen linker til denne side.</p></article>"""),
}

TERMS = {
"en": ("Terms of use – Migrano", "Terms for using the Migrano app.", f"""<article><h1>Terms of use</h1><p class="muted">Last updated {UPDATED}</p>
<p>These terms apply to the Migrano app published by Therkildsen Group (CVR 46203798), Viborg, Denmark. On the App Store, Apple's <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">standard EULA</a> also applies.</p>
<h2>What Migrano is</h2><p>Migrano is a personal headache diary: it stores what you log and shows counts, averages and shares of it. It is <strong>not a medical device</strong>, does not diagnose, does not classify headache types and does not recommend treatment. Decisions about your health belong to you and your doctor.</p>
<h2>Free and Pro</h2><p>Logging, check-ins, the calendar and medication-day counts are free. Pro is available as a yearly subscription (with a free trial where offered) or a one-time lifetime purchase. Payment is taken by Apple or Google. Subscriptions renew automatically unless cancelled at least 24 hours before the period ends, in your store account settings. Refunds are handled by the store under its policies.</p>
<h2>Your data</h2><p>Your data is stored on your device. You are responsible for keeping backups. We cannot recover data from a lost or wiped device, or a forgotten PIN, because we never have a copy.</p>
<h2>Liability</h2><p>Migrano is provided "as is". To the extent permitted by law, we are not liable for indirect losses, including decisions taken on the basis of what the app shows. Nothing in these terms limits rights you have under mandatory consumer law in your country.</p>
<h2>Contact</h2><p><a href="mailto:support@{DOMAIN}">support@{DOMAIN}</a>. Danish law applies; disputes may be brought before the courts of Denmark or, for EU consumers, your local courts.</p></article>"""),
"da": ("Vilkår for brug – Migrano", "Vilkår for brug af Migrano-appen.", f"""<article><h1>Vilkår for brug</h1><p class="muted">Sidst opdateret {UPDATED_DA}</p>
<p>Disse vilkår gælder for appen Migrano, udgivet af Therkildsen Group (CVR 46203798), Viborg. På App Store gælder desuden Apples <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">standard-EULA</a>.</p>
<h2>Hvad Migrano er</h2><p>Migrano er en personlig hovedpinedagbog: den gemmer det, du logger, og viser optællinger, gennemsnit og andele af det. Den er <strong>ikke medicinsk udstyr</strong>, stiller ikke diagnoser, klassificerer ikke hovedpinetyper og anbefaler ikke behandling. Beslutninger om dit helbred tilhører dig og din læge.</p>
<h2>Gratis og Pro</h2><p>Logning, check-ins, kalender og medicindage er gratis. Pro fås som årligt abonnement (med gratis prøveperiode, hvor det tilbydes) eller som engangskøb for livstid. Betaling sker via Apple eller Google. Abonnementer fornys automatisk, medmindre de opsiges mindst 24 timer før periodens udløb i din butikskonto. Refusion håndteres af butikken efter dens regler.</p>
<h2>Dine data</h2><p>Dine data gemmes på din enhed. Du er selv ansvarlig for backup. Vi kan ikke gendanne data fra en mistet eller nulstillet enhed eller en glemt PIN, fordi vi aldrig har en kopi.</p>
<h2>Ansvar</h2><p>Migrano leveres "som den er". I det omfang loven tillader det, er vi ikke ansvarlige for indirekte tab, herunder beslutninger truffet på baggrund af det, appen viser. Intet i disse vilkår begrænser de rettigheder, du har efter ufravigelig forbrugerlovgivning.</p>
<h2>Kontakt</h2><p><a href="mailto:support@{DOMAIN}">support@{DOMAIN}</a>. Dansk ret gælder; tvister kan indbringes for danske domstole eller, for EU-forbrugere, dine lokale domstole.</p></article>"""),
}

SUPPORT = {
"en": ("Support – Migrano", "Help and frequently asked questions for Migrano.", f"""<article><h1>Support</h1>
<p>Write to <a href="mailto:support@{DOMAIN}">support@{DOMAIN}</a>. We usually answer within two working days.</p>
<h2>Common questions</h2>
<h3>Where is my data?</h3><p>On your phone only. Export an encrypted backup from Settings if you want a copy elsewhere.</p>
<h3>I forgot my PIN</h3><p>We can't recover it — only a hash is stored. Deleting all data (or reinstalling) unlocks the app; import a backup afterwards if you have one.</p>
<h3>How do I move to a new phone?</h3><p>Settings → Export encrypted backup on the old phone, choose a passphrase, send the file to yourself. On the new phone: Settings → Import backup.</p>
<h3>What counts as a medication day?</h3><p>A calendar day with at least one intake of a medication you marked as <em>acute</em>. Preventive medication is not counted. The 10/15-day limit is yours to set; it is a prompt to talk to your doctor, not a diagnosis.</p>
<h3>Why does the calendar colour differ between days?</h3><p>The colour is the highest intensity you logged that day. Days with a "mild" check-in but no attack get their own light tint.</p>
<h3>How do I cancel Pro?</h3><p>iPhone: Settings → your name → Subscriptions. Android: Play Store → profile → Payments &amp; subscriptions. Cancelling keeps Pro until the period ends.</p>
<h3>Restore a purchase</h3><p>Settings → Restore purchases. Lifetime purchases and active subscriptions are restored from your store account.</p>
<h3>Reminders don't show</h3><p>Check that notifications are allowed for Migrano in your phone's settings and that the daily check-in reminder is switched on in Migrano's settings.</p></article>"""),
"da": ("Support – Migrano", "Hjælp og ofte stillede spørgsmål om Migrano.", f"""<article><h1>Support</h1>
<p>Skriv til <a href="mailto:support@{DOMAIN}">support@{DOMAIN}</a>. Vi svarer normalt inden for to hverdage.</p>
<h2>Ofte stillede spørgsmål</h2>
<h3>Hvor er mine data?</h3><p>Kun på din telefon. Eksportér en krypteret backup fra Indstillinger, hvis du vil have en kopi et andet sted.</p>
<h3>Jeg har glemt min PIN</h3><p>Vi kan ikke gendanne den – kun en hash gemmes. Sletning af alle data (eller geninstallation) låser appen op; importér bagefter en backup, hvis du har en.</p>
<h3>Hvordan flytter jeg til en ny telefon?</h3><p>Indstillinger → Eksportér krypteret backup på den gamle telefon, vælg en adgangssætning, send filen til dig selv. På den nye: Indstillinger → Importér backup.</p>
<h3>Hvad tæller som en medicindag?</h3><p>En kalenderdag med mindst ét indtag af et præparat, du har markeret som <em>akut</em>. Forebyggende medicin tælles ikke. Grænsen på 10/15 dage sætter du selv; den er en anledning til at tale med lægen, ikke en diagnose.</p>
<h3>Hvorfor har dagene forskellig farve i kalenderen?</h3><p>Farven er den højeste intensitet, du loggede den dag. Dage med "mild" check-in uden anfald får deres egen lyse tone.</p>
<h3>Hvordan opsiger jeg Pro?</h3><p>iPhone: Indstillinger → dit navn → Abonnementer. Android: Play Butik → profil → Betalinger og abonnementer. Opsigelse beholder Pro til periodens udløb.</p>
<h3>Gendan et køb</h3><p>Indstillinger → Gendan køb. Livstidskøb og aktive abonnementer gendannes fra din butikskonto.</p>
<h3>Påmindelser vises ikke</h3><p>Tjek, at notifikationer er tilladt for Migrano i telefonens indstillinger, og at den daglige check-in-påmindelse er slået til i Migranos indstillinger.</p></article>"""),
}

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w", encoding="utf-8").write(content)

def main():
    for lang in ("en", "da"):
        pre = "" if lang == "en" else "/da"
        for name, data, alt in (("index", INDEX, "/"), ("privacy", PRIVACY, "/privacy"), ("terms", TERMS, "/terms"), ("support", SUPPORT, "/support")):
            title, desc, body = data[lang]
            rel = f"{pre}/index.html" if name == "index" else f"{pre}/{name}/index.html"
            write(os.path.join(OUT, rel.lstrip("/")), page(lang, rel, title, desc, body, alt))
    write(os.path.join(OUT, "style.css"), STYLE)
    write(os.path.join(OUT, "favicon.svg"), FAVICON)
    write(os.path.join(OUT, "CNAME"), DOMAIN + "\n")
    write(os.path.join(OUT, ".nojekyll"), "")
    write(os.path.join(OUT, "robots.txt"), f"User-agent: *\nAllow: /\nDisallow: /demo/\nSitemap: https://{DOMAIN}/sitemap.xml\n")
    urls = [f"https://{DOMAIN}{p}" for p in ("/", "/da/", "/privacy", "/da/privacy", "/terms", "/da/terms", "/support", "/da/support")]
    write(os.path.join(OUT, "sitemap.xml"), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"<url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n")
    # store screenshots for the landing page
    src = os.path.join(os.path.dirname(__file__), "..", "store", "screenshots")
    for lang in ("en", "da"):
        d = os.path.join(OUT, "store-assets", lang); os.makedirs(d, exist_ok=True)
        for i in range(1, 7):
            f = os.path.join(src, lang, f"store-iphone-6.7-{i}.png")
            if os.path.exists(f): shutil.copy(f, d)
    print("site written to", os.path.abspath(OUT))

if __name__ == "__main__":
    main()
