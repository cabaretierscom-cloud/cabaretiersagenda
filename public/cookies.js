// Cookiemelding en Google Analytics. Analytics laadt pas na "Akkoord"; de keuze staat in de browser
// (localStorage "cabaretiers-cookies": "ja" of "nee"). Zonder JavaScript wordt er niets gemeten.
(() => {
  const id = document.currentScript?.dataset.ga;
  const SLEUTEL = "cabaretiers-cookies";
  const melding = document.getElementById("cookies");
  const lees = () => { try { return localStorage.getItem(SLEUTEL); } catch { return null; } };
  const bewaar = (k) => { try { localStorage.setItem(SLEUTEL, k); } catch { /* privévenster */ } };

  function laadAnalytics() {
    if (!id || window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id);
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(s);
  }

  // Na "Liever niet" de cookies van Analytics weghalen (voor wie eerder akkoord gaf).
  function wisCookies() {
    for (const c of document.cookie.split(";")) {
      const naam = c.split("=")[0].trim();
      if (!/^_ga/.test(naam)) continue;
      for (const domein of ["", location.hostname, `.${location.hostname.replace(/^www\./, "")}`]) {
        document.cookie = `${naam}=; Max-Age=0; path=/${domein ? `; domain=${domein}` : ""}`;
      }
    }
  }

  const keuze = lees();
  if (keuze === "ja") laadAnalytics();
  else if (!keuze && melding) melding.hidden = false;

  melding?.addEventListener("click", (e) => {
    const knop = e.target.closest("[data-keuze]");
    if (!knop) return;
    bewaar(knop.dataset.keuze);
    melding.hidden = true;
    if (knop.dataset.keuze === "ja") laadAnalytics();
    else { wisCookies(); if (window.gtag) location.reload(); }
  });

  // Privacypagina: keuze opnieuw maken.
  const wijzig = document.querySelector("[data-cookies-wijzig]");
  if (wijzig && melding) {
    wijzig.hidden = false;
    wijzig.addEventListener("click", () => { melding.hidden = false; melding.querySelector("button")?.focus(); });
  }
})();
