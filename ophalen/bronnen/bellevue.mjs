import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "bellevue",
  naam: "Theater Bellevue",
  basis: "https://www.theaterbellevue.nl",
  agenda: "/agenda",
  titelEerst: true,
  theaters: [
    { id: "theater-bellevue", naam: "Theater Bellevue", plaats: "Amsterdam", land: "NL", soort: "theater", website: "https://www.theaterbellevue.nl" },
  ],
});
