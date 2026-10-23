# Maakt src/woordmerk.mjs: het woord "cabaretiers" als SVG, uit de echte lettervormen van
# Big Shoulders Display Black (900). De binnenruimtes van a, b en e worden aparte vlakken
# die in public/style.css een riso-kleur krijgen (logo-ontwerp 11, zie ontwerp/logo/README.md).
# Alleen nodig als het lettertype of het woord verandert.
# Gebruik: pip install fonttools brotli && python3 scripts/woordmerk.py
import json, os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen

root = os.path.join(os.path.dirname(__file__), "..")
f = instantiateVariableFont(TTFont(os.path.join(root, "public/fonts/big-shoulders-display-latin-wght-normal.woff2")), {"wght": 900})
cmap, gs, hmtx = f.getBestCmap(), f.getGlyphSet(), f["hmtx"]

def contouren(naam):
    rp = RecordingPen(); gs[naam].draw(rp); cur, out = [], []
    for op, args in rp.value:
        cur.append((op, args))
        if op in ("closePath", "endPath"): out.append(cur); cur = []
    return out

def oppervlak(c):
    pts = [p for _, args in c for p in args]
    return sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts))) / 2

def pad(cs, dx):
    p = SVGPathPen(gs)
    for c in cs:
        for op, args in c: getattr(p, op)(*[(round(x + dx), round(-y)) for x, y in args])
    return p.getCommands()

x, letters, binnen, punt_x = 0, [], [], 0
for ch in "cabaretıers":
    naam = "dotlessi" if ch == "ı" else cmap[ord(ch)]
    cs = contouren(naam)
    # Buitenste contour = grootste oppervlak; contouren met de andere draairichting zijn binnenruimtes.
    groot = max(cs, key=lambda c: abs(oppervlak(c)))
    binnen += [pad([c], x) for c in cs if (oppervlak(c) > 0) != (oppervlak(groot) > 0)]
    letters.append(pad(cs, x))
    if ch == "ı": punt_x = x + hmtx[naam][0] // 2
    x += hmtx[naam][0]

vlakken = "".join(f'<path class="bk bk-{i + 1}" d="{d}"/>' for i, d in enumerate(binnen))
# De punt op de i: 0,14 em groot, midden op 0,745 em boven de basislijn (1 em = 2000 eenheden).
svg = (f'<svg class="woord" viewBox="0 -1660 {x} 1690" aria-hidden="true" focusable="false">{vlakken}'
       f'<path fill="currentColor" d="{" ".join(letters)}"/>'
       f'<circle fill="currentColor" cx="{punt_x}" cy="-1490" r="140"/><circle class="kern" cx="{punt_x}" cy="-1490" r="58"/></svg>')
# De kleine c voor het beeldmerk (logo-ontwerp 15): lettervorm en kader in font-eenheden (y omhoog).
from fontTools.pens.boundsPen import BoundsPen
c_naam = cmap[ord("c")]
bp = BoundsPen(gs); gs[c_naam].draw(bp)
c_pad = pad(contouren(c_naam), 0).replace("M", "M").strip()

with open(os.path.join(root, "src/woordmerk.mjs"), "w") as uit:
    uit.write("// Gemaakt door scripts/woordmerk.py; niet met de hand aanpassen.\n")
    uit.write(f"export const WOORDMERK_SVG = {json.dumps(svg, ensure_ascii=False)};\n")
    uit.write(f"// Kleine c voor het beeldmerk; pad met y omlaag (zoals SVG), kader [x0, y0, x1, y1] ook met y omlaag.\n")
    uit.write(f"export const C_PAD = {json.dumps(c_pad)};\n")
    uit.write(f"export const C_KADER = {json.dumps([bp.bounds[0], -bp.bounds[3], bp.bounds[2], -bp.bounds[1]])};\n")
print(f"src/woordmerk.mjs gemaakt ({len(binnen)} binnenruimtes, breedte {x}).")
