import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "orpheus",
  naam: "Orpheus",
  basis: "https://www.orpheus.nl",
  agenda: "/voorstellingen",
  theaters: [
    { id: "orpheus", naam: "Orpheus", plaats: "Apeldoorn", land: "NL", soort: "theater", website: "https://www.orpheus.nl" },
  ],
});
