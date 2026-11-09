// Tweede verkenning: de programmapagina van een zaal. Staat er een genre humor/comedy, en hebben de
// voorstellingspagina's schema.org-evenementen (JSON-LD)? Eén programmapagina en één voorstellingspagina per site.
// Gebruik: node scripts/zalen-programma.mjs https://www.voorbeeld.be/programma ...
import { get } from "../ophalen/lib/http.mjs";

for (const url of process.argv.slice(2)) {
  const uit = { url };
  try {
    const html = await get(url).then((r) => r.text);
    uit.humorWoorden = [...new Set([...html.matchAll(/\b(humor|comedy|cabaret|stand-?up|kleinkunst|familie|jeugd)\b/gi)].map((m) => m[1].toLowerCase()))];
    uit.filterLinks = [...new Set([...html.matchAll(/href="([^"]*(humor|comedy|cabaret)[^"]*)"/gi)].map((m) => m[1]))].slice(0, 4);
    uit.jsonLdLijst = /"@type"\s*:\s*"(Theater)?Event"/.test(html);
    const basis = new URL(url);
    const pad = basis.pathname.replace(/\/$/, "");
    const voorstelling = [...html.matchAll(/href="([^"#?]+)"/g)].map((m) => new URL(m[1], url))
      .find((u) => u.host === basis.host && u.pathname.startsWith(pad + "/") && u.pathname.split("/").filter(Boolean).length > pad.split("/").filter(Boolean).length && !/genre|categorie|thema|filter|page/i.test(u.pathname));
    if (voorstelling) {
      const v = await get(voorstelling.href).then((r) => r.text);
      uit.voorbeeld = voorstelling.pathname;
      uit.jsonLdVoorstelling = /"@type"\s*:\s*"(Theater)?Event"/.test(v);
      uit.ticketmaticEvent = /ticketmatic\.com\/widgets\/[^"]*event=\d+/.test(v);
      uit.datumInPagina = (v.match(/\b\d{1,2}[ /.-](\d{1,2}|jan|feb|mrt|maa|apr|mei|jun|jul|aug|sep|okt|nov|dec)[a-z]*[ /.-]\d{2,4}\b/i) || [""])[0];
    }
  } catch (e) {
    uit.fout = e.message.slice(0, 120);
  }
  console.log(JSON.stringify(uit));
}
