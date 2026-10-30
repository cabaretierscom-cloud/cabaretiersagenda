// HTML-templates. Elke functie geeft een string terug; build.mjs schrijft ze weg.
import { LANDEN, STATUSSEN, GENRES, KLEUREN, FESTIVALSOORTEN, isGroep } from "./data.mjs";
import { fmt, esc, plural, isoWithOffset } from "./format.mjs";
import { WOORDMERK_SVG, C_PAD, C_KADER } from "./woordmerk.mjs";
import { readFileSync } from "node:fs";
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

export const SITE = {
  name: "Cabaretiers.com",
  url: "https://www.cabaretiers.com",
  email: "hallo@cabaretiers.com",
  // Google Analytics 4; laadt pas na toestemming via de cookiemelding (public/cookies.js).
  analytics: "G-MWXCPP6KM0",
  description: "De theateragenda van Nederland en België: alle aankomende cabaret- en comedyvoorstellingen, theaters en artiesten op één plek.",
  // Sociale media: icoon in de footer en sameAs in de gestructureerde gegevens van de organisatie.
  social: [
    { naam: "Instagram", url: "https://www.instagram.com/cabaretiers_com/", icoon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>' },
    { naam: "Facebook", url: "https://www.facebook.com/profile.php?id=61595656450246", icoon: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8z"/></svg>' },
    { naam: "YouTube", url: "https://www.youtube.com/@cabaretiers", icoon: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M2.5 7.2c.2-1.5 1.3-2.5 2.8-2.6C7.4 4.4 9.7 4.3 12 4.3s4.6.1 6.7.3c1.5.1 2.6 1.1 2.8 2.6.2 1.6.3 3.2.3 4.8s-.1 3.2-.3 4.8c-.2 1.5-1.3 2.5-2.8 2.6-2.1.2-4.4.3-6.7.3s-4.6-.1-6.7-.3c-1.5-.1-2.6-1.1-2.8-2.6-.2-1.6-.3-3.2-.3-4.8s.1-3.2.3-4.8zM10 8.8v6.4l5.5-3.2z"/></svg>' },
    { naam: "TikTok", url: "https://www.tiktok.com/@cabaretiers.com", icoon: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 3c.3 2.3 1.7 3.9 4 4.1v3.3c-1.5.1-2.8-.4-4-1.2v6.2c0 3.6-2.6 6.1-6 6.1s-6.1-2.5-6.1-5.9c0-3.5 2.9-6 6.6-5.6v3.4c-1.7-.4-3.2.6-3.2 2.2 0 1.4 1.1 2.4 2.5 2.4 1.5 0 2.6-1 2.6-2.8V3z"/></svg>' },
  ],
};

const ICON = {
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

export function createTemplates(db) {
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
  const FOOTER_LINKS = [
    ["Artiesten", "/artiesten/", "Alle artiesten", ["esther-van-der-voort", "roel-c-verburg", "richard-groenendijk", "theo-maassen", "plien-en-bianca"]
      .filter((id) => A.has(id) && db.gigsForArtist(id).length).map((id) => [A.get(id).naam, `/artiesten/${id}/`])],
    ["Theaters", "/theaters/", "Alle theaters", ["kleine-komedie", "comedy-cafe-amsterdam", "stadsschouwburg-groningen", "parktheater-eindhoven", "stadsschouwburg-utrecht"]
      .filter((id) => T.has(id) && db.gigsForTheater(id).length).map((id) => [T.get(id).naam, `/theaters/${id}/`])],
    ["Plaatsen", "/plaatsen/", "Alle plaatsen", ["Rotterdam", "Amsterdam", "Eindhoven", "Den Haag", "Utrecht"]
      .filter((p) => up.some((g) => T.get(g.theater).plaats === p)).map((p) => [p, `/plaatsen/${plaatsId(p)}/`])],
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
      ["over", "/over/", "Over"],
    ].map(([key, href, label]) =>
      `<a href="${href}"${key === section ? ' aria-current="page"' : ""}>${label}</a>`).join("");
    const fullTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} | Agenda voor cabaret, stand-up comedy en theater`;
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
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/logo.svg" type="image/svg+xml">
<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
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
    <p class="contact">Contact: <a href="mailto:${SITE.email}">${SITE.email}</a> · <a href="/privacy/">Privacy</a></p>
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
  function ticketKnop(g) {
    const kopen = !["uitverkocht", "geannuleerd", "verplaatst"].includes(g.status);
    const wie = artistNames(g.voorstelling) || V.get(g.voorstelling).titel;
    return `<a class="btn tickets${kopen ? "" : " ghost"}" href="${esc(g.bron)}" target="_blank" rel="noopener nofollow"><span class="ticket-tekst">${kopen ? "Tickets" : "Meer info"}</span><span class="ticket-strook">${ICON.extern}</span><span class="visually-hidden">: ${esc(wie)} op ${fmt.full(g.datum)} in ${esc(T.get(g.theater).naam)} (externe website, opent in een nieuw tabblad)</span></a>`;
  }

  function statusLabel(g) {
    if (g.status === "uitverkocht") return `<span class="status sold stempel">Uitverkocht</span>`;
    if (g.status === "onzeker")
      return `<span class="status doubt"${g.opmerking ? ` title="${esc(g.opmerking)}"` : ""}>${ICON.doubt}Datum onzeker</span>`;
    if (g.status === "geannuleerd" || g.status === "verplaatst")
      return `<span class="status sold">${ICON.sold}${STATUSSEN[g.status]}</span>`;
    return "";
  }

  function gigRow(g, { showArtist = true, showVenue = true } = {}) {
    const v = V.get(g.voorstelling), t = T.get(g.theater);
    const zoek = [v.titel, t.naam, t.plaats, ...v.artiesten.map((a) => A.get(a).naam)].join(" ").toLowerCase();
    // Voor de knop "Zet in je agenda" (public/agenda.js): wat, waar en hoe laat.
    const inAgenda = ["geannuleerd", "verplaatst"].includes(g.status) ? ""
      : ` data-wat="${esc(v.artiesten.length ? [artistNames(g.voorstelling), echteTitel(g.voorstelling)].filter(Boolean).join(": ") : v.titel)}" data-locatie="${esc(`${t.naam}, ${t.plaats}`)}"${g.tijd ? ` data-tijd="${g.tijd}"` : ""}`;
    return `<article class="gig${g.status === "geannuleerd" ? " cancelled" : ""}" data-datum="${g.datum}" data-land="${t.land}" data-plaats="${esc(t.plaats)}" data-genre="${v.genre}" data-status="${g.status}" data-zoek="${esc(zoek)}" data-waar="${esc(`${t.naam} ${t.plaats}`.toLowerCase())}"${inAgenda}>
      <div class="date"><b>${fmt.day(g.datum)}</b><small>${fmt.weekdayShort(g.datum)}${g.tijd ? " " + g.tijd : ""}</small></div>
      <div class="main">
        <span class="swatch" style="${ink(leadInk(g.voorstelling))};background:var(--bg)" aria-hidden="true"></span>
        <div class="main-text">
          ${showArtist ? `<span class="artist">${artistLinks(g.voorstelling)}</span>` : ""}
          <span class="show">${showArtist && !v.artiesten.length ? esc(t.naam) : (echteTitel(g.voorstelling) ? showLink(g.voorstelling, esc(echteTitel(g.voorstelling))) : esc(showArtist ? "" : v.titel))}${g.soort ? ` <span class="pill">${esc(g.soort)}</span>` : ""}</span>
        </div>
      </div>
      <div class="venue">${showVenue ? `<a href="/theaters/${t.id}/">${esc(t.naam)}</a><span><a href="/plaatsen/${plaatsId(t.plaats)}/">${esc(t.plaats)}</a>, ${LANDEN[t.land]}</span>` : `<span>${esc(GENRES[v.genre])}</span>`}</div>
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
    oudejaarsconference: "TheaterEvent", theaterkomedie: "TheaterEvent",
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
  const fotoLd = (a) => ({
    "@type": "ImageObject", "@id": URL(`${fotoPad(a)}#foto`),
    url: URL(a.foto.bestand), contentUrl: URL(a.foto.bestand), encodingFormat: "image/jpeg",
    name: a.foto.alt, caption: a.foto.alt, description: a.foto.alt, inLanguage: "nl",
    ...(a.foto.breedte ? { width: a.foto.breedte, height: a.foto.hoogte } : {}),
    ...(a.foto.datum ? { dateCreated: a.foto.datum } : {}),
    creditText: a.foto.maker, copyrightNotice: `${a.foto.maker}, ${a.foto.licentie}`,
    ...(a.foto.licentieUrl ? { license: a.foto.licentieUrl } : {}), ...(a.foto.promo ? {} : { acquireLicensePage: a.foto.bron }),
    about: { "@id": URL(fotoPad(a) + (a.titel ? "#voorstelling" : a.plaats ? "#zaal" : "#artiest")) },
  });
  // Eerste artiest met een foto bij een voorstelling.
  const fotoArtiest = (vid) => V.get(vid).artiesten.map((x) => A.get(x)).find((x) => x.foto);
  const zaalLd = (id) => {
    const t = T.get(id);
    return {
      "@type": ZAAL_TYPE[t.soort] || "EventVenue", "@id": URL(`/theaters/${id}/#zaal`), name: t.naam, url: URL(`/theaters/${id}/`),
      ...((t.website || t.foto?.wikidata) ? { sameAs: [t.website, t.foto?.wikidata && `https://www.wikidata.org/wiki/${t.foto.wikidata}`].filter(Boolean) } : {}),
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
      organizer: { "@type": "Organization", name: t.naam, ...(t.website ? { url: t.website } : {}) },
      offers: {
        "@type": "Offer", url: g.bron,
        ...(g.status === "uitverkocht" ? { availability: "https://schema.org/SoldOut" } : {}),
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
  const genresVan = (list) => [...new Set(list.map((g) => V.get(g.voorstelling).genre))].sort();
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
  function filters(list, { maand = false, waar = false } = {}) {
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
    ${genres.length > 1 ? `<div class="field">
      <label for="f-genre">Genre</label>
      <select id="f-genre" name="genre"><option value="">Alle genres</option>${genres.map((g) => `<option value="${g}">${GENRES[g]}</option>`).join("")}</select>
    </div>` : ""}
    ${uitverkocht ? `<div class="field toggle-veld">
      <label class="toggle"><input type="checkbox" id="f-uitverkocht" name="uitverkocht" value="1"> Uitverkocht verbergen</label>
    </div>` : ""}
  </form>
  <p class="result-line" id="result-line" aria-live="polite"></p>`;
  }

  const leegBlok = `<div class="empty" id="empty" hidden>
    <p>Geen voorstellingen die aan deze filters voldoen.</p>
    <button type="button" class="btn ghost" id="reset">Filters wissen</button>
  </div>`;

  // Maandkeuze als rij knoppen; de huidige maand is gemarkeerd.
  // Zijwaartse rij met de plaatsen met de meeste voorstellingen (/plaatsen/ en de homepage).
  function plaatsNav() {
    return `<nav class="month-nav stad-nav" aria-label="Plaatsen met de meeste voorstellingen">${[...plaatsen].sort((x, y) => perPlaats(y).length - perPlaats(x).length || x.localeCompare(y, "nl")).slice(0, 15).map((p) =>
      `<a href="/plaatsen/${plaatsId(p)}/"><b>${esc(p)}</b><span>${plural(perPlaats(p).length, "voorstelling", "voorstellingen")}</span></a>`).join("")}</nav>`;
  }

  function maandNav(huidig) {
    return `<nav class="month-nav" aria-label="Maanden">${maanden.map((m) =>
      `<a href="/agenda/${maandId(m)}/"${m === huidig ? ' aria-current="page"' : ""}><b>${kortMaand(m)}</b><span>${m.slice(0, 4)}</span></a>`).join("")}</nav>`;
  }

  // ---------- Pagina's ----------

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
  // Waar het gezicht na het bijsnijden staat, als deel van de hoogte van het vlak (0 = boven).
  const gezichtHoogte = (foto, verhouding) => {
    if (!foto.focus || !foto.breedte) return 0.5;
    const zichtbaar = Math.min(1, (foto.breedte / foto.hoogte) / verhouding);
    if (zichtbaar >= 1) return foto.focus[1];
    const boven = plek(foto.focus[1], zichtbaar, GEZICHT_HOOGTE) * (1 - zichtbaar);
    return (foto.focus[1] - boven) / zichtbaar;
  };

  // "Nu in het theater": voorstellingen met een promobeeld (data/promo.json), meeste speeldata eerst,
  // hooguit één per artiest. Bovenin het beeld, daaronder het kleurvlak van de artiest.
  const metPromobeeld = () => [...V.values()].filter((v) => v.foto && voorstellingPad.has(v.id))
    .map((v) => ({ v, list: up.filter((g) => g.voorstelling === v.id && g.status !== "geannuleerd") }))
    .filter(({ list }) => list.length)
    .sort((x, y) => y.list.length - x.list.length || x.list[0].datum.localeCompare(y.list[0].datum));

  function nuInTheater() {
    const gezien = new Set();
    const lijst = metPromobeeld()
      .filter(({ v }) => !gezien.has(v.artiesten[0]) && gezien.add(v.artiesten[0]))
      .slice(0, 20);
    return afwisselend(lijst, ({ v }) => A.get(v.artiesten[0]).kleur, { schuiven: false })
      .map(({ x, kleur }, i) => affiche(x, kleur, i)).join("");
  }

  // Video's voor sociale media (scripts/social-videos.mjs): alle voorstellingen met een promobeeld,
  // per impresariaat (van in data/promo.json), in groepjes van hooguit perVideo affiches. De groepjes
  // zijn even groot (12 wordt 4+4+4, niet 5+5+2). Dezelfde foto van dezelfde artiest (één show onder
  // twee titels) komt er één keer in. Op de affiche staat ook een persquote, als die er is.
  function socialVideos(perVideo = 5) {
    const perBureau = new Map(), gezien = new Set();
    for (const x of metPromobeeld()) {
      const sleutel = `${x.v.artiesten[0]} ${x.v.foto.bestand}`;
      if (gezien.has(sleutel)) continue;
      gezien.add(sleutel);
      const van = x.v.foto.van || "overig";
      if (!perBureau.has(van)) perBureau.set(van, []);
      perBureau.get(van).push(x);
    }
    const videos = [];
    for (const [van, lijst] of [...perBureau].sort((a, b) => a[0].localeCompare(b[0], "nl"))) {
      const aantal = Math.ceil(lijst.length / perVideo);
      for (let n = 0, i = 0; n < aantal; n++) {
        const tot = Math.round(((n + 1) * lijst.length) / aantal);
        const stuk = afwisselend(lijst.slice(i, tot), ({ v }) => A.get(v.artiesten[0]).kleur);
        i = tot;
        videos.push({
          van,
          affiches: stuk.map(({ x, kleur }) => ({
            html: affiche(x, kleur, 0, { citaat: true }),
            titel: echteTitel(x.v.id) || x.v.titel,
            artiest: artistNames(x.v.id),
            maker: x.v.foto.maker,
          })),
        });
      }
    }
    return videos;
  }

  // Persquote voor op de affiche (alleen in de video's): kort genoeg om te lezen, de meeste sterren eerst.
  const besteCitaat = (v) => [...(v.recensies || [])].filter((r) => r.citaat && r.citaat.length <= 160)
    .sort((x, y) => (y.sterren || 0) - (x.sterren || 0) || x.citaat.length - y.citaat.length)[0];

  function affiche({ v, list }, kleur, i, { citaat = false } = {}) {
    const beste = [...(v.recensies || [])].filter((r) => r.sterren).sort((x, y) => y.sterren - x.sterren)[0];
    const quote = citaat && besteCitaat(v);
    const aantal = plural(list.length, "speeldatum", "speeldata");
    const titel = echteTitel(v.id) || v.titel;
    return `<a class="poster poster-foto" href="${voorstellingPad.get(v.id)}" style="${ink(kleur)}">
    <span class="visually-hidden">${esc(titel)} van ${esc(artistNames(v.id))}, ${aantal}${beste ? `. ${esc(beste.medium)}: ${plural(beste.sterren, "ster", "sterren")}` : ""}</span>
    <span class="poster-beeld" aria-hidden="true">
      <img src="${esc(v.foto.bestand)}" alt=""${uitsnede(v.foto, 1.2)} width="${v.foto.breedte || 800}" height="${v.foto.hoogte || 1000}" loading="${i < 4 ? "eager" : "lazy"}" decoding="async">
      ${beste ? `<span class="poster-sterren${gezichtHoogte(v.foto, 1.2) < 0.5 ? " onder" : ""}">${"★".repeat(beste.sterren)}<small>${esc(beste.medium)}</small></span>` : ""}
    </span>
    <span class="poster-vlak" aria-hidden="true">
      <span class="poster-info">
      <strong class="ftitel${titleClass(titel)}">${esc(titel)}</strong>
      <span class="fartiest">${esc(artistNames(v.id))}</span>${quote ? `
      <span class="poster-citaat">“${esc(quote.citaat)}”<small>${quote.sterren && quote !== beste ? `${"★".repeat(quote.sterren)} ` : ""}${esc(quote.medium)}</small></span>` : ""}
      <span class="tag">${aantal}</span>
      </span>
      <span class="poster-stub"></span>
    </span>
  </a>`;
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
          <span class="where"><span class="wanneer">Volgende</span>${esc(wat)}</span>
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
    <div><dt>theaters</dt><dd>${tellers.zalen}</dd></div>
    <div><dt>artiesten</dt><dd>${tellers.artiesten}</dd></div>
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
${clubs.length ? `
<section class="wall wall-zalen" aria-labelledby="clubs-title">
  <div class="wrap wall-head">
    <h2 id="clubs-title">Comedy Clubs</h2>
    <p><a href="/comedy-clubs/">Alle comedyclubs</a></p>
  </div>
  ${strip("strip-clubs", "Comedyclubs met de meeste voorstellingen", kaartenRij(clubs, ({ t }) => zaalKleur(t), clubKaart))}
</section>` : ""}
${festivalsMetData.length ? `
<section class="wall wall-zalen" aria-labelledby="festivals-title">
  <div class="wrap wall-head">
    <h2 id="festivals-title">Festivals</h2>
    <p><a href="/festivals/">Alle festivals</a></p>
  </div>
  ${strip("strip-festivals", "Cabaretfestivals, de eerstvolgende voorop", kaartenRij(festivalsMetData, ({ f }) => festivalKleur(f), festivalKaart))}
</section>` : ""}

${uitgelichtBlok("home") ? `<div class="wrap">${uitgelichtBlok("home")}</div>` : ""}
<section class="block wrap kies-blok" aria-labelledby="maand-title">
  <div class="wall-head"><h2 id="maand-title">Voorstellingen per maand</h2><p><a href="/agenda/">De volledige agenda</a></p></div>
  ${maandNav(null)}
</section>

<section class="block wrap kies-blok" aria-labelledby="plaats-title">
  <div class="wall-head"><h2 id="plaats-title">Zoek in de buurt</h2><p><a href="/plaatsen/">Alle plaatsen</a></p></div>
  ${plaatsNav()}
</section>

<section class="block wrap" aria-labelledby="over-titel">
  <div class="seo-tekst prose over-blok">
    <h2 id="over-titel">Over cabaretiers.com</h2>
    <p>Cabaretiers.com is de theateragenda voor cabaret en comedy in Nederland en België. Elke nacht verzamelen we de speellijsten van theaters, comedyclubs en artiesten, zodat je op één plek ziet wie waar speelt: van avondvullend cabaret in de schouwburg tot stand-up in een comedyclub, festivals, open mics en komisch toneel.</p>
    <p>Nu staan er ${tellers.speeldata.toLocaleString("nl-NL")} voorstellingen in de agenda, van ${tellers.artiesten} artiesten in ${tellers.zalen} theaters. Bij elke voorstelling brengt de knop <em>Tickets</em> je naar de site van het theater of de artiest, waar je kaarten koopt. Cabaretiers.com verkoopt zelf geen kaarten.</p>
    <p>Speel je zelf, of programmeer je een zaal? Mail je speellijst naar <a href="mailto:${SITE.email}">${SITE.email}</a>. <a href="/over/">Meer over de agenda</a></p>
  </div>
</section>`;
    return layout({ path: "/", section: null, body });
  }

  // Week van een datum: maandag als begin (ISO-datum).
  const maandagVan = (iso) => { const d = new Date(iso + "T12:00:00Z"); return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10); };
  const weekLabel = (van, tot) => van === tot ? fmt.dayMonth(van) : van.slice(0, 7) === tot.slice(0, 7) ? `${fmt.day(van)} – ${fmt.dayMonth(tot)}` : `${fmt.dayMonth(van)} – ${fmt.dayMonth(tot)}`;

  // Alle komende voorstellingen in een compact bestand (/agenda/alles.js, inhoud JSON) voor /agenda/: agenda.js laadt
  // daaruit alles na de eerste week en zoekt erin. Artiesten, zalen en voorstellingen staan er één keer in;
  // de rijen verwijzen ernaar met een volgnummer. Kleuren, iconen en namen zijn al klaar voor de pagina.
  function agendaData() {
    const ai = new Map(), zi = new Map(), vi = new Map(), a = [], z = [], v = [];
    const nr = (map, lijst, id, maak) => { if (!map.has(id)) { map.set(id, lijst.length); lijst.push(maak()); } return map.get(id); };
    const rijen = up.map((g) => {
      const vs = V.get(g.voorstelling), t = T.get(g.theater);
      const vn = nr(vi, v, g.voorstelling, () => [
        vs.artiesten.map((id) => nr(ai, a, id, () => [artiestPad(id), A.get(id).naam])),
        vs.titel, echteTitel(g.voorstelling) || "", voorstellingPad.get(g.voorstelling) || "", vs.genre, ink(leadInk(g.voorstelling)),
      ]);
      const zn = nr(zi, z, g.theater, () => [t.id, t.naam, t.plaats, plaatsId(t.plaats), LANDEN[t.land]]);
      return [g.datum, g.tijd || "", vn, zn, g.status, g.soort || "", g.bron, g.opmerking || ""];
    });
    return { iconen: { extern: ICON.extern, doubt: ICON.doubt, sold: ICON.sold }, statussen: STATUSSEN, a, z, v, r: rijen };
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
      <nav class="dag-nav dag-snel" aria-label="Snel kiezen"><a href="/vanavond/">Vanavond</a><a href="/dit-weekend/">Dit weekend</a></nav>
      ${uitgelichtBlok("agenda")}
      ${filters(up)}
      <div id="gigs" data-alles="/agenda/alles.js?v=${tellers.speeldata}-${db.today}" data-tot="${tot}" data-totaal="${up.length}"><section class="month-group week-groep"><h3>${weekLabel(eerste[0]?.datum || db.today, tot)} <small>${plural(eerste.length, "voorstelling", "voorstellingen")}</small></h3>${eerste.map((g) => gigRow(g)).join("")}</section></div>
      ${leegBlok}
      <p class="meer-weken" id="laad-meer" hidden><button type="button" class="btn" id="laad-week">Toon alle volgende voorstellingen</button></p>
      <p class="more" id="naar-maand"><a class="btn" href="/agenda/${maandId(maanden[0])}/">Verder in ${maandNaam(maanden[0])}</a></p>
      <section class="seo-tekst prose" aria-labelledby="over-titel">
        <h2 id="over-titel">Cabaret- en theatervoorstellingen</h2>
        ${overzicht.tekst.join("\n        ")}
      </section>
      ${faqHtml(overzicht.vragen, "Veelgestelde vragen over de agenda")}
    </section>`;
    return layout({ title: "Agenda", description: "Alle aankomende cabaret- en comedyvoorstellingen in Nederland en België, week voor week, met zoeken op artiest, voorstelling, plaats of theater.", path: "/agenda/", section: "agenda", body, schema: { type: "CollectionPage", kruimels: [["Agenda", "/agenda/"]], extra: [...eventsLd(eerste), faqLd(overzicht.vragen, "/agenda/")] } });
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
    return layout({ title: `Cabaret en comedy in ${maandNaam(m)}`, description: `Alle ${list.length} cabaret- en comedyvoorstellingen in ${maandNaam(m)} in Nederland en België.`, path: `/agenda/${maandId(m)}/`, section: "agenda", body, schema: { type: "CollectionPage", kruimels: [["Agenda", "/agenda/"], [maandNaam(m), `/agenda/${maandId(m)}/`]], extra: eventsLd(list) } });
  }

  function plaatsIndex() {
    const kolommen = Object.keys(LANDEN).map((land) => {
      const items = plaatsen.filter((p) => landVanPlaats(p) === land);
      if (!items.length) return "";
      return `<div><h2>${LANDEN[land]}</h2><ul class="venue-list">${items.map((p) => {
        const zalenHier = zalenMetData.filter((t) => t.plaats === p), zalen = zalenHier.length;
        // Zoeken kan op de plaats én op de zalen ("Kattendans" vindt Bergeijk).
        return `<li data-zoek="${esc([p, ...zalenHier.map((t) => t.naam)].join(" ").toLowerCase())}"><a href="/plaatsen/${plaatsId(p)}/"><span><span class="vn">${esc(p)}</span><span class="vc">${plural(zalen, "zaal", "zalen")}</span></span><span class="vk">${plural(perPlaats(p).length, "voorstelling", "voorstellingen")}</span></a></li>`;
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
    return layout({ title: "Plaatsen", description: "Cabaret en comedy per plaats in Nederland en België.", path: "/plaatsen/", section: "plaatsen", body, schema: { type: "CollectionPage", kruimels: [["Plaatsen", "/plaatsen/"]], hoofd: lijstLd(plaatsen.map((p) => [p, `/plaatsen/${plaatsId(p)}/`])) } });
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
        <p class="uitgelicht-knoppen"><a class="btn" href="${pad}">Alle voorstellingen</a>${u.link ? `<a class="btn ghost" href="${esc(u.link)}" target="_blank" rel="sponsored noopener">Naar de website${ICON.extern}</a>` : ""}</p>
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
  // Een stad krijgt een eigen pagina als er genoeg aanbod is (komende 4 weken):
  // "vanavond" als er op minstens 25 van de 28 avonden iets is, "dit weekend" bij gemiddeld 5 per weekend.
  const DAG_DREMPEL = { vanavond: 25, weekend: 5 };
  const stadPaginas = (() => {
    const eind = dagPlus(db.today, 27);
    const uit = new Map();
    for (const p of plaatsen) {
      const komend = perPlaats(p).filter((g) => g.datum <= eind && g.status !== "geannuleerd");
      const avonden = new Set(komend.map((g) => g.datum)).size;
      // Vier hele weekenden (vrijdag t/m zondag); een half weekend dat al bezig is telt niet mee.
      let w = weekendVan(db.today), weekenden = 0, inWeekend = 0;
      if (weekdag(w.start) !== 5) w = weekendVan(dagPlus(w.eind, 1));
      while (weekenden < 4) {
        weekenden++;
        inWeekend += komend.filter((g) => g.datum >= w.start && g.datum <= w.eind).length;
        w = weekendVan(dagPlus(w.eind, 1));
      }
      const soorten = [];
      if (avonden >= DAG_DREMPEL.vanavond) soorten.push("vanavond");
      if (weekenden && inWeekend / weekenden >= DAG_DREMPEL.weekend) soorten.push("dit-weekend");
      if (soorten.length) uit.set(p, soorten);
    }
    return uit;
  })();
  const dagPad = (soort, p) => p ? `/plaatsen/${plaatsId(p)}/${soort}/` : `/${soort}/`;

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
    const steden = [...stadPaginas].filter(([q, s]) => s.includes(soort) && q !== p).map(([q]) => `<a href="${dagPad(soort, q)}">${esc(q)}</a>`);
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">${esc(hoofdletter(wanneer))}${esc(waar)}</h1><p>${esc(hoofdletter(periode))}${p ? "" : " in Nederland en België"}</p></div>
      <p class="dag-intro">${avond
        ? `Zin in een avond lachen? Hier staan alle cabaret- en comedyvoorstellingen van vandaag${waar}, met de tijd, de zaal en een link naar de kaartverkoop. Hieronder staat ook alvast morgen.`
        : `Alle cabaret- en comedyvoorstellingen${waar} van vrijdag tot en met zondag, van theatercabaret tot stand-up in comedyclubs, met de tijd, de zaal en een link naar de kaartverkoop.`}
        Kaarten koop je bij het theater; controleer daar ook of een voorstelling is uitverkocht.</p>
      <nav class="dag-nav" aria-label="Meer">${[andereLink, p ? `<a href="/plaatsen/${plaatsId(p)}/">Alle voorstellingen in ${esc(p)}</a>` : `<a href="/agenda/">De hele agenda</a>`].filter(Boolean).join("")}</nav>
      ${p ? uitgelichtBlok("plaats", p) : uitgelichtBlok("agenda")}
      ${filters(list)}
      <div id="gigs">${dagGroepen(list)}</div>
      ${leegBlok}
      <div class="empty" id="dag-leeg"${list.length ? " hidden" : ""}><p>${avond ? "Vanavond" : "Dit weekend"} staat er${waar} niets in de agenda. Bekijk <a href="${p ? `/plaatsen/${plaatsId(p)}/` : "/agenda/"}">de eerstvolgende voorstellingen</a>.</p></div>
      ${steden.length ? `<h2 class="sub-head">${esc(hoofdletter(wanneer))} in andere steden</h2><p class="city-chips">${steden.join("")}</p>` : ""}
    </section>`;
    const desc = kort(`${titel}: ${plural(nVandaag, "voorstelling", "voorstellingen")} op ${periode}${list.length ? `, met ${opsomming([...new Set(list.flatMap((g) => V.get(g.voorstelling).artiesten))].slice(0, 3).map((a) => A.get(a).naam))}` : ""}. Met tijden, zalen en tickets.`);
    const kruimels = p ? [["Plaatsen", "/plaatsen/"], [p, `/plaatsen/${plaatsId(p)}/`], [hoofdletter(wanneer), dagPad(soort, p)]] : [[hoofdletter(wanneer), dagPad(soort)]];
    return layout({ title: titel, description: desc, path: dagPad(soort, p), section: "agenda", body, schema: { type: "CollectionPage", kruimels, ...(p ? { over: plaatsLd(p) } : {}), extra: eventsLd(list) } });
  }

  // Blok bovenaan een plaatspagina: wat er vanavond en dit weekend is, of de eerstvolgende voorstelling.
  function dagBlok(p, list) {
    const tot = weekend.eind < morgenDag ? morgenDag : weekend.eind;
    const binnenkort = list.filter((g) => g.datum <= tot && g.status !== "geannuleerd");
    const links = (stadPaginas.get(p) || []).map((s) => `<a href="${dagPad(s, p)}">${s === "vanavond" ? "Alles vanavond" : "Alles dit weekend"}</a>`).join("");
    if (!binnenkort.length) {
      const g = list.find((x) => x.status !== "geannuleerd");
      return g ? `<p class="dag-blok-leeg"><b>Vanavond en dit weekend</b> staat er in ${esc(p)} niets in de agenda. Eerstvolgende: ${esc(fmt.long(g.datum))}, ${esc(V.get(g.voorstelling).artiesten.map((a) => A.get(a).naam).join(" en ") || V.get(g.voorstelling).titel)} in ${esc(T.get(g.theater).naam)}.</p>` : "";
    }
    return `<section class="dag-blok" aria-labelledby="dag-blok-t">
        <h2 id="dag-blok-t">Vanavond en dit weekend in ${esc(p)}</h2>
        ${binnenkort.slice(0, 6).map((g) => {
          const v = V.get(g.voorstelling);
          return `<p class="dag-regel" data-datum="${g.datum}"><span class="dag-label" data-dag="${g.datum}">${g.datum === vandaagDag ? "Vanavond" : g.datum === morgenDag ? "Morgen" : hoofdletter(fmt.weekday(g.datum))}</span>${g.tijd ? ` ${g.tijd}` : ""} · <b>${artistLinks(g.voorstelling) || esc(v.titel)}</b> in <a href="/theaters/${g.theater}/">${esc(T.get(g.theater).naam)}</a></p>`;
        }).join("")}
        ${binnenkort.length > 6 || links ? `<p class="dag-nav">${links}${binnenkort.length > 6 && !links ? `<span>en nog ${binnenkort.length - 6} meer hieronder</span>` : ""}</p>` : ""}
      </section>`;
  }

  function plaatsPagina(p) {
    const list = perPlaats(p);
    const zalen = zalenMetData.filter((t) => t.plaats === p);
    const body = `<div class="detail-hero" style="--bg:var(--riso-yellow);--fg:#121212"><div class="wrap">
        <h1 class="plaats-kop">Cabaret en theater in ${esc(p)}</h1>
        <p>${plural(list.length, "aankomende voorstelling", "aankomende voorstellingen")} in ${zalen.map((t) => `<a href="/theaters/${t.id}/">${esc(t.naam)}</a>`).join(", ").replace(/, ([^,]*)$/, " en $1")}.</p>
      </div></div>
      <div class="wrap detail-body">
        ${dagBlok(p, list)}
        ${uitgelichtBlok("plaats", p)}
        ${filters(list, { maand: true })}
        <div id="gigs">${monthGroups(list)}</div>
        ${leegBlok}
        ${plaatsTekst(p, list)}
        ${list.length ? faqHtml(plaatsVragen(p, list), `Veelgestelde vragen over cabaret in ${p}`) : ""}
      </div>`;
    const artiestenHier = [...new Set(list.flatMap((g) => V.get(g.voorstelling).artiesten))].map((a) => A.get(a).naam);
    const desc = kort(`Cabaret en theater in ${p}: ${plural(list.length, "voorstelling", "voorstellingen")} in ${plural(zalen.length, "zaal", "zalen")}${artiestenHier.length ? `, met ${artiestenHier.slice(0, 3).join(", ")}${artiestenHier.length > 3 ? " en meer" : ""}` : ""}. Eerstvolgende op ${fmt.full(list[0].datum)}.`);
    return layout({ title: `Cabaret en theater in ${p}`, description: desc, path: `/plaatsen/${plaatsId(p)}/`, section: "plaatsen", body, schema: { type: "CollectionPage", kruimels: [["Plaatsen", "/plaatsen/"], [p, `/plaatsen/${plaatsId(p)}/`]], over: plaatsLd(p), extra: [...eventsLd(list), ...(list.length ? [faqLd(plaatsVragen(p, list), `/plaatsen/${plaatsId(p)}/`)] : [])] } });
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
        <ul>${items.map(({ a, list }) => `<li data-naam="${esc(a.naam.toLowerCase())}"><a href="${artiestPad(a.id)}"><span class="swatch" style="${ink(a.kleur)};background:var(--bg)" aria-hidden="true"></span><span class="an">${esc(a.naam)}</span><span class="ad">vanaf ${fmt.dayMonth(list[0].datum)}</span><span class="ac">${plural(list.length, "datum", "data")}</span></a></li>`).join("")}</ul>
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
    return layout({ title: "Artiesten", description: "Alle cabaretiers en comedians met aankomende voorstellingen in Nederland en België, van A tot Z.", path: "/artiesten/", section: "artiesten", body, schema: { type: "CollectionPage", kruimels: [["Artiesten", "/artiesten/"]], hoofd: lijstLd([...artiestenMetData].sort((x, y) => x.a.naam.localeCompare(y.a.naam, "nl")).map(({ a }) => [a.naam, `/artiesten/${a.id}/`])) } });
  }

  // ---------- Tekst onder artiest- en theaterpagina's ----------
  // Alles komt uit de agenda zelf: geen verzonnen biografie, alleen wat de speeldata laten zien.
  // ---------- Cabaretiers: /alle-cabaretiers/, /mannen/ en /vrouwen/ (SEO-pagina's, niet in het menu) ----------

  // Clubavonden, festivals, kwissen en reeksen zijn geen cabaretier.
  const GEEN_CABARETIER = /\b(festival|club|kwis|cabarestafette|agency|producties|stichting|comedians|finalisten|finalistentour|tournee|open mic|night|marathon|theaterweekend|bingo|lacht|show|revue|vibe)\b/i;
  const cabaretiers = artiestenMetData.filter(({ a }) => !GEEN_CABARETIER.test(a.naam));
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
    const oudejaars = opTournee.filter(({ list }) => list.some((g) => V.get(g.voorstelling).genre === "oudejaarsconference"));
    // "A, B, C en nog 4 anderen"
    const enMeer = (lijst, max) => lijst.length > max ? `${lijst.slice(0, max).join(", ")} en nog ${lijst.length - max} anderen` : opsomming(lijst);
    const tryouts = gigs.filter((g) => g.soort === "try-out" && g.status !== "geannuleerd");
    const binnenkort = [...gigs].sort((x, y) => x.datum.localeCompare(y.datum) || (x.tijd || "").localeCompare(y.tijd || "")).slice(0, 5);
    const belgen = items.filter(({ a, list }) => a.land === "BE" || list.every((g) => T.get(g.theater).land === "BE"));
    const andere = Object.entries(CABARETIER_PAGINAS).filter(([k]) => k !== soort).map(([, p]) => `<a href="${p.pad}">${esc(p.naam.toLowerCase())}</a>`);
    const zin = (x) => `${artiestLink(x.a)} (${keer(x.list.length)})`;
    const standup = opTournee.filter(({ list }) => list.some((g) => V.get(g.voorstelling).genre === "stand-up"));
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
      vrouw: `${items.length} vrouwelijke cabaretiers en comedians staan de komende tijd op het podium, samen goed voor ${plural(gigs.length, "voorstelling", "voorstellingen")} in ${plural(steden.length, "plaats", "plaatsen")}. Een vrouwelijke cabaretier heet ook wel een cabaretière. Hieronder vind je ze allemaal, met hun speeldata in Nederland en België.`,
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
      ...(soort === "vrouw" ? [["Hoe heet een vrouwelijke cabaretier?", "Een vrouwelijke cabaretier heet een cabaretière. In het dagelijks taalgebruik wordt ook gewoon cabaretier gezegd."]] : []),
      [soort === "vrouw" ? "Welke cabaretières staan binnenkort in het theater?" : "Welke mannelijke cabaretiers staan binnenkort in het theater?", `Binnenkort: ${opsomming(binnenkort.map((g) => `${artiestLink(A.get(V.get(g.voorstelling).artiesten.find((id) => items.some((x) => x.a.id === id))))} op ${fmt.dayMonth(g.datum)} in ${esc(T.get(g.theater).plaats)}`))}.`],
      ...(oudejaars.length ? [[soort === "vrouw" ? "Welke vrouwelijke cabaretiers spelen een oudejaarsconference?" : "Welke mannelijke cabaretiers spelen een oudejaarsconference?", `Dit seizoen onder meer ${opsomming(oudejaars.slice(0, 6).map(({ a }) => artiestLink(a)))}.`]] : []),
      ...(belgen.length ? [[soort === "vrouw" ? "Spelen er ook cabaretières in België?" : "Spelen er ook cabaretiers in België?", `Ja, in België spelen de komende tijd onder meer ${opsomming(belgen.filter(({ a }) => lijktArtiest(a.naam)).slice(0, 5).map(({ a }) => artiestLink(a)))}.`]] : []),
      [soort === "vrouw" ? "Staat een cabaretière er niet tussen?" : "Staat een cabaretier er niet tussen?", `Deze lijst is gebaseerd op openbare gegevens van Wikipedia en Wikidata. Wie daar (nog) niet in staat, vind je bij <a href="/alle-cabaretiers/">alle cabaretiers</a> of in het overzicht van <a href="/artiesten/">alle artiesten</a>.`],
    ];

    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">${esc(P.naam)}</h1><p>${intro}</p></div>
      ${soort === "alle"
        ? `<p class="knoppen"><a class="btn ghost" href="/alle-cabaretiers/mannen/">Mannelijke cabaretiers</a><a class="btn ghost" href="/alle-cabaretiers/vrouwen/">Vrouwelijke cabaretiers</a></p>`
        : `<p class="zie-ook">Bekijk ook de ${andere.join(", de ")} of <a href="/artiesten/">alle artiesten</a>.</p>`}
      <h2 class="sub-head">${soort === "alle" ? "Bekende cabaretiers op tournee" : `Bekende ${esc(P.wie)} op tournee`}</h2>
      <div class="artists">${artiestKaarten(top)}</div>
      <h2 class="sub-head">${esc(P.naam)} van A tot Z</h2>
      ${azLijst(items, { zoekLabel: soort === "vrouw" ? "Zoek een cabaretière" : "Zoek een cabaretier" })}
      <div class="seo-tekst prose">
        ${tekst.join("\n        ")}
      </div>
      ${faqHtml(vragen)}
    </section>`;
    const kruimels = soort === "alle" ? [["Alle cabaretiers", P.pad]] : [["Alle cabaretiers", "/alle-cabaretiers/"], [soort === "vrouw" ? "Vrouwen" : "Mannen", P.pad]];
    const titel = { alle: "Alle cabaretiers van Nederland en België", vrouw: "Vrouwelijke cabaretiers: lijst van bekende cabaretières", man: "Mannelijke cabaretiers: bekende Nederlandse cabaretiers" }[soort];
    const desc = { alle: `Alle ${items.length} Nederlandse en Vlaamse cabaretiers en comedians op tournee, van A tot Z: bekende cabaretiers, mannen en vrouwen, stand-up en oudejaars, met speeldata.`,
      vrouw: `Lijst van ${items.length} vrouwelijke cabaretiers op tournee, zoals ${opsomming(top.slice(0, 3).map(({ a }) => a.naam))}. Met al hun speeldata.`,
      man: `${items.length} mannelijke cabaretiers en comedians op tournee, zoals ${opsomming(top.slice(0, 3).map(({ a }) => a.naam))}. Met al hun speeldata.` }[soort];
    return layout({ title: titel, description: desc, path: P.pad, section: "artiesten", body, schema: { type: "CollectionPage", kruimels,
      hoofd: lijstLd([...items].sort((x, y) => x.a.naam.localeCompare(y.a.naam, "nl")).map(({ a }) => [a.naam, `/artiesten/${a.id}/`])),
      extra: [faqLd(vragen, P.pad)] } });
  }

  const GENRE_TEKST = {
    cabaret: "cabaret", "stand-up": "stand-up comedy", oudejaarsconference: "oudejaarsconference",
    theaterkomedie: "theaterkomedie", "open-mic": "open mics", improvisatie: "improvisatietheater",
    festival: "festivals", "muzikaal-cabaret": "muzikaal cabaret", kleinkunst: "kleinkunst",
  };
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
  const plaatsLink = (p) => `<a href="/plaatsen/${plaatsId(p)}/">${esc(p)}</a>`;
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
    if (tryouts.length) vragen.push([`Zijn er try-outs van ${a.naam}?`, `Ja, ${keer(tryouts.length)}, de eerste op ${fmt.full(tryouts[0].datum)} in ${theaterLink(tryouts[0].theater)}. Bij een try-out is de voorstelling nog in ontwikkeling, en kaartjes zijn vaak goedkoper.`]);
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
    const buren = zalenMetData.filter((x) => x.plaats === t.plaats && x.id !== t.id);
    zinnen.push(`<p>${buren.length
      ? `Meer cabaret en comedy in ${esc(t.plaats)} vind je bij ${opsomming(buren.slice(0, 5).map((x) => theaterLink(x.id)))}, of bekijk <a href="/plaatsen/${plaatsId(t.plaats)}/">alle voorstellingen in ${esc(t.plaats)}</a>.`
      : `Bekijk ook <a href="/plaatsen/${plaatsId(t.plaats)}/">alle voorstellingen in ${esc(t.plaats)}</a> of de <a href="/agenda/">volledige agenda</a>.`} ${kaartenZin}</p>`);
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
    return opsomming([...m].slice(0, max).map(([n, d]) => `${n} op ${datums(d)}`));
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
    if (tryouts.length) vragen.push([`Zijn er try-outs in ${t.naam}?`, `${tryouts.length === 1 ? `Ja, één: van ${esc(artistNames(tryouts[0].voorstelling))} op ${fmt.full(tryouts[0].datum)}` : `Ja, ${tryouts.length}, onder meer van ${opsomming([...new Set(tryouts.map((g) => esc(artistNames(g.voorstelling))))].filter(Boolean).slice(0, 4))}`}. Bij een try-out is de voorstelling nog in ontwikkeling, en kaartjes zijn vaak goedkoper.`]);
    const uit = list.filter((g) => g.status === "uitverkocht");
    if (uit.length) vragen.push([`Welke voorstellingen in ${t.naam} zijn uitverkocht?`, `${uit.length} van de ${list.length}, onder meer ${perNaam(uit, 4)}. Soms komen er kaarten vrij via een wachtlijst bij het theater.`]);
    const soort = ZAALSOORT[t.soort];
    vragen.push([`Waar ligt ${t.naam}?`, `${naam} is ${soort ? `een ${soort} ` : ""}in ${plaatsLink(t.plaats)}, ${LANDEN[t.land]}.${t.website ? ` Het adres en de bereikbaarheid staan op <a href="${esc(t.website)}" rel="noopener">de website van ${naam}</a>.` : ""}`]);
    vragen.push([`Hoe koop ik kaarten voor ${t.naam}?`, `Kaarten koop je bij ${naam} zelf. Klik bij een voorstelling op de knop <em>Tickets</em>: die opent de speellijst van het theater, waar je kaarten kunt bestellen.`]);
    const buren = zalenMetData.filter((x) => x.plaats === t.plaats && x.id !== t.id);
    if (buren.length) vragen.push([`Waar is er nog meer cabaret in ${t.plaats}?`, `Ook in ${opsomming(buren.slice(0, 5).map((x) => theaterLink(x.id)))}. Alle voorstellingen staan bij <a href="/plaatsen/${plaatsId(t.plaats)}/">cabaret en comedy in ${esc(t.plaats)}</a>.`]);
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
    const delen = [];
    delen.push(`<h2 id="over-titel">Cabaret en comedy in ${naam}</h2>
        <p>In ${naam} ${list.length === 1 ? "staat één cabaret- of comedyvoorstelling" : `staan ${list.length} cabaret- en comedyvoorstellingen`} op de agenda, ${periode(list)}, ${zalen.length === 1 ? `in ${theaterLink(zalen[0][0])}` : `verdeeld over ${zalen.length} zalen`}.` +
      ` ${genres.length > 1 ? `Het aanbod: ${opsomming(genres.slice(0, 4).map(([k, n]) => `${n} keer ${GENRE_TEKST[k]}`))}.` : `Alles is ${GENRE_TEKST[genres[0][0]]}.`}</p>`);
    if (artiestTel.length) {
      const top = artiestTel.slice(0, 8).map(([id, n]) => `<a href="${artiestPad(id)}">${esc(A.get(id).naam)}</a>${n > 1 ? ` (${keer(n)})` : ""}`);
      delen.push(`<h2>Welke cabaretiers spelen in ${naam}?</h2>
        <p>${artiestTel.length === 1 ? `Op het programma staat ${top[0]}.` : `${artiestTel.length} artiesten spelen de komende tijd in ${naam}, onder wie ${opsomming(top)}.`}` +
        `${maanden.length > 1 && maanden[0][1] > 1 ? ` De drukste maand is ${fmt.monthYear(maanden[0][0] + "-01")}, met ${maanden[0][1]} voorstellingen.` : ""}${uitverkochtZin(list)}</p>`);
    }
    if (zalen.length > 1) {
      delen.push(`<h2>Theaters en zalen in ${naam}</h2>
        <ul>${zalen.map(([id, n]) => { const t = T.get(id), eerste = list.find((g) => g.theater === id); return `<li>${theaterLink(id)}: ${plural(n, "voorstelling", "voorstellingen")}, de eerste op ${fmt.dayMonth(eerste.datum)}${t.website ? ` (<a href="${esc(t.website)}" rel="noopener">website</a>)` : ""}</li>`; }).join("")}</ul>`);
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
    delen.push(`<h2>Waar spelen deze artiesten nog meer?</h2>
        <p>${andere.length ? `Wie in ${naam} speelt, staat ook vaak in ${opsomming(andere.map(([x]) => plaatsLink(x)))}. Bekijk <a href="/plaatsen/">alle plaatsen</a> of de <a href="/agenda/">volledige agenda</a>.` : `Bekijk ook de <a href="/agenda/">volledige agenda</a>.`} ${kaartenZin}</p>`);
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
    vragen.push([`Waar kun je cabaret zien in ${p}?`, zalen.length === 1
      ? `In ${theaterLink(zalen[0][0])}. Daar ${zalen[0][1] === 1 ? "staat één voorstelling" : `staan ${zalen[0][1]} voorstellingen`} op het programma.`
      : `In ${zalen.length} zalen: ${opsomming(zalen.slice(0, 8).map(([id, n]) => `${theaterLink(id)} (${n})`))}.`]);
    if (artiestTel.length) vragen.push([`Welke cabaretiers spelen in ${p}?`, artiestTel.length === 1
      ? `Op het programma staat ${link(artiestTel[0][0])}.`
      : `${artiestTel.length} artiesten, onder wie ${opsomming(artiestTel.slice(0, 8).map(([id]) => link(id)))}.`]);
    const e = list[0];
    vragen.push([`Wat is de eerstvolgende voorstelling in ${p}?`, `${wat(e)}, op ${fmt.full(e.datum)}${e.tijd ? ` om ${e.tijd}` : ""} in ${theaterLink(e.theater)}.${e.status === "uitverkocht" ? " Deze voorstelling is uitverkocht." : ""}`]);
    const maand = list[0].datum.slice(0, 7), inMaand = list.filter((g) => g.datum.startsWith(maand));
    if (inMaand.length > 1) vragen.push([`Wat is er in ${maandNaam(maand)} te zien in ${p}?`, `${plural(inMaand.length, "voorstelling", "voorstellingen")}: ${perNaam(inMaand, 5)}${new Set(inMaand.map((g) => artistNames(g.voorstelling))).size > 5 ? " en meer" : ""}.`]);
    const standup = list.filter((g) => V.get(g.voorstelling).genre === "stand-up");
    if (standup.length) vragen.push([`Is er stand-up comedy in ${p}?`, `Ja, ${plural(standup.length, "voorstelling", "voorstellingen")}, onder meer ${perNaam(standup, 3)}.`]);
    const oud = list.filter((g) => V.get(g.voorstelling).genre === "oudejaarsconference");
    const oudIds = [...new Set(oud.map((g) => V.get(g.voorstelling).artiesten[0]).filter(Boolean))];
    if (oud.length) vragen.push([`Is er een oudejaarsconference in ${p}?`, `Ja: ${opsomming(oudIds.slice(0, 5).map(link))} ${oudIds.length === 1 ? "speelt" : "spelen"} er een oudejaarsvoorstelling, de eerste op ${fmt.full(oud[0].datum)}.`]);
    const tryouts = bijzonder(list, "try-out");
    if (tryouts.length) vragen.push([`Zijn er try-outs in ${p}?`, `Ja, ${tryouts.length === 1 ? `één: van ${esc(artistNames(tryouts[0].voorstelling))} op ${fmt.full(tryouts[0].datum)}` : `${tryouts.length}, onder meer van ${opsomming([...new Set(tryouts.map((g) => esc(artistNames(g.voorstelling))))].filter(Boolean).slice(0, 4))}`}. Bij een try-out is de voorstelling nog in ontwikkeling, en kaartjes zijn vaak goedkoper.`]);
    const uit = list.filter((g) => g.status === "uitverkocht");
    if (uit.length) vragen.push([`Welke voorstellingen in ${p} zijn uitverkocht?`, `${uit.length} van de ${list.length}, onder meer ${perNaam(uit, 4)}. Soms komen er kaarten vrij via een wachtlijst bij het theater.`]);
    vragen.push([`Hoe koop ik kaarten voor cabaret in ${p}?`, `Kaarten koop je bij de zaal zelf. Klik bij een voorstelling op de knop <em>Tickets</em>: die opent de speellijst van het theater of de artiest, waar je kaarten kunt bestellen.`]);
    return vragen;
  }

  // Rechtenvrije foto (Wikimedia Commons) met verplichte naamsvermelding en licentie.
  const fotoHtml = (a, klasse = "artiest-foto") => `<figure class="${klasse}">
          <img src="${esc(a.foto.bestand)}" alt="${esc(a.foto.alt)}"${klasse === "artiest-foto" ? uitsnede(a.foto, 4 / 5) : ""}${a.foto.breedte ? ` width="${a.foto.breedte}" height="${a.foto.hoogte}"` : ""} loading="eager" decoding="async" fetchpriority="high">
          <figcaption>Foto: ${a.foto.promo ? esc(a.foto.maker) : `<a href="${esc(a.foto.bron)}" rel="noopener">${esc(a.foto.maker)}</a>`}${a.foto.licentieUrl ? `, <a href="${esc(a.foto.licentieUrl)}" rel="noopener license">${esc(a.foto.licentie)}</a>` : `, ${esc(a.foto.licentie)}`}</figcaption>
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
    const partners = [...new Set(list.flatMap((g) => V.get(g.voorstelling).artiesten))].filter((x) => x !== a.id);
    const cityCount = new Set(list.map((g) => T.get(g.theater).plaats)).size;
    const summary = list.length
      ? `${plural(list.length, "speeldatum", "speeldata")} in ${plural(cityCount, "plaats", "plaatsen")}${partners.length ? `, samen met ${partners.map((p) => `<a href="${artiestPad(p)}">${esc(A.get(p).naam)}</a>`).join(" en ")}` : ""}.`
      : "Op dit moment staan er geen voorstellingen gepland.";
    const festival = [...F.values()].find((f) => (f.artiesten || []).includes(a.id));
    const body = `<div class="detail-hero" style="${ink(a.kleur)}"><div class="wrap${a.foto ? " hero-met-foto" : ""}">
        <div class="hero-tekst">
          <h1>${esc(a.naam)}</h1>
          <p>${summary}${festival ? ` Onderdeel van <a href="/festivals/${festival.id}/">${esc(festival.naam)}</a>.` : ""}</p>
        </div>
        ${a.foto ? fotoHtml(a) : ""}
      </div></div>
      <div class="wrap detail-body">
        ${showIds.length ? `<div class="shows-list">${showIds.map((vid) => voorstellingPad.has(vid) ? `<a class="pill" href="${voorstellingPad.get(vid)}">${esc(V.get(vid).titel)}</a>` : `<span class="pill">${esc(V.get(vid).titel)}</span>`).join("")}</div>` : ""}
        ${list.length > 12 ? filters(list, { maand: true, waar: true }) : ""}
        <div id="gigs">${monthGroups(list, { showArtist: false })}</div>
        ${list.length > 12 ? leegBlok : ""}
        ${a.videos?.length ? videosHtml(a) : ""}
        ${artiestTekst(a, list)}
        ${list.length ? faqHtml(artiestVragen(a, list), `Veelgestelde vragen over ${a.naam}`) : ""}
        ${a.geslacht && !isGroep(a) ? `<p class="zie-ook">Bekijk ook andere <a href="/alle-cabaretiers/${a.geslacht === "vrouw" ? "vrouwen" : "mannen"}/">${a.geslacht === "vrouw" ? "vrouwelijke" : "mannelijke"} cabaretiers</a> of <a href="/alle-cabaretiers/">alle cabaretiers</a>.</p>` : ""}
      </div>`;
    const desc = list.length
      ? kort(`${a.naam} live: ${plural(list.length, "voorstelling", "voorstellingen")} in ${plural(cityCount, "plaats", "plaatsen")}${titles.length ? `, met ${titles.slice(0, 2).join(" en ")}` : ""}. Eerstvolgende op ${fmt.full(list[0].datum)}. Bekijk alle speeldata.`)
      : `${a.naam} op Cabaretiers.com.`;
    return layout({ title: `${a.naam}: tournee en speeldata`, description: desc, path: `/artiesten/${a.id}/`, section: "artiesten", body, schema: { type: "ProfilePage", foto: a.foto ? a : null, kruimels: [["Artiesten", "/artiesten/"], [a.naam, `/artiesten/${a.id}/`]], hoofd: { "@id": artiestLd(a.id)["@id"] }, extra: [artiestLd(a.id), ...eventsLd(list), ...(list.length ? [faqLd(artiestVragen(a, list), `/artiesten/${a.id}/`)] : [])] } });
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
      ` Het genre is ${GENRE_TEKST[v.genre]}.</p>`);
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
            <figcaption><cite>${esc(r.medium)}</cite>${r.sterren ? `, ${r.sterren} ${r.sterren === 1 ? "ster" : "sterren"}` : ""}${r.via ? `, via ${esc(r.via)}` : ` <a href="${esc(r.bron)}" rel="noopener" target="_blank">via ${esc(zaal(r.bron))}</a>`}</figcaption>
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
        </div>
        ${v.foto ? fotoHtml(v) : ""}
      </div></div>
      <div class="wrap detail-body">
        ${promotekstHtml(v)}
        ${recensiesHtml(v, list)}
        <div id="gigs">${monthGroups(list, { showArtist: false })}</div>
        ${voorstellingTekst(vid, list)}
      </div>`;
    const desc = kort(`${v.titel} van ${artistNames(vid)}: ${plural(list.length, "voorstelling", "voorstellingen")} in ${plural(steden, "plaats", "plaatsen")}. Eerstvolgende op ${fmt.full(list[0].datum)}.${beste ? ` ${beste.medium}: ${plural(beste.sterren, "ster", "sterren")}.` : ""} Bekijk alle speeldata.`);
    return layout({ title: `${v.titel} van ${artistNames(vid)}: speeldata`, description: desc, path: voorstellingPad.get(vid), section: "artiesten", body, schema: {
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
      <ul class="sources">${zonder.map((f) => `<li>${f.website ? `<a href="${esc(f.website)}" rel="noopener">${esc(f.naam)}</a>` : esc(f.naam)} <span>${esc(f.plaats)}</span></li>`).join("")}</ul>` : ""}
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
    zinnen.push(`<p>${f.website ? `Meer over het festival, de deelnemers en de jury lees je op <a href="${esc(f.website)}" rel="noopener">de website van ${esc(f.naam)}</a>. ` : ""}Bekijk ook <a href="/festivals/">alle cabaretfestivals</a>. ${kaartenZin}</p>`);
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
        <p>Cabaretfestival uit ${plaatsen.includes(f.plaats) ? `<a href="/plaatsen/${plaatsId(f.plaats)}/">${esc(f.plaats)}</a>` : esc(f.plaats)}. ${list.length ? `${plural(list.length, "speeldatum", "speeldata")} in ${plural(steden, "plaats", "plaatsen")}.` : "Op dit moment staan er geen speeldata in de agenda."}${f.website ? ` <a href="${esc(f.website)}" rel="noopener">Website van het festival</a>` : ""}</p>
      </div></div>
      <div class="wrap detail-body">
        ${list.length > 12 ? filters(list, { maand: true }) : ""}
        <div id="gigs">${monthGroups(list)}</div>
        ${list.length > 12 ? leegBlok : ""}
        ${festivalTekst(f, list)}
      </div>`;
    const desc = list.length
      ? kort(`${f.naam} (${f.plaats}): ${plural(list.length, "voorstelling", "voorstellingen")}, van finale tot finalistentournee. Eerstvolgende op ${fmt.full(list[0].datum)}. Bekijk alle speeldata.`)
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
    tekst.push(`<p>Het aanbod is breed: ${genreTekst(5)}. Bij theaterkomedie gaat het om komedies, blijspellen en kluchten; gewoon toneel en musicals staan niet in deze agenda. De artiesten die nu het vaakst spelen, zijn ${opsomming(artiesten)}.</p>`);
    tekst.push(`<p>Bovenaan begin je met de voorstellingen van deze week; met één knop zie je alle volgende. Zoek op artiest, voorstelling, plaats of theater, kies een genre of verberg uitverkochte voorstellingen. Liever per maand bladeren? Kies ${opsomming(maanden.slice(0, 3).map(maandLink))}, of kijk wat er <a href="/vanavond/">vanavond</a> en <a href="/dit-weekend/">dit weekend</a> te zien is. De meeste voorstellingen zijn in ${opsomming(steden.map(([p, n]) => `${plaatsLink(p)} (${n})`))}.</p>`);
    const vragen = [];
    vragen.push(["Welke cabaretvoorstellingen zijn er vanavond?", `Op <a href="/vanavond/">Vanavond</a> staan alle voorstellingen van vandaag en morgen, en op <a href="/dit-weekend/">Dit weekend</a> die van vrijdag tot en met zondag. In deze agenda staat bovenaan de lopende week.`]);
    vragen.push(["Wat is het verschil tussen cabaret, stand-up en theaterkomedie?", "Cabaret is een avondvullende voorstelling van een of meer artiesten, met grappen, verhalen en vaak liedjes, meestal rond een thema. Stand-up is comedy waarin een comedian los van een verhaallijn grappen vertelt, vaak met meerdere comedians op een avond. Theaterkomedie is toneel met humor: komedies, blijspellen en kluchten met een vaste rolverdeling."]);
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
      <ul class="sources">${zonder.map((t) => `<li>${t.website ? `<a href="${esc(t.website)}" rel="noopener">${esc(t.naam)}</a>` : esc(t.naam)} <span>${esc(t.plaats)}</span></li>`).join("")}</ul>` : ""}
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
      return `<div><h2>${LANDEN[land]}</h2>${steden.map((p) => `<div class="stad"><h3 class="city-head"><a href="/plaatsen/${plaatsId(p)}/">${esc(p)}</a></h3><ul class="venue-list">${zalenMetData.filter((t) => t.plaats === p).sort((a, b) => a.naam.localeCompare(b.naam, "nl")).map((t) => {
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
    return layout({ title: "Theaters", description: "Theaters, comedyclubs en podia in Nederland en België met cabaret en comedy.", path: "/theaters/", section: "theaters", body, schema: { type: "CollectionPage", kruimels: [["Theaters", "/theaters/"]], hoofd: lijstLd([...zalenMetData].sort((x, y) => x.naam.localeCompare(y.naam, "nl")).map((t) => [t.naam, `/theaters/${t.id}/`])), extra: [faqLd(overzicht.vragen, "/theaters/")] } });
  }

  function theaterPage(t) {
    const list = db.gigsForTheater(t.id);
    const body = `<div class="detail-hero" style="--bg:var(--riso-blue);--fg:#FFF"><div class="wrap${t.foto ? " hero-met-foto" : ""}">
        <div>
        <h1>${esc(t.naam)}</h1>
        <p><a href="/plaatsen/${plaatsId(t.plaats)}/">${esc(t.plaats)}</a>, ${LANDEN[t.land]}. ${list.length ? `${plural(list.length, "aankomende voorstelling", "aankomende voorstellingen")}.` : "Op dit moment staan er geen voorstellingen gepland."}${t.website ? ` <a href="${esc(t.website)}" rel="noopener">Website van het theater</a>` : ""}</p>
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
      ? kort(`Cabaret en comedy in ${t.naam}${t.naam.includes(t.plaats) ? "" : ` in ${t.plaats}`}: ${plural(list.length, "voorstelling", "voorstellingen")}${list.length > 1 ? ` van ${fmt.full(list[0].datum)} tot ${fmt.full(list.at(-1).datum)}` : ` op ${fmt.full(list[0].datum)}`}. Bekijk het programma.`)
      : `Cabaret en comedy in ${t.naam} (${t.plaats}).`;
    return layout({ title: `${t.naam}${t.naam.includes(t.plaats) ? "" : ` ${t.plaats}`}: cabaret en comedy`, description: desc, path: `/theaters/${t.id}/`, section: "theaters", body, schema: { foto: t.foto ? t : null, kruimels: [["Theaters", "/theaters/"], [t.naam, `/theaters/${t.id}/`]], hoofd: { "@id": zaalLd(t.id)["@id"] }, extra: [{ ...zaalLd(t.id), containedInPlace: plaatsLd(t.plaats) }, ...eventsLd(list), ...(list.length ? [faqLd(theaterVragen(t, list), `/theaters/${t.id}/`)] : [])] } });
  }

  function privacy() {
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Privacy en cookies</h1></div>
      <div class="prose">
        <p>Cabaretiers.com is een agenda: je hoeft geen account te maken en we vragen je geen gegevens. Wat we wel doen, staat hieronder.</p>
        <h2 id="analytics">Bezoekersstatistieken (Google Analytics)</h2>
        <p>Alleen als je in de cookiemelding op <em>Akkoord</em> klikt, meten we met Google Analytics hoe de site wordt gebruikt: welke pagina's je bekijkt, via welke site of zoekterm je binnenkomt, het soort apparaat en browser, en ongeveer in welk land of welke plaats je bent. Google Analytics zet daarvoor cookies (<code>_ga</code>). Klik je op <em>Liever niet</em>, dan laden we Google Analytics niet en worden er geen cookies gezet.</p>
        <p>We gebruiken deze cijfers alleen om de agenda te verbeteren en om te laten zien hoeveel mensen de site bezoeken, niet voor advertenties. Google bewaart de gegevens maximaal 14 maanden. Volgens Google slaat Google Analytics geen IP-adressen op. Google kan gegevens verwerken in de Verenigde Staten, onder het EU-VS-gegevensprivacykader.</p>
        <p><button type="button" class="knop-secundair" data-cookies-wijzig hidden>Cookiekeuze wijzigen</button></p>
        <h2 id="opslag">Wat er in je browser blijft staan</h2>
        <p>Je keuze in de cookiemelding bewaren we in je eigen browser (<code>cabaretiers-cookies</code>), zodat we het niet elke keer opnieuw vragen. Dat gaat niet naar ons of naar anderen.</p>
        <h2 id="video">Video's</h2>
        <p>Op sommige artiestpagina's staan video's van YouTube. Die laden pas als je erop klikt; dan maakt je browser verbinding met YouTube (in de privacyvriendelijke modus zonder cookies vooraf) en gelden de privacyregels van Google.</p>
        <h2 id="links">Links naar theaters en sociale media</h2>
        <p>Via <em>Tickets</em> ga je naar de site van het theater of de artiest, en via de iconen onderaan naar onze pagina's op Instagram, Facebook, YouTube en TikTok. Daar gelden hun eigen privacyregels.</p>
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
      <ul class="sources">${bronnen.map((t) => `<li><a href="${esc(t.website)}" rel="noopener">${esc(t.naam)}</a> <span>${esc(t.plaats)}</span></li>`).join("")}</ul>
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
      <div class="block-head"><h1 id="t">Controle</h1><p>Hoe het ophalen ging en wat er nieuw is. Laatst samengevoegd: ${datumTekst(rapport.datum)}. Deze pagina staat niet in het menu en niet in zoekmachines.</p></div>
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

  return {
    controlePagina,
    home, agendaIndex, agendaData, agendaMaand, dagPagina, stadPaginas, plaatsIndex, plaatsPagina, artistIndex, comedyclubsPagina, festivalVan, cabaretiersPagina, artistPage, theaterIndex, theaterPage, about, privacy, notFound,
    voorstellingPagina, festivalIndex, festivalPagina, socialVideos, maanden, plaatsen, plaatsId, maandId, voorstellingPaden: voorstellingPad,
  };
}
