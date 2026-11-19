// Speellijst van Eva Eikhout (evaeikhout.nl). Op de homepage staat onder "Speellijst & tickets" per avond een
// rij <a class="tour-row" href="kaartlink"><time datetime="2026-11-17">…</time><strong>Plaats</strong></a>:
// datum en plaats, geen zaal en geen tijd. De zaal volgt uit de kaartlink: het theater met die website in die
// plaats (lawei.nl is Schouwburg De Lawei). Heeft een website meer zalen (hnt.nl, zwolsetheaters.nl), dan de
// zaal met de websitenaam in de naam, anders de eerste; samenvoegen.mjs slaat de avond over als een theaterbron
// hem al heeft. De voorstelling is Het leven is kort, net als ik (cabaret).
// Werkt als een speellijst (soort "speellijst").
import { readFileSync } from "node:fs";
import { getText } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";

const SITE = "https://evaeikhout.nl/";
const TITEL = "Het leven is kort, net als ik";
const zalen = JSON.parse(readFileSync(new URL("../../data/theaters.json", import.meta.url), "utf8"));
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const kaal = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

function zaalVoor(link, plaats) {
  const h = host(link);
  const hier = zalen.filter((t) => t.website && host(t.website) === h && kaal(t.plaats) === kaal(plaats));
  if (!hier.length) return null;
  const naam = kaal(h.split(".")[0]);
  return (hier.find((t) => kaal(t.naam).includes(naam)) || hier[0]).naam;
}

export default {
  id: "evaeikhout",
  naam: "Speellijst van Eva Eikhout",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const html = await getText(SITE);
    const out = [];
    for (const m of html.matchAll(/<a[^>]*class="tour-row"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
      const datum = m[2].match(/datetime="(\d{4}-\d{2}-\d{2})"/)?.[1];
      const plaats = decodeEntities(stripTags(m[2].match(/<strong>([\s\S]*?)<\/strong>/)?.[1] || "")).trim();
      if (!datum || !plaats || datum < vandaag) continue;
      const link = decodeEntities(m[1]);
      out.push({
        theater: { zoeken: true, naam: zaalVoor(link, plaats) || plaats, plaats, land: "NL" },
        artiesten: ["Eva Eikhout"],
        titel: TITEL,
        genre: "cabaret",
        datum,
        tijd: null,
        status: /uitverkocht/i.test(m[2]) ? "uitverkocht" : "gepland",
        soort: null,
        bron: /^https?:\/\//.test(link) ? link : SITE,
      });
    }
    log(`${out.length} voorstellingen vanaf vandaag`);
    return out;
  },
};
