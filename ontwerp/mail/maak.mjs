// Maakt de promotiemail in ontwerp/mail/ (HTML met inline opmaak, werkt in Gmail, Outlook en Apple Mail)
// plus een platte-tekstversie. Gebruik: node ontwerp/mail/maak.mjs
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE } from "../../src/templates.mjs";

const dir = dirname(fileURLToPath(import.meta.url));
const INK = "#121212", ORANJE = "#FF6A13", ROZE = "#FF4FA3", GEEL = "#FFD23F", GROEN = "#00764E", LILA = "#C9B6FF";
const KOP = "'Arial Black', 'Helvetica Neue', Arial, sans-serif";
const TEKST = "Arial, 'Helvetica Neue', Helvetica, sans-serif";

// Eén algemene mail voor artiesten en impresariaten, zonder velden om per ontvanger in te vullen.
const MAIL = {
  onderwerp: "Jouw voorstellingen extra in de spotlight op Cabaretiers.com",
  voorbeeld: "Deel foto's, trailers en voorstellingsteksten, dan zetten wij ze gratis op de site en onze kanalen.",
  aanhef: "Hallo,",
  intro: [
    "Wij zijn <b>Cabaretiers.com</b>, de theateragenda voor cabaret en comedy in Nederland en België. Op onze site staan de voorstellingen van honderden cabaretiers en comedians, met alle speeldata en een link naar de kaartverkoop van het theater.",
    "We willen die voorstellingen graag nog beter laten zien. Daarom een vraag aan artiesten en impresariaten: heb je promotiemateriaal dat wij mogen gebruiken op Cabaretiers.com en op onze sociale kanalen?",
  ],
  pagina: "https://www.cabaretiers.com/artiesten/",
  paginaTekst: "Bekijk de agenda",
  slot: "Werk je voor meerdere artiesten? Een map per artiest of een link naar je perspagina is voor ons perfect.",
  waarom: "je als artiest of impresariaat cabaret of comedy maakt",
};

const MATERIAAL = [
  [ORANJE, "Foto's", "Persfoto's in hoge resolutie, liggend en staand, met de naam van de fotograaf."],
  [ROZE, "Video", "Een trailer of fragment, als bestand of als link naar YouTube of Instagram."],
  [GEEL, "Tekst", "De voorstellingstekst en eventueel een korte bio of recensiecitaten."],
  [GROEN, "Affiche", "Het affiche of beeld van de tournee."],
];

const WAT_WIJ_DOEN = [
  "Foto's en tekst op de artiestpagina en de voorstellingspagina",
  "Posts en stories op Instagram, Facebook en TikTok, met tag en vermelding van de fotograaf",
  "Aandacht rond premières, try-outs en extra voorstellingen",
  "Altijd met een link naar de kaartverkoop van het theater",
];

const social = SITE.social.map((s) => `<a href="${s.url}" style="color:#FFFFFF;text-decoration:underline;font-weight:bold;">${s.naam}</a>`).join(`<span style="color:#8A8A8A;">&nbsp;&nbsp;·&nbsp;&nbsp;</span>`);

