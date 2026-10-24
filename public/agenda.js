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

  function apply() {
    const needle = state.q.trim().toLowerCase();
    let shown = 0;
    for (const r of rows) {
      const ok =
        (!state.land || r.dataset.land === state.land) &&
        (!state.maand || r.dataset.datum.startsWith(state.maand)) &&
        (!state.plaats || r.dataset.plaats === state.plaats) &&
        (!state.genre || r.dataset.genre === state.genre) &&
        (!needle || r.dataset.zoek.includes(needle));
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
