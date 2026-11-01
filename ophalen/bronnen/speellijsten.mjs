// Speellijsten op de eigen websites van artiesten. Daar staan ook de kleine zalen die we niet per
// theater ophalen. Per artiest: de pagina en welke stukjes van een rij plaats, zaal en titel zijn
// (zie lib/speellijst.mjs). Bron van zo'n speeldatum is de speellijst van de artiest.
// samenvoegen.mjs koppelt de zaal aan een bekend theater in dezelfde plaats, en slaat een avond over
// die een theaterbron al heeft (zelfde artiest, plaats en datum).
import { getText } from "../lib/http.mjs";
import { speellijstRijen, leesRij } from "../lib/speellijst.mjs";
import { netteNaam } from "../lib/normaliseer.mjs";

// Met vast: plaats en zaal nooit omdraaien ("De Rijp" lijkt op een zaalnaam). Met nederlands: rij is in
// Nederland bij een Belgische artiest.
// Met scheiding: teken tussen datum, plaats en titel op één regel ("5.11.2026 ✦ Aalst, CC De Werf").
// Met titel: de titel van de voorstelling, als de site er statussen of "Try-out" in zet.
// Met weekdagControle: staat er een weekdag in de rij die niet bij de datum past, dan is het jaartal
// waarschijnlijk fout geraden (oude seizoenen zonder jaartal op de pagina) en slaan we de rij over.
// Niet standaard: op veel sites staat de weekdag van de volgende rij aan het eind van de vorige.
const WEEKDAGEN = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const WEEKDAG = /^(zondag|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zo|ma|di|wo|do|vr|za)\.?$/i;
function weekdagKlopt(rij) {
  const dag = WEEKDAGEN[new Date(`${rij.datum}T12:00:00Z`).getUTCDay()];
  return rij.cellen.every((c) => !WEEKDAG.test(c.trim()) || c.trim().slice(0, 2).toLowerCase() === dag);
}

const PZ = ["plaats", "zaal"], ZP = ["zaal", "plaats"];
const PZT = ["plaats", "zaal", "titel"], ZPT = ["zaal", "plaats", "titel"];
const TPZ = ["titel", "plaats", "zaal"], TZP = ["titel", "zaal", "plaats"], PTZ = ["plaats", "titel", "zaal"];
const PROVINCIE = /^(Groningen|Friesland|Fryslân|Drenthe|Overijssel|Flevoland|Gelderland|Utrecht|Noord-Holland|Zuid-Holland|Zeeland|Noord-Brabant|Limburg)$|uitverkocht/i;

