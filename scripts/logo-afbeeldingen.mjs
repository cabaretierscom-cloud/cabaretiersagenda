// Maakt de PNG-versies van het logo: het deelplaatje voor sociale media (1200x630) en het
// app-icoon voor telefoons (180x180, zonder ronde hoeken: iOS rondt zelf af).
// Gebruik: npm run build && node scripts/logo-afbeeldingen.mjs  (Playwright moet beschikbaar zijn)
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { LOGO_SVG } from "../src/templates.mjs";
import { WOORDMERK_SVG } from "../src/woordmerk.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { chromium } = await import(process.env.PLAYWRIGHT || "playwright");

const server = createServer((req, res) => {
  const pad = req.url === "/" ? join(root, "ontwerp/logo/deelafbeelding.html") : join(root, "public", decodeURIComponent(req.url));
  try { res.end(readFileSync(pad)); } catch { res.statusCode = 404; res.end(); }
}).listen(0);
const url = `http://localhost:${server.address().port}/`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url);
await page.evaluate(([svg, woord]) => {
  document.getElementById("merk1").innerHTML = svg;
  document.getElementById("icoon").innerHTML = svg.replace('rx="12"', 'rx="0"');
  document.getElementById("woord").outerHTML = woord;
}, [LOGO_SVG, WOORDMERK_SVG]);
await page.evaluate(() => document.fonts.ready);
await page.locator("#deel").screenshot({ path: join(root, "public/deelafbeelding.png") });
await page.locator("#icoon").screenshot({ path: join(root, "public/apple-touch-icon.png") });
await browser.close();
server.close();
console.log("public/deelafbeelding.png en public/apple-touch-icon.png gemaakt.");
