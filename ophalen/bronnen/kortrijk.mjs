// Schouwburg Kortrijk (Peppered, met Ticketmatic). Speelt ook in OC's en andere zalen in Kortrijk.
import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "kortrijk",
  naam: "Schouwburg Kortrijk",
  basis: "https://www.schouwburgkortrijk.be",
  agenda: "/programma",
  alleenGenres: true,
  theaters: [
    { id: "schouwburg-kortrijk", naam: "Schouwburg Kortrijk", plaats: "Kortrijk", land: "BE", soort: "theater", website: "https://www.schouwburgkortrijk.be" },
  ],
});
