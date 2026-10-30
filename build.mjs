// Bouwt de site naar dist/: `npm run build`.
// Alleen speeldata vanaf vandaag komen op de site; oudere blijven in data/ als archief.
import { mkdirSync, rmSync, writeFileSync, cpSync, readFileSync, existsSync, readdirSync } from "node:fs";
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
// In de voorbeeldversie zit elke artiestfoto in de pagina zelf, zodat er geen losse bestanden bij komen.
const fotosInPagina = (html) => html.replace(/src="(\/fotos\/[^"]+\.jpg)"/g, (_, f) =>
  `src="data:image/jpeg;base64,${readFileSync(join(root, "public", f)).toString("base64")}"`);
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
  writeFileSync(file, VOORBEELD ? relatief(fotosInPagina(html), path) : html);
  if (!path.endsWith(".html")) pages.push(path);
};

write("/", t.home());
write("/agenda/", t.agendaIndex());
// .js in plaats van .json: de server verstuurt javascript ingepakt (brotli), JSON niet. De inhoud is JSON.
writeFileSync(join(out, "agenda", "alles.js"), JSON.stringify(t.agendaData()));
write("/vanavond/", t.dagPagina("vanavond"));
write("/dit-weekend/", t.dagPagina("dit-weekend"));
// Steden met genoeg aanbod (zie stadPaginas); verdwijnt een pagina, dan stuurt .htaccess door naar de plaats.
for (const [p, soorten] of t.stadPaginas) for (const s of soorten) write(`/plaatsen/${t.plaatsId(p)}/${s}/`, t.dagPagina(s, p));
for (const m of t.maanden) write(`/agenda/${t.maandId(m)}/`, t.agendaMaand(m));
write("/plaatsen/", t.plaatsIndex());
for (const p of t.plaatsen) write(`/plaatsen/${t.plaatsId(p)}/`, t.plaatsPagina(p));
write("/artiesten/", t.artistIndex());
// SEO-pagina's over cabaretiers; niet in het menu, wel gelinkt vanuit artiesten, footer en artiestpagina's.
write("/alle-cabaretiers/", t.cabaretiersPagina("alle"));
write("/alle-cabaretiers/vrouwen/", t.cabaretiersPagina("vrouw"));
write("/alle-cabaretiers/mannen/", t.cabaretiersPagina("man"));
// Alleen artiesten en zalen met aankomende voorstellingen krijgen een pagina.
// Festivalnamen in artiesten.json (zie festivals.json) niet: die staan onder /festivals/ (doorverwijzing hieronder).
for (const a of db.artiesten.values()) if (!t.festivalVan.has(a.id) && db.gigsForArtist(a.id).length) write(`/artiesten/${a.id}/`, t.artistPage(a));
// Elke voorstelling met een eigen titel: /artiesten/<artiest>/<voorstelling>/.
for (const [vid, pad] of t.voorstellingPaden) write(pad, t.voorstellingPagina(vid));
write("/theaters/", t.theaterIndex());
write("/comedy-clubs/", t.comedyclubsPagina());
for (const th of db.theaters.values()) if (db.gigsForTheater(th.id).length) write(`/theaters/${th.id}/`, t.theaterPage(th));
write("/genres/", t.genreIndex());
for (const g of t.GENRE_PAGINAS) write(`/genres/${g}/`, t.genrePagina(g));
write("/festivals/", t.festivalIndex());
for (const f of db.festivals.values()) write(`/festivals/${f.id}/`, t.festivalPagina(f));
write("/over/", t.about());
write("/privacy/", t.privacy());
write("/404.html", t.notFound());
// Controlepagina (niet in het menu en niet in de sitemap): uit data/rapport.json en data/ophaal-log.json.
{
  const lees = (f) => (existsSync(join(root, "data", f)) ? JSON.parse(readFileSync(join(root, "data", f), "utf8")) : {});
  const bronDir = join(root, "data", "bronnen");
  const vanTheaterbron = new Set(readdirSync(bronDir).filter((f) => f.endsWith(".json")).flatMap((f) => (JSON.parse(readFileSync(join(bronDir, f), "utf8")).theaters || []).map((th) => th.id)));
  const alleenSpeellijst = [...db.theaters.values()].filter((th) => !vanTheaterbron.has(th.id))
    .sort((a, b) => a.plaats.localeCompare(b.plaats, "nl") || a.naam.localeCompare(b.naam, "nl"));
  write("/controle/", t.controlePagina({ rapport: lees("rapport.json"), log: lees("ophaal-log.json"), alleenSpeellijst }));
  pages.pop(); // niet in de sitemap
}

writeFileSync(join(out, "logo.svg"), LOGO_SVG);
if (VOORBEELD) {
  const css = join(out, "style.css");
  writeFileSync(css, readFileSync(css, "utf8").replace(/url\("\/fonts\//g, 'url("fonts/'));
}
writeFileSync(join(out, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages.map((p) => `  <url><loc>${SITE.url}${p}</loc><lastmod>${today}</lastmod></url>`).join("\n") +
  `\n</urlset>\n`);
// Doorverwijzingen (301) van de oude WordPress-adressen: /<naam>/ -> /artiesten/<naam>/ als die pagina
// er is, anders naar de homepage (data/oude-adressen.json). Ook elke artiest met een pagina krijgt zo'n
// kort adres, zolang dat geen bestaande pagina is. Elke nacht opnieuw, dus altijd naar een bestaande pagina.
{
  const bestaat = new Set(pages);
  const oud = JSON.parse(readFileSync(join(root, "data", "oude-adressen.json"), "utf8")).adressen;
  const doel = new Map();
  for (const p of pages) {
    const m = p.match(/^\/artiesten\/([^/]+)\/$/);
    if (m && !bestaat.has(`/${m[1]}/`)) doel.set(`/${m[1]}/`, p);
  }
  // Een festival dat als artiest in de gegevens staat: het korte adres gaat naar de festivalpagina.
  for (const [id, f] of t.festivalVan) if (!bestaat.has(`/${id}/`)) doel.set(`/${id}/`, `/festivals/${f}/`);
  for (const a of oud) if (!bestaat.has(a) && !doel.has(a)) doel.set(a, bestaat.has(`/artiesten${a}`) ? `/artiesten${a}` : "/");
  const regels = [...doel].sort().map(([van, naar]) =>
    `RedirectMatch 301 ^${van.replace(/\/$/, "").replace(/[.+?^$()[\]{}|\\]/g, "\\$&")}/?$ ${SITE.url}${naar}`);
  // /artiesten/<festival>/ en alles daaronder (oude voorstellingspagina's) -> /festivals/<festival>/.
  for (const [id, f] of [...t.festivalVan].sort()) regels.push(`RedirectMatch 301 ^/artiesten/${id.replace(/[.+?^$()[\]{}|\\]/g, "\\$&")}(/.*)?$ ${SITE.url}/festivals/${f}/`);
  const ht = join(out, ".htaccess");
  writeFileSync(ht, readFileSync(ht, "utf8") + `\n# Oude adressen (gemaakt door build.mjs, niet met de hand aanpassen)\n<IfModule mod_alias.c>\n${regels.join("\n")}\n</IfModule>\n`);
}
writeFileSync(join(out, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /controle/\nSitemap: ${SITE.url}/sitemap.xml\n`);

console.log(`Gebouwd op ${today}: ${pages.length} pagina's, ${db.upcoming.length} aankomende speeldata.`);
