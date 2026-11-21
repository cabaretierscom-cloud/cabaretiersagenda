// Losse voorstellingspagina's van zalen, voor met de hand gekozen voorstellingen die geen bruikbare speellijst hebben
// en die de theaterbronnen niet opnemen (toneel valt daar weg). Per pagina de JSON-LD-evenementen (startDate); zonder
// JSON-LD de eerste datum met jaartal ("dinsdag 16 februari 2027") en tijd ("20:00 uur") in de tekst. Alleen pagina's
// die we mogen lezen: zalen die bots weigeren (403, Cloudflare) staan er niet in. Werkt als een speellijst.
import { getText } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";

const VOORSTELLINGEN = [
  {
    // Eigenaar van Cabaretiers.com, november 2026: toneel (voorstelling-correcties.json). Producent SENF Producties
    // (senf.nl/productie/hetuurvandewaarheid/, zonder speellijst; kaarten via ntk.nl, dat bots weigert, net als hnt.nl,
    // Stadsschouwburg Haarlem, de Rijswijkse Schouwburg en Agnietenhof).
    artiesten: ["Stefan de Walle", "Daniël Kolf", "Donny Ronny"],
    titel: "Het uur van de waarheid",
    genre: "toneel",
    paginas: [
      { url: "https://stadsschouwburg-utrecht.nl/agenda/seizoen-2026-2027/het-uur-van-de-waarheid-senf-producties", zaal: "Stadsschouwburg Utrecht", plaats: "Utrecht" },
      { url: "https://www.schouwburgconcertzaaltilburg.nl/agenda/het-uur-van-de-waarheid-stefan-de-walle-ea", zaal: "Schouwburg Tilburg", plaats: "Tilburg" },
      { url: "https://www.spotgroningen.nl/programma/stefan-de-walle-donny-ronny-etc/", zaal: "Stadsschouwburg Groningen", plaats: "Groningen" },
      { url: "https://www.schouwburglochem.nl/voorstelling/het-uur-van-de-waarheid/", zaal: "Schouwburg Lochem", plaats: "Lochem" },
    ],
  },
];

const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

function jsonLdEvents(html) {
  const uit = [];
  for (const [, blok] of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    let d;
    try { d = JSON.parse(blok); } catch { continue; }
    for (const x of [].concat(d?.["@graph"] || d)) if (x && /Event/.test(String(x["@type"])) && x.startDate) uit.push(x);
  }
  return uit;
}

// Uitverkocht alleen als elke rang uitverkocht is (SPOT zet per rang een eigen aanbod).
function uitverkocht(offers) {
  const lijst = [].concat(offers || []).filter((o) => o && o.availability);
  return lijst.length > 0 && lijst.every((o) => /SoldOut/.test(o.availability));
}

function uitTekst(html) {
  const t = decodeEntities(stripTags(html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " "))).replace(/\s+/g, " ");
  const m = t.match(new RegExp(`\\b(\\d{1,2}) (${MAANDEN.join("|")}) (20\\d\\d)\\b`, "i"));
  if (!m) return [];
  const tijd = t.slice(m.index, m.index + 200).match(/\b(\d{1,2}):(\d{2})\b/);
  return [{ datum: `${m[3]}-${String(MAANDEN.indexOf(m[2].toLowerCase()) + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`, tijd: tijd ? `${tijd[1].padStart(2, "0")}:${tijd[2]}` : null }];
}

export default {
  id: "losse-paginas",
  naam: "Losse voorstellingspagina's",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const out = [];
    for (const v of VOORSTELLINGEN) {
      let n = 0;
      for (const p of v.paginas) {
        let html;
        try { html = await getText(p.url); } catch (e) { log(`${p.zaal}: ${e.message}`); continue; }
        const ld = jsonLdEvents(html).map((e) => ({ datum: e.startDate.slice(0, 10), tijd: /T\d{2}:\d{2}/.test(e.startDate) ? e.startDate.slice(11, 16) : null, status: /Cancelled/.test(e.eventStatus || "") ? "geannuleerd" : uitverkocht(e.offers) ? "uitverkocht" : "gepland" }));
        for (const a of ld.length ? ld : uitTekst(html)) {
          if (a.datum < vandaag) continue;
          out.push({
            theater: { zoeken: true, naam: p.zaal, plaats: p.plaats, land: "NL" },
            artiesten: v.artiesten,
            titel: v.titel,
            genre: v.genre,
            datum: a.datum,
            tijd: a.tijd === "00:00" ? null : a.tijd,
            status: a.status || "gepland",
            soort: null,
            bron: p.url,
          });
          n++;
        }
      }
      log(`${v.titel}: ${n} voorstellingen vanaf vandaag`);
    }
    return out;
  },
};
