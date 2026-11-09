// De Warande, Turnhout (Peppered).
import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "warande",
  naam: "De Warande",
  basis: "https://www.warande.be",
  agenda: "/nl/agenda",
  theaters: [
    { id: "de-warande-turnhout", naam: "De Warande", plaats: "Turnhout", land: "BE", soort: "theater", website: "https://www.warande.be" },
  ],
});
