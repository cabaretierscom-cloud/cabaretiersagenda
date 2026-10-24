// Speellijsten op de eigen websites van artiesten. Daar staan ook de kleine zalen die we niet per
// theater ophalen. Per artiest: de pagina en welke stukjes van een rij plaats, zaal en titel zijn
// (zie lib/speellijst.mjs). Bron van zo'n speeldatum is de speellijst van de artiest.
// samenvoegen.mjs koppelt de zaal aan een bekend theater in dezelfde plaats, en slaat een avond over
// die een theaterbron al heeft (zelfde artiest, plaats en datum).
import { getText } from "../lib/http.mjs";
import { speellijstRijen, leesRij } from "../lib/speellijst.mjs";

const PZ = ["plaats", "zaal"], ZP = ["zaal", "plaats"];
const PZT = ["plaats", "zaal", "titel"], ZPT = ["zaal", "plaats", "titel"];
const TPZ = ["titel", "plaats", "zaal"], TZP = ["titel", "zaal", "plaats"], PTZ = ["plaats", "titel", "zaal"];
const PROVINCIE = /^(Groningen|Friesland|Fryslân|Drenthe|Overijssel|Flevoland|Gelderland|Utrecht|Noord-Holland|Zuid-Holland|Zeeland|Noord-Brabant|Limburg)$|uitverkocht/i;

const ARTIESTEN = [
  { naam: "Alex Agnew", url: "https://alexagnew.be/tour-data/", volgorde: ["-", "titel", "plaats", "zaal"], land: "BE", alleen: /^Comedy\b/ },
  { naam: "Alex Ploeg", url: "https://www.alexploeg.nl/", volgorde: PZT },
  { naam: "Andries Tunru", url: "https://www.andriestunru.nl/", volgorde: PZ },
  { naam: "Berit Companjen", url: "https://beritcompanjen.nl/", volgorde: PZ },
  { naam: "Blauwe Vinkjes", url: "https://blauwevinkjes.nl/agenda/", volgorde: PZ },
  { naam: "Bob Koomen", url: "https://bobkoomen.nl/", volgorde: PZ },
  { naam: "Boban Braspenning", url: "https://www.bobanbraspenning.nl/", volgorde: PZ },
  { naam: "Christel de Laat", url: "https://www.christeldelaat.nl/speellijst/", volgorde: ZP },
  { naam: "Claudia de Breij", url: "https://www.claudiadebreij.nl/", volgorde: PZT },
  { naam: "Daan van der Hoeven", url: "https://www.daanvanderhoeven.nl/", volgorde: PZ },
  { naam: "David Linszen", url: "https://davidlinszen.nl/", volgorde: TPZ },
  { naam: "De Broers van Arkel", url: "https://www.debroersvanarkel.nl/speellijst", volgorde: PZ },
  { naam: "De Cabaret Club", url: "https://decabaretclub.nl/", volgorde: ZPT },
  { naam: "Dolf Jansen", url: "https://dolfjansen.com/schaamteloos/", volgorde: ZP },
  { naam: "Elfie Tromp", url: "https://elfietromp.nl/speellijst/", volgorde: ZPT },
  { naam: "Esther van der Voort", url: "https://esthervandervoort.com/", volgorde: ZP },
  { naam: "Glodi Lugungu", url: "https://www.glodilugungu.nl/", volgorde: PZ },
  { naam: "Guido Weijers", url: "https://www.guidoweijers.nl/speellijst", volgorde: PZT },
  { naam: "Jade Mintjens", url: "https://jademintjens.be/speellijst/", volgorde: ZP, land: "BE" },
  { naam: "Jandino Asporaat", url: "https://www.jandino.nl/speellijst/", volgorde: PZ },
  { naam: "Jay Francis", url: "https://jayfrancis.nl/agenda", volgorde: PZT },
  { naam: "Jeroens Clan", url: "https://www.jeroensclan.com/", volgorde: PZ },
  { naam: "Joosen en de Jager", url: "https://www.joosenendejager.nl/speellijst", volgorde: PTZ },
  { naam: "Kasper van der Laan", url: "https://kaspervanderlaan.nl/speellijst/", volgorde: PTZ },
  { naam: "Klaas van der Eerden", url: "https://www.klaasvandereerden.nl/", volgorde: PZT },
  { naam: "Kor Hoebe", url: "https://korhoebe.nl/", volgorde: ZP, ruis: PROVINCIE },
  { naam: "Lebbis", url: "https://www.bunkertheaterzaken.nl/artiesten/lebbis/", volgorde: TPZ },
  { naam: "Lisa Ostermann", url: "https://lisaostermann.nl/", volgorde: PZT },
  { naam: "Lovella Telesford", url: "https://lovellatelesford.nl/", volgorde: ZPT },
  { naam: "Marja van Katendrecht", url: "https://marjavankatendrecht.nl/tickets/", volgorde: TZP },
  { naam: "Marjolijn van Kooten", url: "https://www.marjolijnvankooten.nl/speellijst/", volgorde: PZT },
  { naam: "Max van den Burg", url: "https://maxvandenburg.nl/", volgorde: PTZ },
  { naam: "Merijn Scholten", url: "https://merijnscholten.nl/", volgorde: PTZ },
  { naam: "Najib Amhali", url: "https://najibamhali.nl/speellijst/", volgorde: PZ },
  { naam: "Nathalie Baartman", url: "https://nathaliebaartman.nl/voorstellingen/", volgorde: ZPT },
  { naam: "Nienke Plas", url: "https://nienkeplas.com/theater-voorstellingen/", volgorde: PZ },
  { naam: "Peter Pannekoek", url: "https://peterpannekoek.nl/", volgorde: PZT },
  { naam: "Plien en Bianca", url: "https://plienenbianca.nl/speellijsten/", volgorde: ZP },
  { naam: "Remy Evers", url: "https://www.remyevers.nl/speellijst-2/", volgorde: PZ },
  { naam: "Richard Groenendijk", url: "https://richardgroenendijk.nl/", volgorde: PZ },
  { naam: "Ricky Koole", url: "https://rickykoole.nl/shows/", volgorde: ZP },
  { naam: "Rob Scheepers", url: "https://www.robscheepers.com/speellijst", volgorde: ZPT },
  { naam: "Roel C. Verburg", url: "https://roelcverburg.nl/tourdata/", volgorde: TZP },
  { naam: "Roué Verveer", url: "https://roueverveer.nl/speellijst/", volgorde: ZP },
  { naam: "Ruud Smulders", url: "https://ruudsmulders.nl/speellijst/", volgorde: PZ },
  { naam: "Sara Kroos", url: "https://www.sarakroos.nl/", volgorde: TZP },
  { naam: "Spruijt & Opperman", url: "https://spruijtenopperman.nl/speellijst/", volgorde: PZ },
  { naam: "Thijs Kemperink", url: "https://thijskemperink.nl/speellijst/", volgorde: TZP },
  { naam: "Valentina Tóth", url: "https://valentinatoth.nl/agenda/", volgorde: TZP },
  { naam: "Van Vleuten & Van Muiswinkel", url: "https://www.bunkertheaterzaken.nl/artiesten/van-vleuten-van-muiswinkel/", volgorde: TPZ },
  { naam: "Wim Helsen", url: "https://wimhelsen.be/agenda/", volgorde: TZP, land: "BE" },
  { naam: "Wina Ricardo", url: "https://winaricardo.nl/", volgorde: PZT },
  { naam: "Xander De Rycke", url: "https://www.xanderderycke.be/home/", volgorde: TPZ, land: "BE", overslaan: /^Stand-up\b/ },
];

