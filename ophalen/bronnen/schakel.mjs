// CC De Schakel, Waregem (Peppered-platform).
import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "schakel",
  naam: "CC De Schakel",
  basis: "https://www.ccdeschakel.be",
  agenda: "/voorstellingen",
  theaters: [
    { id: "cc-de-schakel", naam: "CC De Schakel", plaats: "Waregem", land: "BE", soort: "theater", website: "https://www.ccdeschakel.be" },
  ],
});
