// Minardschouwburg, Gent (WordPress met The Events Calendar; de REST-koppeling staat open).
import { eventsCalendar } from "../platforms/events-calendar.mjs";

export default eventsCalendar({
  id: "minard",
  naam: "Minardschouwburg",
  basis: "https://minard.be",
  theaters: [
    { id: "minardschouwburg-gent", naam: "Minardschouwburg", plaats: "Gent", land: "BE", soort: "theater", website: "https://minard.be" },
  ],
});