// Een plaats is kort en zonder cijfers; een zaal is geen hele zin.
const lijktPlaats = (p) => p && p.length <= 40 && p.split(/\s+/).length <= 5 && !/\d|[!?:()]/.test(p) && !/theater|schouwburg|comedy|club|caf[eé]|zaal|podium|\bplt\b/i.test(p);
const lijktZaal = (z) => z && z.length <= 70 && z.split(/\s+/).length <= 9 && !/[!?]$/.test(z);

export default {
  id: "speellijsten",
  naam: "Speellijsten van artiesten",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const out = [];
    await Promise.all(ARTIESTEN.map(async (a) => {
      let html;
      try { html = await getText(a.url); } catch (e) { log(`${a.naam}: overgeslagen (${e.message})`); return; }
      let n = 0;
      for (const rij of speellijstRijen(html, { vandaag })) {
        if (rij.datum < vandaag) continue;
        const tekst = rij.cellen.join(" ");
        if ((a.alleen && !a.alleen.test(tekst)) || (a.overslaan && a.overslaan.test(tekst)) || /besloten|privé|bedrijfsvoorstelling|personeelsfeest|feestavond voor|mantelzorg|niet openbaar/i.test(tekst)) continue;
        const r = leesRij(rij, { ...a, naam: a.naam });
        if (!lijktPlaats(r.plaats) || !lijktZaal(r.zaal)) continue;
        out.push({
          theater: { zoeken: true, naam: r.zaal, plaats: r.plaats, land: r.land },
          artiesten: [a.naam],
          titel: r.titel,
          genre: "cabaret",
          datum: r.datum,
          tijd: r.tijd,
          status: r.status,
          soort: r.soort,
          bron: a.url,
        });
        n++;
      }
      log(`${a.naam}: ${n} speeldata`);
    }));
    return out;
  },
};
