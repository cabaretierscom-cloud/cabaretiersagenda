// Schouwburg Kortrijk (Peppered, met Ticketmatic). Speelt ook in OC's en andere zalen in Kortrijk.
import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "kortrijk",
  naam: "Schouwburg Kortrijk",
  basis: "https://www.schouwburgkortrijk.be",
  agenda: "/programma",
  alleenGenres: true,
  // PARCOURS is een dansfestival; Kortrijk zet die voorstellingen ook onder cabaret.
  locaties: { "PARCOURS": false, "Naked Dancer": false },
  theaters: [
    { id: "schouwburg-kortrijk", naam: "Schouwburg Kortrijk", plaats: "Kortrijk", land: "BE", soort: "theater", website: "https://www.schouwburgkortrijk.be" },
  ],
});
