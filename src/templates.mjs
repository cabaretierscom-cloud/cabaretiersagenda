// HTML-templates. Elke functie geeft een string terug; build.mjs schrijft ze weg.
import { LANDEN, STATUSSEN, GENRES, KLEUREN, FESTIVALSOORTEN, isGroep, genreLabel, voorstellingSleutel } from "./data.mjs";
import { fmt, esc, plural, isoWithOffset } from "./format.mjs";
import { WOORDMERK_SVG, C_PAD, C_KADER } from "./woordmerk.mjs";
import { readFileSync } from "node:fs";
import { KAART, PROVINCIES, MEREN } from "./kaart.mjs";
import { createHash } from "node:crypto";

// Versienummer per bestand (stukje van de inhoud-hash): verandert de opmaak of het script, dan
// verandert het adres en halen browsers meteen de nieuwe versie op, ondanks de browsercache.
const VERSIE = Object.fromEntries(["style.css", "agenda.js", "cookies.js"].map((f) =>
  [f, createHash("sha1").update(readFileSync(new URL(`../public/${f}`, import.meta.url))).digest("hex").slice(0, 8)]));

// Webadres-vriendelijke tekst: "Gelukkig heb je mij nog!" -> "gelukkig-heb-je-mij-nog".
export const slugVan = (s) =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " en ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Maand in het webadres: "2026-10" -> "oktober-2026".
export const maandId = (m) => `${fmt.monthYear(m + "-01").replace(" ", "-")}`;

// Webadres-vriendelijke naam van een plaats: "Den Haag" -> "den-haag".
export const plaatsId = (p) =>
  String(p).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// Webadres van een plaatspagina: "Den Haag" -> "/theaters-in-den-haag/" (vroeger /plaatsen/den-haag/; .htaccess stuurt door).
export const plaatsPad = (p) => `/theaters-in-${plaatsId(p)}/`;

