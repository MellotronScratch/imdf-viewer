"use strict";
// Inlezen van IMDF (zip of losse GeoJSON) en het opbouwen van het model.

// ---------- Loading ----------
async function readZip(blob) {
  const zip = await JSZip.loadAsync(blob);
  const out = {};
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir || path.startsWith("__MACOSX")) continue;
    const base = path.split("/").pop();
    if (!/\.(geojson|json)$/i.test(base)) continue;
    out[base.toLowerCase()] = await entry.async("string");
  }
  return out;
}
async function loadFiles(fileList) {
  setStatus("Bestanden lezen…");
  let raw = {};
  for (const f of fileList) {
    if (/\.zip$/i.test(f.name)) Object.assign(raw, await readZip(f));
    else raw[f.name.toLowerCase()] = await f.text();
  }
  await ingest(raw, fileList.length === 1 ? fileList[0].name : `${fileList.length} bestanden`);
}
function setStatus(t) { $("status").textContent = t; }

async function ingest(raw, label) {
  const parse = name => {
    const txt = raw[name + ".geojson"] ?? raw[name + ".json"];
    if (txt == null) return null;
    return JSON.parse(txt.replace(/^﻿/, ""));
  };
  const d = {};
  for (const t of ["manifest", "venue", "address", "building", "footprint", "level", "unit", "opening", "fixture",
                   "section", "detail", "kiosk", "geofence", "amenity", "anchor", "occupant", "relationship"]) {
    try { d[t] = parse(t); } catch (e) { throw new Error(`${t}.geojson is geen geldige JSON: ${e.message}`); }
  }
  try { d.metadata = parse("metadata"); } catch { d.metadata = null; }
  if (!d.level || !d.unit) throw new Error("Geen level.geojson / unit.geojson gevonden — is dit een IMDF-archief?");
  S.data = d;
  let saved = null; try { saved = localStorage.getItem("imdf-lang"); } catch {}
  S.lang = saved || d.manifest?.language || "nl";
  build();
  await mapReady;
  render();
  $("drop").classList.add("hidden");
  $("venue-sub").textContent = label;
  S.loaded = true;
  S.val = null;
  setTimeout(runValidation, 30);   // na het tekenen van de kaart
}

// ---------- Build model ----------
function feats(t) { return S.data[t]?.features || []; }
function build() {
  S.levelById = {}; S.unitById = {}; S.anchorById = {}; S.featById = {}; S.levelsByOrd = new Map();
  for (const l of feats("level")) {
    S.levelById[l.id] = l; S.featById[l.id] = l;
    const o = l.properties.ordinal;
    if (!S.levelsByOrd.has(o)) S.levelsByOrd.set(o, []);
    S.levelsByOrd.get(o).push(l);
  }
  S.ordinals = [...S.levelsByOrd.keys()].sort((a, b) => b - a);
  const ordOf = lid => S.levelById[lid]?.properties.ordinal;
  const tag = (t, f) => { f.properties._ord = ordOf(f.properties.level_id); f.properties._fid = f.id; f.properties._type = t; S.featById[f.id] = f; };
  for (const t of ["unit", "fixture", "section", "detail", "opening", "kiosk", "geofence"]) for (const f of feats(t)) tag(t, f);
  for (const l of feats("level")) { l.properties._ord = l.properties.ordinal; l.properties._fid = l.id; l.properties._type = "level"; }
  for (const f of feats("section")) f.properties._sg = sectionGroup(f.properties.category);
  for (const u of feats("unit")) S.unitById[u.id] = u;
  for (const a of feats("anchor")) S.anchorById[a.id] = a;
  // Alle overige features ook opzoekbaar maken (voor verwijzingen in de attributentabel)
  for (const t of ["venue", "address", "building", "footprint", "anchor", "relationship", "occupant", "amenity"])
    for (const f of feats(t)) if (!S.featById[f.id]) S.featById[f.id] = f;

  // Amenities: point geometry, level via referenced units
  S.points.amenity = [];
  for (const a of feats("amenity")) {
    const p = a.properties;
    const units = (p.unit_ids || []).map(id => S.unitById[id]).filter(Boolean);
    const ords = [...new Set(units.map(u => u.properties._ord).filter(o => o != null))];
    const geom = a.geometry || units[0]?.properties.display_point;
    if (!geom || !ords.length) continue;
    S.featById[a.id] = a;
    S.points.amenity.push({ type: "Feature", geometry: geom, properties: {
      _fid: a.id, _type: "amenity", _ok: "|" + ords.join("|") + "|", _ords: ords, category: p.category || "unspecified",
      _name: nm(p.name) || prettyCat(p.category), _color: groupColor(AMENITY_GROUPS, p.category),
      _icon: "am-" + (p.category || "unspecified") } });
  }
  // Occupants: geometry null; location from anchor → unit → level
  S.points.occupant = [];
  for (const o of feats("occupant")) {
    const p = o.properties, an = S.anchorById[p.anchor_id];
    if (!an?.geometry) continue;
    const unit = S.unitById[an.properties.unit_id];
    const ord = unit?.properties._ord;
    if (ord == null) continue;
    S.featById[o.id] = o;
    S.points.occupant.push({ type: "Feature", geometry: an.geometry, properties: {
      _fid: o.id, _type: "occupant", _ok: "|" + ord + "|", _ords: [ord], category: p.category || "unspecified",
      _name: nm(p.name) || "Occupant", _color: groupColor(OCC_GROUPS, p.category),
      _icon: "oc-" + (p.category || "unspecified") } });
  }
  // Snel opzoeken van het kaartpunt van een amenity/occupant (voor tabel en validatie)
  S.pointById = new Map([...S.points.amenity, ...S.points.occupant].map(p => [p.properties._fid, p]));
  renderInfo();
  const v = feats("venue")[0];
  $("venue-name").textContent = nm(v?.properties.name) || "IMDF Viewer";
  document.title = (nm(v?.properties.name) || "IMDF") + " · IMDF Viewer";
  S.ord = S.ordinals.includes(0) ? 0 : S.ordinals[S.ordinals.length - 1];
}
