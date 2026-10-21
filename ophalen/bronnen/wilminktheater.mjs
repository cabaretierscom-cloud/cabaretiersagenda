import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "wilminktheater",
  naam: "Wilminktheater en Muziekcentrum Enschede",
  basis: "https://www.wilminktheater.nl",
  agenda: "/agenda",
  titelEerst: true,
  meerdereZalen: true,
  locaties: { "Wilminktheater": "wilminktheater", "Muziekcentrum": "muziekcentrum-enschede" },
  theaters: [
    { id: "wilminktheater", naam: "Wilminktheater", plaats: "Enschede", land: "NL", soort: "theater", website: "https://www.wilminktheater.nl" },
    { id: "muziekcentrum-enschede", naam: "Muziekcentrum Enschede", plaats: "Enschede", land: "NL", soort: "theater", website: "https://www.wilminktheater.nl" },
  ],
});
