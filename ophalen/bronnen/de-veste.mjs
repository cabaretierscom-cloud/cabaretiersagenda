import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "de-veste",
  naam: "Theater De Veste",
  basis: "https://www.theaterdeveste.nl",
  agenda: "/programma",
  titelEerst: true,
  theaters: [
    { id: "theater-de-veste", naam: "Theater De Veste", plaats: "Delft", land: "NL", soort: "theater", website: "https://www.theaterdeveste.nl" },
  ],
});
