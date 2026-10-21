import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "kleine-komedie",
  naam: "De Kleine Komedie",
  basis: "https://www.dekleinekomedie.nl",
  agenda: "/agenda",
  // De agenda toont ook avonden in (Klein) Bellevue, dat bij dezelfde organisatie hoort.
  // Die komen uit de eigen bron van Bellevue.
  meerdereZalen: true,
  locaties: { "Kleine Komedie": "kleine-komedie", "Bellevue": false },
  theaters: [
    { id: "kleine-komedie", naam: "De Kleine Komedie", plaats: "Amsterdam", land: "NL", soort: "theater", website: "https://www.dekleinekomedie.nl" },
  ],
});
