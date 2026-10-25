// Maakt logobestanden voor Instagram in ontwerp/logo/instagram/ (PNG, 1080 px breed):
// profielfoto (donker en licht), het volledige logo in een vierkant (licht en donker),
// een story-achtergrond (1080x1920), het beeldmerk op een doorzichtige achtergrond en de kop
// voor e-mails (public/mail-kop.png, online op /mail-kop.png).
// Gebruik: npm run build && node scripts/instagram-afbeeldingen.mjs  (Playwright moet beschikbaar zijn)
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { LOGO_SVG, LOGO_OMGEKEERD_SVG } from "../src/templates.mjs";
import { WOORDMERK_SVG } from "../src/woordmerk.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const uit = join(root, "ontwerp/logo/instagram");
mkdirSync(uit, { recursive: true });
const { chromium } = await import(process.env.PLAYWRIGHT || "playwright");

const server = createServer((req, res) => {
  const pad = req.url === "/" ? join(root, "ontwerp/logo/instagram.html") : join(root, "public", decodeURIComponent(req.url));
  try { res.end(readFileSync(pad)); } catch { res.statusCode = 404; res.end(); }
}).listen(0);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(`http://localhost:${server.address().port}/`);
await page.evaluate(([met, zonder, woord]) => {
  document.querySelectorAll(".merk-met").forEach((el) => (el.innerHTML = met));
  document.querySelectorAll(".merk-zonder").forEach((el) => (el.innerHTML = zonder));
  document.querySelectorAll(".woord").forEach((el) => (el.outerHTML = woord));
}, [LOGO_SVG, LOGO_OMGEKEERD_SVG, WOORDMERK_SVG]);
await page.evaluate(() => document.fonts.ready);
const bestanden = {
  "profiel-donker": "profielfoto-donker.png",
  "profiel-licht": "profielfoto-licht.png",
  "logo-licht": "logo-vierkant-licht.png",
  "logo-donker": "logo-vierkant-donker.png",
  story: "story-achtergrond.png",
  beeldmerk: "beeldmerk-transparant.png",
  mailkop: "../../../public/mail-kop.png",
};
for (const [id, naam] of Object.entries(bestanden)) {
  await page.locator(`#${id}`).screenshot({ path: join(uit, naam), omitBackground: id === "beeldmerk" });
}
await browser.close();
server.close();
console.log(`${Object.keys(bestanden).length} bestanden gemaakt in ontwerp/logo/instagram/.`);
