"""Zet dist/ via SFTP op Cloud86, zonder lftp: de reserveweg als lftp niet te installeren is (november 2026 was
security.ubuntu.com, waar apt lftp haalt, een middag lang onbereikbaar vanaf GitHub).

Doet hetzelfde als de lftp-stappen in .github/workflows/bijwerken.yml:
1. testbestand neerzetten en controleren dat www.cabaretiers.com het toont (anders niets doen);
2. stoppen als er nog WordPress staat (dat verplaatsen doet alleen de lftp-weg);
3. dist/ naar de map zetten; wat niet meer in dist/ staat, gaat weg; .well-known blijft staan.

Om niet elke keer alle duizenden pagina's te versturen, staat op de server .plaatsing.json met per bestand een
vingerafdruk (sha1). Alleen gewijzigde bestanden gaan over. Zonder dat bestand (de eerste keer, of na lftp) gaat
alles over en wordt de hele map doorgelopen om oude bestanden op te ruimen.

Gebruik: python3 scripts/sftp-plaatsen.py  (met HOST, GEBRUIKER, LFTP_PASSWORD en GITHUB_RUN_ID in de omgeving)
Nodig: pip install paramiko
"""
import hashlib
import json
import os
import posixpath
import stat
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

import paramiko

HOST, GEBRUIKER, WACHTWOORD = os.environ["HOST"], os.environ["GEBRUIKER"], os.environ["LFTP_PASSWORD"]
RUN = os.environ.get("GITHUB_RUN_ID", str(int(time.time())))
DOEL = "cabaretiers.com"
BRON = "dist"
MANIFEST = ".plaatsing.json"
OVERSLAAN = {".well-known", MANIFEST}


def verbind():
    t = paramiko.Transport((HOST, 22))
    t.connect(username=GEBRUIKER, password=WACHTWOORD)
    return t, paramiko.SFTPClient.from_transport(t)


def vingerafdruk(pad):
    h = hashlib.sha1()
    with open(pad, "rb") as f:
        for blok in iter(lambda: f.read(1 << 16), b""):
            h.update(blok)
    return h.hexdigest()


def bestaat(sftp, pad):
    try:
        sftp.stat(pad)
        return True
    except FileNotFoundError:
        return False


def alles_op_server(sftp, map_):
    """Alle bestanden onder map_ (relatief), zonder .well-known."""
    uit = []
    for e in sftp.listdir_attr(map_):
        if e.filename in (".", "..") or e.filename in OVERSLAAN and map_ == DOEL:
            continue
        pad = f"{map_}/{e.filename}"
        if stat.S_ISDIR(e.st_mode):
            uit += alles_op_server(sftp, pad)
        else:
            uit.append(pad[len(DOEL) + 1:])
    return uit


def maak_mappen(sftp, mappen):
    for m in sorted(mappen, key=lambda x: x.count("/")):
        pad = f"{DOEL}/{m}"
        if not bestaat(sftp, pad):
            sftp.mkdir(pad)


def main():
    t, sftp = verbind()

    # 1. Veiligheidscontrole.
    test = f"plaatsingstest-{RUN}.txt"
    with sftp.open(f"{DOEL}/{test}", "w") as f:
        f.write(RUN + "\n")
    gevonden = ""
    for _ in range(6):
        time.sleep(5)
        try:
            gevonden = urllib.request.urlopen(f"https://www.cabaretiers.com/{test}?{time.time()}", timeout=20).read().decode().strip()
        except Exception:
            gevonden = ""
        if gevonden == RUN:
            break
    try:
        sftp.remove(f"{DOEL}/{test}")
    except OSError:
        pass
    if gevonden != RUN:
        print(f"::error::{DOEL} is niet de map van www.cabaretiers.com: het testbestand is daar niet te zien. Er is niets geplaatst.")
        sys.exit(1)

    # 2. WordPress? Dan niets doen (de lftp-weg verplaatst het).
    if bestaat(sftp, f"{DOEL}/wp-config.php"):
        print("::error::Er staat nog WordPress in de map; die verplaatst alleen de lftp-weg. Er is niets geplaatst.")
        sys.exit(1)

    # 3. Wat moet er over, wat moet weg.
    nieuw = {}
    for wortel, _, bestanden in os.walk(BRON):
        for b in bestanden:
            pad = os.path.join(wortel, b)
            nieuw[os.path.relpath(pad, BRON).replace(os.sep, "/")] = vingerafdruk(pad)
    try:
        with sftp.open(f"{DOEL}/{MANIFEST}") as f:
            oud = json.loads(f.read())
        op_server = set(oud)
    except (FileNotFoundError, ValueError):
        print("Geen .plaatsing.json op de server: alles versturen en de map doorlopen.")
        oud = {}
        op_server = set(alles_op_server(sftp, DOEL))
    versturen = [p for p, h in nieuw.items() if oud.get(p) != h]
    weg = sorted(op_server - set(nieuw))
    print(f"{len(nieuw)} bestanden in dist/, {len(versturen)} te versturen, {len(weg)} weg te halen.")

    maak_mappen(sftp, {posixpath.dirname(p) for p in versturen if posixpath.dirname(p)})

    # Versturen met acht verbindingen tegelijk.
    groepen = [versturen[i::8] for i in range(8)]

    def stuur(groep):
        if not groep:
            return 0
        tt, s = verbind()
        try:
            for p in groep:
                s.put(os.path.join(BRON, p), f"{DOEL}/{p}")
        finally:
            s.close()
            tt.close()
        return len(groep)

    with ThreadPoolExecutor(8) as pool:
        verstuurd = sum(pool.map(stuur, groepen))

    for p in weg:
        try:
            sftp.remove(f"{DOEL}/{p}")
        except OSError:
            pass
    # Lege mappen van verdwenen pagina's opruimen (diepste eerst); een map met inhoud laat rmdir staan.
    for m in sorted({posixpath.dirname(p) for p in weg if posixpath.dirname(p)}, key=lambda x: -x.count("/")):
        try:
            sftp.rmdir(f"{DOEL}/{m}")
        except OSError:
            pass

    with sftp.open(f"{DOEL}/{MANIFEST}", "w") as f:
        f.write(json.dumps(nieuw))
    sftp.close()
    t.close()
    print(f"Klaar: {verstuurd} bestanden verstuurd, {len(weg)} weggehaald.")


if __name__ == "__main__":
    main()
