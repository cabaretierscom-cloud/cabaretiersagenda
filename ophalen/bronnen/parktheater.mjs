import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "parktheater",
  naam: "Parktheater Eindhoven",
  basis: "https://www.parktheater.nl",
  agenda: "/programma",
  titelEerst: true,
  theaters: [
    { id: "parktheater-eindhoven", naam: "Parktheater Eindhoven", plaats: "Eindhoven", land: "NL", soort: "theater", website: "https://www.parktheater.nl" },
  ],
});
