// Controleert de gegevens in data/ zonder te bouwen: `npm run check`.
import { fileURLToPath } from "node:url";
import { loadData } from "../src/data.mjs";

try {
  const db = loadData(fileURLToPath(new URL("../data/", import.meta.url)), { today: "0000-00-00" });
  console.log(`Gegevens in orde: ${db.artiesten.size} artiesten, ${db.theaters.size} theaters, ${db.voorstellingen.size} voorstellingen, ${db.upcoming.length} speeldata.`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
