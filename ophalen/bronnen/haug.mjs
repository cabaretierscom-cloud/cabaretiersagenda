// Comedy Club Haug, Rotterdam. Next.js-site met per show (één datum) een pagina met een ComedyEvent
// als JSON-LD; de adressen staan in sitemap_shows-upcoming.xml. Alles is comedy; cursussen,
// kaartpassen (Shtick Fest MultiPass) en filmavonden laten we weg.
import { jsonldBron } from "../platforms/jsonld.mjs";
import { isBekend } from "../lib/artiesten.mjs";

const GEEN_VOORSTELLING = /cursus|workshop|multi ?pass|\bmovie\b|the movie|picture show|kado ?bon|cadeaukaart/i;

// Een show met alleen namen ("Sara Pascoe", "Raoul Heertje & Davine Perik") is een avond van die
// comedians; formats als "Best of Stand-Up", "Chuckle-Up!" en "Uurtje Finn" blijven een titel.
const FORMAT = /\b(best|of|open|mic|night|show|uurtje|talks|chuckle|club|regulars|comedy|queer|gong|live|special|try-?out|haug|english|fest)\b|[!?:']/i;
const isNaam = (s) => !FORMAT.test(s) && (isBekend(s) || /^\p{Lu}[\p{L}'.-]*(\s+(van|de|der|den|al|el|\p{Lu}[\p{L}'.-]*)){1,3}$/u.test(s));
const namen = (titel) => {
  const delen = titel.split(/\s+&\s+/);
  return delen.every(isNaam) ? delen : null;
};

const bron = jsonldBron({
  id: "haug",
  naam: "Comedy Club Haug",
  sitemap: "https://comedyclubhaug.com/sitemap_shows-upcoming.xml",
  voorstelling: /\/shows\/[^/]+$/,
  genre: (html) => {
    const titel = html.match(/<title>([^<]*)<\/title>/)?.[1] || "";
    return GEEN_VOORSTELLING.test(titel) ? null : [titel.replace(/\s*[-–|].*$/, ""), "comedy"];
  },
  theaters: [
    { id: "comedy-club-haug-rotterdam", naam: "Comedy Club Haug", plaats: "Rotterdam", land: "NL", soort: "comedyclub", website: "https://comedyclubhaug.com" },
  ],
});

export default {
  ...bron,
  async ophalen(ctx) {
    return (await bron.ophalen(ctx)).map((r) => {
      if (r.artiesten.some((a) => FORMAT.test(a))) r = { ...r, artiesten: [] };
      if (r.artiesten.length) return r;
      const n = namen(r.titel);
      return n ? { ...r, artiesten: n } : r;
    });
  },
};
