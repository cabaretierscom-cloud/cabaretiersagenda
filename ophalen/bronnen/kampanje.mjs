// Theater de Kampanje, Den Helder (Peppered-platform).
import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "kampanje",
  naam: "Theater de Kampanje",
  basis: "https://www.kampanje.nl",
  agenda: "/voorstellingen",
  theaters: [
    { id: "theater-de-kampanje", naam: "Theater de Kampanje", plaats: "Den Helder", land: "NL", soort: "theater", website: "https://www.kampanje.nl" },
  ],
});
