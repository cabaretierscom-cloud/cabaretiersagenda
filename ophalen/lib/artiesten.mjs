// Artiesten die al in de database staan, om bij een bron te herkennen wat de artiest is
// en wat de titel ("Hokjesdenker, We zien het wel even" of andersom).
import { readFileSync } from "node:fs";
import { slug } from "./normaliseer.mjs";

// Ook de schrijfwijzen uit aliassen.json ("Najib & Roué") tellen als bekende artiest.
const lees = (f) => JSON.parse(readFileSync(new URL(`../../data/${f}`, import.meta.url), "utf8"));
const bekend = new Set([...lees("artiesten.json").flatMap((a) => [a.naam, ...(a.ookBekendAls || [])]), ...Object.keys(lees("aliassen.json"))].map(slug));

// Artiesten die pas bij het samenvoegen bijkomen, ook herkennen.
export const maakBekend = (naam) => bekend.add(slug(naam));

export const isBekend = (naam) => Boolean(naam) && bekend.has(slug(naam));

// Staat de artiest op de plek van de titel ("De Schnabbelkoningin" / "Milène van der Smissen")?
// Dan omdraaien. "Diverse comedians" en dergelijke zijn geen artiest maar een omschrijving.
export function artiestOfTitel(artiest, titel) {
  if (/^(met\s+)?diverse\s+(comedians|artiesten|cabaretiers|cabaretières)$/i.test(String(titel || "").trim())) return { artiest: null, titel: artiest };
  if (artiest && titel && isBekend(titel) && !isBekend(artiest)) return { artiest: titel, titel: artiest };
  return { artiest, titel };
}
