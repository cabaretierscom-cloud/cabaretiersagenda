// "Artiest - Titel" of "Artiest: Titel" in één kop (Vlaamse cultuurcentra): het deel ervoor is de artiest,
// tenzij het een reeks of avondnaam is ("Comedycafé: ..."). Bekende artiesten beslissen bij twijfel wie wie is.
import { artiestOfTitel, isBekend } from "./artiesten.mjs";
import { netteNaam } from "./normaliseer.mjs";

const REEKS = /comedy\s?caf|try-?out|avond|festival|gala|show$/i;

export function splitsKop(kop) {
  // Drie of meer delen ("Amor Fati - 10 jaar in Vlaanderen - Jan Jaap van der Wal", Gildhof): het deel dat een
  // bekende artiest is, is de artiest (vooraan of achteraan); "Full try-out" of "5+" telt niet als titel.
  const delen = String(kop || "").split(/\s[-–|]\s/).map((d) => d.trim()).filter((d) => d && !/^(full\s+)?try-?out$|^\d+([,.]\d+)?\+$/i.test(d));
  if (delen.length >= 2) {
    const [eerste, laatste] = [delen[0], delen.at(-1)];
    if (delen.length <= 3 && isBekend(laatste) && !isBekend(eerste)) return { artiest: netteNaam(laatste), titel: eerste };
    if (isBekend(eerste)) return { artiest: netteNaam(eerste), titel: delen.slice(1).join(" - ") };
    if (delen.length > 2 && !REEKS.test(eerste)) return { artiest: null, titel: eerste };
  }
  const m = String(kop || "").match(/^(.+?)\s*(?::|\s[-–|]\s)\s*(.+)$/);
  if (!m) {
    // Zonder scheidingsteken ("Wannes Cappelle Verstaanbaar"): begint de kop met een bekende artiest?
    const w = String(kop || "").split(/\s+/);
    for (let i = Math.min(5, w.length - 1); i >= 1; i--) {
      const naam = w.slice(0, i).join(" ");
      if (isBekend(naam)) return { artiest: netteNaam(naam), titel: w.slice(i).join(" ") };
    }
    return { artiest: null, titel: kop };
  }
  if (REEKS.test(m[1])) return { artiest: null, titel: kop };
  return artiestOfTitel(netteNaam(m[1].trim()), m[2].trim());
}
