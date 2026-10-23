// Artiesten die al in de database staan, om bij een bron te herkennen wat de artiest is
// en wat de titel ("Hokjesdenker, We zien het wel even" of andersom).
import { readFileSync } from "node:fs";
import { slug } from "./normaliseer.mjs";

const bekend = new Set(JSON.parse(readFileSync(new URL("../../data/artiesten.json", import.meta.url), "utf8"))
  .flatMap((a) => [a.naam, ...(a.ookBekendAls || [])]).map(slug));

export const isBekend = (naam) => Boolean(naam) && bekend.has(slug(naam));

// Staat de artiest op de plek van de titel ("De Schnabbelkoningin" / "Milène van der Smissen")?
// Dan omdraaien. "Diverse comedians" en dergelijke zijn geen artiest maar een omschrijving.
export function artiestOfTitel(artiest, titel) {
  if (/^(met\s+)?diverse\s+(comedians|artiesten|cabaretiers|cabaretières)$/i.test(String(titel || "").trim())) return { artiest: null, titel: artiest };
  if (artiest && titel && isBekend(titel) && !isBekend(artiest)) return { artiest: titel, titel: artiest };
  return { artiest, titel };
}
