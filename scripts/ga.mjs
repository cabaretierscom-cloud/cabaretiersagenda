// Cijfers uit Google Analytics 4 (alleen lezen), voor rapportages aan theaters en artiesten.
// De sleutel van het serviceaccount "claude-lezer" staat NIET in de repository maar als
// omgevingsvariabele GA_SERVICE_ACCOUNT_B64 (het JSON-bestand in base64) in de instellingen
// van de cloudomgeving. Het serviceaccount heeft in GA de rol Kijker.
//
// Gebruik:
//   node scripts/ga.mjs overzicht [--dagen 28]   bezoekers, sessies en paginaweergaven per dag
//   node scripts/ga.mjs paginas   [--dagen 28]   meest bekeken pagina's
//   node scripts/ga.mjs bronnen   [--dagen 28]   waar bezoekers vandaan komen
//   node scripts/ga.mjs tickets   [--dagen 28]   klikken op Tickets-knoppen per theater, artiest en voorstelling
//   node scripts/ga.mjs google    [--dagen 28]   Google zoekresultaten (Search Console): vertoningen, klikken, positie per pagina
//   node scripts/ga.mjs dashboard [--dagen 28]   alle rapporten (laatste 28 dagen en per maand, t/m gisteren) naar data/ga-dashboard.json voor /dashboard/
//   node scripts/ga.mjs zoektermen [--dagen 28] [--pagina /pad/]  zoektermen in Google (Search Console API), met vertoningen,
//                                                klikken, doorklikratio en positie; met --pagina alleen voor die pagina
//   ... --json                                   ruwe uitvoer als JSON
// Voor zoektermen heeft het serviceaccount in Search Console de rol "Beperkt" en staat de Search Console API aan.
// data/ga-dashboard.json staat in .gitignore: de repository is openbaar. GitHub Actions haalt het elke run
// opnieuw op als het geheim GA_SERVICE_ACCOUNT_B64 daar is ingesteld.
// In de cloudomgeving: NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt NODE_USE_ENV_PROXY=1 node scripts/ga.mjs ...
import { createSign } from "node:crypto";
import { writeFileSync } from "node:fs";

const PROPERTY = process.env.GA_PROPERTY || "560720061"; // www.cabaretiers.com (niet geheim)

function sleutel() {
  const b64 = process.env.GA_SERVICE_ACCOUNT_B64;
  const ruw = b64 ? Buffer.from(b64.trim(), "base64").toString("utf8") : process.env.GA_SERVICE_ACCOUNT_JSON;
  if (!ruw) throw new Error("Geen sleutel: zet GA_SERVICE_ACCOUNT_B64 in de omgevingsinstellingen en start een nieuwe sessie.");
  const s = JSON.parse(ruw);
  if (!s.client_email || !s.private_key) throw new Error("De sleutel mist client_email of private_key.");
  return s;
}

const b64url = (x) => Buffer.from(typeof x === "string" ? x : JSON.stringify(x)).toString("base64url");

async function toegangstoken(s, scope = "https://www.googleapis.com/auth/analytics.readonly") {
  const nu = Math.floor(Date.now() / 1000);
  const kop = b64url({ alg: "RS256", typ: "JWT" });
  const inhoud = b64url({ iss: s.client_email, scope, aud: s.token_uri || "https://oauth2.googleapis.com/token", iat: nu, exp: nu + 3600 });
  const handtekening = createSign("RSA-SHA256").update(`${kop}.${inhoud}`).sign(s.private_key, "base64url");
  const res = await fetch(s.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${kop}.${inhoud}.${handtekening}` }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`Inloggen bij Google mislukt: ${j.error_description || j.error || res.status}`);
  return j.access_token;
}

async function rapport(token, verzoek) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY}:runReport`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(verzoek),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`Google Analytics: ${j.error?.message || res.status}`);
  return j;
}

const args = process.argv.slice(2);
const soort = args.find((a) => !a.startsWith("--")) || "overzicht";
const dagen = Number(args[args.indexOf("--dagen") + 1]) || 28;
const alsJson = args.includes("--json");
const periode = [{ startDate: `${dagen}daysAgo`, endDate: "today" }];
const tickets = { filter: { fieldName: "eventName", stringFilter: { value: "ticket_klik" } } };

