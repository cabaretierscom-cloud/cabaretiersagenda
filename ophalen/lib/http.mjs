// Beleefd ophalen: herkenbare user-agent, robots.txt respecteren, één verzoek tegelijk
// per site met een pauze ertussen, en cookies onthouden (sommige sites zetten eerst
// een cookie en sturen je dan door).

export const USER_AGENT = "Mozilla/5.0 (compatible; CabaretiersBot/0.1; +https://www.cabaretiers.com/over/)";
const PAUSE_MS = Number(process.env.OPHALEN_PAUZE_MS ?? 700);
const MAX_REDIRECTS = 10;

const cookies = new Map(); // host -> Map(name -> value)
const robots = new Map(); // origin -> Promise<{ rules, delay }>
const queues = new Map(); // host -> Promise (laatste verzoek)
const extraPauze = new Map(); // host -> ms, voor sites die rustiger benaderd willen worden

// Een bron kan een langere pauze voor een site instellen, bijv. stelPauzeIn("luxortheater.nl", 3000).
export function stelPauzeIn(host, ms) {
  extraPauze.set(host, ms);
}

function storeCookies(host, headers) {
  const list = headers.getSetCookie?.() || [];
  if (!list.length) return;
  const jar = cookies.get(host) || new Map();
  for (const c of list) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    if (i > 0) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
  cookies.set(host, jar);
}
const cookieHeader = (host) => [...(cookies.get(host) || [])].map(([k, v]) => `${k}=${v}`).join("; ");

async function rawFetch(url, opts = {}) {
  let current = new URL(url);
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const headers = { "user-agent": USER_AGENT, "accept-language": "nl-NL,nl;q=0.9", ...(opts.headers || {}) };
    const c = cookieHeader(current.host);
    if (c) headers.cookie = c;
    const res = await fetch(current, { headers, redirect: "manual", signal: AbortSignal.timeout(opts.timeout ?? 30000) });
    storeCookies(current.host, res.headers);
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      await res.arrayBuffer().catch(() => {});
      current = new URL(res.headers.get("location"), current);
      continue;
    }
    return { res, url: current.href };
  }
  throw new Error(`Te veel doorverwijzingen: ${url}`);
}

// robots.txt volgens de gangbare regels: de langste passende regel wint, Allow wint
// bij gelijke lengte, * en $ als jokertekens. Crawl-delay bepaalt de pauze per site.
function parseRobots(text) {
  const groups = [];
  let current = null, lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const i = line.indexOf(":");
    if (i < 0) continue;
    const key = line.slice(0, i).trim().toLowerCase(), val = line.slice(i + 1).trim();
    if (key === "user-agent") {
      if (!lastWasAgent) groups.push((current = { agents: [], rules: [], delay: null }));
      current.agents.push(val.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if ((key === "allow" || key === "disallow") && val) current.rules.push({ allow: key === "allow", path: val });
    else if (key === "crawl-delay" && !isNaN(Number(val))) current.delay = Number(val);
  }
  return groups.find((g) => g.agents.some((a) => a.includes("cabaretiers"))) || groups.find((g) => g.agents.includes("*")) || { rules: [], delay: null };
}
const patternToRegex = (p) =>
  new RegExp("^" + p.replace(/[.+?^{}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"));

async function robotsFor(origin) {
  if (!robots.has(origin)) {
    robots.set(origin, (async () => {
      try {
        const { res } = await rawFetch(`${origin}/robots.txt`, { timeout: 15000 });
        return res.ok ? parseRobots(await res.text()) : { rules: [], delay: null };
      } catch { return { rules: [], delay: null }; }
    })());
  }
  return robots.get(origin);
}

export async function allowedByRobots(url) {
  const u = new URL(url);
  const { rules } = await robotsFor(u.origin);
  const path = u.pathname + u.search;
  let best = null;
  for (const r of rules) {
    if (!patternToRegex(r.path).test(path)) continue;
    if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow)) best = r;
  }
  return !best || best.allow;
}

// Haalt een URL op als tekst. Gooit een fout met duidelijke melding bij weigering.
export async function get(url, opts = {}) {
  if (!(await allowedByRobots(url))) throw new Error(`robots.txt staat ${url} niet toe`);
  const { host, origin } = new URL(url);
  const { delay } = await robotsFor(origin);
  const pause = Math.max(PAUSE_MS, (delay || 0) * 1000, extraPauze.get(host) || 0);
  const prev = queues.get(host) || Promise.resolve();
  const run = prev.then(() => new Promise((r) => setTimeout(r, pause))).then(async () => {
    // Bij "te druk" (429/503) even wachten en opnieuw proberen, zoals de site vraagt.
    for (let poging = 1; ; poging++) {
      const { res, url: finalUrl } = await rawFetch(url, opts);
      const text = await res.text();
      if ((res.status === 429 || res.status === 503) && poging < 4) {
        const wacht = Math.min(120, Number(res.headers.get("retry-after")) || 10 * poging) * 1000;
        await new Promise((r) => setTimeout(r, wacht));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} voor ${url}`);
      return { text, url: finalUrl };
    }
  });
  queues.set(host, run.catch(() => {}));
  return run;
}

export async function getText(url, opts) {
  return (await get(url, opts)).text;
}

export async function getJson(url, opts) {
  return JSON.parse(await getText(url, { ...opts, headers: { accept: "application/json", ...(opts?.headers || {}) } }));
}