const ARTIESTEN = [
  { naam: "Alex Agnew", url: "https://alexagnew.be/tour-data/", volgorde: ["-", "titel", "plaats", "zaal"], land: "BE", alleen: /^Comedy\b/ },
  { naam: "Alex Ploeg", url: "https://www.alexploeg.nl/", volgorde: PZT },
  { naam: "Andries Tunru", url: "https://www.andriestunru.nl/", volgorde: PZ },
  { naam: "Annick Boer", url: "https://www.annickboer.nl/", volgorde: PZ },
  { naam: "Baas & Adriani", url: "https://www.baasenadriani.nl/", volgorde: ZP },
  { naam: "Berit Companjen", url: "https://beritcompanjen.nl/", volgorde: PZ },
  { naam: "Bert Gabriëls", url: "https://www.bertgabriels.be/", volgorde: ZP, land: "BE" },
  { naam: "Blauwe Vinkjes", url: "https://blauwevinkjes.nl/agenda/", volgorde: PZ },
  { naam: "Bob Koomen", url: "https://bobkoomen.nl/", volgorde: PZ },
  { naam: "Boban Braspenning", url: "https://www.bobanbraspenning.nl/", volgorde: PZ },
  { naam: "Christel de Laat", url: "https://www.christeldelaat.nl/speellijst/", volgorde: ZP },
  { naam: "Claudia de Breij", url: "https://www.claudiadebreij.nl/", volgorde: PZT },
  { naam: "Daan van der Hoeven", url: "https://www.daanvanderhoeven.nl/", volgorde: PZ },
  { naam: "David Linszen", url: "https://davidlinszen.nl/", volgorde: TPZ },
  { naam: "De Broers van Arkel", url: "https://www.debroersvanarkel.nl/speellijst", volgorde: PZ },
  { naam: "De Cabaret Club", url: "https://decabaretclub.nl/", volgorde: ZPT },
  { naam: "De Mugge van Brugge", url: "https://www.demuggevanbrugge.be/", volgorde: PZ, land: "BE", ruis: /^pre ?mi[eè]re$|^\d+u\b/i },
  { naam: "Die Verdammte Spielerei", url: "https://www.dieverdammtespielerei.be/agenda-and-tickets", volgorde: TPZ, land: "BE", scheiding: /\s*✦\s*/g, alleen: /Porselijm/ },
  { naam: "Dolf Jansen", url: "https://dolfjansen.com/schaamteloos/", volgorde: ZP },
  { naam: "Elfie Tromp", url: "https://elfietromp.nl/speellijst/", volgorde: ZPT },
  { naam: "Esther van der Voort", url: "https://esthervandervoort.com/", volgorde: ZP },
  { naam: "Gerrie Smits", url: "https://www.gerriesmits.nl/", volgorde: TZP, titel: "Oudejaarsconference 2026: Klem", weekdagControle: true, ruis: /^bekijk detail$/i },
  { naam: "Glodi Lugungu", url: "https://www.glodilugungu.nl/", volgorde: PZ },
  { naam: "Guido Weijers", url: "https://www.guidoweijers.nl/speellijst", volgorde: PZT },
  { naam: "Hans Teeuwen", url: "https://www.hansteeuwen.nl/", volgorde: ZP, weekdagControle: true },
  { naam: "Helligen Hendrik", url: "https://www.helligenhendrik.nl/tourschema/", volgorde: PZ },
  { naam: "Hetty Helsmoortel", url: "https://www.hettyhelsmoortel.be/", volgorde: TPZ, land: "BE", nederlands: /Goirle/, titel: "Missie 2026", ruis: /^(try-out|tour)\s*\(16\+\)$|^___/i },
  { naam: "Hidde van Gestel", url: "https://www.hiddevangestel.nl/", volgorde: ZP, titel: "Cum Laude" },
  { naam: "Jacques Vermeire", url: "https://www.jacquesvermeire.be/", volgorde: PZ, land: "BE", nederlands: /Terneuzen|Roosendaal/, splits: /\s*[-–—]\s*(?=\d)|\s+[-–—/|]\s+|,\s*/ },
  { naam: "Jade Mintjens", url: "https://jademintjens.be/speellijst/", volgorde: ZP, land: "BE" },
  { naam: "Jan Jaap van der Wal", url: "https://www.janjaapvanderwal.nl/speellijst/", volgorde: PZT, belgisch: /vlaanderen/i },
  { naam: "Jandino Asporaat", url: "https://www.jandino.nl/speellijst/", volgorde: PZ },
  { naam: "Janneke Jager", url: "https://jannekejager.nl/", volgorde: TZP },
  { naam: "Jay Francis", url: "https://jayfrancis.nl/agenda", volgorde: PZT },
  { naam: "Jeroens Clan", url: "https://www.jeroensclan.com/", volgorde: PZ },
  { naam: "Joosen en de Jager", url: "https://www.joosenendejager.nl/speellijst", volgorde: PTZ },
  { naam: "Kasper van der Laan", url: "https://kaspervanderlaan.nl/speellijst/", volgorde: PTZ },
  { naam: "Klaas van der Eerden", url: "https://www.klaasvandereerden.nl/", volgorde: PZT },
  { naam: "Kor Hoebe", url: "https://korhoebe.nl/", volgorde: ZP, ruis: PROVINCIE },
  { naam: "Lebbis", url: "https://www.bunkertheaterzaken.nl/artiesten/lebbis/", volgorde: TPZ },
  { naam: "Leon van der Zanden", url: "https://www.leonvanderzanden.nl/speellijst/", volgorde: ZPT },
  { naam: "Lieven Scheire", url: "https://www.lievenscheire.be/", volgorde: TPZ, land: "BE", overslaan: /kleine nerds|\(\d\+\)\s*$/i },
  { naam: "Lisa Ostermann", url: "https://lisaostermann.nl/", volgorde: PZT },
  { naam: "Lovella Telesford", url: "https://lovellatelesford.nl/", volgorde: ZPT },
  { naam: "Maaike Dirkje Hop", url: "https://www.maaikedirkjehop.nl/", volgorde: PZ, vast: true, splits: /\s*-\s+|\s+-\s*/, ruis: /^dubbel met|^dubieuze avond$|^erkenning,? de musical/i },
  { naam: "Maarten Westra Hoekzema", url: "https://www.maartenwestrahoekzema.com/", volgorde: TPZ, belgisch: /Mortsel|Morstel|Moorsele|Gent|Kortrijk|\b(OC|CC|GC)\s/, ruis: /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i },
  { naam: "Marja van Katendrecht", url: "https://marjavankatendrecht.nl/tickets/", volgorde: TZP },
  { naam: "Marjolijn van Kooten", url: "https://www.marjolijnvankooten.nl/speellijst/", volgorde: PZT },
  { naam: "Max van den Burg", url: "https://maxvandenburg.nl/", volgorde: PTZ },
  { naam: "Merijn Scholten", url: "https://merijnscholten.nl/", volgorde: PTZ },
  { naam: "Micha Wertheim", url: "https://www.michawertheim.nl/agenda/", volgorde: TPZ, splits: /,\s+/, ruis: /^sold out/i, overslaan: /echt gebeurd|brievenbus/i },
  { naam: "Mike Boddé", url: "https://www.mikebodde.nl/", volgorde: ZP },
  { naam: "Mohsin Abbas", url: "https://www.mohsinabbas.be/speellijst", volgorde: TZP, land: "BE" },
  { naam: "Najib Amhali", url: "https://najibamhali.nl/speellijst/", volgorde: PZ },
  { naam: "Nathalie Baartman", url: "https://nathaliebaartman.nl/voorstellingen/", volgorde: ZPT },
  { naam: "Nele Bauwens", url: "https://www.nelebauwens.be/", volgorde: PZ, land: "BE", splits: /\s+[-–—/|]\s+|,\s*/, ruis: /^(speeldata|google agenda|ical|outlook|[a-z]{3}|\d{1,2}|\d{1,2}:\d{2} [ap]\.m\.|evenement bekijken.*)$/i },
  { naam: "Nienke Plas", url: "https://nienkeplas.com/theater-voorstellingen/", volgorde: PZ },
  { naam: "Pepijn Schoneveld", url: "https://www.pepijnschoneveld.nl/speellijst/", volgorde: PZ },
  { naam: "Peter Pannekoek", url: "https://peterpannekoek.nl/", volgorde: PZT },
  { naam: "Peter van Ewijk", url: "https://www.petervanewijk.nl/speellijst", volgorde: TZP },
  { naam: "Plien en Bianca", url: "https://plienenbianca.nl/speellijsten/", volgorde: ZP },
  { naam: "Rachid Larouz", url: "https://www.rachidlarouz.nl/", volgorde: ZP },
  { naam: "Remy Evers", url: "https://www.remyevers.nl/speellijst-2/", volgorde: PZ },
  { naam: "Richard Groenendijk", url: "https://richardgroenendijk.nl/", volgorde: PZ },
  { naam: "Ricky Koole", url: "https://rickykoole.nl/shows/", volgorde: ZP },
  { naam: "Rob Scheepers", url: "https://www.robscheepers.com/speellijst", volgorde: ZPT },
  { naam: "Roel C. Verburg", url: "https://roelcverburg.nl/tourdata/", volgorde: TZP },
  { naam: "Roel Maalderink", url: "https://www.roelmaalderink.nl/", volgorde: ZPT },
  { naam: "Roué Verveer", url: "https://roueverveer.nl/speellijst/", volgorde: ZP },
  { naam: "Ruud Smulders", url: "https://ruudsmulders.nl/speellijst/", volgorde: PZ },
  { naam: "Sara Kroos", url: "https://www.sarakroos.nl/", volgorde: TZP },
  { naam: "Spruijt & Opperman", url: "https://spruijtenopperman.nl/speellijst/", volgorde: PZ },
  { naam: "Thijs Kemperink", url: "https://thijskemperink.nl/speellijst/", volgorde: TZP },
  { naam: "Valentina Tóth", url: "https://valentinatoth.nl/agenda/", volgorde: TZP },
  { naam: "Van Vleuten & Van Muiswinkel", url: "https://www.bunkertheaterzaken.nl/artiesten/van-vleuten-van-muiswinkel/", volgorde: TPZ },
  { naam: "Warre Verlinden", url: "https://www.warreverlinden.be/", volgorde: TZP, land: "BE", titel: "Zeker Onzeker", splits: /\s+·\s+(?:[^·]*?\d{4}\s+)?/ },
  { naam: "Wim Helsen", url: "https://wimhelsen.be/agenda/", volgorde: TZP, land: "BE" },
  { naam: "Wina Ricardo", url: "https://winaricardo.nl/", volgorde: PZT },
  { naam: "Wouter Deprez", url: "https://www.wouterdeprez.be/", volgorde: PZ, land: "BE" },
  { naam: "Wouter Monden", url: "https://www.woutermonden.nl/", volgorde: ["-", "zaal", "plaats"] },
  { naam: "Xander De Rycke", url: "https://www.xanderderycke.be/home/", volgorde: TPZ, land: "BE", overslaan: /^Stand-up\b/ },
];

