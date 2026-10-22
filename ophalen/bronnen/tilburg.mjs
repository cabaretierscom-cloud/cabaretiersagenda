import { cre8ion } from "../platforms/cre8ion.mjs";

export default cre8ion({
  id: "tilburg",
  naam: "Schouwburg & Concertzaal Tilburg",
  sitemap: "https://www.schouwburgconcertzaaltilburg.nl/sitemap.xml",
  voorstelling: /^https:\/\/www\.schouwburgconcertzaaltilburg\.nl\/nl\/agenda\/[^/]+$/,
  zalen: { schouwburg: "schouwburg-tilburg", concertzaal: "concertzaal-tilburg", "theaters tilburg": "schouwburg-tilburg" },
  theaters: [
    { id: "schouwburg-tilburg", naam: "Schouwburg Tilburg", plaats: "Tilburg", land: "NL", soort: "theater", website: "https://www.schouwburgconcertzaaltilburg.nl" },
    { id: "concertzaal-tilburg", naam: "Concertzaal Tilburg", plaats: "Tilburg", land: "NL", soort: "theater", website: "https://www.schouwburgconcertzaaltilburg.nl" },
  ],
});
