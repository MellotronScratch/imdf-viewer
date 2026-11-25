# Meegeleverde bibliotheken

Deze bestanden worden door de validatie-worker (`js/validator/worker.js`) geladen met `importScripts`.
Daarbij kan geen integriteitscontrole (SRI) plaatsvinden, daarom staan ze in de repository in plaats van op een CDN.

| Bestand | Bron | Licentie |
|---|---|---|
| `turf-7.4.0.min.js` | https://unpkg.com/@turf/turf@7.4.0/turf.min.js | MIT, © Turf.js-bijdragers |
| `rbush-4.0.1.min.js` | https://unpkg.com/rbush@4.0.1/rbush.min.js | MIT, © Vladimir Agafonkin |

Bijwerken: download de nieuwe versie, geef het bestand de nieuwe versie in de naam en pas het pad in `js/validator/worker.js` aan.