// Een plaats is kort en zonder cijfers; een zaal is geen hele zin.
const lijktPlaats = (p) => p && p.length <= 40 && p.split(/\s+/).length <= 5 && !/\d|[!?:()]/.test(p) && !/theater|schouwburg|comedy|club|caf[eé]|zaal|podium|\bplt\b/i.test(p);
const lijktZaal = (z) => z && z.length <= 70 && z.split(/\s+/).length <= 9 && !/[!?]$/.test(z);

// De site van de zaal uit de kaartlink van een rij: niet die van de artiest zelf, een kaartverkoper,
// sociale media of een kaart.
const GEEN_ZAAL = /facebook|instagram|youtube|twitter|x\.com|tiktok|google|maps|ticketmaster|eventim|ticketcounter|stager|eventbrite|tickettailor|ticketkantoor|paylogic|ticketscript|seetickets|yourticketprovider|weeztix|eventix|tixly|ticketmatic|avayo|comedyshows|captaincomedy|ticketshop|fullhouse|uitinvlaanderen|uitbureau|your-tickets|tickoweb|weticket|ticket\.monster|ticketgang|utick|ordolio|stamhoofd|ticketsforme|wicket|eventsquare|entrytickets|comedytunes|jobra|wix|linktr|spotify|apple/i;
export function zaalSite(links, artiestUrl, naam) {
  const eigen = new URL(artiestUrl).hostname.replace(/^www\./, "");
  // Ook een andere site van de artiest ("najib-roue.nl" bij Najib Amhali) is geen zaal.
  const woorden = naam.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z]+/).filter((w) => w.length >= 4);
  for (const l of links || []) {
    try {
      const u = new URL(l);
      const host = u.hostname.replace(/^www\./, "");
      if (!/^https?:$/.test(u.protocol) || host === eigen || GEEN_ZAAL.test(host) || /^(tickets?|shop|webshop|reservaties|app|apps)\./.test(u.hostname) || woorden.some((w) => host.includes(w))) continue;
      return `${u.protocol}//${u.hostname}`;
    } catch { /* geen geldig adres */ }
  }
  return null;
}

