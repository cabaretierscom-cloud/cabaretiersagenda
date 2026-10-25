// Maakt de favicons in public/ uit het beeldmerk (LOGO_SVG): favicon.ico (16, 32 en 48 px) en
// icon-192.png en icon-512.png. Google toont in de zoekresultaten bij voorkeur een icoon van
// een veelvoud van 48 px; /favicon.ico vragen browsers en zoekmachines ook zonder link op.
// Gebruik: PLAYWRIGHT=$(npm root -g)/playwright/index.mjs node scripts/favicons.mjs
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { LOGO_SVG } from "../src/templates.mjs";

const pub = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const { chromium } = await import(process.env.PLAYWRIGHT || "playwright");
const browser = await chromium.launch();
const page = await browser.newPage();
const png = async (px) => {
  await page.setViewportSize({ width: px, height: px });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${px}px;height:${px}px}</style>${LOGO_SVG}`);
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: px, height: px } });
};
const ico = [16, 32, 48];
const beelden = [];
for (const px of ico) beelden.push(await png(px));
// ICO-bestand met PNG-afbeeldingen erin (zo kan het sinds Windows Vista; alle browsers lezen het).
const kop = Buffer.alloc(6 + 16 * ico.length);
kop.writeUInt16LE(0, 0); kop.writeUInt16LE(1, 2); kop.writeUInt16LE(ico.length, 4);
let plek = kop.length;
ico.forEach((px, i) => {
  const o = 6 + 16 * i;
  kop.writeUInt8(px, o); kop.writeUInt8(px, o + 1); kop.writeUInt16LE(1, o + 4); kop.writeUInt16LE(32, o + 6);
  kop.writeUInt32LE(beelden[i].length, o + 8); kop.writeUInt32LE(plek, o + 12);
  plek += beelden[i].length;
});
writeFileSync(join(pub, "favicon.ico"), Buffer.concat([kop, ...beelden]));
for (const px of [192, 512]) writeFileSync(join(pub, `icon-${px}.png`), await png(px));
await browser.close();
console.log("favicon.ico, icon-192.png en icon-512.png gemaakt in public/.");
