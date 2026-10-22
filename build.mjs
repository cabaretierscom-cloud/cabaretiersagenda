// Bouwt de site naar dist/: `npm run build`.
// Alleen speeldata vanaf vandaag komen op de site; oudere blijven in data/ als archief.
import { mkdirSync, rmSync, writeFileSync, cpSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadData } from "./src/data.mjs";
import { createTemplates, SITE, LOGO_SVG } from "./src/templates.mjs";

const root = dirname(fileURLToPath(import.meta.url));
// VOORBEELD=1 bouwt een versie met relatieve links naar dist-voorbeeld/, om de site zonder
// eigen domein te bekijken (bijv. als artifact). De gewone build gaat naar dist/.
const VOORBEELD = process.env.VOORBEELD === "1";
const out = join(root, VOORBEELD ? "dist-voorbeeld" : "dist");

// "/agenda/" vanaf /artiesten/x/ wordt "../../agenda/index.html".
function relatief(html, pad) {
  const diepte = pad.endsWith(".html") ? pad.split("/").length - 2 : pad.split("/").filter(Boolean).length;
  const terug = "../".repeat(diepte);
  return html.replace(/(href|src)="\/(?!\/)([^"#?]*)([#?][^"]*)?"/g, (_, attr, p, rest = "") => {
    const doel = !p || p.endsWith("/") ? `${p}index.html` : p;
    return `${attr}="${terug}${doel}${rest}"`;
  });
}
// BUILD_DATE=2026-11-01 npm run build bouwt de site zoals die op die dag zou zijn.
const today = process.env.BUILD_DATE || new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });

let db;
try {
  db = loadData(join(root, "data"), { today });
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
const t = createTemplates(db);

rmSync(out, { recursive: true, force: true });
cpSync(join(root, "public"), out, { recursive: true });

const pages = [];
const write = (path, html) => {
  const file = path.endsWith(".html") ? join(out, path) : join(out, path, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, VOORBEELD ? relatief(html, path) : html);
  if (!path.endsWith(".html")) pages.push(path);
};

write("/", t.home());
write("/agenda/", t.agendaIndex());
for (const m of t.maanden) write(`/agenda/${t.maandId(m)}/`, t.agendaMaand(m));
write("/plaatsen/", t.plaatsIndex());
for (const p of t.plaatsen) write(`/plaatsen/${t.plaatsId(p)}/`, t.plaatsPagina(p));
write("/artiesten/", t.artistIndex());
// Alleen artiesten en zalen met aankomende voorstellingen krijgen een pagina.
for (const a of db.artiesten.values()) if (db.gigsForArtist(a.id).length) write(`/artiesten/${a.id}/`, t.artistPage(a));
// Elke voorstelling met een eigen titel: /artiesten/<artiest>/<voorstelling>/.
for (const [vid, pad] of t.voorstellingPaden) write(pad, t.voorstellingPagina(vid));
write("/theaters/", t.theaterIndex());
for (const th of db.theaters.values()) if (db.gigsForTheater(th.id).length) write(`/theaters/${th.id}/`, t.theaterPage(th));
write("/over/", t.about());
write("/404.html", t.notFound());

writeFileSync(join(out, "logo.svg"), LOGO_SVG);
if (VOORBEELD) {
  const css = join(out, "style.css");
  writeFileSync(css, readFileSync(css, "utf8").replace(/url\("\/fonts\//g, 'url("fonts/'));
}
writeFileSync(join(out, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages.map((p) => `  <url><loc>${SITE.url}${p}</loc><lastmod>${today}</lastmod></url>`).join("\n") +
  `\n</urlset>\n`);
writeFileSync(join(out, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);

console.log(`Gebouwd op ${today}: ${pages.length} pagina's, ${db.upcoming.length} aankomende speeldata.`);
