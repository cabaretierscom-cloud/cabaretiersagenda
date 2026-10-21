// Filters op de speellijst en knoppen voor de affichewand.
// De pagina werkt ook zonder dit script: dan staat de volledige lijst er.
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
  }

  // ---------- Filters ----------
  const form = document.getElementById("filters");
  if (!form) return;
  form.hidden = false;

  const rows = [...document.querySelectorAll("#gigs .gig")].filter((r) => !r.hidden);
  const q = document.getElementById("f-q");
  const maand = document.getElementById("f-maand");
  const plaats = document.getElementById("f-plaats");
  const genre = document.getElementById("f-genre");
  const chips = [...form.querySelectorAll(".chip")];
  const resultLine = document.getElementById("result-line");
  const empty = document.getElementById("empty");

  // Filterstand staat in de URL, zodat je een gefilterde lijst kunt delen.
  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get("q") || "",
    land: params.get("land") || "",
    maand: params.get("maand") || "",
    plaats: params.get("plaats") || "",
    genre: params.get("genre") || "",
  };
  const setSelect = (el, v) => { el.value = v; if (el.value !== v) el.value = ""; return el.value; };
  q.value = state.q;
  state.maand = setSelect(maand, state.maand);
  state.plaats = setSelect(plaats, state.plaats);
  state.genre = setSelect(genre, state.genre);
  if (!["", "NL", "BE"].includes(state.land)) state.land = "";

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
    resultLine.textContent = shown === rows.length
      ? `Alle ${rows.length} voorstellingen`
      : `${shown} van ${rows.length} voorstellingen`;
    empty.hidden = shown > 0;

    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(state)) if (v.trim()) p.set(k, v.trim());
    const qs = p.toString();
    history.replaceState(null, "", qs ? `?${qs}#agenda` : location.pathname);
  }

  let timer;
  q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => { state.q = q.value; apply(); }, 150); });
  maand.addEventListener("change", () => { state.maand = maand.value; apply(); });
  plaats.addEventListener("change", () => { state.plaats = plaats.value; apply(); });
  genre.addEventListener("change", () => { state.genre = genre.value; apply(); });
  chips.forEach((c) => c.addEventListener("click", () => { state.land = c.dataset.land; apply(); }));
  form.addEventListener("submit", (e) => e.preventDefault());
  document.getElementById("reset").addEventListener("click", () => {
    Object.keys(state).forEach((k) => (state[k] = ""));
    q.value = maand.value = plaats.value = genre.value = "";
    apply();
    q.focus();
  });

  // Alleen de URL bijwerken als er al een filter in stond; anders de lijst laten zoals hij is.
  if (location.search) apply();
  else resultLine.textContent = `Alle ${rows.length} voorstellingen`;
})();
