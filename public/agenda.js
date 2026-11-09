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
  document.querySelectorAll(".dag-kaart[data-datum]").forEach((el) => { if (el.dataset.datum < today) el.hidden = true; });
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
      const posters = [...strip.querySelectorAll(".poster:not([hidden]), .artist-card, .dag-kaart:not([hidden])")];
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

  // ---------- Genrekeuze (#f-genre) ----------
  // Een uitklapvak met vinkjes: meerdere genres tegelijk, in het adres als ?genre=cabaret,stand-up.
  // In de balk staan de gekozen genres en het aantal voorstellingen dat erbij hoort.
  // Oude links met ?genre=theaterkomedie (zo heette komedie tot november 2026) werken ook.
  // Kindervoorstellingen staan standaard uit (sinds november 2026): zonder vinkje zie je alles behalve
  // voorstellingen met kindervoorstellingen als hoofdgenre. Wie het vinkje zet, ziet ze wel. Op pagina's met
  // alleen kindervoorstellingen (de genrepagina, een kindergezelschap) zet de server data-kinder op 0.
  const KIND = "kindervoorstellingen";
  // Zoveel voorstellingen per keer in een lijst; de knop "Toon meer voorstellingen" toont de volgende portie.
  const PORTIE = 50;
  const leesGenres = (t) => (t || "").split(",").map((x) => x.trim().replace(/^theaterkomedie$/, "komedie")).filter(Boolean);
  const adres = (p) => p.toString().replace(/%2C/g, ",");
  function genreKeuze(bijWijziging) {
    const el = document.getElementById("f-genre");
    if (!el) return null;
    const vakjes = [...el.querySelectorAll('input[type="checkbox"]')];
    const tekst = el.querySelector(".keuze-tekst"), teller = el.querySelector("summary .keuze-n");
    const waarde = () => vakjes.filter((v) => v.checked).map((v) => v.value);
    const kinder = +el.dataset.kinder || 0;
    const label = () => {
      const gekozen = vakjes.filter((v) => v.checked);
      tekst.textContent = gekozen.length ? gekozen.map((v) => v.nextElementSibling.firstChild.textContent).join(", ") : kinder ? "Zonder kindervoorstellingen" : "Alle genres";
      el.classList.toggle("kind-uit", Boolean(kinder) && !gekozen.length);
      el.classList.toggle("gekozen", gekozen.length > 0);
    };
    vakjes.forEach((v) => v.addEventListener("change", () => { label(); bijWijziging(waarde()); }));
    document.addEventListener("click", (e) => { if (el.open && !el.contains(e.target)) el.open = false; });
    el.addEventListener("keydown", (e) => { if (e.key === "Escape" && el.open) { el.open = false; el.querySelector("summary").focus(); } });
    return {
      zet(lijst) { const s = new Set(lijst); vakjes.forEach((v) => (v.checked = s.has(v.value))); label(); return waarde(); },
      aantal(n) { teller.textContent = n.toLocaleString("nl-NL"); },
      totaal: +el.dataset.totaal - kinder,
      // Zonder vinkjes: hoort deze voorstelling erbij? (genres: hoofdgenre eerst)
      standaard: (genres) => !kinder || genres[0] !== KIND,
      kinder,
    };
  }

  // ---------- /agenda/: alle voorstellingen, eerst een week, dan de rest ----------
  // De pagina bevat de eerste week. De rest staat in /agenda/alles.js (JSON); "Toon alle volgende voorstellingen" voegt
  // in één keer de rest toe, en zoeken of filteren gebeurt in alle voorstellingen. De rijen hebben dezelfde
  // opmaak als gigRow() in src/templates.mjs.
  const alles = document.querySelector("#gigs[data-alles]");
  if (alles) {
    const form = document.getElementById("filters");
    if (form) form.hidden = false;
    const q = document.getElementById("f-q"), vinkUit = document.getElementById("f-uitverkocht");
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
        return { datum, tijd, v, z, status, soort, bron, opmerking, genre: v[4], genres: [v[4], ...(v[6] || [])], zoek: kaal([v[1], z[1], z[2], ...namen].join(" ")) };
      });
      return data;
    }));

    function rijHtml(g) {
      const [ais, titel, echte, pad, , kleur] = g.v, [zid, znaam, plaats, pid, land] = g.z;
      const namen = ais.map((i) => data.a[i][1]).join(" & ");
      // data.a[i][0] is het adres van de artiest (of het festival); een oud bestand heeft nog de id.
      const adres = (x) => (x.startsWith("/") ? x : `/artiesten/${x}/`);
      const artiesten = ais.map((i) => `<a href="${adres(data.a[i][0])}">${esc(data.a[i][1])}</a>`).join(" &amp; ") || esc(titel);
      // Zelfde opmaak als gigRow()/rijLabels() in src/templates.mjs: titel tussen aanhalingstekens, dan de labels.
      const titelHtml = ais.length && echte ? `<span class="titel">${pad ? `<a href="${pad}">${esc(echte)}</a>` : esc(echte)}</span>` : "";
      const comedyavond = !ais.length && g.genres.some((x) => x === "stand-up" || x === "open-mic");
      const labels = [
        g.soort && g.soort !== "reprise" && g.soort !== vastSoort ? `<span class="label-soort">${esc(g.soort)}</span>` : "",
        comedyavond ? `<span class="label-genre">Comedyavond</span>` : "",
        ...g.genres.filter((x) => x !== vastGenre).map((x) => `<span class="label-genre">${esc(data.genres?.[x] || x)}</span>`),
      ].join("");
      const wat = ais.length ? [namen, echte].filter(Boolean).join(": ") : titel;
      const inAgenda = ["geannuleerd", "verplaatst"].includes(g.status) ? "" : ` data-wat="${esc(wat)}" data-locatie="${esc(`${znaam}, ${plaats}`)}"${g.tijd ? ` data-tijd="${g.tijd}"` : ""}`;
      const status = g.status === "uitverkocht" ? '<span class="status sold stempel">Uitverkocht</span>'
        : g.status === "onzeker" ? `<span class="status doubt"${g.opmerking ? ` title="${esc(g.opmerking)}"` : ""}>${data.iconen.doubt}Datum onzeker</span>`
        : ["geannuleerd", "verplaatst"].includes(g.status) ? `<span class="status sold">${data.iconen.sold}${esc(data.statussen[g.status])}</span>` : "";
      const kopen = !["uitverkocht", "geannuleerd", "verplaatst"].includes(g.status);
      // Zelfde gegevens voor de klikmeting als ticketData() in src/templates.mjs.
      const meet = ` data-theater="${esc(znaam)}" data-plaats="${esc(plaats)}" data-artiest="${esc(namen)}" data-voorstelling="${esc(titel)}" data-genre="${esc(g.genre)}" data-speeldatum="${g.datum}"`;
      const ticket = `<a class="btn tickets${kopen ? "" : " ghost"}" href="${esc(g.bron)}" target="_blank" rel="noopener nofollow"${meet}><span class="ticket-tekst">${kopen ? "Tickets" : "Meer info"}</span><span class="ticket-strook">${data.iconen.extern}</span><span class="visually-hidden">: ${esc(namen || titel)} op ${fVol.format(d(g.datum))} in ${esc(znaam)} (externe website, opent in een nieuw tabblad)</span></a>`;
      return `<article class="gig${g.status === "geannuleerd" ? " cancelled" : ""}" data-datum="${g.datum}" data-genre="${g.genres.join(" ")}" data-status="${g.status}"${inAgenda}>
      <div class="date"><b>${d(g.datum).getDate()}</b><small>${fKort.format(d(g.datum)).replace(".", "")}${g.tijd ? " " + g.tijd : ""}</small></div>
      <div class="main"><span class="swatch" style="${kleur};background:var(--bg)" aria-hidden="true"></span><div class="main-text"><span class="artist">${artiesten}</span><span class="show">${titelHtml}${labels}</span></div></div>
      <div class="venue"><a href="/theaters/${zid}/">${data.iconen.pin || ""}<span class="visually-hidden">Theater: </span>${esc(znaam)}</a><span><a href="/theaters-in-${pid}/">${esc(plaats)}</a>, ${esc(land)}</span></div>
      <div class="side">${status}<div class="knoppen">${ticket}</div></div>
    </article>`;
    }

    // Stand van de filters (ook in het webadres, zodat je een zoekopdracht kunt delen).
    const params = new URLSearchParams(location.search);
    // soort (zoals try-out) heeft geen eigen veld: alleen via het adres, vanaf /agenda/try-outs/.
    const stand = { q: params.get("q") || "", genre: params.get("genre") || "", uitverkocht: params.get("uitverkocht") === "1" ? "1" : "", soort: params.get("soort") || "" };
    if (q) q.value = stand.q;
    // Op een genrepagina of /agenda/try-outs/ zoekt het script alleen binnen dat genre of die soort.
    const vastGenre = alles.dataset.vastGenre, vastSoort = alles.dataset.vastSoort;
    const inVast = (g) => (!vastGenre || g.genres.includes(vastGenre)) && (!vastSoort || (g.soort === vastSoort && g.status !== "geannuleerd"));
    const genre = genreKeuze((w) => { stand.genre = w.join(","); pasToe(); });
    stand.genre = genre ? genre.zet(leesGenres(stand.genre)).join(",") : "";
    if (vinkUit) vinkUit.checked = stand.uitverkocht === "1";
    const gefilterd = () => Boolean(stand.q.trim() || stand.genre || stand.uitverkocht || stand.soort);

    // Per keer 50 voorstellingen (PORTIE), met een knop voor de volgende 50; ook bij zoeken en filteren.
    // Zonder filter staan de eerste voorstellingen al in de pagina (zonder JavaScript is dat de lijst);
    // de knop laadt dan alles uit /agenda/alles.js en toont de volgende 50.
    let lijst = [], getoond = 0, uitPagina = true;
    const telAlles = () => +alles.dataset.totaal - (genre?.kinder || 0);
    // Rijen toevoegen tot en met nummer n, per week onder een kop (een week kan over twee porties lopen).
    const toonTot = (n) => {
      const doel = Math.min(n, lijst.length);
      let sectie = alles.lastElementChild;
      const nieuw = [];
      for (; getoond < doel; getoond++) {
        const g = lijst[getoond], w = maandag(g.datum);
        if (!sectie || sectie.dataset.week !== w) {
          const zelfdeWeek = lijst.filter((x) => maandag(x.datum) === w);
          const eind = zelfdeWeek.at(-1).datum > zondag(w) ? zelfdeWeek.at(-1).datum : zondag(w);
          const plek = document.createElement("div");
          plek.innerHTML = `<section class="month-group week-groep" data-week="${w}"><h3>${label(zelfdeWeek[0].datum, eind)} <small>${aantal(zelfdeWeek.length)}</small></h3></section>`;
          sectie = plek.firstElementChild;
          alles.append(sectie);
          nieuw.push(sectie);
        }
        sectie.insertAdjacentHTML("beforeend", rijHtml(g));
      }
      for (const x of new Set([...nieuw, sectie].filter(Boolean))) agendaKnoppen(x);
      werkKnopBij();
    };
    const werkKnopBij = () => {
      const totaal = uitPagina ? telAlles() : lijst.length;
      const zichtbaar = uitPagina ? alles.querySelectorAll(".gig:not([hidden])").length : getoond;
      const rest = totaal - zichtbaar;
      laadMeer.hidden = rest <= 0;
      if (rest > 0) laadKnop.textContent = `Toon meer voorstellingen (${Math.min(PORTIE, rest)} van ${rest})`;
      regel.textContent = gefilterd() ? `${aantal(lijst.length)} gevonden${rest > 0 ? `, ${zichtbaar} getoond` : ""}` : `${zichtbaar} van ${aantal(totaal)}`;
      if (leeg) leeg.hidden = !gefilterd() || lijst.length > 0;
      if (naarMaand) naarMaand.hidden = gefilterd();
    };

    async function pasToe() {
      const p = new URLSearchParams();
      for (const [k, v] of Object.entries(stand)) if (v.trim()) p.set(k, v.trim());
      history.replaceState(null, "", p.toString() ? `?${adres(p)}` : location.pathname);
      if (!gefilterd() && uitPagina) { if (genre) genre.aantal(genre.totaal); return begin(); }
      await haal();
      const naald = kaal(stand.q.trim()), kies = new Set(leesGenres(stand.genre));
      const inGenre = (g) => (kies.size ? g.genres.some((x) => kies.has(x)) : !genre || genre.standaard(g.genres));
      if (genre) genre.aantal(kies.size ? data.rijen.filter((g) => g.datum >= today && inVast(g) && inGenre(g)).length : genre.totaal);
      lijst = data.rijen.filter((g) => g.datum >= today && inVast(g) && (!naald || g.zoek.includes(naald)) && inGenre(g) && (!stand.soort || g.soort === stand.soort) && (!stand.uitverkocht || g.status !== "uitverkocht"));
      uitPagina = false; getoond = 0;
      alles.innerHTML = "";
      toonTot(PORTIE);
    }

    // Zonder filter: de voorstellingen uit de pagina zelf, de eerste 50 zichtbaar.
    const begin = () => {
      const rijen = [...alles.querySelectorAll(".gig")];
      let n = 0;
      for (const r of rijen) {
        const mag = r.dataset.datum >= today && (!genre || genre.standaard((r.dataset.genre || "").split(" ")));
        r.hidden = !mag || n >= PORTIE;
        if (mag) n++;
      }
      for (const groep of alles.querySelectorAll(".month-group")) groep.hidden = !groep.querySelector(".gig:not([hidden])");
      if (genre) genre.aantal(genre.totaal);
      werkKnopBij();
    };
    laadKnop.addEventListener("click", async () => {
      laadKnop.disabled = true;
      if (uitPagina) {
        // Nog verborgen rijen in de pagina? Eerst die; anders alles laden en verder vanaf daar.
        const verborgen = [...alles.querySelectorAll(".gig[hidden]")].filter((r) => r.dataset.datum >= today && (!genre || genre.standaard((r.dataset.genre || "").split(" "))));
        const zichtbaar = alles.querySelectorAll(".gig:not([hidden])").length;
        if (verborgen.length >= PORTIE || (verborgen.length && zichtbaar + verborgen.length >= telAlles())) {
          verborgen.slice(0, PORTIE).forEach((r) => (r.hidden = false));
          for (const groep of alles.querySelectorAll(".month-group")) groep.hidden = !groep.querySelector(".gig:not([hidden])");
          werkKnopBij();
        } else {
          await haal();
          lijst = data.rijen.filter((g) => g.datum >= today && inVast(g) && (!genre || genre.standaard(g.genres)));
          uitPagina = false; getoond = 0;
          alles.innerHTML = "";
          toonTot(zichtbaar + PORTIE);
        }
      } else toonTot(getoond + PORTIE);
      laadKnop.disabled = false;
    });
    let timer;
    if (q) {
      q.addEventListener("focus", haal, { once: true });
      q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => { stand.q = q.value; pasToe(); }, 200); });
    }
    if (vinkUit) vinkUit.addEventListener("change", () => { stand.uitverkocht = vinkUit.checked ? "1" : ""; pasToe(); });
    form?.addEventListener("submit", (e) => e.preventDefault());
    document.getElementById("reset")?.addEventListener("click", () => {
      stand.q = stand.genre = stand.uitverkocht = stand.soort = "";
      if (q) q.value = ""; if (genre) genre.zet([]); if (vinkUit) vinkUit.checked = false;
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
  const selects = { maand: veld("f-maand") };
  const q = veld("f-q");
  const vinkUit = veld("f-uitverkocht");
  const resultLine = veld("result-line");
  const empty = veld("empty");
  // Per keer 50 voorstellingen met een knop voor de volgende 50 (niet op maandpagina's: die tonen per week).
  let limiet = PORTIE;
  const gigs = document.getElementById("gigs");
  const meer = document.createElement("p");
  meer.className = "meer-weken";
  meer.hidden = true;
  meer.innerHTML = '<button type="button" class="btn">Toon meer voorstellingen</button>';
  gigs?.after(meer);
  meer.querySelector("button").addEventListener("click", () => { limiet += PORTIE; apply(); });

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
  const genre = genreKeuze((w) => { state.genre = w.join(","); opnieuw(); });
  if (genre) state.genre = genre.zet(leesGenres(params.get("genre"))).join(",");

  const telling = (shown) => shown === rows.length
    ? `${rows.length === 1 ? "1 voorstelling" : `Alle ${rows.length} voorstellingen`}`
    : `${shown} van ${rows.length} voorstellingen`;

  // Op een artiestpagina zoekt het veld alleen in plaats en zaal (data-waar), elders in alles (data-zoek).
  const zoekVeld = q?.dataset.veld || "zoek";
  const kaal = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  function apply() {
    const needle = kaal(state.q.trim()), kies = new Set(leesGenres(state.genre));
    const inGenre = (r) => (kies.size ? (r.dataset.genre || "").split(" ").some((x) => kies.has(x)) : !genre || genre.standaard((r.dataset.genre || "").split(" ")));
    if (genre) genre.aantal(rows.filter(inGenre).length);
    let shown = 0, passend = 0;
    const max = perWeek ? Infinity : limiet;
    for (const r of rows) {
      const ok =
        (!state.maand || r.dataset.datum.startsWith(state.maand)) &&
        inGenre(r) &&
        (!state.uitverkocht || r.dataset.status !== "uitverkocht") &&
        (!needle || kaal(r.dataset[zoekVeld] || "").includes(needle));
      r.hidden = !ok || passend >= max;
      if (ok) { passend++; if (passend <= max) shown++; }
    }
    meer.hidden = passend <= shown;
    if (passend > shown) meer.querySelector("button").textContent = `Toon meer voorstellingen (${Math.min(PORTIE, passend - shown)} van ${passend - shown})`;
    if (perWeek && Object.values(state).some((v) => v)) toonWeken(Infinity);
    syncGroups();
    resultLine.textContent = shown < passend ? `${shown} van ${passend} voorstellingen` : telling(shown);
    if (empty) empty.hidden = shown > 0;

    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(state)) if (v.trim()) p.set(k, v.trim());
    const qs = adres(p);
    history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  }

  // Een nieuwe zoekopdracht of filter begint weer bij de eerste 50.
  function opnieuw() { limiet = PORTIE; apply(); }
  let timer;
  if (q) q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => { state.q = q.value; opnieuw(); }, 150); });
  for (const [k, el] of Object.entries(selects)) if (el) el.addEventListener("change", () => { state[k] = el.value; opnieuw(); });
  if (vinkUit) vinkUit.addEventListener("change", () => { state.uitverkocht = vinkUit.checked ? "1" : ""; opnieuw(); });
  form.addEventListener("submit", (e) => e.preventDefault());
  const reset = veld("reset");
  if (reset) reset.addEventListener("click", () => {
    Object.keys(state).forEach((k) => (state[k] = ""));
    if (q) q.value = "";
    Object.values(selects).forEach((el) => { if (el) el.value = ""; });
    if (genre) genre.zet([]);
    if (vinkUit) vinkUit.checked = false;
    opnieuw();
    if (q) q.focus();
  });

  // Alleen de URL bijwerken als er al een filter in stond; anders de lijst laten zoals hij is.
  // Ook zonder adresfilter: kindervoorstellingen standaard uit, en per keer 50 voorstellingen.
  if (location.search || genre?.kinder || (!perWeek && rows.length > PORTIE)) apply();
  else {
    resultLine.textContent = telling(rows.length);
    if (perWeek) toonWeken(weekenZichtbaar);
  }
})();
