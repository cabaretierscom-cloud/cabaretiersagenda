# Logo Cabaretiers.com

Gekozen ontwerp (oktober 2026): de C met de punt op een oranje vlak, met dezelfde punt op de i van het woordmerk.

## Onderdelen

- **Beeldmerk** (`beeldmerk.svg`): zwarte C met een zwarte punt met oranje kern, op een oranje vlak met ronde hoeken. Gebruik voor app-icoon, tabbladicoontje en sociale media.
- **Beeldmerk omgekeerd** (`beeldmerk-omgekeerd.svg`): witte C en punt op zwart, voor gebruik op een oranje achtergrond.
- **Woordmerk**: `cabaretiers` in Big Shoulders Display Black (900), kleine letters. De punt op de i is de punt uit het beeldmerk: een stip in de tekstkleur met een oranje kern. Daarachter `.com` in roze, Big Shoulders Display Bold (700), ongeveer een derde van de hoogte.
- **Ondertitel**: `DE CABARETAGENDA` onder het woordmerk, in Instrument Sans SemiBold (600), hoofdletters met ruime letterafstand (ongeveer 0,24 em), ongeveer een derde van de hoogte van `.com`, in de tekstkleur.
- Het woordmerk staat rechts van het beeldmerk, verticaal gecentreerd.

## Kleuren

| Naam | Kleur | Gebruik |
|---|---|---|
| Oranje (`--riso-orange`) | `#FF6A13` | vlak van het beeldmerk, kern van de punt |
| Zwart | `#000000` | C, punt, woordmerk |
| Roze (`--riso-pink`) | `#FF4FA3` | `.com` |

Op een donkere achtergrond wordt het woordmerk wit, en de punt op de i wit met een oranje kern. Het beeldmerk blijft oranje.

## Op de site

Het beeldmerk staat als `LOGO_SVG` in `src/templates.mjs` (en wordt `/logo.svg`, het tabbladicoontje). Het woordmerk is gewone tekst in de kop; de punt op de i komt uit `.wordmark .punt-i` in `public/style.css`.