function html(v) {
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${v.onderwerp}</title>
</head>
<body style="margin:0;padding:0;background:#F2EFEA;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${v.voorbeeld}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F2EFEA;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;">

<tr><td style="background:${INK};padding:0;">
  <a href="https://www.cabaretiers.com/"><img src="https://www.cabaretiers.com/mail-kop.png" width="600" alt="Cabaretiers.com, de theateragenda" style="display:block;width:100%;max-width:600px;height:auto;border:0;color:#FFFFFF;font-family:${KOP};font-size:28px;"></a>
</td></tr>
<tr><td style="font-size:0;line-height:0;height:8px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td height="8" style="background:${ORANJE};width:25%;"></td><td height="8" style="background:${ROZE};width:25%;"></td><td height="8" style="background:${GEEL};width:25%;"></td><td height="8" style="background:${GROEN};width:25%;"></td>
  </tr></table>
</td></tr>

<tr><td style="padding:36px 40px 8px;font-family:${TEKST};font-size:16px;line-height:1.6;color:${INK};">
  <p style="margin:0 0 16px;">${v.aanhef}</p>
  ${v.intro.map((p) => `<p style="margin:0 0 16px;">${p}</p>`).join("\n  ")}
</td></tr>

<tr><td style="padding:8px 40px 8px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${LILA};">
    <tr><td align="center" style="padding:24px 20px;font-family:${TEKST};color:${INK};">
      <div style="font-family:${KOP};font-size:40px;line-height:1.1;font-weight:900;">10.000+</div>
      <div style="font-size:15px;line-height:1.4;margin-top:6px;">bezoekers per maand op zoek naar een avond cabaret of comedy</div>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:28px 40px 4px;font-family:${KOP};font-size:22px;line-height:1.2;font-weight:900;color:${INK};text-transform:uppercase;">Wat we graag ontvangen</td></tr>
<tr><td style="padding:12px 40px 8px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  ${MATERIAAL.map(([kleur, kop, tekst]) => `<tr>
    <td width="14" valign="top" style="padding:4px 0 14px;"><div style="width:14px;height:14px;background:${kleur};"></div></td>
    <td valign="top" style="padding:0 0 14px 14px;font-family:${TEKST};font-size:15px;line-height:1.5;color:${INK};"><b>${kop}</b><br>${tekst}</td>
  </tr>`).join("\n  ")}
  </table>
</td></tr>

<tr><td style="padding:12px 40px 4px;font-family:${KOP};font-size:22px;line-height:1.2;font-weight:900;color:${INK};text-transform:uppercase;">Wat wij ermee doen</td></tr>
<tr><td style="padding:12px 40px 8px;font-family:${TEKST};font-size:15px;line-height:1.5;color:${INK};">
  ${WAT_WIJ_DOEN.map((t) => `<p style="margin:0 0 8px;"><span style="color:${ORANJE};font-weight:bold;">&#10003;</span>&nbsp; ${t}</p>`).join("\n  ")}
  <p style="margin:16px 0 0;">Dat is <b>gratis</b>: we verkopen geen kaarten en vragen niets terug. Je houdt zelf alle rechten; wij gebruiken het materiaal alleen om je voorstelling onder de aandacht te brengen en halen het weg als je dat vraagt.</p>
</td></tr>

<tr><td style="padding:24px 40px 8px;font-family:${TEKST};font-size:16px;line-height:1.6;color:${INK};">
  <p style="margin:0 0 16px;"><b>Delen gaat het makkelijkst door op deze mail te antwoorden</b> met de bestanden of een link (WeTransfer, Dropbox, Google Drive of je perspagina). ${v.slot}</p>
</td></tr>

<tr><td align="center" style="padding:8px 40px 32px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="background:${ORANJE};"><a href="mailto:${SITE.email}?subject=${encodeURIComponent("Promotiemateriaal voor Cabaretiers.com")}" style="display:inline-block;padding:14px 26px;font-family:${TEKST};font-size:16px;font-weight:bold;color:${INK};text-decoration:none;">Materiaal sturen</a></td>
    <td width="12"></td>
    <td style="border:2px solid ${INK};"><a href="${v.pagina}" style="display:inline-block;padding:12px 24px;font-family:${TEKST};font-size:16px;font-weight:bold;color:${INK};text-decoration:none;">${v.paginaTekst}</a></td>
  </tr></table>
</td></tr>

<tr><td style="padding:0 40px 36px;font-family:${TEKST};font-size:16px;line-height:1.6;color:${INK};">
  <p style="margin:0;">Alvast bedankt!<br><br>Hartelijke groet,<br><b>Het team van Cabaretiers.com</b><br><a href="mailto:${SITE.email}" style="color:${INK};">${SITE.email}</a></p>
</td></tr>

<tr><td style="background:${INK};padding:24px 40px;font-family:${TEKST};font-size:14px;line-height:1.6;color:#FFFFFF;">
  <p style="margin:0 0 8px;"><a href="https://www.cabaretiers.com/" style="color:#FFFFFF;font-weight:bold;text-decoration:none;">www.cabaretiers.com</a> · volg ons op ${social}</p>
  <p style="margin:0;color:#BDBDBD;font-size:12px;">Je krijgt deze mail omdat ${v.waarom}. Liever geen mail meer van ons? Antwoord met "afmelden", dan halen we je adres meteen uit onze lijst.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>
`;
}

function tekst(v) {
  const p = (s) => s.replace(/<[^>]+>/g, "");
  return [
    `Onderwerp: ${v.onderwerp}`, "",
    v.aanhef, "", ...v.intro.map(p).flatMap((x) => [x, ""]),
    "Cabaretiers.com heeft meer dan 10.000 bezoekers per maand die op zoek zijn naar een avond cabaret of comedy.", "",
    "WAT WE GRAAG ONTVANGEN", ...MATERIAAL.map(([, k, t]) => `- ${k}: ${t}`), "",
    "WAT WIJ ERMEE DOEN", ...WAT_WIJ_DOEN.map((t) => `- ${t}`), "",
    "Dat is gratis: we verkopen geen kaarten en vragen niets terug. Je houdt zelf alle rechten; wij gebruiken het materiaal alleen om je voorstelling onder de aandacht te brengen en halen het weg als je dat vraagt.", "",
    `Delen gaat het makkelijkst door op deze mail te antwoorden met de bestanden of een link (WeTransfer, Dropbox, Google Drive of je perspagina). ${v.slot}`, "",
    `${v.paginaTekst}: ${v.pagina}`, "",
    "Alvast bedankt!", "", "Hartelijke groet,", "Het team van Cabaretiers.com", SITE.email, "",
    "--", `www.cabaretiers.com · ${SITE.social.map((s) => `${s.naam}: ${s.url}`).join(" · ")}`,
    'Liever geen mail meer van ons? Antwoord met "afmelden", dan halen we je adres meteen uit onze lijst.', "",
  ].join("\n");
}

writeFileSync(join(dir, "mail.html"), html(MAIL));
writeFileSync(join(dir, "mail.txt"), tekst(MAIL));
console.log("Mail gemaakt in ontwerp/mail/.");
