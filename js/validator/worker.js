"use strict";
// Web Worker: draait de volledige validatie op de achtergrond, zodat de kaart bruikbaar blijft.
// Bericht in: { data, lang }   Berichten uit: { progress } … daarna { result } of { error }
importScripts("rules.js", "core.js", "geometry.js");

self.onmessage = e => {
  const { data, lang } = e.data;
  const post = m => self.postMessage(m);
  try {
    post({ progress: "Regels controleren…" });
    const result = validateIMDF({ data, lang });
    let geoError = null;
    try { importScripts("../../vendor/turf-7.4.0.min.js", "../../vendor/rbush-4.0.1.min.js"); }
    catch (err) { geoError = "Turf.js/RBush konden niet geladen worden (" + err.message + "); geometrische regels niet gecontroleerd."; }
    if (!geoError) {
      try { validateIMDFGeometry({ data, result, progress: p => post({ progress: p }) }); }
      catch (err) { geoError = "Geometrische controle mislukt: " + err.message; }
    }
    result.geoError = geoError;
    post({ result });
  } catch (err) { post({ error: err.message }); }
};