export const SITE = {
  name: "Cabaretiers.com",
  url: "https://www.cabaretiers.com",
  email: "hallo@cabaretiers.com",
  // Google Analytics 4; laadt pas na toestemming via de cookiemelding (public/cookies.js).
  analytics: "G-MWXCPP6KM0",
  description: "De theateragenda van Nederland en België: alle aankomende cabaret- en comedyvoorstellingen, theaters en artiesten op één plek.",
  // Sociale media: icoon in de footer en sameAs in de gestructureerde gegevens van de organisatie.
  social: [
    { naam: "Instagram", url: "https://www.instagram.com/cabaretiers.comedy/", icoon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>' },
    { naam: "Facebook", url: "https://www.facebook.com/profile.php?id=61595656450246", icoon: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8z"/></svg>' },
    { naam: "YouTube", url: "https://www.youtube.com/@cabaretiers", icoon: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M2.5 7.2c.2-1.5 1.3-2.5 2.8-2.6C7.4 4.4 9.7 4.3 12 4.3s4.6.1 6.7.3c1.5.1 2.6 1.1 2.8 2.6.2 1.6.3 3.2.3 4.8s-.1 3.2-.3 4.8c-.2 1.5-1.3 2.5-2.8 2.6-2.1.2-4.4.3-6.7.3s-4.6-.1-6.7-.3c-1.5-.1-2.6-1.1-2.8-2.6-.2-1.6-.3-3.2-.3-4.8s.1-3.2.3-4.8zM10 8.8v6.4l5.5-3.2z"/></svg>' },
    { naam: "TikTok", url: "https://www.tiktok.com/@cabaretiers.com", icoon: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 3c.3 2.3 1.7 3.9 4 4.1v3.3c-1.5.1-2.8-.4-4-1.2v6.2c0 3.6-2.6 6.1-6 6.1s-6.1-2.5-6.1-5.9c0-3.5 2.9-6 6.6-5.6v3.4c-1.7-.4-3.2.6-3.2 2.2 0 1.4 1.1 2.4 2.5 2.4 1.5 0 2.6-1 2.6-2.8V3z"/></svg>' },
  ],
};

const ICON = {
  pin: '<svg class="ic-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  sold: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M6 18L18 6"/></svg>',
  doubt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.01"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
  // Pijl naar rechtsboven: de link gaat naar een andere website.
  extern: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>',
};

// Beeldmerk (logo-ontwerp 15): de kleine c uit het woordmerklettertype in vier inktkleuren, met schuine
// grenzen zoals de G van Google: oranje boven, roze op de uithaal, groen onder, geel links.
// LOGO_SVG staat op een zwart vlak (kop, tabbladicoontje, app-icoon); LOGO_OMGEKEERD_SVG is zonder vlak
// en dient voor de zwarte footer.
function beeldmerk({ vlak, id }) {
  const [x0, y0, x1, y1] = C_KADER, h = vlak ? 27.8 : 34, s = h / (y1 - y0), w = (x1 - x0) * s;
  const t = `translate(${(24 - ((x0 + x1) / 2) * s).toFixed(2)} ${(24 - ((y0 + y1) / 2) * s).toFixed(2)}) scale(${s.toFixed(5)})`;
  // Taartpunten vanuit het midden; de hoeken gelden voor een rond gemaakte c (horizontaal geschaald).
  const punt = (a, b) => {
    const p = [[24, 24]];
    for (let g = a; g < b; g += 5) p.push([24 + 100 * Math.cos(g * Math.PI / 180), 24 + 100 * Math.sin(g * Math.PI / 180)]);
    p.push([24 + 100 * Math.cos(b * Math.PI / 180), 24 + 100 * Math.sin(b * Math.PI / 180)]);
    return p.map((q) => q.map((v) => v.toFixed(1)).join(",")).join(" ");
  };
  const vlakken = [["#FF6A13", -140, 10], ["#FF4FA3", 10, 58], ["#B8E04A", 58, 140], ["#FFD23F", 140, 220]];
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${vlak ? `<rect width="48" height="48" rx="11.5" fill="${vlak}"/>` : ""}<defs><clipPath id="${id}"><path transform="${t}" d="${C_PAD}"/></clipPath></defs><g clip-path="url(#${id})"><g transform="translate(24 24) scale(${(w / h).toFixed(4)} 1) translate(-24 -24)">${vlakken.map(([k, a, b]) => `<polygon points="${punt(a, b)}" fill="${k}"/>`).join("")}</g></g></svg>`;
}
export const LOGO_SVG = beeldmerk({ vlak: "#121212", id: "beeldmerk-c" });
export const LOGO_OMGEKEERD_SVG = beeldmerk({ vlak: null, id: "beeldmerk-c-voet" });

const ink = (kleur) => {
  const [v, fg] = KLEUREN[kleur];
  return `--bg:var(${v});--fg:${fg}`;
};

// Affiches in een rij nooit twee keer dezelfde kleur naast elkaar. Eerst de volgorde iets
// verschuiven (de eerstvolgende met een andere kleur gaat voor); lukt dat niet, of moet de volgorde
// vast blijven (schuiven: false), dan krijgt die affiche een andere kleur dan zijn buren.
// Geeft [{ x, kleur }] terug.
function afwisselend(items, kleurVan, { schuiven = true } = {}) {
  const rest = [...items], uit = [];
  while (rest.length) {
    const vorige = uit.at(-1)?.kleur;
    const i = schuiven ? Math.max(0, rest.findIndex((x) => kleurVan(x) !== vorige)) : 0;
    const [x] = rest.splice(i, 1);
    uit.push({ x, kleur: kleurVan(x) });
  }
  uit.forEach((u, i) => {
    const buren = [uit[i - 1]?.kleur, uit[i + 1]?.kleur];
    if (buren[0] === u.kleur) u.kleur = Object.keys(KLEUREN).find((k) => k !== "zwart" && !buren.includes(k));
  });
  return uit;
}

// Een link naar een theater of artiest met een herkenbaar label, zodat zij in hun eigen statistieken
// zien dat de bezoeker via Cabaretiers.com komt. Een link die al utm-labels heeft, blijft zoals hij is.
export function metUtm(url) {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol) || u.searchParams.has("utm_source")) return url;
    u.searchParams.set("utm_source", "cabaretiers.com");
    u.searchParams.set("utm_medium", "referral");
    return u.toString();
  } catch { return url; }
}

export function createTemplates(db, { ga = null } = {}) {
  const { artiesten: A, theaters: T, voorstellingen: V } = db;
  // Festivalnamen staan ook als "artiest" in de gegevens (om voorstellingen aan het festival te koppelen,
  // zie festivals.json). Die krijgen geen artiestpagina: links gaan naar de festivalpagina.
  const festivalVan = new Map([...db.festivals.values()].flatMap((f) => (f.artiesten || []).map((a) => [a, f.id])));
  const isFestival = (id) => festivalVan.has(id);
  const artiestPad = (id) => (isFestival(id) ? `/festivals/${festivalVan.get(id)}/` : `/artiesten/${id}/`);

  // Voorstellingen zonder vaste artiest (clubavonden, open mics) tonen hun titel als naam.
  const artistNames = (vid) => V.get(vid).artiesten.map((a) => A.get(a).naam).join(" & ") || V.get(vid).titel;
  const leadInk = (vid) => A.get(V.get(vid).artiesten[0])?.kleur || "blauw";
  const artistLinks = (vid) =>
    V.get(vid).artiesten.map((a) => `<a href="${artiestPad(a)}">${esc(A.get(a).naam)}</a>`).join(" &amp; ") || esc(V.get(vid).titel);
  // Titel die alleen de artiestnaam herhaalt ("Dolf Jansen" van "Dolf Jansen") is geen echte titel.
  const echteTitel = (vid) => {
    const v = V.get(vid);
    const naam = v.artiesten.map((a) => A.get(a).naam).join(" & ");
    return v.artiesten.length && v.titel.toLowerCase() === naam.toLowerCase() ? null : v.titel;
  };
  // Elke voorstelling met een eigen titel krijgt een pagina onder haar (eerste) artiest:
  // /artiesten/richard-groenendijk/gelukkig-heb-je-mij-nog/. Niet voor festivals: die hebben hun eigen pagina.
  const voorstellingPad = new Map();
  {
    const bezet = new Set();
    const metData = new Set(db.upcoming.map((g) => g.voorstelling));
    for (const v of [...V.values()].sort((x, y) => x.id.localeCompare(y.id))) {
      if (!metData.has(v.id) || !v.artiesten.length || !echteTitel(v.id) || isFestival(v.artiesten[0])) continue;
      const basis = `/artiesten/${v.artiesten[0]}/${slugVan(v.titel) || "voorstelling"}`;
      let pad = basis, n = 2;
      while (bezet.has(pad)) pad = `${basis}-${n++}`;
      bezet.add(pad);
      voorstellingPad.set(v.id, pad + "/");
    }
  }
  const showLink = (vid, tekst) => voorstellingPad.has(vid) ? `<a href="${voorstellingPad.get(vid)}">${tekst}</a>` : tekst;

  // Vaste links onderaan elke pagina; een artiest of theater zonder aankomende voorstellingen valt weg.
  let footerHtml = null;
  const footerLinks = () => footerHtml ??= maakFooterLinks();
  const maakFooterLinks = () => {
  // Artiesten en theaters met de meeste vertoningen in Google (Search Console, uit data/ga-dashboard.json; elke
  // build bijgewerkt). Een artiest telt met de voorstellingspagina's eronder en het oude adres /<artiest>/.
  // Zonder cijfers, of als er te weinig zijn: de vaste lijst.
  const zoekRijen = ga?.zoekPaginas || (ga?.perioden?.[0]?.google || []).map((r) => ({ pagina: r.landingPagePlusQueryString, vertoningen: r.organicGoogleSearchImpressions }));
  const oudTheaterId = new Map([...T.values()].flatMap((t) => (t.oudeIds || []).map((o) => [o, t.id])));
  const meesteVertoningen = (soort, vast) => {
    const tel = new Map();
    for (const r of zoekRijen) {
      const d = String(r.pagina || "").split("?")[0].split("/").filter(Boolean);
      const id = soort === "artiest" ? (d[0] === "artiesten" ? d[1] : d.length === 1 ? d[0] : null) : d[0] === "theaters" ? d[1] : null;
      const nu = soort === "theater" && id ? oudTheaterId.get(id) || id : id;
      if (nu) tel.set(nu, (tel.get(nu) || 0) + (r.vertoningen || 0));
    }
    const ok = soort === "artiest" ? (id) => A.has(id) && !festivalVan.has(id) && db.gigsForArtist(id).length : (id) => T.has(id) && db.gigsForTheater(id).length;
    return [...new Set([...[...tel].sort((a, b) => b[1] - a[1]).map(([id]) => id), ...vast])].filter(ok).slice(0, 5);
  };
  const FOOTER_LINKS = [
    ["Artiesten", "/artiesten/", "Alle artiesten", meesteVertoningen("artiest", ["esther-van-der-voort", "roel-c-verburg", "richard-groenendijk", "theo-maassen", "plien-en-bianca"])
      .map((id) => [A.get(id).naam, `/artiesten/${id}/`])],
    ["Theaters", "/theaters/", "Alle theaters", meesteVertoningen("theater", ["kleine-komedie", "comedy-cafe-amsterdam", "stadsschouwburg-groningen", "parktheater-eindhoven", "stadsschouwburg-utrecht"])
      .map((id) => [T.get(id).naam, `/theaters/${id}/`])],
    ["Plaatsen", "/plaatsen/", "Alle plaatsen", ["Rotterdam", "Amsterdam", "Eindhoven", "Den Haag", "Utrecht"]
      .filter((p) => up.some((g) => T.get(g.theater).plaats === p)).map((p) => [p, plaatsPad(p)])],
    ["Genres", "/agenda/", "De hele agenda", GENRE_PAGINAS.slice(0, 5).map((g) => [GENRE_INFO[g].kop, `/agenda/${g}/`])],
  ];
  return `<nav class="footer-links" aria-label="Snel naar">${FOOTER_LINKS.map(([kop, pad, alle, links]) => `<div>
      <h2>${kop}</h2>
      <ul>${links.map(([naam, url]) => `<li><a href="${url}">${esc(naam)}</a></li>`).join("")}<li><a href="${pad}">${alle}</a></li></ul>
    </div>`).join("")}</nav>`;
  };

  function layout({ title, description = SITE.description, path, section, body, schema, noindex = false }) {
    const foto = schema?.foto?.foto;
    const nav = [
      ["agenda", "/agenda/", "Agenda"],
      ["artiesten", "/artiesten/", "Artiesten"],
      ["plaatsen", "/plaatsen/", "Plaatsen"],
      ["theaters", "/theaters/", "Theaters"],
      ["comedyclubs", "/comedy-clubs/", "Comedy Clubs"],
      ["festivals", "/festivals/", "Festivals"],
      ["nieuws", "/nieuws/", "Nieuws"],
    ].map(([key, href, label]) =>
      `<a href="${href}"${key === section ? ' aria-current="page"' : ""}>${label}</a>`).join("");
    // Lange titels zonder " | Cabaretiers.com", zodat het belangrijke deel in Google zichtbaar blijft.
    const fullTitle = title ? (`${title} | ${SITE.name}`.length > 62 ? title : `${title} | ${SITE.name}`) : `${SITE.name} | Agenda voor cabaret, stand-up comedy en theater`;
    return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE.url}${path}">${noindex ? `
<meta name="robots" content="noindex, nofollow">` : ""}
<meta property="og:title" content="${esc(title || SITE.name)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">${foto ? `
<meta property="og:image" content="${SITE.url}${esc(foto.bestand)}">
<meta property="og:image:alt" content="${esc(foto.alt)}">${foto.breedte ? `
<meta property="og:image:width" content="${foto.breedte}">
<meta property="og:image:height" content="${foto.hoogte}">` : ""}` : `
<meta property="og:image" content="${SITE.url}/deelafbeelding.png">
<meta property="og:image:alt" content="Logo van Cabaretiers.com, de theateragenda">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">`}
<meta name="twitter:card" content="summary_large_image">
<meta property="og:url" content="${SITE.url}${path}">
<meta property="og:locale" content="nl_NL">
<meta name="theme-color" content="#FF6A13">
<link rel="icon" href="/favicon.ico?v=2" sizes="48x48">
<link rel="icon" href="/logo.svg?v=2" type="image/svg+xml">
<link rel="icon" href="/icon-192.png?v=2" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/fonts/big-shoulders-display-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css?v=${VERSIE["style.css"]}">
${schema ? `<script type="application/ld+json">${JSON.stringify(paginaLd({ title, description, path, ...schema })).replace(/</g, "\\u003c")}</script>` : ""}
</head>
<body>
<a class="skip" href="#main">Naar de inhoud</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/" aria-label="${SITE.name}, naar de agenda">
      <span class="brand-mark" aria-hidden="true">${LOGO_SVG}</span>
      <span class="logo-tekst"><span class="wordmark">${WOORDMERK_SVG}<span class="tld">.com</span></span><span class="ondertitel">De theateragenda</span></span>
    </a>
    <nav class="nav" aria-label="Hoofdmenu">${nav}</nav>
  </div>
</header>
<main id="main">
${kruimelpadHtml(schema?.kruimels)}${body}
</main>
<footer class="site-footer">
  <div class="wrap footer-boven">${footerLinks()}</div>
  <div class="wrap">
    <a class="brand" href="/" aria-label="${SITE.name}, naar de voorpagina">
      <span class="brand-mark" aria-hidden="true">${LOGO_OMGEKEERD_SVG}</span>
      <span class="logo-tekst" aria-hidden="true"><span class="wordmark">${WOORDMERK_SVG}<span class="tld">.com</span></span><span class="ondertitel">De theateragenda</span></span>
    </a>
    <p>Cabaret en comedy in Nederland en België, verzameld uit openbare speellijsten${db.lastFetched ? `, laatst bijgewerkt op ${fmt.full(db.lastFetched)}` : ""}. Wijzigingen voorbehouden; controleer altijd bij het theater.</p>
    <div class="footer-contact">
    <p class="contact">Contact: <a href="mailto:${SITE.email}">${SITE.email}</a></p>
    <p class="contact footer-paginas"><a href="/over/">Over</a> · <a href="/privacy/">Privacy</a></p>
    <ul class="social" aria-label="Volg ons">${SITE.social.map((s) => `<li><a href="${esc(s.url)}" rel="me noopener" target="_blank" aria-label="${esc(s.naam)} (opent in nieuw venster)" title="${esc(s.naam)}">${s.icoon}</a></li>`).join("")}</ul>
    </div>
  </div>
</footer>${noindex ? "" : `
<div class="cookies" id="cookies" role="region" aria-label="Cookiemelding" hidden>
  <p>Mogen we met cookies meten hoe de site wordt gebruikt? Dat helpt ons de agenda beter te maken. <a href="/privacy/">Privacyverklaring</a>.</p>
  <div class="cookies-knoppen"><button type="button" data-keuze="nee">Liever niet</button><button type="button" data-keuze="ja">Akkoord</button></div>
</div>
<script src="/cookies.js?v=${VERSIE["cookies.js"]}" data-ga="${SITE.analytics}" defer></script>`}
<script src="/agenda.js?v=${VERSIE["agenda.js"]}" defer></script>
</body>
</html>
`;
  }

  // ---------- Bouwstenen ----------

  // Knop naar de speellijst van de zaal (de bron), waar je kaarten koopt. Opent in een nieuw tabblad.
  // Uitverkocht of geannuleerd: geen "Tickets", maar een omlijnde knop "Meer info".
  // De link krijgt utm_source/utm_medium (het theater ziet dan dat de bezoeker van ons komt) en de
  // knop de gegevens voor de klikmeting in Google Analytics (cookies.js, alleen na "Akkoord").
  const ticketData = (g) => {
    const v = V.get(g.voorstelling), t = T.get(g.theater);
    return ` data-theater="${esc(t.naam)}" data-plaats="${esc(t.plaats)}" data-artiest="${esc(v.artiesten.map((a) => A.get(a).naam).join(" & "))}" data-voorstelling="${esc(v.titel)}" data-genre="${esc(v.genre)}" data-speeldatum="${g.datum}"`;
  };
  function ticketKnop(g) {
    const kopen = !["uitverkocht", "geannuleerd", "verplaatst"].includes(g.status);
    const wie = artistNames(g.voorstelling) || V.get(g.voorstelling).titel;
    return `<a class="btn tickets${kopen ? "" : " ghost"}" href="${esc(metUtm(g.bron))}" target="_blank" rel="noopener nofollow"${ticketData(g)}><span class="ticket-tekst">${kopen ? "Tickets" : "Meer info"}</span><span class="ticket-strook">${ICON.extern}</span><span class="visually-hidden">: ${esc(wie)} op ${fmt.full(g.datum)} in ${esc(T.get(g.theater).naam)} (externe website, opent in een nieuw tabblad)</span></a>`;
  }

  function statusLabel(g) {
    if (g.status === "uitverkocht") return `<span class="status sold stempel">Uitverkocht</span>`;
    if (g.status === "onzeker")
      return `<span class="status doubt"${g.opmerking ? ` title="${esc(g.opmerking)}"` : ""}>${ICON.doubt}Datum onzeker</span>`;
    if (g.status === "geannuleerd" || g.status === "verplaatst")
      return `<span class="status sold">${ICON.sold}${STATUSSEN[g.status]}</span>`;
    return "";
  }

  // Labels onder de naam: try-out/première/reprise (omlijnd), "Comedyavond" bij stand-up of een open mic zonder
  // vaste artiest, en de genres (grijs vlak). Op een genrepagina valt dat genre weg, op /agenda/try-outs/ de try-out.
  // Dezelfde opmaak maakt public/agenda.js voor de rijen die later laden (rijHtml): pas ze samen aan.
  function rijLabels(g, { verbergGenre = null, verbergSoort = null } = {}) {
    const v = V.get(g.voorstelling), genres = genresVanV(v);
    const comedyavond = !v.artiesten.length && genres.some((x) => x === "stand-up" || x === "open-mic");
    return [
      // Geen label voor een reprise of dernière (op verzoek van de eigenaar, november 2026); try-out, première en extra voorstelling wel.
      g.soort && !["reprise", "dernière"].includes(g.soort) && g.soort !== verbergSoort ? `<span class="label-soort">${esc(g.soort)}</span>` : "",
      comedyavond ? `<span class="label-genre">Comedyavond</span>` : "",
      ...genres.filter((x) => x !== verbergGenre && !(x === "oudejaarsconference" && OUDEJAARS_IN_NAAM.test(`${v.titel} ${artistNames(g.voorstelling)}`))).map((x) => `<span class="label-genre">${esc(genreLabel(x))}</span>`),
    ].join("");
  }
  // Staat "oudejaars" of "eindejaars" al in de titel of naam, dan is het label Oudejaarsconference dubbel (ook in agenda.js).
  const OUDEJAARS_IN_NAAM = /oudejaars|eindejaars/i;

  function gigRow(g, { showArtist = true, showVenue = true, verbergGenre = null, verbergSoort = null } = {}) {
    const v = V.get(g.voorstelling), t = T.get(g.theater);
    const zoek = [v.titel, t.naam, t.plaats, ...v.artiesten.map((a) => A.get(a).naam)].join(" ").toLowerCase();
    // Voor de knop "Zet in je agenda" (public/agenda.js): wat, waar en hoe laat.
    const inAgenda = ["geannuleerd", "verplaatst"].includes(g.status) ? ""
      : ` data-wat="${esc(v.artiesten.length ? [artistNames(g.voorstelling), echteTitel(g.voorstelling)].filter(Boolean).join(": ") : v.titel)}" data-locatie="${esc(`${t.naam}, ${t.plaats}`)}"${g.tijd ? ` data-tijd="${g.tijd}"` : ""}`;
    // De titel van de voorstelling cursief tussen aanhalingstekens; zonder vaste artiest staat de titel al bovenaan.
    const titel = showArtist ? (v.artiesten.length && echteTitel(g.voorstelling) ? showLink(g.voorstelling, esc(echteTitel(g.voorstelling))) : "") : esc(v.titel);
    return `<article class="gig${g.status === "geannuleerd" ? " cancelled" : ""}" data-datum="${g.datum}" data-land="${t.land}" data-plaats="${esc(t.plaats)}" data-genre="${genresVanV(v).join(" ")}" data-status="${g.status}" data-zoek="${esc(zoek)}" data-waar="${esc(`${t.naam} ${t.plaats}`.toLowerCase())}"${inAgenda}>
      <div class="date"><b>${fmt.day(g.datum)}</b><small>${fmt.weekdayShort(g.datum)}${g.tijd ? " " + g.tijd : ""}</small></div>
      <div class="main">
        <span class="swatch" style="${ink(leadInk(g.voorstelling))};background:var(--bg)" aria-hidden="true"></span>
        <div class="main-text">
          ${showArtist ? `<span class="artist">${artistLinks(g.voorstelling)}</span>` : ""}
          <span class="show">${titel ? `<span class="titel">${titel}</span>` : ""}${rijLabels(g, { verbergGenre, verbergSoort })}</span>
        </div>
      </div>
      <div class="venue">${showVenue ? `<a href="/theaters/${t.id}/">${ICON.pin}<span class="visually-hidden">Theater: </span>${esc(t.naam)}</a><span><a href="${plaatsPad(t.plaats)}">${esc(t.plaats)}</a>, ${LANDEN[t.land]}</span>` : ""}</div>
      <div class="side">${statusLabel(g)}<div class="knoppen">${ticketKnop(g)}</div></div>
    </article>`;
  }

  function monthGroups(list, opts) {
    const groups = new Map();
    for (const g of list) {
      const k = g.datum.slice(0, 7);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(g);
    }
    return [...groups].map(([k, items]) =>
      `<section class="month-group" data-maand="${k}"><h3>${fmt.monthYear(k + "-01")}</h3>${items.map((g) => gigRow(g, opts)).join("")}</section>`
    ).join("");
  }

  // ---------- Gestructureerde gegevens (schema.org, JSON-LD) ----------
  // Elke pagina krijgt één @graph: de organisatie, de website, de pagina zelf, het kruimelpad
  // en wat er op de pagina staat (voorstellingen, artiest, zaal, lijsten).

  const URL = (pad) => SITE.url + pad;
  const ORG_ID = URL("/#organisatie"), SITE_ID = URL("/#website");
  const EVENT_TYPE = {
    cabaret: "TheaterEvent", "muzikaal-cabaret": "TheaterEvent", kleinkunst: "TheaterEvent",
    oudejaarsconference: "TheaterEvent", komedie: "TheaterEvent",
    "stand-up": "ComedyEvent", "open-mic": "ComedyEvent", improvisatie: "ComedyEvent", festival: "Festival",
  };
  const ZAAL_TYPE = { theater: "PerformingArtsTheater", comedyclub: "ComedyClub", café: "BarOrPub" };
  const artiestLd = (id) => {
    const a = A.get(id);
    return {
      "@type": isGroep(a) ? "PerformingGroup" : "Person", "@id": URL(`${artiestPad(id)}#artiest`), name: a.naam, url: URL(artiestPad(id)),
      ...(a.foto ? { image: URL(a.foto.bestand) } : {}),
      // De foto kwam via Wikidata: dat item is deze artiest.
      ...(a.foto?.wikidata ? { sameAs: `https://www.wikidata.org/wiki/${a.foto.wikidata}` } : {}),
    };
  };
  // Foto van een artiest of een zaal (een zaal herken je aan de plaats).
  // Foto van een artiest, zaal (heeft een plaats) of voorstelling (heeft een titel).
  const fotoPad = (a) => a.titel ? voorstellingPad.get(a.id) : `${a.plaats ? "/theaters" : "/artiesten"}/${a.id}/`;
  // Licentie van een vrije foto als webadres; publiek domein heeft geen eigen licentiepagina op Commons.
  const licentieUrl = (f) => f.licentieUrl || (/^public domain$/i.test(f.licentie || "") ? "https://creativecommons.org/publicdomain/mark/1.0/" : null);
  // Een kaartverkoopsite is niet de eigen website van een zaal (komt soms uit een kaartlink in een speellijst).
  const KAARTSITE = /(^|\.)(inboxifier\.eu|ticket\.monster|activetickets\.com|tix4all\.nl|ticketcrew\.nl|mijnetickets\.shop|eventix\.io|stager\.co|weeztix\.com|ticketmaster\.\w+|eventbrite\.\w+|ticketpoint\.nl|ticketkantoor\.nl)$/i;
  const eigenSite = (url) => { try { return url && !KAARTSITE.test(new globalThis.URL(url).hostname) ? url : null; } catch { return null; } };
  const fotoLd = (a) => ({
    "@type": "ImageObject", "@id": URL(`${fotoPad(a)}#foto`),
    url: URL(a.foto.bestand), contentUrl: URL(a.foto.bestand), encodingFormat: "image/jpeg",
    name: a.foto.alt, caption: a.foto.alt, description: a.foto.alt, inLanguage: "nl",
    ...(a.foto.breedte ? { width: a.foto.breedte, height: a.foto.hoogte } : {}),
    ...(a.foto.datum ? { dateCreated: a.foto.datum } : {}),
    // Maker: een persoon, tenzij het een bureau of "Wikimedia Commons" is (geen naam van de fotograaf).
    // Een promofoto zonder bekende fotograaf heeft geen maker.
    ...(a.foto.maker ? { creditText: a.foto.maker, copyrightNotice: `${a.foto.maker}, ${a.foto.licentie}`,
      creator: { "@type": /wikimedia|buro|bureau|studio|b\.?v\.?$|&/i.test(a.foto.maker) ? "Organization" : "Person", name: a.foto.maker } } : {}),
    ...(licentieUrl(a.foto) ? { license: licentieUrl(a.foto) } : {}), ...(a.foto.promo ? {} : { acquireLicensePage: a.foto.bron }),
    about: { "@id": URL(fotoPad(a) + (a.titel ? "#voorstelling" : a.plaats ? "#zaal" : "#artiest")) },
  });
  // Eerste artiest met een foto bij een voorstelling.
  const fotoArtiest = (vid) => V.get(vid).artiesten.map((x) => A.get(x)).find((x) => x.foto);
  const zaalLd = (id) => {
    const t = T.get(id);
    return {
      "@type": ZAAL_TYPE[t.soort] || "EventVenue", "@id": URL(`/theaters/${id}/#zaal`), name: t.naam, url: URL(`/theaters/${id}/`),
      ...((eigenSite(t.website) || t.foto?.wikidata) ? { sameAs: [eigenSite(t.website), t.foto?.wikidata && `https://www.wikidata.org/wiki/${t.foto.wikidata}`].filter(Boolean) } : {}),
      ...(t.foto ? { image: URL(t.foto.bestand) } : {}),
      address: { "@type": "PostalAddress", addressLocality: t.plaats, addressCountry: t.land },
    };
  };
  const plaatsLd = (p) => ({ "@type": "City", name: p, containedInPlace: { "@type": "Country", name: LANDEN[landVanPlaats(p)] } });
  const eventId = (g) => URL(`${voorstellingPad.get(g.voorstelling) || `/theaters/${g.theater}/`}#${g.datum}${g.tijd ? "-" + g.tijd.replace(":", "") : ""}-${g.theater}`);

  function eventLd(g) {
    const v = V.get(g.voorstelling), t = T.get(g.theater);
    const status = { geannuleerd: "EventCancelled", verplaatst: "EventPostponed" }[g.status] || "EventScheduled";
    const titel = echteTitel(g.voorstelling);
    return {
      "@type": EVENT_TYPE[v.genre] || "Event",
      "@id": eventId(g),
      name: v.artiesten.length ? `${artistNames(g.voorstelling)}${titel ? `: ${titel}` : ""}` : v.titel,
      description: `${GENRES[v.genre]}${v.artiesten.length ? ` van ${artistNames(g.voorstelling)}` : ""} in ${t.naam}, ${t.plaats}.`,
      startDate: isoWithOffset(g.datum, g.tijd),
      eventStatus: `https://schema.org/${status}`,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      inLanguage: t.land === "BE" ? "nl-BE" : "nl-NL",
      location: zaalLd(g.theater),
      // Afbeelding: de voorstelling, anders de artiest, anders de zaal, anders de deelafbeelding van de site.
      image: [URL(v.foto?.bestand || fotoArtiest(g.voorstelling)?.foto.bestand || t.foto?.bestand || "/deelafbeelding.png")],
      ...(v.artiesten.length ? { performer: v.artiesten.map(artiestLd) } : {}),
      // De zaal programmeert de voorstelling en verkoopt de kaarten.
      organizer: { "@type": "Organization", name: t.naam, ...(eigenSite(t.website) ? { url: eigenSite(t.website) } : {}) },
      // Kaartverkoop bij de zaal: uitverkocht, of te koop zolang de voorstelling gewoon doorgaat (dan staat er
      // een knop "Tickets"). Prijzen kennen we niet, die laten we weg.
      offers: {
        "@type": "Offer", url: metUtm(g.bron),
        ...(g.status === "uitverkocht" ? { availability: "https://schema.org/SoldOut" } : ["gepland", "onzeker"].includes(g.status) ? { availability: "https://schema.org/InStock" } : {}),
      },
      url: voorstellingPad.has(g.voorstelling) ? URL(voorstellingPad.get(g.voorstelling)) : URL(`/theaters/${g.theater}/`),
    };
  }
  // Google leest per pagina een beperkt aantal evenementen; de eerste 100 volstaan.
  const eventsLd = (list) => list.slice(0, 100).map(eventLd);

  const lijstLd = (items) => ({
    "@type": "ItemList", numberOfItems: items.length,
    itemListElement: items.map(([naam, pad], i) => ({ "@type": "ListItem", position: i + 1, name: naam, url: URL(pad) })),
  });

  // Zichtbaar kruimelpad op dieper liggende pagina's (vanaf twee niveaus onder de voorpagina).
  function kruimelpadHtml(kruimels = []) {
    if (kruimels.length < 2) return "";
    const pad = [["Home", "/"], ...kruimels];
    return `<nav class="kruimelpad" aria-label="Kruimelpad"><ol class="wrap">${pad.map(([naam, p], i) =>
      i === pad.length - 1 ? `<li aria-current="page">${esc(naam)}</li>` : `<li><a href="${p}">${esc(naam)}</a></li>`).join("")}</ol></nav>
`;
  }

  // schema = { type, kruimels: [[naam, pad], ...], over, hoofd, extra: [...] }
  function paginaLd({ title, description, path, type = "WebPage", kruimels = [], over, hoofd, foto, extra = [] }) {
    const paginaUrl = URL(path);
    const pad = [["Home", "/"], ...kruimels];
    return {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Organization", "@id": ORG_ID, name: SITE.name, url: URL("/"), email: SITE.email, description: SITE.description, sameAs: SITE.social.map((s) => s.url),
          areaServed: [{ "@type": "Country", name: "Nederland" }, { "@type": "Country", name: "België" }],
          contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: SITE.email, availableLanguage: ["nl"] }, logo: { "@type": "ImageObject", url: URL("/apple-touch-icon.png"), width: 180, height: 180, caption: "Beeldmerk van Cabaretiers.com" }, image: URL("/deelafbeelding.png") },
        {
          "@type": "WebSite", "@id": SITE_ID, name: SITE.name, url: URL("/"), inLanguage: "nl", description: SITE.description,
          publisher: { "@id": ORG_ID },
          potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: URL("/agenda/?q={search_term_string}") }, "query-input": "required name=search_term_string" },
        },
        {
          "@type": type, "@id": paginaUrl + "#pagina", url: paginaUrl, name: title || SITE.name, description, inLanguage: "nl",
          isPartOf: { "@id": SITE_ID },
          ...(pad.length > 1 ? { breadcrumb: { "@id": paginaUrl + "#kruimelpad" } } : {}),
          ...(over ? { about: over } : {}),
          ...(hoofd ? { mainEntity: hoofd } : {}),
          ...(foto ? { primaryImageOfPage: { "@id": fotoLd(foto)["@id"] }, image: { "@id": fotoLd(foto)["@id"] } } : {}),
          dateModified: db.lastFetched || db.today,
        },
        ...(pad.length > 1 ? [{
          "@type": "BreadcrumbList", "@id": paginaUrl + "#kruimelpad",
          itemListElement: pad.map(([naam, p], i) => ({ "@type": "ListItem", position: i + 1, name: naam, item: URL(p) })),
        }] : []),
        ...(foto ? [fotoLd(foto)] : []),
        ...extra,
      ],
    };
  }

  // ---------- Overzichten van de gegevens ----------

  const up = db.upcoming;
  const maanden = [...new Set(up.map((g) => g.datum.slice(0, 7)))].sort();
  const perMaand = (m) => up.filter((g) => g.datum.startsWith(m));
  const plaatsen = [...new Set(up.map((g) => T.get(g.theater).plaats))].sort((a, b) => a.localeCompare(b, "nl"));
  const perPlaats = (p) => up.filter((g) => T.get(g.theater).plaats === p);
  // Onthouden per plaats: de plaatspagina's vragen dit voor elke speeldatum op.
  const landPerPlaats = new Map();
  const landVanPlaats = (p) => {
    if (!landPerPlaats.has(p)) landPerPlaats.set(p, T.get(perPlaats(p)[0]?.theater)?.land || [...T.values()].find((t) => t.plaats === p)?.land);
    return landPerPlaats.get(p);
  };
  const artiestenMetData = [...A.values()].filter((a) => !isFestival(a.id)).map((a) => ({ a, list: db.gigsForArtist(a.id) })).filter((x) => x.list.length);
  const F = db.festivals;
  const festivalsMetData = [...F.values()].map((f) => ({ f, list: db.gigsForFestival(f.id) })).filter((x) => x.list.length)
    .sort((x, y) => x.list[0].datum.localeCompare(y.list[0].datum));
  const festivalKleur = (f) => A.get((f.artiesten || [])[0])?.kleur || "geel";
  const zalenMetData = [...T.values()].filter((t) => db.gigsForTheater(t.id).length);
  const tellers = {
    speeldata: up.length,
    artiesten: artiestenMetData.length,
    zalen: zalenMetData.length,
    plaatsen: plaatsen.length,
  };
  // Alle genres van een voorstelling: het hoofdgenre en eventueel ookGenres (cabaret die ook stand-up is).
  const genresVanV = (v) => [v.genre, ...(v.ookGenres || [])];
  const heeftGenre = (gig, genre) => genresVanV(V.get(gig.voorstelling)).includes(genre);
  const genresVan = (list) => [...new Set(list.flatMap((g) => genresVanV(V.get(g.voorstelling))))].sort();
  const maandNaam = (m) => fmt.monthYear(m + "-01");
  const kortMaand = (m) => fmt.monthShort(m + "-01");

  // Filterformulier voor een lijst met speeldata. Welke velden er zijn, hangt af van de pagina.
  // "Utrecht of Carré": de plaats waar het vaakst gespeeld wordt en een zaal in een andere plaats.
  function voorbeeldWaar(list) {
    const steden = telPer(list, (g) => T.get(g.theater).plaats);
    const zaal = list.map((g) => T.get(g.theater)).find((t) => t.plaats !== steden[0]?.[0]);
    return zaal ? `${steden[0][0]} of ${zaal.naam}` : steden[0]?.[0] || "Utrecht";
  }

  // waar: alleen zoeken op plaats en zaal (artiestpagina: de artiest heb je dan al gevonden).
  // Zoeken en filteren boven een speellijst (public/agenda.js). Het zoekveld doorzoekt artiest,
  // voorstelling, zaal en plaats; op een artiestpagina alleen zaal en plaats (waar).
  function filters(list, { maand = false, waar = false, genre = true, afstand = false } = {}) {
    // Kindervoorstellingen (hoofdgenre) die standaard uit staan; 0 als de lijst alleen kindervoorstellingen heeft.
    const kinder = list.some((x) => !heeftGenre(x, "kindervoorstellingen")) ? list.filter((x) => V.get(x.voorstelling).genre === "kindervoorstellingen").length : 0;
    const months = [...new Set(list.map((g) => g.datum.slice(0, 7)))].sort();
    const genres = genresVan(list);
    const uitverkocht = list.some((g) => g.status === "uitverkocht");
    return `<form class="filters" id="filters" role="search" aria-label="Voorstellingen filteren" hidden>
    <div class="field search">
      ${waar ? `<label for="f-q">Zoek op plaats of theater</label>
      <input id="f-q" name="q" type="search" autocomplete="off" data-veld="waar" placeholder="Bijvoorbeeld: ${esc(voorbeeldWaar(list))}">` : `<label for="f-q">Zoek op artiest, voorstelling, plaats of theater</label>
      <input id="f-q" name="q" type="search" autocomplete="off" placeholder="Bijvoorbeeld: Lebbis, Utrecht of Carré">`}
    </div>
    ${maand && months.length > 1 ? `<div class="field">
      <label for="f-maand">Maand</label>
      <select id="f-maand" name="maand"><option value="">Alle maanden</option>${months.map((m) => `<option value="${m}">${maandNaam(m)}</option>`).join("")}</select>
    </div>` : ""}
    ${genre && genres.length > 1 ? `<div class="field">
      <span class="label" id="f-genre-label">Genre</span>
      <details class="keuze" id="f-genre" data-totaal="${list.length}" data-kinder="${kinder}">
        <summary aria-describedby="f-genre-label"><span class="keuze-tekst">Alle genres</span><span class="keuze-n">${list.length.toLocaleString("nl-NL")}</span></summary>
        <div class="keuze-lijst" role="group" aria-labelledby="f-genre-label">${genres.map((g) => [g, list.filter((x) => heeftGenre(x, g)).length]).sort((a, b) => (kinder && (a[0] === "kindervoorstellingen") - (b[0] === "kindervoorstellingen")) || b[1] - a[1] || a[0].localeCompare(b[0])).map(([g, n]) => {
          // Kindervoorstellingen staan standaard uit (agenda.js): onderaan, apart, met "standaard uit" erbij.
          const kind = kinder && g === "kindervoorstellingen";
          return `<label${kind ? ' class="keuze-kind"' : ""}><input type="checkbox" name="genre" value="${g}" data-n="${n}"><span>${GENRES[g]}${kind ? '<small class="keuze-uit">Staat uit, vink aan om te tonen</small>' : ""}</span><span class="keuze-n">${n.toLocaleString("nl-NL")}</span></label>`;
        }).join("")}</div>
      </details>
    </div>` : ""}
    ${afstand ? `<div class="field afstand-veld">
      <label for="f-km">Afstand</label>
      <span class="afstand-kies">${ICON.pin}<select id="f-km" name="km"><option value="">Overal</option>${[10, 25, 50].map((km) => `<option value="${km}">Binnen ${km} km van mij</option>`).join("")}</select></span>
    </div>` : ""}
    ${uitverkocht ? `<div class="field toggle-veld">
      <label class="toggle"><input type="checkbox" id="f-uitverkocht" name="uitverkocht" value="1"> Uitverkocht verbergen</label>
    </div>` : ""}
  </form>
  <p class="result-line" id="result-line" aria-live="polite"></p>`;
  }

  // Lange lijst (genre, try-outs) met zoeken in álle voorstellingen, zoals /agenda/: de pagina toont de eerste
  // MAX (aangevuld tot het eind van die dag), agenda.js laadt de rest uit /agenda/alles.js en houdt zich aan
  // het vaste genre of de vaste soort (data-vast-genre, data-vast-soort).
  function zoekbareLijst(list, { max = 150, genre = null, soort = null } = {}) {
    const rijOpts = { verbergGenre: genre, verbergSoort: soort };
    const grens = list[Math.min(max, list.length) - 1].datum;
    const eerste = list.filter((g) => g.datum <= grens);
    return { eerste, html: `${filters(list, { genre: !genre })}
      <div id="gigs" data-alles="/agenda/alles.js?v=${allesVersie()}" data-tot="${grens}" data-totaal="${list.length}"${genre ? ` data-vast-genre="${genre}"` : ""}${soort ? ` data-vast-soort="${soort}"` : ""}>${monthGroups(eerste, rijOpts)}</div>
      ${leegBlok}
      <p class="meer-weken" id="laad-meer"><button type="button" class="btn" id="laad-week">Toon alle ${list.length.toLocaleString("nl-NL")} voorstellingen</button></p>` };
  }

  const leegBlok = `<div class="empty" id="empty" hidden>
    <p>Geen voorstellingen die aan deze filters voldoen.</p>
    <button type="button" class="btn ghost" id="reset">Filters wissen</button>
  </div>`;

  // Maandkeuze als rij knoppen; de huidige maand is gemarkeerd.
  // Zijwaartse rij met de plaatsen met de meeste voorstellingen (/plaatsen/ en de homepage).
  function plaatsNav() {
    return `<nav class="month-nav stad-nav" aria-label="Plaatsen met de meeste voorstellingen">${[...plaatsen].sort((x, y) => perPlaats(y).length - perPlaats(x).length || x.localeCompare(y, "nl")).slice(0, 15).map((p) =>
      `<a href="${plaatsPad(p)}"><b>${esc(p)}</b><span>${plural(perPlaats(p).length, "voorstelling", "voorstellingen")}</span></a>`).join("")}</nav>`;
  }

  // Zijwaartse rij met de genres, meeste voorstellingen eerst (homepage), in dezelfde stijl als plaatsNav().
  function genreNav() {
    return `<nav class="month-nav stad-nav" aria-label="Genres">${[...GENRE_PAGINAS].sort((x, y) => genreLijst(y).length - genreLijst(x).length).map((g) =>
      `<a href="/agenda/${g}/"><b>${esc(GENRE_INFO[g].kop)}</b><span>${plural(genreLijst(g).length, "voorstelling", "voorstellingen")}</span></a>`).join("")}${tryoutLijst.length ? `<a href="/agenda/try-outs/"><b>Try-outs</b><span>${plural(tryoutLijst.length, "voorstelling", "voorstellingen")}</span></a>` : ""}</nav>`;
  }

  function maandNav(huidig) {
    return `<nav class="month-nav" aria-label="Maanden">${maanden.map((m) =>
      `<a href="/agenda/${maandId(m)}/"${m === huidig ? ' aria-current="page"' : ""}><b>${kortMaand(m)}</b><span>${m.slice(0, 4)}</span></a>`).join("")}</nav>`;
  }

  // ---------- Pagina's ----------

  // Heel lange woorden op affiches en kaarten mogen alleen op een logische plek afbreken
  // ("Oudejaars-conference"), niet midden in het woord.
  const afbreken = (s) => esc(s).replace(/(oudejaars|eindejaars)(conference)/gi, "$1&shy;$2");

  // Lange titels kleiner zetten zodat ze op de affiche passen.
  const titleClass = (titel) => {
    const longestWord = Math.max(...titel.split(/\s+/).map((w) => w.length));
    return longestWord > 13 ? " xlong" : titel.length > 10 ? " long" : "";
  };

  // Uitsnede rond het gezicht (focus in data/promo.json) voor een vlak met verhouding breedte/hoogte.
  // object-position in procenten: 0% legt de rand links/boven, 100% rechts/onder.
  // Het gezicht komt op een derde van de bovenkant (zoals bij een portret), zodat er ook lichaam in
  // beeld is; in de breedte komt het in het midden.
  const GEZICHT_HOOGTE = 0.3;
  const plek = (f, zichtbaar, doel) => zichtbaar >= 1 ? 0.5 : Math.min(1, Math.max(0, (f - doel * zichtbaar) / (1 - zichtbaar)));
  const uitsnede = (foto, verhouding) => {
    if (!foto.focus || !foto.breedte) return "";
    const beeld = foto.breedte / foto.hoogte;
    return ` style="object-position:${Math.round(plek(foto.focus[0], verhouding / beeld, 0.5) * 100)}% ${Math.round(plek(foto.focus[1], beeld / verhouding, GEZICHT_HOOGTE) * 100)}%"`;
  };

  // "Nu in het theater": voorstellingen met een promobeeld (data/promo.json), meeste speeldata eerst,
  // hooguit één per artiest. Bovenin het beeld, daaronder het kleurvlak van de artiest.
  // Met `artiest` (id -> ja/nee) alleen voorstellingen van die artiesten (zoals de mannen of vrouwen).
  // Paginaweergaven per artiest in de laatste 28 dagen (artiestpagina en voorstellingspagina's samen, zoals
  // op /dashboard/). "Nu in het theater" zet de meest bekeken artiesten vooraan; elke build werkt dat bij.
  const weergavenArtiest = new Map();
  for (const r of ga?.perioden?.[0]?.artiesten || []) {
    const id = String(r.pagePath || "").split("/")[2];
    if (id) weergavenArtiest.set(id, (weergavenArtiest.get(id) || 0) + (Number(r.screenPageViews) || 0));
  }
  const weergaven = (v) => Math.max(0, ...v.artiesten.map((a) => weergavenArtiest.get(a) || 0));

  function nuInTheater(artiest = () => true, voorstelling = () => true) {
    const gezien = new Set();
    const lijst = [...V.values()].filter((v) => v.foto && voorstellingPad.has(v.id) && artiest(v.artiesten[0]) && voorstelling(v))
      .map((v) => ({ v, list: up.filter((g) => g.voorstelling === v.id && g.status !== "geannuleerd") }))
      .filter(({ list }) => list.length)
      .sort((x, y) => weergaven(y.v) - weergaven(x.v) || y.list.length - x.list.length || x.list[0].datum.localeCompare(y.list[0].datum))
      .filter(({ v }) => !gezien.has(v.artiesten[0]) && gezien.add(v.artiesten[0]))
      .slice(0, 20);
    return afwisselend(lijst, ({ v }) => A.get(v.artiesten[0]).kleur, { schuiven: false })
      .map(({ x: { v, list }, kleur }, i) => {
        const beste = [...(v.recensies || [])].filter((r) => r.sterren).sort((x, y) => y.sterren - x.sterren)[0];
        const aantal = plural(list.length, "speeldatum", "speeldata");
        const titel = echteTitel(v.id) || v.titel;
        return `<a class="poster poster-foto" href="${voorstellingPad.get(v.id)}" style="${ink(kleur)}">
        <span class="visually-hidden">${esc(titel)} van ${esc(artistNames(v.id))}, ${aantal}${beste ? `. ${esc(beste.medium)}: ${plural(beste.sterren, "ster", "sterren")}` : ""}</span>
        <span class="poster-beeld" aria-hidden="true">
          <img src="${esc(v.foto.bestand)}" alt=""${uitsnede(v.foto, 1.2)} width="${v.foto.breedte || 800}" height="${v.foto.hoogte || 1000}" loading="${i < 4 ? "eager" : "lazy"}" decoding="async">
          ${beste ? `<span class="poster-sterren onder">${"★".repeat(beste.sterren)}<small>${esc(beste.medium)}</small></span>` : ""}
        </span>
        <span class="poster-vlak" aria-hidden="true">
          <span class="poster-info">
          <strong class="ftitel${titleClass(titel)}">${afbreken(titel)}</strong>
          <span class="fartiest">${esc(artistNames(v.id))}</span>
          <span class="tag">${aantal}</span>
          </span>
          <span class="poster-stub"></span>
        </span>
      </a>`;
      }).join("");
  }

  // Theaters met een foto, meeste voorstellingen eerst, als kaartjes met de zaalfoto. De zalen hebben
  // geen eigen kleur: die volgt uit de id, en buren krijgen nooit dezelfde. Maker en licentie van de
  // foto staan op de theaterpagina (waar het kaartje naartoe linkt) en als tooltip op de foto.
  const zaalKleuren = Object.keys(KLEUREN).filter((k) => k !== "zwart");
  const zaalKleur = (t) => zaalKleuren[createHash("sha1").update(t.id).digest()[0] % zaalKleuren.length];
  function theaterKaartjes() {
    const kleurVan = zaalKleur;
    const lijst = [...T.values()].filter((t) => t.foto?.bestand)
      .map((t) => ({ t, list: db.gigsForTheater(t.id).filter((g) => g.status !== "geannuleerd") }))
      .filter(({ list }) => list.length)
      .sort((x, y) => y.list.length - x.list.length || x.t.naam.localeCompare(y.t.naam, "nl"))
      .slice(0, 20);
    return afwisselend(lijst, ({ t }) => kleurVan(t), { schuiven: false }).map(({ x: { t, list }, kleur }) => {
      const g = list[0], v = V.get(g.voorstelling);
      const wat = [v.artiesten.length ? artistNames(g.voorstelling) : "", echteTitel(g.voorstelling) || (v.artiesten.length ? "" : v.titel)].filter(Boolean).join(": ");
      const aantal = plural(list.length, "voorstelling", "voorstellingen");
      return `<a class="poster poster-foto poster-zaal" href="/theaters/${t.id}/" style="${ink(kleur)}">
        <span class="visually-hidden">${esc(t.naam)} in ${esc(t.plaats)}, ${aantal}, volgende: ${esc(wat)}</span>
        <span class="poster-beeld" aria-hidden="true" title="Foto: ${esc(t.foto.maker)}, ${esc(t.foto.licentie)}">
          <img src="${esc(t.foto.bestand)}" alt="" width="${t.foto.breedte || 960}" height="${t.foto.hoogte || 720}" loading="lazy" decoding="async">
        </span>
        <span class="poster-vlak" aria-hidden="true">
          <span class="poster-info">
          <strong class="ftitel${titleClass(t.naam)}">${esc(t.naam)}</strong>
          <span class="fartiest">${esc(t.plaats)}</span>
          <span class="where"><span class="wanneer">Volgende voorstelling</span>${esc(wat)}</span>
          <span class="tag">${aantal}</span>
          </span>
          <span class="poster-stub"></span>
        </span>
      </a>`;
    }).join("");
  }

  // Zijwaarts scrollende rij affiches met knoppen (agenda.js).
  const strip = (id, label, inhoud) => `<div class="strip-wrap">
    <div class="strip" id="${id}" tabindex="0" aria-label="${esc(label)}">${inhoud}</div>
    <div class="strip-nav" hidden>
      <button type="button" class="strip-prev" aria-label="Vorige">${ICON.prev}</button>
      <button type="button" class="strip-next" aria-label="Volgende">${ICON.next}</button>
    </div>
  </div>`;

  function artiestKaarten(lijst) {
    return lijst.map(({ a, list }) => {
      const titles = [...new Set(list.map((g) => echteTitel(g.voorstelling)).filter(Boolean))].slice(0, 2).join(", ");
      const langsteWoord = Math.max(...a.naam.split(/\s+/).map((w) => w.length));
      return `<a class="artist-card" href="${artiestPad(a.id)}" style="${ink(a.kleur)}">
          <h3${langsteWoord > 10 ? ' class="lang"' : ""}>${esc(a.naam)}</h3>
          <p>${titles ? `${esc(titles)}<br>` : ""}<span class="count">${plural(list.length, "speeldatum", "speeldata")}</span>, vanaf ${fmt.dayMonth(list[0].datum)}</p>
        </a>`;
    }).join("");
  }


  // ---------- /in-de-buurt/: voorstellingen bij je in de buurt ----------
  // agenda.js vraagt (na een klik) de locatie van de browser, of je kiest een plaats; dan rekent het in de browser de
  // afstand uit tot de plaats van elke zaal (coördinaten in /agenda/alles.js) en toont de voorstellingen binnen de
  // gekozen straal, op datum. De locatie gaat nergens heen. Zonder JavaScript: de lijst met plaatsen.
  function inDeBuurtPagina() {
    const plaatsLijst = [...new Map(up.map((g) => T.get(g.theater)).map((t) => [t.plaats, geoPlaats(t.plaats, t.land)])).entries()]
      .filter(([, c]) => c).sort((a, b) => a[0].localeCompare(b[0], "nl"));
    const body = `<section class="block wrap" aria-labelledby="t">
  <div class="block-head"><h1 id="t">Bij mij in de buurt</h1><p>Cabaret en comedy bij jou in de buurt: gebruik je locatie of kies een plaats.</p></div>
  <div class="buurt" data-buurt data-alles="/agenda/alles.js?v=${allesVersie()}" hidden>
    <div class="buurt-kies">
      <button type="button" class="btn buurt-locatie">${ICON.pin}Gebruik mijn locatie</button>
      <span class="buurt-of">of</span>
      <label class="buurt-plaats"><span class="visually-hidden">Kies een plaats</span><input type="search" list="buurt-plaatsen" placeholder="Kies een plaats, bijvoorbeeld Utrecht" autocomplete="off"></label>
      <datalist id="buurt-plaatsen">${plaatsLijst.map(([p]) => `<option value="${esc(p)}">`).join("")}</datalist>
    </div>
    <div class="buurt-opties">
      <div class="buurt-straal" role="group" aria-label="Afstand">${[10, 25, 50].map((km) => `<button type="button" data-km="${km}" aria-pressed="${km === 25}">${km} km</button>`).join("")}</div>
      <label class="check"><input type="checkbox" class="buurt-uitverkocht"> Uitverkocht verbergen</label>
      <label class="check"><input type="checkbox" class="buurt-kinder"> Kindervoorstellingen tonen</label>
    </div>
    <p class="buurt-status" role="status" aria-live="polite"></p>
    <div class="buurt-lijst"></div>
    <div class="laad-meer" hidden><button type="button" class="btn ghost buurt-meer">Toon meer voorstellingen</button></div>
  </div>
  <noscript><p>Voor zoeken op afstand is JavaScript nodig. Kies hieronder een plaats.</p></noscript>
  <script type="application/json" id="buurt-coordinaten">${JSON.stringify(Object.fromEntries(plaatsLijst)).replace(/</g, "\\u003c")}</script>
</section>
<section class="block wrap kies-blok kleine-kop" aria-labelledby="plaatsen-titel">
  <div class="wall-head"><h2 id="plaatsen-titel">Of kies een plaats</h2><p><a href="/plaatsen/">Alle plaatsen</a></p></div>
  ${plaatsNav()}
</section>
<section class="block wrap" aria-labelledby="buurt-uitleg">
  <div class="seo-tekst prose">
    <h2 id="buurt-uitleg">Hoe werkt zoeken in de buurt?</h2>
    <p>Klik op <em>Gebruik mijn locatie</em> en geef je browser toestemming. Je ziet dan alle cabaret- en comedyvoorstellingen binnen 10, 25 of 50 kilometer, op datum, met de afstand erbij. Je locatie blijft in je eigen browser: de afstand wordt op je eigen telefoon of computer uitgerekend en we slaan niets op.</p>
    <p>Liever je locatie niet delen? Typ een plaats, dan rekenen we vanaf die plaats. De afstand is hemelsbreed, van plaats tot plaats.</p>
  </div>
</section>`;
    return layout({ title: "Cabaret en comedy bij mij in de buurt", description: zinnen("Welke cabaret- en comedyvoorstellingen zijn er bij jou in de buurt? Gebruik je locatie of kies een plaats en zie alles binnen 10, 25 of 50 kilometer.", "Met kaarten via het theater."), path: "/in-de-buurt/", section: "plaatsen", body,
      schema: { kruimels: [["Plaatsen", "/plaatsen/"], ["Bij mij in de buurt", "/in-de-buurt/"]] } });
  }

  // ---------- Net binnen (post-its) en nieuws ----------
  // Post-its op de homepage en /nieuws/: premières en eerste try-outs van de komende drie weken, voorstellingen
  // die net in de agenda kwamen (data/eerst-gezien.json) en nieuwsberichten (data/nieuws.json). Alles automatisch
  // uit de agenda, behalve de berichten. Kindervoorstellingen niet (die staan in het filter ook standaard uit).
  const nieuwsPad = (n) => `/nieuws/${n.id}/`;
  const plusDagen = (d, n) => new Date(new Date(d + "T12:00:00Z").getTime() + n * 864e5).toISOString().slice(0, 10);
  const geenKind = (g) => V.get(g.voorstelling).genre !== "kindervoorstellingen";
  const metJaar = (d) => `${fmt.weekdayShort(d)} ${fmt.day(d)} ${fmt.monthShort(d)}${d.slice(0, 4) !== db.today.slice(0, 4) ? ` ${d.slice(0, 4)}` : ""}`;
  // Per dag: hoeveel voorstellingen er voor het eerst in de agenda kwamen. Een dag met veel tegelijk is een nieuwe
  // bron (een zaal of genre erbij), geen nieuwe aankondigingen: die telt niet mee voor de post-its.
  const eerstOp = new Map(Object.entries(db.eerstGezien.voorstellingen || {}));
  const nieuwOpDag = new Map();
  for (const v of V.values()) {
    const d = v.artiesten.length && eerstOp.get(voorstellingSleutel(v));
    // Geen festivals, verzamelavonden ("Diverse cabaretiers") of kindervoorstellingen.
    if (!d || d === db.eerstGezien.sinds || d > db.today || v.genre === "kindervoorstellingen" || v.artiesten.some((x) => festivalVan.has(x) || /^divers/i.test(A.get(x).naam))) continue;
    nieuwOpDag.set(d, [...(nieuwOpDag.get(d) || []), v]);
  }
  const BULK = 40;
  // Een dag met veel nieuwe voorstellingen tegelijk (alle genres samen) is een nieuwe bron, geen nieuwe aankondigingen.
  const totaalOpDag = new Map();
  for (const d of eerstOp.values()) totaalOpDag.set(d, (totaalOpDag.get(d) || 0) + 1);
  const bulkDag = (d) => d === db.eerstGezien.sinds || (totaalOpDag.get(d) || 0) > BULK;
  // Echt nieuw: voor het eerst gezien na de eerste vulling, op een gewone dag (niet bij een nieuwe bron).
  const echtNieuw = (vid) => { const v = V.get(vid), d = eerstOp.get(voorstellingSleutel(v)); return !!d && !bulkDag(d); };
  const eersteGig = (vid) => db.upcoming.find((g) => g.voorstelling === vid);

  function netBinnenItems() {
    const tot = plusDagen(db.today, 21);
    const premieres = [], gezien = new Set();
    for (const g of db.upcoming) {
      if (g.datum > tot) break;
      if (!geenKind(g) || gezien.has(g.voorstelling) || !V.get(g.voorstelling).artiesten.length) continue;
      if (g.soort === "première") { premieres.push({ soort: "Première", g }); gezien.add(g.voorstelling); }
      // Eerste try-out: alleen bij een voorstelling die echt nieuw in de agenda kwam (niet bij de eerste vulling of een
      // nieuwe bron: dan kunnen er al eerdere try-outs geweest zijn die we niet kennen) en zonder eerdere speeldatum.
      else if (g.soort === "try-out" && echtNieuw(g.voorstelling) && !db.gigs.some((x) => x.voorstelling === g.voorstelling && x.datum < g.datum)) { premieres.push({ soort: "Eerste try-out", g }); gezien.add(g.voorstelling); }
    }
    const nieuw = [...nieuwOpDag].filter(([d]) => d >= plusDagen(db.today, -10) && !bulkDag(d)).sort((a, b) => b[0].localeCompare(a[0]))
      .flatMap(([, l]) => l).filter((v) => v.artiesten.length <= 2).map((v) => ({ soort: "Nieuw in de agenda", g: eersteGig(v.id) })).filter((x) => x.g && !gezien.has(x.g.voorstelling));
    // Waar nog kaarten voor zijn eerst; uitverkochte achteraan.
    const kaarten = (x) => (["uitverkocht", "geannuleerd", "verplaatst"].includes(x.g.status) ? 1 : 0);
    premieres.sort((a, b) => kaarten(a) - kaarten(b)); nieuw.sort((a, b) => kaarten(a) - kaarten(b));
    const berichten = db.nieuws.filter((n) => n.datum >= plusDagen(db.today, -21)).map((n) => ({ soort: "Nieuws", n }));
    // Afwisselen: premières en try-outs vooraan, met nieuwe voorstellingen en berichten ertussen.
    const patroon = ["p", "p", "w", "p", "n", "p", "w", "p"], bak = { p: premieres, w: nieuw, n: berichten };
    const uit = [];
    for (const k of patroon) { const x = bak[k].shift() || bak.p.shift() || bak.w.shift() || bak.n.shift(); if (x) uit.push(x); }
    return uit;
  }

  // Kleuren en varianten van de briefjes: nooit twee dezelfde kleuren naast elkaar.
  const POSTIT_KLEUREN = ["var(--riso-yellow)", "var(--riso-pink)", "var(--riso-lime)", "var(--riso-aqua)", "#FFB067", "var(--riso-lilac)"];
  const POSTIT_VARIANTEN = [
    ["pin vouw-rechtsonder", -1.6, ""], ["tape krul", 1.2, "--t:4deg"], ["strook", 1.8, ""], ["tape-hoek vouw-linksonder", -1, ""],
    ["tape-groen", 1.4, "--t:-5deg"], ["strook vouw-rechtsonder", -1.8, ""], ["pin vouw-linksboven", 1.6, "--pinx:70%"], ["tape krul", -1.2, "--t:-2deg"],
  ];
  function postit(x, i) {
    let [klassen, r, extra] = POSTIT_VARIANTEN[i % POSTIT_VARIANTEN.length];
    const kleur = x.n ? "#F3F3F6" : POSTIT_KLEUREN[i % POSTIT_KLEUREN.length];
    if (x.n) {
      return `<li><a class="pi bericht ${klassen}" href="${nieuwsPad(x.n)}" style="--c:${kleur};--r:${r}deg;${extra}"><span class="vlak" aria-hidden="true"></span><span class="wat">Nieuws</span><b>${esc(x.n.titel)}</b><span class="voet"><span>${esc(fmt.dayMonth(x.n.datum))}</span><span>Lees meer →</span></span></a></li>`;
    }
    const g = x.g, v = V.get(g.voorstelling), t = T.get(g.theater);
    const titel = echteTitel(g.voorstelling);
    const a = A.get(v.artiesten[0]);
    // Een promofoto (met toestemming) maakt er een fotobriefje van; de maker staat op de artiestpagina.
    const foto = a?.foto?.promo && v.artiesten.length === 1 ? a.foto : null;
    if (foto) klassen = "tape krul";
    const kopen = !["uitverkocht", "geannuleerd", "verplaatst"].includes(g.status);
    const voet = `<span class="voet"><span>${esc(metJaar(g.datum))}${g.tijd ? ` · ${g.tijd}` : ""}</span>${kopen ? `<span>Tickets ${ICON.extern}</span>` : `<span class="uit">${esc(STATUSSEN[g.status] || g.status)}</span>`}</span>`;
    const tekst = `${titel ? `<em>${esc(titel)}</em> in ` : "In "}${esc(t.naam)}${t.naam.includes(t.plaats) ? "" : `, ${esc(t.plaats)}`}`;
    const label = `<span class="wat">${esc(x.soort)}</span>`;
    const inhoud = foto
      ? `<img src="${esc(foto.bestand)}" alt="" loading="lazy"${uitsnede(foto, 1.72)}${foto.maker ? ` title="Foto: ${esc(foto.maker)}"` : ""}><span class="tekst">${label}<b>${esc(artistNames(g.voorstelling))}</b>${voet}</span>`
      : `${label}<b>${esc(artistNames(g.voorstelling))}</b><p>${tekst}</p>${voet}`;
    return `<li><a class="pi ${klassen}${foto ? " foto" : ""} tickets" href="${esc(metUtm(g.bron))}" target="_blank" rel="noopener nofollow"${ticketData(g)} style="--c:${kleur};--r:${r}deg;${extra}"><span class="vlak" aria-hidden="true"></span>${inhoud}<span class="visually-hidden"> (${esc(x.soort)}: ${esc(artistNames(g.voorstelling))} op ${fmt.full(g.datum)} in ${esc(t.naam)}; externe website, opent in een nieuw tabblad)</span></a></li>`;
  }
  function netBinnenBlok({ kop = "h2", link = true, klein = false } = {}) {
    const items = netBinnenItems();
    if (!items.length) return "";
    return `<section class="block wrap net-binnen${klein ? " kleine-kop" : ""}" aria-labelledby="net-binnen-titel">
  <div class="wall-head"><${kop} id="net-binnen-titel">Dit speelt er</${kop}>${link ? `<p><a href="/nieuws/">Alles in nieuws</a></p>` : ""}</div>
  <ul class="memo">${items.map(postit).join("")}</ul>
</section>`;
  }

  // Tijdlijn op /nieuws/: berichten, nieuwe voorstellingen per dag en premières van de afgelopen tijd, nieuwste eerst.
  function tijdlijnItems() {
    const van = plusDagen(db.today, -60);
    const rijen = [];
    for (const n of db.nieuws) if (n.datum >= van) rijen.push({ soort: "nieuws", datum: n.datum, titel: `<a href="${nieuwsPad(n)}">${esc(n.titel)}</a>`, tekst: esc(n.alineas[0]), link: [nieuwsPad(n), "Lees meer →"] });
    for (const [d, l] of nieuwOpDag) {
      if (d < van) continue;
      const namen = l.map((v) => { const p = voorstellingPad.get(v.id) || artiestPad(v.artiesten[0]); return `<a href="${p}">${esc(artistNames(v.id))}</a>${echteTitel(v.id) ? ` (<em>${esc(echteTitel(v.id))}</em>)` : ""}`; });
      rijen.push(l.length === 1
        ? { soort: "nieuw", datum: d, titel: `${esc(artistNames(l[0].id))} staat in de agenda`, tekst: `Nieuw: ${namen[0]}.`, link: [voorstellingPad.get(l[0].id) || artiestPad(l[0].artiesten[0]), "Speellijst →"] }
        : { soort: "nieuw", datum: d, titel: `${l.length} nieuwe voorstellingen in de agenda`, tekst: `${bulkDag(d) ? "Er kwamen nieuwe theaters en speellijsten bij. " : ""}Onder meer ${opsomming(namen.slice(0, 6))}.`, link: null });
    }
    // Premières die net geweest zijn (uit het archief), één per voorstelling.
    const gehad = new Set();
    for (const g of db.gigs.filter((g) => g.soort === "première" && g.datum >= van && g.datum < db.today && geenKind(g) && V.get(g.voorstelling).artiesten.length).sort((a, b) => a.datum.localeCompare(b.datum))) {
      if (gehad.has(g.voorstelling)) continue;
      gehad.add(g.voorstelling);
      const t = T.get(g.theater), titel = echteTitel(g.voorstelling);
      const p = voorstellingPad.get(g.voorstelling) || artiestPad(V.get(g.voorstelling).artiesten[0]);
      rijen.push({ soort: "premiere", datum: g.datum, titel: `${esc(artistNames(g.voorstelling))}${titel ? `: première van <em>${esc(titel)}</em>` : " in première"}`, tekst: `In ${esc(t.naam)}, ${esc(t.plaats)}.`, link: [p, "Speellijst →"] });
    }
    const volgorde = { nieuws: 0, premiere: 1, nieuw: 2 };
    return rijen.sort((a, b) => b.datum.localeCompare(a.datum) || volgorde[a.soort] - volgorde[b.soort]);
  }
  const TIJDLIJN_LABEL = { nieuws: "Nieuws", nieuw: "Nieuw", premiere: "Première" };

  function nieuwsPagina() {
    const rijen = tijdlijnItems();
    const filters = [["", "Alles"], ["nieuws", "Nieuws"], ["premiere", "Premières"], ["nieuw", "Nieuw in de agenda"]].filter(([k]) => !k || rijen.some((r) => r.soort === k));
    const body = `<section class="block wrap nieuws-kop" aria-labelledby="t"><div class="block-head"><h1 id="t">Nieuws</h1><p>Nieuws vanuit de theaters of van de artiesten zelf. Premières, eerste try-outs en nieuwe voorstellingen.</p></div></section>
${netBinnenBlok({ link: false, klein: true })}
<section class="block wrap tijdlijn kleine-kop" aria-labelledby="tijdlijn-titel" data-tijdlijn>
  <div class="wall-head"><h2 id="tijdlijn-titel">Tijdlijn</h2></div>
  <div class="tijdlijn-filters" role="group" aria-label="Filter de tijdlijn" hidden>${filters.map(([k, n], i) => `<button type="button" data-soort="${k}" aria-pressed="${i === 0}">${n}</button>`).join("")}</div>
  <ol class="tijdlijn-lijst">${rijen.map((r) => `
    <li data-soort="${r.soort}"><time class="d" datetime="${r.datum}"><b>${fmt.day(r.datum)}</b><small>${esc(fmt.monthShort(r.datum))}${r.datum.slice(0, 4) !== db.today.slice(0, 4) ? ` ${r.datum.slice(0, 4)}` : ""}</small></time><span class="tl-label tl-${r.soort}">${TIJDLIJN_LABEL[r.soort]}</span><div><h3>${r.titel}</h3><p>${r.tekst}</p></div>${r.link ? `<a class="tl-link" href="${r.link[0]}">${r.link[1]}</a>` : "<span></span>"}</li>`).join("")}
  </ol>
</section>`;
    const desc = zinnen("Nieuws uit de cabaret- en comedyagenda: premières, eerste try-outs en nieuwe voorstellingen in Nederland en België.", "Elke dag bijgewerkt.");
    return layout({ title: "Nieuws over cabaret en comedy: premières en try-outs", description: desc, path: "/nieuws/", section: "nieuws", body,
      schema: { type: "CollectionPage", kruimels: [["Nieuws", "/nieuws/"]], hoofd: lijstLd(db.nieuws.map((n) => [n.titel, nieuwsPad(n)])) } });
  }

  function nieuwsBericht(n) {
    const a = n.artiest && A.get(n.artiest), t = n.theater && T.get(n.theater);
    const lijst = a ? db.gigsForArtist(a.id) : t ? db.gigsForTheater(t.id) : [];
    const verder = [
      ...(a && (lijst.length || a.nietOpTournee) ? [[`${a.naam}: speellijst en meer`, artiestPad(a.id)]] : []),
      ...(t && lijst.length ? [[`Programma van ${t.naam}`, `/theaters/${t.id}/`]] : []),
      ...(n.meer ? [n.meer] : []),
    ];
    const body = `<article class="block wrap nieuws-bericht">
  <p class="nb-meta"><span class="tl-label tl-nieuws">Nieuws</span> <time datetime="${n.datum}">${esc(fmt.full(n.datum))}</time></p>
  <h1>${esc(n.titel)}</h1>
  <div class="prose">${n.alineas.map((p) => `<p>${esc(p)}</p>`).join("")}
  <p class="nb-bron">Bron: ${n.bronnen.map(([naam, url]) => `<a href="${esc(url)}" rel="noopener">${esc(naam)}</a>`).join(", ")}</p>
  ${verder.length ? `<ul class="nb-verder">${verder.map(([naam, p]) => `<li><a href="${esc(p)}">${esc(naam)} →</a></li>`).join("")}</ul>` : ""}
  <p><a href="/nieuws/">← Al het nieuws</a></p></div>
</article>`;
    return layout({ title: n.titel, description: zinnen(...n.alineas.join(" ").split(/(?<=\.)\s+/)), path: nieuwsPad(n), section: "nieuws", body,
      schema: { type: "WebPage", kruimels: [["Nieuws", "/nieuws/"], [n.titel, nieuwsPad(n)]], hoofd: { "@id": URL(nieuwsPad(n)) + "#bericht" },
        extra: [{ "@type": "NewsArticle", "@id": URL(nieuwsPad(n)) + "#bericht", headline: n.titel, datePublished: n.datum, inLanguage: "nl", publisher: { "@id": ORG_ID }, author: { "@id": ORG_ID }, isBasedOn: n.bronnen.map(([, url]) => url),
          ...(a ? { about: { "@type": "Person", name: a.naam, url: URL(artiestPad(a.id)) } } : t ? { about: { "@type": "Place", name: t.naam } } : {}) }] } });
  }

  function home() {

    const nu = nuInTheater();
    const zalen = theaterKaartjes();
    const clubs = comedyclubs();
    const body = `
${nu ? `<section class="wall" aria-labelledby="nu-title">
  <div class="wrap wall-head">
    <h1 id="nu-title">Nu in het theater</h1>
    <p><a href="/agenda/">De volledige agenda</a></p>
  </div>
  ${strip("strip-nu", "Voorstellingen die nu in het theater staan", nu)}
</section>` : `<h1 class="visually-hidden">Cabaretiers.com, de theateragenda</h1>`}

<section class="wrap stats" aria-label="De agenda in cijfers">
  <dl>
    <div><dt>voorstellingen</dt><dd>${tellers.speeldata.toLocaleString("nl-NL")}</dd></div>
    <div><dt>artiesten</dt><dd>${tellers.artiesten}</dd></div>
    <div><dt>theaters</dt><dd>${tellers.zalen}</dd></div>
  </dl>
</section>

${zalen ? `
<section class="wall wall-zalen" aria-labelledby="zalen-title">
  <div class="wrap wall-head">
    <h2 id="zalen-title">Theaters</h2>
    <p><a href="/theaters/">Alle theaters</a></p>
  </div>
  ${strip("strip-zalen", "Theaters met de meeste voorstellingen", zalen)}
</section>` : ""}
<section class="block wrap kies-blok kleine-kop" aria-labelledby="maand-title">
  <div class="wall-head"><h2 id="maand-title">Voorstellingen per maand</h2></div>
  ${maandNav(null)}
</section>

<section class="block wrap kies-blok kleine-kop" aria-labelledby="plaats-title">
  <div class="wall-head"><h2 id="plaats-title">Zoek in de buurt</h2><p><a href="/plaatsen/">Alle plaatsen</a></p></div>
  ${plaatsNav()}
  <p class="buurt-knop-rij"><a class="btn buurt-knop" href="/in-de-buurt/?locatie=1">${ICON.pin}Gebruik mijn locatie</a></p>
</section>
${netBinnenBlok()}
${clubs.length ? `
<section class="wall wall-zalen kleine-kop" aria-labelledby="clubs-title">
  <div class="wrap wall-head">
    <h2 id="clubs-title">Comedy Clubs</h2>
    <p><a href="/comedy-clubs/">Alle comedyclubs</a></p>
  </div>
  ${strip("strip-clubs", "Comedyclubs met de meeste voorstellingen", kaartenRij(clubs, ({ t }) => zaalKleur(t), clubKaart))}
</section>` : ""}
${festivalsMetData.length ? `
<section class="wall wall-zalen kleine-kop" aria-labelledby="festivals-title">
  <div class="wrap wall-head">
    <h2 id="festivals-title">Festivals</h2>
    <p><a href="/festivals/">Alle festivals</a></p>
  </div>
  ${strip("strip-festivals", "Cabaretfestivals, de eerstvolgende voorop", kaartenRij(festivalsMetData, ({ f }) => festivalKleur(f), festivalKaart))}
</section>` : ""}
${GENRE_PAGINAS.length ? `
<section class="block wrap kies-blok kleine-kop" aria-labelledby="genres-title">
  <div class="wall-head"><h2 id="genres-title">Genres</h2></div>
  ${genreNav()}
</section>` : ""}

${uitgelichtBlok("home") ? `<div class="wrap">${uitgelichtBlok("home")}</div>` : ""}

<section class="block wrap" aria-labelledby="over-titel">
  <div class="seo-tekst prose over-blok">
    <h2 id="over-titel">Over cabaretiers.com</h2>
    <p>Cabaretiers.com is de theateragenda voor cabaret en comedy in Nederland en België. Elke nacht verzamelen we de speellijsten van theaters, comedyclubs en artiesten, zodat je op één plek ziet wie waar speelt: van avondvullend cabaret in de schouwburg tot stand-up in een comedyclub, festivals, open mics en komisch toneel.</p>
    <p>Nu staan er ${tellers.speeldata.toLocaleString("nl-NL")} voorstellingen in de agenda, van ${tellers.artiesten} artiesten in ${tellers.zalen} theaters. Bij elke voorstelling brengt de knop <em>Tickets</em> je naar de site van het theater of de artiest, waar je kaarten koopt. Cabaretiers.com verkoopt zelf geen kaarten.</p>
    <p>Speel je zelf, of programmeer je een zaal? Mail je speellijst naar <a href="mailto:${SITE.email}">${SITE.email}</a>. <a href="/over/">Meer over de agenda</a></p>
  </div>
</section>`;
    return layout({ path: "/", section: null, body, schema: { hoofd: { "@id": ORG_ID } } });
  }

  // Week van een datum: maandag als begin (ISO-datum).
  const maandagVan = (iso) => { const d = new Date(iso + "T12:00:00Z"); return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10); };
  const weekLabel = (van, tot) => van === tot ? fmt.dayMonth(van) : van.slice(0, 7) === tot.slice(0, 7) ? `${fmt.day(van)} – ${fmt.dayMonth(tot)}` : `${fmt.dayMonth(van)} – ${fmt.dayMonth(tot)}`;

  // Alle komende voorstellingen in een compact bestand (/agenda/alles.js, inhoud JSON) voor /agenda/: agenda.js laadt
  // daaruit alles na de eerste week en zoekt erin. Artiesten, zalen en voorstellingen staan er één keer in;
  // de rijen verwijzen ernaar met een volgnummer. Kleuren, iconen en namen zijn al klaar voor de pagina.
  // Versie in het adres van /agenda/alles.js: een vingerafdruk van de inhoud. Zo haalt een browser het bestand opnieuw
  // zodra er iets verandert (ook als het aantal voorstellingen gelijk blijft, zoals toen de coördinaten erbij kwamen).
  let allesVersieCache;
  const allesVersie = () => (allesVersieCache ??= createHash("sha1").update(JSON.stringify(agendaData())).digest("hex").slice(0, 10));
  function agendaData() {
    const ai = new Map(), zi = new Map(), vi = new Map(), a = [], z = [], v = [];
    const nr = (map, lijst, id, maak) => { if (!map.has(id)) { map.set(id, lijst.length); lijst.push(maak()); } return map.get(id); };
    const rijen = up.map((g) => {
      const vs = V.get(g.voorstelling), t = T.get(g.theater);
      const vn = nr(vi, v, g.voorstelling, () => [
        vs.artiesten.map((id) => nr(ai, a, id, () => [artiestPad(id), A.get(id).naam])),
        vs.titel, echteTitel(g.voorstelling) || "", voorstellingPad.get(g.voorstelling) || "", vs.genre, ink(leadInk(g.voorstelling)), vs.ookGenres || [],
      ]);
      // Met de coördinaten van de plaats (voor /in-de-buurt/), of leeg als die onbekend zijn.
      const zn = nr(zi, z, g.theater, () => [t.id, t.naam, t.plaats, plaatsId(t.plaats), LANDEN[t.land], ...(geoPlaats(t.plaats, t.land) || [])]);
      return [g.datum, g.tijd || "", vn, zn, g.status, g.soort || "", metUtm(g.bron), g.opmerking || ""];
    });
    return { iconen: { extern: ICON.extern, doubt: ICON.doubt, sold: ICON.sold, pin: ICON.pin }, statussen: STATUSSEN, genres: Object.fromEntries(Object.keys(GENRES).map((g) => [g, genreLabel(g)])), a, z, v, r: rijen }; // labels bij één voorstelling
  }

  function agendaIndex() {
    // Eerst de lopende week (vandaag t/m zondag; zijn dat maar één of twee dagen, dan tot en met de zondag erna).
    let tot = new Date(new Date(maandagVan(db.today) + "T12:00:00Z").getTime() + 6 * 864e5).toISOString().slice(0, 10);
    if ((new Date(tot) - new Date(db.today)) / 864e5 < 2) tot = new Date(new Date(tot + "T12:00:00Z").getTime() + 7 * 864e5).toISOString().slice(0, 10);
    const eerste = up.filter((g) => g.datum <= tot);
    const overzicht = agendaOverzicht();
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Agenda</h1><p>${plural(tellers.speeldata, "voorstelling", "voorstellingen")} in ${plural(tellers.zalen, "zaal", "zalen")}</p></div>
      ${maandNav(null)}
      ${uitgelichtBlok("agenda")}
      ${filters(up, { afstand: true })}
      <div id="gigs" data-alles="/agenda/alles.js?v=${allesVersie()}" data-tot="${tot}" data-totaal="${up.length}"><section class="month-group week-groep"><h3>${weekLabel(eerste[0]?.datum || db.today, tot)} <small>${plural(eerste.length, "voorstelling", "voorstellingen")}</small></h3>${eerste.map((g) => gigRow(g)).join("")}</section></div>
      ${leegBlok}
      <p class="meer-weken" id="laad-meer" hidden><button type="button" class="btn" id="laad-week">Toon alle volgende voorstellingen</button></p>
      <p class="more" id="naar-maand"><a class="btn" href="/agenda/${maandId(maanden[0])}/">Verder in ${maandNaam(maanden[0])}</a></p>
      ${GENRE_PAGINAS.length ? `<section class="genre-plaatsen" aria-labelledby="genre-titel">
        <h2 class="sub-head" id="genre-titel">Per genre</h2>
        <p class="genre-plaats-top">${GENRE_PAGINAS.map((g) => `<a href="/agenda/${g}/">${esc(GENRE_INFO[g].kop)} <span>${genreLijst(g).length}</span></a>`).join("")}${tryoutLijst.length ? `<a href="/agenda/try-outs/">Try-outs <span>${tryoutLijst.length}</span></a>` : ""}</p>
      </section>` : ""}
      <section class="seo-tekst prose" aria-labelledby="over-titel">
        <h2 id="over-titel">Cabaret- en theatervoorstellingen</h2>
        ${overzicht.tekst.join("\n        ")}
      </section>
      ${faqHtml(overzicht.vragen, "Veelgestelde vragen over de agenda")}
    </section>`;
    return layout({ title: "Cabaret- en comedyagenda Nederland en België", description: kort(`Alle ${tellers.speeldata.toLocaleString("nl-NL")} aankomende cabaret- en comedyvoorstellingen in Nederland en België, week voor week. Zoek op artiest, plaats of theater.`), path: "/agenda/", section: "agenda", body, schema: { type: "CollectionPage", kruimels: [["Agenda", "/agenda/"]], extra: [...eventsLd(eerste), faqLd(overzicht.vragen, "/agenda/")] } });
  }

  // Een maand per week (maandag t/m zondag, binnen de maand), met een weekkeuze bovenaan. Zonder
  // JavaScript staan alle weken onder elkaar; agenda.js toont eerst één week met een knop voor de rest.
  function weekGroepen(list, m) {
    const laatste = new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 0)).toISOString().slice(0, 10);
    const weekVan = (iso) => {
      const d = new Date(iso + "T12:00:00Z"), ma = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10);
      return ma < m + "-01" ? m + "-01" : ma;
    };
    const zondag = (w) => new Date(new Date(w + "T12:00:00Z").getTime() + (6 - (new Date(w + "T12:00:00Z").getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10);
    const dagen = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5) + 1;
    // Een stukje week van één of twee dagen aan het begin of eind van de maand hoort bij de week ernaast.
    let eersteEind = zondag(m + "-01");
    const begin = (iso) => {
      let w = weekVan(iso);
      if (w === m + "-01" && dagen(w, eersteEind) <= 2) w = m + "-01";
      return w;
    };
    const kaal = [];
    for (const g of list) kaal.push([begin(g.datum), g]);
    const sleutels = [...new Set(kaal.map(([w]) => w))];
    const samen = new Map(sleutels.map((w) => [w, w]));
    if (sleutels.length > 1 && dagen(sleutels[0], zondag(sleutels[0])) <= 2 && sleutels[0] === m + "-01") samen.set(sleutels[1], sleutels[0]);
    const lw = sleutels.at(-1);
    if (sleutels.length > 1 && dagen(lw, laatste) <= 2 && zondag(lw) > laatste) samen.set(lw, samen.get(sleutels.at(-2)));
    const weken = new Map();
    for (const [w0, g] of kaal) {
      const w = samen.get(w0);
      if (!weken.has(w)) weken.set(w, []);
      weken.get(w).push(g);
    }
    const label = (w) => {
      const items = weken.get(w), eindDatum = items.at(-1).datum;
      let eind = zondag(w); if (eind > laatste) eind = laatste;
      if (zondag(eindDatum) !== zondag(w) || eindDatum > eind) eind = zondag(eindDatum) > laatste ? laatste : zondag(eindDatum);
      // De eerste week begint bij de eerste voorstelling (op de lopende maand is dat vandaag of later).
      const start = w === [...weken.keys()][0] ? items[0].datum : w;
      return eind === start ? fmt.dayMonth(start) : `${fmt.day(start)} – ${fmt.dayMonth(eind)}`;
    };
    const nav = `<nav class="week-nav" aria-label="Kies een week">${[...weken].map(([w, items]) => `<a href="#week-${w}"><b>${label(w)}</b><span>${items.length}</span></a>`).join("")}</nav>`;
    const groepen = [...weken].map(([w, items]) =>
      `<section class="month-group week-groep" id="week-${w}" data-week="${esc(label(w))}"><h3>${label(w)} <small>${plural(items.length, "voorstelling", "voorstellingen")}</small></h3>${items.map((g) => gigRow(g)).join("")}</section>`).join("");
    return { nav, groepen };
  }

  function agendaMaand(m) {
    const list = perMaand(m);
    const i = maanden.indexOf(m);
    const vorige = maanden[i - 1], volgende = maanden[i + 1];
    const weken = weekGroepen(list, m);
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">${maandNaam(m)}</h1><p>${plural(list.length, "voorstelling", "voorstellingen")}</p></div>
      ${maandNav(m)}
      ${uitgelichtBlok("agenda")}
      ${filters(list)}
      ${weken.nav}
      <div id="gigs" data-per-week>${weken.groepen}</div>
      <p class="meer-weken" id="meer-weken" hidden><button type="button" class="btn" id="volgende-week"></button></p>
      ${leegBlok}
      <p class="pager">${vorige ? `<a class="btn ghost" href="/agenda/${maandId(vorige)}/">${ICON.prev}${maandNaam(vorige)}</a>` : "<span></span>"}${volgende ? `<a class="btn ghost" href="/agenda/${maandId(volgende)}/">${maandNaam(volgende)}${ICON.next}</a>` : ""}</p>
    </section>`;
    const maandNamen = telPer(list.filter((g) => V.get(g.voorstelling).artiesten.length), (g) => V.get(g.voorstelling).artiesten[0]).slice(0, 3).map(([id]) => A.get(id).naam);
    return layout({ title: `Cabaret en comedy in ${maandNaam(m)}`, description: zinnen(`Alle ${list.length} cabaret- en comedyvoorstellingen in ${maandNaam(m)} in Nederland en België, week voor week.`, maandNamen.length ? `Met onder meer ${opsomming(maandNamen)}.` : "", "Met tijden, zalen en kaarten."), path: `/agenda/${maandId(m)}/`, section: "agenda", body, schema: { type: "CollectionPage", kruimels: [["Agenda", "/agenda/"], [maandNaam(m), `/agenda/${maandId(m)}/`]], extra: eventsLd(list) } });
  }

  function plaatsIndex() {
    const kolommen = Object.keys(LANDEN).map((land) => {
      const items = plaatsen.filter((p) => landVanPlaats(p) === land);
      if (!items.length) return "";
      return `<div><h2>${LANDEN[land]}</h2><ul class="venue-list">${items.map((p) => {
        const zalenHier = zalenMetData.filter((t) => t.plaats === p), zalen = zalenHier.length;
        // Zoeken kan op de plaats én op de zalen ("Kattendans" vindt Bergeijk).
        return `<li data-zoek="${esc([p, ...zalenHier.map((t) => t.naam)].join(" ").toLowerCase())}"><a href="${plaatsPad(p)}"><span><span class="vn">${esc(p)}</span><span class="vc">${plural(zalen, "zaal", "zalen")}</span></span><span class="vk">${plural(perPlaats(p).length, "voorstelling", "voorstellingen")}</span></a></li>`;
      }).join("")}</ul></div>`;
    }).join("");
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Plaatsen</h1><p>Waar is cabaret en comedy te zien?</p></div>
      ${plaatsNav()}
      <div class="az-tools">
        <div class="field search">
          <label for="f-plaatsnaam">Zoek een plaats of zaal</label>
          <input id="f-plaatsnaam" type="search" autocomplete="off" placeholder="Bijvoorbeeld: Leiden of Kattendans">
        </div>
      </div>
      <div class="venues" id="plaatsenlijst">${kolommen}</div>
      <p class="empty" id="plaatsen-leeg" hidden>Geen plaats of zaal gevonden met deze naam.</p>
    </section>`;
    return layout({ title: "Theater per plaats in Nederland en België", description: kort(`Cabaret, comedy en komisch theater in ${plaatsen.length} plaatsen in Nederland en België. Kies je plaats en zie wat er in de theaters bij jou in de buurt speelt.`), path: "/plaatsen/", section: "plaatsen", body, schema: { type: "CollectionPage", kruimels: [["Plaatsen", "/plaatsen/"]], hoofd: lijstLd(plaatsen.map((p) => [p, plaatsPad(p)])) } });
  }

  // ---------- Uitgelicht (betaalde vermelding, data/uitgelicht.json) ----------
  // Duidelijk gemarkeerd als betaald (Reclamecode); externe links met rel="sponsored".
  // Een vermelding zonder aankomende voorstellingen wordt niet getoond.
  const uitgelichtOnderwerp = (u) => {
    if (u.theater) return { naam: T.get(u.theater).naam, pad: `/theaters/${u.theater}/`, list: db.gigsForTheater(u.theater), kleur: u.kleur || "geel" };
    if (u.artiest) return { naam: A.get(u.artiest).naam, pad: artiestPad(u.artiest), list: db.gigsForArtist(u.artiest), kleur: u.kleur || A.get(u.artiest).kleur };
    return { naam: F.get(u.festival).naam, pad: `/festivals/${u.festival}/`, list: db.gigsForFestival(u.festival), kleur: u.kleur || "roze" };
  };
  function uitgelichtBlok(plek, plaats = null) {
    const items = db.uitgelicht.filter((u) => u.plekken.includes(plek)).map((u) => ({ u, ...uitgelichtOnderwerp(u) }))
      .map((x) => ({ ...x, list: plaats ? x.list.filter((g) => T.get(g.theater).plaats === plaats) : x.list }))
      .filter((x) => x.list.length).slice(0, 2);
    if (!items.length) return "";
    return `<aside class="uitgelicht-rij" aria-label="Uitgelicht">${items.map(({ u, naam, pad, list, kleur }) => `
      <div class="uitgelicht" style="${ink(kleur)}">
        <p class="uitgelicht-label">Uitgelicht <span>· betaalde vermelding</span></p>
        <h2><a href="${pad}">${esc(naam)}</a></h2>
        ${u.tekst ? `<p class="uitgelicht-tekst">${esc(u.tekst)}</p>` : ""}
        <ul>${list.slice(0, 3).map((g) => `<li><b>${esc(fmt.weekdayShort(g.datum))} ${esc(fmt.dayMonth(g.datum))}</b> ${u.theater ? esc(artistNames(g.voorstelling)) : `${esc(T.get(g.theater).naam)}, ${esc(T.get(g.theater).plaats)}`}</li>`).join("")}</ul>
        <p class="uitgelicht-knoppen"><a class="btn" href="${pad}">Alle voorstellingen</a>${u.link ? `<a class="btn ghost" href="${esc(metUtm(u.link))}" target="_blank" rel="sponsored noopener">Naar de website${ICON.extern}</a>` : ""}</p>
      </div>`).join("")}
    </aside>`;
  }

  // ---------- Vanavond en dit weekend ----------
  // De site wordt 's nachts gebouwd. "Vanavond" bevat daarom ook morgen: komt de nachtelijke build
  // later, dan verbergt agenda.js de voorbije dag en noemt het morgen "Vanavond".
  const dagPlus = (d, n) => new Date(new Date(d + "T12:00:00Z").getTime() + n * 864e5).toISOString().slice(0, 10);
  const weekdag = (d) => new Date(d + "T12:00:00Z").getUTCDay(); // 0 = zondag
  const hoofdletter = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  // Dit weekend: vrijdag tot en met zondag; op vrijdag, zaterdag of zondag vanaf vandaag.
  function weekendVan(d) {
    const w = weekdag(d);
    const start = w === 0 || w >= 5 ? d : dagPlus(d, 5 - w);
    return { start, eind: dagPlus(start, (7 - weekdag(start)) % 7) };
  }
  const vandaagDag = db.today, morgenDag = dagPlus(db.today, 1);
  const weekend = weekendVan(db.today);
  const vanavondLijst = (lijst) => lijst.filter((g) => g.datum === vandaagDag || g.datum === morgenDag);
  const weekendLijst = (lijst) => lijst.filter((g) => g.datum >= weekend.start && g.datum <= weekend.eind);
  // Teksten over vanavond en dit weekend (plaatspagina's): de build draait elke nacht, dus "vanavond" is de builddag.
  const weekendPeriode = () => `${fmt.weekday(weekend.start)} ${fmt.dayMonth(weekend.start)}${weekend.eind !== weekend.start ? ` tot en met ${fmt.weekday(weekend.eind)} ${fmt.dayMonth(weekend.eind)}` : ""}`;
  const avondZin = (gigs, max, metDag) => opsomming(gigs.slice(0, max).map((g) => `${esc(artistNames(g.voorstelling) || V.get(g.voorstelling).titel)}${echteTitel(g.voorstelling) ? ` met <em>${esc(echteTitel(g.voorstelling))}</em>` : ""} ${metDag ? `op ${fmt.weekday(g.datum)} ` : ""}${g.tijd ? `om ${g.tijd} ` : ""}in ${theaterLink(g.theater)}`)) + (gigs.length > max ? ` en nog ${gigs.length - max} meer` : "");
  // Vanavond en dit weekend per stad bestaan niet meer (november 2026): dat was dubbel met het blok
  // "Vanavond en dit weekend" op de plaatspagina. public/.htaccess stuurt die adressen met een 301 door.
  const stadPaginas = new Map();
  const dagPad = (soort, p) => p ? `${plaatsPad(p)}${soort}/` : `/${soort}/`;

  function dagGroepen(list, opts) {
    const groepen = new Map();
    for (const g of list) {
      if (!groepen.has(g.datum)) groepen.set(g.datum, []);
      groepen.get(g.datum).push(g);
    }
    const label = (d) => d === vandaagDag ? "Vanavond" : d === morgenDag ? "Morgen" : hoofdletter(fmt.weekday(d));
    return [...groepen].map(([d, items]) =>
      `<section class="month-group" data-dag="${d}"><h3><span class="dag-label" data-dag="${d}">${label(d)}</span> <small>${esc(fmt.long(d))}</small></h3>${items.map((g) => gigRow(g, opts)).join("")}</section>`
    ).join("");
  }

  function dagPagina(soort, p = null) {
    const avond = soort === "vanavond";
    const bron = p ? perPlaats(p) : up;
    const list = avond ? vanavondLijst(bron) : weekendLijst(bron);
    const waar = p ? ` in ${p}` : "";
    const wanneer = avond ? "vanavond" : "dit weekend";
    const periode = avond ? fmt.long(vandaagDag) : `${fmt.weekday(weekend.start)} ${fmt.dayMonth(weekend.start)}${weekend.eind !== weekend.start ? ` tot en met ${fmt.weekday(weekend.eind)} ${fmt.dayMonth(weekend.eind)}` : ""}`;
    const titel = `Cabaret en comedy ${wanneer}${waar}`;
    const nVandaag = avond ? list.filter((g) => g.datum === vandaagDag).length : list.length;
    const ander = avond ? "dit-weekend" : "vanavond";
    const andereLink = !p || stadPaginas.get(p).includes(ander) ? `<a href="${dagPad(ander, p)}">${ander === "vanavond" ? "Vanavond" : "Dit weekend"}${waar}</a>` : "";
    // Plaatsen met de meeste voorstellingen in deze periode, met een link naar hun plaatspagina.
    const steden = p ? [] : telPer(list.filter((g) => !avond || g.datum === vandaagDag), (g) => T.get(g.theater).plaats).slice(0, 15).map(([q, n]) => `<a href="${plaatsPad(q)}">${esc(q)} (${n})</a>`);
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">${esc(hoofdletter(wanneer))}${esc(waar)}</h1><p>${esc(hoofdletter(periode))}${p ? "" : " in Nederland en België"}</p></div>
      <p class="dag-intro">${avond
        ? `Zin in een avond lachen? Hier staan alle cabaret- en comedyvoorstellingen van vandaag${waar}, met de tijd, de zaal en een link naar de kaartverkoop. Hieronder staat ook alvast morgen.`
        : `Alle cabaret- en comedyvoorstellingen${waar} van vrijdag tot en met zondag, van theatercabaret tot stand-up in comedyclubs, met de tijd, de zaal en een link naar de kaartverkoop.`}
        Kaarten koop je bij het theater; controleer daar ook of een voorstelling is uitverkocht.</p>
      <nav class="dag-nav" aria-label="Meer">${[andereLink, p ? `<a href="${plaatsPad(p)}">Alle voorstellingen in ${esc(p)}</a>` : `<a href="/agenda/">De hele agenda</a>`].filter(Boolean).join("")}</nav>
      ${p ? uitgelichtBlok("plaats", p) : uitgelichtBlok("agenda")}
      ${filters(list)}
      <div id="gigs">${dagGroepen(list)}</div>
      ${leegBlok}
      <div class="empty" id="dag-leeg"${list.length ? " hidden" : ""}><p>${avond ? "Vanavond" : "Dit weekend"} staat er${waar} niets in de agenda. Bekijk <a href="${p ? plaatsPad(p) : "/agenda/"}">de eerstvolgende voorstellingen</a>.</p></div>
      ${steden.length ? `<h2 class="sub-head">${esc(hoofdletter(wanneer))} per plaats</h2><p class="city-chips">${steden.join("")}</p>` : ""}
    </section>`;
    const desc = kort(`${titel}: ${plural(nVandaag, "voorstelling", "voorstellingen")} op ${periode}${list.length ? `, met ${opsomming([...new Set(list.flatMap((g) => V.get(g.voorstelling).artiesten))].slice(0, 3).map((a) => A.get(a).naam))}` : ""}. Met tijden, zalen en tickets.`);
    const kruimels = p ? [["Plaatsen", "/plaatsen/"], [p, plaatsPad(p)], [hoofdletter(wanneer), dagPad(soort, p)]] : [[hoofdletter(wanneer), dagPad(soort)]];
    return layout({ title: titel, description: desc, path: dagPad(soort, p), section: "agenda", body, schema: { type: "CollectionPage", kruimels, ...(p ? { over: plaatsLd(p) } : {}), extra: eventsLd(list) } });
  }

  // Blok bovenaan een plaatspagina: wat er vanavond en dit weekend is, of de eerstvolgende voorstelling.
  function dagBlok(p, list) {
    // De komende zeven dagen (vandaag plus zes), zodat het blok ook op zondag gevuld is.
    const tot = dagPlus(vandaagDag, 6);
    const binnenkort = list.filter((g) => g.datum <= tot && g.status !== "geannuleerd");
    if (!binnenkort.length) {
      const g = list.find((x) => x.status !== "geannuleerd");
      return g ? `<p class="dag-blok-leeg"><b>Deze week</b> staat er in ${esc(p)} niets in de agenda. Eerstvolgende: ${esc(fmt.long(g.datum))}, ${esc(V.get(g.voorstelling).artiesten.map((a) => A.get(a).naam).join(" en ") || V.get(g.voorstelling).titel)} in ${esc(T.get(g.theater).naam)}.</p>` : "";
    }
    // Kaartjes in de kleur van de artiest, zoals de affiches: alles van de komende zeven dagen, in een
    // affichewand (strip) die opzij schuift; de actieve kaart komt naar voren (agenda.js, zoals de affiches).
    // Het hele kaartje is de link naar de kaartverkoop (class "tickets" en ticketData() voor de klikmeting).
    // Nooit twee kaartjes van dezelfde kleur naast elkaar: de volgorde (op datum) blijft, de kleur schuift.
    const kaartjes = afwisselend(binnenkort, (g) => leadInk(g.voorstelling), { schuiven: false }).map(({ x: g, kleur }) => {
      const v = V.get(g.voorstelling);
      const kopen = !["uitverkocht", "geannuleerd", "verplaatst"].includes(g.status);
      const wie = artistNames(g.voorstelling) || v.titel;
      return `<a class="dag-kaart tickets dag-tickets${kopen ? "" : " ghost"}" href="${esc(metUtm(g.bron))}" target="_blank" rel="noopener nofollow" data-datum="${g.datum}" style="${ink(kleur)}"${ticketData(g)}>
            <span class="dk-dag dag-label" data-dag="${g.datum}">${g.datum === vandaagDag ? "Vanavond" : g.datum === morgenDag ? "Morgen" : hoofdletter(fmt.weekday(g.datum))}</span>
            <span class="dk-datum">${fmt.day(g.datum)} ${fmt.monthShort(g.datum)}</span>
            <span class="dk-waar">${g.tijd ? `${g.tijd} · ` : ""}${esc(T.get(g.theater).naam)}</span>
            <span class="dk-wie">${esc(wie)}</span>
            <span class="dk-knop${kopen ? "" : " ghost"}">${kopen ? "Tickets" : g.status === "uitverkocht" ? "Uitverkocht" : esc(STATUSSEN[g.status])}${ICON.extern}</span>
            <span class="visually-hidden">: ${esc(wie)} op ${esc(fmt.full(g.datum))} in ${esc(T.get(g.theater).naam)} (externe website, opent in een nieuw tabblad)</span>
          </a>`;
    }).join("");
    return `<section class="dag-blok" aria-labelledby="dag-blok-t">
        <h2 id="dag-blok-t">Deze week in ${esc(p)}</h2>
        ${strip("strip-dag", `Deze week in ${p}`, kaartjes).replace('class="strip"', 'class="strip dag-kaarten"')}
      </section>`;
  }

  function plaatsPagina(p) {
    const list = perPlaats(p);
    const zalen = zalenMetData.filter((t) => t.plaats === p);
    // Kop zoals op de homepage en /agenda/: grote zwarte letters op wit, geen kleurvlak.
    const body = `<section class="block wrap kop-plaats" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Theater in ${esc(p)}</h1><p>${plural(list.length, "aankomende voorstelling", "aankomende voorstellingen")} in ${plural(zalen.length, "theater", "theaters")}</p></div>
    </section>
      <div class="wrap detail-body">
        ${dagBlok(p, list)}
        ${uitgelichtBlok("plaats", p)}
        ${filters(list, { maand: true })}
        <div id="gigs">${monthGroups(list)}</div>
        ${leegBlok}
        ${heeftGenrePlaats("cabaret", p) || heeftGenrePlaats("kindervoorstellingen", p) ? `<p class="meer-link">${[heeftGenrePlaats("cabaret", p) && `<a href="/agenda/cabaret/${plaatsId(p)}/">Alleen cabaret in ${esc(p)}</a>`, heeftGenrePlaats("kindervoorstellingen", p) && `<a href="/agenda/kindervoorstellingen/${plaatsId(p)}/">Kindervoorstellingen in ${esc(p)}</a>`].filter(Boolean).join(" · ")}</p>` : ""}
        ${plaatsTekst(p, list)}
        ${list.length ? faqHtml(plaatsVragen(p, list), `Veelgestelde vragen over theater in ${p}`) : ""}
      </div>`;
    const desc = kort(`Theater in ${p}: ${plural(list.length, "voorstelling", "voorstellingen")} in ${zalen.length === 1 ? zalen[0].naam : `${zalen.length} theaters, zoals ${telPer(list, (g) => g.theater).slice(0, 2).map(([id]) => T.get(id).naam).join(" en ")}`}. Cabaret, comedy, komisch theater en kindervoorstellingen.`);
    return layout({ title: `Theater in ${p}: agenda en voorstellingen`, description: desc, path: plaatsPad(p), section: "plaatsen", body, schema: { type: "CollectionPage", kruimels: [["Plaatsen", "/plaatsen/"], [p, plaatsPad(p)]], over: plaatsLd(p), extra: [...eventsLd(list), ...(list.length ? [faqLd(plaatsVragen(p, list), plaatsPad(p))] : [])] } });
  }

  // Zoekveld, letters en de lijst van A tot Z (public/agenda.js filtert op #f-artiest en #az).
  function azLijst(items, { zoekLabel = "Zoek een artiest" } = {}) {
    const opNaam = [...items].sort((x, y) => x.a.naam.localeCompare(y.a.naam, "nl", { sensitivity: "base" }));
    const letter = (n) => { const c = n.normalize("NFD")[0].toUpperCase(); return /[A-Z]/.test(c) ? c : "#"; };
    const groepen = new Map();
    for (const x of opNaam) {
      const l = letter(x.a.naam);
      if (!groepen.has(l)) groepen.set(l, []);
      groepen.get(l).push(x);
    }
    return `<div class="az-tools">
        <div class="field search">
          <label for="f-artiest">${esc(zoekLabel)}</label>
          <input id="f-artiest" type="search" autocomplete="off" placeholder="Bijvoorbeeld: Kroos">
        </div>
        <nav class="letters" aria-label="Spring naar letter">${[...groepen.keys()].map((l) => `<a href="#letter-${l === "#" ? "0" : l}">${l}</a>`).join("")}</nav>
      </div>
      <div class="az" id="az">${[...groepen].map(([l, items]) => `<section class="az-group" id="letter-${l === "#" ? "0" : l}">
        <h3>${l}</h3>
        <ul>${items.map(({ a, list }) => `<li data-naam="${esc(a.naam.toLowerCase())}"><a href="${artiestPad(a.id)}"><span class="swatch" style="${ink(a.kleur)};background:var(--bg)" aria-hidden="true"></span><span class="an">${esc(a.naam)}</span><span class="ad">vanaf ${fmt.dayMonth(list[0].datum)} in ${esc(T.get(list[0].theater).plaats)}</span><span class="ac">${plural(list.length, "datum", "data")}</span></a></li>`).join("")}</ul>
      </section>`).join("")}</div>
      <p class="empty" id="az-leeg" hidden>Geen artiest gevonden met deze naam.</p>`;
  }

  function artistIndex() {
    const nu = nuInTheater();
    const body = `<div class="wrap block-head kop-artiesten"><h1 id="t">Artiesten</h1><p>${tellers.artiesten} cabaretiers, comedians en gezelschappen met aankomende voorstellingen.</p></div>
    ${nu ? `<section class="wall wall-sub" aria-labelledby="nu-title">
      <div class="wrap wall-head">
        <h2 id="nu-title">Nu op tournee</h2>
      </div>
      ${strip("strip-nu", "Voorstellingen die nu op tournee zijn", nu)}
    </section>` : ""}
    <section class="block wrap az-blok" aria-labelledby="az-titel">
      <h2 class="sub-head" id="az-titel">Van A tot Z</h2>
      ${azLijst(artiestenMetData)}
      <p class="zie-ook">Bekijk ook: <a href="/alle-cabaretiers/">alle cabaretiers</a>, <a href="/alle-cabaretiers/vrouwen/">vrouwelijke cabaretiers</a> en <a href="/alle-cabaretiers/mannen/">mannelijke cabaretiers</a>.</p>
    </section>`;
    return layout({ title: "Artiesten op tournee: cabaret en comedy", description: kort(`${plural(artiestenMetData.length, "artiest", "artiesten")} met aankomende voorstellingen in Nederland en België, van A tot Z: cabaretiers, comedians en groepen, met hun speeldata en kaarten.`), path: "/artiesten/", section: "artiesten", body, schema: { type: "CollectionPage", kruimels: [["Artiesten", "/artiesten/"]], hoofd: lijstLd([...artiestenMetData].sort((x, y) => x.a.naam.localeCompare(y.a.naam, "nl")).map(({ a }) => [a.naam, `/artiesten/${a.id}/`])) } });
  }

  // ---------- Tekst onder artiest- en theaterpagina's ----------
  // Alles komt uit de agenda zelf: geen verzonnen biografie, alleen wat de speeldata laten zien.
  // ---------- Cabaretiers: /alle-cabaretiers/, /mannen/ en /vrouwen/ (SEO-pagina's, niet in het menu) ----------

  // Clubavonden, festivals, kwissen en reeksen zijn geen cabaretier.
  const GEEN_CABARETIER = /\b(festival|club|kwis|cabarestafette|agency|producties|stichting|comedians|finalisten|finalistentour|tournee|open mic|night|marathon|theaterweekend|bingo|lacht|show|revue|vibe)\b/i;
  // Wie alleen kindervoorstellingen speelt, is geen cabaretier: die staat niet op /alle-cabaretiers/.
  const cabaretiers = artiestenMetData.filter(({ a, list }) => !GEEN_CABARETIER.test(a.naam) && list.some((g) => V.get(g.voorstelling).genre !== "kindervoorstellingen"));
  const kaal = (html) => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
  const artiestLink = (a) => `<a href="${artiestPad(a.id)}">${esc(a.naam)}</a>`;
  const CABARETIER_PAGINAS = {
    alle: { pad: "/alle-cabaretiers/", naam: "Alle cabaretiers", wie: "cabaretiers", filter: () => true },
    vrouw: { pad: "/alle-cabaretiers/vrouwen/", naam: "Vrouwelijke cabaretiers", wie: "vrouwelijke cabaretiers", filter: ({ a }) => a.geslacht === "vrouw" },
    man: { pad: "/alle-cabaretiers/mannen/", naam: "Mannelijke cabaretiers", wie: "mannelijke cabaretiers", filter: ({ a }) => a.geslacht === "man" },
  };

  function faqHtml(vragen, titel = "Veelgestelde vragen") {
    return `<section class="faq" aria-labelledby="faq-titel">
        <h2 id="faq-titel">${esc(titel)}</h2>
        ${vragen.map(([v, a]) => `<details>
          <summary><h3>${esc(v)}</h3></summary>
          <p>${a}</p>
        </details>`).join("\n        ")}
      </section>`;
  }
  const faqLd = (vragen, pad) => ({
    "@type": "FAQPage", "@id": URL(pad) + "#faq",
    mainEntity: vragen.map(([v, a]) => ({ "@type": "Question", name: v, acceptedAnswer: { "@type": "Answer", text: kaal(a) } })),
  });

  function cabaretiersPagina(soort) {
    const P = CABARETIER_PAGINAS[soort];
    const items = cabaretiers.filter(P.filter);
    const gigs = items.flatMap((x) => x.list);
    const opTournee = [...items].sort((x, y) => y.list.length - x.list.length);
    const top = opTournee.slice(0, 8);
    const steden = telPer(gigs, (g) => T.get(g.theater).plaats);
    const zalen = telPer(gigs, (g) => g.theater);
    const oudejaars = opTournee.filter(({ list }) => list.some((g) => heeftGenre(g, "oudejaarsconference")));
    // "A, B, C en nog 4 anderen"
    const enMeer = (lijst, max) => lijst.length > max ? `${lijst.slice(0, max).join(", ")} en nog ${lijst.length - max} anderen` : opsomming(lijst);
    const tryouts = gigs.filter((g) => g.soort === "try-out" && g.status !== "geannuleerd");
    const binnenkort = [...gigs].sort((x, y) => x.datum.localeCompare(y.datum) || (x.tijd || "").localeCompare(y.tijd || "")).slice(0, 5);
    const belgen = items.filter(({ a, list }) => a.land === "BE" || list.every((g) => T.get(g.theater).land === "BE"));
    const andere = Object.entries(CABARETIER_PAGINAS).filter(([k]) => k !== soort).map(([, p]) => `<a href="${p.pad}">${esc(p.naam.toLowerCase())}</a>`);
    const zin = (x) => `${artiestLink(x.a)} (${keer(x.list.length)})`;
    const standup = opTournee.filter(({ list }) => list.some((g) => heeftGenre(g, "stand-up")));
    // Een naam met gewone woorden erin ("DDT houdt uitverkoop") is een titel, geen artiest.
    const LOS = new Set(["van", "de", "den", "der", "het", "ten", "ter", "en", "&", "la", "le"]);
    const lijktArtiest = (n) => n.split(/\s+/).every((w) => !/^\p{Ll}/u.test(w) || LOS.has(w));
    const vlaams = opTournee.filter((x) => belgen.includes(x) && lijktArtiest(x.a.naam));
    const mannen = cabaretiers.filter(CABARETIER_PAGINAS.man.filter).sort((x, y) => y.list.length - x.list.length);
    const vrouwen = cabaretiers.filter(CABARETIER_PAGINAS.vrouw.filter).sort((x, y) => y.list.length - x.list.length);
    const festivalLinks = festivalsMetData.slice(0, 4).map(({ f }) => `<a href="/festivals/${f.id}/">${esc(f.naam)}</a>`);
    const namen = (lijst, n) => opsomming(lijst.slice(0, n).map(({ a }) => artiestLink(a)));

    const intro = {
      alle: `Op Cabaretiers.com vind je ${items.length} cabaretiers en comedians die de komende tijd in Nederland en België op het podium staan, samen goed voor ${plural(gigs.length, "voorstelling", "voorstellingen")} in ${plural(steden.length, "plaats", "plaatsen")}. Van grote namen in de schouwburg tot nieuw talent in een kleine zaal: per cabaretier zie je waar en wanneer je kunt gaan kijken.`,
      vrouw: `${items.length} vrouwelijke cabaretiers en comedians staan de komende tijd op het podium, samen goed voor ${plural(gigs.length, "voorstelling", "voorstellingen")} in ${plural(steden.length, "plaats", "plaatsen")}. Op zoek naar een vrouwelijke cabaretier, een cabaretière of een comedienne? Hieronder vind je ze allemaal, met hun speeldata in Nederland en België.`,
      man: `${items.length} mannelijke cabaretiers en comedians staan de komende tijd op het podium, samen goed voor ${plural(gigs.length, "voorstelling", "voorstellingen")} in ${plural(steden.length, "plaats", "plaatsen")}. Hieronder vind je ze allemaal, met hun speeldata in Nederland en België.`,
    }[soort];

    // Lopende tekst, uit de gegevens van de agenda. De kopjes volgen de zoektermen uit Search Console
    // (cabaretier, Nederlandse cabaretiers, bekende cabaretiers, comedian, komiek, conferencier, stand-up, Vlaamse comedians).
    const tekst = [];
    const plaatsZin = `De meeste voorstellingen zijn in ${opsomming(steden.slice(0, 4).map(([p, n]) => `${plaatsLink(p)} (${n})`))}${zalen.length ? `, en ${theaterLink(zalen[0][0])} programmeert ${P.wie} het vaakst` : ""}.`;
    if (soort === "alle") {
      tekst.push(`<h2>Nederlandse cabaretiers</h2>
        <p>Een cabaretier maakt een avondvullende voorstelling met humor, verhalen, liedjes en vaak een scherpe kijk op de maatschappij. Nederland en Vlaanderen hebben een rijke cabarettraditie, en elk seizoen gaan er honderden cabaretiers op tournee langs schouwburgen, theaters en comedyclubs. Op deze pagina staan alle cabaretiers die nu met een voorstelling in de agenda staan: ${items.length} in totaal.</p>
        <h2>De grote drie van het Nederlandse cabaret</h2>
        <p>Wie het over de geschiedenis van het Nederlandse cabaret heeft, noemt vaak de grote drie: Wim Kan, Toon Hermans en Wim Sonneveld. In de jaren vijftig en zestig legden zij de basis voor het cabaret zoals we het nu kennen. Wim Kan (1911–1983) maakte met Corry Vonk het ABC-cabaret en maakte de oudejaarsconference tot een jaarlijkse traditie. Toon Hermans (1916–2000) bracht de onemanshow naar het theater, met grappen, gedichten en liedjes. Wim Sonneveld (1917–1974) werd geliefd om typetjes als Frater Venantius en Nikkelen Nelis en om zijn lied <em>Het dorp</em>. De cabaretiers die nu op tournee zijn, bouwen voort op wat zij begonnen.</p>
        <h2>Bekende cabaretiers van dit moment</h2>
        <p>De bekendste cabaretiers zijn vaak ook de drukste: ${opsomming(top.slice(0, 5).map(zin))} staan de komende tijd het vaakst op het podium. ${plaatsZin}</p>`);
      if (mannen.length && vrouwen.length) tekst.push(`<h2>Cabaretiers: mannen en vrouwen</h2>
        <p>Zoek je een mannelijke cabaretier, of juist een cabaretière? Bij de <a href="/alle-cabaretiers/mannen/">mannelijke cabaretiers</a> vind je onder anderen ${namen(mannen, 4)}. Bij de <a href="/alle-cabaretiers/vrouwen/">vrouwelijke cabaretiers</a> staan onder anderen ${namen(vrouwen, 4)}.</p>`);
      tekst.push(`<h2>Cabaretier, comedian, komiek of conferencier?</h2>
        <p>Een cabaretier speelt een voorstelling met een verhaal of thema, vaak met liedjes en serieuze momenten tussen de grappen. Een comedian of stand-upcomedian staat met een microfoon op het podium en brengt vooral grappen en verhalen, los van een decor. Komiek is het algemene woord voor iemand die mensen aan het lachen maakt. Een conferencier is een ouder woord voor een cabaretier die een avond aan elkaar praat; je kent het nog van de oudejaarsconference. Veel Nederlandse comedians en komieken doen allebei: cabaret én stand-up.</p>`);
      if (standup.length) tekst.push(`<h2>Stand-upcomedians in Nederland</h2>
        <p>Liever stand-upcomedy? Comedians als ${namen(standup, 6)} staan de komende tijd op het podium, in theaters en comedyclubs. In de <a href="/agenda/">agenda</a> zie je alle comedyavonden per maand.</p>`);
      if (vlaams.length) tekst.push(`<h2>Comedians in Vlaanderen en België</h2>
        <p>Ook in Vlaanderen en de rest van België staan comedians en cabaretiers op het podium, van Vlaamse stand-up tot Nederlandse cabaretiers op tournee. In België spelen de komende tijd onder anderen ${namen(vlaams, 8)}.</p>`);
      if (festivalLinks.length) tekst.push(`<h2>Nieuwe en jonge cabaretiers</h2>
        <p>Jonge cabaretiers beginnen vaak op een cabaretfestival. Daar strijden nieuwe talenten om een prijs en een plek in het theater. Bekijk de finalisten van ${opsomming(festivalLinks)} bij de <a href="/festivals/">cabaretfestivals</a>.</p>`);
    } else {
      tekst.push(`<h2>Bekende ${esc(P.wie)}</h2>
        <p>Het vaakst te zien de komende tijd: ${opsomming(top.slice(0, 5).map(zin))}. ${plaatsZin}</p>`);
      if (soort === "vrouw") {
        const nl = opTournee.filter((x) => !belgen.includes(x)), be = vlaams;
        tekst.push(`<h2>Cabaretier, cabaretière of comedienne?</h2>
        <p>Een vrouwelijke cabaretier heet ook wel een cabaretière; wie vooral stand-up doet, is een comedian of comedienne. Op deze pagina staan ze samen: ${plural(items.length, "vrouwelijke cabaretier", "vrouwelijke cabaretiers")} met ${plural(gigs.length, "voorstelling", "voorstellingen")} in de agenda${nl.length && be.length ? `, waarvan ${nl.length} uit Nederland en ${be.length} uit Vlaanderen` : ""}.</p>`);
      }
      if (standup.length) tekst.push(`<h2>${soort === "vrouw" ? "Vrouwelijke" : "Mannelijke"} stand-upcomedians</h2>
        <p>Niet alleen cabaret: ook ${soort === "vrouw" ? "vrouwelijke" : "mannelijke"} comedians als ${namen(standup, 5)} staan op het podium met stand-upcomedy.</p>`);
    }
    if (oudejaars.length) tekst.push(`<h2>Oudejaarsconference</h2>
        <p>Aan het eind van het jaar blikken cabaretiers traditioneel terug in een oudejaarsconference. Dit seizoen spelen ${enMeer(oudejaars.map(({ a }) => artiestLink(a)), 6)} een oudejaarsvoorstelling.</p>`);
    if (tryouts.length) tekst.push(`<h2>Try-outs: als eerste kijken</h2>
        <p>Voordat een nieuwe voorstelling in première gaat, spelen cabaretiers vaak try-outs: de voorstelling is dan nog in ontwikkeling en de kaartjes zijn meestal goedkoper. Er staan nu ${plural(tryouts.length, "try-out", "try-outs")} in de agenda, onder meer van ${opsomming([...new Set(tryouts.map((g) => V.get(g.voorstelling).artiesten[0]))].slice(0, 4).map((id) => artiestLink(A.get(id))))}.</p>`);
    tekst.push(`<h2>Cabaretiers bij jou in de buurt</h2>
        <p>Zoek je een voorstelling dicht bij huis? Bekijk het aanbod per plaats, bijvoorbeeld in ${opsomming(steden.slice(0, 6).map(([p]) => plaatsLink(p)))}, of kijk in de <a href="/agenda/">agenda per maand</a>. Alle zalen staan bij de <a href="/theaters/">theaters</a>, en nieuw talent zie je vaak op de <a href="/festivals/">cabaretfestivals</a>.</p>`);

    const vragen = soort === "alle" ? [
      ["Wat is een cabaretier?", "Een cabaretier is een artiest die een theatervoorstelling maakt met humor, vaak afgewisseld met liedjes en serieuze momenten. Kenmerkend is de persoonlijke en maatschappelijke kijk op de wereld. Een vrouwelijke cabaretier heet ook wel een cabaretière."],
      ["Wat is het verschil tussen cabaret en stand-up comedy?", "Cabaret is een avondvullende voorstelling met een rode draad, vaak met liedjes en een decor. Stand-up comedy is losser: een comedian vertelt grappen en verhalen, meestal alleen met een microfoon. Veel artiesten doen allebei; op deze site vind je ze samen."],
      ["Welke cabaretiers staan nu het vaakst op het podium?", `De komende tijd zijn ${opsomming(top.slice(0, 5).map(zin))} het vaakst te zien.`],
      ...(oudejaars.length ? [["Welke cabaretiers spelen een oudejaarsconference?", `Dit seizoen spelen onder meer ${opsomming(oudejaars.slice(0, 6).map(({ a }) => artiestLink(a)))} een oudejaarsvoorstelling.`]] : []),
      ["Welke cabaretiers zijn er in Nederland?", `Op dit moment staan ${items.length} cabaretiers en comedians met voorstellingen in de agenda, van ${artiestLink(opTournee[0].a)} tot nieuw talent. De lijst van A tot Z hierboven toont ze allemaal, met hun speeldata.`],
      ["Hoe schrijf je cabaretier?", "Cabaretier, met één b en één r, van het Franse woord cabaret. Schrijfwijzen als cabaratier, caberatier of caberetier zijn niet juist. Een vrouwelijke cabaretier is een cabaretière."],
      ["Wat is een conferencier?", "Een conferencier is een ouder woord voor een cabaretier die een avond aan elkaar praat, met grappen en commentaar op de actualiteit. Het woord leeft voort in de oudejaarsconference."],
      ["Wat is een try-out?", `Een try-out is een voorstelling van een nieuw programma vóór de première. De cabaretier test dan wat werkt, en kaartjes zijn vaak goedkoper. Er staan nu ${plural(tryouts.length, "try-out", "try-outs")} in de agenda.`],
      ["Waar kan ik cabaretiers zien?", `In ${plural(tellers.zalen, "zaal", "zalen")} in ${plural(tellers.plaatsen, "plaats", "plaatsen")} in Nederland en België, van grote schouwburgen tot comedyclubs. Kijk per <a href="/plaatsen/">plaats</a> of per <a href="/theaters/">theater</a>.`],
      ["Staan oude of overleden cabaretiers ook op de lijst?", "Nee. Deze lijst toont cabaretiers die nu met een voorstelling in de agenda staan. Wie niet meer optreedt, staat er niet bij."],
      ["Hoe actueel is deze lijst?", "De speellijsten van de theaters worden elke nacht opnieuw opgehaald. Elke speeldatum linkt naar de bron. Wijzigingen zijn altijd voorbehouden: controleer de datum bij het theater voordat je kaartjes koopt."],
    ] : [
      [soort === "vrouw" ? "Wie zijn bekende vrouwelijke cabaretiers?" : "Wie zijn bekende mannelijke cabaretiers?", `De komende tijd staan ${opsomming(top.slice(0, 6).map(zin))} het vaakst op het podium.`],
      ...(soort === "vrouw" ? [["Hoe heet een vrouwelijke cabaretier?", "Een vrouwelijke cabaretier heet een cabaretière. In het dagelijks taalgebruik wordt ook gewoon cabaretier gezegd; een vrouwelijke stand-upcomedian heet ook wel comedienne."],
        ["Hoeveel vrouwelijke cabaretiers staan er nu in de agenda?", `${plural(items.length, "vrouwelijke cabaretier", "vrouwelijke cabaretiers")}, samen goed voor ${plural(gigs.length, "voorstelling", "voorstellingen")} in ${plural(steden.length, "plaats", "plaatsen")}. De lijst van A tot Z hierboven toont ze allemaal.`],
        ...(standup.length ? [["Welke vrouwelijke comedians doen stand-up?", `Onder meer ${namen(standup, 6)}.`]] : [])] : []),
      [soort === "vrouw" ? "Welke cabaretières staan binnenkort in het theater?" : "Welke mannelijke cabaretiers staan binnenkort in het theater?", `Binnenkort: ${opsomming(binnenkort.map((g) => `${artiestLink(A.get(V.get(g.voorstelling).artiesten.find((id) => items.some((x) => x.a.id === id))))} op ${fmt.dayMonth(g.datum)} in ${esc(T.get(g.theater).plaats)}`))}.`],
      ...(oudejaars.length ? [[soort === "vrouw" ? "Welke vrouwelijke cabaretiers spelen een oudejaarsconference?" : "Welke mannelijke cabaretiers spelen een oudejaarsconference?", `Dit seizoen onder meer ${opsomming(oudejaars.slice(0, 6).map(({ a }) => artiestLink(a)))}.`]] : []),
      ...(belgen.length ? [[soort === "vrouw" ? "Spelen er ook cabaretières in België?" : "Spelen er ook cabaretiers in België?", `Ja, in België spelen de komende tijd onder meer ${opsomming(belgen.filter(({ a }) => lijktArtiest(a.naam)).slice(0, 5).map(({ a }) => artiestLink(a)))}.`]] : []),
      [soort === "vrouw" ? "Staat een cabaretière er niet tussen?" : "Staat een cabaretier er niet tussen?", `Deze lijst is gebaseerd op openbare gegevens van Wikipedia en Wikidata. Wie daar (nog) niet in staat, vind je bij <a href="/alle-cabaretiers/">alle cabaretiers</a> of in het overzicht van <a href="/artiesten/">alle artiesten</a>.`],
    ];

    // Affiches met promobeeld van deze cabaretiers, net als op de homepage; zijn die er niet, dan kaarten.
    const ids = new Set(items.map(({ a }) => a.id));
    const affiches = nuInTheater((id) => ids.has(id));
    // Binnenkort te zien: van de drukst toerende cabaretiers de eerstvolgende voorstelling waarvoor nog
    // kaarten zijn (anders de eerstvolgende), op datum. Eén per voorstelling, zodat duo's niet dubbel staan.
    const gezien = new Set();
    const eerstvolgend = opTournee.slice(0, 16).map(({ list }) => list.find((g) => !["uitverkocht", "geannuleerd", "verplaatst"].includes(g.status)) || list[0])
      .filter((g) => g && !gezien.has(g.voorstelling) && gezien.add(g.voorstelling)).slice(0, 12)
      .sort((x, y) => x.datum.localeCompare(y.datum) || (x.tijd || "").localeCompare(y.tijd || ""));
    const kopTournee = soort === "alle" ? "Bekende cabaretiers op tournee" : `Bekende ${esc(P.wie)} op tournee`;
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">${esc(P.naam)}</h1><p>${intro}</p></div>
      ${soort === "alle" ? "" : `<p class="zie-ook">Bekijk ook de ${andere.join(", de ")} of <a href="/artiesten/">alle artiesten</a>.</p>`}
      ${affiches ? "" : `<h2 class="sub-head">${kopTournee}</h2>
      <div class="artists">${artiestKaarten(top)}</div>`}
    </section>
    ${affiches ? `<section class="wall wall-sub" aria-labelledby="nu-title">
      <div class="wrap wall-head">
        <h2 id="nu-title">${kopTournee}</h2>
      </div>
      ${strip("strip-nu", kopTournee, affiches)}
    </section>` : ""}
    <section class="block wrap binnenkort-blok" aria-labelledby="binnenkort-titel">
      <h2 class="sub-head" id="binnenkort-titel">Binnenkort te zien</h2>
      <p class="binnenkort-intro">De eerstvolgende voorstelling van de ${soort === "alle" ? "drukst toerende cabaretiers" : `drukst toerende ${esc(P.wie)}`}, met kaartjes bij het theater.</p>
      ${monthGroups(eerstvolgend)}
      <p class="meer-link"><a href="/agenda/">Alle voorstellingen in de agenda</a></p>
    </section>
    <section class="block wrap az-blok" aria-labelledby="az-titel">
      <h2 class="sub-head" id="az-titel">${esc(P.naam)} van A tot Z</h2>
      ${azLijst(items, { zoekLabel: soort === "vrouw" ? "Zoek een cabaretière" : "Zoek een cabaretier" })}
      <div class="seo-tekst prose">
        ${tekst.join("\n        ")}
      </div>
      ${faqHtml(vragen)}
    </section>`;
    const kruimels = soort === "alle" ? [["Alle cabaretiers", P.pad]] : [["Alle cabaretiers", "/alle-cabaretiers/"], [soort === "vrouw" ? "Vrouwen" : "Mannen", P.pad]];
    const jaar = db.today.slice(0, 4);
    const titel = { alle: `Cabaretiers: alle Nederlandse en Vlaamse cabaretiers (${jaar})`, vrouw: `Vrouwelijke cabaretiers: lijst van bekende cabaretières (${jaar})`, man: `Mannelijke cabaretiers: bekende Nederlandse cabaretiers (${jaar})` }[soort];
    const desc = { alle: zinnen(`Lijst van ${items.length} cabaretiers en comedians, van A tot Z: bekende namen, mannen en vrouwen, met hun speellijst ${SEIZOEN}.`, "Met kaarten via het theater."),
      vrouw: zinnen(`Welke vrouwelijke cabaretiers zijn er? Een lijst van ${items.length} Nederlandse en Vlaamse cabaretières, met hun speellijst.`, `Zoals ${opsomming(top.slice(0, 2).map(({ a }) => a.naam))}.`, "Met kaarten via het theater."),
      man: zinnen(`Welke mannelijke cabaretiers zijn er? Een lijst van ${items.length} Nederlandse en Vlaamse cabaretiers en comedians, met hun speellijst.`, `Zoals ${opsomming(top.slice(0, 2).map(({ a }) => a.naam))}.`, "Met kaarten via het theater.") }[soort];
    return layout({ title: titel, description: desc, path: P.pad, section: "artiesten", body, schema: { type: "CollectionPage", kruimels,
      hoofd: lijstLd([...items].sort((x, y) => x.a.naam.localeCompare(y.a.naam, "nl")).map(({ a }) => [a.naam, `/artiesten/${a.id}/`])),
      extra: [faqLd(vragen, P.pad)] } });
  }

  const GENRE_TEKST = {
    cabaret: "cabaret", "stand-up": "stand-up comedy", oudejaarsconference: "oudejaarsconference",
    komedie: "komedie", "open-mic": "open mics", improvisatie: "improvisatietheater",
    festival: "festivals", "muzikaal-cabaret": "muzikaal cabaret", kleinkunst: "kleinkunst", kindervoorstellingen: "kindervoorstelling",
  };
  // Theaterseizoen voor titels ("2026-2027"): vanaf augustus het nieuwe seizoen.
  const SEIZOEN = (() => { const [j, m] = db.today.split("-").map(Number); return m >= 8 ? `${j}-${j + 1}` : `${j - 1}-${j}`; })();
  // Meta-description van hele zinnen: de eerste altijd, de volgende alleen als het geheel onder de 155 tekens
  // blijft (Google kapt langer af). Geen datum van de eerstvolgende voorstelling: Google werkt die niet snel bij.
  const zinnen = (...delen) => delen.filter(Boolean).reduce((uit, z) => (!uit ? z : `${uit} ${z}`.length <= 155 ? `${uit} ${z}` : uit), "");
  const kort = (s, max = 158) => s.length <= max ? s : s.slice(0, s.lastIndexOf(" ", max - 1)) + "…";
  const opsomming = (items) => items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} en ${items.at(-1)}`;
  const telPer = (list, key) => {
    const m = new Map();
    for (const g of list) m.set(key(g), (m.get(key(g)) || 0) + 1);
    return [...m].sort((x, y) => y[1] - x[1] || String(x[0]).localeCompare(String(y[0]), "nl"));
  };
  const keer = (n) => (n === 1 ? "één keer" : `${n} keer`);
  const periode = (list) => list[0].datum === list.at(-1).datum
    ? `op ${fmt.long(list[0].datum)}`
    : `van ${fmt.full(list[0].datum)} tot en met ${fmt.full(list.at(-1).datum)}`;
  const theaterLink = (id) => `<a href="/theaters/${id}/">${esc(T.get(id).naam)}</a>`;
  const plaatsLink = (p) => `<a href="${plaatsPad(p)}">${esc(p)}</a>`;
  const bijzonder = (list, soort) => list.filter((g) => g.soort === soort && g.status !== "geannuleerd");
  const uitverkochtZin = (list) => {
    const u = list.filter((g) => g.status === "uitverkocht").length;
    if (!u) return "";
    return u === list.length ? (list.length === 1 ? " De voorstelling is uitverkocht." : " Alle voorstellingen zijn uitverkocht.") : ` ${u} van de ${list.length} voorstellingen ${u === 1 ? "is" : "zijn"} al uitverkocht.`;
  };
  const kaartenZin = "Kaarten koop je bij de zaal zelf: via de knop <em>Tickets</em> bij elke datum kom je op de speellijst van het theater of de artiest. Cabaretiers.com werkt de agenda elke nacht bij.";

  // Lopende tekst met tussenkoppen over de artiest, uit de agendagegevens.
  function artiestTekst(a, list) {
    if (!list.length) return "";
    const naam = esc(a.naam);
    const titels = [...new Set(list.map((g) => echteTitel(g.voorstelling)).filter(Boolean))];
    const showIds = [...new Set(list.map((g) => g.voorstelling).filter((vid) => echteTitel(vid)))];
    const genres = telPer(list, (g) => V.get(g.voorstelling).genre).map(([k]) => GENRE_TEKST[k]);
    const steden = telPer(list, (g) => T.get(g.theater).plaats);
    const zalen = telPer(list, (g) => g.theater);
    const jaren = [...new Set(list.map((g) => fmt.year(g.datum)))];
    const metTitels = titels.length === 1 ? ` met de voorstelling <em>${esc(titels[0])}</em>`
      : titels.length > 1 ? ` met de voorstellingen ${opsomming(titels.slice(0, 4).map((t) => `<em>${esc(t)}</em>`))}` : "";
    const delen = [];

    delen.push(`<h2 id="over-titel">${naam} live zien in ${opsomming(jaren.map(String))}</h2>
        <p>${naam} staat de komende tijd ${keer(list.length)} op het podium${metTitels}, ${periode(list)}${list.length > 1 ? `. De eerstvolgende voorstelling is op ${fmt.full(list[0].datum)}` : ""} in ${theaterLink(list[0].theater)} in ${plaatsLink(T.get(list[0].theater).plaats)}. Het genre is ${opsomming(genres.slice(0, 2))}.</p>`);

    if (showIds.length) {
      const over = [];
      const premiere = bijzonder(list, "première")[0];
      if (premiere) over.push(`De première is op ${fmt.long(premiere.datum)} in ${theaterLink(premiere.theater)}.`);
      const tryouts = bijzonder(list, "try-out");
      if (tryouts.length) over.push(tryouts.length === 1 ? `Op ${fmt.full(tryouts[0].datum)} is er een try-out in ${theaterLink(tryouts[0].theater)}.` : `${tryouts.length} voorstellingen zijn try-outs, waarbij de voorstelling nog in ontwikkeling is.`);
      const derniere = bijzonder(list, "dernière")[0];
      if (derniere) over.push(`De laatste voorstelling, de dernière, is op ${fmt.long(derniere.datum)} in ${theaterLink(derniere.theater)}.`);
      const perShow = showIds.slice(0, 4).map((vid) => {
        const n = list.filter((g) => g.voorstelling === vid).length;
        const t = esc(V.get(vid).titel);
        return `${voorstellingPad.has(vid) ? `<a href="${voorstellingPad.get(vid)}"><em>${t}</em></a>` : `<em>${t}</em>`}${list.length > 1 ? ` (${keer(n)})` : ""}`;
      });
      delen.push(`<h2>${showIds.length === 1 ? `De voorstelling van ${naam}` : `De voorstellingen van ${naam}`}</h2>
        <p>${showIds.length === 1 ? `${naam} speelt de voorstelling ${perShow[0]}.` : `${naam} speelt ${opsomming(perShow)}.`} ${over.join(" ")}</p>`);
    }

    const waar = [];
    if (steden.length > 1) waar.push(`De tournee komt langs ${plural(steden.length, "plaats", "plaatsen")}: ${steden.length > 8
      ? `${steden.slice(0, 8).map(([p]) => plaatsLink(p)).join(", ")} en nog ${plural(steden.length - 8, "andere plaats", "andere plaatsen")}`
      : opsomming(steden.map(([p]) => plaatsLink(p)))}.`);
    else waar.push(`${list.length === 1 ? "De voorstelling is" : "Alle voorstellingen zijn"} in ${zalen.length === 1 ? `${theaterLink(zalen[0][0])} in ` : ""}${plaatsLink(steden[0][0])}.`);
    if (zalen.length > 1 && zalen[0][1] > 1) waar.push(`Het vaakst is ${naam} te zien in ${theaterLink(zalen[0][0])} in ${esc(T.get(zalen[0][0]).plaats)} (${keer(zalen[0][1])}).`);
    const be = list.some((g) => T.get(g.theater).land === "BE"), nl = list.some((g) => T.get(g.theater).land === "NL");
    if (be && nl) waar.push("De tournee komt zowel in Nederland als in België langs.");
    else if (be) waar.push("Alle voorstellingen zijn in België.");
    delen.push(`<h2>Waar speelt ${naam}?</h2>
        <p>${waar.join(" ")}</p>`);

    // Wie in dezelfde zalen speelt: interne links naar verwante artiesten.
    const mijnZalen = new Set(zalen.map(([id]) => id));
    const partners = new Set(list.flatMap((g) => V.get(g.voorstelling).artiesten));
    const verwant = artiestenMetData.filter(({ a: b }) => !partners.has(b.id) && b.id !== a.id && !GEEN_CABARETIER.test(b.naam))
      .map((x) => ({ ...x, n: new Set(x.list.filter((g) => mijnZalen.has(g.theater)).map((g) => g.theater)).size }))
      .filter((x) => x.n > 0).sort((x, y) => y.n - x.n || y.list.length - x.list.length).slice(0, 5);

    delen.push(`<h2>Kaarten voor ${naam}</h2>
        <p>${kaartenZin}${uitverkochtZin(list)}</p>`);
    if (verwant.length) delen.push(`<h2>Meer cabaret in dezelfde zalen</h2>
        <p>In de theaters waar ${naam} speelt, staan ook ${opsomming(verwant.map(({ a: b }) => `<a href="${artiestPad(b.id)}">${esc(b.naam)}</a>`))} op het programma.</p>`);

    return `<section class="seo-tekst prose" aria-labelledby="over-titel">
        ${delen.join("\n        ")}
      </section>`;
  }

  // Veelgestelde vragen over één artiest; alleen vragen waar de agenda een antwoord op heeft.
  function artiestVragen(a, list) {
    if (!list.length) return [];
    const naam = esc(a.naam);
    const titels = [...new Set(list.map((g) => echteTitel(g.voorstelling)).filter(Boolean))];
    const steden = telPer(list, (g) => T.get(g.theater).plaats);
    const eerste = list[0];
    const vragen = [];
    vragen.push([`Wanneer speelt ${a.naam}?`, list.length === 1
      ? `${naam} speelt de komende tijd één keer: op ${fmt.full(eerste.datum)}${eerste.tijd ? ` om ${eerste.tijd}` : ""} in ${theaterLink(eerste.theater)} in ${esc(T.get(eerste.theater).plaats)}.`
      : `${naam} speelt de komende tijd ${keer(list.length)}, ${periode(list)}. De eerstvolgende voorstelling is op ${fmt.full(eerste.datum)}${eerste.tijd ? ` om ${eerste.tijd}` : ""} in ${theaterLink(eerste.theater)} in ${esc(T.get(eerste.theater).plaats)}.`]);
    vragen.push([`Waar treedt ${a.naam} op?`, steden.length > 1
      ? `In ${plural(steden.length, "plaats", "plaatsen")}, onder meer ${opsomming(steden.slice(0, 6).map(([p]) => plaatsLink(p)))}.`
      : `In ${new Set(list.map((g) => g.theater)).size === 1 ? `${theaterLink(eerste.theater)} in ` : ""}${plaatsLink(steden[0][0])}.`]);
    if (titels.length) vragen.push([titels.length === 1 ? `Wat is de voorstelling van ${a.naam}?` : `Welke voorstellingen speelt ${a.naam}?`,
      `${titels.length === 1 ? `De voorstelling heet <em>${esc(titels[0])}</em>.` : `${opsomming(titels.slice(0, 4).map((t) => `<em>${esc(t)}</em>`))}.`} Het genre is ${opsomming(telPer(list, (g) => V.get(g.voorstelling).genre).slice(0, 2).map(([k]) => GENRE_TEKST[k]))}.`]);
    const be = list.filter((g) => T.get(g.theater).land === "BE");
    if (be.length || a.land === "BE") vragen.push([`Speelt ${a.naam} ook in België?`, be.length
      ? `Ja, ${keer(be.length)}: in ${opsomming([...new Set(be.map((g) => T.get(g.theater).plaats))].map(plaatsLink))}.`
      : "Op dit moment staan er alleen voorstellingen in Nederland in de agenda."]);
    const oud = list.filter((g) => V.get(g.voorstelling).genre === "oudejaarsconference");
    if (oud.length) vragen.push([`Speelt ${a.naam} een oudejaarsconference?`, `Ja, ${naam} speelt dit seizoen een oudejaarsvoorstelling, ${keer(oud.length)}, de eerste op ${fmt.full(oud[0].datum)} in ${theaterLink(oud[0].theater)}.`]);
    const tryouts = bijzonder(list, "try-out");
    if (tryouts.length) vragen.push([`Zijn er try-outs van ${a.naam}?`, `Ja, ${keer(tryouts.length)}, de eerste op ${fmt.full(tryouts[0].datum)} in ${theaterLink(tryouts[0].theater)}. Bij een try-out is de voorstelling nog in ontwikkeling, en kaartjes zijn vaak goedkoper. Alle try-outs staan op <a href="/agenda/try-outs/">try-outs</a>.`]);
    const uit = list.filter((g) => g.status === "uitverkocht");
    const vrij = list.filter((g) => g.status === "gepland");
    vragen.push([`Is ${a.naam} uitverkocht?`, !uit.length
      ? "Bij geen van de voorstellingen meldt het theater dat ze uitverkocht zijn. Kijk voor de beschikbaarheid bij de zaal."
      : uit.length === list.length ? `Ja, ${list.length === 1 ? "de voorstelling is" : "alle voorstellingen in de agenda zijn"} uitverkocht. Soms komen er kaarten vrij via een wachtlijst bij het theater.`
        : `${uit.length} van de ${list.length} voorstellingen ${uit.length === 1 ? "is" : "zijn"} uitverkocht.${vrij.length ? ` De eerstvolgende voorstelling zonder melding van uitverkocht is op ${fmt.full(vrij[0].datum)} in ${theaterLink(vrij[0].theater)}.` : ""}`]);
    vragen.push([`Hoe koop ik kaarten voor ${a.naam}?`, "Kaarten koop je bij het theater zelf. Klik bij een speeldatum op de knop <em>Tickets</em>: die opent de speellijst van de zaal, waar je kaarten kunt bestellen."]);
    return vragen;
  }

  const ZAALSOORT = { theater: "theater", cultuurcentrum: "cultuurcentrum", comedyclub: "comedyclub", café: "café", festivalterrein: "festivalterrein" };

  function theaterTekst(t, list) {
    if (!list.length) return "";
    const genres = telPer(list, (g) => V.get(g.voorstelling).genre);
    const artiestTel = telPer(list.filter((g) => V.get(g.voorstelling).artiesten.length), (g) => V.get(g.voorstelling).artiesten[0]);
    const maanden = telPer(list, (g) => g.datum.slice(0, 7));
    const soort = ZAALSOORT[t.soort];
    const zinnen = [];
    zinnen.push(`<p>${esc(t.naam)} is ${soort ? `een ${soort} ` : ""}in ${plaatsLink(t.plaats)}. Op het programma ${list.length === 1 ? "staat één cabaret- of comedyvoorstelling" : `staan ${list.length} cabaret- en comedyvoorstellingen`}, ${periode(list)}` +
      `${genres.length > 1 ? `: ${opsomming(genres.slice(0, 4).map(([k, n]) => `${n} keer ${GENRE_TEKST[k]}`))}.` : `, allemaal ${GENRE_TEKST[genres[0][0]]}.`}</p>`);
    const p2 = [];
    if (artiestTel.length) {
      const top = artiestTel.slice(0, 6).map(([id]) => `<a href="${artiestPad(id)}">${esc(A.get(id).naam)}</a>`);
      p2.push(artiestTel.length === 1 ? `Op het podium staat ${top[0]}.` : `Er spelen ${artiestTel.length} artiesten, onder wie ${opsomming(top)}.`);
      if (artiestTel.length > 1 && artiestTel[0][1] > 1 && artiestTel[0][1] > artiestTel[1][1]) p2.push(`${esc(A.get(artiestTel[0][0]).naam)} staat er het vaakst (${keer(artiestTel[0][1])}).`);
    }
    if (maanden.length > 1 && maanden[0][1] > 1) p2.push(`De drukste maand is ${fmt.monthYear(maanden[0][0] + "-01")}, met ${maanden[0][1]} voorstellingen.`);
    const premieres = bijzonder(list, "première");
    if (premieres.length) p2.push(`${premieres.length === 1 ? "Première" : "Premières"}: ${opsomming(premieres.slice(0, 3).map((g) => `${esc(artistNames(g.voorstelling))} op ${fmt.dayMonth(g.datum)}`))}.`);
    const tekst = (p2.join(" ") + uitverkochtZin(list)).trim();
    if (tekst) zinnen.push(`<p>${tekst}</p>`);
    // Vroegere naam (Comedytrain was Toomler), met bron.
    if (t.voorheen) zinnen.push(...t.voorheen.alineas.map((a, i, alle) => `<p>${esc(a)}${i === alle.length - 1 ? ` <a href="${esc(t.voorheen.bron)}" rel="noopener">Bron</a>` : ""}</p>`));
    const buren = zalenMetData.filter((x) => x.plaats === t.plaats && x.id !== t.id);
    zinnen.push(`<p>${buren.length
      ? `Meer cabaret en comedy in ${esc(t.plaats)} vind je bij ${opsomming(buren.slice(0, 5).map((x) => theaterLink(x.id)))}, of bekijk <a href="${plaatsPad(t.plaats)}">alle voorstellingen in ${esc(t.plaats)}</a>.`
      : `Bekijk ook <a href="${plaatsPad(t.plaats)}">alle voorstellingen in ${esc(t.plaats)}</a> of de <a href="/agenda/">volledige agenda</a>.`} ${kaartenZin}</p>`);
    return `<section class="seo-tekst prose" aria-labelledby="over-titel">
        <h2 id="over-titel">Cabaret en comedy in ${esc(t.naam)}</h2>
        ${zinnen.join("\n        ")}
      </section>`;
  }

  // "Jochem Myjer op 26 en 27 oktober, Rundfunk op 30 november en 1 december"
  const datums = (d) => {
    d = d.slice(0, 3);
    const zelfdeMaand = d.every((x) => x.slice(0, 7) === d[0].slice(0, 7));
    return zelfdeMaand && d.length > 1
      ? `${opsomming(d.map((x) => String(Number(x.slice(8)))))} ${fmt.dayMonth(d[0]).replace(/^\d+\s*/, "")}`
      : opsomming(d.map((x) => fmt.dayMonth(x)));
  };
  const perNaam = (gigs, max) => {
    const m = new Map();
    for (const g of gigs) { const n = esc(artistNames(g.voorstelling) || V.get(g.voorstelling).titel); m.set(n, [...(m.get(n) || []), g.datum]); }
    return opsomming([...m].slice(0, max).map(([n, d]) => `${n} op ${datums([...new Set(d)])}`)); // twee keer op één dag: de datum één keer
  };

  // Veelgestelde vragen over één zaal; alleen vragen waar de agenda een antwoord op heeft.
  function theaterVragen(t, list) {
    if (!list.length) return [];
    const naam = esc(t.naam);
    const metArtiest = list.filter((g) => V.get(g.voorstelling).artiesten.length);
    const artiestTel = telPer(metArtiest, (g) => V.get(g.voorstelling).artiesten[0]).filter(([id]) => !GEEN_CABARETIER.test(A.get(id).naam));
    const link = (id) => `<a href="${artiestPad(id)}">${esc(A.get(id).naam)}</a>`;
    const wat = (g) => `${esc(artistNames(g.voorstelling) || V.get(g.voorstelling).titel)}${echteTitel(g.voorstelling) ? ` met <em>${esc(echteTitel(g.voorstelling))}</em>` : ""}`;
    const vragen = [];
    if (t.voorheen) vragen.push([`Is ${t.naam} hetzelfde als ${t.voorheen.naam}?`, esc(t.voorheen.alineas.join(" "))]);
    if (artiestTel.length) vragen.push([`Welke cabaretiers spelen in ${t.naam}?`, artiestTel.length === 1
      ? `Op het programma staat ${link(artiestTel[0][0])}.`
      : `${artiestTel.length} artiesten, onder wie ${opsomming(artiestTel.slice(0, 8).map(([id]) => link(id)))}.`]);
    const e = list[0];
    vragen.push([`Wat is de eerstvolgende voorstelling in ${t.naam}?`, `${wat(e)}, op ${fmt.full(e.datum)}${e.tijd ? ` om ${e.tijd}` : ""}.${e.status === "uitverkocht" ? " Deze voorstelling is uitverkocht." : ""}`]);
    const maand = list[0].datum.slice(0, 7), inMaand = list.filter((g) => g.datum.startsWith(maand));
    if (inMaand.length > 1) vragen.push([`Wat is er in ${maandNaam(maand)} te zien in ${t.naam}?`, `${plural(inMaand.length, "voorstelling", "voorstellingen")}: ${perNaam(inMaand, 5)}${new Set(inMaand.map((g) => artistNames(g.voorstelling))).size > 5 ? " en meer" : ""}.`]);
    const oud = list.filter((g) => V.get(g.voorstelling).genre === "oudejaarsconference");
    const oudIds = [...new Set(oud.map((g) => V.get(g.voorstelling).artiesten[0]).filter(Boolean))];
    if (oud.length) vragen.push([`Is er een oudejaarsconference in ${t.naam}?`, `Ja: ${opsomming(oudIds.slice(0, 5).map(link))} ${oudIds.length === 1 ? "speelt" : "spelen"} er een oudejaarsvoorstelling, de eerste op ${fmt.full(oud[0].datum)}.`]);
    const tryouts = bijzonder(list, "try-out");
    if (tryouts.length) vragen.push([`Zijn er try-outs in ${t.naam}?`, `${tryouts.length === 1 ? `Ja, één: van ${esc(artistNames(tryouts[0].voorstelling))} op ${fmt.full(tryouts[0].datum)}` : `Ja, ${tryouts.length}, onder meer van ${opsomming([...new Set(tryouts.map((g) => esc(artistNames(g.voorstelling))))].filter(Boolean).slice(0, 4))}`}. Bij een try-out is de voorstelling nog in ontwikkeling, en kaartjes zijn vaak goedkoper. Alle try-outs staan op <a href="/agenda/try-outs/">try-outs</a>.`]);
    const uit = list.filter((g) => g.status === "uitverkocht");
    if (uit.length) vragen.push([`Welke voorstellingen in ${t.naam} zijn uitverkocht?`, `${uit.length} van de ${list.length}, onder meer ${perNaam(uit, 4)}. Soms komen er kaarten vrij via een wachtlijst bij het theater.`]);
    const soort = ZAALSOORT[t.soort];
    vragen.push([`Waar ligt ${t.naam}?`, `${naam} is ${soort ? `een ${soort} ` : ""}in ${plaatsLink(t.plaats)}, ${LANDEN[t.land]}.${t.website ? ` Het adres en de bereikbaarheid staan op <a href="${esc(metUtm(t.website))}" rel="noopener">de website van ${naam}</a>.` : ""}`]);
    vragen.push([`Hoe koop ik kaarten voor ${t.naam}?`, `Kaarten koop je bij ${naam} zelf. Klik bij een voorstelling op de knop <em>Tickets</em>: die opent de speellijst van het theater, waar je kaarten kunt bestellen.`]);
    const buren = zalenMetData.filter((x) => x.plaats === t.plaats && x.id !== t.id);
    if (buren.length) vragen.push([`Waar is er nog meer cabaret in ${t.plaats}?`, `Ook in ${opsomming(buren.slice(0, 5).map((x) => theaterLink(x.id)))}. Alle voorstellingen staan bij <a href="${plaatsPad(t.plaats)}">theater in ${esc(t.plaats)}</a>.`]);
    return vragen;
  }

  // Lopende tekst met tussenkoppen over een plaats, uit de agendagegevens.
  function plaatsTekst(p, list) {
    if (!list.length) return "";
    const naam = esc(p);
    const zalen = telPer(list, (g) => g.theater);
    const genres = telPer(list, (g) => V.get(g.voorstelling).genre);
    const artiestTel = telPer(list.filter((g) => V.get(g.voorstelling).artiesten.length), (g) => V.get(g.voorstelling).artiesten[0])
      .filter(([id]) => !GEEN_CABARETIER.test(A.get(id).naam));
    const maanden = telPer(list, (g) => g.datum.slice(0, 7));
    const cabaret = list.filter((g) => heeftGenre(g, "cabaret")).length;
    const SOORT = { cultuurcentrum: "cultuurcentrum", comedyclub: "comedyclub", "café": "café" };
    const delen = [];
    // Deze pagina gaat over theater in de plaats (zalen, programma); cabaret heeft een eigen pagina per plaats.
    delen.push(`<h2 id="over-titel">Theater in ${naam}</h2>
        <p>In ${naam} ${list.length === 1 ? "staat één theatervoorstelling" : `staan ${list.length} theatervoorstellingen`} op de agenda, ${periode(list)}, ${zalen.length === 1 ? `in ${theaterLink(zalen[0][0])}` : `in ${zalen.length} theaters en zalen`}.` +
      ` ${genres.length > 1 ? `Op het programma: ${opsomming(genres.slice(0, 4).map(([k, n]) => `${n} keer ${GENRE_TEKST[k]}`))}.` : `Alles is ${GENRE_TEKST[genres[0][0]]}.`}` +
      `${heeftGenrePlaats("cabaret", p) ? ` Zoek je alleen cabaret? Kijk bij <a href="/agenda/cabaret/${plaatsId(p)}/">cabaret in ${naam}</a>.` : ""}` +
      `${heeftGenrePlaats("kindervoorstellingen", p) ? ` Met kinderen? Bekijk de <a href="/agenda/kindervoorstellingen/${plaatsId(p)}/">kindervoorstellingen in ${naam}</a>.` : ""}</p>`);
    delen.push(`<h2>${zalen.length === 1 ? `Het theater in ${naam}` : `Theaters en zalen in ${naam}`}</h2>
        <ul>${zalen.map(([id, n]) => { const t = T.get(id), eerste = list.find((g) => g.theater === id); return `<li>${theaterLink(id)}${SOORT[t.soort] ? ` (${SOORT[t.soort]})` : ""}: ${plural(n, "voorstelling", "voorstellingen")}, de eerste op ${fmt.dayMonth(eerste.datum)}${t.website ? ` (<a href="${esc(metUtm(t.website))}" rel="noopener">website</a>)` : ""}</li>`; }).join("")}</ul>`);
    if (artiestTel.length) {
      const top = artiestTel.slice(0, 8).map(([id, n]) => `<a href="${artiestPad(id)}">${esc(A.get(id).naam)}</a>${n > 1 ? ` (${keer(n)})` : ""}`);
      delen.push(`<h2>Wie staat er op het toneel in ${naam}?</h2>
        <p>${artiestTel.length === 1 ? `Op het programma staat ${top[0]}.` : `${artiestTel.length} artiesten treden de komende tijd op in ${naam}, onder wie ${opsomming(top)}.`}` +
        `${maanden.length > 1 && maanden[0][1] > 1 ? ` De drukste maand in het theater is ${fmt.monthYear(maanden[0][0] + "-01")}, met ${maanden[0][1]} voorstellingen.` : ""}${uitverkochtZin(list)}</p>`);
    }
    // Vanavond en dit weekend (zoektermen als "theater Eindhoven vanavond", "cabaret dit weekend").
    {
      const open = list.filter((g) => g.status !== "geannuleerd");
      const vanavond = open.filter((g) => g.datum === vandaagDag), dw = weekendLijst(open);
      delen.push(`<h2>Vanavond en dit weekend in ${naam}</h2>
        <p>${vanavond.length ? `Vanavond (${esc(fmt.long(vandaagDag))}) ${vanavond.length === 1 ? "staat er één voorstelling" : `staan er ${vanavond.length} voorstellingen`} op het programma: ${avondZin(vanavond, 4)}.` : `Vanavond staat er in ${naam} niets in de agenda.`}` +
        ` ${dw.length ? `Dit weekend, ${esc(weekendPeriode())}, ${dw.length === 1 ? "is er één voorstelling" : `zijn er ${dw.length} voorstellingen`}: ${avondZin(dw, 5, true)}.` : `Dit weekend staat er in ${naam} niets in de agenda.`}` +
        ` Bekijk ook wat er <a href="/vanavond/">vanavond</a> en <a href="/dit-weekend/">dit weekend</a> in heel Nederland en België te zien is.</p>`);
    }
    const bijz = [];
    const tryouts = bijzonder(list, "try-out"), premieres = bijzonder(list, "première");
    if (premieres.length) bijz.push(`${premieres.length === 1 ? "Er is een première" : `Er zijn ${premieres.length} premières`}: ${opsomming(premieres.slice(0, 3).map((g) => `${esc(artistNames(g.voorstelling))} op ${fmt.dayMonth(g.datum)} in ${theaterLink(g.theater)}`))}.`);
    if (tryouts.length) bijz.push(`${tryouts.length === 1 ? `Eén voorstelling is een try-out` : `${tryouts.length} voorstellingen zijn try-outs`}: de voorstelling is dan nog in ontwikkeling, en kaarten zijn vaak goedkoper.`);
    const oud = list.filter((g) => V.get(g.voorstelling).genre === "oudejaarsconference");
    if (oud.length) bijz.push(`Rond de jaarwisseling ${oud.length === 1 ? "is er een oudejaarsvoorstelling" : `zijn er ${oud.length} oudejaarsvoorstellingen`}, van ${opsomming([...new Set(oud.map((g) => esc(artistNames(g.voorstelling))))].slice(0, 4))}.`);
    // De kop noemt alleen wat er is: "Try-outs en premières in Leiden".
    const soorten = [premieres.length && (premieres.length === 1 ? "première" : "premières"), tryouts.length && (tryouts.length === 1 ? "try-out" : "try-outs"), oud.length && "oudejaars"].filter(Boolean);
    if (bijz.length) delen.push(`<h2>${opsomming(soorten).replace(/^./, (c) => c.toUpperCase())} in ${naam}</h2>
        <p>${bijz.join(" ")}</p>`);
    // Plaatsen waar dezelfde artiesten ook spelen (in hetzelfde land), het meest overlappend eerst.
    const land = landVanPlaats(p);
    const hier = new Set(list.flatMap((g) => V.get(g.voorstelling).artiesten));
    const overlap = new Map();
    for (const g of db.upcoming) {
      const x = T.get(g.theater).plaats;
      if (x === p || landVanPlaats(x) !== land || !V.get(g.voorstelling).artiesten.some((a) => hier.has(a))) continue;
      overlap.set(x, (overlap.get(x) || 0) + 1);
    }
    // Gewogen naar de grootte van die plaats, zodat niet altijd Amsterdam en Rotterdam bovenaan staan.
    const score = ([x, n]) => n / Math.sqrt(perPlaats(x).length);
    const andere = [...overlap].filter(([, n]) => n >= 2).sort((a, b) => score(b) - score(a) || a[0].localeCompare(b[0], "nl")).slice(0, 6);
    delen.push(`<h2>Theater in andere plaatsen</h2>
        <p>${andere.length ? `Wie in ${naam} speelt, staat ook vaak in het theater in ${opsomming(andere.map(([x]) => plaatsLink(x)))}. Bekijk <a href="/plaatsen/">alle plaatsen</a> of de <a href="/agenda/">volledige agenda</a>.` : `Bekijk ook de <a href="/agenda/">volledige agenda</a>.`} ${kaartenZin}</p>`);
    return `<section class="seo-tekst prose" aria-labelledby="over-titel">
        ${delen.join("\n        ")}
      </section>`;
  }

  // Veelgestelde vragen over een plaats; alleen vragen waar de agenda een antwoord op heeft.
  function plaatsVragen(p, list) {
    if (!list.length) return [];
    const naam = esc(p);
    const zalen = telPer(list, (g) => g.theater);
    const artiestTel = telPer(list.filter((g) => V.get(g.voorstelling).artiesten.length), (g) => V.get(g.voorstelling).artiesten[0])
      .filter(([id]) => !GEEN_CABARETIER.test(A.get(id).naam));
    const link = (id) => `<a href="${artiestPad(id)}">${esc(A.get(id).naam)}</a>`;
    const wat = (g) => `${esc(artistNames(g.voorstelling) || V.get(g.voorstelling).titel)}${echteTitel(g.voorstelling) ? ` met <em>${esc(echteTitel(g.voorstelling))}</em>` : ""}`;
    const vragen = [];
    vragen.push([`Welke theaters zijn er in ${p}?`, zalen.length === 1
      ? `In deze agenda: ${theaterLink(zalen[0][0])}. Daar ${zalen[0][1] === 1 ? "staat één voorstelling" : `staan ${zalen[0][1]} voorstellingen`} op het programma.`
      : `In deze agenda staan ${zalen.length} theaters en zalen: ${opsomming(zalen.slice(0, 8).map(([id, n]) => `${theaterLink(id)} (${n})`))}${zalen.length > 8 ? " en meer" : ""}. Tussen haakjes staat het aantal voorstellingen.`]);
    if (artiestTel.length) vragen.push([`Wie treedt er op in het theater in ${p}?`, artiestTel.length === 1
      ? `Op het programma staat ${link(artiestTel[0][0])}.`
      : `${artiestTel.length} artiesten, onder wie ${opsomming(artiestTel.slice(0, 8).map(([id]) => link(id)))}.`]);
    const e = list[0];
    vragen.push([`Wat is de eerstvolgende theatervoorstelling in ${p}?`, `${wat(e)}, op ${fmt.full(e.datum)}${e.tijd ? ` om ${e.tijd}` : ""} in ${theaterLink(e.theater)}.${e.status === "uitverkocht" ? " Deze voorstelling is uitverkocht." : ""}`]);
    {
      const open = list.filter((g) => g.status !== "geannuleerd");
      const vanavond = open.filter((g) => g.datum === vandaagDag), dw = weekendLijst(open);
      vragen.push([`Wat is er vanavond te doen in ${p}?`, vanavond.length ? `Vanavond (${esc(fmt.long(vandaagDag))}): ${avondZin(vanavond, 5)}.` : `Vanavond staat er in ${naam} niets in de agenda. De eerstvolgende voorstelling is op ${esc(fmt.full(e.datum))}: ${wat(e)} in ${theaterLink(e.theater)}.`]);
      vragen.push([`Wat is er dit weekend te zien in ${p}?`, dw.length ? `Dit weekend (${esc(weekendPeriode())}): ${avondZin(dw, 6, true)}.` : `Dit weekend staat er in ${naam} niets in de agenda. Bekijk wat er <a href="/dit-weekend/">dit weekend</a> elders te zien is.`]);
    }
    const maand = list[0].datum.slice(0, 7), inMaand = list.filter((g) => g.datum.startsWith(maand));
    if (inMaand.length > 1) vragen.push([`Wat is er in ${maandNaam(maand)} te zien in ${p}?`, `${plural(inMaand.length, "voorstelling", "voorstellingen")}: ${perNaam(inMaand, 5)}${new Set(inMaand.map((g) => artistNames(g.voorstelling))).size > 5 ? " en meer" : ""}.`]);
    const cab = list.filter((g) => heeftGenre(g, "cabaret"));
    if (heeftGenrePlaats("cabaret", p)) vragen.push([`Is er cabaret in ${p}?`, `Ja, ${plural(cab.length, "cabaretvoorstelling", "cabaretvoorstellingen")}. Alle cabaret op een rij staat op <a href="/agenda/cabaret/${plaatsId(p)}/">cabaret in ${naam}</a>.`]);
    const kinder = list.filter((g) => heeftGenre(g, "kindervoorstellingen"));
    if (heeftGenrePlaats("kindervoorstellingen", p)) vragen.push([`Zijn er kindervoorstellingen in ${p}?`, `Ja, ${plural(kinder.length, "kinder- of familievoorstelling", "kinder- en familievoorstellingen")}, onder meer ${perNaam(kinder, 3)}. Alles op een rij staat op <a href="/agenda/kindervoorstellingen/${plaatsId(p)}/">kindervoorstellingen in ${naam}</a>.`]);
    const standup = list.filter((g) => heeftGenre(g, "stand-up"));
    if (standup.length) vragen.push([`Is er stand-up comedy in ${p}?`, `Ja, ${plural(standup.length, "voorstelling", "voorstellingen")}, onder meer ${perNaam(standup, 3)}.`]);
    const oud = list.filter((g) => V.get(g.voorstelling).genre === "oudejaarsconference");
    const oudIds = [...new Set(oud.map((g) => V.get(g.voorstelling).artiesten[0]).filter(Boolean))];
    if (oud.length) vragen.push([`Is er een oudejaarsconference in ${p}?`, `Ja: ${opsomming(oudIds.slice(0, 5).map(link))} ${oudIds.length === 1 ? "speelt" : "spelen"} er een oudejaarsvoorstelling, de eerste op ${fmt.full(oud[0].datum)}.`]);
    const tryouts = bijzonder(list, "try-out");
    if (tryouts.length) vragen.push([`Zijn er try-outs in ${p}?`, `Ja, ${tryouts.length === 1 ? `één: van ${esc(artistNames(tryouts[0].voorstelling))} op ${fmt.full(tryouts[0].datum)}` : `${tryouts.length}, onder meer van ${opsomming([...new Set(tryouts.map((g) => esc(artistNames(g.voorstelling))))].filter(Boolean).slice(0, 4))}`}. Bij een try-out is de voorstelling nog in ontwikkeling, en kaartjes zijn vaak goedkoper. Alle try-outs staan op <a href="/agenda/try-outs/">try-outs</a>.`]);
    const uit = list.filter((g) => g.status === "uitverkocht");
    if (uit.length) vragen.push([`Welke voorstellingen in ${p} zijn uitverkocht?`, `${uit.length} van de ${list.length}, onder meer ${perNaam(uit, 4)}. Soms komen er kaarten vrij via een wachtlijst bij het theater.`]);
    vragen.push([`Hoe koop ik theaterkaarten in ${p}?`, `Kaarten koop je bij het theater zelf. Klik bij een voorstelling op de knop <em>Tickets</em>: die opent de speellijst van het theater of de artiest, waar je kaarten kunt bestellen.`]);
    return vragen;
  }

  // Rechtenvrije foto (Wikimedia Commons) met verplichte naamsvermelding en licentie; bij promomateriaal alleen de fotograaf.
  const fotoHtml = (a, klasse = "artiest-foto") => `<figure class="${klasse}">
          <img src="${esc(a.foto.bestand)}" alt="${esc(a.foto.alt)}"${klasse === "artiest-foto" ? uitsnede(a.foto, 4 / 5) : ""}${a.foto.breedte ? ` width="${a.foto.breedte}" height="${a.foto.hoogte}"` : ""} loading="eager" decoding="async" fetchpriority="high">
          ${a.foto.promo && !a.foto.maker ? "" : `<figcaption>Foto: ${a.foto.promo ? esc(a.foto.maker) : `<a href="${esc(a.foto.bron)}" rel="noopener">${esc(a.foto.maker)}</a>`}${a.foto.promo ? "" : a.foto.licentieUrl ? `, <a href="${esc(a.foto.licentieUrl)}" rel="noopener license">${esc(a.foto.licentie)}</a>` : `, ${esc(a.foto.licentie)}`}</figcaption>`}
        </figure>`;

  // Video's van YouTube (promotiemateriaal, data/promo.json). Zonder klik niets van YouTube:
  // agenda.js zet bij een klik de speler van youtube-nocookie.com neer; zonder JavaScript een gewone link.
  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l11-6.5z"/></svg>';
  const videosHtml = (a) => `<section class="videos" aria-labelledby="videos-titel">
        <h2 id="videos-titel">Video's van ${esc(a.naam)}</h2>
        <ul style="${ink(a.kleur)}">${a.videos.map((v) => `<li><a class="video" href="https://www.youtube.com/watch?v=${esc(v.youtube)}" data-youtube="${esc(v.youtube)}" target="_blank" rel="noopener"><span class="video-play">${PLAY}</span><span class="video-titel">${esc(v.titel)}</span><span class="video-bron">YouTube</span></a></li>`).join("")}</ul>
        <p class="video-noot">De video's komen van YouTube en laden pas als je erop klikt.</p>
      </section>`;

  function artistPage(a) {
    const list = db.gigsForArtist(a.id);
    const titles = [...new Set(list.map((g) => echteTitel(g.voorstelling)).filter(Boolean))];
    const showIds = [...new Set(list.map((g) => g.voorstelling).filter((vid) => echteTitel(vid)))];
    const partners = [...new Set(list.flatMap((g) => V.get(g.voorstelling).artiesten))].filter((x) => x !== a.id && !(a.ookIn || []).includes(x));
    const cityCount = new Set(list.map((g) => T.get(g.theater).plaats)).size;
    const summary = list.length
      ? `${plural(list.length, "speeldatum", "speeldata")} in ${plural(cityCount, "plaats", "plaatsen")}${partners.length ? `, samen met ${partners.map((p) => `<a href="${artiestPad(p)}">${esc(A.get(p).naam)}</a>`).join(" en ")}` : ""}.`
      : a.nietOpTournee ? `Op dit moment staan er geen voorstellingen van ${esc(a.naam)} in de agenda.` : "Op dit moment staan er geen voorstellingen gepland.";
    const festival = [...F.values()].find((f) => (f.artiesten || []).includes(a.id));
    // "Speellijst 2026-2027": zo zoeken mensen ("theo maassen speellijst 2027", Search Console november 2026).
    const jaren = list.length ? [...new Set([list[0].datum.slice(0, 4), list.at(-1).datum.slice(0, 4)])].join("-") : "";
    const body = `<div class="detail-hero" style="${ink(a.kleur)}"><div class="wrap${a.foto ? " hero-met-foto" : ""}">
        <div class="hero-tekst">
          <h1>${esc(a.naam)}</h1>
          <p>${summary}${(a.ookIn || []).filter((x) => A.has(x)).length ? ` Ook te zien als ${opsomming(a.ookIn.filter((x) => A.has(x)).map((x) => `<a href="${artiestPad(x)}">${esc(A.get(x).naam)}</a>`))}.` : ""}${festival ? ` Onderdeel van <a href="/festivals/${festival.id}/">${esc(festival.naam)}</a>.` : ""}</p>
        </div>
        ${a.foto ? fotoHtml(a) : ""}
      </div></div>
      <div class="wrap detail-body">
        ${list.length ? `<h2 class="sub-head speellijst-kop">Speellijst ${jaren}</h2>` : ""}
        ${showIds.length ? `<div class="shows-list">${showIds.map((vid) => voorstellingPad.has(vid) ? `<a class="pill" href="${voorstellingPad.get(vid)}">${esc(V.get(vid).titel)}</a>` : `<span class="pill">${esc(V.get(vid).titel)}</span>`).join("")}</div>` : ""}
        ${list.length > 12 ? filters(list, { maand: true, waar: true }) : ""}
        <div id="gigs">${monthGroups(list, { showArtist: false })}</div>
        ${list.length > 12 ? leegBlok : ""}
        ${a.videos?.length ? videosHtml(a) : ""}
        ${a.nietOpTournee ? `<section class="seo-tekst prose" aria-labelledby="over-titel">
          <h2 id="over-titel">Speelt ${esc(a.naam)} nog?</h2>
          ${a.nietOpTournee.alineas.map((x) => `<p>${esc(x)}</p>`).join("")}
          <p>Bronnen: ${opsomming(a.nietOpTournee.bronnen.map(([n, u]) => `<a href="${esc(u)}" rel="noopener">${esc(n)}</a>`))} (bekeken ${esc(fmt.long(a.nietOpTournee.gecontroleerd))}). Zodra er nieuwe speeldata zijn, staan ze hier. Tot die tijd: bekijk <a href="/alle-cabaretiers/">alle cabaretiers</a> die nu op tournee zijn.</p>
        </section>` : artiestTekst(a, list)}
        ${list.length ? faqHtml(artiestVragen(a, list), `Veelgestelde vragen over ${a.naam}`) : ""}
        ${a.geslacht && !isGroep(a) ? `<p class="zie-ook">Bekijk ook andere <a href="/alle-cabaretiers/${a.geslacht === "vrouw" ? "vrouwen" : "mannen"}/">${a.geslacht === "vrouw" ? "vrouwelijke" : "mannelijke"} cabaretiers</a> of <a href="/alle-cabaretiers/">alle cabaretiers</a>.</p>` : ""}
      </div>`;
    const desc = list.length
      ? zinnen(`${a.naam} speellijst: ${plural(list.length, "voorstelling", "voorstellingen")}${titles.length === 1 ? ` van ${titles[0]}` : ""} in ${plural(cityCount, "plaats", "plaatsen")}.`, `Alle data ${jaren.replace("-", " en ")} en kaarten via het theater.`, "Bekijk de hele speellijst.")
      : a.nietOpTournee ? zinnen(`${a.naam} speellijst: staan er voorstellingen gepland? ${a.nietOpTournee.alineas[0].split(":")[0]}.`, "Lees hoe het zit en wat hij nu doet.") : `${a.naam} op Cabaretiers.com.`;
    // Titel kort genoeg voor Google (met " | Cabaretiers.com" erachter): bij een lange naam zonder het tweede deel.
    const titel = !list.length ? (a.nietOpTournee ? `${a.naam} speellijst en voorstellingen` : a.naam) : `${a.naam} speellijst ${jaren}: tournee en kaarten`.length <= 47 ? `${a.naam} speellijst ${jaren}: tournee en kaarten` : `${a.naam} speellijst ${jaren}`;
    return layout({ title: titel, description: desc, path: `/artiesten/${a.id}/`, section: "artiesten", body, schema: { type: "ProfilePage", foto: a.foto ? a : null, kruimels: [["Artiesten", "/artiesten/"], [a.naam, `/artiesten/${a.id}/`]], hoofd: { "@id": artiestLd(a.id)["@id"] }, extra: [artiestLd(a.id), ...eventsLd(list), ...(list.length ? [faqLd(artiestVragen(a, list), `/artiesten/${a.id}/`)] : [])] } });
  }

  function voorstellingTekst(vid, list) {
    const v = V.get(vid);
    const namen = artistNames(vid);
    const steden = telPer(list, (g) => T.get(g.theater).plaats);
    const zalen = telPer(list, (g) => g.theater);
    const zinnen = [];
    zinnen.push(`<p><em>${esc(v.titel)}</em> van ${artistLinks(vid)} staat ${keer(list.length)} op de agenda, ${periode(list)}. ` +
      (zalen.length === 1
        ? `${list.length === 1 ? "De voorstelling is" : "Alle voorstellingen zijn"} in ${theaterLink(zalen[0][0])} in ${plaatsLink(steden[0][0])}.`
        : `De voorstelling is te zien in ${steden.length > 1 ? `${steden.length} plaatsen: ${opsomming(steden.slice(0, 10).map(([p]) => plaatsLink(p)))}${steden.length > 10 ? " en meer" : ""}` : plaatsLink(steden[0][0])}.`) +
      ` Het genre is ${opsomming(genresVanV(v).map((x) => GENRE_TEKST[x]))}.</p>`);
    const p2 = [];
    const premiere = bijzonder(list, "première")[0];
    if (premiere) p2.push(`De première is op ${fmt.long(premiere.datum)} in ${theaterLink(premiere.theater)}.`);
    const tryouts = bijzonder(list, "try-out");
    if (tryouts.length) p2.push(tryouts.length === 1 ? `Op ${fmt.full(tryouts[0].datum)} is er een try-out in ${theaterLink(tryouts[0].theater)}.` : `${tryouts.length} voorstellingen zijn try-outs.`);
    const derniere = bijzonder(list, "dernière")[0];
    if (derniere) p2.push(`De dernière is op ${fmt.long(derniere.datum)} in ${theaterLink(derniere.theater)}.`);
    const tekst = (p2.join(" ") + uitverkochtZin(list)).trim();
    if (tekst) zinnen.push(`<p>${tekst}</p>`);
    const anderen = v.artiesten.flatMap((a) => db.gigsForArtist(a).map((g) => g.voorstelling))
      .filter((x, i, arr) => x !== vid && voorstellingPad.has(x) && arr.indexOf(x) === i);
    zinnen.push(`<p>${anderen.length ? `Ook op de speellijst van ${esc(namen)}: ${opsomming(anderen.slice(0, 4).map((x) => `<a href="${voorstellingPad.get(x)}">${esc(V.get(x).titel)}</a>`))}. ` : ""}${kaartenZin}</p>`);
    return `<section class="seo-tekst prose" aria-labelledby="over-titel">
        <h2 id="over-titel">${esc(v.titel)} van ${esc(namen)} zien</h2>
        ${zinnen.join("\n        ")}
      </section>`;
  }

  // Recensies van de voorstelling (uit de theaterpagina's): krant, sterren en citaat, met de pagina als bron.
  // Promotekst die een artiest of impresariaat ons gaf (data/promo.json), met vermelding.
  const promotekstHtml = (v) => v.promotekst ? `<section class="promotekst" aria-labelledby="over-titel">
        <h2 id="over-titel" class="sub-head">Over ${esc(v.titel)}</h2>
        ${v.promotekst.alineas.map((t) => `<p>${esc(t)}</p>`).join("")}
        <p class="promotekst-bron">Tekst: ${esc(v.promotekst.van)}</p>
      </section>` : "";

  function recensiesHtml(v, list) {
    if (!v.recensies?.length) return "";
    const zaal = (bron) => {
      const g = list.find((x) => x.bron === bron);
      return g ? T.get(g.theater).naam : new globalThis.URL(bron).hostname.replace(/^www\./, "");
    };
    const sterren = (n) => n ? `<p class="sterren" aria-label="${n} van 5 sterren">${"★".repeat(n)}<span aria-hidden="true">${"★".repeat(5 - n)}</span></p>` : "";
    return `<section class="recensies" aria-labelledby="recensies-titel">
        <h2 id="recensies-titel" class="sub-head">Recensies van ${esc(v.titel)}</h2>
        <ul>${v.recensies.map((r) => `<li>
          <figure>
            ${sterren(r.sterren)}
            <blockquote><p>${esc(r.citaat)}</p></blockquote>
            <figcaption><cite>${esc(r.medium)}</cite>${r.sterren ? `, ${r.sterren} ${r.sterren === 1 ? "ster" : "sterren"}` : ""}${r.via ? `, via ${esc(r.via)}` : ` <a href="${esc(metUtm(r.bron))}" rel="noopener" target="_blank">via ${esc(zaal(r.bron))}</a>`}</figcaption>
          </figure>
        </li>`).join("")}</ul>
      </section>`;
  }

  // Zonder zoekfilters: wie op deze pagina is, heeft de voorstelling al gevonden.
  function voorstellingPagina(vid) {
    const v = V.get(vid), a = A.get(v.artiesten[0]);
    const list = up.filter((g) => g.voorstelling === vid);
    const steden = new Set(list.map((g) => T.get(g.theater).plaats)).size;
    const beste = (v.recensies || []).find((r) => r.sterren);
    const body = `<div class="detail-hero" style="${ink(a.kleur)}"><div class="wrap${v.foto ? " hero-met-foto" : ""}">
        <div class="hero-tekst">
          <h1${Math.max(...v.titel.split(/\s+/).map((w) => w.length)) > 12 ? ' class="lang"' : ""}>${esc(v.titel)}</h1>
          <p>Voorstelling van ${artistLinks(vid)}. ${plural(list.length, "speeldatum", "speeldata")} in ${plural(steden, "plaats", "plaatsen")}.</p>
          <ul class="hero-genres" aria-label="Genres">${genresVanV(v).map((g) => `<li>${GENRE_PAGINAS.includes(g) ? `<a href="/agenda/${g}/">${esc(genreLabel(g))}</a>` : `<span>${esc(genreLabel(g))}</span>`}</li>`).join("")}</ul>
        </div>
        ${v.foto ? fotoHtml(v) : ""}
      </div></div>
      <div class="wrap detail-body">
        ${promotekstHtml(v)}
        ${recensiesHtml(v, list)}
        <div id="gigs">${monthGroups(list, { showArtist: false })}</div>
        ${voorstellingTekst(vid, list)}
      </div>`;
    const desc = zinnen(`${v.titel} van ${artistNames(vid)}: ${plural(list.length, "voorstelling", "voorstellingen")} in ${plural(steden, "plaats", "plaatsen")}.`, beste ? `${beste.medium}: ${plural(beste.sterren, "ster", "sterren")}.` : "", "Bekijk de speellijst en koop kaarten via het theater.");
    return layout({ title: `${v.titel} van ${artistNames(vid)}: speellijst en kaarten`, description: desc, path: voorstellingPad.get(vid), section: "artiesten", body, schema: {
      kruimels: [["Artiesten", "/artiesten/"], [a.naam, `/artiesten/${a.id}/`], [v.titel, voorstellingPad.get(vid)]],
      foto: v.foto ? v : fotoArtiest(vid) || null,
      hoofd: { "@id": URL(voorstellingPad.get(vid) + "#voorstelling") },
      extra: [{
        "@type": "EventSeries", "@id": URL(voorstellingPad.get(vid) + "#voorstelling"), name: v.titel, url: URL(voorstellingPad.get(vid)),
        description: desc, performer: v.artiesten.map(artiestLd),
        ...(v.foto || fotoArtiest(vid) ? { image: { "@id": fotoLd(v.foto ? v : fotoArtiest(vid))["@id"] } } : {}),
        startDate: isoWithOffset(list[0].datum, list[0].tijd), endDate: isoWithOffset(list.at(-1).datum, list.at(-1).tijd),
        subEvent: list.slice(0, 100).map((g) => ({ "@id": eventId(g) })),
      }, ...eventsLd(list)],
    } });
  }

  // Kleinere kop op een kaart als het langste woord anders niet op één regel past.
  const kopMaat = (naam) => {
    const langste = Math.max(...naam.split(/\s+/).map((w) => w.length));
    return langste > 13 ? ' class="xlang"' : langste > 9 ? ' class="lang"' : "";
  };

  // Gekleurde kaarten voor festivals en comedyclubs (op /festivals/, /comedy-clubs/ en de homepage).
  const festivalKaart = ({ f, list }, kleur) => `<a class="artist-card" href="/festivals/${f.id}/" style="${ink(kleur)}">
          <h3${kopMaat(f.naam)}>${esc(f.naam)}</h3>
          <p>${esc(f.plaats)}<br><span class="count">${plural(list.length, "speeldatum", "speeldata")}</span>, vanaf ${fmt.dayMonth(list[0].datum)}</p>
        </a>`;
  const clubKaart = ({ t, n }, kleur) => `<a class="artist-card" href="/theaters/${t.id}/" style="${ink(kleur)}">
          <h3${kopMaat(t.naam)}>${esc(t.naam)}</h3>
          <p>${esc(t.plaats)}<br><span class="count">${plural(n, "voorstelling", "voorstellingen")}</span>, vanaf ${fmt.dayMonth(db.gigsForTheater(t.id)[0].datum)}</p>
        </a>`;
  const comedyclubs = () => zalenMetData.filter((t) => t.soort === "comedyclub").map((t) => ({ t, n: db.gigsForTheater(t.id).length }))
    .sort((a, b) => b.n - a.n || a.t.naam.localeCompare(b.t.naam, "nl"));
  const kaartenRij = (items, kleurVan, kaart) => afwisselend(items, kleurVan, { schuiven: false }).map(({ x, kleur }) => kaart(x, kleur)).join("");

  // Tekst en veelgestelde vragen onder /festivals/, met de festivals en datums uit de agenda.
  function festivalsOverzicht() {
    const link = (f) => `<a href="/festivals/${f.id}/">${esc(f.naam)}</a>`;
    const metPlaats = ({ f }) => `${link(f)} (${esc(f.plaats)})`;
    const per = (soort) => festivalsMetData.filter(({ f }) => f.soort === soort);
    const totaal = festivalsMetData.reduce((n, { list }) => n + list.length, 0);
    const steden = telPer(festivalsMetData.flatMap(({ list }) => list), (g) => T.get(g.theater).plaats);
    const tekst = [];
    tekst.push(`<p>Cabaretfestivals zijn de plek waar nieuw cabaret- en comedytalent wordt ontdekt. Bij de meeste festivals spelen jonge makers in voorrondes, halve finales en een finale voor een jury en voor publiek. Wie wint, krijgt vaak een prijs, begeleiding of speelbeurten in het theater. Cabaretiers.com volgt ${plural(festivalsMetData.length, "festival", "festivals")} met samen ${plural(totaal, "aankomende speeldatum", "aankomende speeldata")}.</p>`);
    const delen = Object.keys(FESTIVALSOORTEN).map((soort) => [soort, per(soort)]).filter(([, hier]) => hier.length);
    const zin = { landelijk: (h) => `De grote nationale festivals zijn ${opsomming(h.map(metPlaats))}`, studenten: (h) => `bij de studentenfestivals ${h.length === 1 ? "staat" : "staan"} ${opsomming(h.map(metPlaats))} op het programma`, regionaal: (h) => `daarnaast zijn er kleinere en regionale festivals, zoals ${opsomming(h.map(metPlaats))}` };
    if (delen.length) tekst.push(`<p>${delen.map(([soort, hier]) => zin[soort](hier)).join("; ")}.</p>`);
    tekst.push(`<p>Per festival zie je alle speeldata: de voorrondes, de finale en, als die er is, de tournee met de finalisten langs theaters in het hele land. ${steden.length ? `De meeste festivalavonden zijn in ${opsomming(steden.slice(0, 4).map(([p, n]) => `${plaatsLink(p)} (${n})`))}.` : ""} Alle andere voorstellingen staan in de <a href="/agenda/">agenda</a>.</p>`);
    const vragen = [];
    vragen.push(["Wat is een cabaretfestival?", "Een festival of concours voor (meestal jonge) cabaretiers en comedians. De deelnemers spelen een kort programma in voorrondes en finales, en een jury kiest een winnaar; vaak is er ook een publieksprijs. Voor veel artiesten is een festival de eerste stap naar een eigen theatervoorstelling."]);
    if (festivalsMetData.length) vragen.push(["Welke cabaretfestivals zijn er in Nederland en België?", `${delen.map(([soort, hier]) => `${FESTIVALSOORTEN[soort]}: ${opsomming(hier.map(({ f }) => link(f)))}`).join(". ")}.`]);
    const eerst = festivalsMetData[0];
    if (eerst) { const g = eerst.list[0], t = T.get(g.theater); vragen.push(["Wanneer is het volgende cabaretfestival?", `De eerstvolgende festivalavond is van ${link(eerst.f)}, op ${fmt.full(g.datum)}${g.tijd ? ` om ${g.tijd}` : ""} in ${theaterLink(t.id)}${t.naam.includes(t.plaats) ? "" : ` in ${esc(t.plaats)}`}.`]); }
    vragen.push(["Wat is een finalistentournee?", "Na de finale trekken de finalisten van sommige festivals samen langs theaters in het hele land. Op zo'n avond zie je meerdere nieuwe cabaretiers achter elkaar, elk met een deel van hun festivalprogramma. De speeldata staan op de pagina van het festival."]);
    if (per("studenten").length) vragen.push(["Wat is een studentencabaretfestival?", `Een festival dat door studenten wordt georganiseerd, waar vooral studenten en jonge makers aan meedoen, zoals ${opsomming(per("studenten").map(({ f }) => link(f)))}. Het is vaak een eerste podium voor wie net begint.`]);
    vragen.push(["Hoe kan ik meedoen aan een cabaretfestival?", "Elk festival heeft een eigen inschrijving, meestal een paar maanden voor de voorrondes. Kijk op de website van het festival; die staat op de festivalpagina hier."]);
    vragen.push(["Hoe koop ik kaarten voor een festival?", "Klik bij een voorstelling op <em>Tickets</em>: die knop opent de pagina van het theater of het festival, waar je kaarten kunt bestellen. Cabaretiers.com verkoopt zelf geen kaarten."]);
    vragen.push(["Mijn festival staat er niet bij. Hoe kom ik in de agenda?", `Stuur een mail naar <a href="mailto:${SITE.email}">${SITE.email}</a> met de naam van het festival en de pagina met de speeldata.`]);
    return { tekst, vragen };
  }

  // ---------- Genres: /agenda/<genre>/ (tot november 2026 /genres/<genre>/; .htaccess stuurt door) ----------
  // Per genre een vaste uitleg en eigen vragen; de cijfers, namen en plaatsen komen uit de agenda.
  const oudejaarsJaar = (() => {
    const eerste = up.find((g) => V.get(g.voorstelling).genre === "oudejaarsconference");
    const d = eerste?.datum || db.today;
    return Number(d.slice(0, 4)) - (Number(d.slice(5, 7)) < 7 ? 1 : 0);
  })();
  // ---------- Oudejaarsconference: opening en extra tekst (zoektermen uit Search Console, november 2026:
  // "oudejaarsconference 2026", "wie doet de oudejaarsconference 2026", "twentse oudejaarsconference",
  // "eindejaarsconference"). De tv-gegevens staan met bron in GENRE_INFO.oudejaarsconference.tv, de rest komt uit de agenda.
  const REGIONAAL = /eindejaars|twentse|limburgse|brabantse|groningse|friese|zeeuwse|drentse|achterhoekse|vlaamse|westvlaamse/i;
  const oudejaarsTheater = (list, artiest) => list.filter((g) => V.get(g.voorstelling).artiesten.includes(artiest));
  const voorstellingLink = (vid) => voorstellingPad.has(vid) ? `<a href="${voorstellingPad.get(vid)}">${esc(V.get(vid).titel)}</a>` : `<em>${esc(V.get(vid).titel)}</em>`;
  function oudejaarsIntro(list) {
    const tv = GENRE_INFO.oudejaarsconference.tvNu();
    if (!tv) return "";
    const eigen = oudejaarsTheater(list, tv.artiest);
    const plaatsen = [...new Set(eigen.map((g) => T.get(g.theater).plaats))];
    const naam = A.has(tv.artiest) ? `<a href="${artiestPad(tv.artiest)}">${esc(tv.naam)}</a>` : esc(tv.naam);
    return `<div class="genre-intro prose">
        <p><strong>De oudejaarsconference ${oudejaarsJaar} op televisie is van ${naam}</strong>: op ${esc(tv.datum)} bij ${esc(tv.omroep)} op ${esc(tv.zender)}. Het is haar ${esc(tv.keer)} oudejaarsconference; de vorige was in ${esc(tv.vorige)} (<a href="${esc(tv.bron)}" rel="noopener">bron: ${esc(tv.omroep)}</a>).${eigen.length ? ` In de weken ervoor speelt ze haar ${voorstellingLink(eigen[0].voorstelling)} ook in het theater: ${plural(eigen.length, "voorstelling", "voorstellingen")} in ${plural(plaatsen.length, "plaats", "plaatsen")}.` : ""}</p>
        <p>Naast de tv-conference spelen veel andere cabaretiers een eigen oudejaarsvoorstelling in het theater. Ze staan hieronder allemaal, met tijden, zalen en kaarten.</p>
      </div>`;
  }
  function oudejaarsExtra(list) {
    const tv = GENRE_INFO.oudejaarsconference.tvNu();
    const uit = [];
    const perArtiest = telPer(list.flatMap((g) => V.get(g.voorstelling).artiesten).filter((id) => !isFestival(id)), (id) => id);
    const naamMet = ([id, n]) => `${artiestLink(A.get(id))} (${n})`;
    // Wie
    uit.push(`<h3>Wie doet de oudejaarsconference ${oudejaarsJaar}?</h3>
        <p>${tv ? `Op televisie doet ${esc(tv.naam)} de oudejaarsconference ${oudejaarsJaar}, op ${esc(tv.datum)} bij ${esc(tv.omroep)} op ${esc(tv.zender)}. ` : ""}In het theater staan dit seizoen ${plural(perArtiest.length, "artiest of groep", "artiesten en groepen")} met een oudejaarsvoorstelling in de agenda${perArtiest.length ? `, onder wie ${opsomming(perArtiest.slice(0, 12).map(naamMet))}` : ""}. Tussen haakjes staat het aantal voorstellingen.</p>`);
    // Wanneer en waar
    const perMaand = telPer(list, (g) => g.datum.slice(0, 7)).sort((a, b) => a[0].localeCompare(b[0]));
    const oudejaarsavond = list.filter((g) => g.datum.endsWith("-12-31") && g.status !== "geannuleerd");
    const uitverkocht = list.filter((g) => g.status === "uitverkocht").length;
    const steden = telPer(list, (g) => T.get(g.theater).plaats);
    if (list.length) uit.push(`<h3>Oudejaarsconference in het theater: wanneer en waar?</h3>
        <p>De oudejaarsvoorstellingen spelen ${periode(list)}${perMaand.length > 1 ? `: ${opsomming(perMaand.map(([m, n]) => `${n} in ${maandNaam(m)}`))}` : ""}. ${oudejaarsavond.length ? `Op oudejaarsavond zelf ${oudejaarsavond.length === 1 ? "is er één voorstelling" : `zijn er ${oudejaarsavond.length} voorstellingen`}: ${perNaam(oudejaarsavond, 6)}. ` : ""}De meeste voorstellingen zijn in ${opsomming(steden.slice(0, 6).map(([p, n]) => `${plaatsLink(p)} (${n})`))}.${uitverkocht ? ` Wacht niet te lang met kaarten: ${uitverkocht} van de ${list.length} voorstellingen zijn al uitverkocht.` : ""}</p>`);
    // Eindejaarsconference en regionale conferences
    const regionaal = [...new Set(list.filter((g) => REGIONAAL.test(V.get(g.voorstelling).titel)).map((g) => g.voorstelling))];
    if (regionaal.length) uit.push(`<h3>Eindejaarsconference en regionale oudejaarsconferences</h3>
        <p>Niet elke oudejaarsvoorstelling heet zo. Sommige heten eindejaarsconference, andere kijken terug op het jaar in hun eigen streek, in hun eigen dialect. Dit seizoen in de agenda: ${opsomming(regionaal.slice(0, 8).map((vid) => { const l = list.filter((g) => g.voorstelling === vid); const w = V.get(vid).artiesten.map((a) => A.get(a)?.naam).filter(Boolean); return `${voorstellingLink(vid)}${w.length ? ` van ${esc(opsomming(w))}` : ""} (${plural(l.length, "voorstelling", "voorstellingen")} in ${esc(opsomming([...new Set(l.map((g) => T.get(g.theater).plaats))].slice(0, 3)))})`; }))}.</p>`);
    // Tv en theater
    uit.push(`<h3>Oudejaarsconference op tv en in het theater</h3>
        <p>De oudejaarsconference op televisie is een traditie die Wim Kan groot maakte: elk jaar blikt een cabaretier op oudejaarsavond terug op het jaar, en heel Nederland kijkt mee. Die tv-uitzending is meestal een registratie van een voorstelling die eerst in het theater speelt. Wie de conference live wil zien, kan dus vaak al in november en december een kaartje kopen. Omdat het nieuws tot het laatste moment doorgaat, verandert een oudejaarsvoorstelling vaak nog van avond tot avond.</p>`);
    return uit;
  }
  function oudejaarsVragen(list) {
    const tv = GENRE_INFO.oudejaarsconference.tvNu();
    const vragen = [];
    if (tv) {
      vragen.push([`Wie doet de oudejaarsconference ${oudejaarsJaar}?`, `Op televisie ${esc(tv.naam)}: op ${esc(tv.datum)} bij ${esc(tv.omroep)} op ${esc(tv.zender)}, haar ${esc(tv.keer)} oudejaarsconference (de vorige was in ${esc(tv.vorige)}). In het theater spelen ook andere cabaretiers een oudejaarsvoorstelling; die staan allemaal op deze pagina.`]);
      vragen.push([`Wanneer is de oudejaarsconference ${oudejaarsJaar} op tv?`, `Op ${esc(tv.datum)}, oudejaarsavond, bij ${esc(tv.omroep)} op ${esc(tv.zender)}.`]);
      const eigen = oudejaarsTheater(list, tv.artiest);
      if (eigen.length) vragen.push([`Kan ik de oudejaarsconference van ${esc(tv.naam)} in het theater zien?`, `Ja. ${esc(tv.naam)} speelt haar ${voorstellingLink(eigen[0].voorstelling)} ook in het theater: ${plural(eigen.length, "voorstelling", "voorstellingen")}, ${periode(eigen)}, onder meer in ${esc(opsomming([...new Set(eigen.map((g) => T.get(g.theater).plaats))].slice(0, 5)))}.${eigen.some((g) => g.status === "uitverkocht") ? ` Een deel is al uitverkocht.` : ""}`]);
    }
    const twents = list.filter((g) => /twent/i.test(V.get(g.voorstelling).titel));
    if (twents.length) {
      const v = V.get(twents[0].voorstelling), w = v.artiesten.map((a) => A.get(a)?.naam).filter(Boolean);
      vragen.push(["Is er ook een Twentse oudejaarsconference?", `Ja: ${voorstellingLink(v.id)}${w.length ? `, met ${esc(opsomming(w))}` : ""}. ${plural(twents.length, "voorstelling", "voorstellingen")} in ${esc(opsomming([...new Set(twents.map((g) => T.get(g.theater).plaats))]))}, ${periode(twents)}.`]);
    }
    if (list.some((g) => /eindejaars/i.test(V.get(g.voorstelling).titel))) vragen.push(["Wat is een eindejaarsconference?", "Een andere naam voor een oudejaarsconference: een voorstelling waarin een cabaretier terugkijkt op het afgelopen jaar. De naam komt vooral voor in Twente en Vlaanderen."]);
    return vragen;
  }

  const GENRE_INFO = {
    cabaret: {
      kop: "Cabaret", meervoud: "cabaretvoorstellingen", wie: "cabaretiers", kleur: "roze",
      titel: `Cabaret agenda ${SEIZOEN}: alle cabaretvoorstellingen`,
      uitleg: "Cabaret is een avondvullende theatervoorstelling met humor, verhalen en vaak liedjes, meestal rond een thema en met een persoonlijke of maatschappelijke kijk op de wereld. Nederland en Vlaanderen hebben een lange cabarettraditie, van de grote drie (Wim Kan, Toon Hermans en Wim Sonneveld) tot de cabaretiers die nu door het land toeren.",
      vragen: [
        ["Wat is cabaret?", "Een theatervoorstelling waarin een cabaretier (of een groep) met humor, verhalen en vaak liedjes een avond vult, meestal rond een thema. Tussen de grappen door is er ook ruimte voor serieuze momenten."],
        ["Wat is het verschil tussen cabaret en stand-up comedy?", "Cabaret heeft meestal een rode draad, liedjes en soms een decor. Stand-up comedy is losser: een comedian vertelt grappen en verhalen met alleen een microfoon. Veel artiesten doen allebei. Bekijk ook <a href=\"/agenda/stand-up/\">stand-up comedy</a>."],
      ],
    },
    "stand-up": {
      kop: "Stand-up comedy", meervoud: "stand-upvoorstellingen", wie: "comedians", kleur: "blauw",
      titel: `Stand-up comedy agenda ${SEIZOEN}: shows en comedyclubs`,
      uitleg: "Bij stand-up comedy staat een comedian met een microfoon op het podium en vertelt grappen en verhalen, zonder decor of vaste verhaallijn. Je ziet stand-up in theaters, maar vooral in comedyclubs, waar op één avond vaak meerdere comedians na elkaar spelen.",
      vragen: [
        ["Wat is stand-up comedy?", "Een comedian vertelt grappen en verhalen rechtstreeks aan het publiek, meestal alleen met een microfoon. Een avond kan een solovoorstelling zijn of een line-up met meerdere comedians en een presentator."],
        ["Waar kan ik stand-up comedy zien?", "In theaters en vooral in comedyclubs. Op <a href=\"/comedy-clubs/\">Comedy Clubs</a> staan alle clubs met hun programma."],
        ["Is er ook stand-up comedy in het Engels?", "Ja. Veel comedyclubs hebben vaste Engelstalige avonden, en internationale comedians spelen regelmatig in Nederland en België."],
      ],
    },
    oudejaarsconference: {
      kop: `Oudejaarsconference ${oudejaarsJaar}`, meervoud: "oudejaarsvoorstellingen", wie: "cabaretiers", kleur: "rood",
      titel: `Oudejaarsconference ${oudejaarsJaar}: wie doen het dit jaar?`,
      // Beantwoordt "wie doet de oudejaarsconference 2026" (Search Console): de namen in de omschrijving.
      // De landelijke tv-conference (NPO): met de hand bijhouden, met bron. Alleen getoond als `jaar` het oudejaarsjaar is.
      tv: { jaar: 2026, artiest: "claudia-de-breij", naam: "Claudia de Breij", datum: "31 december", zender: "NPO 1", omroep: "BNNVARA", keer: "vierde", vorige: "2022",
        bron: "https://pers.bnnvara.nl/claudia-de-breij-verzorgt-oudejaarsconference-2026/" },
      desc: (list, steden, namen) => {
        const tv = GENRE_INFO.oudejaarsconference.tvNu();
        return zinnen(`Wie doet de oudejaarsconference ${oudejaarsJaar}?${tv ? ` Op tv ${tv.naam} (${tv.zender}, ${tv.datum}).` : ""}`, `In het theater ook ${namen.filter((n) => n !== tv?.naam)[0] || "andere cabaretiers"} en meer: ${plural(list.length, "voorstelling", "voorstellingen")}.`);
      },
      tvNu: () => { const t = GENRE_INFO.oudejaarsconference.tv; return t && String(t.jaar) === String(oudejaarsJaar) ? t : null; },
      intro: (list) => oudejaarsIntro(list),
      extra: (list) => oudejaarsExtra(list),
      extraVragen: (list) => oudejaarsVragen(list),
      uitleg: "Een oudejaarsconference is een voorstelling waarin een cabaretier terugblikt op het afgelopen jaar, met grappen over de actualiteit, de politiek en het nieuws. Wim Kan maakte er een jaarlijkse traditie van. Op oudejaarsavond is er traditioneel een oudejaarsconference op televisie, maar in november en december spelen veel cabaretiers hun oudejaarsvoorstelling ook in het theater.",
      vragen: [
        ["Wat is een oudejaarsconference?", "Een cabaretvoorstelling aan het eind van het jaar waarin de cabaretier terugkijkt op het nieuws en de actualiteit van dat jaar."],
        ["Wanneer zijn de oudejaarsvoorstellingen in het theater?", "Vooral in november en december, in de weken voor oudejaarsavond. Omdat de voorstelling over het afgelopen jaar gaat, wordt hij vaak tot op het laatste moment bijgewerkt."],
      ],
    },
    kleinkunst: {
      kop: "Kleinkunst", meervoud: "kleinkunstvoorstellingen", wie: "artiesten", kleur: "geel",
      titel: `Kleinkunst agenda ${SEIZOEN}: voorstellingen en kaarten`,
      uitleg: "Kleinkunst is verwant aan cabaret, maar het lied staat centraal: Nederlandstalige liedjes, chansons en teksten, vaak met humor en soms met een serieuze ondertoon. De voorstellingen spelen meestal in kleinere zalen, dicht op het publiek.",
      vragen: [
        ["Wat is kleinkunst?", "Theater waarin liedjes en teksten centraal staan, vaak Nederlandstalig, met humor en emotie. Het ligt dicht bij cabaret; veel artiesten doen allebei."],
        ["Wat is het verschil tussen kleinkunst en cabaret?", "Bij kleinkunst draait het vooral om het lied, bij cabaret om de grap en het verhaal. De grens is vaag: veel voorstellingen zijn een mengvorm."],
      ],
    },
    komedie: {
      kop: "Komedie", meervoud: "komedies", wie: "artiesten", kleur: "oranje",
      titel: `Komedie ${SEIZOEN}: komedies, blijspellen en kluchten`,
      uitleg: "Onder komedie vallen komedies, blijspellen en kluchten: toneel met humor, met een verhaal en een vaste rolverdeling. Gewoon toneel en musicals staan niet in deze agenda; voorstellingen waarin de humor de hoofdrol speelt wel.",
      vragen: [
        ["Wat is het verschil tussen een komedie, een blijspel en een klucht?", "Een komedie is toneel met humor; een blijspel is een luchtige komedie met een goede afloop; een klucht draait om verwikkelingen, misverstanden en slapstick."],
        ["Staan musicals en toneel ook in de agenda?", "Nee, alleen voorstellingen waarin humor de hoofdrol speelt: cabaret, comedy en komisch theater."],
      ],
    },
    "open-mic": {
      kop: "Open mic", meervoud: "open mics", wie: "comedians", kleur: "limoen",
      titel: `Open mic comedy agenda ${SEIZOEN}`,
      uitleg: "Op een open mic proberen nieuwe en ervaren comedians kort materiaal uit, vaak een paar minuten per persoon. Het is de plek waar nieuwe grappen ontstaan en waar beginnende comedians hun eerste stappen zetten. De sfeer is los en de toegang is vaak goedkoop of gratis.",
      vragen: [
        ["Wat is een open mic?", "Een avond waarop comedians kort nieuw materiaal testen voor publiek. Je ziet beginners naast ervaren comedians die nieuwe grappen uitproberen."],
        ["Kan ik zelf meedoen aan een open mic?", "Meestal wel. De meeste clubs werken met aanmelden vooraf; kijk op de site van de club voor de regels."],
      ],
    },
    // Sinds november 2026; de tekst richt zich op kindervoorstellingen én familievoorstellingen (zo zoeken ouders).
    kindervoorstellingen: {
      kop: "Kindervoorstellingen", meervoud: "kinder- en familievoorstellingen", wie: "makers", kleur: "aqua",
      // Voor de pagina's per plaats (/agenda/kindervoorstellingen/<plaats>/).
      enkelvoud: "kindervoorstelling", waar: "Waar zijn kindervoorstellingen", plaatsTitel: (p) => `Kindervoorstellingen in ${p}: kinder- en familietheater`, anders: "cabaret en comedy voor volwassenen",
      titel: `Kindervoorstellingen en familievoorstellingen ${SEIZOEN}`,
      desc: (list, steden) => zinnen(`Kinder- en familievoorstellingen ${SEIZOEN}: ${plural(list.length, "voorstelling", "voorstellingen")} in ${plural(steden.length, "plaats", "plaatsen")}.`, "Theater voor peuters, kleuters, de hele basisschool en het hele gezin.", "Kaarten koop je bij het theater."),
      uitleg: "Een kindervoorstelling is theater voor kinderen: van peutervoorstellingen van een half uur tot verhalen, poppenspel, muziek, humor en musicals voor de hele basisschool. Een familievoorstelling is gemaakt voor kinderen én volwassenen samen, zodat het hele gezin, opa en oma inbegrepen, er plezier aan heeft. Bij elke voorstelling geeft het theater een leeftijd op, zoals 4+ of 6+: de jongste leeftijd waarvoor de voorstelling geschikt is.",
      vragen: [
        ["Wat is het verschil tussen een kindervoorstelling en een familievoorstelling?", "Een kindervoorstelling is gemaakt voor kinderen, vaak voor een bepaalde leeftijd. Een familievoorstelling is bedoeld voor kinderen en volwassenen samen: de grappen en het verhaal werken voor jong en oud, zodat je er als gezin naartoe gaat."],
        ["Voor welke leeftijd is een voorstelling geschikt?", "Theaters geven een leeftijd op, zoals 2+, 4+ of 8+. Dat is de jongste leeftijd waarvoor de voorstelling geschikt is. Klik bij een voorstelling op <em>Tickets</em> voor de leeftijd en de speelduur op de site van het theater."],
        ["Hoe lang duurt een kindervoorstelling?", "Voorstellingen voor peuters en kleuters duren vaak 30 tot 45 minuten, voor oudere kinderen ongeveer een uur. Familievoorstellingen en musicals duren langer, vaak met een pauze."],
        ["Wanneer zijn er de meeste kinder- en familievoorstellingen?", "Vooral in het weekend, op woensdagmiddag en in de schoolvakanties, zoals de herfstvakantie, de kerstvakantie en de voorjaarsvakantie. Veel voorstellingen beginnen 's middags."],
      ],
    },
    improvisatie: {
      kop: "Improvisatietheater", meervoud: "improvisatievoorstellingen", wie: "spelers", kleur: "paars",
      titel: `Improvisatietheater agenda ${SEIZOEN}: voorstellingen`,
      uitleg: "Bij improvisatietheater (impro) bestaat er geen script: de spelers maken scènes, personages en soms liedjes ter plekke, vaak op basis van suggesties uit het publiek. Geen voorstelling is daardoor hetzelfde.",
      vragen: [
        ["Wat is improvisatietheater?", "Theater zonder script: de spelers verzinnen alles ter plekke, vaak met suggesties uit de zaal."],
      ],
    },
  };
  const genreLijst = (g) => up.filter((x) => heeftGenre(x, g));
  const GENRE_PAGINAS = Object.keys(GENRE_INFO).filter((g) => GENRES[g] && genreLijst(g).length);
  const genreLink = (g) => `<a href="/agenda/${g}/">${esc(GENRE_INFO[g].kop)}</a>`;

  function genrePagina(g) {
    const info = GENRE_INFO[g], list = genreLijst(g), pad = `/agenda/${g}/`;
    const artiesten = telPer(list.flatMap((x) => V.get(x.voorstelling).artiesten).filter((id) => !isFestival(id)), (id) => id).slice(0, 6);
    const steden = telPer(list, (x) => T.get(x.theater).plaats);
    const zalen = new Set(list.map((x) => x.theater)).size;
    const perMaand = telPer(list, (x) => x.datum.slice(0, 7)).sort((a, b) => a[0].localeCompare(b[0]));
    const drukste = [...perMaand].sort((a, b) => b[1] - a[1])[0];
    const tryouts = list.filter((x) => x.soort === "try-out").length;
    const anders = GENRE_PAGINAS.filter((x) => x !== g);
    // "Oudejaarsconference 2026" -> "oudejaarsconference"
    const onderwerp = info.kop.replace(/ \d{4}$/, "").toLowerCase();
    const naamMet = ([id, n]) => `${artiestLink(A.get(id))} (${n})`;
    const tekst = [`<p>${info.uitleg}</p>`];
    tekst.push(`<p>De komende tijd staan er ${list.length.toLocaleString("nl-NL")} ${info.meervoud} in de agenda, in ${plural(zalen, "zaal", "zalen")} in ${plural(steden.length, "plaats", "plaatsen")}.${artiesten.length ? ` Het vaakst te zien zijn ${opsomming(artiesten.map(naamMet))}.` : ""} De meeste voorstellingen zijn in ${opsomming(steden.slice(0, 5).map(([p, n]) => `${plaatsLink(p)} (${n})`))}.</p>`);
    tekst.push(`<p>Wil je alles zien? In de <a href="/agenda/?genre=${g}">agenda</a> staan alle ${esc(info.meervoud)}, met zoeken op artiest, plaats of theater. Of kijk bij de andere genres: ${opsomming(anders.map(genreLink))}.</p>`);
    const vragen = [...(info.extraVragen ? info.extraVragen(list) : []), ...info.vragen];
    if (info.extra) tekst.push(...info.extra(list));
    if (artiesten.length) vragen.push([`Welke ${info.wie} spelen het vaakst?`, `De komende tijd ${opsomming(artiesten.slice(0, 5).map(naamMet))}. Tussen haakjes staat het aantal voorstellingen.`]);
    vragen.push([`Waar zie ik ${onderwerp} bij mij in de buurt?`, `De meeste voorstellingen zijn in ${opsomming(steden.slice(0, 6).map(([p]) => plaatsLink(p)))}. Op <a href="/plaatsen/">Plaatsen</a> vind je alles per plaats, en in de <a href="/agenda/?genre=${g}">agenda</a> kun je zoeken op je eigen woonplaats.`]);
    if (drukste && perMaand.length > 1) vragen.push(["In welke maand zijn de meeste voorstellingen?", `In ${maandNaam(drukste[0])}, met ${plural(drukste[1], "voorstelling", "voorstellingen")}.`]);
    if (tryouts) vragen.push(["Zijn er ook try-outs?", `Ja, er staan ${plural(tryouts, "try-out", "try-outs")} in de agenda: voorstellingen van een nieuw programma vóór de première, vaak met goedkopere kaarten. Alle try-outs staan op <a href="/agenda/try-outs/">try-outs</a>.`]);
    vragen.push(["Hoe koop ik kaarten?", "Klik bij een voorstelling op <em>Tickets</em>: die knop opent de pagina van het theater of de club, waar je kaarten kunt bestellen. Cabaretiers.com verkoopt zelf geen kaarten."]);
    // Affiches van voorstellingen in dit genre; de lijst toont de eerstvolgende avonden (alles staat in de agenda).
    const affiches = nuInTheater(() => true, (v) => genresVanV(v).includes(g));
    const MAX = 150, groot = list.length > MAX ? zoekbareLijst(list, { max: MAX, genre: g }) : null;
    const eerste = groot ? groot.eerste : list;
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">${esc(info.kop)}</h1><p>${plural(list.length, "voorstelling", "voorstellingen")} in ${plural(steden.length, "plaats", "plaatsen")}</p></div>
      ${info.intro ? info.intro(list) : ""}
    </section>
    ${affiches ? `<section class="wall wall-sub" aria-labelledby="nu-title">
      <div class="wrap wall-head"><h2 id="nu-title">Nu in het theater</h2></div>
      ${strip("strip-nu", `${info.kop}: nu in het theater`, affiches)}
    </section>` : ""}
    <section class="block wrap az-blok" aria-labelledby="lijst-titel">
      <h2 class="sub-head" id="lijst-titel">${list.length > MAX ? "Eerstvolgende voorstellingen" : "Alle voorstellingen"}</h2>
      ${groot ? groot.html : `${list.length > 12 ? filters(list, { maand: true }) : ""}
      <div id="gigs">${monthGroups(list, { verbergGenre: g })}</div>
      ${list.length > 12 ? leegBlok : ""}`}
      ${genrePlaatsen(g).length ? `<section class="genre-plaatsen" aria-labelledby="gp-titel">
        <h2 class="sub-head" id="gp-titel">${esc(info.kop)} per plaats</h2>
        <p class="genre-plaats-top">${genrePlaatsen(g).slice(0, 24).map(([p, n]) => `<a href="${genrePlaatsPad(g, p)}">${esc(p)} <span>${n}</span></a>`).join("")}</p>
        <details class="genre-plaats-alles"><summary>Alle ${genrePlaatsen(g).length} plaatsen</summary>
        ${Object.keys(LANDEN).map((land) => { const hier = genrePlaatsen(g).filter(([p]) => landVanPlaats(p) === land).sort((a, b) => a[0].localeCompare(b[0], "nl")); return hier.length ? `<h3>${LANDEN[land]}</h3><ul class="genre-plaats-lijst">${hier.map(([p, n]) => `<li><a href="${genrePlaatsPad(g, p)}">${esc(p)}</a> <span>${n}</span></li>`).join("")}</ul>` : ""; }).join("")}
        </details>
      </section>` : ""}
      <section class="seo-tekst prose" aria-labelledby="over-titel">
        <h2 id="over-titel">Over ${esc(onderwerp)}</h2>
        ${tekst.join("\n        ")}
      </section>
      ${faqHtml(vragen, `Veelgestelde vragen over ${onderwerp}`)}
    </section>`;
    const namen = artiesten.slice(0, 3).map(([id]) => A.get(id).naam);
    const desc = info.desc ? info.desc(list, steden, namen) : zinnen(`${info.kop} in ${SEIZOEN}: ${plural(list.length, "voorstelling", "voorstellingen")} in ${plural(steden.length, "plaats", "plaatsen")} in Nederland en België.`, namen.length ? `Met onder meer ${opsomming(namen)}.` : "", "Kaarten koop je bij het theater.");
    return layout({ title: info.titel, description: desc, path: pad, section: "agenda", body,
      schema: { type: "CollectionPage", kruimels: [["Agenda", "/agenda/"], [info.kop, pad]], extra: [...eventsLd(eerste), faqLd(vragen, pad)] } });
  }

  // ---------- Try-outs: /agenda/try-outs/ ----------
  // Alle try-outs (soort "try-out", niet geannuleerd); de lijst toont de eerstvolgende 150, de rest via /agenda/?soort=try-out.
  const tryoutLijst = up.filter((g) => g.soort === "try-out" && g.status !== "geannuleerd");
  function tryoutPagina() {
    const list = tryoutLijst, pad = "/agenda/try-outs/";
    const artiesten = telPer(list.flatMap((x) => V.get(x.voorstelling).artiesten).filter((id) => !isFestival(id) && !GEEN_CABARETIER.test(A.get(id).naam)), (id) => id);
    const steden = telPer(list, (x) => T.get(x.theater).plaats);
    const zalen = telPer(list, (x) => x.theater);
    const genres = telPer(list, (x) => V.get(x.voorstelling).genre);
    const perMaand = telPer(list, (x) => x.datum.slice(0, 7));
    const uit = list.filter((x) => x.status === "uitverkocht").length;
    const naamMet = ([id, n]) => `${artiestLink(A.get(id))} (${n})`;
    // Na de try-outs de première: voorstellingen met try-outs én een première in de agenda.
    const premieres = [...new Set(list.map((x) => x.voorstelling))]
      .map((vid) => up.find((g) => g.voorstelling === vid && g.soort === "première" && g.status !== "geannuleerd"))
      .filter(Boolean).sort((a, b) => a.datum.localeCompare(b.datum));
    const wat = (g) => `${esc(artistNames(g.voorstelling) || V.get(g.voorstelling).titel)}${echteTitel(g.voorstelling) ? ` met <em>${esc(echteTitel(g.voorstelling))}</em>` : ""}`;
    const tekst = [];
    tekst.push(`<p>Een try-out is een voorstelling van een nieuw programma vóór de première. De artiest speelt het programma dan voor publiek om te kijken wat werkt: grappen kunnen nog veranderen, scènes kunnen verdwijnen of erbij komen. Kaarten voor een try-out zijn vaak goedkoper dan voor de voorstelling na de première.</p>`);
    tekst.push(`<p>De komende tijd staan er ${list.length.toLocaleString("nl-NL")} try-outs in de agenda, ${periode(list)}, in ${plural(zalen.length, "zaal", "zalen")} in ${plural(steden.length, "plaats", "plaatsen")}.${artiesten.length ? ` De meeste try-outs spelen ${opsomming(artiesten.slice(0, 6).map(naamMet))}.` : ""} Ze zijn vooral in ${opsomming(steden.slice(0, 5).map(([p, n]) => `${plaatsLink(p)} (${n})`))}.${uit ? ` ${uit} try-outs zijn al uitverkocht.` : ""}</p>`);
    if (genres.length > 1) tekst.push(`<p>Het gaat om ${opsomming(genres.slice(0, 4).map(([g, n]) => `${n} keer ${GENRE_PAGINAS.includes(g) ? `<a href="/agenda/${g}/">${esc(GENRE_TEKST[g])}</a>` : esc(GENRE_TEKST[g])}`))}.</p>`);
    if (premieres.length) tekst.push(`<p>Na de try-outs volgt de première. In de agenda staan onder meer ${opsomming(premieres.slice(0, 4).map((g) => `${wat(g)} op ${fmt.dayMonth(g.datum)} in ${theaterLink(g.theater)}`))}.</p>`);
    const vragen = [
      ["Wat is een try-out?", "Een voorstelling van een nieuw programma vóór de première. Het programma is nog in ontwikkeling: de artiest test wat werkt en past de voorstelling daarna vaak nog aan."],
      ["Zijn try-outs goedkoper?", "Vaak wel: veel theaters vragen voor een try-out minder dan voor een voorstelling na de première. De prijs staat op de pagina van het theater; klik bij een voorstelling op <em>Tickets</em>."],
    ];
    if (artiesten.length) vragen.push(["Wie speelt er de komende tijd try-outs?", `Onder meer ${opsomming(artiesten.slice(0, 8).map(naamMet))}. Tussen haakjes staat het aantal try-outs.`]);
    vragen.push(["Waar zijn de meeste try-outs?", `In ${opsomming(steden.slice(0, 6).map(([p, n]) => `${plaatsLink(p)} (${n})`))}. De zalen met de meeste try-outs zijn ${opsomming(zalen.slice(0, 4).map(([id, n]) => `${theaterLink(id)} (${n})`))}.`]);
    const drukste = [...perMaand].sort((a, b) => b[1] - a[1])[0];
    if (drukste && perMaand.length > 1) vragen.push(["Wanneer zijn de meeste try-outs?", `In ${maandNaam(drukste[0])}, met ${plural(drukste[1], "try-out", "try-outs")}. Veel artiesten spelen hun try-outs in de maanden voor de première van een nieuw programma.`]);
    if (premieres.length) vragen.push(["Wanneer is de première na de try-outs?", `Dat verschilt per voorstelling. Bijvoorbeeld: ${opsomming(premieres.slice(0, 3).map((g) => `${wat(g)} op ${fmt.full(g.datum)} in ${theaterLink(g.theater)}`))}.`]);
    vragen.push(["Hoe koop ik kaarten voor een try-out?", "Klik bij een voorstelling op <em>Tickets</em>: die knop opent de pagina van het theater, waar je kaarten kunt bestellen. Cabaretiers.com verkoopt zelf geen kaarten."]);
    const affiches = nuInTheater(() => true, (v) => list.some((x) => x.voorstelling === v.id));
    const MAX = 150, groot = list.length > MAX ? zoekbareLijst(list, { max: MAX, soort: "try-out" }) : null;
    const eerste = groot ? groot.eerste : list;
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Try-outs</h1><p>${plural(list.length, "try-out", "try-outs")} in ${plural(steden.length, "plaats", "plaatsen")}: nieuwe programma's vóór de première</p></div>
    </section>
    ${affiches ? `<section class="wall wall-sub" aria-labelledby="nu-title">
      <div class="wrap wall-head"><h2 id="nu-title">Nu in try-out</h2></div>
      ${strip("strip-nu", "Try-outs: nu in het theater", affiches)}
    </section>` : ""}
    <section class="block wrap az-blok" aria-labelledby="lijst-titel">
      <h2 class="sub-head" id="lijst-titel">${list.length > MAX ? "Eerstvolgende try-outs" : "Alle try-outs"}</h2>
      ${groot ? groot.html : `${list.length > 12 ? filters(list, { maand: true }) : ""}
      <div id="gigs">${monthGroups(list, { verbergSoort: "try-out" })}</div>
      ${list.length > 12 ? leegBlok : ""}`}
      <section class="seo-tekst prose" aria-labelledby="over-titel">
        <h2 id="over-titel">Over try-outs</h2>
        ${tekst.join("\n        ")}
      </section>
      ${faqHtml(vragen, "Veelgestelde vragen over try-outs")}
    </section>`;
    const desc = zinnen(`Try-outs ${SEIZOEN}: ${plural(list.length, "voorstelling", "voorstellingen")} van nieuwe cabaret- en comedyprogramma's vóór de première, in ${plural(steden.length, "plaats", "plaatsen")}.`, "Vaak met goedkopere kaarten.", artiesten.length ? `Met onder meer ${opsomming(artiesten.slice(0, 2).map(([id]) => A.get(id).naam))}.` : "");
    return layout({ title: "Try-outs: cabaret en comedy vóór de première", description: desc, path: pad, section: "agenda", body,
      schema: { type: "CollectionPage", kruimels: [["Agenda", "/agenda/"], ["Try-outs", pad]], extra: [...eventsLd(eerste), faqLd(vragen, pad)] } });
  }

  // Landingspagina's per genre en plaats, zoals /agenda/cabaret/amsterdam/ (alleen de genres in GENRE_PER_PLAATS).
  const GENRE_PER_PLAATS = ["cabaret", "kindervoorstellingen"];
  const genrePlaatsPad = (g, p) => `/agenda/${g}/${plaatsId(p)}/`;
  // Alleen plaatsen met minstens GENRE_PLAATS_DREMPEL voorstellingen krijgen een pagina (anders te dun voor Google);
  // een verdwenen pagina stuurt public/.htaccess met een 301 door naar de plaatspagina.
  const GENRE_PLAATS_DREMPEL = 3;
  const genrePlaatsen = (g) => GENRE_PER_PLAATS.includes(g) ? telPer(genreLijst(g), (x) => T.get(x.theater).plaats).filter(([, n]) => n >= GENRE_PLAATS_DREMPEL) : [];
  const heeftGenrePlaats = (g, p) => GENRE_PAGINAS.includes(g) && genrePlaatsen(g).some(([x]) => x === p);
  const genrePlaatsPaginas = GENRE_PER_PLAATS.filter((g) => GENRE_PAGINAS.includes(g)).flatMap((g) => genrePlaatsen(g).map(([p]) => [g, p]));

  function genrePlaatsPagina(g, p) {
    const info = GENRE_INFO[g], pad = genrePlaatsPad(g, p), naam = esc(p);
    const list = genreLijst(g).filter((x) => T.get(x.theater).plaats === p);
    const alles = perPlaats(p);
    const zalen = telPer(list, (x) => x.theater);
    const artiestTel = telPer(list.filter((x) => V.get(x.voorstelling).artiesten.length), (x) => V.get(x.voorstelling).artiesten[0])
      .filter(([id]) => !isFestival(id) && !GEEN_CABARETIER.test(A.get(id).naam));
    const maanden = telPer(list, (x) => x.datum.slice(0, 7));
    const tryouts = bijzonder(list, "try-out"), premieres = bijzonder(list, "première");
    const eerste = list.find((x) => x.status !== "geannuleerd") || list[0];
    const onderwerp = info.kop.toLowerCase();
    // De grootste andere plaatsen met dit genre in hetzelfde land, om door te klikken.
    const andere = genrePlaatsen(g).filter(([x]) => x !== p && landVanPlaats(x) === landVanPlaats(p)).slice(0, 6);
    const top = artiestTel.slice(0, 8).map(([id, n]) => `<a href="${artiestPad(id)}">${esc(A.get(id).naam)}</a>${n > 1 ? ` (${keer(n)})` : ""}`);
    const enkelvoud = info.enkelvoud || `${onderwerp}voorstelling`;
    const tekst = [`<p>In ${naam} ${list.length === 1 ? `staat één ${enkelvoud}` : `staan ${list.length} ${info.meervoud}`} op de agenda, ${periode(list)}, ${zalen.length === 1 ? `in ${theaterLink(zalen[0][0])}` : `in ${plural(zalen.length, "zaal", "zalen")}: ${opsomming(zalen.slice(0, 6).map(([id, n]) => `${theaterLink(id)} (${n})`))}`}.${uitverkochtZin(list)}</p>`];
    if (top.length) tekst.push(`<p>${artiestTel.length === 1 ? `Op het programma staat ${top[0]}.` : `${artiestTel.length} ${info.wie} spelen de komende tijd in ${naam}, onder wie ${opsomming(top)}.`}${maanden.length > 1 && maanden[0][1] > 1 ? ` De drukste maand is ${fmt.monthYear(maanden[0][0] + "-01")}, met ${maanden[0][1]} voorstellingen.` : ""}</p>`);
    tekst.push(`<p>${info.uitleg}</p>`);
    tekst.push(`<p>Ook zin in iets anders? Op <a href="${plaatsPad(p)}">theater in ${naam}</a> staan alle ${plural(alles.length, "voorstelling", "voorstellingen")}, ook ${info.anders || "comedy en komisch theater"}. Alle ${esc(info.meervoud)} in Nederland en België vind je bij ${genreLink(g)}.${andere.length ? ` ${info.kop} in andere plaatsen: ${opsomming(andere.map(([x]) => `<a href="${genrePlaatsPad(g, x)}">${esc(x)}</a>`))}.` : ""}</p>`);
    const vragen = [];
    vragen.push([`${info.waar || `Waar is ${onderwerp}`} in ${p}?`, zalen.length === 1 ? `De komende tijd in ${theaterLink(zalen[0][0])}.` : `De komende tijd in ${opsomming(zalen.slice(0, 6).map(([id, n]) => `${theaterLink(id)} (${plural(n, "voorstelling", "voorstellingen")})`))}.`]);
    if (eerste) vragen.push([`Wanneer is de volgende ${enkelvoud} in ${p}?`, `Op ${esc(fmt.full(eerste.datum))}${eerste.tijd ? ` om ${eerste.tijd}` : ""}: ${esc(artistNames(eerste.voorstelling) || V.get(eerste.voorstelling).titel)} in ${theaterLink(eerste.theater)}.`]);
    if (top.length) vragen.push([`Welke ${info.wie} spelen in ${p}?`, `${opsomming(top.slice(0, 6))}. Tussen haakjes staat hoe vaak, als dat meer dan één keer is.`]);
    if (tryouts.length || premieres.length) vragen.push([`Zijn er try-outs of premières in ${p}?`, `Ja: ${opsomming([premieres.length && plural(premieres.length, "première", "premières"), tryouts.length && plural(tryouts.length, "try-out", "try-outs")].filter(Boolean))}. Bij een try-out is de voorstelling nog in ontwikkeling en zijn kaarten vaak goedkoper.`]);
    // Kindervoorstellingen: ouders zoeken vooral op het weekend, de woensdagmiddag en de familievoorstelling.
    if (g === "kindervoorstellingen") {
      const weekend = list.filter((x) => [0, 6].includes(weekdag(x.datum)) && x.status !== "geannuleerd");
      const woensdag = list.filter((x) => weekdag(x.datum) === 3 && x.status !== "geannuleerd");
      if (weekend.length) vragen.push([`Welke kindervoorstellingen zijn er in het weekend in ${p}?`, `${plural(weekend.length, "voorstelling", "voorstellingen")} op zaterdag of zondag, onder meer ${perNaam(weekend, 4)}.`]);
      if (woensdag.length) vragen.push([`Zijn er kindervoorstellingen op woensdagmiddag in ${p}?`, `Ja, ${plural(woensdag.length, "voorstelling", "voorstellingen")} op woensdag, onder meer ${perNaam(woensdag, 3)}.`]);
      vragen.push([`Zijn er ook familievoorstellingen in ${p}?`, `Ja. Veel voorstellingen in deze lijst zijn voor het hele gezin: de leeftijd (zoals 4+ of 6+) is de jongste leeftijd waarvoor ze geschikt zijn, ouders en grootouders genieten mee. Klik op <em>Tickets</em> voor de leeftijd en de speelduur bij het theater.`]);
    }
    vragen.push(["Hoe koop ik kaarten?", "Klik bij een voorstelling op <em>Tickets</em>: die knop opent de pagina van het theater, waar je kaarten kunt bestellen. Cabaretiers.com verkoopt zelf geen kaarten."]);
    const affiches = nuInTheater(() => true, (v) => genresVanV(v).includes(g) && list.some((x) => x.voorstelling === v.id));
    const body = `<section class="block wrap kop-plaats" aria-labelledby="t">
      <div class="block-head"><h1 id="t">${esc(info.kop)} in ${naam}</h1><p>${plural(list.length, "aankomende voorstelling", "aankomende voorstellingen")} in ${plural(zalen.length, "theater", "theaters")}</p></div>
    </section>
      ${affiches ? `<section class="wall wall-sub" aria-labelledby="nu-title">
      <div class="wrap wall-head"><h2 id="nu-title">Nu in het theater</h2></div>
      ${strip("strip-nu", `${info.kop} in ${p}: nu in het theater`, affiches)}
    </section>` : ""}
      <div class="wrap detail-body">
        ${list.length > 12 ? filters(list, { maand: true }) : ""}
        <div id="gigs">${monthGroups(list, { verbergGenre: g })}</div>
        ${list.length > 12 ? leegBlok : ""}
        <section class="seo-tekst prose" aria-labelledby="over-titel">
          <h2 id="over-titel">${esc(info.kop)} in ${naam}</h2>
          ${tekst.join("\n          ")}
        </section>
        ${faqHtml(vragen, `Veelgestelde vragen over ${onderwerp} in ${p}`)}
      </div>`;
    const desc = zinnen(`${info.kop} in ${p}: ${plural(list.length, "voorstelling", "voorstellingen")} in ${plural(zalen.length, "theater", "theaters")}.`, artiestTel.length ? `Met onder meer ${opsomming(artiestTel.slice(0, 3).map(([id]) => A.get(id).naam))}.` : "", "Kaarten koop je bij het theater.");
    return layout({ title: info.plaatsTitel ? info.plaatsTitel(p) : `${info.kop} in ${p}: agenda en kaarten`, description: desc, path: pad, section: "agenda", body,
      schema: { type: "CollectionPage", kruimels: [["Agenda", "/agenda/"], [info.kop, `/agenda/${g}/`], [p, pad]], extra: [...eventsLd(list), faqLd(vragen, pad)] } });
  }




  function festivalIndex() {
    const overzicht = festivalsOverzicht();
    const zonder = [...F.values()].filter((f) => !db.gigsForFestival(f.id).length).sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Cabaretfestivals</h1><p>Concoursen en festivals in Nederland en België, met hun finales en finalistentournees.</p></div>
      ${Object.entries(FESTIVALSOORTEN).map(([soort, kop]) => {
        const hier = festivalsMetData.filter(({ f }) => f.soort === soort);
        return hier.length ? `<h2 class="sub-head festival-kop">${esc(kop)}</h2>
      <div class="artists festival-kaarten">${kaartenRij(hier, ({ f }) => festivalKleur(f), festivalKaart)}</div>` : "";
      }).join("\n      ")}
      ${zonder.length ? `<h2 class="sub-head">Nog geen speeldata bekend</h2>
      <ul class="sources">${zonder.map((f) => `<li>${f.website ? `<a href="${esc(metUtm(f.website))}" rel="noopener">${esc(f.naam)}</a>` : esc(f.naam)} <span>${esc(f.plaats)}</span></li>`).join("")}</ul>` : ""}
      <section class="seo-tekst prose" aria-labelledby="over-titel">
        <h2 id="over-titel">Cabaretfestivals in Nederland en België</h2>
        ${overzicht.tekst.join("\n        ")}
      </section>
      ${faqHtml(overzicht.vragen, "Veelgestelde vragen over cabaretfestivals")}
    </section>`;
    return layout({ title: "Cabaretfestivals", description: kort(`Alle cabaretfestivals in Nederland en België: ${festivalsMetData.map(({ f }) => f.naam).join(", ")}. Finales, halve finales en finalistentournees.`), path: "/festivals/", section: "festivals", body,
      schema: { type: "CollectionPage", kruimels: [["Festivals", "/festivals/"]], hoofd: lijstLd([...F.values()].map((f) => [f.naam, `/festivals/${f.id}/`])), extra: [faqLd(overzicht.vragen, "/festivals/")] } });
  }

  function festivalTekst(f, list) {
    if (!list.length) return "";
    const steden = telPer(list, (g) => T.get(g.theater).plaats);
    const onderdelen = [...new Set(list.map((g) => V.get(g.voorstelling).titel))];
    const artiesten = [...new Set(list.flatMap((g) => V.get(g.voorstelling).artiesten))].filter((a) => !(f.artiesten || []).includes(a));
    const zinnen = [];
    zinnen.push(`<p>${esc(f.naam)} uit ${plaatsen.includes(f.plaats) ? plaatsLink(f.plaats) : esc(f.plaats)} staat ${keer(list.length)} op de agenda, ${periode(list)}. ` +
      `Op het programma: ${opsomming(onderdelen.slice(0, 5).map((t) => `<em>${esc(t)}</em>`))}. ` +
      (steden.length > 1 ? `De voorstellingen zijn te zien in ${steden.length} plaatsen: ${opsomming(steden.slice(0, 10).map(([p]) => plaatsLink(p)))}.` : `Alle voorstellingen zijn in ${plaatsLink(steden[0][0])}.`) + `</p>`);
    const p2 = [];
    if (artiesten.length) p2.push(`Op de speellijst staan ook ${opsomming(artiesten.slice(0, 6).map((a) => `<a href="${artiestPad(a)}">${esc(A.get(a).naam)}</a>`))}.`);
    const tekst = (p2.join(" ") + uitverkochtZin(list)).trim();
    if (tekst) zinnen.push(`<p>${tekst}</p>`);
    zinnen.push(`<p>${f.website ? `Meer over het festival, de deelnemers en de jury lees je op <a href="${esc(metUtm(f.website))}" rel="noopener">de website van ${esc(f.naam)}</a>. ` : ""}Bekijk ook <a href="/festivals/">alle cabaretfestivals</a>. ${kaartenZin}</p>`);
    return `<section class="seo-tekst prose" aria-labelledby="over-titel">
        <h2 id="over-titel">${esc(f.naam)} ${opsomming([...new Set(list.map((g) => String(fmt.year(g.datum))))])}</h2>
        ${zinnen.join("\n        ")}
      </section>`;
  }

  function festivalPagina(f) {
    const list = db.gigsForFestival(f.id);
    const steden = new Set(list.map((g) => T.get(g.theater).plaats)).size;
    const body = `<div class="detail-hero" style="${ink(festivalKleur(f))}"><div class="wrap">
        <h1>${esc(f.naam)}</h1>
        <p>Cabaretfestival uit ${plaatsen.includes(f.plaats) ? `<a href="${plaatsPad(f.plaats)}">${esc(f.plaats)}</a>` : esc(f.plaats)}. ${list.length ? `${plural(list.length, "speeldatum", "speeldata")} in ${plural(steden, "plaats", "plaatsen")}.` : "Op dit moment staan er geen speeldata in de agenda."}${f.website ? ` <a href="${esc(metUtm(f.website))}" rel="noopener">Website van het festival</a>` : ""}</p>
      </div></div>
      <div class="wrap detail-body">
        ${list.length > 12 ? filters(list, { maand: true }) : ""}
        <div id="gigs">${monthGroups(list)}</div>
        ${list.length > 12 ? leegBlok : ""}
        ${festivalTekst(f, list)}
      </div>`;
    const desc = list.length
      ? zinnen(`${f.naam} (${f.plaats}): ${plural(list.length, "voorstelling", "voorstellingen")}, van finale tot finalistentournee.`, "Bekijk alle speeldata en koop kaarten via het theater.")
      : `${f.naam}, cabaretfestival uit ${f.plaats}.`;
    const pad = `/festivals/${f.id}/`;
    return layout({ title: `${f.naam}: finales en finalistentournee`, description: desc, path: pad, section: "festivals", body,
      schema: {
        kruimels: [["Festivals", "/festivals/"], [f.naam, pad]],
        hoofd: { "@id": URL(pad + "#festival") },
        extra: [{
          "@type": "EventSeries", "@id": URL(pad + "#festival"), name: f.naam, url: URL(pad), description: desc,
          ...(f.website ? { sameAs: f.website } : {}),
          location: { "@type": "City", name: f.plaats },
          ...(list.length ? { startDate: isoWithOffset(list[0].datum, list[0].tijd), endDate: isoWithOffset(list.at(-1).datum, list.at(-1).tijd), subEvent: list.slice(0, 100).map((g) => ({ "@id": eventId(g) })) } : {}),
        }, ...eventsLd(list)],
      } });
  }

  // Tekst en vragen onder /theaters/, uit de cijfers van de agenda (werkt zich elke nacht bij).
  function theatersOverzicht() {
    const zalen = zalenMetData.map((t) => ({ t, n: db.gigsForTheater(t.id).length })).sort((a, b) => b.n - a.n || a.t.naam.localeCompare(b.t.naam, "nl"));
    const metAantal = ({ t, n }) => `${theaterLink(t.id)} (${n})`;
    // "Capitole Gent", maar "Arenberg in Antwerpen"
    const metPlaats = (t) => `${theaterLink(t.id)}${t.naam.includes(t.plaats) ? "" : ` in ${esc(t.plaats)}`}`;
    const nl = zalen.filter((x) => x.t.land === "NL"), be = zalen.filter((x) => x.t.land === "BE");
    const clubs = zalen.filter((x) => x.t.soort === "comedyclub");
    const steden = telPer(zalenMetData, (t) => t.plaats);
    const tekst = [];
    tekst.push(`<p>Cabaretiers.com volgt het programma van ${zalen.length} theaters, comedyclubs en podia: ${nl.length} in Nederland${be.length ? ` en ${be.length} in België` : ""}. Samen hebben ze ${tellers.speeldata.toLocaleString("nl-NL")} aankomende voorstellingen met cabaret, comedy en kleinkunst op de agenda.</p>`);
    tekst.push(`<p>De meeste voorstellingen staan in ${opsomming(zalen.slice(0, 5).map(metAantal))}. Naast de grote schouwburgen speelt veel comedy zich af in kleinere zalen en comedyclubs${clubs.length ? `, zoals ${opsomming(clubs.slice(0, 4).map(({ t }) => theaterLink(t.id)))}` : ""}. Daar staan vaak try-outs en nieuw talent op het podium.</p>`);
    tekst.push(`<p>Zoek hierboven op de naam van een theater of een plaats, of kies een stad: ${opsomming(steden.slice(0, 6).map(([p, n]) => `${plaatsLink(p)} (${plural(n, "zaal", "zalen")})`))}. Per theater zie je alle voorstellingen op datum, met een knop naar de kaartverkoop van de zaal zelf.</p>`);
    const vragen = [];
    vragen.push(["Welke theaters hebben de meeste cabaret en comedy?", `${opsomming(zalen.slice(0, 5).map(metAantal))}. Tussen haakjes staat het aantal aankomende voorstellingen.`]);
    vragen.push(["In welke stad zijn de meeste zalen met cabaret?", `${opsomming(steden.slice(0, 3).map(([p, n]) => `${plaatsLink(p)} (${plural(n, "zaal", "zalen")})`))}. Op de pagina van een plaats staan alle voorstellingen in die stad bij elkaar.`]);
    if (clubs.length) vragen.push(["Welke comedyclubs staan in de agenda?", clubs.length <= 6
      ? `${opsomming(clubs.map(({ t }) => metPlaats(t)))}. Daarnaast staat er veel comedy in gewone theaters en cultuurcentra.`
      : `${clubs.length} comedyclubs, onder meer ${opsomming(clubs.slice(0, 6).map(({ t }) => metPlaats(t)))}.`]);
    if (be.length) vragen.push(["Staan er ook Belgische zalen in?", `Ja, ${be.length}. De meeste voorstellingen in België zijn in ${opsomming(be.slice(0, 5).map(({ t, n }) => `${metPlaats(t)} (${n})`))}.`]);
    vragen.push(["Hoe koop ik kaarten?", "Kaarten koop je bij het theater zelf. Klik bij een voorstelling op <em>Tickets</em>: die knop opent de pagina van de zaal waar je kaarten kunt bestellen. Cabaretiers.com verkoopt zelf geen kaarten."]);
    vragen.push(["Hoe actueel is dit overzicht?", "De agenda wordt elke nacht bijgewerkt vanaf de websites van de theaters en de speellijsten van de artiesten. Voorstellingen die voorbij zijn, verdwijnen vanzelf."]);
    vragen.push(["Mijn theater staat er niet bij. Hoe kom ik in de agenda?", `Stuur een mail naar <a href="mailto:${SITE.email}">${SITE.email}</a> met de naam van de zaal en de pagina met het programma. Een theater verschijnt hier zodra er cabaret of comedy op het programma staat.`]);
    return { tekst, vragen };
  }

  // Tekst en veelgestelde vragen onder /agenda/, met de cijfers van de build.
  function agendaOverzicht() {
    const genres = telPer(up, (g) => V.get(g.voorstelling).genre);
    const genreTekst = (n) => opsomming(genres.slice(0, n).map(([g, k]) => `${GENRES[g].toLowerCase()} (${k.toLocaleString("nl-NL")})`));
    const artiesten = telPer(up.flatMap((g) => V.get(g.voorstelling).artiesten), (id) => id).slice(0, 5).map(([id, n]) => `${artiestLink(A.get(id))} (${n})`);
    const steden = telPer(up, (g) => T.get(g.theater).plaats).slice(0, 6);
    const perMaand = telPer(up, (g) => g.datum.slice(0, 7));
    const soort = (s) => up.filter((g) => g.soort === s).length;
    const be = up.filter((g) => T.get(g.theater).land === "BE").length;
    const uitverkocht = up.filter((g) => g.status === "uitverkocht").length;
    const maandLink = (m) => `<a href="/agenda/${maandId(m)}/">${maandNaam(m)}</a>`;
    const tekst = [];
    tekst.push(`<p>Op Cabaretiers.com vind je alle aankomende cabaret- en theatervoorstellingen met humor in Nederland en België op één plek: ${tellers.speeldata.toLocaleString("nl-NL")} voorstellingen van ${tellers.artiesten} artiesten in ${tellers.zalen} theaters, comedyclubs en podia${be ? `, waarvan ${be.toLocaleString("nl-NL")} in België` : ""}. Van de grote zaal van de schouwburg tot een klein vlakkevloertheater en een avond stand-up in de comedyclub.</p>`);
    tekst.push(`<p>Het aanbod is breed: ${genreTekst(5)}. Bij komedie gaat het om komedies, blijspellen en kluchten; gewoon toneel en musicals staan niet in deze agenda. De artiesten die nu het vaakst spelen, zijn ${opsomming(artiesten)}.</p>`);
    tekst.push(`<p>Bovenaan begin je met de voorstellingen van deze week; met één knop zie je alle volgende. Zoek op artiest, voorstelling, plaats of theater, kies een genre of verberg uitverkochte voorstellingen. Liever per maand bladeren? Kies ${opsomming(maanden.slice(0, 3).map(maandLink))}, of kijk wat er <a href="/vanavond/">vanavond</a> en <a href="/dit-weekend/">dit weekend</a> te zien is. De meeste voorstellingen zijn in ${opsomming(steden.map(([p, n]) => `${plaatsLink(p)} (${n})`))}.</p>`);
    const vragen = [];
    vragen.push(["Welke cabaretvoorstellingen zijn er vanavond?", `Op <a href="/vanavond/">Vanavond</a> staan alle voorstellingen van vandaag en morgen, en op <a href="/dit-weekend/">Dit weekend</a> die van vrijdag tot en met zondag. In deze agenda staat bovenaan de lopende week.`]);
    vragen.push(["Wat is het verschil tussen cabaret, stand-up en komedie?", "Cabaret is een avondvullende voorstelling van een of meer artiesten, met grappen, verhalen en vaak liedjes, meestal rond een thema. Stand-up is comedy waarin een comedian los van een verhaallijn grappen vertelt, vaak met meerdere comedians op een avond. Komedie is toneel met humor: komedies, blijspellen en kluchten met een vaste rolverdeling."]);
    vragen.push(["Wat is een try-out?", `Een try-out is een voorstelling die nog in ontwikkeling is: de artiest speelt het nieuwe programma voor publiek voordat de première is. Kaarten zijn vaak goedkoper en je ziet een programma als een van de eersten. In de agenda staan nu ${soort("try-out")} try-outs${soort("première") ? ` en ${soort("première")} premières` : ""}; je herkent ze aan het label bij de voorstelling.`]);
    vragen.push(["Welke cabaretiers spelen het vaakst?", `${opsomming(artiesten)}. Tussen haakjes staat het aantal aankomende voorstellingen. Op <a href="/artiesten/">Artiesten</a> staan alle cabaretiers en comedians.`]);
    vragen.push(["In welke maand zijn de meeste voorstellingen?", `In ${maandLink(perMaand[0][0])}, met ${perMaand[0][1].toLocaleString("nl-NL")} voorstellingen. Het theaterseizoen loopt van september tot en met mei; in de zomer spelen artiesten minder, behalve op festivals.`]);
    vragen.push(["Hoe vind ik een voorstelling bij mij in de buurt?", `Typ de naam van je plaats of theater in het zoekveld, of kies een plaats op <a href="/plaatsen/">Plaatsen</a>. Daar staan alle voorstellingen in die stad bij elkaar.`]);
    if (uitverkocht) vragen.push(["Wat als een voorstelling uitverkocht is?", `Dan staat er een stempel <em>Uitverkocht</em> bij (nu bij ${uitverkocht.toLocaleString("nl-NL")} voorstellingen). Vink <em>Uitverkocht verbergen</em> aan om alleen voorstellingen te zien waarvoor nog kaarten zijn. Vaak speelt dezelfde voorstelling ook in een andere zaal in de buurt.`]);
    vragen.push(["Hoe koop ik kaarten?", "Kaarten koop je bij het theater zelf. Klik bij een voorstelling op <em>Tickets</em>: die knop opent de pagina van de zaal waar je kaarten kunt bestellen. Cabaretiers.com verkoopt zelf geen kaarten."]);
    vragen.push(["Hoe actueel is de agenda?", "De agenda wordt elke nacht bijgewerkt vanaf de websites van de theaters en de speellijsten van de artiesten. Voorstellingen die voorbij zijn, verdwijnen vanzelf. Kijk voor de zekerheid altijd even op de site van het theater."]);
    return { tekst, vragen };
  }

  // /comedy-clubs/: alle comedyclubs met hun aankomende voorstellingen, en uitleg met veelgestelde vragen.
  function comedyclubsPagina() {
    const clubs = comedyclubs();
    const ids = new Set(clubs.map(({ t }) => t.id));
    const list = up.filter((g) => ids.has(g.theater));
    const steden = telPer(clubs.map(({ t }) => t), (t) => t.plaats);
    const genres = telPer(list, (g) => V.get(g.voorstelling).genre);
    const artiesten = telPer(list.flatMap((g) => V.get(g.voorstelling).artiesten), (id) => id).slice(0, 5).map(([id]) => artiestLink(A.get(id)));
    const metPlaats = (t) => `${theaterLink(t.id)}${t.naam.includes(t.plaats) ? "" : ` in ${esc(t.plaats)}`}`;
    const be = clubs.filter(({ t }) => t.land === "BE");
    const tekst = [];
    tekst.push(`<p>Een comedyclub is een kleine zaal of een café waar comedians vlak voor het publiek staan, vaak met een drankje erbij. Op een avond spelen meestal meerdere comedians kort na elkaar, met een presentator (MC) die de avond aan elkaar praat. Cabaretiers.com volgt ${plural(clubs.length, "comedyclub", "comedyclubs")} met samen ${plural(list.length, "aankomende voorstelling", "aankomende voorstellingen")}.</p>`);
    if (clubs.length) tekst.push(`<p>De meeste avonden zijn in ${opsomming(clubs.slice(0, 4).map(({ t, n }) => `${metPlaats(t)} (${n})`))}. ${genres.length ? `Het aanbod bestaat vooral uit ${opsomming(genres.slice(0, 3).map(([g, n]) => `${GENRES[g].toLowerCase()} (${n})`))}.` : ""} In comedyclubs proberen comedians ook nieuw materiaal uit en staat nieuw talent naast bekende namen.${artiesten.length ? ` Op het programma staan onder meer ${opsomming(artiesten)}.` : ""}</p>`);
    tekst.push(`<p>Veel stand-up is ook te zien in gewone theaters: kijk daarvoor in de <a href="/agenda/?genre=stand-up">agenda bij stand-up</a> of zoek een zaal op <a href="/theaters/">Theaters</a>.</p>`);
    const vragen = [];
    vragen.push(["Wat is een comedyclub?", "Een zaal, café of kelder die vooral stand-upcomedy programmeert. Je zit dicht op het podium, en op een avond zie je vaak meerdere comedians, met een presentator die de avond aan elkaar praat. Een voorstelling in een comedyclub is meestal korter en losser dan een avondvullende cabaretvoorstelling in het theater."]);
    if (clubs.length) vragen.push(["Welke comedyclubs staan in de agenda?", `${opsomming(clubs.map(({ t }) => metPlaats(t)))}.`]);
    if (steden.length) vragen.push(["In welke stad zijn de meeste comedyclubs?", `${opsomming(steden.slice(0, 3).map(([p, n]) => `${plaatsLink(p)} (${plural(n, "club", "clubs")})`))}.`]);
    if (be.length) vragen.push(["Zijn er ook comedyclubs in België?", `Ja: ${opsomming(be.map(({ t }) => metPlaats(t)))}.`]);
    vragen.push(["Wat is het verschil tussen stand-up en cabaret?", "Bij stand-up vertelt een comedian grappen en verhalen, vaak zonder decor of vaste verhaallijn. Cabaret is meestal een avondvullende voorstelling rond een thema, vaak met liedjes. In comedyclubs staat vooral stand-up, in theaters vooral cabaret, maar veel artiesten doen allebei."]);
    vragen.push(["Hoe koop ik kaarten voor een comedyclub?", "Klik bij een voorstelling op <em>Tickets</em>: die knop opent de pagina van de club, waar je kaarten kunt bestellen. Cabaretiers.com verkoopt zelf geen kaarten. Comedyclubs zijn klein, dus populaire avonden zijn snel uitverkocht."]);
    vragen.push(["Mijn comedyclub staat er niet bij. Hoe kom ik in de agenda?", `Stuur een mail naar <a href="mailto:${SITE.email}">${SITE.email}</a> met de naam van de club en de pagina met het programma.`]);
    // Zoals /festivals/: per land een kop met gekleurde kaarten (de kleur volgt uit de zaal, buren nooit gelijk).
    const zonder = [...T.values()].filter((t) => t.soort === "comedyclub" && !ids.has(t.id)).sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
    const kaarten = Object.keys(LANDEN).map((land) => {
      const hier = clubs.filter(({ t }) => t.land === land);
      return hier.length ? `<h2 class="sub-head festival-kop">${esc(LANDEN[land])}</h2>
      <div class="artists festival-kaarten">${kaartenRij(hier, ({ t }) => zaalKleur(t), clubKaart)}</div>` : "";
    }).join("\n      ");
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Comedy Clubs</h1><p>Comedyclubs en comedycafés in Nederland en België, met hun stand-up en open mics.</p></div>
      ${kaarten || `<p class="empty">Op dit moment staan er geen voorstellingen in comedyclubs gepland.</p>`}
      ${zonder.length ? `<h2 class="sub-head">Nog geen speeldata bekend</h2>
      <ul class="sources">${zonder.map((t) => `<li>${t.website ? `<a href="${esc(metUtm(t.website))}" rel="noopener">${esc(t.naam)}</a>` : esc(t.naam)} <span>${esc(t.plaats)}</span></li>`).join("")}</ul>` : ""}
      <section class="seo-tekst prose" aria-labelledby="over-titel">
        <h2 id="over-titel">Stand-up en comedy in comedyclubs</h2>
        ${tekst.join("\n        ")}
      </section>
      ${faqHtml(vragen, "Veelgestelde vragen over comedyclubs")}
    </section>`;
    const desc = kort(`Alle comedyclubs in Nederland en België met hun programma: ${plural(list.length, "voorstelling", "voorstellingen")} in ${opsomming(clubs.slice(0, 3).map(({ t }) => t.naam))}${clubs.length > 3 ? " en meer" : ""}.`);
    return layout({ title: "Comedy Clubs: stand-up en comedy", description: desc, path: "/comedy-clubs/", section: "comedyclubs", body, schema: { type: "CollectionPage", kruimels: [["Comedy Clubs", "/comedy-clubs/"]], hoofd: lijstLd(clubs.map(({ t }) => [t.naam, `/theaters/${t.id}/`])), extra: [faqLd(vragen, "/comedy-clubs/")] } });
  }

  function theaterIndex() {
    const overzicht = theatersOverzicht();
    const kolommen = Object.keys(LANDEN).map((land) => {
      const steden = [...new Set(zalenMetData.filter((t) => t.land === land).map((t) => t.plaats))].sort((a, b) => a.localeCompare(b, "nl"));
      if (!steden.length) return "";
      return `<div><h2>${LANDEN[land]}</h2>${steden.map((p) => `<div class="stad"><h3 class="city-head"><a href="${plaatsPad(p)}">${esc(p)}</a></h3><ul class="venue-list">${zalenMetData.filter((t) => t.plaats === p).sort((a, b) => a.naam.localeCompare(b.naam, "nl")).map((t) => {
        const n = db.gigsForTheater(t.id).length;
        return `<li data-zoek="${esc(`${t.naam} ${t.plaats}`.toLowerCase())}"><a href="/theaters/${t.id}/"><span><span class="vn">${esc(t.naam)}</span>${t.soort !== "theater" ? `<span class="vc">${esc(t.soort)}</span>` : ""}</span><span class="vk">${plural(n, "voorstelling", "voorstellingen")}</span></a></li>`;
      }).join("")}</ul></div>`).join("")}</div>`;
    }).join("");
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Theaters</h1><p>${tellers.zalen} zalen, comedyclubs en podia met aankomende voorstellingen.</p></div>
      <nav class="month-nav stad-nav" aria-label="Theaters met de meeste voorstellingen">${zalenMetData.map((t) => [t, db.gigsForTheater(t.id).length]).sort((x, y) => y[1] - x[1] || x[0].naam.localeCompare(y[0].naam, "nl")).slice(0, 15).map(([t, n]) =>
        `<a href="/theaters/${t.id}/"><b>${esc(t.naam)}</b><span>${esc(t.plaats)} · ${plural(n, "voorstelling", "voorstellingen")}</span></a>`).join("")}</nav>
      <div class="az-tools">
        <div class="field search">
          <label for="f-theater">Zoek een theater of plaats</label>
          <input id="f-theater" type="search" autocomplete="off" placeholder="Bijvoorbeeld: Carré of Utrecht">
        </div>
      </div>
      <div class="venues" id="theaterlijst">${kolommen}</div>
      <p class="empty" id="theaters-leeg" hidden>Geen theater of plaats gevonden met deze naam.</p>
      <section class="seo-tekst prose" aria-labelledby="over-titel">
        <h2 id="over-titel">Theaters met cabaret en comedy</h2>
        ${overzicht.tekst.join("\n        ")}
      </section>
      ${faqHtml(overzicht.vragen, "Veelgestelde vragen over theaters")}
    </section>`;
    return layout({ title: "Theaters en zalen met cabaret en comedy", description: kort(`${plural(zalenMetData.length, "theater", "theaters")}, comedyclubs en podia in Nederland en België met cabaret en comedy op het programma, per plaats, met hun aankomende voorstellingen.`), path: "/theaters/", section: "theaters", body, schema: { type: "CollectionPage", kruimels: [["Theaters", "/theaters/"]], hoofd: lijstLd([...zalenMetData].sort((x, y) => x.naam.localeCompare(y.naam, "nl")).map((t) => [t.naam, `/theaters/${t.id}/`])), extra: [faqLd(overzicht.vragen, "/theaters/")] } });
  }

  function theaterPage(t) {
    const list = db.gigsForTheater(t.id);
    const body = `<div class="detail-hero" style="--bg:var(--riso-blue);--fg:#FFF"><div class="wrap${t.foto ? " hero-met-foto" : ""}">
        <div>
        <h1>${esc(t.naam)}</h1>
        <p>${t.voorheen ? `Voorheen ${esc(t.voorheen.naam)}. ` : ""}<a href="${plaatsPad(t.plaats)}">${esc(t.plaats)}</a>, ${LANDEN[t.land]}. ${list.length ? `${plural(list.length, "aankomende voorstelling", "aankomende voorstellingen")}.` : "Op dit moment staan er geen voorstellingen gepland."}${t.website ? ` <a href="${esc(metUtm(t.website))}" rel="noopener">Website van het theater</a>` : ""}</p>
        </div>
        ${t.foto ? fotoHtml(t, "theater-foto") : ""}
      </div></div>
      <div class="wrap detail-body">
        ${list.length > 12 ? filters(list, { maand: true }) : ""}
        <div id="gigs">${monthGroups(list, { showVenue: false })}</div>
        ${list.length > 12 ? leegBlok : ""}
        ${theaterTekst(t, list)}
        ${list.length ? faqHtml(theaterVragen(t, list), `Veelgestelde vragen over ${t.naam}`) : ""}
      </div>`;
    const desc = list.length
      ? zinnen(`Wat speelt er in ${t.naam}${t.naam.includes(t.plaats) ? "" : ` in ${t.plaats}`}? ${plural(list.length, "voorstelling", "voorstellingen")} cabaret en comedy in seizoen ${SEIZOEN}.`, (() => { const n = [...new Set(list.flatMap((g) => V.get(g.voorstelling).artiesten))].slice(0, 3).map((x) => A.get(x).naam); return n.length ? `Met onder meer ${opsomming(n)}.` : ""; })(), "Met links naar de kaartverkoop.")
      : `Cabaret en comedy in ${t.naam} (${t.plaats}).`;
    const beschrijving = t.voorheen ? zinnen(`Wat speelt er in ${t.naam} (voorheen ${t.voorheen.naam}) in ${t.plaats}? ${plural(list.length, "voorstelling", "voorstellingen")} comedy en cabaret in seizoen ${SEIZOEN}.`, "Met links naar de kaartverkoop.") : desc;
    // Titel: "<zaal> <plaats> programma 2026-2027", met de genres als het past.
    const zaalTitel = `${t.naam}${t.naam.includes(t.plaats) ? "" : ` ${t.plaats}`} programma ${SEIZOEN}`;
    return layout({ title: `${zaalTitel}: cabaret en comedy`.length <= 62 ? `${zaalTitel}: cabaret en comedy` : zaalTitel, description: beschrijving, path: `/theaters/${t.id}/`, section: "theaters", body, schema: { foto: t.foto ? t : null, kruimels: [["Theaters", "/theaters/"], [t.naam, `/theaters/${t.id}/`]], hoofd: { "@id": zaalLd(t.id)["@id"] }, extra: [{ ...zaalLd(t.id), containedInPlace: plaatsLd(t.plaats) }, ...eventsLd(list), ...(list.length ? [faqLd(theaterVragen(t, list), `/theaters/${t.id}/`)] : [])] } });
  }

  function privacy() {
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Privacy en cookies</h1></div>
      <div class="prose">
        <p>Cabaretiers.com is een agenda: je hoeft geen account te maken en we vragen je geen gegevens. Wat we wel doen, staat hieronder.</p>
        <h2 id="analytics">Bezoekersstatistieken (Google Analytics)</h2>
        <p>Alleen als je in de cookiemelding op <em>Akkoord</em> klikt, meten we met Google Analytics hoe de site wordt gebruikt: welke pagina's je bekijkt, via welke site of zoekterm je binnenkomt, het soort apparaat en browser, en ongeveer in welk land of welke plaats je bent. We tellen ook op welke knop <em>Tickets</em> of <em>Meer info</em> je klikt (bij welk theater, welke artiest en welke voorstelling), zodat we theaters en artiesten kunnen laten zien hoeveel bezoekers we naar hun kaartverkoop sturen. Google Analytics zet daarvoor cookies (<code>_ga</code>). Klik je op <em>Liever niet</em>, dan laden we Google Analytics niet en worden er geen cookies gezet.</p>
        <p>Google bewaart de gegevens maximaal 14 maanden. Google kan gegevens verwerken in de Verenigde Staten, onder het EU-VS-gegevensprivacykader.</p>
        <p><button type="button" class="knop-secundair" data-cookies-wijzig hidden>Cookiekeuze wijzigen</button></p>
        <h2 id="opslag">Wat er in je browser blijft staan</h2>
        <p>Je keuze in de cookiemelding bewaren we in je eigen browser (<code>cabaretiers-cookies</code>), zodat we het niet elke keer opnieuw vragen. Dat gaat niet naar ons of naar anderen.</p>
        <h2 id="video">Video's</h2>
        <p>Gebruik je <a href="/in-de-buurt/">Bij mij in de buurt</a> en geef je toestemming voor je locatie, dan rekent je eigen browser de afstand tot de theaters uit. Je locatie gaat niet naar ons of naar anderen en wordt niet bewaard.</p>
        <p>Op sommige artiestpagina's staan video's van YouTube. Die laden pas als je erop klikt; dan maakt je browser verbinding met YouTube (in de privacyvriendelijke modus zonder cookies vooraf) en gelden de privacyregels van Google.</p>
        <h2 id="links">Links naar theaters en sociale media</h2>
        <p>Via <em>Tickets</em> ga je naar de site van het theater of de artiest, en via de iconen onderaan naar onze pagina's op Instagram, Facebook, YouTube en TikTok. Daar gelden hun eigen privacyregels. Aan de link naar het theater voegen we een label toe (<code>utm_source=cabaretiers.com</code>), zodat het theater in zijn eigen statistieken ziet dat je via Cabaretiers.com komt. Daarmee geven wij geen gegevens over jou door.</p>
        <h2 id="mail">Mail</h2>
        <p>Mail je ons, dan gebruiken we je adres alleen om je te antwoorden.</p>
        <h2 id="rechten">Vragen</h2>
        <p>Vragen over privacy, of wil je weten welke gegevens we van je hebben? Mail naar <a href="mailto:${SITE.email}">${SITE.email}</a>. Ben je het niet eens met hoe we met je gegevens omgaan, dan kun je een klacht indienen bij de <a href="https://www.autoriteitpersoonsgegevens.nl/" rel="noopener">Autoriteit Persoonsgegevens</a>.</p>
      </div>
    </section>`;
    return layout({ title: "Privacy en cookies", description: "Hoe Cabaretiers.com omgaat met bezoekersstatistieken, cookies en je gegevens.", path: "/privacy/", body, schema: { kruimels: [["Privacy en cookies", "/privacy/"]] } });
  }

  function about() {
    const bronnen = zalenMetData.filter((t) => t.website).sort((a, b) => a.plaats.localeCompare(b.plaats, "nl") || a.naam.localeCompare(b.naam, "nl"));
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Over de agenda</h1></div>
      <div class="about">
        <div class="prose">
          <p>Cabaretiers.com verzamelt alle aankomende cabaret- en comedyvoorstellingen in Nederland en België: theatercabaret, stand-up in comedyclubs en cafés, festivals, open mics en komisch toneel. Je ziet per avond wie waar speelt, en per artiest, plaats of zaal de volledige speellijst.</p>
          <p>Op dit moment staan er ${tellers.speeldata.toLocaleString("nl-NL")} voorstellingen in de agenda, van ${tellers.artiesten} artiesten in ${tellers.zalen} zalen.</p>
          <p>Elke speeldatum heeft een bron. De knop <em>Tickets</em> brengt je naar die bron, de speellijst van het theater of de artiest: daar koop je kaarten en controleer je de datum. Datums waarover bronnen elkaar tegenspreken, staan gemarkeerd als <em>datum onzeker</em>.</p>
          <h2 id="aanmelden">Zelf voorstellingen aanmelden</h2>
          <p>Speel je zelf, of programmeer je een zaal of comedyclub? Mail je speellijst of de link naar je agenda naar <a href="mailto:${SITE.email}">${SITE.email}</a>, dan nemen we je voorstellingen op.</p>
          <h2 id="contact">Contact</h2>
          <p>Vragen, een fout gezien in de agenda, of een tip voor een zaal die nog ontbreekt? Mail naar <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>
        </div>
        <ol class="steps">
          <li><div><b>Speellijsten ophalen</b><span>Elke nacht lezen we de agenda's van theaters en comedyclubs uit, en volgen we hun regels voor bezoek door programma's.</span></div></li>
          <li><div><b>Samenvoegen en controleren</b><span>Dezelfde artiest of voorstelling bij verschillende zalen wordt herkend. Verschillen worden gemarkeerd.</span></div></li>
          <li><div><b>Publiceren</b><span>Nieuwe data staan de volgende ochtend in de agenda, met een link naar de bron.</span></div></li>
        </ol>
      </div>
      <h2 class="sub-head" id="bronnen">Waar de gegevens vandaan komen</h2>
      <ul class="sources">${bronnen.map((t) => `<li><a href="${esc(metUtm(t.website))}" rel="noopener">${esc(t.naam)}</a> <span>${esc(t.plaats)}</span></li>`).join("")}</ul>
    </section>`;
    return layout({ title: "Over de agenda", path: "/over/", section: "over", body, schema: { type: "AboutPage", kruimels: [["Over de agenda", "/over/"]], over: { "@id": ORG_ID } } });
  }

  function notFound() {
    const body = `<section class="block wrap"><div class="block-head"><h1>Deze pagina bestaat niet</h1></div>
      <p>Misschien is de voorstelling al geweest of is de link veranderd.</p>
      <p><a class="btn" href="/agenda/">Naar de agenda</a></p></section>`;
    return layout({ title: "Pagina niet gevonden", path: "/404.html", section: null, body });
  }

  // Controlepagina voor de beheerder (/controle/): hoe het ophalen ging en wat er nieuw is.
  // Niet in het menu, niet in de sitemap en niet in zoekmachines.
  function controlePagina({ rapport, log, alleenSpeellijst }) {
    const vandaag = db.today;
    const dagen = (d) => Math.round((new Date(vandaag) - new Date(d)) / 864e5);
    const datumTekst = (d) => (d ? fmt.full(d) : "onbekend");
    const bronnen = new Map((rapport.bronnen || []).map((b) => [b.bron, b]));
    const regels = Object.entries(log || {}).map(([id, l]) => ({ id, ...l, samen: bronnen.get(id) }));
    const waarschuwingen = [];
    if (rapport.datum && dagen(rapport.datum) > 1) waarschuwingen.push(`Er is sinds ${datumTekst(rapport.datum)} niet meer samengevoegd. Draait de nachtelijke run nog? Kijk bij Actions op GitHub.`);
    for (const r of regels) {
      if (!r.gelukt) waarschuwingen.push(`<strong>${esc(r.naam)}</strong> is mislukt op ${datumTekst(r.datum)}: ${esc(r.fout || "onbekende fout")}. De vorige vondsten blijven staan.`);
      else if (dagen(r.datum) > 2) waarschuwingen.push(`<strong>${esc(r.naam)}</strong> is sinds ${datumTekst(r.datum)} niet opgehaald.`);
      else if (r.aantal === 0) waarschuwingen.push(`<strong>${esc(r.naam)}</strong> leverde geen enkele speeldatum op. Is de website veranderd?`);
      else if (r.samen && r.samen.vorige >= 10 && r.samen.speeldata + (r.samen.dubbel || 0) < r.samen.vorige / 2) waarschuwingen.push(`<strong>${esc(r.naam)}</strong> leverde ${r.samen.speeldata} speeldata, de vorige keer ${r.samen.vorige}. Is de website veranderd?`);
    }
    if (rapport.controleren) waarschuwingen.push(`${plural(rapport.controleren, "geval staat", "gevallen staan")} in data/te-controleren.json.`);

    const g = rapport.geschiedenis || [], gisteren = g.length > 1 ? g[g.length - 2] : null;
    const verschil = (k) => { if (!gisteren) return ""; const d = rapport.totaal[k] - gisteren[k]; return d ? ` <span class="verschil">(${d > 0 ? "+" : ""}${d})</span>` : ""; };
    const tegel = (k, label) => `<div><strong>${rapport.totaal?.[k] ?? "–"}</strong>${verschil(k)}<span>${label}</span></div>`;
    const theaterLink = (id, naam) => (db.gigsForTheater(id).length ? `<a href="/theaters/${id}/">${esc(naam)}</a>` : esc(naam));
    const artiestLink = (id, naam) => (db.gigsForArtist(id).length ? `<a href="${artiestPad(id)}">${esc(naam)}</a>` : esc(naam));
    const site = (w) => (w ? `<a href="${esc(w)}" rel="noopener nofollow">${esc(w.replace(/^https?:\/\/(www\.)?/, ""))}</a>` : `<span class="mis">geen</span>`);
    const nieuw = rapport.nieuw || {};
    const volgorde = (r) => (!r.gelukt ? 0 : r.aantal === 0 ? 1 : 2);
    const body = `<section class="block wrap controle" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Controle</h1><p>Hoe het ophalen ging en wat er nieuw is. Laatst samengevoegd: ${datumTekst(rapport.datum)}. Deze pagina staat niet in het menu en niet in zoekmachines. Bezoekcijfers staan op het <a href="/dashboard/">dashboard</a>.</p></div>
      ${waarschuwingen.length ? `<div class="let-op"><h2>Let op</h2><ul>${waarschuwingen.map((w) => `<li>${w}</li>`).join("")}</ul></div>` : `<p class="alles-goed">Alles in orde: alle bronnen zijn gelukt.</p>`}
      <div class="tegels">${tegel("komend", "komende speeldata")}${tegel("artiesten", "artiesten")}${tegel("zalen", "zalen")}${tegel("plaatsen", "plaatsen")}${tegel("voorstellingen", "voorstellingen")}</div>

      <h2 class="sub-head">Nieuw op ${datumTekst(rapport.datum)}</h2>
      <div class="nieuw-kolommen">
        <div><h3>Artiesten (${(nieuw.artiesten || []).length})</h3>${(nieuw.artiesten || []).length ? `<ul>${nieuw.artiesten.map((a) => `<li>${artiestLink(a.id, a.naam)}</li>`).join("")}</ul>` : "<p>Geen.</p>"}</div>
        <div><h3>Zalen (${(nieuw.zalen || []).length})</h3>${(nieuw.zalen || []).length ? `<ul>${nieuw.zalen.map((t) => `<li>${theaterLink(t.id, t.naam)}, ${esc(t.plaats)}${t.land === "BE" ? " (België)" : ""}</li>`).join("")}</ul>` : "<p>Geen.</p>"}</div>
        <div><h3>Voorstellingen (${(nieuw.voorstellingen || []).length})</h3>${(nieuw.voorstellingen || []).length ? `<ul>${nieuw.voorstellingen.map((v) => `<li>${esc(v.titel)} <span class="mis">${esc(v.artiesten.map((a) => A.get(a)?.naam).filter(Boolean).join(", "))}</span></li>`).join("")}</ul>` : "<p>Geen.</p>"}</div>
      </div>

      <h2 class="sub-head">Bronnen</h2>
      <div class="tabel"><table>
        <thead><tr><th>Bron</th><th>Status</th><th>Opgehaald</th><th>Speeldata</th><th>Vorige keer</th><th>Duur</th></tr></thead>
        <tbody>${regels.sort((a, b) => volgorde(a) - volgorde(b) || a.naam.localeCompare(b.naam, "nl")).map((r) => `<tr class="${!r.gelukt ? "fout" : r.aantal === 0 ? "waarschuwing" : ""}">
          <td>${esc(r.naam)}</td><td>${r.gelukt ? "gelukt" : "mislukt"}</td><td>${r.datum ? fmt.dayMonth(r.datum) : "–"}</td>
          <td>${r.samen ? r.samen.speeldata + (r.samen.dubbel ? ` <span class="mis">+${r.samen.dubbel} al bekend</span>` : "") : r.aantal ?? "–"}</td><td>${r.samen?.vorige ?? "–"}</td><td>${r.seconden != null ? `${Math.round(r.seconden / 60) ? `${Math.round(r.seconden / 60)} min` : `${r.seconden} s`}` : "–"}</td>
        </tr>`).join("")}</tbody>
      </table></div>

      <h2 class="sub-head">Zalen die alleen uit speellijsten komen (${alleenSpeellijst.length})</h2>
      <p>Deze zalen kent de agenda alleen van de speellijsten van artiesten. Loop ze af en toe na op dubbelen, een verkeerde plaats of een verkeerd land, en zet het recht in <code>data/zaal-aliassen.json</code> (zie README).</p>
      <div class="tabel"><table>
        <thead><tr><th>Plaats</th><th>Zaal</th><th>Land</th><th>Website</th><th>Komend</th></tr></thead>
        <tbody>${alleenSpeellijst.map((t) => `<tr><td>${esc(t.plaats)}</td><td>${theaterLink(t.id, t.naam)}<br><code>${esc(t.id)}</code></td><td>${t.land}</td><td>${site(t.website)}</td><td>${db.gigsForTheater(t.id).length}</td></tr>`).join("")}</tbody>
      </table></div>

      <h2 class="sub-head">Verloop</h2>
      <div class="tabel"><table>
        <thead><tr><th>Datum</th><th>Komende speeldata</th><th>Artiesten</th><th>Zalen</th><th>Plaatsen</th></tr></thead>
        <tbody>${[...g].reverse().slice(0, 30).map((x) => `<tr><td>${fmt.dayMonth(x.datum)}</td><td>${x.komend}</td><td>${x.artiesten}</td><td>${x.zalen}</td><td>${x.plaatsen}</td></tr>`).join("")}</tbody>
      </table></div>
    </section>`;
    return layout({ title: "Controle", description: "Controle van de agenda.", path: "/controle/", body, noindex: true });
  }

  // Bezoekerscijfers voor de beheerder (/dashboard/ en per maand /dashboard/<maand-jaar>/): cijfers uit Google
  // Analytics (data/ga-dashboard.json, geschreven door `npm run ga -- dashboard`). Net als /controle/ niet in menu,
  // sitemap of zoekmachines. `data` is het hele bestand, `periodeId` de gekozen periode ("" = laatste 28 dagen).
  // Kaart van Nederland en België met een stip per plaats, zo groot als het aantal bezoekers (Google Analytics,
  // dimensies country/region/city). Coördinaten uit data/plaatsen-geo.json (GeoNames), provincies uit src/kaart.mjs
  // (Natural Earth); beide maakt scripts/kaart.mjs. Gewone SVG met een tooltip per stip: werkt zonder JavaScript.
  let plaatsenGeo;
  const laadGeo = () => {
    if (!plaatsenGeo) {
      const p = JSON.parse(readFileSync(new globalThis.URL("../data/plaatsen-geo.json", import.meta.url), "utf8")).plaatsen;
      const perLand = new Map(); // land|naam -> eerste treffer, als de provincie niet klopt of ontbreekt
      for (const [k, v] of Object.entries(p)) { const [land, , naam] = k.split("|"); if (!perLand.has(`${land}|${naam}`)) perLand.set(`${land}|${naam}`, v); }
      plaatsenGeo = { p, perLand };
    }
    return plaatsenGeo;
  };
  // Coördinaten van een plaats uit de agenda (voor /in-de-buurt/): de naam zoals in GeoNames (zonder accenten, met of
  // zonder streepjes), anders een verwijzing uit data/plaats-coordinaten.json. Onbekend: null.
  let plaatsAlias;
  const geoCache = new Map();
  function geoPlaats(plaats, land) {
    const sleutel = `${land}|${plaats}`;
    if (geoCache.has(sleutel)) return geoCache.get(sleutel);
    const { p, perLand } = laadGeo();
    plaatsAlias ??= JSON.parse(readFileSync(new globalThis.URL("../data/plaats-coordinaten.json", import.meta.url), "utf8")).aliassen;
    const n = String(plaats).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const c = (plaatsAlias[sleutel] && p[plaatsAlias[sleutel]]) || perLand.get(`${land}|${n}`) || perLand.get(`${land}|${n.replace(/-/g, " ")}`) || perLand.get(`${land}|${n.replace(/ /g, "-")}`) || null;
    geoCache.set(sleutel, c);
    return c;
  }
  const GA_REGIO = {
    Netherlands: { land: "NL", regio: { Drenthe: "01", Friesland: "02", Gelderland: "03", Groningen: "04", Limburg: "05", "North Brabant": "06", "North Holland": "07", Utrecht: "09", Zeeland: "10", "South Holland": "11", Overijssel: "15", Flevoland: "16" } },
    Belgium: { land: "BE", regio: { Brussels: "BRU", Flanders: "VLG", Wallonia: "WAL" } },
  };
  function bezoekersKaart(steden, getal) {
    laadGeo();
    const zoek = (r) => {
      const g = GA_REGIO[r.country];
      if (!g || !r.city || r.city === "(not set)") return null;
      const naam = r.city.toLowerCase();
      return plaatsenGeo.p[`${g.land}|${g.regio[r.region]}|${naam}`] || plaatsenGeo.perLand.get(`${g.land}|${naam}`) || null;
    };
    const totaal = { NL: 0, BE: 0, elders: 0, onbekend: 0 };
    const punten = new Map();
    for (const r of steden) {
      const land = GA_REGIO[r.country]?.land;
      const n = Number(r.activeUsers || 0);
      if (!land) { totaal[r.country === "(not set)" ? "onbekend" : "elders"] += n; continue; }
      totaal[land] += n;
      const c = zoek(r);
      if (!c) { totaal.onbekend += n; continue; }
      const k = `${land}|${r.city}`;
      const oud = punten.get(k) || { naam: r.city, land, c, bezoekers: 0, bezoeken: 0 };
      oud.bezoekers += n; oud.bezoeken += Number(r.sessions || 0);
      punten.set(k, oud);
    }
    // Plaatsnamen zoals Google ze in het Engels geeft, in het Nederlands.
    const NL_NAAM = { "The Hague": "Den Haag", Antwerp: "Antwerpen", Ghent: "Gent", Brussels: "Brussel", Bruges: "Brugge", Liege: "Luik", Louvain: "Leuven", Ostend: "Oostende", Mechelen: "Mechelen", Namur: "Namen", Mons: "Bergen", Courtrai: "Kortrijk", Hasselt: "Hasselt", Tournai: "Doornik" };
    const lijst = [...punten.values()].sort((a, b) => b.bezoekers - a.bezoekers);
    if (!lijst.length) return `<p class="mis">Nog geen plaatsen bekend.</p>`;
    const max = lijst[0].bezoekers;
    const straal = (n) => Math.max(4, 46 * Math.sqrt(n / max));
    const xy = ([lat, lon]) => [(lon - KAART.lon0) * KAART.k * KAART.schaal, (KAART.lat1 - lat) * KAART.schaal];
    const naamVan = (p) => NL_NAAM[p.naam] || p.naam;
    const stippen = [...lijst].reverse().map((p) => {
      const [x, y] = xy(p.c);
      return `<circle class="ga-stip" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${straal(p.bezoekers).toFixed(1)}"><title>${esc(naamVan(p))}: ${getal(p.bezoekers)} bezoekers, ${getal(p.bezoeken)} bezoeken</title></circle>`;
    }).join("");
    // Namen bij de grootste plaatsen: rechts van de stip, anders links, en niet over een andere naam of een grotere stip.
    const grote = lijst.slice(0, 30).map((p) => { const [x, y] = xy(p.c); return { x, y, r: straal(p.bezoekers), p }; });
    const bezet = [];
    const raakt = (v, eigen) => bezet.some((o) => v.x0 < o.x1 && v.x1 > o.x0 && v.y0 < o.y1 && v.y1 > o.y0)
      || grote.some((g) => g.p !== eigen && g.p.bezoekers > eigen.bezoekers && g.r > 8 && (Math.max(v.x0, Math.min(g.x, v.x1)) - g.x) ** 2 + (Math.max(v.y0, Math.min(g.y, v.y1)) - g.y) ** 2 < g.r ** 2);
    const labels = [];
    for (const { x, y, r, p } of grote.slice(0, 14)) {
      const tekst = `${naamVan(p)} ${getal(p.bezoekers)}`;
      const b = 13 * tekst.length + 10, h = 30;
      const keuzes = [
        { x0: x + r + 6, x1: x + r + 6 + b, kant: "start" },
        { x0: x - r - 6 - b, x1: x - r - 6, kant: "end" },
      ].map((v) => ({ ...v, y0: y - h / 2, y1: y + h / 2 })).filter((v) => v.x0 > 0 && v.x1 < KAART.breedte);
      const vak = keuzes.find((v) => !raakt(v, p));
      if (!vak) continue;
      bezet.push(vak);
      labels.push(`<text x="${(vak.kant === "start" ? vak.x0 + 4 : vak.x1 - 4).toFixed(1)}" y="${(y + 9).toFixed(1)}" text-anchor="${vak.kant}">${esc(naamVan(p))} <tspan>${getal(p.bezoekers)}</tspan></text>`);
    }
    const svg = `<svg class="ga-landkaart" viewBox="0 0 ${KAART.breedte} ${KAART.hoogte}" role="img" aria-label="Kaart van Nederland en België met de bezoekers per plaats">
      <g class="ga-provincies">${PROVINCIES.map((p) => `<path class="ga-${p.land.toLowerCase()}" d="${p.d}"><title>${esc(p.naam)}</title></path>`).join("")}${MEREN.map((m) => `<path class="ga-meer" d="${m.d}"/>`).join("")}</g>
      <g>${stippen}</g><g class="ga-labels" aria-hidden="true">${labels.join("")}</g></svg>`;
    const deel = (n) => `${getal(n)} (${Math.round((100 * n) / (totaal.NL + totaal.BE + totaal.elders + totaal.onbekend || 1))}%)`;
    return `<p class="ga-noot">Bezoekers per plaats, volgens Google Analytics. Hoe groter de stip, hoe meer bezoekers. De plaats komt uit het internetadres en is soms die van de internetaanbieder. Ga met de muis op een stip staan voor de cijfers, of open de lijst onder de kaart.</p>
      ${svg}
      <ul class="ga-landen"><li><strong>Nederland</strong> ${deel(totaal.NL)}</li><li><strong>België</strong> ${deel(totaal.BE)}</li><li><strong>Elders</strong> ${deel(totaal.elders)}</li><li><strong>Plaats onbekend</strong> ${deel(totaal.onbekend)}</li></ul>
      <details class="ga-plaatslijst"><summary>Alle ${lijst.length} plaatsen als lijst</summary><ol>${lijst.map((p) => `<li>${esc(naamVan(p))}${p.land === "BE" ? ' <span class="mis">(België)</span>' : ""} <span class="ga-num">${getal(p.bezoekers)}</span></li>`).join("")}</ol></details>
      <p class="ga-bron">Kaart: Natural Earth. Plaatsen: GeoNames (CC BY 4.0).</p>`;
  }

  const dashboardPad = (id) => (id ? `/dashboard/${id}/` : "/dashboard/");
  function dashboardPagina(data, periodeId = "") {
    const getal = (n) => Number(n || 0).toLocaleString("nl-NL");
    const perioden = data?.perioden || [];
    const ga = perioden.find((p) => p.id === periodeId);
    const pad = dashboardPad(periodeId);
    // Keuzelijst van perioden: een uitklapmenu met gewone links, werkt ook zonder JavaScript.
    const keuze = perioden.length ? `<details class="ga-keuze">
        <summary>${esc(ga?.naam || "Kies een periode")}</summary>
        <ul>${perioden.map((p) => `<li><a href="${dashboardPad(p.id)}"${p.id === periodeId ? ' aria-current="page"' : ""}>${esc(p.naam)}</a></li>`).join("")}</ul>
      </details>` : "";
    const kop = `<div class="block-head"><h1 id="t">Bezoekerscijfers</h1>${keuze}</div>`;
    if (!ga?.overzicht?.length) {
      const body = `<section class="block wrap dashboard" aria-labelledby="t">${kop}
        <p class="let-op">${perioden.length ? "Nog geen cijfers voor deze periode." : `Nog geen cijfers. Zet het geheim <code>GA_SERVICE_ACCOUNT_B64</code> bij GitHub (Settings &gt; Secrets and variables &gt; Actions); de volgende run haalt ze dan op.`}</p></section>`;
      return layout({ title: "Bezoekerscijfers", description: "Bezoekcijfers van de agenda.", path: pad, body, noindex: true });
    }
    const dagen = ga.overzicht;
    const som = (rijen, k) => rijen.reduce((s, r) => s + Number(r[k] || 0), 0);
    const bezoeken = som(dagen, "sessions"), weergaven = som(dagen, "screenPageViews");
    const klikken = som(ga.tickets || [], "eventCount");
    const dagNaam = (iso) => `${fmt.weekday(iso)} ${fmt.dayMonth(iso)}`;

    // Bezoeken (staven) en paginaweergaven (lijn) per dag, gewone HTML met een SVG-lijn: werkt zonder JavaScript.
    // Elk heeft een eigen schaal en een eigen strook, zodat ze elkaar niet raken (de getallen staan erbij):
    // de staven in de onderste helft, de lijn in de strook daarboven (55% tot 92% van de hoogte).
    const n = dagen.length;
    const maxBezoek = Math.max(...dagen.map((d) => d.sessions), 1);
    const maxWeergave = Math.max(...dagen.map((d) => d.screenPageViews), 1);
    const hBalk = (d) => (46 * d.sessions) / maxBezoek;
    const hLijn = (d) => 55 + (37 * d.screenPageViews) / maxWeergave;
    const xMidden = (i) => ((i + 0.5) * 100) / n;
    const punten = dagen.map((d, i) => `${(i + 0.5).toFixed(2)},${(100 - hLijn(d)).toFixed(2)}`).join(" ");
    const perDag = `<div class="ga-legenda"><span class="ga-leg-balk"></span>Bezoeken <span class="ga-leg-lijn"></span>Paginaweergaven</div>
      <div class="ga-combi"><div class="ga-combi-binnen" style="min-width:${n * 40}px">
        <div class="ga-plot" role="img" aria-label="Bezoeken en paginaweergaven per dag">
          ${dagen.map((d) => `<div class="ga-kolom" title="${esc(dagNaam(d.date))}: ${getal(d.sessions)} bezoeken, ${getal(d.screenPageViews)} paginaweergaven, ${getal(d.activeUsers)} bezoekers"><span class="ga-balk" style="height:${hBalk(d).toFixed(1)}%"><span>${getal(d.sessions)}</span></span></div>`).join("")}
          <svg class="ga-lijn" viewBox="0 0 ${n} 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${punten}" fill="none" vector-effect="non-scaling-stroke"/></svg>
          ${dagen.map((d, i) => `<span class="ga-punt" style="left:${xMidden(i).toFixed(2)}%;bottom:${hLijn(d).toFixed(2)}%"></span><span class="ga-punt-getal" style="left:${xMidden(i).toFixed(2)}%;bottom:${hLijn(d).toFixed(2)}%">${getal(d.screenPageViews)}</span>`).join("")}
        </div>
        <div class="ga-assen">${dagen.map((d) => `<span>${esc(fmt.weekdayShort(d.date))}<br>${esc(fmt.day(d.date))} ${esc(fmt.monthShort(d.date))}</span>`).join("")}</div>
      </div></div>`;

    // Tabel met een balkje bij de weergaven; rijen: { naam (HTML), sub (tekst), weergaven, bezoekers? }.
    const tabel = (kop, rijen, metBezoekers) => {
      const max = Math.max(...rijen.map((r) => r.weergaven), 1);
      return `<div class="tabel ga-tabel"><table><thead><tr><th>${kop}</th><th class="ga-num">Weergaven</th>${metBezoekers ? `<th class="ga-num ga-smal-weg">Bezoekers</th>` : ""}</tr></thead><tbody>${rijen.map((r) => `<tr><td class="ga-pad">${r.naam}${r.sub ? ` <span class="mis">${esc(r.sub)}</span>` : ""}</td>
        <td class="ga-num"><span class="ga-celbalk" style="width:${((3.5 * r.weergaven) / max).toFixed(2)}rem"></span>${getal(r.weergaven)}</td>${metBezoekers ? `<td class="ga-num ga-smal-weg">${getal(r.bezoekers)}</td>` : ""}</tr>`).join("") || `<tr><td colspan="3" class="mis">Nog geen weergaven.</td></tr>`}</tbody></table></div>`;
    };
    const paginas = tabel("Pagina", (ga.paginas || []).map((p) => ({ naam: `<a href="${esc(p.pagePath)}">${esc(p.pagePath)}</a>`, weergaven: p.screenPageViews, bezoekers: p.activeUsers })), true);
    // Weergaven per id opgeteld: /artiesten/<id>/ telt ook de voorstellingspagina's eronder mee, /theaters-in-<plaats>/ (en het oude /plaatsen/<plaats>/) ook vanavond en dit weekend.
    const perId = (rijen) => {
      const m = new Map();
      for (const r of rijen || []) {
        const id = r.pagePath.split("/")[2];
        if (id) m.set(id, (m.get(id) || 0) + r.screenPageViews);
      }
      return [...m].sort((x, y) => y[1] - x[1]).slice(0, 50);
    };
    const link = (pad, naam, bestaat) => (bestaat ? `<a href="${esc(pad)}">${esc(naam)}</a>` : esc(naam));
    const theaters = tabel("Theater", perId(ga.theaters).map(([id, w]) => {
      const th = T.get(id);
      return { naam: link(`/theaters/${id}/`, th?.naam || id, th && db.gigsForTheater(id).length), sub: th?.plaats, weergaven: w };
    }));
    const artiesten = tabel("Artiest", perId(ga.artiesten).map(([id, w]) => {
      const a = A.get(id);
      return { naam: link(artiestPad(id), a?.naam || id, a && db.gigsForArtist(id).length), weergaven: w };
    }));
    const kaart = bezoekersKaart(ga.steden || [], getal);

    const body = `<section class="block wrap dashboard" aria-labelledby="t">
      ${kop}

      <div class="ga-tegels">
        <div class="ga-tegel" style="--bg:var(--riso-orange)"><h2>Bezoeken</h2><strong>${getal(bezoeken)}</strong><p>Sessies op de site, alle dagen samen.</p></div>
        <div class="ga-tegel" style="--bg:var(--riso-yellow)"><h2>Paginaweergaven</h2><strong>${getal(weergaven)}</strong><p>Gemiddeld ${(bezoeken ? weergaven / bezoeken : 0).toLocaleString("nl-NL", { maximumFractionDigits: 1 })} pagina's per bezoek.</p></div>
        <div class="ga-tegel" style="--bg:var(--riso-lime)"><h2>Tickets-klikken</h2><strong>${getal(klikken)}</strong><p>Keer doorgeklikt naar een theater om kaartjes te kopen.</p></div>
      </div>

      <section class="ga-kaart"><h2 class="sub-head">Bezoeken en paginaweergaven per dag</h2>
      ${perDag}</section>

      <div class="ga-twee">
        <section class="ga-kaart"><h2 class="sub-head">Meest bekeken pagina's</h2><p class="ga-noot">De 50 pagina's met de meeste weergaven.</p>${paginas}</section>
        <section class="ga-kaart"><h2 class="sub-head">Meest bekeken theaters</h2><p class="ga-noot">Weergaven van de theaterpagina's.</p>${theaters}</section>
      </div>

      <div class="ga-twee">
        <section class="ga-kaart"><h2 class="sub-head">Meest bekeken artiesten</h2><p class="ga-noot">Artiestpagina en voorstellingspagina's samen.</p>${artiesten}</section>
        <section class="ga-kaart"><h2 class="sub-head">Waar komen de bezoekers vandaan?</h2>${kaart}</section>
      </div>
    </section>`;
    return layout({ title: `Bezoekerscijfers ${ga.naam.toLowerCase()}`, description: "Bezoekcijfers van de agenda.", path: pad, body, noindex: true });
  }

  return {
    controlePagina, dashboardPagina, dashboardPad, nieuwsPagina, nieuwsBericht, inDeBuurtPagina,
    home, agendaIndex, agendaData, agendaMaand, dagPagina, stadPaginas, plaatsIndex, plaatsPagina, artistIndex, comedyclubsPagina, festivalVan, genrePagina, GENRE_PAGINAS, cabaretiersPagina, artistPage, theaterIndex, theaterPage, about, privacy, notFound,
    voorstellingPagina, festivalIndex, festivalPagina, maanden, plaatsen, plaatsId, plaatsPad, maandId, tryoutPagina, tryoutLijst, genrePlaatsPaginas, genrePlaatsPagina, genrePlaatsPad, voorstellingPaden: voorstellingPad,
  };
}
