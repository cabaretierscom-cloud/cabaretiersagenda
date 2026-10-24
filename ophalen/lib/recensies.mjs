// Recensies (krant, sterren, citaat) van een voorstellingspagina van een theater.
// Elke site zet ze anders neer; hieronder per opmaak een herkenner. Ze letten op eigen
// klassenamen, dus op een andere site doen ze niets. Plus een herkenner voor platte tekst
// ("'Citaat' – de Volkskrant ★★★★"), die alleen bekende kranten en tijdschriften aanneemt.
// Een recensie over een andere voorstelling ("De Volkskrant over Team Solo") krijgt `over`.
import { stripTags, decodeEntities } from "./html.mjs";

// Bekende media: zoekwoord -> nette naam. Zo worden "Volkskrant" en "de Volkskrant" één.
const MEDIA = [
  [/^(de\s+)?vol(ks|s|k)?kr?ant$/i, "de Volkskrant"],
  [/^nrc(\s+handelsblad|\s+next)?$/i, "NRC"],
  [/^(het\s+)?parool(,.*)?$/i, "Het Parool"],
  [/^trouw$/i, "Trouw"],
  [/^(de\s+)?telegraaf$/i, "De Telegraaf"],
  [/^(ad|algemeen dagblad)$/i, "AD"],
  [/^(de\s+)?theaterkrant$/i, "Theaterkrant"],
  [/^8\s?weekly$/i, "8WEEKLY"],
  [/^cultuurpers$/i, "Cultuurpers"],
  [/^(het\s+)?dagblad van het noorden$/i, "Dagblad van het Noorden"],
  [/^(de\s+)?leeuwarder courant$/i, "Leeuwarder Courant"],
  [/^(de\s+)?stentor$/i, "De Stentor"],
  [/^tubantia$/i, "Tubantia"],
  [/^(het\s+)?brabants dagblad$/i, "Brabants Dagblad"],
  [/^(het\s+)?eindhovens dagblad$/i, "Eindhovens Dagblad"],
  [/^(de\s+)?gelderlander$/i, "De Gelderlander"],
  [/^bn\s?de\s?stem$/i, "BN DeStem"],
  [/^pzc$/i, "PZC"],
  [/^(de\s+)?limburger$/i, "De Limburger"],
  [/^(het\s+)?noordhollands dagblad$/i, "Noordhollands Dagblad"],
  [/^(het\s+)?haarlems dagblad$/i, "Haarlems Dagblad"],
  [/^(het\s+)?leidsch dagblad$/i, "Leidsch Dagblad"],
  [/^(het\s+)?friesch dagblad$/i, "Friesch Dagblad"],
  [/^vpro\s?gids$/i, "VPRO Gids"],
  [/^(de\s+)?morgen$/i, "De Morgen"],
  [/^(de\s+)?standaard$/i, "De Standaard"],
  [/^(het\s+)?nieuwsblad$/i, "Het Nieuwsblad"],
  [/^(het\s+)?laatste nieuws|hln$/i, "Het Laatste Nieuws"],
  [/^gazet van antwerpen$/i, "Gazet van Antwerpen"],
  [/^knack( focus)?$/i, "Knack"],
  [/^humo$/i, "Humo"],
  [/^i\s?love\s?theater$/i, "I Love Theater"],
  [/^theater\s?paradijs$/i, "Theaterparadijs"],
  [/^sc[eè]nes$/i, "Scènes"],
  [/^(het\s+)?financieele dagblad|fd$/i, "Het Financieele Dagblad"],
];
const bekendMedium = (s) => MEDIA.find(([re]) => re.test(s))?.[1] || null;

