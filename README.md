# IMDF Viewer

Bekijk en valideer IMDF-indoorkaarten ([Indoor Mapping Data Format, OGC 20-094](https://docs.ogc.org/cs/20-094/)) in de browser.
Online: <https://mellotronscratch.github.io/imdf-viewer/>

De IMDF-data verlaat je computer niet. Bestanden worden alleen in de browser gelezen en, om na verversen terug te komen, lokaal in IndexedDB bewaard.

## Gebruik

Sleep een IMDF-archief (`.zip`) of de losse `.geojson`-bestanden op de pagina, of kies **Bestand kiezen…**.

| Onderdeel | Wat het doet |
|---|---|
| Verdiepingen | Knoppen rechts op de kaart. De kaart onthoudt verdieping en positie. |
| Thema | Automatisch, licht of donker (knoppen rechtsboven in de zijbalk). |
| Taal van namen | Keuzelijst in de kop, of klik op een taal bij *Namen in*. Ontbreekt een vertaling, dan wordt de taal uit het manifest getoond. |
| Lagen | Iedere laag aan/uit. Rechtsklik op een laag → *Toon tabelinhoud*. |
| Attributentabel | Zoeken, sorteren, kolombreedtes slepen, CSV-export. Klik = oplichten op de kaart, dubbelklik of 🔍 = zoomen, nogmaals klikken of Esc = deselecteren. |
| Bestand | Manifest, `metadata.json`, venue-gegevens en het aantal features per type. |
| Validatie | Draait automatisch na het laden. Bevindingen en regels openen als tabel; klik op een bevinding om het feature op de kaart te zien. |

### Validatie

De validatie volgt de officiële regellijst [`imdf-validations-1.0.3.csv`](https://docs.ogc.org/cs/20-094/imdf-validations-1.0.3.csv) (358 regels, met de oorspronkelijke namen, ernst en definities). Er worden geen eigen regels toegevoegd.

- Geometrische regels (overlap, bedekking, zelfdoorsnijding) gebruiken [Turf.js](https://turfjs.org). Ze draaien in een Web Worker, zodat de kaart bruikbaar blijft.
- Oppervlakteverschillen tot **0,01 m²** gelden als afrondingsruis. Dat is een keuze van deze viewer en staat per regel vermeld.
- Overlapregels vergelijken alleen features op hetzelfde level, of bij levels op dezelfde ordinal.
- Niet gecontroleerd: `AddressMustHaveProvinceCode`, want daarvoor is een ISO 3166-2-lijst nodig. De regeltabel toont per regel of en hoe hij gecontroleerd is.

## Veiligheid

Een IMDF-archief is data, geen code: de viewer voert niets uit wat in een bestand staat.

- **Tekst blijft tekst.** Alle waarden uit de data worden ge-escaped voordat ze in de pagina komen, ook namen, ID's, attribuutnamen en taalcodes.
- **Links** worden alleen klikbaar voor `http(s)`. Een website-veld met `javascript:` of `data:` wordt als tekst getoond.
- **Content Security Policy:** alleen scripts van deze site en de twee vaste CDN's (met SRI). Geen inline scripts, geen `eval`. Mocht er ooit iets door de escaping glippen, dan weigert de browser het.
- **CSV-export:** waarden die met `=`, `+`, `-` of `@` beginnen krijgen een `'` ervoor, zodat Excel ze niet als formule uitvoert.
- **Zip-bommen:** archieven die uitgepakt groter zijn dan 512 MB per bestand of 1 GB in totaal worden geweigerd.
- **`?src=`** laadt alleen bestanden van dezelfde server.
- Categorieën of ID's als `__proto__` worden als gewone waarden behandeld.

## Lokaal draaien

```sh
node serve.js            # http://localhost:8080
```

Een webserver is nodig voor de Web Worker. Met `?src=pad/naar/bestand.zip` laad je direct een bestand dat door dezelfde server wordt aangeboden.

## Structuur

```
index.html              opmaak van de pagina
css/app.css             vormgeving (licht/donker via :root[data-theme])
js/                     viewer, als gewone scripts in vaste volgorde (zie index.html)
  theme-early.js        thema zetten vóór de eerste weergave (in <head>)
  palette.js            kleuren per thema en categoriegroepen
  icons.js              pictogrammen (Material Design Icons) en canvas-tekenen
  state.js              gedeelde toestand en hulpfuncties
  theme.js              thema en kaartkleuren
  map.js                MapLibre-kaart en BRT-achtergrondkaart
  data.js               inlezen van IMDF en opbouwen van het model
  info.js               Bestand-paneel en taalkeuze
  validation.js         validatie-paneel (start de worker)
  render.js             kaartlagen, clusters, verdiepingen, filters
  popups.js             pop-ups en klikken op de kaart
  table.js              attributentabel
  app.js                zoeken, openen, onthouden, opstarten
js/validator/
  rules.js              OGC-regels, categorieën en geometrietypen
  core.js               niet-geometrische controles
  geometry.js           geometrische controles (Turf.js + RBush)
  worker.js             Web Worker die alles op de achtergrond draait
vendor/                 Turf.js en RBush (voor de worker; zie vendor/README.md)
serve.js                lokale ontwikkelserver
```

## Uitrol

Elke push naar `main` publiceert via GitHub Actions (`.github/workflows/pages.yml`) naar GitHub Pages. Alleen `index.html`, `css/`, `js/` en `vendor/` worden gepubliceerd. IMDF-data (`*.zip`, `*.geojson`) staat in `.gitignore` en gaat nooit mee.

## Bronnen en licenties

- [MapLibre GL JS](https://maplibre.org) 4.7.1 (BSD-3-Clause), [JSZip](https://stuk.github.io/jszip/) 3.10.1 (MIT), via CDN met SRI
- [Turf.js](https://turfjs.org) 7.4.0 (MIT) en [RBush](https://github.com/mourner/rbush) 4.0.1 (MIT), in `vendor/`
- Pictogrammen: [Material Design Icons](https://pictogrammers.com/library/mdi/) 7.4.47 (Apache 2.0), ingebakken in `js/icons.js`
- Achtergrondkaart: [BRT Achtergrondkaart grijs](https://www.pdok.nl), © Kadaster
- Lettertypen voor labels: [OpenFreeMap](https://openfreemap.org)
