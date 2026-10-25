# Logo Cabaretiers.com

Gekozen ontwerp (oktober 2026, ontwerp 15 op het logobord): de kleine c uit het woordmerklettertype in vier inktkleuren, met schuine kleurgrenzen zoals de G van Google, op een zwart vlak. De binnenruimtes van de a, b en e in het woordmerk hebben dezelfde kleuren.

## Onderdelen

- **Beeldmerk** (`beeldmerk.svg`): de kleine c van Big Shoulders Display Black op een zwart vlak met ronde hoeken. Oranje boven, roze op de onderste uithaal, groen onder, geel over de linkerkant; de grenzen lopen schuin vanuit het midden van de c. Gebruik voor kop, app-icoon, tabbladicoontje en sociale media.
- **Beeldmerk zonder vlak** (`beeldmerk-omgekeerd.svg`): dezelfde c zonder zwart vlak, voor op een donkere achtergrond zoals de footer.
- **Woordmerk**: `cabaretiers` in Big Shoulders Display Black (900), kleine letters. De punt op de i is een stip in de tekstkleur met een oranje kern, 0,14 em groot, op dezelfde hoogte als de punt van een gewone i in dit lettertype en met witruimte boven de stok. De gesloten binnenruimtes zijn ingekleurd, van links naar rechts: a oranje, b geel, a groen, e roze, e lila. Daarachter `.com` in donkerblauw, Big Shoulders Display Bold (700), ongeveer een derde van de hoogte.
- **Ondertitel**: `DE THEATERAGENDA` onder het woordmerk, in Instrument Sans SemiBold (600), hoofdletters met ruime letterafstand (ongeveer 0,24 em), in de tekstkleur.
- Het woordmerk staat rechts van het beeldmerk, verticaal gecentreerd.

## Kleuren

| Naam | Kleur | Gebruik |
|---|---|---|
| Oranje (`--riso-orange`) | `#FF6A13` | c boven, binnenruimte eerste a, kern van de punt |
| Geel (`--riso-yellow`) | `#FFD23F` | c links, binnenruimte b |
| Groen (`--riso-green`) | `#00764E` | c onder, binnenruimte tweede a |
| Roze (`--riso-pink`) | `#FF4FA3` | uithaal van de c, binnenruimte eerste e |
| Lila (`--riso-lilac`) | `#C9B6FF` | binnenruimte tweede e; `.com` op een donkere achtergrond |
| Donkerblauw (`--riso-blue`) | `#2340E8` | `.com` |
| Zwart | `#121212` | vlak van het beeldmerk, woordmerk, tekst, footer (een heel donker grijs in plaats van puur zwart) |

Op een donkere achtergrond (de zwarte footer, de donkere modus) wordt het woordmerk wit en `.com` lila, omdat donkerblauw op zwart slecht leesbaar is. Het beeldmerk staat daar zonder vlak.

## Afgeleide afbeeldingen

- `public/deelafbeelding.png` (1200×630): het plaatje dat sociale media tonen bij pagina's zonder artiestfoto.
- `public/apple-touch-icon.png` (180×180): het app-icoon voor telefoons, en het logo in de gegevens voor Google (Google leest geen SVG).

Na een wijziging aan het logo: `npm run logo` (vraagt Playwright) maakt beide opnieuw uit `ontwerp/logo/deelafbeelding.html`.

## Op de site

Het beeldmerk wordt gemaakt door `beeldmerk()` in `src/templates.mjs` (`LOGO_SVG`, met de lettervorm `C_PAD` uit `src/woordmerk.mjs`) (en wordt `/logo.svg`, het tabbladicoontje). Het woordmerk is een SVG (`WOORDMERK_SVG` in `src/woordmerk.mjs`), gemaakt uit de echte lettervormen door `scripts/woordmerk.py`; de kleuren van de binnenruimtes en de kern van de punt staan bij `.woord` in `public/style.css`.
