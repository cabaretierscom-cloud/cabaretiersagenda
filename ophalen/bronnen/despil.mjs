// CC De Spil, Roeselare (Peppered, met Ticketmatic).
import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "despil",
  naam: "CC De Spil",
  basis: "https://www.despil.be",
  agenda: "/agenda",
  theaters: [
    { id: "de-spil", naam: "CC De Spil", plaats: "Roeselare", land: "BE", soort: "cultuurcentrum", website: "https://www.despil.be" },
  ],
});
