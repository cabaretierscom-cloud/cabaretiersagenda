"""Tweede stap van scripts/voorstellingsbeelden.mjs: de gevonden beelden omzetten naar jpg (langste zijde hooguit
800 px) in public/fotos/promo/ en ze toevoegen aan data/promo.json met alleenVoorstelling. Te kleine beelden en
smalle banners vallen weg; beelden in de lijst `afgekeurd` (na het bekijken: logo's, zaalfoto's, foto's van een andere
voorstelling) ook.

Gebruik: python3 scripts/voorstellingsbeelden-verwerk.py <werkmap> [afgekeurd: komma-gescheiden voorstelling-ids]
"""
import json, os, sys
from urllib.parse import urlparse
from PIL import Image

werkmap = sys.argv[1]
afgekeurd = set(filter(None, (sys.argv[2] if len(sys.argv) > 2 else "").split(",")))
basis = os.path.join(os.path.dirname(__file__), "..")
vondsten = json.load(open(os.path.join(werkmap, "vondsten.json")))
promo_pad = os.path.join(basis, "data", "promo.json")
promo = json.load(open(promo_pad))
bekend = {p["foto"]["bestand"] for p in promo if p.get("foto")}
nieuw = 0
for v in vondsten:
    if v["vid"] in afgekeurd:
        continue
    bestand = f"/fotos/promo/v-{v['vid']}.jpg"
    if bestand in bekend:
        continue
    try:
        im = Image.open(v["bestand"])
        im.load()
    except Exception:
        continue
    w, h = im.size
    if w < 320 or h < 240 or w / h > 2.6 or h / w > 2.6:
        continue
    im = im.convert("RGB")
    im.thumbnail((800, 800))
    im.save(os.path.join(basis, "public", bestand.lstrip("/")), quality=80, optimize=True, progressive=True)
    zaal = urlparse(v["pagina"]).hostname.removeprefix("www.")
    promo.append({
        "artiest": v["artiest"],
        "van": "Eigenaar van Cabaretiers.com",
        "toestemming": f"Algemene toestemming van de eigenaar (november 2026) om promotiebeelden van voorstellingen te gebruiken; dit beeld staat op de voorstellingspagina van {zaal}.",
        "bron": v["pagina"],
        "alleenVoorstelling": True,
        "foto": {"bestand": bestand, "alt": f"Promotiebeeld van {v['titel']} van {v['artiest']}", "bron": v["pagina"], "breedte": im.size[0], "hoogte": im.size[1]},
        "voorstelling": v["titel"],
    })
    nieuw += 1
with open(promo_pad, "w") as f:
    f.write(json.dumps(promo, ensure_ascii=False, indent=2) + "\n")
print(f"{nieuw} beelden toegevoegd")
