// Speeldata van Jimmie Dimmick (Vlaams artiestenbureau, jimmiedimmick.be), met de hand ingelezen (november 2026).
// De speellijsten op jimmiedimmick.be zijn een ZAP Planning-widget en robots.txt van planning.jimmiedimmick.be en
// planning.zap.be verbiedt alles behalve /vcalendar; daarom geen nachtelijke bron. De eigenaar kreeg de speeldata
// van het bureau (mail van Laura) en plakte ze over van de artiestpagina's. Bij Portie Gemengd komen de kaartlinks en
// de status (uitverkocht) van juliedelrue.be (geen robots.txt), waar dezelfde avonden met de link van de zaal staan.
// Gebruik: node scripts/jimmiedimmick-import.mjs, daarna npm run samenvoegen. Zodra het bureau een agendalink
// (/vcalendar) geeft, kan dit een gewone bron worden.
import { writeFileSync } from "node:fs";

const PORTIE = "https://www.jimmiedimmick.be/portie-gemengd";
const ROY = "https://www.jimmiedimmick.be/royaernouts";
const U = "uitverkocht", G = "gepland";

// [datum, zaal, plaats, status, kaartlink (anders de pagina van het bureau)]
const SKETCH = [
  ["2026-11-27", "CC Gildhof", "Tielt", U, "https://www.gildhof.be/sketch-portie-gemengd"],
  ["2026-11-28", "De Woeker", "Oudenaarde", U, "https://www.oudenaarde.be/nl/de-woeker/aanbod/overzicht/portie-gemengd"],
  ["2026-12-03", "Cultuurhuis De Kimpel", "Bilzen", G, "https://www.bilzenhoeselt.be/activiteiten/detail/3557/portie-gemengd-sketch"],
  ["2026-12-04", "City", "Nieuwpoort", U, "https://www.cultuurnieuwpoort.be/activiteit/sketch-scenes-uit-het-leven-van-een-moderne-mens"],
  ["2026-12-05", "Cultuurhuis De Herbakker", "Eeklo", U, "https://www.cultuurhuisherbakker.be/activiteiten/detail/6707/portie-gemengd-sketch"],
  ["2026-12-10", "CC De Brouckere", "Torhout", U, "https://www.ccdebrouckere.be/sketch"],
  ["2026-12-11", "De Velinx", "Tongeren", G, "https://www.develinx.be/evenement/sketch"],
  ["2026-12-12", "CC Palethe", "Pelt", G, "https://www.palethe.be/portie-gemengd-sketch"],
  ["2026-12-16", "OC 't Waaigat", "Zwijndrecht", U, "https://www.tervesten.be/portie-gemengd-sketch"],
  // juliedelrue.be noemt 7 december (tussen 16 en 18 december); het bureau 17 december.
  ["2026-12-17", "GC De Melkerij", "Zemst", U, "https://www.zemst.be/activiteiten/detail/4101/sketch"],
  ["2026-12-18", "Cultuurhuis De Leest", "Izegem", U, "https://www.deleest.be/deleest/nieuws/sketch"],
  ["2026-12-19", "Cultuurhuis Het Loo", "Tessenderlo", G, "https://www.tessenderlo-ham.be/activiteiten/portie-gemengd-steven-beersmans-julie-delrue-liesa-naert-sketch"],
  ["2027-05-01", "c o r s o", "Berchem", G, PORTIE],
  ["2027-05-12", "CC De Borre", "Bierbeek", U, "https://www.deborre.be/cultuur/sketch"],
  ["2027-05-13", "CC Zwaneberg", "Heist-op-den-Berg", G, "https://www.zwaneberg.be/nl/event/sketch"],
  ["2027-05-15", "CC Nova", "Nazareth", G, "https://popallure.be/"],
  ["2027-05-20", "Capitole Gent", "Gent", G, "https://www.comedyshows.be/kalender/portie-gemengd/2027-05-20/"],
  ["2027-05-21", "GC Spikkerelle", "Avelgem", U, "https://www.uitinvlaanderen.be/agenda/e/portie-gemengd-sketch/98c75beb-75a8-4417-95d0-bdff2c9291ab"],
  ["2027-05-22", "CC De Steiger", "Menen", G, "https://www.ccdesteiger.be/nl/event/portie-gemengd"],
  ["2027-05-25", "GC Felix Sohie", "Hoeilaart", G, "https://hoeilaart.be/activiteiten/sketch-portie-gemengd"],
  ["2027-05-27", "GC De Zandloper", "Wemmel", G, "https://tickets.dezandloper.be/nl/buyingflow/tickets/40787/76245/"],
  ["2027-05-28", "CC De Adelberg", "Lommel", G, "https://www.ccdeadelberg.be/programma/portie-gemengd-steven-beersmans-julie-delrue-liesa-naert-mbgm"],
  ["2027-06-01", "CC De Plomblom", "Ninove", G, "https://www.ccdeplomblom.org/voorstelling/1100/portie-gemengd"],
  ["2027-06-03", "Arenberg", "Antwerpen", G, "https://www.arenberg.be/nl/programma/sketch/a0NP500000HnpXWMAZ"],
  ["2027-06-04", "CC Brugge", "Brugge", U, "https://www.ccbrugge.be/agenda/sketch-hvl7"],
];
const ZAALSHOW = [
  ["2026-12-04", "Kaleidoscoop", "Mortsel", G, ROY],
  ["2026-12-10", "De Klisse", "Oostende", G, "https://comedy-oostende.weticket.io/royaernouts"],
  ["2026-12-11", "Feestzaal OLVI", "Boom", G, ROY],
  ["2026-12-19", "Schouwburg De Kern", "Wilrijk", G, ROY],
];

const rij = (artiest, titel, genre) => ([datum, naam, plaats, status, bron]) => ({
  theater: { zoeken: true, naam, plaats, land: "BE", website: null },
  artiesten: [artiest], titel, genre, datum, tijd: null, status, soort: null, bron,
});
const speeldata = [
  ...SKETCH.map(rij("Portie Gemengd", "Sketch!", "comedy")),
  ...ZAALSHOW.map(rij("Roy Aernouts", "Zaalshow 1", "stand-up")),
];
const opgehaald = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
writeFileSync(new URL("../data/bronnen/jimmiedimmick.json", import.meta.url), JSON.stringify({
  bron: "jimmiedimmick", naam: "Speellijsten van Jimmie Dimmick (import)", soort: "speellijst", opgehaald, theaters: [], speeldata, recensies: {},
}, null, 2) + "\n");
console.log(`${speeldata.length} speeldata geschreven naar data/bronnen/jimmiedimmick.json`);
