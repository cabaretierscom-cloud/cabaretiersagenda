// Theater Lampegiet, Veghel (Peppered-platform).
import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "lampegiet",
  naam: "Theater Lampegiet",
  basis: "https://www.lampegiet.nl",
  agenda: "/agenda",
  theaters: [
    { id: "theater-lampegiet", naam: "Theater Lampegiet", plaats: "Veenendaal", land: "NL", soort: "theater", website: "https://www.lampegiet.nl" },
  ],
});
