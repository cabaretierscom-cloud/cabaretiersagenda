// Bouwt de site naar dist/: `npm run build`.
// Alleen speeldata vanaf vandaag komen op de site; oudere blijven in data/ als archief.
import { mkdirSync, rmSync, writeFileSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadData } from "./src/data.mjs";
import { createTemplates, SITE, LOGO_SVG } from "./src/templates.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "dist");
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
  writeFileSync(file, html);
  if (!path.endsWith(".html")) pages.push(path);
};

write("/", t.home());
write("/agenda/", t.agendaIndex());
for (const m of t.maanden) write(`/agenda/${m}/`, t.agendaMaand(m));
write("/plaatsen/", t.plaatsIndex());
for (const p of t.plaatsen) write(`/plaatsen/${t.plaatsId(p)}/`, t.plaatsPagina(p));
write("/artiesten/", t.artistIndex());
// Alleen artiesten en zalen met aankomende voorstellingen krijgen een pagina.
for (const a of db.artiesten.values()) if (db.gigsForArtist(a.id).length) write(`/artiesten/${a.id}/`, t.artistPage(a));
write("/theaters/", t.theaterIndex());
for (const th of db.theaters.values()) if (db.gigsForTheater(th.id).length) write(`/theaters/${th.id}/`, t.theaterPage(th));
write("/over/", t.about());
write("/404.html", t.notFound());

writeFileSync(join(out, "logo.svg"), LOGO_SVG);
writeFileSync(join(out, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages.map((p) => `  <url><loc>${SITE.url}${p}</loc><lastmod>${today}</lastmod></url>`).join("\n") +
  `\n</urlset>\n`);
writeFileSync(join(out, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);

console.log(`Gebouwd op ${today}: ${pages.length} pagina's, ${db.upcoming.length} aankomende speeldata.`);
