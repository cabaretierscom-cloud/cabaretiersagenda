import { cre8ion } from "../platforms/cre8ion.mjs";

export default cre8ion({
  id: "utrecht",
  naam: "Stadsschouwburg Utrecht",
  sitemap: "https://stadsschouwburg-utrecht.nl/sitemap.xml",
  voorstelling: /\/agenda\/seizoen-[^/]+\/[^/]+$/,
  theaters: [
    { id: "stadsschouwburg-utrecht", naam: "Stadsschouwburg Utrecht", plaats: "Utrecht", land: "NL", soort: "theater", website: "https://stadsschouwburg-utrecht.nl" },
  ],
});
