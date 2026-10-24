// Hulpjes om gegevens uit HTML te halen zonder externe pakketten.
import { getText } from "./http.mjs";

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", eacute: "é", euml: "ë", iuml: "ï", ouml: "ö", uuml: "ü", egrave: "è", agrave: "à", ccedil: "ç", oacute: "ó", aacute: "á", iacute: "í", uacute: "ú", acirc: "â", ecirc: "ê", ocirc: "ô", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", bdquo: "„", middot: "·", bull: "•", raquo: "»", laquo: "«", rarr: "→", euro: "€" };
export const decodeEntities = (s) =>
  String(s ?? "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);

export const stripTags = (s) => decodeEntities(String(s ?? "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

// Alle schema.org-objecten uit <script type="application/ld+json">, platgeslagen (ook @graph).
export function jsonLd(html) {
  const out = [];
  const walk = (o) => {
    if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === "object") {
      if (o["@graph"]) walk(o["@graph"]);
      if (o["@type"]) out.push(o);
    }
  };
  for (const m of html.matchAll(/<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { walk(JSON.parse(m[1].trim())); } catch { /* kapotte JSON-LD overslaan */ }
  }
  return out;
}

const EVENT_TYPES = /^(Event|TheaterEvent|ComedyEvent|MusicEvent|DanceEvent|Festival)$/;
export const isEvent = (o) => [].concat(o["@type"]).some((t) => EVENT_TYPES.test(t));

// Alle <loc>-adressen uit een sitemap; volgt sitemap-indexen.
export async function sitemapUrls(url, { filter = () => true, seen = new Set() } = {}) {
  if (seen.has(url)) return [];
  seen.add(url);
  const xml = await getText(url);
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => decodeEntities(m[1]));
  if (/<sitemapindex/i.test(xml)) {
    const nested = [];
    for (const loc of locs) nested.push(...(await sitemapUrls(loc, { filter, seen })));
    return nested;
  }
  return locs.filter(filter);
}

// Next.js (app router) zet de paginagegevens in stukjes: self.__next_f.push([1,"..."]).
// Dit plakt ze aan elkaar tot één tekst.
export function nextFlightText(html) {
  return [...html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)]
    .map((m) => { try { return JSON.parse(`"${m[1]}"`); } catch { return ""; } })
    .join("");
}

// Alle JSON-objecten in een tekst die `marker` bevatten (bijv. '"__typename":"Production"'),
// van de eerste { ervoor tot de bijbehorende }.
export function jsonObjectsWith(text, marker) {
  const out = [];
  for (let from = 0; ; ) {
    const i = text.indexOf(marker, from);
    if (i < 0) return out;
    from = i + marker.length;
    const start = text.lastIndexOf("{", i);
    let depth = 0, inStr = false, esc = false;
    for (let k = start; k < text.length; k++) {
      const c = text[k];
      if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
      if (c === '"') inStr = true;
      else if (c === "{") depth++;
      else if (c === "}" && --depth === 0) {
        try { out.push(JSON.parse(text.slice(start, k + 1))); } catch { /* geen geldig object */ }
        break;
      }
    }
  }
}
