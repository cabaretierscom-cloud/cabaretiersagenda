"""Tweede stap van scripts/theaterbeelden.mjs: de goedgekeurde beelden (na het bekijken) omzetten naar jpg (langste
zijde hooguit 800 px) in public/fotos/theaters/<id>.jpg en ze als `foto` in data/theaters.json zetten, met `promo`,
`van`, `toestemming` en de homepage van de zaal als `bron`, zonder maker (onbekend, dus geen naamsvermelding).
Alleen foto's van het gebouw of de zaal: geen logo's, affiches, voorstellingen of publiek (verzoek van de eigenaar).

Gebruik: python3 scripts/theaterbeelden-verwerk.py <werkmap> <goedgekeurde volgnummers, komma-gescheiden>
"""
import json, os, sys
from PIL import Image

werkmap = sys.argv[1]
nummers = lambda s: {int(x) for x in s.split(",") if x.strip()}
fotos = nummers(sys.argv[2])
basis = os.path.join(os.path.dirname(__file__), "..")
vondsten = json.load(open(os.path.join(werkmap, "vondsten.json")))
pad = os.path.join(basis, "data", "theaters.json")
theaters = json.load(open(pad))
T = {t["id"]: t for t in theaters}
nieuw = 0
for i, v in enumerate(vondsten):
    if i not in fotos:
        continue
    t = T.get(v["id"])
    if not t or t.get("foto") is not None:
        continue
    im = Image.open(v["bestand"])
    im.load()
    if im.mode in ("P", "LA", "RGBA"):
        im = im.convert("RGBA")
        wit = Image.new("RGBA", im.size, "white")
        wit.alpha_composite(im)
        im = wit
    im = im.convert("RGB")
    im.thumbnail((800, 800))
    bestand = f"/fotos/theaters/{t['id']}.jpg"
    im.save(os.path.join(basis, "public", bestand.lstrip("/")), quality=80, optimize=True, progressive=True)
    t["foto"] = {
        "bestand": bestand,
        "alt": f"{t['naam']} in {t['plaats']}",
        "promo": True,
        "van": "Eigenaar van Cabaretiers.com",
        "toestemming": "Toestemming van de eigenaar (november 2026) om de beelden van de theatersites te gebruiken; dit is het deelbeeld van de homepage van de zaal.",
        "bron": v["pagina"],
        "breedte": im.size[0],
        "hoogte": im.size[1],
    }
    nieuw += 1
with open(pad, "w") as f:
    f.write(json.dumps(theaters, ensure_ascii=False, indent=2) + "\n")
print(f"{nieuw} zalen kregen een beeld")
