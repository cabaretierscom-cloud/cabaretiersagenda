// Bouwt de site naar dist/: `npm run build`.
// Alleen speeldata vanaf vandaag komen op de site; oudere blijven in data/ als archief.
import { mkdirSync, rmSync, writeFileSync, cpSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
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
// Bezoekerscijfers (data/ga-dashboard.json, niet in de repository): voor /dashboard/ en de volgorde van
// "Nu in het theater" (meest bekeken artiesten eerst). Zonder bestand: de gewone volgorde.
const gaBestand = join(root, "data", "ga-dashboard.json");
const ga = existsSync(gaBestand) ? JSON.parse(readFileSync(gaBestand, "utf8")) : null;
const t = createTemplates(db, { ga });

rmSync(out, { recursive: true, force: true });
cpSync(join(root, "public"), out, { recursive: true });

// Datum van de laatste inhoudelijke wijziging per pagina (sitemap <lastmod> en dateModified in de JSON-LD), niet de
// datum van de build: anders staat elke pagina elke nacht op "vandaag" en negeert Google het veld. Per pagina een
// vingerafdruk van wat er inhoudelijk op staat (titel, description, <main> en de gestructureerde gegevens; niet de kop en
// de voet, die op alle pagina's tegelijk veranderen). Verandert die, dan wordt de datum vandaag. data/pagina-datums.json
// gaat 's nachts mee met de andere gegevens (bijwerken.yml), zodat de datums blijven staan. Zie CLAUDE.md.
const DATUMS = join(root, "data", "pagina-datums.json");
const vorigeDatums = existsSync(DATUMS) ? JSON.parse(readFileSync(DATUMS, "utf8")) : {};
const nieuweDatums = {};
const inhoud = (html) => [
  html.match(/<title>[\s\S]*?<\/title>/)?.[0],
  html.match(/<meta name="description"[^>]*>/)?.[0],
  html.match(/<main[\s\S]*<\/main>/)?.[0],
  ...html.matchAll(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g).map((m) => m[0]),
].join("\n").replace(/([?&])v=[\w.-]+/g, "$1v=");
const gewijzigd = (path, html) => {
  const vingerafdruk = createHash("sha1").update(inhoud(html)).digest("base64url").slice(0, 16);
  const vorig = vorigeDatums[path];
  const datum = vorig && vorig[0] === vingerafdruk ? vorig[1] : today;
  nieuweDatums[path] = [vingerafdruk, datum];
  return datum;
};

const pages = [];
const write = (path, html) => {
  const file = path.endsWith(".html") ? join(out, path) : join(out, path, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  html = html.replaceAll("__DATUM_GEWIJZIGD__", path.endsWith(".html") ? today : gewijzigd(path, html));
  writeFileSync(file, VOORBEELD ? relatief(fotosInPagina(html), path) : html);
  // Elke pagina één keer in de sitemap (een dubbel adres overschrijft een andere pagina; src/data.mjs bewaakt dat).
  if (!path.endsWith(".html") && !pages.includes(path)) pages.push(path);
  // Het hoofdbeeld van de pagina (og:image, niet het algemene deelbeeld) met alt-tekst voor de beeldensitemap.
  const beeld = html.match(/<meta property="og:image" content="([^"]+)">/)?.[1];
  if (beeld && !beeld.endsWith("/deelafbeelding.png")) beelden.set(path, beeld);
};
const beelden = new Map();

write("/", t.home());
write("/agenda/", t.agendaIndex());
// .js in plaats van .json: de server verstuurt javascript ingepakt (brotli), JSON niet. De inhoud is JSON.
writeFileSync(join(out, "agenda", "alles.js"), JSON.stringify(t.agendaData()));
// Postcodes met coördinaten voor zoeken op postcode op /in-de-buurt/ (data/postcodes.json, GeoNames); ook als .js.
mkdirSync(join(out, "in-de-buurt"), { recursive: true });
writeFileSync(join(out, "in-de-buurt", "postcodes.js"), readFileSync(new URL("./data/postcodes.json", import.meta.url), "utf8"));
write("/vanavond/", t.dagPagina("vanavond"));
write("/dit-weekend/", t.dagPagina("dit-weekend"));
for (const m of t.maanden) write(`/agenda/${t.maandId(m)}/`, t.agendaMaand(m));
write("/plaatsen/", t.plaatsIndex());
// Bij mij in de buurt: zoeken op afstand (locatie of plaats), in de browser.
write("/in-de-buurt/", t.inDeBuurtPagina());
for (const p of t.plaatsen) write(t.plaatsPad(p), t.plaatsPagina(p));
for (const p of ["Utrecht", "Bergeijk"]) for (const v of ["b", "c"]) write(`/voorstel-${v}${t.plaatsPad(p)}`, t.plaatsPagina(p, v));
write("/artiesten/", t.artistIndex());
// SEO-pagina's over cabaretiers; niet in het menu, wel gelinkt vanuit artiesten, footer en artiestpagina's.
write("/alle-cabaretiers/", t.cabaretiersPagina("alle"));
write("/alle-cabaretiers/vrouwen/", t.cabaretiersPagina("vrouw"));
write("/alle-cabaretiers/mannen/", t.cabaretiersPagina("man"));
// Alleen artiesten en zalen met aankomende voorstellingen krijgen een pagina.
// Festivalnamen in artiesten.json (zie festivals.json) niet: die staan onder /festivals/ (doorverwijzing hieronder).
// Ook een artiest zonder voorstellingen met nietOpTournee (uitleg met bronnen, zoals Stefano Keizers) krijgt een pagina.
for (const a of db.artiesten.values()) if (!t.festivalVan.has(a.id) && (db.gigsForArtist(a.id).length || a.nietOpTournee)) write(`/artiesten/${a.id}/`, t.artistPage(a));
// Elke voorstelling met een eigen titel: /artiesten/<artiest>/<voorstelling>/.
for (const [vid, pad] of t.voorstellingPaden) write(pad, t.voorstellingPagina(vid));
write("/theaters/", t.theaterIndex());
write("/comedy-clubs/", t.comedyclubsPagina());
for (const th of db.theaters.values()) if (db.gigsForTheater(th.id).length) write(`/theaters/${th.id}/`, t.theaterPage(th));
for (const g of t.GENRE_PAGINAS) write(t.genrePad(g), t.genrePagina(g));
if (t.tryoutLijst.length) write("/agenda/try-outs/", t.tryoutPagina());
if (t.premiereLijst.length) write("/agenda/premieres/", t.premierePagina());
for (const [g, p] of t.genrePlaatsPaginas) write(t.genrePlaatsPad(g, p), t.genrePlaatsPagina(g, p));
write("/festivals/", t.festivalIndex());
for (const f of db.festivals.values()) write(`/festivals/${f.id}/`, t.festivalPagina(f));
// Nieuws: "Net binnen" (automatisch uit de agenda) en de tijdlijn, plus een pagina per bericht (data/nieuws.json).
write("/nieuws/", t.nieuwsPagina());
for (const n of db.nieuws) write(`/nieuws/${n.id}/`, t.nieuwsBericht(n));
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

// Dashboard met cijfers uit Google Analytics (zoals /controle/: niet in menu, sitemap of zoekmachines).
// data/ga-dashboard.json staat niet in de repository (openbaar); `npm run ga -- dashboard` maakt het.
{
  // Eén pagina per periode: /dashboard/ (laatste 28 dagen) en /dashboard/<maand-jaar>/.
  for (const id of ga?.perioden?.length ? ga.perioden.map((p) => p.id) : [""]) {
    write(t.dashboardPad(id), t.dashboardPagina(ga, id));
    pages.pop(); // niet in de sitemap
  }
}

writeFileSync(join(out, "logo.svg"), LOGO_SVG);
if (VOORBEELD) {
  const css = join(out, "style.css");
  writeFileSync(css, readFileSync(css, "utf8").replace(/url\("\/fonts\//g, 'url("fonts/'));
}
writeFileSync(join(out, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
  pages.map((p) => `  <url><loc>${SITE.url}${p}</loc><lastmod>${nieuweDatums[p]?.[1] || today}</lastmod>${beelden.has(p) ? `<image:image><image:loc>${beelden.get(p)}</image:loc></image:image>` : ""}</url>`).join("\n") +
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
  // Een theater met een nieuw id (comedytrain-nieuwe-toomler-amsterdam -> comedytrain): het oude adres gaat mee.
  for (const th of db.theaters.values()) for (const o of th.oudeIds || []) regels.push(`RedirectMatch 301 ^/theaters/${o.replace(/[.+?^$()[\]{}|\\]/g, "\\$&")}/?$ ${SITE.url}/theaters/${th.id}/`);
  const ht = join(out, ".htaccess");
  writeFileSync(ht, readFileSync(ht, "utf8") + `\n# Oude adressen (gemaakt door build.mjs, niet met de hand aanpassen)\n<IfModule mod_alias.c>\n${regels.join("\n")}\n</IfModule>\n`);
}
writeFileSync(join(out, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /controle/\nDisallow: /dashboard/\nSitemap: ${SITE.url}/sitemap.xml\n`);

// Alleen pagina's die nu bestaan; met de voorbeeldversie (VOORBEELD=1) niets wegschrijven.
if (!VOORBEELD) writeFileSync(DATUMS, JSON.stringify(Object.fromEntries(Object.entries(nieuweDatums).sort()), null, 0).replace(/\],"/g, '],\n"') + "\n");
console.log(`Gebouwd op ${today}: ${pages.length} pagina's, ${db.upcoming.length} aankomende speeldata.`);
