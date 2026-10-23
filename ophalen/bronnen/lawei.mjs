// Schouwburg De Lawei, Drachten (Peppered-platform).
import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "lawei",
  naam: "Schouwburg De Lawei",
  basis: "https://www.lawei.nl",
  agenda: "/agenda",
  // "kweek: David van Rosmalen" is de reeks in de kleine zaal, geen deel van de naam.
  voorvoegsel: /^kweek:\s*/i,
  theaters: [
    { id: "schouwburg-de-lawei", naam: "Schouwburg De Lawei", plaats: "Drachten", land: "NL", soort: "theater", website: "https://www.lawei.nl" },
  ],
});
