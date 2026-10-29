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
  for (const strip of document.querySelectorAll(".strip")) {
    const nav = strip.parentElement.querySelector(".strip-nav");
    const prev = nav.querySelector(".strip-prev"), next = nav.querySelector(".strip-next");
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

  // ---------- Plaatsen en theaters: zoeken op plaats of zaal ----------
  const zoekInLijst = (veld, lijst, leegId) => {
    const zoek = document.getElementById(veld), box = document.getElementById(lijst);
    if (!zoek || !box) return;
    const items = [...box.querySelectorAll("li[data-zoek]")];
    const leeg = document.getElementById(leegId);
    const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    zoek.addEventListener("input", () => {
      const q = norm(zoek.value.trim());
      let n = 0;
      for (const li of items) {
        const ok = !q || norm(li.dataset.zoek).includes(q);
        li.hidden = !ok;
        if (ok) n++;
      }
      // Een stad of land zonder treffers verdwijnt helemaal.
      box.querySelectorAll(".stad").forEach((d) => { d.hidden = !d.querySelector("li:not([hidden])"); });
      box.querySelectorAll(":scope > div").forEach((d) => { d.hidden = !d.querySelector("li:not([hidden])"); });
      leeg.hidden = n > 0;
    });
  };
  zoekInLijst("f-plaatsnaam", "plaatsenlijst", "plaatsen-leeg");
  zoekInLijst("f-theater", "theaterlijst", "theaters-leeg");

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
  let agendaNr = 0;
  const agendaKnoppen = (root) => root.querySelectorAll(".gig[data-wat] .knoppen").forEach((plek) => {
    if (plek.querySelector(".in-agenda")) return;
    const i = agendaNr++;
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
  agendaKnoppen(document);
  document.addEventListener("click", sluitMenu);
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape" || !openMenu) return;
    const { knop } = openMenu;
    sluitMenu();
    knop.focus();
  });

  // ---------- Maandpagina per week ----------
  // Eerst één week, met één knop voor de rest van de maand; zoeken of filteren toont alle weken.
  const perWeek = document.querySelector("#gigs[data-per-week]");
  const weekKnop = document.getElementById("volgende-week");
  const toonWeken = (n) => {
    if (!perWeek) return;
    const weken = [...perWeek.querySelectorAll(".week-groep")];
    weken.forEach((w, i) => w.classList.toggle("later", i >= n));
    const volgende = weken[n];
    perWeek.toggleAttribute("data-ingeklapt", Boolean(volgende));
    document.getElementById("meer-weken").hidden = !volgende;
    if (volgende) weekKnop.textContent = `Toon alle volgende voorstellingen (${weken.slice(n).reduce((a, w) => a + w.querySelectorAll(".gig").length, 0)})`;
    // Telling onder het filter: hoeveel er nu te zien zijn van de hele maand.
    const regel = document.getElementById("result-line");
    if (regel && volgende) {
      const alle = perWeek.querySelectorAll(".gig").length, zichtbaar = weken.slice(0, n).reduce((a, w) => a + w.querySelectorAll(".gig").length, 0);
      regel.textContent = `${zichtbaar} van ${alle} voorstellingen (${n === 1 ? "eerste week" : `eerste ${n} weken`})`;
    }
    else if (regel && /\(eerste/.test(regel.textContent)) regel.textContent = `Alle ${perWeek.querySelectorAll(".gig").length} voorstellingen`;
    document.querySelectorAll(".week-nav a").forEach((a) => a.setAttribute("aria-current", String(weken.slice(0, n).some((w) => `#${w.id}` === a.getAttribute("href")))));
  };
  let weekenZichtbaar = 1;
  if (perWeek && !location.search) {
    toonWeken(1);
    weekKnop.addEventListener("click", () => toonWeken(weekenZichtbaar = Infinity));
    // Een week kiezen toont de weken tot en met die week.
    document.querySelectorAll(".week-nav a").forEach((a) => a.addEventListener("click", () => {
      const weken = [...perWeek.querySelectorAll(".week-groep")];
      const i = weken.findIndex((w) => `#${w.id}` === a.getAttribute("href"));
      if (i >= weekenZichtbaar) toonWeken(weekenZichtbaar = i + 1);
    }));
  }

  // ---------- /agenda/: alle voorstellingen, eerst een week, dan de rest ----------
  // De pagina bevat de eerste week. De rest staat in /agenda/alles.js (JSON); "Toon alle volgende voorstellingen" voegt
  // in één keer de rest toe, en zoeken of filteren gebeurt in alle voorstellingen. De rijen hebben dezelfde
  // opmaak als gigRow() in src/templates.mjs.
  const alles = document.querySelector("#gigs[data-alles]");
  if (alles) {
    const form = document.getElementById("filters");
    if (form) form.hidden = false;
    const q = document.getElementById("f-q"), genre = document.getElementById("f-genre"), vinkUit = document.getElementById("f-uitverkocht");
    const regel = document.getElementById("result-line"), leeg = document.getElementById("empty");
    const laadMeer = document.getElementById("laad-meer"), laadKnop = document.getElementById("laad-week"), naarMaand = document.getElementById("naar-maand");
    const kaal = (t) => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    const nl = (o) => new Intl.DateTimeFormat("nl-NL", o);
    const fDag = nl({ day: "numeric", month: "long" }), fVol = nl({ day: "numeric", month: "long", year: "numeric" }), fKort = nl({ weekday: "short" });
    const d = (iso) => new Date(iso + "T12:00:00");
    const maandag = (iso) => { const x = new Date(iso + "T12:00:00Z"); return new Date(x.getTime() - ((x.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10); };
    const zondag = (iso) => new Date(new Date(maandag(iso) + "T12:00:00Z").getTime() + 6 * 864e5).toISOString().slice(0, 10);
    const label = (van, tot) => van === tot ? fDag.format(d(van)) : van.slice(0, 7) === tot.slice(0, 7) ? `${d(van).getDate()} – ${fDag.format(d(tot))}` : `${fDag.format(d(van))} – ${fDag.format(d(tot))}`;
    const aantal = (n) => `${n} ${n === 1 ? "voorstelling" : "voorstellingen"}`;

    let data = null, laden = null;
    const haal = () => laden || (laden = fetch(alles.dataset.alles).then((r) => r.json()).then((j) => {
      data = j;
      data.rijen = j.r.map(([datum, tijd, vn, zn, status, soort, bron, opmerking]) => {
        const v = j.v[vn], z = j.z[zn];
        const namen = v[0].map((i) => j.a[i][1]);
        return { datum, tijd, v, z, status, soort, bron, opmerking, genre: v[4], zoek: kaal([v[1], z[1], z[2], ...namen].join(" ")) };
      });
      return data;
    }));

    function rijHtml(g) {
      const [ais, titel, echte, pad, , kleur] = g.v, [zid, znaam, plaats, pid, land] = g.z;
      const namen = ais.map((i) => data.a[i][1]).join(" & ");
      // data.a[i][0] is het adres van de artiest (of het festival); een oud bestand heeft nog de id.
      const adres = (x) => (x.startsWith("/") ? x : `/artiesten/${x}/`);
      const artiesten = ais.map((i) => `<a href="${adres(data.a[i][0])}">${esc(data.a[i][1])}</a>`).join(" &amp; ") || esc(titel);
      const show = !ais.length ? esc(znaam) : echte ? (pad ? `<a href="${pad}">${esc(echte)}</a>` : esc(echte)) : "";
      const wat = ais.length ? [namen, echte].filter(Boolean).join(": ") : titel;
      const inAgenda = ["geannuleerd", "verplaatst"].includes(g.status) ? "" : ` data-wat="${esc(wat)}" data-locatie="${esc(`${znaam}, ${plaats}`)}"${g.tijd ? ` data-tijd="${g.tijd}"` : ""}`;
      const status = g.status === "uitverkocht" ? '<span class="status sold stempel">Uitverkocht</span>'
        : g.status === "onzeker" ? `<span class="status doubt"${g.opmerking ? ` title="${esc(g.opmerking)}"` : ""}>${data.iconen.doubt}Datum onzeker</span>`
        : ["geannuleerd", "verplaatst"].includes(g.status) ? `<span class="status sold">${data.iconen.sold}${esc(data.statussen[g.status])}</span>` : "";
      const kopen = !["uitverkocht", "geannuleerd", "verplaatst"].includes(g.status);
      const ticket = `<a class="btn tickets${kopen ? "" : " ghost"}" href="${esc(g.bron)}" target="_blank" rel="noopener nofollow"><span class="ticket-tekst">${kopen ? "Tickets" : "Meer info"}</span><span class="ticket-strook">${data.iconen.extern}</span><span class="visually-hidden">: ${esc(namen || titel)} op ${fVol.format(d(g.datum))} in ${esc(znaam)} (externe website, opent in een nieuw tabblad)</span></a>`;
      return `<article class="gig${g.status === "geannuleerd" ? " cancelled" : ""}" data-datum="${g.datum}" data-genre="${g.genre}" data-status="${g.status}"${inAgenda}>
      <div class="date"><b>${d(g.datum).getDate()}</b><small>${fKort.format(d(g.datum)).replace(".", "")}${g.tijd ? " " + g.tijd : ""}</small></div>
      <div class="main"><span class="swatch" style="${kleur};background:var(--bg)" aria-hidden="true"></span><div class="main-text"><span class="artist">${artiesten}</span><span class="show">${show}${g.soort ? ` <span class="pill">${esc(g.soort)}</span>` : ""}</span></div></div>
      <div class="venue"><a href="/theaters/${zid}/">${esc(znaam)}</a><span><a href="/plaatsen/${pid}/">${esc(plaats)}</a>, ${esc(land)}</span></div>
      <div class="side">${status}<div class="knoppen">${ticket}</div></div>
    </article>`;
    }

    // Stand van de filters (ook in het webadres, zodat je een zoekopdracht kunt delen).
    const params = new URLSearchParams(location.search);
    const stand = { q: params.get("q") || "", genre: params.get("genre") || "", uitverkocht: params.get("uitverkocht") === "1" ? "1" : "" };
    if (q) q.value = stand.q;
    if (genre) { genre.value = stand.genre; if (genre.value !== stand.genre) stand.genre = genre.value = ""; }
    if (vinkUit) vinkUit.checked = stand.uitverkocht === "1";
    const gefilterd = () => Boolean(stand.q.trim() || stand.genre || stand.uitverkocht);

    let lijst = [], weken = [], getoond = 0;
    // Groepeer per week (maandag t/m zondag); de eerste week begint bij de eerste voorstelling.
    const perWeek = (rijen) => {
      const m = new Map();
      for (const g of rijen) { const w = maandag(g.datum); if (!m.has(w)) m.set(w, []); m.get(w).push(g); }
      return [...m.values()];
    };
    const weekHtml = (rijen) => `<section class="month-group week-groep"><h3>${label(rijen[0].datum, rijen.at(-1).datum > zondag(rijen[0].datum) ? rijen.at(-1).datum : zondag(rijen[0].datum))} <small>${aantal(rijen.length)}</small></h3>${rijen.map(rijHtml).join("")}</section>`;
    const toonWeek = (w) => {
      const plek = document.createElement("div");
      plek.innerHTML = weekHtml(w);
      const sectie = plek.firstElementChild;
      alles.append(sectie);
      agendaKnoppen(sectie);
    };
    // Alle volgende weken in één keer, maar in porties van een paar weken per keer, zodat de pagina
    // niet vastloopt; een nieuwe zoekopdracht (ronde) stopt het lopende werk.
    let ronde = 0;
    const toonRest = () => {
      const mijn = ++ronde;
      laadMeer.hidden = true;
      const stap = () => {
        if (mijn !== ronde) return;
        for (let i = 0; i < 4 && getoond < weken.length; i++) toonWeek(weken[getoond++]);
        werkKnopBij(true);
        if (getoond < weken.length) setTimeout(stap, 0);
      };
      stap();
    };
    const werkKnopBij = (bezig = false) => {
      const rest = weken.slice(getoond).reduce((n, w) => n + w.length, 0);
      laadMeer.hidden = bezig || !rest;
      if (rest) laadKnop.textContent = `Toon alle volgende voorstellingen (${rest})`;
      const zichtbaar = weken.slice(0, getoond).reduce((n, w) => n + w.length, 0);
      regel.textContent = gefilterd() ? `${aantal(lijst.length)} gevonden${rest ? `, ${zichtbaar} getoond` : ""}` : `${zichtbaar} van ${aantal(+alles.dataset.totaal)}`;
      if (leeg) leeg.hidden = !gefilterd() || lijst.length > 0;
      if (naarMaand) naarMaand.hidden = gefilterd();
    };

    async function pasToe() {
      const p = new URLSearchParams();
      for (const [k, v] of Object.entries(stand)) if (v.trim()) p.set(k, v.trim());
      history.replaceState(null, "", p.toString() ? `?${p}` : location.pathname);
      if (!gefilterd() && !data) return;
      await haal();
      const naald = kaal(stand.q.trim());
      lijst = data.rijen.filter((g) => g.datum >= today && (!naald || g.zoek.includes(naald)) && (!stand.genre || g.genre === stand.genre) && (!stand.uitverkocht || g.status !== "uitverkocht"));
      weken = perWeek(lijst); getoond = 0; ronde++;
      alles.innerHTML = "";
      if (weken.length) toonWeek(weken[getoond++]);
      werkKnopBij();
    }

    // Zonder filter: de eerste week staat al in de pagina; de knop toont alles vanaf de week erna.
    const begin = () => {
      const eersteWeek = document.querySelectorAll("#gigs .gig").length;
      lijst = []; weken = [{ length: eersteWeek, server: true }]; getoond = 1;
      laadMeer.hidden = false;
      laadKnop.textContent = "Toon alle volgende voorstellingen";
      regel.textContent = `${eersteWeek} van ${aantal(+alles.dataset.totaal)}`;
    };
    laadKnop.addEventListener("click", async () => {
      if (weken[0]?.server) {
        laadKnop.disabled = true;
        await haal();
        lijst = data.rijen.filter((g) => g.datum >= today);
        const tot = alles.dataset.tot;
        weken = [{ length: lijst.filter((g) => g.datum <= tot).length }, ...perWeek(lijst.filter((g) => g.datum > tot))];
        getoond = 1;
        laadKnop.disabled = false;
      }
      toonRest();
    });
    let timer;
    if (q) {
      q.addEventListener("focus", haal, { once: true });
      q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => { stand.q = q.value; pasToe(); }, 200); });
    }
    if (genre) genre.addEventListener("change", () => { stand.genre = genre.value; pasToe(); });
    if (vinkUit) vinkUit.addEventListener("change", () => { stand.uitverkocht = vinkUit.checked ? "1" : ""; pasToe(); });
    form?.addEventListener("submit", (e) => e.preventDefault());
    document.getElementById("reset")?.addEventListener("click", () => {
      stand.q = stand.genre = stand.uitverkocht = "";
      if (q) q.value = ""; if (genre) genre.value = ""; if (vinkUit) vinkUit.checked = false;
      pasToe();
    });
    if (gefilterd()) pasToe(); else begin();
    return;
  }

  // ---------- Filters op een speellijst ----------
  const form = document.getElementById("filters");
  if (!form) return;
  form.hidden = false;

  const rows = [...document.querySelectorAll("#gigs .gig")].filter((r) => !r.hidden);
  const veld = (id) => document.getElementById(id);
  const selects = { maand: veld("f-maand"), genre: veld("f-genre") };
  const q = veld("f-q");
  const vinkUit = veld("f-uitverkocht");
  const resultLine = veld("result-line");
  const empty = veld("empty");

  // Filterstand staat in de URL, zodat je een gefilterde lijst kunt delen.
  const params = new URLSearchParams(location.search);
  const state = { q: params.get("q") || "", maand: "", genre: "", uitverkocht: vinkUit && params.get("uitverkocht") === "1" ? "1" : "" };
  for (const [k, el] of Object.entries(selects)) {
    if (!el) continue;
    el.value = params.get(k) || "";
    if (el.value !== (params.get(k) || "")) el.value = "";
    state[k] = el.value;
  }
  if (q) q.value = state.q;
  if (vinkUit) vinkUit.checked = state.uitverkocht === "1";

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
        (!state.maand || r.dataset.datum.startsWith(state.maand)) &&
        (!state.genre || r.dataset.genre === state.genre) &&
        (!state.uitverkocht || r.dataset.status !== "uitverkocht") &&
        (!needle || kaal(r.dataset[zoekVeld] || "").includes(needle));
      r.hidden = !ok;
      if (ok) shown++;
    }
    if (perWeek && Object.values(state).some((v) => v)) toonWeken(Infinity);
    syncGroups();
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
  if (vinkUit) vinkUit.addEventListener("change", () => { state.uitverkocht = vinkUit.checked ? "1" : ""; apply(); });
  form.addEventListener("submit", (e) => e.preventDefault());
  const reset = veld("reset");
  if (reset) reset.addEventListener("click", () => {
    Object.keys(state).forEach((k) => (state[k] = ""));
    if (q) q.value = "";
    Object.values(selects).forEach((el) => { if (el) el.value = ""; });
    if (vinkUit) vinkUit.checked = false;
    apply();
    if (q) q.focus();
  });

  // Alleen de URL bijwerken als er al een filter in stond; anders de lijst laten zoals hij is.
  if (location.search) apply();
  else {
    resultLine.textContent = telling(rows.length);
    if (perWeek) toonWeken(weekenZichtbaar);
  }
})();
