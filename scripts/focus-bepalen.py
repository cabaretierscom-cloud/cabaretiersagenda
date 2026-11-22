"""Bepaalt een `focus` voor promotiebeelden zonder focus in data/promo.json (november 2026, verzoek van de eigenaar:
"veel afbeeldingen zijn niet goed uitgelijnd"). Zonder focus snijdt de site een liggend beeld in het midden bij,
en bij beelden van theatersites staat de artiest of de tekst vaak aan één kant (Seda Yüz: alles links, rechts wit).

Per beeld een kaart van wat er te zien is: randen (tekst, gezichten, contouren) en kleur die afwijkt van de
achtergrond (de mediaan van de rand van het beeld). Dan het venster met het meeste daarvan:
- horizontaal een venster in de smalste verhouding van de site (staand affiche, 4:5), de focus in het midden;
- verticaal een venster in de verhouding van de affiches op de homepage (5:6); de focus ligt op 30% van de
  bovenkant, zoals `uitsnede()` in src/templates.mjs dat verwacht.
Bekijk het resultaat altijd met het oog (contactvel met de uitsnede van 4:5) en verbeter waar nodig met de hand.

Gebruik: python3 scripts/focus-bepalen.py [--alles]   (--alles: ook beelden met een focus die met de hand is gezet; een automatische focus wordt altijd opnieuw bepaald, behalve met `focusAutomatisch: false`)
"""
import json, os, sys
import numpy as np
from PIL import Image

basis = os.path.join(os.path.dirname(__file__), "..")
pad = os.path.join(basis, "data", "promo.json")
promo = json.load(open(pad))
alles = "--alles" in sys.argv


def interessekaart(im):
    im = im.convert("RGB")
    im.thumbnail((120, 120))  # klein: korrel en ruis tellen dan nauwelijks mee
    a = np.asarray(im).astype(float) / 255
    grijs = a.mean(axis=2)
    gx = np.abs(np.diff(grijs, axis=1, prepend=grijs[:, :1]))
    gy = np.abs(np.diff(grijs, axis=0, prepend=grijs[:1, :]))
    rand = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    achtergrond = np.median(rand, axis=0)
    afwijking = np.sqrt(((a - achtergrond) ** 2).sum(axis=2))
    kaart = (gx + gy) / max((gx + gy).max(), 1e-6) + 0.3 * afwijking / max(afwijking.max(), 1e-6)
    return kaart


def beste_venster(som, lengte):
    """Begin van het venster met de grootste som (som is per kolom of rij). Het midden weegt iets zwaarder:
    daar staat meestal de artiest, en een vlak kleurpaneel aan de rand wint dan niet."""
    n = len(som)
    plek = np.linspace(-1, 1, n)
    som = som * (0.55 + 0.45 * np.exp(-2 * plek ** 2))
    if lengte >= n:
        return 0
    c = np.concatenate([[0], np.cumsum(som)])
    totalen = c[lengte:] - c[:n - lengte + 1]
    return int(np.argmax(totalen))


aantal = 0
for p in promo:
    f = p.get("foto")
    if not f or f.get("heel") or (f.get("focus") and not f.get("focusAutomatisch") and not alles):
        continue
    bestand = os.path.join(basis, "public", f["bestand"].lstrip("/"))
    try:
        kaart = interessekaart(Image.open(bestand))
    except Exception as e:
        print("niet te lezen:", f["bestand"], e)
        continue
    h, w = kaart.shape
    fx, fy = 0.5, 0.3
    breed = round(h * 0.8)  # staand 4:5
    if breed < w:
        x = beste_venster(kaart.sum(axis=0), breed)
        fx = (x + breed / 2) / w
    hoog = round(w / 1.2)  # affiche op de homepage
    if hoog < h:
        y = beste_venster(kaart.sum(axis=1), hoog)
        fy = (y + 0.3 * hoog) / h
    f["focus"] = [round(fx, 2), round(fy, 2)]
    f["focusAutomatisch"] = True
    aantal += 1

with open(pad, "w") as uit:
    uit.write(json.dumps(promo, ensure_ascii=False, indent=2) + "\n")
print(f"{aantal} beelden kregen een focus")
