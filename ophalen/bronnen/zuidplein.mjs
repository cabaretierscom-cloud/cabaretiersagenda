import { peppered } from "../platforms/peppered.mjs";

export default peppered({
  id: "zuidplein",
  naam: "Theater Zuidplein",
  basis: "https://www.theaterzuidplein.nl",
  agenda: "/agenda",
  titelEerst: true,
  theaters: [
    { id: "theater-zuidplein", naam: "Theater Zuidplein", plaats: "Rotterdam", land: "NL", soort: "theater", website: "https://www.theaterzuidplein.nl" },
  ],
});
