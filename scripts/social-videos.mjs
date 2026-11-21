// Maakt staande video's (1080x1920, 30 beelden per seconde, zonder geluid) voor TikTok, YouTube Shorts en
// Instagram Reels: de affiches van "Nu in het theater", per impresariaat, hooguit 5 per video. Ze komen
// per platform in ontwerp/social/<datum>/videos/<platform>/ (tiktok, instagram, youtube), elk met de vrije ruimte
// van dat platform (zie video.html) en een teksten.md (YouTube: titel en beschrijving; TikTok en Instagram: bijschrift).
// De carrousels in dezelfde datummap blijven staan.
// Daarnaast "vol": het hele beeld, zonder vrije randen (alleen op verzoek).
// Gebruik: node scripts/social-videos.mjs [tiktok,instagram,youtube,vol]  (Playwright en ffmpeg moeten beschikbaar zijn)
// BUILD_DATE=JJJJ-MM-DD kiest de dag, zoals bij de build. Muziek kies je zelf in de app.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { loadData } from "../src/data.mjs";
import { createTemplates, LOGO_OMGEKEERD_SVG, slugVan } from "../src/templates.mjs";
import { WOORDMERK_SVG } from "../src/woordmerk.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const today = process.env.BUILD_DATE || new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
const FORMATEN = (process.argv[2] || "tiktok,instagram,youtube").split(",");
// Playwright is CommonJS: via een pad (PLAYWRIGHT=/pad/naar/playwright/index.js) zit chromium onder default.
const playwright = await import(process.env.PLAYWRIGHT || "playwright");
const chromium = playwright.chromium || playwright.default.chromium;

const db = loadData(join(root, "data"), { today });
const videos = createTemplates(db).socialVideos(5);

// Tijden in seconden: opening, per affiche (waarvan het verschuiven), slot.
const FPS = 30, INTRO = 1.2, PER = 3, SCHUIF = 0.8, SLOT = 2.6;

const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url);
  const pad = url === "/" ? join(root, "ontwerp/social/video.html") : url.startsWith("/social/") ? join(root, "ontwerp", url) : join(root, "public", url);
  try { res.end(readFileSync(pad)); } catch { res.statusCode = 404; res.end(); }
}).listen(0);

const browser = await chromium.launch();
// 720x1280 CSS-pixels op 1,5x is 1080x1920; zo breed gelden de mobiele CSS-regels van de site niet.
const page = await browser.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1.5 });
await page.goto(`http://localhost:${server.address().port}/`);

const PLATFORM = { tiktok: "TikTok", instagram: "Instagram Reels", youtube: "YouTube Shorts", vol: "Volledig beeld" };
for (const formaat of FORMATEN) {
  const uit = join(root, "ontwerp/social", today, "videos", formaat);
  rmSync(uit, { recursive: true, force: true });
  mkdirSync(uit, { recursive: true });
  const teksten = [`# ${PLATFORM[formaat]}: video's ${today}`, "", formaat === "youtube"
    ? "Per video een titel en beschrijving. Muziek kies je zelf bij het uploaden."
    : "Per video een bijschrift. Muziek kies je zelf in de app.", ""];
  const perBureau = {};
  for (const video of videos) {
    const nr = (perBureau[video.van] = (perBureau[video.van] || 0) + 1);
    const naam = `${slugVan(video.van)}-${nr}.mp4`;
    await page.evaluate(([v, merk, woord, f]) => window.vul(v, merk, woord, f), [video, LOGO_OMGEKEERD_SVG, WOORDMERK_SVG, formaat]);
    await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map((i) => i.decode().catch(() => {}))]));

    const duur = INTRO + video.affiches.length * PER + SLOT;
    const ffmpeg = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
      "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", join(uit, naam)]);
    const klaar = new Promise((ok, fout) => ffmpeg.on("close", (c) => (c ? fout(new Error(`ffmpeg stopte met code ${c}`)) : ok())));
    for (let f = 0; f < Math.round(duur * FPS); f++) {
      await page.evaluate(([t, tijden]) => window.zet(t, tijden), [f / FPS, { INTRO, PER, SCHUIF, SLOT }]);
      const beeld = await page.screenshot({ type: "jpeg", quality: 92 });
      if (!ffmpeg.stdin.write(beeld)) await new Promise((ok) => ffmpeg.stdin.once("drain", ok));
    }
    ffmpeg.stdin.end();
    await klaar;

    const lijst = `${video.affiches.map((a) => `${a.artiest} met ${a.titel}`).join(", ")}`;
    if (formaat === "youtube") {
      // YouTube-titels zijn hooguit 100 tekens.
      const namen = video.affiches.map((a) => a.artiest);
      let titel = `Nu in het theater: ${namen.join(", ")}`;
      if (titel.length > 90) titel = `Nu in het theater: ${namen.slice(0, 3).join(", ")} en meer`;
      teksten.push(`## ${naam}`, "", `**Titel:** ${titel} #Shorts`, "",
        `**Beschrijving:** Nu in het theater: ${lijst}. Alle speeldata en kaarten op cabaretiers.com.`, "",
        "#cabaret #comedy #theater #cabaretiers", "");
    } else {
      // Op Instagram is een link in het bijschrift niet klikbaar: verwijs naar de link in de bio.
      const site = formaat === "instagram" ? "Alle speeldata en kaarten: link in bio (cabaretiers.com)." : "Alle speeldata en kaarten op cabaretiers.com.";
      teksten.push(`## ${naam}`, "", `Nu in het theater: ${lijst}. ${site}`, "",
        "#cabaret #comedy #theater #cabaretiers #nuinhettheater", "");
    }
    console.log(`${formaat}/${naam}: ${video.affiches.length} affiches, ${duur.toFixed(1)} s`);
  }
  writeFileSync(join(uit, "teksten.md"), teksten.join("\n"));
}
await browser.close();
server.close();
console.log(`${videos.length} video's per platform in ontwerp/social/${today}/videos/.`);
