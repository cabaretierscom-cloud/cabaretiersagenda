// Schouwburg Het Park, Hoorn (met Theater Het Pakhuis). Alles uit /event_feed_json.
import { eventfeed } from "../platforms/eventfeed.mjs";

const BASIS = "https://hetpark.nl";

export default eventfeed({
  id: "hetpark",
  naam: "Schouwburg Het Park",
  basis: BASIS,
  theater: (zaal) => (/pakhuis/i.test(zaal) ? "theater-het-pakhuis" : null),
  theaters: [
    { id: "schouwburg-het-park", naam: "Schouwburg Het Park", plaats: "Hoorn", land: "NL", soort: "theater", website: BASIS },
    { id: "theater-het-pakhuis", naam: "Theater Het Pakhuis", plaats: "Hoorn", land: "NL", soort: "theater", website: BASIS },
  ],
});
