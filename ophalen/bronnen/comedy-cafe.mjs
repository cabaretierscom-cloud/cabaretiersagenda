import { eventsCalendar } from "../platforms/events-calendar.mjs";

export default eventsCalendar({
  id: "comedy-cafe",
  naam: "Comedy Café Amsterdam",
  basis: "https://www.comedycafe.nl",
  standaardGenre: "stand-up",
  locaties: { "Comedy Cafe Amsterdam": "comedy-cafe-amsterdam", "Southend": "southend-comedy-club" },
  theaters: [
    { id: "comedy-cafe-amsterdam", naam: "Comedy Café Amsterdam", plaats: "Amsterdam", land: "NL", soort: "comedyclub", website: "https://www.comedycafe.nl" },
    { id: "southend-comedy-club", naam: "Southend Comedy Club", plaats: "Amsterdam", land: "NL", soort: "comedyclub", website: "https://www.comedycafe.nl" },
  ],
});
