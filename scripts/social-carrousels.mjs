// Maakt carrouselposts (losse beelden om door te vegen) voor Instagram, TikTok en YouTube: de affiches van
// "Nu in het theater", per impresariaat in dezelfde groepjes als de video's (scripts/social-videos.mjs).
//   Instagram 1080x1350 en TikTok 1080x1920: voorkant, één dia per affiche, slot met de site.
//   YouTube 1080x1080: alleen de affiches, want een YouTube-post heeft hooguit 5 beelden.
// Ze komen in ontwerp/social/<datum>/carrousels/<formaat>/<groep>/01.jpg, 02.jpg, ...
// Gebruik: node scripts/social-carrousels.mjs  (Playwright moet beschikbaar zijn)
// BUILD_DATE=JJJJ-MM-DD kiest de dag, zoals bij de build.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { loadData } from "../src/data.mjs";
import { createTemplates, LOGO_OMGEKEERD_SVG, slugVan } from "../src/templates.mjs";
import { WOORDMERK_SVG } from "../src/woordmerk.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const today = process.env.BUILD_DATE || new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
const uit = join(root, "ontwerp/social", today, "carrousels");
// Playwright is CommonJS: via een pad (PLAYWRIGHT=/pad/naar/playwright/index.js) zit chromium onder default.
const playwright = await import(process.env.PLAYWRIGHT || "playwright");
const chromium = playwright.chromium || playwright.default.chromium;

const db = loadData(join(root, "data"), { today });
const groepen = createTemplates(db).socialVideos(5);

// Breedte en hoogte in CSS-pixels; op 1,5x opgenomen.
const FORMATEN = { instagram: [720, 900], tiktok: [720, 1280], youtube: [720, 720] };

const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url);
  const pad = url === "/" ? join(root, "ontwerp/social/carrousel.html") : url.startsWith("/social/") ? join(root, "ontwerp", url) : join(root, "public", url);
  try { res.end(readFileSync(pad)); } catch { res.statusCode = 404; res.end(); }
}).listen(0);

rmSync(uit, { recursive: true, force: true });
const browser = await chromium.launch();
const teksten = [`# Carrouselposts ${today}`, "", "Per groep een map met de beelden in volgorde (01, 02, ...) en een bijschrift om te plakken.", ""];
let aantal = 0;
for (const [formaat, [breedte, hoogte]] of Object.entries(FORMATEN)) {
  const page = await browser.newPage({ viewport: { width: breedte, height: hoogte }, deviceScaleFactor: 1.5 });
  await page.goto(`http://localhost:${server.address().port}/`);
  const perBureau = {};
  for (const groep of groepen) {
    const nr = (perBureau[groep.van] = (perBureau[groep.van] || 0) + 1);
    const naam = `${slugVan(groep.van)}-${nr}`;
    const map = join(uit, formaat, naam);
    mkdirSync(map, { recursive: true });
    const affiches = groep.affiches.map((a) => a.html);
    const dias = [
      ...(formaat === "youtube" ? [] : [{ soort: "voor", affiches: affiches.slice(0, 3) }]),
      ...affiches.map((a) => ({ soort: "affiche", affiches: [a] })),
      ...(formaat === "youtube" ? [] : [{ soort: "slot" }]),
    ];
    for (const [i, dia] of dias.entries()) {
      await page.evaluate(([d, f, merk, woord]) => window.toon(d, f, merk, woord), [dia, formaat, LOGO_OMGEKEERD_SVG, WOORDMERK_SVG]);
      await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map((img) => img.decode().catch(() => {}))]));
      await page.screenshot({ path: join(map, `${String(i + 1).padStart(2, "0")}.jpg`), type: "jpeg", quality: 90 });
      aantal++;
    }
    if (formaat === "instagram") teksten.push(`## ${naam}`, "",
      `Nu in het theater: ${groep.affiches.map((a) => `${a.artiest} met ${a.titel}`).join(", ")}. Alle speeldata op cabaretiers.com.`, "");
  }
  await page.close();
}
writeFileSync(join(uit, "teksten.md"), teksten.join("\n"));
await browser.close();
server.close();
console.log(`${groepen.length} carrousels per formaat, ${aantal} beelden in ontwerp/social/${today}/carrousels/.`);
