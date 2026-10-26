import { cre8ionKaarten } from "../platforms/cre8ion-kaarten.mjs";

export default cre8ionKaarten({
  id: "verkadefabriek",
  naam: "Verkadefabriek",
  sitemap: "https://www.verkadefabriek.nl/sitemap.xml",
  voorstelling: /^https:\/\/www\.verkadefabriek\.nl\/agenda\/(?!koop-ticket|open-wachtlijst)[a-z0-9-]+$/,
  theaters: [
    { id: "verkadefabriek-s-hertogenbosch", naam: "Verkadefabriek", plaats: "'s-Hertogenbosch", land: "NL", soort: "theater", website: "https://www.verkadefabriek.nl" },
  ],
});