const VERZOEKEN = {
  overzicht: { dimensions: [{ name: "date" }], metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }], orderBys: [{ dimension: { dimensionName: "date" } }] },
  paginas: { dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 50 },
  bronnen: { dimensions: [{ name: "sessionSourceMedium" }], metrics: [{ name: "sessions" }, { name: "activeUsers" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 30 },
  // Google zoekresultaten (Search Console, gekoppeld aan GA): vertoningen, klikken en gemiddelde positie per landingspagina.
  // Zoektermen zelf geeft de GA-koppeling niet door; die staan alleen in Search Console.
  google: { dimensions: [{ name: "landingPagePlusQueryString" }], metrics: [{ name: "organicGoogleSearchImpressions" }, { name: "organicGoogleSearchClicks" }, { name: "organicGoogleSearchClickThroughRate" }, { name: "organicGoogleSearchAveragePosition" }], orderBys: [{ metric: { metricName: "organicGoogleSearchImpressions" }, desc: true }], limit: 100 },
  // Eigen dimensies uit het event ticket_klik (in GA geregistreerd als aangepaste dimensies op eventniveau).
  tickets: { dimensions: [{ name: "customEvent:theater" }, { name: "customEvent:artiest" }, { name: "customEvent:voorstelling" }], metrics: [{ name: "eventCount" }], dimensionFilter: tickets, orderBys: [{ metric: { metricName: "eventCount" }, desc: true }], limit: 100 },
};
// Zijn de eigen dimensies (nog) niet geregistreerd, dan alleen het totaal per pagina.
const TICKETS_EENVOUDIG = { dimensions: [{ name: "pagePath" }], metrics: [{ name: "eventCount" }], dimensionFilter: tickets, orderBys: [{ metric: { metricName: "eventCount" }, desc: true }], limit: 100 };

// Rijen als objecten met eenvoudige namen (customEvent:theater -> theater), getallen als getal.
function alsRijen(r) {
  const dims = (r.dimensionHeaders || []).map((h) => h.name.replace("customEvent:", ""));
  const mets = (r.metricHeaders || []).map((h) => h.name);
  return (r.rows || []).map((row) => Object.fromEntries([
    ...(row.dimensionValues || []).map((v, i) => [dims[i], v.value]),
    ...(row.metricValues || []).map((v, i) => [mets[i], Number(v.value)]),
  ]));
}

// Alle rapporten voor het dashboard over één periode.
async function dashboardPeriode(token, bereik) {
  const uit = {};
  for (const naam of Object.keys(VERZOEKEN)) {
    let r;
    try { r = await rapport(token, { ...VERZOEKEN[naam], dateRanges: bereik }); } catch (e) {
      if (naam !== "tickets" && naam !== "google") throw e;
      r = { rows: [] };
    }
    uit[naam] = alsRijen(r);
  }
  // Weergaven per theater-, artiest- en plaatspagina (met alles eronder); de dashboardpagina telt ze per id op.
  for (const [naam, begin] of [["theaters", "/theaters/"], ["artiesten", "/artiesten/"], ["plaatsen", "/plaatsen/"]]) {
    const r = await rapport(token, {
      dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }], dateRanges: bereik,
      dimensionFilter: { filter: { fieldName: "pagePath", stringFilter: { matchType: "BEGINS_WITH", value: begin } } },
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 1000,
    });
    uit[naam] = alsRijen(r);
  }
  // Plaatspagina's heten sinds november 2026 /theaters-in-<plaats>/; de oude /plaatsen/<plaats>/ tellen ook mee.
  uit.plaatsen.push(...alsRijen(await rapport(token, {
    dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }], dateRanges: bereik,
    dimensionFilter: { filter: { fieldName: "pagePath", stringFilter: { matchType: "BEGINS_WITH", value: "/theaters-in-" } } },
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 1000,
  })));
  // Bezoekers per plaats (volgens Google Analytics, op basis van het internetadres) voor de kaart op het dashboard.
  uit.steden = alsRijen(await rapport(token, {
    dimensions: [{ name: "country" }, { name: "region" }, { name: "city" }], metrics: [{ name: "activeUsers" }, { name: "sessions" }], dateRanges: bereik,
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }], limit: 2000,
  }));
  uit.overzicht = uit.overzicht.map((d) => ({ ...d, date: d.date.replace(/^(\d{4})(\d\d)(\d\d)$/, "$1-$2-$3") }));
  return uit;
}

// Eerste maand in de keuzelijst van het dashboard.
const EERSTE_MAAND = "2026-11";

