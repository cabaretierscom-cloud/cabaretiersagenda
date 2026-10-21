import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "nijmegen",
  naam: "Stadsschouwburg & De Vereeniging Nijmegen",
  basis: "https://www.stadsschouwburgendevereeniging.nl",
  agenda: "/programma",
  meerdereZalen: true,
  locaties: { "Stadsschouwburg": "stadsschouwburg-nijmegen", "Vereeniging": "de-vereeniging" },
  theaters: [
    { id: "stadsschouwburg-nijmegen", naam: "Stadsschouwburg Nijmegen", plaats: "Nijmegen", land: "NL", soort: "theater", website: "https://www.stadsschouwburgendevereeniging.nl" },
    { id: "de-vereeniging", naam: "Concertgebouw De Vereeniging", plaats: "Nijmegen", land: "NL", soort: "theater", website: "https://www.stadsschouwburgendevereeniging.nl" },
  ],
});