export default {
  id: "speellijsten",
  naam: "Speellijsten van artiesten",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const out = [];
    await Promise.all(ARTIESTEN.map(async (a) => {
      let html;
      try { html = await getText(a.url); if (a.scheiding) html = html.replace(a.scheiding, "<br>"); } catch (e) { log(`${a.naam}: overgeslagen (${e.message})`); return; }
      let n = 0;
      for (const rij of speellijstRijen(html, { vandaag })) {
        if (rij.datum < vandaag || (a.weekdagControle && !weekdagKlopt(rij))) continue;
        const tekst = rij.cellen.join(" ");
        if ((a.alleen && !a.alleen.test(tekst)) || (a.overslaan && a.overslaan.test(tekst)) || /besloten|privé|bedrijfsvoorstelling|personeelsfeest|feestavond voor|mantelzorg|niet openbaar/i.test(tekst)) continue;
        const r = leesRij(rij, { ...a, naam: a.naam });
        if (r.plaats) r.plaats = netteNaam(r.plaats);
        if (a.belgisch?.test(tekst)) r.land = "BE";
        if (a.nederlands?.test(tekst)) r.land = "NL";
        // Alleen Nederland en België; geen tournees op de Antillen of in Suriname.
        if (!lijktPlaats(r.plaats) || !lijktZaal(r.zaal) || /cura[cç]ao|aruba|bonaire|suriname|paramaribo|sint maarten/i.test(tekst)) continue;
        out.push({
          theater: { zoeken: true, naam: r.zaal, plaats: r.plaats, land: r.land, website: zaalSite(rij.links, a.url, a.naam) },
          artiesten: [a.naam],
          titel: a.titel || r.titel,
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
