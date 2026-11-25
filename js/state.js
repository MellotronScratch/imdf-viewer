"use strict";
// Gedeelde toestand en kleine hulpfuncties.

// ---------- State ----------
const S = {
  lang: "nl", data: {}, levelsByOrd: new Map(), ordinals: [], ord: null,
  levelById: {}, unitById: {}, anchorById: {}, featById: {},
  hiddenCats: { amenity: new Set(), occupant: new Set() },
  points: { amenity: [], occupant: [] }, loaded: false
};
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
// Naam in de gekozen taal; ontbreekt die, dan de taal uit het manifest, en anders de eerste beschikbare
const nm = o => !o ? null : (typeof o === "string" ? o : (o[S.lang] || o[S.data.manifest?.language] || Object.values(o)[0] || null));
const prettyCat = c => (c || "").replace(/\./g, " › ");
// Pas uitvoeren als er even niet getypt wordt
const debounce = (fn, ms = 120) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
