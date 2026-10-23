# Logo Cabaretiers.com

Gekozen ontwerp (oktober 2026, ontwerp 11 op het logobord): de C met de punt op een oranje vlak, met dezelfde punt op de i van het woordmerk en gekleurde binnenruimtes in de a, b en e.

## Onderdelen

- **Beeldmerk** (`beeldmerk.svg`): zwarte C met een zwarte punt met oranje kern, op een oranje vlak met ronde hoeken. Gebruik voor app-icoon, tabbladicoontje en sociale media.
- **Beeldmerk omgekeerd** (`beeldmerk-omgekeerd.svg`): witte C en punt op zwart, voor gebruik op een oranje achtergrond.
- **Woordmerk**: `cabaretiers` in Big Shoulders Display Black (900), kleine letters. De punt op de i is de punt uit het beeldmerk: een stip in de tekstkleur met een oranje kern, 0,14 em groot, op dezelfde hoogte als de punt van een gewone i in dit lettertype en met witruimte boven de stok. De gesloten binnenruimtes zijn ingekleurd met riso-inkten, van links naar rechts: a roze, b geel, a lichtblauw, e limoen, e lila. Daarachter `.com` in roze, Big Shoulders Display Bold (700), ongeveer een derde van de hoogte.
- **Ondertitel**: `DE THEATERAGENDA` onder het woordmerk, in Instrument Sans SemiBold (600), hoofdletters met ruime letterafstand (ongeveer 0,24 em), ongeveer een derde van de hoogte van `.com`, in de tekstkleur.
- Het woordmerk staat rechts van het beeldmerk, verticaal gecentreerd.

## Kleuren

| Naam | Kleur | Gebruik |
|---|---|---|
| Oranje (`--riso-orange`) | `#FF6A13` | vlak van het beeldmerk, kern van de punt |
| Zwart | `#000000` | C, punt, woordmerk |
| Roze (`--riso-pink`) | `#FF4FA3` | `.com`, binnenruimte eerste a |
| Geel (`--riso-yellow`) | `#FFD23F` | binnenruimte b |
| Lichtblauw (`--riso-aqua`) | `#5EC8E5` | binnenruimte tweede a |
| Limoen (`--riso-lime`) | `#B8E04A` | binnenruimte eerste e |
| Lila (`--riso-lilac`) | `#C9B6FF` | binnenruimte tweede e |

Op een donkere achtergrond wordt het woordmerk wit, en de punt op de i wit met een oranje kern. Het beeldmerk blijft oranje, de binnenruimtes houden hun kleur. In de oranje footer is de kern van de punt wit.

## Afgeleide afbeeldingen

- `public/deelafbeelding.png` (1200×630): het plaatje dat sociale media tonen bij pagina's zonder artiestfoto.
- `public/apple-touch-icon.png` (180×180): het app-icoon voor telefoons, en het logo in de gegevens voor Google (Google leest geen SVG).

Na een wijziging aan het logo: `npm run logo` (vraagt Playwright) maakt beide opnieuw uit `ontwerp/logo/deelafbeelding.html`.

## Op de site

Het beeldmerk staat als `LOGO_SVG` in `src/templates.mjs` (en wordt `/logo.svg`, het tabbladicoontje). Het woordmerk is een SVG (`WOORDMERK_SVG` in `src/woordmerk.mjs`), gemaakt uit de echte lettervormen door `scripts/woordmerk.py`; de kleuren van de binnenruimtes en de kern van de punt staan bij `.woord` in `public/style.css`.
