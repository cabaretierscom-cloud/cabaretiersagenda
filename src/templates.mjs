// HTML-templates. Elke functie geeft een string terug; build.mjs schrijft ze weg.
import { LANDEN, STATUSSEN, GENRES, KLEUREN } from "./data.mjs";
import { fmt, esc, plural, isoWithOffset } from "./format.mjs";

export const SITE = {
  name: "Cabaretiers.com",
  url: "https://www.cabaretiers.com",
  description: "De cabaretagenda van Nederland en België: alle aankomende cabaret- en comedyvoorstellingen, theaters en artiesten op één plek.",
};

const ICON = {
  sold: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M6 18L18 6"/></svg>',
  doubt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.01"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
};

export const LOGO_SVG = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="#FF4FA3"/><path d="M33.5 15.2A13 13 0 1 0 33.5 32.8" fill="none" stroke="#000" stroke-width="7" stroke-linecap="round"/><circle cx="33.6" cy="24" r="4.6" fill="#000"/><circle cx="33.6" cy="24" r="1.7" fill="#FF4FA3"/></svg>`;

const ink = (kleur) => {
  const [v, fg] = KLEUREN[kleur];
  return `--bg:var(${v});--fg:${fg}`;
};

export function createTemplates(db) {
  const { artiesten: A, theaters: T, voorstellingen: V } = db;

  const artistNames = (vid) => V.get(vid).artiesten.map((a) => A.get(a).naam).join(" & ");
  const leadInk = (vid) => A.get(V.get(vid).artiesten[0]).kleur;
  const artistLinks = (vid) =>
    V.get(vid).artiesten.map((a) => `<a href="/artiesten/${a}/">${esc(A.get(a).naam)}</a>`).join(" &amp; ");

  function layout({ title, description = SITE.description, path, section, body, jsonLd }) {
    const nav = [
      ["agenda", "/", "Agenda"],
      ["artiesten", "/artiesten/", "Artiesten"],
      ["theaters", "/theaters/", "Theaters"],
      ["over", "/over/", "Over"],
    ].map(([key, href, label]) =>
      `<a href="${href}"${key === section ? ' aria-current="page"' : ""}>${label}</a>`).join("");
    const fullTitle = title ? `${title} | ${SITE.name}` : `${SITE.name}: de cabaretagenda van Nederland en België`;
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
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE.url}${path}">
<meta property="og:locale" content="nl_NL">
<meta name="theme-color" content="#FF4FA3">
<link rel="icon" href="/logo.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/big-shoulders-display-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : ""}
</head>
<body>
<a class="skip" href="#main">Naar de inhoud</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/" aria-label="${SITE.name}, naar de agenda">
      <span class="brand-mark" aria-hidden="true">${LOGO_SVG}</span>
      <span class="wordmark">cabaretiers<span>.com</span></span>
    </a>
    <nav class="nav" aria-label="Hoofdmenu">${nav}</nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer>
  <div class="wrap">
    <p><strong>cabaretiers.com</strong>. De cabaretagenda van Nederland en België.</p>
    <p>Speeldata verzameld uit openbare speellijsten${db.lastFetched ? `, laatst bijgewerkt op ${fmt.full(db.lastFetched)}` : ""}. Wijzigingen voorbehouden; controleer altijd bij het theater.</p>
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
          <span class="show">${esc(v.titel)}${g.soort ? ` <span class="pill">${esc(g.soort)}</span>` : ""}</span>
        </div>
      </div>
      <div class="venue">${showVenue ? `<a href="/theaters/${t.id}/">${esc(t.naam)}</a><span>${esc(t.plaats)}, ${LANDEN[t.land]}</span>` : `<span>${esc(GENRES[v.genre])}</span>`}</div>
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

  function eventLd(g) {
    const v = V.get(g.voorstelling), t = T.get(g.theater);
    const status = { geannuleerd: "EventCancelled", verplaatst: "EventPostponed" }[g.status] || "EventScheduled";
    return {
      "@type": "Event",
      name: `${artistNames(g.voorstelling)}: ${v.titel}`,
      startDate: isoWithOffset(g.datum, g.tijd),
      eventStatus: `https://schema.org/${status}`,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: t.naam,
        address: { "@type": "PostalAddress", addressLocality: t.plaats, addressCountry: t.land },
      },
      performer: v.artiesten.map((a) => ({ "@type": "Person", name: A.get(a).naam })),
      url: g.bron,
    };
  }
  const eventsLd = (list) => ({ "@context": "https://schema.org", "@graph": list.slice(0, 100).map(eventLd) });

  // ---------- Pagina's ----------

  // Lange titels kleiner zetten zodat ze verticaal op de affiche passen.
  const titleClass = (titel) => {
    const longestWord = Math.max(...titel.split(/\s+/).map((w) => w.length));
    return longestWord > 13 ? " xlong" : titel.length > 10 ? " long" : "";
  };

  function home() {
    const seen = new Set();
    const posterGigs = db.upcoming.filter((g) => !seen.has(g.voorstelling) && seen.add(g.voorstelling)).slice(0, 10);
    const spots = [["78%", "26%"], ["30%", "70%"], ["85%", "80%"], ["20%", "20%"], ["60%", "50%"]];
    const posters = posterGigs.map((g, i) => {
      const v = V.get(g.voorstelling), t = T.get(g.theater);
      const [sx, sy] = spots[i % spots.length];
      const tag = g.status === "uitverkocht" ? "Uitverkocht" : g.soort ? g.soort[0].toUpperCase() + g.soort.slice(1) : "";
      const thisYear = fmt.year(db.today);
      return `<a class="poster${i === 0 ? " featured" : ""}" href="/artiesten/${v.artiesten[0]}/" style="${ink(leadInk(g.voorstelling))};--sx:${sx};--sy:${sy}" data-datum="${g.datum}">
        <span class="visually-hidden">${esc(artistNames(g.voorstelling))}, ${esc(v.titel)}, ${fmt.long(g.datum)} in ${esc(t.naam)}, ${esc(t.plaats)}</span>
        <div class="when" aria-hidden="true">
          <span class="weekday">${i === 0 ? "Eerstvolgende" : fmt.weekday(g.datum)}</span>
          <span class="day">${fmt.day(g.datum)}</span>
          <span class="month">${fmt.monthShort(g.datum)}${fmt.year(g.datum) !== thisYear ? " " + fmt.year(g.datum) : ""}</span>
        </div>
        <span class="vtitle${titleClass(v.titel)}" aria-hidden="true">${esc(v.titel)}</span>
        <div class="who" aria-hidden="true">
          <strong>${esc(artistNames(g.voorstelling))}</strong>
          <span class="where">${esc(t.naam)}${t.naam.includes(t.plaats) ? "" : "<br>" + esc(t.plaats)}</span>
          ${tag ? `<span class="tag">${esc(tag)}</span>` : ""}
        </div>
      </a>`;
    }).join("");

    const months = [...new Set(db.upcoming.map((g) => g.datum.slice(0, 7)))];
    const cities = [...new Set(db.upcoming.map((g) => T.get(g.theater).plaats))].sort((a, b) => a.localeCompare(b, "nl"));
    const genres = [...new Set(db.upcoming.map((g) => V.get(g.voorstelling).genre))].sort();

    const body = `
<section class="wall" aria-labelledby="wall-title">
  <div class="wrap wall-head">
    <h1 id="wall-title">Binnenkort op de planken</h1>
    <p>Cabaret en comedy in Nederland en België, van open mic tot oudejaarsconference.</p>
  </div>
  <div class="strip-wrap">
    <div class="strip" id="strip" tabindex="0" aria-label="Eerstvolgende voorstellingen">${posters}</div>
    <div class="strip-nav" hidden>
      <button type="button" id="strip-prev" aria-label="Vorige voorstellingen">${ICON.prev}</button>
      <button type="button" id="strip-next" aria-label="Volgende voorstellingen">${ICON.next}</button>
    </div>
  </div>
</section>

<section class="block wrap" id="agenda" aria-labelledby="agenda-title">
  <div class="block-head">
    <h2 id="agenda-title">Speellijst</h2>
    <p>${plural(db.upcoming.length, "voorstelling", "voorstellingen")} in ${plural(new Set(db.upcoming.map((g) => g.theater)).size, "zaal", "zalen")}</p>
  </div>
  <form class="filters" id="filters" role="search" aria-label="Voorstellingen filteren" hidden>
    <div class="field search">
      <label for="f-q">Zoek op artiest, voorstelling of zaal</label>
      <input id="f-q" name="q" type="search" autocomplete="off" placeholder="Bijvoorbeeld: Carré of oudejaars">
    </div>
    <div class="field country">
      <span class="label" id="f-land-label">Land</span>
      <div class="chips" role="group" aria-labelledby="f-land-label">
        <button type="button" class="chip" data-land="" aria-pressed="true">Alles</button>
        <button type="button" class="chip" data-land="NL" aria-pressed="false">Nederland</button>
        <button type="button" class="chip" data-land="BE" aria-pressed="false">België</button>
      </div>
    </div>
    <div class="field">
      <label for="f-maand">Maand</label>
      <select id="f-maand" name="maand"><option value="">Alle maanden</option>${months.map((m) => `<option value="${m}">${fmt.monthYear(m + "-01")}</option>`).join("")}</select>
    </div>
    <div class="field">
      <label for="f-plaats">Plaats</label>
      <select id="f-plaats" name="plaats"><option value="">Alle plaatsen</option>${cities.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}</select>
    </div>
    <div class="field">
      <label for="f-genre">Soort</label>
      <select id="f-genre" name="genre"><option value="">Alle soorten</option>${genres.map((g) => `<option value="${g}">${GENRES[g]}</option>`).join("")}</select>
    </div>
  </form>
  <p class="result-line" id="result-line" aria-live="polite"></p>
  <div id="gigs">${monthGroups(db.upcoming)}</div>
  <div class="empty" id="empty" hidden>
    <p>Geen voorstellingen die aan deze filters voldoen.</p>
    <button type="button" class="btn ghost" id="reset">Filters wissen</button>
  </div>
</section>`;
    return layout({ path: "/", section: "agenda", body, jsonLd: eventsLd(db.upcoming) });
  }

  function artistIndex() {
    const cards = [...A.values()]
      .map((a) => ({ a, list: db.gigsForArtist(a.id) }))
      .filter((x) => x.list.length)
      .sort((x, y) => x.list[0].datum.localeCompare(y.list[0].datum))
      .map(({ a, list }) => {
        const titles = [...new Set(list.map((g) => V.get(g.voorstelling).titel))].join(", ");
        return `<a class="artist-card" href="/artiesten/${a.id}/" style="${ink(a.kleur)}">
          <h3>${esc(a.naam)}</h3>
          <p>${esc(titles)}<br><span class="count">${plural(list.length, "speeldatum", "speeldata")}</span>, vanaf ${fmt.dayMonth(list[0].datum)}</p>
        </a>`;
      }).join("");
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Artiesten</h1><p>Gesorteerd op eerstvolgende speeldatum.</p></div>
      <div class="artists">${cards}</div>
    </section>`;
    return layout({ title: "Artiesten", description: "Alle cabaretiers en comedians met aankomende voorstellingen in Nederland en België.", path: "/artiesten/", section: "artiesten", body });
  }

  function artistPage(a) {
    const list = db.gigsForArtist(a.id);
    const titles = [...new Set(list.map((g) => V.get(g.voorstelling).titel))];
    const partners = [...new Set(list.flatMap((g) => V.get(g.voorstelling).artiesten))].filter((x) => x !== a.id);
    const cityCount = new Set(list.map((g) => T.get(g.theater).plaats)).size;
    const summary = list.length
      ? `${plural(list.length, "speeldatum", "speeldata")} in ${plural(cityCount, "plaats", "plaatsen")}${partners.length ? `, samen met ${partners.map((p) => `<a href="/artiesten/${p}/">${esc(A.get(p).naam)}</a>`).join(" en ")}` : ""}.`
      : "Op dit moment staan er geen voorstellingen gepland.";
    const body = `<div class="detail-hero" style="${ink(a.kleur)}"><div class="wrap">
        <a class="back" href="/artiesten/">${ICON.back}Alle artiesten</a>
        <h1>${esc(a.naam)}</h1>
        <p>${summary}</p>
      </div></div>
      <div class="wrap detail-body">
        ${titles.length ? `<div class="shows-list">${titles.map((t) => `<span class="pill">${esc(t)}</span>`).join("")}</div>` : ""}
        ${monthGroups(list, { showArtist: false })}
      </div>`;
    const desc = list.length
      ? `Alle speeldata van ${a.naam}: ${titles.join(", ")}. Eerstvolgende voorstelling op ${fmt.full(list[0].datum)}.`
      : `${a.naam} op Cabaretiers.com.`;
    return layout({ title: `${a.naam} speellijst`, description: desc, path: `/artiesten/${a.id}/`, section: "artiesten", body, jsonLd: list.length ? eventsLd(list) : null });
  }

  function theaterIndex() {
    const cols = Object.keys(LANDEN).map((land) => {
      const items = [...T.values()].filter((t) => t.land === land)
        .sort((a, b) => a.plaats.localeCompare(b.plaats, "nl") || a.naam.localeCompare(b.naam, "nl"));
      return `<div><h2>${LANDEN[land]}</h2><ul class="venue-list">${items.map((t) => {
        const n = db.gigsForTheater(t.id).length;
        return `<li><a href="/theaters/${t.id}/"><span><span class="vn">${esc(t.naam)}</span><span class="vc">${esc(t.plaats)}</span></span><span class="vk">${plural(n, "voorstelling", "voorstellingen")}</span></a></li>`;
      }).join("")}</ul></div>`;
    }).join("");
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Theaters</h1><p>Zalen, comedyclubs en podia met aankomende voorstellingen.</p></div>
      <div class="venues">${cols}</div>
    </section>`;
    return layout({ title: "Theaters", description: "Theaters, comedyclubs en podia in Nederland en België met cabaret en comedy.", path: "/theaters/", section: "theaters", body });
  }

  function theaterPage(t) {
    const list = db.gigsForTheater(t.id);
    const body = `<div class="detail-hero" style="--bg:var(--riso-blue);--fg:#FFF"><div class="wrap">
        <a class="back" href="/theaters/">${ICON.back}Alle theaters</a>
        <h1>${esc(t.naam)}</h1>
        <p>${esc(t.plaats)}, ${LANDEN[t.land]}. ${list.length ? `${plural(list.length, "aankomende voorstelling", "aankomende voorstellingen")}.` : "Op dit moment staan er geen voorstellingen gepland."}${t.website ? ` <a href="${esc(t.website)}" rel="noopener">Website van het theater</a>` : ""}</p>
      </div></div>
      <div class="wrap detail-body">${monthGroups(list, { showVenue: false })}</div>`;
    return layout({ title: `${t.naam}, ${t.plaats}`, description: `Cabaret en comedy in ${t.naam} (${t.plaats}): alle aankomende voorstellingen.`, path: `/theaters/${t.id}/`, section: "theaters", body, jsonLd: list.length ? eventsLd(list) : null });
  }

  function about() {
    const body = `<section class="block wrap" aria-labelledby="t">
      <div class="block-head"><h1 id="t">Over de agenda</h1></div>
      <div class="about">
        <div class="prose">
          <p>Cabaretiers.com verzamelt alle aankomende cabaret- en comedyvoorstellingen in Nederland en België: theatercabaret, stand-up in comedyclubs en cafés, festivals en open mics. Je ziet per avond wie waar speelt, en per artiest of zaal de volledige speellijst.</p>
          <p>Elke speeldatum heeft een bron. Klik op <em>Bron</em> om de datum bij het theater of de artiest te controleren voordat je kaarten koopt. Datums waarover bronnen elkaar tegenspreken, staan gemarkeerd als <em>datum onzeker</em>.</p>
          <h2 id="aanmelden">Zelf voorstellingen aanmelden</h2>
          <p>Speel je zelf, of programmeer je een zaal of comedyclub? Binnenkort kun je hier je voorstellingen aanmelden of je speellijst koppelen.</p>
        </div>
        <ol class="steps">
          <li><div><b>Speellijsten ophalen</b><span>Elke nacht lezen we de agenda's van theaters, comedyclubs, impresariaten en artiesten uit.</span></div></li>
          <li><div><b>Samenvoegen en controleren</b><span>Dezelfde avond uit twee bronnen wordt één voorstelling. Verschillen worden gemarkeerd.</span></div></li>
          <li><div><b>Publiceren</b><span>Nieuwe data staan de volgende ochtend in de agenda, met een link naar de bron.</span></div></li>
        </ol>
      </div>
    </section>`;
    return layout({ title: "Over de agenda", path: "/over/", section: "over", body });
  }

  function notFound() {
    const body = `<section class="block wrap"><div class="block-head"><h1>Deze pagina bestaat niet</h1></div>
      <p>Misschien is de voorstelling al geweest of is de link veranderd.</p>
      <p><a class="btn" href="/">Naar de agenda</a></p></section>`;
    return layout({ title: "Pagina niet gevonden", path: "/404.html", section: null, body });
  }

  return { home, artistIndex, artistPage, theaterIndex, theaterPage, about, notFound };
}
