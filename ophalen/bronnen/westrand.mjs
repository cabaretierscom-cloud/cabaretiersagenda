// Westrand, Dilbeek (Peppered).
import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "westrand",
  naam: "Westrand",
  basis: "https://www.westrand.be",
  agenda: "/programma",
  theaters: [
    { id: "westrand-dilbeek", naam: "Westrand", plaats: "Dilbeek", land: "BE", soort: "theater", website: "https://www.westrand.be" },
  ],
});