if (soort === "dashboard") {
  // Hele dagen: tot en met gisteren (Europe/Amsterdam), zodat een nachtelijke run geen halve dag toont.
  const vandaag = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
  const gisteren = new Date(Date.parse(vandaag + "T12:00:00Z") - 864e5).toISOString().slice(0, 10);
  try {
    const token = await toegangstoken(sleutel());
    const uit = { opgehaald: new Date().toISOString(), dagen, property: PROPERTY, perioden: [] };
    uit.perioden.push({ id: "", naam: `Laatste ${dagen} dagen`, ...(await dashboardPeriode(token, [{ startDate: `${dagen}daysAgo`, endDate: "yesterday" }])) });
    // Per maand, vanaf EERSTE_MAAND tot en met de maand van gisteren; nieuwste eerst in de keuzelijst.
    const maanden = [];
    for (let [j, m] = EERSTE_MAAND.split("-").map(Number); `${j}-${String(m).padStart(2, "0")}-01` <= gisteren; m === 12 ? (j++, m = 1) : m++) {
      const van = `${j}-${String(m).padStart(2, "0")}-01`;
      const einde = new Date(Date.UTC(j, m, 0)).toISOString().slice(0, 10);
      const tot = einde < gisteren ? einde : gisteren;
      const maand = new Date(Date.UTC(j, m - 1, 15)).toLocaleString("nl-NL", { month: "long", timeZone: "UTC" });
      maanden.push({ id: `${maand}-${j}`, naam: `${maand[0].toUpperCase()}${maand.slice(1)} ${j}`, van, tot, ...(await dashboardPeriode(token, [{ startDate: van, endDate: tot }])) });
    }
    uit.perioden.push(...maanden.reverse());
    const doel = new URL("../data/ga-dashboard.json", import.meta.url);
    writeFileSync(doel, JSON.stringify(uit, null, 1) + "\n");
    console.log(`Dashboardcijfers geschreven: ${uit.perioden.map((p) => `${p.naam} (${p.overzicht.length} dagen)`).join(", ")}.`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  process.exit(0);
}

// Zoektermen komen niet via GA maar rechtstreeks uit Search Console (de cijfers lopen twee à drie dagen achter).
if (soort === "zoektermen") {
  const SITE_GSC = process.env.GSC_SITE || "https://www.cabaretiers.com/";
  const dag = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
  const pagina = args.includes("--pagina") ? args[args.indexOf("--pagina") + 1] : null;
  try {
    const token = await toegangstoken(sleutel(), "https://www.googleapis.com/auth/webmasters.readonly");
    const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_GSC)}/searchAnalytics/query`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        startDate: dag(dagen + 2), endDate: dag(2), dimensions: ["query"], rowLimit: 500,
        ...(pagina ? { dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: pagina }] }] } : {}),
      }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(`Search Console: ${j.error?.message || res.status}`);
    if (alsJson) { console.log(JSON.stringify(j, null, 2)); process.exit(0); }
    const rijen = j.rows || [];
    console.log(`Zoektermen, laatste ${dagen} dagen (t/m ${dag(2)})${pagina ? `, pagina ${pagina}` : ""}: ${rijen.length} termen`);
    console.log(["zoekterm", "vertoningen", "klikken", "ctr", "positie"].join("\t"));
    for (const x of rijen) console.log([x.keys[0], x.impressions, x.clicks, `${(x.ctr * 100).toFixed(1)}%`, x.position.toFixed(1)].join("\t"));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  process.exit(0);
}

if (!VERZOEKEN[soort]) { console.error(`Onbekend rapport "${soort}". Kies uit: ${Object.keys(VERZOEKEN).join(", ")}.`); process.exit(1); }

try {
  const token = await toegangstoken(sleutel());
  let r;
  try { r = await rapport(token, { ...VERZOEKEN[soort], dateRanges: periode }); } catch (e) {
    if (soort !== "tickets") throw e;
    console.error(`Eigen dimensies niet beschikbaar (${e.message}); totaal per pagina in plaats daarvan.`);
    r = await rapport(token, { ...TICKETS_EENVOUDIG, dateRanges: periode });
  }
  if (alsJson) { console.log(JSON.stringify(r, null, 2)); process.exit(0); }
  const kop = [...(r.dimensionHeaders || []).map((h) => h.name.replace("customEvent:", "")), ...(r.metricHeaders || []).map((h) => h.name)];
  const rijen = (r.rows || []).map((row) => [...(row.dimensionValues || []).map((v) => v.value), ...(row.metricValues || []).map((v) => v.value)]);
  console.log(`Rapport "${soort}", laatste ${dagen} dagen, property ${PROPERTY}: ${rijen.length} rijen`);
  console.log(kop.join("\t"));
  for (const rij of rijen) console.log(rij.join("\t"));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