const CITAAT_TEKENS = /^[\s"'“”‘’„«»]+|[\s"'“”‘’„«»]+$/g;

// Benoemde tekens die decodeEntities() niet kent ("&ldquo;", "&oacute;").
const TEKENS = { ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", bdquo: "„", hellip: "…", ndash: "–", mdash: "—", nbsp: " ",
  eacute: "é", egrave: "è", euml: "ë", oacute: "ó", ouml: "ö", aacute: "á", agrave: "à", iuml: "ï", uuml: "ü", ccedil: "ç" };
const tekst = (s) => decodeEntities(stripTags(s)).replace(/&([a-z]+);/gi, (m, n) => TEKENS[n.toLowerCase()] ?? m);

// Ook gebruikt door samenvoegen.mjs, zodat eerder opgehaalde recensies dezelfde schoonmaak krijgen.
export function recensie(medium, citaat, sterren) {
  // "Theaterkrant (keuze van de criticus)" -> "Theaterkrant"
  const m = tekst(medium).replace(/\s*\([^)]*\)\s*$/, "").replace(/[:.,\s]+$/, "").trim();
  // Sommige sites coderen tekens dubbel ("&amp;ldquo;"); tekst() decodeert daarom nog een keer.
  let c = tekst(citaat);
  // Sterren achter het citaat ("… mindfuck.” ★★★★★") horen in het sterrenveld.
  const achter = c.match(/\s*(★{1,5})\s*$/);
  if (achter) { c = c.slice(0, achter.index); if (sterren == null || !Number(sterren)) sterren = achter[1].length; }
  c = c.replace(/\s*[-–—]\s*$/, "").replace(CITAAT_TEKENS, "").trim();
  if (!m || m.length > 50 || /publiek|bezoeker|recensent$|jury/i.test(m)) return null;
  if (c.length < 15 || c.length > 600) return null;
  // "Zijn vorige programma 'Marmer' was ..." gaat niet over deze voorstelling.
  if (/\bvorige (voorstelling|programma|show|solo)\b/i.test(c)) return null;
  const s = Number(sterren);
  // "De Volkskrant over Team Solo": een recensie van een andere voorstelling. We bewaren hem met `over`,
  // zodat samenvoegen.mjs hetzelfde citaat ook op andere theaterpagina's kan weren.
  const [, naam, over] = m.match(/^(.*?)\s+over\s+(.+)$/i) || [, m, null];
  return { medium: bekendMedium(naam) || naam, sterren: Number.isInteger(s) && s >= 1 && s <= 5 ? s : null, citaat: c, ...(over ? { over } : {}) };
}

// Het stuk HTML vanaf elk begin van een recensieblok tot het volgende.
const blokken = (html, begin) => html.split(begin).slice(1);
const tel = (s, re) => (s.match(re) || []).length;
const eerste = (s, re) => s.match(re)?.[1] || "";

