// Speellijst van Grof Geschud (grofgeschud.eu, tot november 2026 grofgeschud.nl). De homepage toont onder
// "AGENDA" de eerste tien avonden; de knop "Toon meer" haalt de volgende tien op met een formulier naar
// /wp-admin/admin-ajax.php (actie meloo_load_more, met de nonce en de filtergegevens uit de pagina), zoals de site
// zelf doet; robots.txt staat admin-ajax.php toe. Per avond een <article>: dag, maand, jaar, "Zaal – Plaats",
// "VIEREN - Full Try Out/Avant Première/Première/Extra voorstelling", status (Uitverkocht, Laatste tickets, Koop
// tickets, Binnenkort beschikbaar) en een kaartlink; het land staat in de class (meloo_events_cats-belgie of
// -nederland). Geen tijden. Werkt als een speellijst (soort "speellijst").
import { getText, postForm } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";

const SITE = "https://www.grofgeschud.eu/";
const AJAX = SITE + "wp-admin/admin-ajax.php";
const TITEL = "Vieren";
const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const PLAATSEN = { "Den Bosch": "'s-Hertogenbosch" };
const tekst = (s) => decodeEntities(stripTags(s || "")).replace(/[\s ]+/g, " ").trim();

// Een genest object zoals jQuery het in een formulier zet: filter[taxonomies][x][ids]=…
function velden(obj, voor, uit = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const naam = voor ? `${voor}[${k}]` : k;
    if (v && typeof v === "object") velden(v, naam, uit);
    else uit[naam] = v ?? "";
  }
  return uit;
}

function avonden(html, vandaag) {
  const out = [];
  for (const [, klasse, blok] of html.matchAll(/<article class="([^"]*meloo_events[^"]*)">([\s\S]*?)<\/article>/g)) {
    if (!/future-events/.test(klasse)) continue;
    const cel = (c) => tekst(blok.match(new RegExp(`class="${c}">([\\s\\S]*?)<\\/div>`))?.[1]);
    const dag = cel("day-event"), m = MAANDEN.indexOf(cel("month-event").toLowerCase()), jaar = cel("year-event");
    if (!/^\d{1,2}$/.test(dag) || m < 0 || !/^\d{4}$/.test(jaar)) continue;
    const datum = `${jaar}-${String(m + 1).padStart(2, "0")}-${dag.padStart(2, "0")}`;
    if (datum < vandaag) continue;
    // "CC Het Gasthuis – Aarschot"; zonder zaal ("CC – Evergem") is de plaats de naam.
    const [zaal, plaats] = cel("event-name").split(/\s+[–-]\s+/).map((x) => x.trim());
    if (!plaats) continue;
    const naam = /^(cc|gc)$/i.test(zaal) ? `${zaal.toUpperCase()} ${plaats}` : zaal;
    const avond = cel("city-name");
    const status = tekst(blok.match(/class="line-link"[^>]*>([\s\S]*?)<\/a>/)?.[1]);
    const link = decodeEntities(blok.match(/href="([^"]+)"/)?.[1] || "");
    out.push({
      theater: { zoeken: true, naam, plaats: PLAATSEN[plaats] || plaats, land: /cats-nederland/.test(klasse) ? "NL" : "BE" },
      artiesten: ["Grof Geschud"],
      titel: TITEL,
      genre: "cabaret",
      datum,
      tijd: null,
      status: /uitverkocht/i.test(status) ? "uitverkocht" : /geannuleerd|afgelast/i.test(status) ? "geannuleerd" : "gepland",
      // Een avant-première is een voorpremière: een try-out.
      soort: /avant|try.?out/i.test(avond) ? "try-out" : /premi[eè]re/i.test(avond) ? "première" : /extra/i.test(avond) ? "extra voorstelling" : null,
      bron: /^https?:\/\//.test(link) ? link : SITE,
    });
  }
  return out;
}

export default {
  id: "grofgeschud",
  naam: "Speellijst van Grof Geschud",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const html = await getText(SITE);
    const out = avonden(html, vandaag);
    const nonce = html.match(/var ajax_action = \{[^}]*"ajax_nonce":"([^"]+)"/)?.[1];
    const blok = html.match(/<div class="ajax-grid-block[^"]*"[^>]*data-opts='([^']*)' data-filter='([^']*)'/);
    const module = html.match(/data-module-opts='([^']*)'/)?.[1];
    if (!nonce || !blok || !module) throw new Error("agenda of 'Toon meer'-gegevens niet gevonden");
    const [opts, filter, moduleOpts] = [JSON.parse(decodeEntities(blok[1])), JSON.parse(decodeEntities(blok[2])), JSON.parse(decodeEntities(module))];
    for (let pagina = 2; pagina <= 20; pagina++) {
      const res = (await postForm(AJAX, velden({ action: opts.action, ajax_nonce: nonce, opts: { ...opts, paged: pagina }, filter, module_opts: moduleOpts }), { headers: { "x-requested-with": "XMLHttpRequest" } })).text;
      const nieuw = avonden(res, vandaag);
      if (!nieuw.length) break;
      out.push(...nieuw);
    }
    log(`${out.length} voorstellingen vanaf vandaag`);
    return out;
  },
};
