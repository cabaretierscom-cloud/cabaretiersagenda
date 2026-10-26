// Filters op speellijsten, de zoekvelden op de artiesten- en plaatsenpagina en de knoppen van de affichewand.
// Alle pagina's werken ook zonder dit script: dan staat de volledige lijst er.
(() => {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });

  // Voorstellingen die sinds de laatste build zijn geweest, verbergen.
  document.querySelectorAll(".gig[data-datum], .poster[data-datum]").forEach((el) => {
    if (el.dataset.datum < today) el.hidden = true;
  });
  const syncGroups = () => document.querySelectorAll(".month-group").forEach((m) => {
    m.hidden = !m.querySelector(".gig:not([hidden])");
  });
  syncGroups();

  // Vanavond/dit weekend: de pagina is 's nachts gemaakt. Dagen die voorbij zijn verbergen en
  // "Vanavond"/"Morgen" opnieuw bepalen, voor het geval de nachtelijke update later is.
  const morgen = new Date(Date.now() + 864e5).toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
  document.querySelectorAll(".dag-regel[data-datum]").forEach((el) => { if (el.dataset.datum < today) el.hidden = true; });
  document.querySelectorAll(".dag-label[data-dag]").forEach((el) => {
    if (el.dataset.dag === today) el.textContent = "Vanavond";
    else if (el.dataset.dag === morgen) el.textContent = "Morgen";
  });
  const dagLeeg = document.getElementById("dag-leeg");
  if (dagLeeg && !document.querySelector("#gigs .gig:not([hidden])")) dagLeeg.hidden = false;

  // Op een smal scherm schuift het menu opzij; zet het huidige onderdeel in beeld.
  const actief = document.querySelector(".nav [aria-current]");
  const menu = actief?.parentElement;
  if (menu && menu.scrollWidth > menu.clientWidth) menu.scrollLeft = actief.offsetLeft - (menu.clientWidth - actief.offsetWidth) / 2;

  // ---------- Affichewand ----------
  const strip = document.getElementById("strip");
  if (strip) {
    const nav = strip.parentElement.querySelector(".strip-nav");
    const prev = document.getElementById("strip-prev"), next = document.getElementById("strip-next");
    const step = () => Math.max(300, strip.clientWidth * 0.8);
    prev.addEventListener("click", () => strip.scrollBy({ left: -step() }));
    next.addEventListener("click", () => strip.scrollBy({ left: step() }));
    const sync = () => {
      const scrollable = strip.scrollWidth > strip.clientWidth + 8;
      nav.hidden = !scrollable;
      prev.disabled = strip.scrollLeft < 8;
      next.disabled = strip.scrollLeft + strip.clientWidth > strip.scrollWidth - 8;
    };
    strip.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();

    // Op een touchscreen is er geen muis: daar licht de affiche op waar je naartoe veegt.
    const touch = matchMedia("(hover: none)");
    let frame = 0;
    const markeer = () => {
      frame = 0;
      const posters = [...strip.querySelectorAll(".poster:not([hidden])")];
      strip.classList.toggle("vegen", touch.matches);
      let actief = null;
      if (touch.matches && posters.length) {
        const links = strip.getBoundingClientRect().left;
        const opEinde = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4;
        actief = opEinde ? posters[posters.length - 1]
          : posters.reduce((a, p) => Math.abs(p.getBoundingClientRect().left - links) < Math.abs(a.getBoundingClientRect().left - links) ? p : a);
      }
      posters.forEach((p) => p.classList.toggle("actief", p === actief));
    };
    const plan = () => { if (!frame) frame = requestAnimationFrame(markeer); };
    strip.addEventListener("scroll", plan, { passive: true });
    window.addEventListener("resize", plan);
    touch.addEventListener("change", plan);
    markeer();
  }

  // ---------- Artiesten van A tot Z ----------
  const zoekArtiest = document.getElementById("f-artiest");
  if (zoekArtiest) {
    const items = [...document.querySelectorAll("#az li[data-naam]")];
    const leeg = document.getElementById("az-leeg");
    const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    zoekArtiest.addEventListener("input", () => {
      const q = norm(zoekArtiest.value.trim());
      let n = 0;
      for (const li of items) {
        const ok = !q || norm(li.dataset.naam).includes(q);
        li.hidden = !ok;
        if (ok) n++;
      }
      document.querySelectorAll(".az-group").forEach((g) => { g.hidden = !g.querySelector("li:not([hidden])"); });
      leeg.hidden = n > 0;
    });
  }

  // ---------- Plaatsen: zoeken op plaats of zaal ----------
  const zoekPlaats = document.getElementById("f-plaatsnaam");
  if (zoekPlaats) {
    const items = [...document.querySelectorAll("#plaatsenlijst li[data-zoek]")];
    const leeg = document.getElementById("plaatsen-leeg");
    const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    zoekPlaats.addEventListener("input", () => {
      const q = norm(zoekPlaats.value.trim());
      let n = 0;
      for (const li of items) {
        const ok = !q || norm(li.dataset.zoek).includes(q);
        li.hidden = !ok;
        if (ok) n++;
      }
      // Een land zonder treffers verdwijnt helemaal.
      document.querySelectorAll("#plaatsenlijst > div").forEach((d) => { d.hidden = !d.querySelector("li:not([hidden])"); });
      leeg.hidden = n > 0;
    });
  }

  // ---------- Video's ----------
  // Pas bij een klik de YouTube-speler laden (youtube-nocookie.com); daarvoor gaat er niets naar YouTube.
  document.querySelectorAll("a.video[data-youtube]").forEach((link) => {
    link.addEventListener("click", (ev) => {
      ev.preventDefault();
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(link.dataset.youtube)}?autoplay=1&rel=0`;
      iframe.title = link.querySelector(".video-titel")?.textContent || "Video";
      iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      iframe.className = "video-speler";
      link.replaceWith(iframe);
      iframe.focus();
    });
  });

  // ---------- Zet in je agenda ----------
  // Knop naast Tickets bij elke voorstelling met data-wat (niet bij geannuleerd of verplaatst):
  // Google Agenda als link, Apple en Outlook als .ics-bestand. Zonder tijd wordt het een hele dag;
  // met tijd rekenen we twee uur.
  const AGENDA_ICOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/></svg>';
  const twee = (n) => String(n).padStart(2, "0");
  // Lokale tijd in Amsterdam naar UTC (zomer- en wintertijd goed).
  function naarUtc(datum, tijd) {
    const [j, m, d] = datum.split("-").map(Number), [u, min] = tijd.split(":").map(Number);
    const gok = Date.UTC(j, m - 1, d, u, min);
    const delen = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(new Date(gok)).map((p) => [p.type, p.value]));
    const alsAmsterdam = Date.UTC(+delen.year, +delen.month - 1, +delen.day, +delen.hour, +delen.minute);
    return new Date(gok - (alsAmsterdam - gok));
  }
  const utcTekst = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  function agendaGegevens(rij) {
    const { wat, locatie, datum, tijd } = rij.dataset;
    const bron = rij.querySelector(".btn.tickets")?.href || location.href;
    const tekst = `Tickets en informatie: ${bron}\nGevonden op Cabaretiers.com`;
    if (tijd) {
      const start = naarUtc(datum, tijd);
      return { wat, locatie, bron, tekst, start: utcTekst(start), eind: utcTekst(new Date(start.getTime() + 2 * 36e5)), heleDag: false };
    }
    const volgende = new Date(Date.UTC(...datum.split("-").map((x, i) => Number(x) - (i === 1 ? 1 : 0))) + 864e5);
    return { wat, locatie, bron, tekst, start: datum.replace(/-/g, ""), eind: `${volgende.getUTCFullYear()}${twee(volgende.getUTCMonth() + 1)}${twee(volgende.getUTCDate())}`, heleDag: true };
  }
  function googleLink(e) {
    const p = new URLSearchParams({ action: "TEMPLATE", text: e.wat, dates: `${e.start}/${e.eind}`, details: e.tekst, location: e.locatie });
    return `https://calendar.google.com/calendar/render?${p}`;
  }
  function icsBestand(e, rij) {
    const veilig = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    const tijd = e.heleDag ? `DTSTART;VALUE=DATE:${e.start}\r\nDTEND;VALUE=DATE:${e.eind}` : `DTSTART:${e.start}\r\nDTEND:${e.eind}`;
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Cabaretiers.com//Agenda//NL", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      `UID:${rij.dataset.datum}-${Math.abs([...e.wat + e.locatie].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7))}@cabaretiers.com`,
      `DTSTAMP:${utcTekst(new Date())}`, tijd, `SUMMARY:${veilig(e.wat)}`, `LOCATION:${veilig(e.locatie)}`, `DESCRIPTION:${veilig(e.tekst)}`, `URL:${e.bron}`,
      "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    a.download = `${e.wat.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "voorstelling"}.ics`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  let openMenu = null;
  const sluitMenu = () => {
    if (!openMenu) return;
    openMenu.menu.hidden = true;
    openMenu.knop.setAttribute("aria-expanded", "false");
    openMenu = null;
  };
  document.querySelectorAll(".gig[data-wat] .knoppen").forEach((plek, i) => {
    const rij = plek.closest(".gig");
    const knop = document.createElement("button");
    knop.type = "button";
    knop.className = "btn ghost in-agenda";
    knop.setAttribute("aria-expanded", "false");
    knop.setAttribute("aria-controls", `agenda-menu-${i}`);
    knop.setAttribute("aria-label", `Zet in je agenda: ${rij.dataset.wat}`);
    knop.title = "Zet in je agenda";
    knop.innerHTML = AGENDA_ICOON;
    const menu = document.createElement("div");
    menu.className = "agenda-menu";
    menu.id = `agenda-menu-${i}`;
    menu.hidden = true;
    menu.innerHTML = '<a href="#" data-soort="google" target="_blank" rel="noopener">Google Agenda</a><button type="button" data-soort="ics">Apple of Outlook</button>';
    plek.prepend(knop);
    plek.append(menu);
    knop.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const was = openMenu?.menu === menu;
      sluitMenu();
      if (was) return;
      menu.querySelector("[data-soort=google]").href = googleLink(agendaGegevens(rij));
      menu.hidden = false;
      knop.setAttribute("aria-expanded", "true");
      openMenu = { menu, knop };
      menu.querySelector("a").focus();
    });
    menu.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (ev.target.closest("[data-soort=ics]")) icsBestand(agendaGegevens(rij), rij);
      if (ev.target.closest("[data-soort]")) sluitMenu();
    });
  });
  document.addEventListener("click", sluitMenu);
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape" || !openMenu) return;
    const { knop } = openMenu;
    sluitMenu();
    knop.focus();
  });

  // ---------- Filters op een speellijst ----------
  const form = document.getElementById("filters");
  if (!form) return;
  form.hidden = false;

  const rows = [...document.querySelectorAll("#gigs .gig")].filter((r) => !r.hidden);
  const veld = (id) => document.getElementById(id);
  const selects = { maand: veld("f-maand"), plaats: veld("f-plaats"), genre: veld("f-genre") };
  const q = veld("f-q");
  const chips = [...form.querySelectorAll(".chip")];
  const resultLine = veld("result-line");
  const empty = veld("empty");

  // Filterstand staat in de URL, zodat je een gefilterde lijst kunt delen.
  const params = new URLSearchParams(location.search);
  const state = { q: params.get("q") || "", land: params.get("land") || "", maand: "", plaats: "", genre: "" };
  for (const [k, el] of Object.entries(selects)) {
    if (!el) continue;
    el.value = params.get(k) || "";
    if (el.value !== (params.get(k) || "")) el.value = "";
    state[k] = el.value;
  }
  if (!chips.length || !["", "NL", "BE"].includes(state.land)) state.land = "";
  if (q) q.value = state.q;

  const telling = (shown) => shown === rows.length
    ? `${rows.length === 1 ? "1 voorstelling" : `Alle ${rows.length} voorstellingen`}`
    : `${shown} van ${rows.length} voorstellingen`;

  // Op een artiestpagina zoekt het veld alleen in plaats en zaal (data-waar), elders in alles (data-zoek).
  const zoekVeld = q?.dataset.veld || "zoek";
  const kaal = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  function apply() {
    const needle = kaal(state.q.trim());
    let shown = 0;
    for (const r of rows) {
      const ok =
        (!state.land || r.dataset.land === state.land) &&
        (!state.maand || r.dataset.datum.startsWith(state.maand)) &&
        (!state.plaats || r.dataset.plaats === state.plaats) &&
        (!state.genre || r.dataset.genre === state.genre) &&
        (!needle || kaal(r.dataset[zoekVeld] || "").includes(needle));
      r.hidden = !ok;
      if (ok) shown++;
    }
    syncGroups();
    chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.land === state.land)));
    resultLine.textContent = telling(shown);
    if (empty) empty.hidden = shown > 0;

    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(state)) if (v.trim()) p.set(k, v.trim());
    const qs = p.toString();
    history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  }

  let timer;
  if (q) q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => { state.q = q.value; apply(); }, 150); });
  for (const [k, el] of Object.entries(selects)) if (el) el.addEventListener("change", () => { state[k] = el.value; apply(); });
  chips.forEach((c) => c.addEventListener("click", () => { state.land = c.dataset.land; apply(); }));
  form.addEventListener("submit", (e) => e.preventDefault());
  const reset = veld("reset");
  if (reset) reset.addEventListener("click", () => {
    Object.keys(state).forEach((k) => (state[k] = ""));
    if (q) q.value = "";
    Object.values(selects).forEach((el) => { if (el) el.value = ""; });
    apply();
    if (q) q.focus();
  });

  // Alleen de URL bijwerken als er al een filter in stond; anders de lijst laten zoals hij is.
  if (location.search) apply();
  else resultLine.textContent = telling(rows.length);
})();