const HERKENNERS = [
  // Leidse Schouwburg: sterren als breedte ("width: 80%" = 4 van 5).
  (h) => blokken(h, /<li class="review-slider__item/).map((b) =>
    recensie(eerste(b, /review-slider__author">([\s\S]*?)<\/div>/), eerste(b, /review-slider__text">([\s\S]*?)<\/h3>/),
      Math.round(Number(eerste(b, /review-slider__stars" style="width:\s*(\d+)%/)) / 20))),
  // Peppered (Zwolse Theaters): <component is="quote" :model="{items:[{text, stars, source:{author}}]}">
  (h) => [...h.matchAll(/<component is="quote" :model="([^"]*)"/g)].flatMap((m) => {
    try { return JSON.parse(decodeEntities(m[1])).items.map((i) => recensie(i.source?.author || "", i.text || "", i.stars)); } catch { return []; }
  }),
  // De Nieuwe Kolk: <figure><blockquote>…</blockquote><cite>NRC</cite> aria-label="Beoordeling: 5 van de 5 sterren"
  (h) => blokken(h, /<figure[^>]*>\s*<blockquote/).map((b) =>
    recensie(eerste(b, /<cite[^>]*>([\s\S]*?)<\/cite>/), eerste(b, /^[^>]*>([\s\S]*?)<\/blockquote>/), eerste(b, /Beoordeling:\s*(\d)\s+van de 5/))),
  // Kunstlinie: sterren als losse plaatjes star.svg.
  (h) => (h.split(/<section class="reviews-block/)[1] || "").split(/<div class="slide"/).slice(1).map((b) =>
    recensie(eerste(b, /<p class="small[^"]*bold">([\s\S]*?)<\/p>/), eerste(b, /<h6[^>]*>([\s\S]*?)<\/h6>/), tel(b, /star\.svg/g))),
  // Stadsschouwburg Utrecht en Tilburg: testimonial met quote, quote-name en ster-icoontjes.
  (h) => blokken(h, /class="[^"]*\btestimonial(?:\s[^"]*)?"/).map((b) =>
    recensie(eerste(b, /class="quote-name[^"]*">([\s\S]*?)<\/span>/), eerste(b, /class="quote(?:\s[^"]*)?">([\s\S]*?)<\/(?:p|h\d)>/),
      tel(b.split(/class="[^"]*\btestimonial/)[0], /icon-(?:Ster|star)"/g))),
  // Musis en Stadstheater Arnhem: "De Volkskrant" (of "De Volkskrant over …": overslaan).
  // Sterren als breedte in pixels, 20 per ster; een halve ster nemen we niet over.
  (h) => blokken(h, /class="review-item/).map((b) => {
    const px = Number(eerste(b, /class="rating[^"]*" style="width:\s*(\d+)px/));
    return recensie(eerste(b, /<h4[^>]*>([\s\S]*?)<\/h4>/), eerste(b, /review-quote[^"]*">([\s\S]*?)<\/p>/), px % 20 ? null : px / 20);
  }),
  // Zaantheater: <blockquote class="production-review"><cite>…</cite> fa-star …
  (h) => blokken(h, /<blockquote class="production-review"/).map((b) =>
    recensie(eerste(b, /production-cite">([\s\S]*?)<\/cite>/), eerste(b, /<div><p>([\s\S]*?)<\/p>/), tel(b.split("</blockquote>")[0], /fa-star"/g))),
  // DeLaMar: <div class="production__review"><blockquote>…</blockquote><div><svg>…</div><p>Medium</p>
  (h) => blokken(h, /<div class="production__review">/).map((b) => {
    const blok = b.split(/<\/p>/)[0];
    return recensie(eerste(blok, /<p>([\s\S]*)$/), eerste(blok, /<blockquote>([\s\S]*?)<\/blockquote>/), tel(blok, /<svg/g));
  }),
  // Platte tekst: "'Citaat' – de Volkskrant ★★★★" in één alinea, of het citaat in een kop
  // met daaronder "★★★★ De Volkskrant" (Theater aan het Vrijthof). Alleen bekende media.
  (h) => {
    const regels = h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "")
      .split(/<\/(?:p|h\d|li|div|blockquote)>|<br\s*\/?>/i).map((r) => stripTags(r)).filter(Boolean);
    const uit = [];
    regels.forEach((r, i) => {
      let m = r.match(/^(.{15,600}?)["'”’]?\s+[-–—]\s+([A-Za-z0-9 ]{2,40}?)\s*(★{1,5})?\s*$/);
      if (m && bekendMedium(m[2].trim())) return uit.push(recensie(m[2], m[1], m[3]?.length));
      // "★★★★ De Volkskrant", of de sterren en de krant op twee regels.
      m = r.match(/^(★{1,5})\s*([A-Za-z0-9 ]{2,40})?$/);
      const medium = m && (m[2] || regels[i + 1] || "").trim();
      if (m && bekendMedium(medium) && i > 0 && /^["'“‘]/.test(regels[i - 1])) uit.push(recensie(medium, regels[i - 1], m[1].length));
    });
    return uit;
  },
];

/** @returns {{medium: string, sterren: number|null, citaat: string}[]} per medium één recensie */
// Waar op een pagina andere voorstellingen beginnen ("Bezoek ook", suggesties): hun citaten
// horen niet bij deze voorstelling, dus alles vanaf daar laten we weg.
const ANDERE_VOORSTELLINGEN = /id="suggestions"|class="(?:[^"]*\s)?(?:related|suggestion)[\w-]*[\s"]|>\s*(?:bezoek ook|ook interessant|misschien ook leuk|dit vind je misschien ook leuk|ook leuk|bekijk ook)\s*</i;

export function vindRecensies(html) {
  if (typeof html !== "string" || !/^\s*</.test(html) || !/<html|<body/i.test(html)) return [];
  const i = html.search(ANDERE_VOORSTELLINGEN);
  if (i > 0) html = html.slice(0, i);
  const perMedium = new Map();
  for (const herken of HERKENNERS) {
    let gevonden = [];
    try { gevonden = herken(html); } catch { /* een herkenner die struikelt, slaan we over */ }
    for (const r of gevonden) {
      if (!r) continue;
      const oud = perMedium.get(r.medium);
      if (!oud || (oud.sterren == null && r.sterren != null)) perMedium.set(r.medium, r);
    }
  }
  return [...perMedium.values()];
}
