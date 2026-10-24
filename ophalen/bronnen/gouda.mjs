// Goudse Schouwburg, Gouda. Alles uit /event_feed_json (zie platforms/eventfeed.mjs).
import { eventfeed } from "../platforms/eventfeed.mjs";

export default eventfeed({
  id: "gouda",
  naam: "Goudse Schouwburg",
  basis: "https://goudseschouwburg.nl",
  theaters: [
    { id: "goudse-schouwburg", naam: "Goudse Schouwburg", plaats: "Gouda", land: "NL", soort: "theater", website: "https://goudseschouwburg.nl" },
  ],
});
