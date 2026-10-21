import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "hnt",
  naam: "Het Nationale Theater",
  basis: "https://www.hnt.nl",
  agenda: "/nl/agenda",
  meerdereZalen: true,
  locaties: { "Koninklijke Schouwburg": "koninklijke-schouwburg" },
  theaters: [
    { id: "koninklijke-schouwburg", naam: "Koninklijke Schouwburg", plaats: "Den Haag", land: "NL", soort: "theater", website: "https://www.hnt.nl" },
  ],
});
