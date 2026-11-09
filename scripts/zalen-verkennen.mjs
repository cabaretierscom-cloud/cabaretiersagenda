// Verkent de websites van zalen: robots.txt, sitemap, en welk systeem de site gebruikt (om te kiezen
// hoe een bron het programma kan lezen). Met de eigen beleefde ophaal-functie (robots.txt, pauze per site).
// Gebruik: node scripts/zalen-verkennen.mjs https://www.voorbeeld.be ...
import { get, allowedByRobots } from "../ophalen/lib/http.mjs";

const KENMERKEN = [
  ["Ticketmatic", /ticketmatic/i], ["Yesplan", /yesplan/i], ["Peppered", /peppered/i], ["Cre8ion", /cre8ion/i],
  ["WordPress", /wp-content|wp-json/i], ["Drupal", /drupal/i], ["Next.js", /__NEXT_DATA__|_next\/static/i],
  ["Nuxt", /__NUXT__|_nuxt\//i], ["Craft", /craftcms|cpresources/i], ["UiTdatabank-widget", /uitdatabank|cultuurnet|uitinvlaanderen|publiq/i],
  ["Ticketing.be/Ticketgang", /ticketgang|ticketing\.be/i], ["TicketMonster", /ticket\.monster/i],
  ["JSON-LD Event", /"@type"\s*:\s*"(Theater)?Event"/], ["Eventix", /eventix/i], ["Shopify", /shopify/i],
];

for (const basis of process.argv.slice(2)) {
  const uit = { site: basis };
  try {
    const robots = await get(new URL("/robots.txt", basis).href).then((r) => r.text).catch(() => "");
    uit.robotsAllesDicht = /^\s*Disallow:\s*\/\s*$/im.test(robots.split(/User-agent:\s*\*/i)[1]?.split(/User-agent:/i)[0] || "");
    uit.sitemaps = [...robots.matchAll(/^Sitemap:\s*(\S+)/gim)].map((m) => m[1]);
    const home = await get(basis).then((r) => r.text);
    uit.systemen = KENMERKEN.filter(([, re]) => re.test(home)).map(([n]) => n);
    uit.agendaLinks = [...new Set([...home.matchAll(/href="([^"]*(agenda|programma|voorstelling|kalender|events?)[^"]*)"/gi)].map((m) => m[1]))].slice(0, 5);
    if (!uit.sitemaps.length && (await allowedByRobots(new URL("/sitemap.xml", basis).href))) {
      const sm = await get(new URL("/sitemap.xml", basis).href).then((r) => r.text).catch(() => "");
      if (/<(urlset|sitemapindex)/.test(sm)) uit.sitemaps = ["/sitemap.xml"];
    }
  } catch (e) {
    uit.fout = e.message.slice(0, 120);
  }
  console.log(JSON.stringify(uit));
}
