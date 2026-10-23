// HTML-templates. Elke functie geeft een string terug; build.mjs schrijft ze weg.
import { LANDEN, STATUSSEN, GENRES, KLEUREN, isGroep } from "./data.mjs";
import { fmt, esc, plural, isoWithOffset } from "./format.mjs";
import { WOORDMERK_SVG, C_PAD, C_KADER } from "./woordmerk.mjs";

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
  description: "De theateragenda van Nederland en België: alle aankomende cabaret- en comedyvoorstellingen, theaters en artiesten op één plek.",
};

const ICON = {
  sold: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M6 18L18 6"/></svg>',
  doubt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.01"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
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
  const vlakken = [["#FF6A13", -140, 10], ["#FF4FA3", 10, 58], ["#00764E", 58, 140], ["#FFD23F", 140, 220]];
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${vlak ? `<rect width="48" height="48" rx="11.5" fill="${vlak}"/>` : ""}<defs><clipPath id="${id}"><path transform="${t}" d="${C_PAD}"/></clipPath></defs><g clip-path="url(#${id})"><g transform="translate(24 24) scale(${(w / h).toFixed(4)} 1) translate(-24 -24)">${vlakken.map(([k, a, b]) => `<polygon points="${punt(a, b)}" fill="${k}"/>`).join("")}</g></g></svg>`;
}
export const LOGO_SVG = beeldmerk({ vlak: "#000", id: "beeldmerk-c" });
export const LOGO_OMGEKEERD_SVG = beeldmerk({ vlak: null, id: "beeldmerk-c-voet" });

const ink = (kleur) => {
  const [v, fg] = KLEUREN[kleur];
  return `--bg:var(${v});--fg:${fg}`;
};

export function createTemplates(db) {
  const { artiesten: A, theaters: T, voorstellingen: V } = db;

  // Voorstellingen zonder vaste artiest (clubavonden, open mics) tonen hun titel als naam.
  const artistNames = (vid) => V.get(vid).artiesten.map((a) => A.get(a).naam).join(" & ") || V.get(vid).titel;
  const leadInk = (vid) => A.get(V.get(vid).artiesten[0])?.kleur || "blauw";
  const artistLinks = (vid) =>
    V.get(vid).artiesten.map((a) => `<a href="/artiesten/${a}/">${esc(A.get(a).naam)}</a>`).join(" &amp; ") || esc(V.get(vid).titel);
  // Titel die alleen de artiestnaam herhaalt ("Dolf Jansen" van "Dolf Jansen") is geen echte titel.
  const echteTitel = (vid) => {
    const v = V.get(vid);
    const naam = v.artiesten.map((a) => A.get(a).naam).join(" & ");
    return v.artiesten.length && v.titel.toLowerCase() === naam.toLowerCase() ? null : v.titel;
  };
  // Elke voorstelling met een eigen titel krijgt een pagina onder haar (eerste) artiest:
  // /artiesten/richard-groenendijk/gelukkig-heb-je-mij-nog/.
  const voorstellingPad = new Map();
  {
    const bezet = new Set();
    const metData = new Set(db.upcoming.map((g) => g.voorstelling));
    for (const v of [...V.values()].sort((x, y) => x.id.localeCompare(y.id))) {
      if (!metData.has(v.id) || !v.artiesten.length || !echteTitel(v.id)) continue;
      const basis = `/artiesten/${v.artiesten[0]}/${slugVan(v.titel) || "voorstelling"}`;
      let pad = basis, n = 2;
      while (bezet.has(pad)) pad = `${basis}-${n++}`;
      bezet.add(pad);
      voorstellingPad.set(v.id, pad + "/");
    }
  }
  const showLink = (vid, tekst) => voorstellingPad.has(vid) ? `<a href="${voorstellingPad.get(vid)}">${tekst}</a>` : tekst;


  function layout({ title, description = SITE.description, path, section, body, schema }) {
    const foto = schema?.foto?.foto;
    const nav = [
      ["agenda", "/agenda/", "Agenda"],
      ["artiesten", "/artiesten/", "Artiesten"],
      ["plaatsen", "/plaatsen/", "Plaatsen"],
      ["theaters", "/theaters/", "Theaters"],
      ["festivals", "/festivals/", "Festivals"],
      ["over", "/over/", "Over"],
    ].map(([key, href, label]) =>
      `<a href="${href}"${key === section ? ' aria-current="page"' : ""}>${label}</a>`).join("");
    const fullTitle = title ? `${title} | ${SITE.name}` : `${SITE.name}: de theateragenda van Nederland en België`;
    return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE.url}${path}">
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
<link rel="icon" href="/logo.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/big-shoulders-display-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css">
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
  <div class="wrap">
    <a class="brand" href="/" aria-label="${SITE.name}, naar de voorpagina">
      <span class="brand-mark" aria-hidden="true">${LOGO_OMGEKEERD_SVG}</span>
      <span class="logo-tekst" aria-hidden="true"><span class="wordmark">${WOORDMERK_SVG}<span class="tld">.com</span></span><span class="ondertitel">De theateragenda</span></span>
    </a>
    <nav class="footer-links" aria-label="Meer op Cabaretiers.com">
      <a href="/alle-cabaretiers/">Alle cabaretiers</a>
      <a href="/alle-cabaretiers/vrouwen/">Vrouwelijke cabaretiers</a>
      <a href="/alle-cabaretiers/mannen/">Mannelijke cabaretiers</a>
      <a href="/festivals/">Cabaretfestivals</a>
    </nav>
    <p>Cabaret en comedy in Nederland en België, verzameld uit openbare speellijsten${db.lastFetched ? `, laatst bijgewerkt op ${fmt.full(db.lastFetched)}` : ""}. Wijzigingen voorbehouden; controleer altijd bij het theater.</p>
  </div>
</footer>
<script src="/agenda.js" defer></script>
</body>
</html>
`;
  }

  // ---------- Bouwstenen ----------

  function statusLabel(g) {
    if (g.status === "uitverkocht") return `<span class="status sold">${ICON.sold}Uitverkocht</span>`;
    if (g.status === "onzeker")
      return `<span class="status doubt"${g.opmerking ? ` title="${esc(g.opmerking)}"` : ""}>${ICON.doubt}Datum onzeker</span>`;
    if (g.status === "geannuleerd" || g.status === "verplaatst")
      return `<span class="status sold">${ICON.sold}${STATUSSEN[g.status]}</span>`;
    return "";
  }

  function gigRow(g, { showArtist = true, showVenue = true } = {}) {
    const v = V.get(g.voorstelling), t = T.get(g.theater);
    const zoek = [v.titel, t.naam, t.plaats, ...v.artiesten.map((a) => A.get(a).naam)].join(" ").toLowerCase();
    return `<article class="gig${g.status === "geannuleerd" ? " cancelled" : ""}" data-datum="${g.datum}" data-land="${t.land}" data-plaats="${esc(t.plaats)}" data-genre="${v.genre}" data-zoek="${esc(zoek)}">
      <div class="date"><b>${fmt.day(g.datum)}</b><small>${fmt.weekdayShort(g.datum)}${g.tijd ? " " + g.tijd : ""}</small></div>
      <div class="main">
        <span class="swatch" style="${ink(leadInk(g.voorstelling))};background:var(--bg)" aria-hidden="true"></span>
        <div class="main-text">
          ${showArtist ? `<span class="artist">${artistLinks(g.voorstelling)}</span>` : ""}
          <span class="show">${showArtist && !v.artiesten.length ? esc(t.naam) : (echteTitel(g.voorstelling) ? showLink(g.voorstelling, esc(echteTitel(g.voorstelling))) : esc(showArtist ? "" : v.titel))}${g.soort ? ` <span class="pill">${esc(g.soort)}</span>` : ""}</span>
        </div>
      </div>
      <div class="venue">${showVenue ? `<a href="/theaters/${t.id}/">${esc(t.naam)}</a><span><a href="/plaatsen/${plaatsId(t.plaats)}/">${esc(t.plaats)}</a>, ${LANDEN[t.land]}</span>` : `<span>${esc(GENRES[v.genre])}</span>`}</div>
      <div class="side">${statusLabel(g)}<a class="source" href="${esc(g.bron)}" rel="noopener nofollow">Bron<span class="visually-hidden">: speellijst van ${esc(artistNames(g.voorstelling))} op ${fmt.full(g.datum)}</span></a></div>
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
      "@type": isGroep(a) ? "PerformingGroup" : "Person", "@id": URL(`/artiesten/${id}/#artiest`), name: a.naam, url: URL(`/artiesten/${id}/`),
      ...(a.foto ? { image: URL(a.foto.bestand) } : {}),
    };
  };
  const fotoLd = (a) => ({
    "@type": "ImageObject", "@id": URL(`/artiesten/${a.id}/#foto`),
    url: URL(a.foto.bestand), contentUrl: URL(a.foto.bestand), encodingFormat: "image/jpeg",
    name: a.foto.alt, caption: a.foto.alt, description: a.foto.alt, inLanguage: "nl",
    ...(a.foto.breedte ? { width: a.foto.breedte, height: a.foto.hoogte } : {}),
    ...(a.foto.datum ? { dateCreated: a.foto.datum } : {}),
    creditText: a.foto.maker, copyrightNotice: `${a.foto.maker}, ${a.foto.licentie}`,
    ...(a.foto.licentieUrl ? { license: a.foto.licentieUrl } : {}), acquireLicensePage: a.foto.bron,
    about: { "@id": URL(`/artiesten/${a.id}/#artiest`) },
  });
  // Eerste artiest met een foto bij een voorstelling.
  const fotoArtiest = (vid) => V.get(vid).artiesten.map((x) => A.get(x)).find((x) => x.foto);
  const zaalLd = (id) => {
    const t = T.get(id);
    return {
      "@type": ZAAL_TYPE[t.soort] || "EventVenue", "@id": URL(`/theaters/${id}/#zaal`), name: t.naam, url: URL(`/theaters/${id}/`),
      ...(t.website ? { sameAs: t.website } : {}),
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
      ...(fotoArtiest(g.voorstelling) ? { image: [URL(fotoArtiest(g.voorstelling).foto.bestand)] } : {}),
      ...(v.artiesten.length ? { performer: v.artiesten.map(artiestLd) } : {}),
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
        { "@type": "Organization", "@id": ORG_ID, name: SITE.name, url: URL("/"), logo: { "@type": "ImageObject", url: URL("/apple-touch-icon.png"), width: 180, height: 180, caption: "Beeldmerk van Cabaretiers.com" }, image: URL("/deelafbeelding.png") },
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
  const landVanPlaats = (p) => T.get(perPlaats(p)[0]?.theater)?.land || [...T.values()].find((t) => t.plaats === p)?.land;
  const artiestenMetData = [...A.values()].map((a) => ({ a, list: db.gigsForArtist(a.id) })).filter((x) => x.list.length);
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
  function filters(list, { plaats = true, land = true, maand = false } = {}) {
    const cities = [...new Set(list.map((g) => T.get(g.theater).plaats))].sort((a, b) => a.localeCompare(b, "nl"));
    const months = [...new Set(list.map((g) => g.datum.slice(0, 7)))].sort();
    const genres = genresVan(list);
    const landen = [...new Set(list.map((g) => T.get(g.theater).land))];
    return `<form class="filters" id="filters" role="search" aria-label="Voorstellingen filteren" hidden>
    <div class="field search">
      <label for="f-q">Zoek op artiest, voorstelling of zaal</label>
      <input id="f-q" name="q" type="search" autocomplete="off" placeholder="Bijvoorbeeld: Lebbis of oudejaars">
    </div>
    ${land && landen.length > 1 ? `<div class="field country">
      <span class="label" id="f-land-label">Land</span>
      <div class="chips" role="group" aria-labelledby="f-land-label">
        <button type="button" class="chip" data-land="" aria-pressed="true">Alles</button>
        <button type="button" class="chip" data-land="NL" aria-pressed="false">Nederland</button>
        <button type="button" class="chip" data-land="BE" aria-pressed="false">België</button>
      </div>
    </div>` : ""}
    ${maand && months.length > 1 ? `<div class="field">
      <label for="f-maand">Maand</label>
      <select id="f-maand" name="maand"><option value="">Alle maanden</option>${months.map((m) => `<option value="${m}">${maandNaam(m)}</option>`).join("")}</select>
    </div>` : ""}
    ${plaats && cities.length > 1 ? `<div class="field">
      <label for="f-plaats">Plaats</label>
      <select id="f-plaats" name="plaats"><option value="">Alle plaatsen</option>${cities.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}</select>
    </div>` : ""}
    ${genres.length > 1 ? `<div class="field">
      <label for="f-genre">Soort</label>
      <select id="f-genre" name="genre"><option value="">Alle soorten</option>${genres.map((g) => `<option value="${g}">${GENRES[g]}</option>`).join("")}</select>
    </div>` : ""}
  </form>
  <p class="result-line" id="result-line" aria-live="polite"></p>`;
  }

  const leegBlok = `<div class="empty" id="empty" hidden>
    <p>Geen voorstellingen die aan deze filters voldoen.</p>
    <button type="button" class="btn ghost" id="reset">Filters wissen</button>
  </div>`;

  // Maandkeuze als rij knoppen; de huidige maand is gemarkeerd.
  function maandNav(huidig) {
    return `<nav class="month-nav" aria-label="Maanden">${maanden.map((m) =>
      `<a href="/agenda/${maandId(m)}/"${m === huidig ? ' aria-current="page"' : ""}><b>${kortMaand(m)}</b><span>${m.slice(0, 4)}</span></a>`).join("")}</nav>`;
  }

  // ---------- Pagina's ----------

  // Lange titels kleiner zetten zodat ze verticaal op de affiche passen.
  const titleClass = (titel) => {
    const longestWord = Math.max(...titel.split(/\s+/).map((w) => w.length));
    return longestWord > 13 ? " xlong" : titel.length > 10 ? " long" : "";
  };

  // Affiche per artiest die het vaakst speelt, met de eerstvolgende speeldatum.
  function posterWall(lijst) {
    const spots = [["78%", "26%"], ["30%", "70%"], ["85%", "80%"], ["20%", "20%"], ["60%", "50%"]];
    const thisYear = fmt.year(db.today);
    return lijst.map(({ a, list }, i) => {
      const g = list.find((x) => x.status !== "geannuleerd") || list[0];
      const v = V.get(g.voorstelling), t = T.get(g.theater);
      const [sx, sy] = spots[i % spots.length];
      const aantal = plural(list.length, "speeldatum", "speeldata");
      return `<a class="poster" href="/artiesten/${a.id}/" style="${ink(a.kleur)};--sx:${sx};--sy:${sy}">
        <span class="visually-hidden">${esc(a.naam)}, ${aantal}, eerstvolgende ${fmt.long(g.datum)} in ${esc(t.naam)}, ${esc(t.plaats)}</span>
        <div class="when" aria-hidden="true">
          <span class="weekday">Vanaf</span>
          <span class="day">${fmt.day(g.datum)}</span>
          <span class="month">${fmt.monthShort(g.datum)}${fmt.year(g.datum) !== thisYear ? " " + fmt.year(g.datum) : ""}</span>
        </div>
        <span class="vtitle${titleClass(a.naam)}" aria-hidden="true">${esc(a.naam)}</span>
        <div class="who" aria-hidden="true">
          <strong>${esc(echteTitel(g.voorstelling) || v.titel)}</strong>
          <span class="where">${esc(t.naam)}${t.naam.includes(t.plaats) ? "" : "<br>" + esc(t.plaats)}</span>
          <span class="tag">${aantal}</span>
        </div>
      </a>`;
    }).join("");
  }

  function artiestKaarten(lijst) {
    return lijst.map(({ a, list }) => {
      const titles = [...new Set(list.map((g) => echteTitel(g.voorstelling)).filter(Boolean))].slice(0, 2).join(", ");
      const langsteWoord = Math.max(...a.naam.split(/\s+/).map((w) => w.length));
      return `<a class="artist-card" href="/artiesten/${a.id}/" style="${ink(a.kleur)}">
          <h3${langsteWoord > 10 ? ' class="lang"' : ""}>${esc(a.naam)}</h3>
          <p>${titles ? `${esc(titles)}<br>` : ""}<span class="count">${plural(list.length, "speeldatum", "speeldata")}</span>, vanaf ${fmt.dayMonth(list[0].datum)}</p>
        </a>`;
    }).join("");
  }

  function home() {
    const eindeWeek = new Date(new Date(db.today + "T12:00:00").getTime() + 6 * 864e5).toISOString().slice(0, 10);
    const dezeWeek = up.filter((g) => g.datum <= eindeWeek);
    const veelOpTournee = [...artiestenMetData].sort((x, y) => y.list.length - x.list.length || x.a.naam.localeCompare(y.a.naam, "nl")).slice(0, 12);
    const grootstePlaatsen = [...plaatsen].sort((a, b) => perPlaats(b).length - perPlaats(a).length).slice(0, 12)
      .sort((a, b) => a.localeCompare(b, "nl"));

    const body = `
<section class="wall" aria-labelledby="wall-title">
  <div class="wrap wall-head">
    <h1 id="wall-title">Veel op tournee</h1>
    <p>De cabaretiers en comedians met de meeste speeldata. <a href="/artiesten/">Alle ${tellers.artiesten} artiesten</a></p>
  </div>
  <div class="strip-wrap">
    <div class="strip" id="strip" tabindex="0" aria-label="Artiesten met de meeste speeldata">${posterWall(veelOpTournee)}</div>
    <div class="strip-nav" hidden>
      <button type="button" id="strip-prev" aria-label="Vorige voorstellingen">${ICON.prev}</button>
      <button type="button" id="strip-next" aria-label="Volgende voorstellingen">${ICON.next}</button>
    </div>
  </div>
</section>

<section class="wrap stats" aria-label="De agenda in cijfers">
  <dl>
    <div><dt>voorstellingen</dt><dd>${tellers.speeldata.toLocaleString("nl-NL")}</dd></div>
    <div><dt>artiesten</dt><dd>${tellers.artiesten}</dd></div>
    <div><dt>zalen</dt><dd>${tellers.zalen}</dd></div>
    <div><dt>plaatsen</dt><dd>${tellers.plaatsen}</dd></div>
  </dl>
</section>

<section class="block wrap" id="agenda" aria-labelledby="week-title">
  <div class="block-head">
    <h2 id="week-title">Deze week</h2>
    <p><a href="/agenda/">Bekijk de volledige agenda</a></p>
  </div>
  ${filters(dezeWeek, { plaats: true })}
  <div id="gigs">${monthGroups(dezeWeek)}</div>
  ${leegBlok}
</section>

<section class="block wrap" aria-labelledby="maand-title">
  <div class="block-head"><h2 id="maand-title">Kies een maand</h2><p>Per maand alle voorstellingen, met zoeken en filters.</p></div>
  <div class="month-tiles">${maanden.map((m) => {
    const n = perMaand(m).length;
    return `<a href="/agenda/${maandId(m)}/"><b>${fmt.monthShort(m + "-01")}</b><span>${m.slice(0, 4)}</span><em>${plural(n, "voorstelling", "voorstellingen")}</em></a>`;
  }).join("")}</div>
</section>

<section class="block wrap" aria-labelledby="plaats-title">
  <div class="block-head"><h2 id="plaats-title">Kies een plaats</h2><p><a href="/plaatsen/">Alle ${tellers.plaatsen} plaatsen</a></p></div>
  <div class="city-chips">${grootstePlaatsen.map((p) =>
    `<a href="/plaatsen/${plaatsId(p)}/">${esc(p)} <span>${perPlaats(p).length}</span></a>`).join("")}</div>
</section>

<section class="block wrap" aria-labelledby="festival-title">
  <div class="block-head"><h2 id="festival-title">Cabaretfestivals</h2><p><a href="/festivals/">Alle festivals</a></p></div>
  <div class="city-chips">${festivalsMetData.map(({ f, list }) =>
    `<a href="/festivals/${f.id}/">${esc(f.naam)} <span>${list.length}</span></a>`).join("")}</div>
</section>`;
    return layout({ path: "/", section: null, body, schema: { extra: eventsLd(dezeWeek) } });
  }

  function agendaIndex() {
    const komend = up.slice(0, 60);
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Agenda</h1><p>${plural(tellers.speeldata, "voorstelling", "voorstellingen")} in ${plural(tellers.zalen, "zaal", "zalen")}</p></div>
      ${maandNav(null)}
      <h2 class="sub-head">Eerstvolgende voorstellingen</h2>
      ${filters(komend)}
      <div id="gigs">${monthGroups(komend)}</div>
      ${leegBlok}
      <p class="more"><a class="btn" href="/agenda/${maandId(maanden[0])}/">Verder in ${maandNaam(maanden[0])}</a></p>
    </section>`;
    return layout({ title: "Agenda", description: "Alle aankomende cabaret- en comedyvoorstellingen in Nederland en België, per maand.", path: "/agenda/", section: "agenda", body, schema: { type: "CollectionPage", kruimels: [["Agenda", "/agenda/"]], extra: eventsLd(komend) } });
  }

  function agendaMaand(m) {
    const list = perMaand(m);
    const i = maanden.indexOf(m);
    const vorige = maanden[i - 1], volgende = maanden[i + 1];
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">${maandNaam(m)}</h1><p>${plural(list.length, "voorstelling", "voorstellingen")}</p></div>
      ${maandNav(m)}
      ${filters(list)}
      <div id="gigs">${monthGroups(list).replace(/<h3>[^<]*<\/h3>/, "")}</div>
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
        const zalen = zalenMetData.filter((t) => t.plaats === p).length;
        return `<li><a href="/plaatsen/${plaatsId(p)}/"><span><span class="vn">${esc(p)}</span><span class="vc">${plural(zalen, "zaal", "zalen")}</span></span><span class="vk">${plural(perPlaats(p).length, "voorstelling", "voorstellingen")}</span></a></li>`;
      }).join("")}</ul></div>`;
    }).join("");
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Plaatsen</h1><p>Waar is cabaret en comedy te zien?</p></div>
      <div class="venues">${kolommen}</div>
    </section>`;
    return layout({ title: "Plaatsen", description: "Cabaret en comedy per plaats in Nederland en België.", path: "/plaatsen/", section: "plaatsen", body, schema: { type: "CollectionPage", kruimels: [["Plaatsen", "/plaatsen/"]], hoofd: lijstLd(plaatsen.map((p) => [p, `/plaatsen/${plaatsId(p)}/`])) } });
  }

  function plaatsPagina(p) {
    const list = perPlaats(p);
    const zalen = zalenMetData.filter((t) => t.plaats === p);
    const body = `<div class="detail-hero" style="--bg:var(--riso-yellow);--fg:#000"><div class="wrap">
        <h1>${esc(p)}</h1>
        <p>${plural(list.length, "aankomende voorstelling", "aankomende voorstellingen")} in ${zalen.map((t) => `<a href="/theaters/${t.id}/">${esc(t.naam)}</a>`).join(", ").replace(/, ([^,]*)$/, " en $1")}.</p>
      </div></div>
      <div class="wrap detail-body">
        ${filters(list, { plaats: false, land: false, maand: true })}
        <div id="gigs">${monthGroups(list)}</div>
        ${leegBlok}
      </div>`;
    return layout({ title: `Cabaret en comedy in ${p}`, description: `Alle ${list.length} aankomende cabaret- en comedyvoorstellingen in ${p}: ${zalen.map((t) => t.naam).join(", ")}.`, path: `/plaatsen/${plaatsId(p)}/`, section: "plaatsen", body, schema: { type: "CollectionPage", kruimels: [["Plaatsen", "/plaatsen/"], [p, `/plaatsen/${plaatsId(p)}/`]], over: plaatsLd(p), extra: eventsLd(list) } });
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
        <ul>${items.map(({ a, list }) => `<li data-naam="${esc(a.naam.toLowerCase())}"><a href="/artiesten/${a.id}/"><span class="swatch" style="${ink(a.kleur)};background:var(--bg)" aria-hidden="true"></span><span class="an">${esc(a.naam)}</span><span class="ad">vanaf ${fmt.dayMonth(list[0].datum)}</span><span class="ac">${plural(list.length, "datum", "data")}</span></a></li>`).join("")}</ul>
      </section>`).join("")}</div>
      <p class="empty" id="az-leeg" hidden>Geen artiest gevonden met deze naam.</p>`;
  }

  function artistIndex() {
    const veelOpTournee = [...artiestenMetData].sort((x, y) => y.list.length - x.list.length).slice(0, 8);
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Artiesten</h1><p>${tellers.artiesten} cabaretiers, comedians en gezelschappen met aankomende voorstellingen.</p></div>
      <h2 class="sub-head">Veel op tournee</h2>
      <div class="artists">${artiestKaarten(veelOpTournee)}</div>
      <h2 class="sub-head">Van A tot Z</h2>
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
  const artiestLink = (a) => `<a href="/artiesten/${a.id}/">${esc(a.naam)}</a>`;
  const CABARETIER_PAGINAS = {
    alle: { pad: "/alle-cabaretiers/", naam: "Alle cabaretiers", wie: "cabaretiers", filter: () => true },
    vrouw: { pad: "/alle-cabaretiers/vrouwen/", naam: "Vrouwelijke cabaretiers", wie: "vrouwelijke cabaretiers", filter: ({ a }) => a.geslacht === "vrouw" },
    man: { pad: "/alle-cabaretiers/mannen/", naam: "Mannelijke cabaretiers", wie: "mannelijke cabaretiers", filter: ({ a }) => a.geslacht === "man" },
  };

  function faqHtml(vragen) {
    return `<section class="faq" aria-labelledby="faq-titel">
        <h2 id="faq-titel">Veelgestelde vragen</h2>
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

    const intro = {
      alle: `Op Cabaretiers.com vind je ${items.length} cabaretiers en comedians die de komende tijd in Nederland en België op het podium staan, samen goed voor ${plural(gigs.length, "voorstelling", "voorstellingen")} in ${plural(steden.length, "plaats", "plaatsen")}. Van grote namen in de schouwburg tot nieuw talent in een kleine zaal: per cabaretier zie je waar en wanneer je kunt gaan kijken.`,
      vrouw: `${items.length} vrouwelijke cabaretiers en comedians staan de komende tijd op het podium, samen goed voor ${plural(gigs.length, "voorstelling", "voorstellingen")} in ${plural(steden.length, "plaats", "plaatsen")}. Een vrouwelijke cabaretier heet ook wel een cabaretière. Hieronder vind je ze allemaal, met hun speeldata in Nederland en België.`,
      man: `${items.length} mannelijke cabaretiers en comedians staan de komende tijd op het podium, samen goed voor ${plural(gigs.length, "voorstelling", "voorstellingen")} in ${plural(steden.length, "plaats", "plaatsen")}. Hieronder vind je ze allemaal, met hun speeldata in Nederland en België.`,
    }[soort];

    // Lopende tekst, uit de gegevens van de agenda.
    const tekst = [];
    tekst.push(`<h2>${soort === "alle" ? "Cabaretiers in Nederland en België" : `${esc(P.naam)} op tournee`}</h2>
        <p>${soort === "alle" ? "Een cabaretier maakt een avondvullende voorstelling met humor, verhalen, liedjes en vaak een scherpe kijk op de maatschappij. " : ""}Het vaakst te zien de komende tijd: ${opsomming(top.slice(0, 5).map(zin))}. De meeste voorstellingen zijn in ${opsomming(steden.slice(0, 4).map(([p, n]) => `${plaatsLink(p)} (${n})`))}${zalen.length ? `, en ${theaterLink(zalen[0][0])} programmeert ${P.wie} het vaakst` : ""}.</p>`);
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
      ["Wat is een try-out?", `Een try-out is een voorstelling van een nieuw programma vóór de première. De cabaretier test dan wat werkt, en kaartjes zijn vaak goedkoper. Er staan nu ${plural(tryouts.length, "try-out", "try-outs")} in de agenda.`],
      ["Waar kan ik cabaretiers zien?", `In ${plural(tellers.zalen, "zaal", "zalen")} in ${plural(tellers.plaatsen, "plaats", "plaatsen")} in Nederland en België, van grote schouwburgen tot comedyclubs. Kijk per <a href="/plaatsen/">plaats</a> of per <a href="/theaters/">theater</a>.`],
      ["Hoe actueel is deze lijst?", "De speellijsten van de theaters worden elke nacht opnieuw opgehaald. Elke speeldatum linkt naar de bron. Wijzigingen zijn altijd voorbehouden: controleer de datum bij het theater voordat je kaartjes koopt."],
    ] : [
      [soort === "vrouw" ? "Wie zijn bekende vrouwelijke cabaretiers?" : "Wie zijn bekende mannelijke cabaretiers?", `De komende tijd staan ${opsomming(top.slice(0, 6).map(zin))} het vaakst op het podium.`],
      ...(soort === "vrouw" ? [["Hoe heet een vrouwelijke cabaretier?", "Een vrouwelijke cabaretier heet een cabaretière. In het dagelijks taalgebruik wordt ook gewoon cabaretier gezegd."]] : []),
      [soort === "vrouw" ? "Welke cabaretières staan binnenkort in het theater?" : "Welke mannelijke cabaretiers staan binnenkort in het theater?", `Binnenkort: ${opsomming(binnenkort.map((g) => `${artiestLink(A.get(V.get(g.voorstelling).artiesten.find((id) => items.some((x) => x.a.id === id))))} op ${fmt.dayMonth(g.datum)} in ${esc(T.get(g.theater).plaats)}`))}.`],
      ...(oudejaars.length ? [[soort === "vrouw" ? "Welke vrouwelijke cabaretiers spelen een oudejaarsconference?" : "Welke mannelijke cabaretiers spelen een oudejaarsconference?", `Dit seizoen onder meer ${opsomming(oudejaars.slice(0, 6).map(({ a }) => artiestLink(a)))}.`]] : []),
      ...(belgen.length ? [[soort === "vrouw" ? "Staan er ook Belgische cabaretières op deze lijst?" : "Staan er ook Belgische cabaretiers op deze lijst?", `Ja, onder meer ${opsomming(belgen.slice(0, 5).map(({ a }) => artiestLink(a)))}.`]] : []),
      [soort === "vrouw" ? "Staat een cabaretière er niet tussen?" : "Staat een cabaretier er niet tussen?", `Deze lijst is gebaseerd op openbare gegevens van Wikipedia en Wikidata. Wie daar (nog) niet in staat, vind je bij <a href="/alle-cabaretiers/">alle cabaretiers</a> of in het overzicht van <a href="/artiesten/">alle artiesten</a>.`],
    ];

    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">${esc(P.naam)}</h1><p>${intro}</p></div>
      <p class="zie-ook">Bekijk ook de ${andere.join(", de ")} of <a href="/artiesten/">alle artiesten</a>.</p>
      <h2 class="sub-head">${soort === "alle" ? "Populaire cabaretiers op tournee" : `Populaire ${esc(P.wie)} op tournee`}</h2>
      <div class="artists">${artiestKaarten(top)}</div>
      <h2 class="sub-head">${esc(P.naam)} van A tot Z</h2>
      ${azLijst(items, { zoekLabel: soort === "vrouw" ? "Zoek een cabaretière" : "Zoek een cabaretier" })}
      <div class="seo-tekst prose">
        ${tekst.join("\n        ")}
      </div>
      ${faqHtml(vragen)}
    </section>`;
    const kruimels = soort === "alle" ? [["Alle cabaretiers", P.pad]] : [["Alle cabaretiers", "/alle-cabaretiers/"], [soort === "vrouw" ? "Vrouwen" : "Mannen", P.pad]];
    const titel = { alle: "Alle cabaretiers van Nederland en België", vrouw: "Vrouwelijke cabaretiers (cabaretières)", man: "Mannelijke cabaretiers" }[soort];
    const desc = { alle: `${items.length} cabaretiers en comedians op tournee in Nederland en België, van A tot Z, met hun speeldata. Plus: wat is een cabaretier, try-outs en oudejaarsconferences.`,
      vrouw: `${items.length} vrouwelijke cabaretiers en comedians op tournee, waaronder ${opsomming(top.slice(0, 3).map(({ a }) => a.naam))}. Bekijk al hun speeldata in Nederland en België.`,
      man: `${items.length} mannelijke cabaretiers en comedians op tournee, waaronder ${opsomming(top.slice(0, 3).map(({ a }) => a.naam))}. Bekijk al hun speeldata in Nederland en België.` }[soort];
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
    return u === list.length ? " Alle voorstellingen zijn uitverkocht." : ` ${u} van de ${list.length} voorstellingen ${u === 1 ? "is" : "zijn"} al uitverkocht.`;
  };
  const kaartenZin = "Kaarten koop je bij de zaal zelf: via de link <em>Bron</em> bij elke datum kom je op de speellijst van het theater. Cabaretiers.com werkt de agenda elke nacht bij.";

  function artiestTekst(a, list) {
    if (!list.length) return "";
    const titels = [...new Set(list.map((g) => echteTitel(g.voorstelling)).filter(Boolean))];
    const genres = telPer(list, (g) => V.get(g.voorstelling).genre).map(([k]) => GENRE_TEKST[k]);
    const steden = telPer(list, (g) => T.get(g.theater).plaats);
    const zalen = telPer(list, (g) => g.theater);
    const jaren = [...new Set(list.map((g) => fmt.year(g.datum)))];
    const metTitels = titels.length === 1 ? ` met de voorstelling <em>${esc(titels[0])}</em>`
      : titels.length > 1 ? ` met de voorstellingen ${opsomming(titels.slice(0, 4).map((t) => `<em>${esc(t)}</em>`))}` : "";
    const zinnen = [];
    zinnen.push(`<p>${esc(a.naam)} staat de komende tijd ${keer(list.length)} op het podium${metTitels}, ${periode(list)}. ` +
      (steden.length > 1
        ? `De tournee komt langs ${steden.length} plaatsen: ${steden.length > 8
          ? `${steden.slice(0, 8).map(([p]) => plaatsLink(p)).join(", ")} en nog ${plural(steden.length - 8, "andere plaats", "andere plaatsen")}`
          : opsomming(steden.map(([p]) => plaatsLink(p)))}.`
        : zalen.length === 1
          ? `${list.length === 1 ? "De voorstelling is" : "Alle voorstellingen zijn"} in ${theaterLink(zalen[0][0])} in ${plaatsLink(steden[0][0])}.`
          : `Te zien in ${plaatsLink(steden[0][0])}.`) +
      ` Het genre is ${opsomming(genres.slice(0, 2))}.</p>`);
    const p2 = [];
    if (zalen.length > 1 && zalen[0][1] > 1) p2.push(`Het vaakst is ${esc(a.naam)} te zien in ${theaterLink(zalen[0][0])} in ${esc(T.get(zalen[0][0]).plaats)} (${keer(zalen[0][1])}).`);
    const premiere = bijzonder(list, "première")[0];
    if (premiere) p2.push(`De première is op ${fmt.long(premiere.datum)} in ${theaterLink(premiere.theater)}.`);
    const tryouts = bijzonder(list, "try-out");
    if (tryouts.length) p2.push(tryouts.length === 1 ? `Op ${fmt.full(tryouts[0].datum)} is er een try-out in ${theaterLink(tryouts[0].theater)}.` : `${tryouts.length} voorstellingen zijn try-outs.`);
    const derniere = bijzonder(list, "dernière")[0];
    if (derniere) p2.push(`De laatste voorstelling, de dernière, is op ${fmt.long(derniere.datum)} in ${theaterLink(derniere.theater)}.`);
    if (list.some((g) => T.get(g.theater).land === "BE") && list.some((g) => T.get(g.theater).land === "NL")) p2.push("De tournee komt zowel in Nederland als in België langs.");
    const tekst = (p2.join(" ") + uitverkochtZin(list)).trim();
    if (tekst) zinnen.push(`<p>${tekst}</p>`);
    zinnen.push(`<p>${kaartenZin}</p>`);
    return `<section class="seo-tekst prose" aria-labelledby="over-titel">
        <h2 id="over-titel">${esc(a.naam)} live zien in ${opsomming(jaren.map(String))}</h2>
        ${zinnen.join("\n        ")}
      </section>`;
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
      const top = artiestTel.slice(0, 6).map(([id]) => `<a href="/artiesten/${id}/">${esc(A.get(id).naam)}</a>`);
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

  // Rechtenvrije foto (Wikimedia Commons) met verplichte naamsvermelding en licentie.
  const fotoHtml = (a) => `<figure class="artiest-foto">
          <img src="${esc(a.foto.bestand)}" alt="${esc(a.foto.alt)}"${a.foto.breedte ? ` width="${a.foto.breedte}" height="${a.foto.hoogte}"` : ""} loading="eager" decoding="async" fetchpriority="high">
          <figcaption>Foto: <a href="${esc(a.foto.bron)}" rel="noopener">${esc(a.foto.maker)}</a>${a.foto.licentieUrl ? `, <a href="${esc(a.foto.licentieUrl)}" rel="noopener license">${esc(a.foto.licentie)}</a>` : `, ${esc(a.foto.licentie)}`}</figcaption>
        </figure>`;

  function artistPage(a) {
    const list = db.gigsForArtist(a.id);
    const titles = [...new Set(list.map((g) => echteTitel(g.voorstelling)).filter(Boolean))];
    const showIds = [...new Set(list.map((g) => g.voorstelling).filter((vid) => echteTitel(vid)))];
    const partners = [...new Set(list.flatMap((g) => V.get(g.voorstelling).artiesten))].filter((x) => x !== a.id);
    const cityCount = new Set(list.map((g) => T.get(g.theater).plaats)).size;
    const summary = list.length
      ? `${plural(list.length, "speeldatum", "speeldata")} in ${plural(cityCount, "plaats", "plaatsen")}${partners.length ? `, samen met ${partners.map((p) => `<a href="/artiesten/${p}/">${esc(A.get(p).naam)}</a>`).join(" en ")}` : ""}.`
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
        ${list.length > 12 ? filters(list, { maand: true }) : ""}
        <div id="gigs">${monthGroups(list, { showArtist: false })}</div>
        ${list.length > 12 ? leegBlok : ""}
        ${artiestTekst(a, list)}
        ${a.geslacht && !isGroep(a) ? `<p class="zie-ook">Bekijk ook andere <a href="/alle-cabaretiers/${a.geslacht === "vrouw" ? "vrouwen" : "mannen"}/">${a.geslacht === "vrouw" ? "vrouwelijke" : "mannelijke"} cabaretiers</a> of <a href="/alle-cabaretiers/">alle cabaretiers</a>.</p>` : ""}
      </div>`;
    const desc = list.length
      ? kort(`${a.naam} live: ${plural(list.length, "voorstelling", "voorstellingen")} in ${plural(cityCount, "plaats", "plaatsen")}${titles.length ? `, met ${titles.slice(0, 2).join(" en ")}` : ""}. Eerstvolgende op ${fmt.full(list[0].datum)}. Bekijk alle speeldata.`)
      : `${a.naam} op Cabaretiers.com.`;
    return layout({ title: `${a.naam}: tournee en speeldata`, description: desc, path: `/artiesten/${a.id}/`, section: "artiesten", body, schema: { type: "ProfilePage", foto: a.foto ? a : null, kruimels: [["Artiesten", "/artiesten/"], [a.naam, `/artiesten/${a.id}/`]], hoofd: { "@id": artiestLd(a.id)["@id"] }, extra: [artiestLd(a.id), ...eventsLd(list)] } });
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

  function voorstellingPagina(vid) {
    const v = V.get(vid), a = A.get(v.artiesten[0]);
    const list = up.filter((g) => g.voorstelling === vid);
    const steden = new Set(list.map((g) => T.get(g.theater).plaats)).size;
    const body = `<div class="detail-hero" style="${ink(a.kleur)}"><div class="wrap">
        <h1>${esc(v.titel)}</h1>
        <p>Voorstelling van ${artistLinks(vid)}. ${plural(list.length, "speeldatum", "speeldata")} in ${plural(steden, "plaats", "plaatsen")}.</p>
      </div></div>
      <div class="wrap detail-body">
        ${list.length > 12 ? filters(list, { maand: true }) : ""}
        <div id="gigs">${monthGroups(list, { showArtist: false })}</div>
        ${list.length > 12 ? leegBlok : ""}
        ${voorstellingTekst(vid, list)}
      </div>`;
    const desc = kort(`${v.titel} van ${artistNames(vid)}: ${plural(list.length, "voorstelling", "voorstellingen")} in ${plural(steden, "plaats", "plaatsen")}. Eerstvolgende op ${fmt.full(list[0].datum)}. Bekijk alle speeldata.`);
    return layout({ title: `${v.titel} van ${artistNames(vid)}: speeldata`, description: desc, path: voorstellingPad.get(vid), section: "artiesten", body, schema: {
      kruimels: [["Artiesten", "/artiesten/"], [a.naam, `/artiesten/${a.id}/`], [v.titel, voorstellingPad.get(vid)]],
      foto: fotoArtiest(vid) || null,
      hoofd: { "@id": URL(voorstellingPad.get(vid) + "#voorstelling") },
      extra: [{
        "@type": "EventSeries", "@id": URL(voorstellingPad.get(vid) + "#voorstelling"), name: v.titel, url: URL(voorstellingPad.get(vid)),
        description: desc, performer: v.artiesten.map(artiestLd),
        ...(fotoArtiest(vid) ? { image: { "@id": URL(`/artiesten/${fotoArtiest(vid).id}/#foto`) } } : {}),
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

  function festivalIndex() {
    const zonder = [...F.values()].filter((f) => !db.gigsForFestival(f.id).length).sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Cabaretfestivals</h1><p>Concoursen en festivals in Nederland en België, met hun finales en finalistentournees.</p></div>
      <div class="artists">${festivalsMetData.map(({ f, list }) => `<a class="artist-card" href="/festivals/${f.id}/" style="${ink(festivalKleur(f))}">
          <h3${kopMaat(f.naam)}>${esc(f.naam)}</h3>
          <p>${esc(f.plaats)}<br><span class="count">${plural(list.length, "speeldatum", "speeldata")}</span>, vanaf ${fmt.dayMonth(list[0].datum)}</p>
        </a>`).join("")}</div>
      ${zonder.length ? `<h2 class="sub-head">Nog geen speeldata bekend</h2>
      <ul class="sources">${zonder.map((f) => `<li>${f.website ? `<a href="${esc(f.website)}" rel="noopener">${esc(f.naam)}</a>` : esc(f.naam)} <span>${esc(f.plaats)}</span></li>`).join("")}</ul>` : ""}
    </section>`;
    return layout({ title: "Cabaretfestivals", description: kort(`Alle cabaretfestivals in Nederland en België: ${festivalsMetData.map(({ f }) => f.naam).join(", ")}. Finales, halve finales en finalistentournees.`), path: "/festivals/", section: "festivals", body,
      schema: { type: "CollectionPage", kruimels: [["Festivals", "/festivals/"]], hoofd: lijstLd([...F.values()].map((f) => [f.naam, `/festivals/${f.id}/`])) } });
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
    if (artiesten.length) p2.push(`Op de speellijst staan ook ${opsomming(artiesten.slice(0, 6).map((a) => `<a href="/artiesten/${a}/">${esc(A.get(a).naam)}</a>`))}.`);
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

  function theaterIndex() {
    const kolommen = Object.keys(LANDEN).map((land) => {
      const steden = [...new Set(zalenMetData.filter((t) => t.land === land).map((t) => t.plaats))].sort((a, b) => a.localeCompare(b, "nl"));
      if (!steden.length) return "";
      return `<div><h2>${LANDEN[land]}</h2>${steden.map((p) => `<h3 class="city-head"><a href="/plaatsen/${plaatsId(p)}/">${esc(p)}</a></h3><ul class="venue-list">${zalenMetData.filter((t) => t.plaats === p).sort((a, b) => a.naam.localeCompare(b.naam, "nl")).map((t) => {
        const n = db.gigsForTheater(t.id).length;
        return `<li><a href="/theaters/${t.id}/"><span><span class="vn">${esc(t.naam)}</span>${t.soort !== "theater" ? `<span class="vc">${esc(t.soort)}</span>` : ""}</span><span class="vk">${plural(n, "voorstelling", "voorstellingen")}</span></a></li>`;
      }).join("")}</ul>`).join("")}</div>`;
    }).join("");
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Theaters</h1><p>${tellers.zalen} zalen, comedyclubs en podia met aankomende voorstellingen.</p></div>
      <div class="venues">${kolommen}</div>
    </section>`;
    return layout({ title: "Theaters", description: "Theaters, comedyclubs en podia in Nederland en België met cabaret en comedy.", path: "/theaters/", section: "theaters", body, schema: { type: "CollectionPage", kruimels: [["Theaters", "/theaters/"]], hoofd: lijstLd([...zalenMetData].sort((x, y) => x.naam.localeCompare(y.naam, "nl")).map((t) => [t.naam, `/theaters/${t.id}/`])) } });
  }

  function theaterPage(t) {
    const list = db.gigsForTheater(t.id);
    const body = `<div class="detail-hero" style="--bg:var(--riso-blue);--fg:#FFF"><div class="wrap">
        <h1>${esc(t.naam)}</h1>
        <p><a href="/plaatsen/${plaatsId(t.plaats)}/">${esc(t.plaats)}</a>, ${LANDEN[t.land]}. ${list.length ? `${plural(list.length, "aankomende voorstelling", "aankomende voorstellingen")}.` : "Op dit moment staan er geen voorstellingen gepland."}${t.website ? ` <a href="${esc(t.website)}" rel="noopener">Website van het theater</a>` : ""}</p>
      </div></div>
      <div class="wrap detail-body">
        ${list.length > 12 ? filters(list, { plaats: false, land: false, maand: true }) : ""}
        <div id="gigs">${monthGroups(list, { showVenue: false })}</div>
        ${list.length > 12 ? leegBlok : ""}
        ${theaterTekst(t, list)}
      </div>`;
    const desc = list.length
      ? kort(`Cabaret en comedy in ${t.naam}${t.naam.includes(t.plaats) ? "" : ` in ${t.plaats}`}: ${plural(list.length, "voorstelling", "voorstellingen")}${list.length > 1 ? ` van ${fmt.full(list[0].datum)} tot ${fmt.full(list.at(-1).datum)}` : ` op ${fmt.full(list[0].datum)}`}. Bekijk het programma.`)
      : `Cabaret en comedy in ${t.naam} (${t.plaats}).`;
    return layout({ title: `${t.naam}${t.naam.includes(t.plaats) ? "" : ` ${t.plaats}`}: cabaret en comedy`, description: desc, path: `/theaters/${t.id}/`, section: "theaters", body, schema: { kruimels: [["Theaters", "/theaters/"], [t.naam, `/theaters/${t.id}/`]], hoofd: { "@id": zaalLd(t.id)["@id"] }, extra: [{ ...zaalLd(t.id), containedInPlace: plaatsLd(t.plaats) }, ...eventsLd(list)] } });
  }

  function about() {
    const bronnen = zalenMetData.filter((t) => t.website).sort((a, b) => a.plaats.localeCompare(b.plaats, "nl") || a.naam.localeCompare(b.naam, "nl"));
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Over de agenda</h1></div>
      <div class="about">
        <div class="prose">
          <p>Cabaretiers.com verzamelt alle aankomende cabaret- en comedyvoorstellingen in Nederland en België: theatercabaret, stand-up in comedyclubs en cafés, festivals en open mics. Je ziet per avond wie waar speelt, en per artiest, plaats of zaal de volledige speellijst.</p>
          <p>Op dit moment staan er ${tellers.speeldata.toLocaleString("nl-NL")} voorstellingen in de agenda, van ${tellers.artiesten} artiesten in ${tellers.zalen} zalen.</p>
          <p>Elke speeldatum heeft een bron. Klik op <em>Bron</em> om de datum bij het theater of de artiest te controleren voordat je kaarten koopt. Datums waarover bronnen elkaar tegenspreken, staan gemarkeerd als <em>datum onzeker</em>.</p>
          <h2 id="aanmelden">Zelf voorstellingen aanmelden</h2>
          <p>Speel je zelf, of programmeer je een zaal of comedyclub? Binnenkort kun je hier je voorstellingen aanmelden of je speellijst koppelen.</p>
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

  return {
    home, agendaIndex, agendaMaand, plaatsIndex, plaatsPagina, artistIndex, cabaretiersPagina, artistPage, theaterIndex, theaterPage, about, notFound,
    voorstellingPagina, festivalIndex, festivalPagina, maanden, plaatsen, plaatsId, maandId, voorstellingPaden: voorstellingPad,
  };
}
