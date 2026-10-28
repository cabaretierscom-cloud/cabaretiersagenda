# Logo Cabaretiers.com

Gekozen ontwerp (oktober 2026, ontwerp 15 op het logobord): de kleine c uit het woordmerklettertype in vier inktkleuren, met schuine kleurgrenzen zoals de G van Google, op een zwart vlak. De binnenruimtes van de a, b en e in het woordmerk hebben dezelfde kleuren.

## Onderdelen

- **Beeldmerk** (`beeldmerk.svg`): de kleine c van Big Shoulders Display Black op een zwart vlak met ronde hoeken. Oranje boven, roze op de onderste uithaal, limoen onder, geel over de linkerkant; de grenzen lopen schuin vanuit het midden van de c. Gebruik voor kop, app-icoon, tabbladicoontje en sociale media.
- **Beeldmerk zonder vlak** (`beeldmerk-omgekeerd.svg`): dezelfde c zonder zwart vlak, voor op een donkere achtergrond zoals de footer.
- **Woordmerk**: `cabaretiers` in Big Shoulders Display Black (900), kleine letters. De punt op de i is een stip in de tekstkleur met een gekleurde kern (rood op licht, blauw op donker), 0,14 em groot, op dezelfde hoogte als de punt van een gewone i in dit lettertype en met witruimte boven de stok. De gesloten binnenruimtes zijn ingekleurd met kleuren die goed contrasteren met de letters. Op licht (zwarte letters), van links naar rechts: a oranje, b geel, a limoen, e roze, e aqua, met een rode kern in de punt. Op donker (witte letters): a paars, b groen, a blauw, e paars, e groen, met een blauwe kern in de punt. Daarachter `.com` in donkerblauw, Big Shoulders Display Bold (700), ongeveer een derde van de hoogte.
- **Ondertitel**: `DE THEATERAGENDA` onder het woordmerk, in Instrument Sans SemiBold (600), hoofdletters met ruime letterafstand (ongeveer 0,24 em), in de tekstkleur.
- Het woordmerk staat rechts van het beeldmerk, verticaal gecentreerd.

## Kleuren

| Naam | Kleur | Gebruik |
|---|---|---|
| Oranje (`--riso-orange`) | `#FF6A13` | c boven, binnenruimte eerste a (licht) |
| Rood (`--riso-red`) | `#F23D2E` | kern van de punt op de i (licht) |
| Geel (`--riso-yellow`) | `#FFD23F` | c links, binnenruimte b (licht) |
| Limoen (`--riso-lime`) | `#B8E04A` | c onder, binnenruimte tweede a (licht) |
| Aqua (`--riso-aqua`) | `#5EC8E5` | binnenruimte tweede e (licht) |
| Paars (`--riso-purple`) | `#6A4FB0` | binnenruimte eerste a en eerste e (donker) |
| Groen (`--riso-green`) | `#00764E` | binnenruimte b en tweede e (donker) |
| Roze (`--riso-pink`) | `#FF4FA3` | uithaal van de c, binnenruimte eerste e (licht) |
| Lila (`--riso-lilac`) | `#C9B6FF` | `.com` op een donkere achtergrond |
| Donkerblauw (`--riso-blue`) | `#2340E8` | `.com` op licht; binnenruimte tweede a en kern van de punt (donker) |
| Zwart | `#121212` | vlak van het beeldmerk, woordmerk, tekst, footer (een heel donker grijs in plaats van puur zwart) |

Op een donkere achtergrond (de zwarte footer, de donkere modus, de donkere Instagram-beelden) wordt het woordmerk wit, krijgen de binnenruimtes de donkere kleuren hierboven en wordt `.com` lila, omdat donkerblauw op zwart slecht leesbaar is. Het beeldmerk staat daar zonder vlak.

Wijziging oktober 2026: groen in het beeldmerk vervangen door limoen, en de binnenruimtes gekozen op contrast met de letters.

## Afgeleide afbeeldingen

- `public/deelafbeelding.png` (1200×630): het plaatje dat sociale media tonen bij pagina's zonder artiestfoto.
- `public/apple-touch-icon.png` (180×180): het app-icoon voor telefoons, en het logo in de gegevens voor Google (Google leest geen SVG).

Na een wijziging aan het logo: `npm run logo` (vraagt Playwright) maakt beide opnieuw uit `ontwerp/logo/deelafbeelding.html`; `node scripts/favicons.mjs` maakt de tabbladicoontjes, `node scripts/instagram-afbeeldingen.mjs` de Instagram-beelden (daarna `cabaretiers-instagram.zip` opnieuw inpakken) en `node ontwerp/mail/maak.mjs` de mail.

## Op de site

Het beeldmerk wordt gemaakt door `beeldmerk()` in `src/templates.mjs` (`LOGO_SVG`, met de lettervorm `C_PAD` uit `src/woordmerk.mjs`) (en wordt `/logo.svg`, het tabbladicoontje). Het woordmerk is een SVG (`WOORDMERK_SVG` in `src/woordmerk.mjs`), gemaakt uit de echte lettervormen door `scripts/woordmerk.py`; de kleuren van de binnenruimtes en de kern van de punt staan bij `.woord` in `public/style.css`.
