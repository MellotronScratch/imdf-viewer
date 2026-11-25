"use strict";
// Gedeelde toestand en kleine hulpfuncties.

// ---------- State ----------
const S = {
  lang: "nl", data: {}, levelsByOrd: new Map(), ordinals: [], ord: null,
  levelById: Object.create(null), unitById: Object.create(null), anchorById: Object.create(null), featById: Object.create(null),
  hiddenCats: { amenity: new Set(), occupant: new Set() },
  points: { amenity: [], occupant: [] }, loaded: false
};
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
// Naam in de gekozen taal; ontbreekt die, dan de taal uit het manifest, en anders de eerste beschikbare
const nm = o => !o ? null : (typeof o === "string" ? o : (o[S.lang] || o[S.data.manifest?.language] || Object.values(o)[0] || null));
const prettyCat = c => (c || "").replace(/\./g, " › ");
// Alleen http(s)-adressen worden klikbare links (geen javascript:, data: e.d. uit de data)
const safeUrl = u => { try { const x = new URL(String(u)); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; } };
const extLink = (u, text = u) => { const h = safeUrl(u); return h ? `<a href="${esc(h)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>` : esc(u); };
// Pas uitvoeren als er even niet getypt wordt
const debounce = (fn, ms = 120) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
