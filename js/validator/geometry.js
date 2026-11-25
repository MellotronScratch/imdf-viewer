"use strict";
// Geometrische IMDF-validatie (Turf.js + RBush). Vult het resultaat van validateIMDF aan.
// ======================================================================================
// Geometrische regels (vereist Turf.js en RBush). Draait na validateIMDF op dezelfde data.
// Tolerantie: oppervlakteverschillen tot GEO_TOL m² gelden als afrondingsruis (gedeelde randen
// met zwevendekommagetallen geven anders minuscule "overlap").
// ======================================================================================
const GEO_TOL = 0.01;   // m²
function validateIMDFGeometry({ data, result, progress = () => {} }) {
  const T = globalThis.turf, RB = globalThis.RBush;
  if (!T || !RB) throw new Error("Turf.js/RBush niet geladen");
  const R = new Map(result.rules.map(x => [x.feature + "|" + x.rule, x]));
  const issues = result.issues;
  const F = t => t[0].toUpperCase() + t.slice(1);
  const mark = (t, ...rs) => rs.forEach(r => { const x = R.get(F(t) + "|" + r); if (x) { x.checked = true; x.partial = x.partial && /Geen features/.test(x.partial) ? x.partial : null; } });
  const add = (t, r, fid, msg, attr = "geometry") => { const x = R.get(F(t) + "|" + r); if (!x) return; x.checked = true; x.count++;
    issues.push({ severity: x.severity, rule: r, feature: x.feature, ftype: t, fid, attr, msg }); };
  const byType = {}; for (const t of Object.keys(data)) byType[t] = (data[t]?.features || []).filter(f => f && f.properties);
  const all = t => byType[t] || [];
  const byId = new Map(); for (const t in byType) for (const f of byType[t]) if (typeof f.id === "string") byId.set(f.id, f);
  const poly = g => g && (g.type === "Polygon" || g.type === "MultiPolygon");
  const feat = g => ({ type: "Feature", properties: {}, geometry: g });
  const m2 = x => x < 1 ? x.toFixed(2).replace(".", ",") : Math.round(x).toLocaleString("nl-NL");
  const safe = (fn, d = null) => { try { return fn(); } catch { return d; } };
  const nPts = g => { let n = 0; const w = c => { if (typeof c[0] === "number") n++; else c.forEach(w); }; w(g.coordinates); return n; };
  const grow = (b, e = 1e-6) => [b[0] - e, b[1] - e, b[2] + e, b[3] + e];
  // Groot polygoon eerst uitsnijden tot de omgeving van het andere (scheelt enorm bij duizenden punten)
  const local = (big, around) => nPts(big) > 400 ? safe(() => T.bboxClip(feat(big), grow(bbox(around))).geometry, big) : big;
  const emptyG = g => !g || !g.coordinates || !g.coordinates.length || (g.type === "MultiPolygon" && g.coordinates.every(p => !p.length));
  // Oppervlakte van A ∩ B en A \ B
  const interArea = (a, b) => safe(() => { const A = local(a, b), B = local(b, a); if (emptyG(A) || emptyG(B)) return 0;
    const i = T.intersect(T.featureCollection([feat(A), feat(B)])); return i ? T.area(i) : 0; }, 0);
  const diffArea = (a, b) => safe(() => { const B = local(b, a); if (emptyG(B)) return T.area(feat(a));
    const d = T.difference(T.featureCollection([feat(a), feat(B)])); return d ? T.area(d) : 0; }, null);
  const unionOf = gs => { if (!gs.length) return null; if (gs.length === 1) return gs[0];
    return safe(() => T.union(T.featureCollection(gs.map(feat)))?.geometry || null); };
  const bbox = g => T.bbox(feat(g));
  const index = list => { const rb = new RB(); rb.load(list.filter(x => x.g).map(x => { const [a, b, c, d] = bbox(x.g); return { minX: a, minY: b, maxX: c, maxY: d, x }; })); return rb; };
  const near = (rb, g) => { const [a, b, c, d] = bbox(g); return rb.search({ minX: a, minY: b, maxX: c, maxY: d }).map(e => e.x); };
  const groupBy = (list, key) => { const m = new Map(); for (const x of list) { const k = key(x); if (k == null) continue; (m.get(k) || m.set(k, []).get(k)).push(x); } return m; };
  const levelOf = f => byId.get(f.properties.level_id);
  // Container met index op de randen: snel "ligt binnen" bepalen voor grote polygonen (levels, venue)
  const contCache = new Map();
  function container(f) {
    let c = contCache.get(f); if (c) return c;
    const segs = [], polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const pl of polys) for (const r of pl) for (let i = 0; i < r.length - 1; i++) { const [x1, y1] = r[i], [x2, y2] = r[i + 1];
      segs.push({ minX: Math.min(x1, x2), minY: Math.min(y1, y2), maxX: Math.max(x1, x2), maxY: Math.max(y1, y2), x1, y1, x2, y2 }); }
    const rb = new RB(); rb.load(segs);
    c = { g: f.geometry, rb, bb: bbox(f.geometry) }; contCache.set(f, c); return c;
  }
  const pipC = (c, [x, y]) => { let n = 0;   // straal naar +x, alleen randen in die strook
    for (const s of c.rb.search({ minX: x, minY: y, maxX: c.bb[2] + 1, maxY: y })) if ((s.y1 > y) !== (s.y2 > y) && x < (s.x2 - s.x1) * (y - s.y1) / (s.y2 - s.y1) + s.x1) n++;
    return n % 2 === 1; };
  const firstPt = g => { let p = null; const w = c => { if (p) return; if (typeof c[0] === "number") p = c; else c.forEach(w); }; w(g.coordinates); return p; };
  // Punt binnen of op de rand van c
  const onEdge = (c, [x, y]) => c.rb.search({ minX: x - 1e-9, minY: y - 1e-9, maxX: x + 1e-9, maxY: y + 1e-9 }).some(s => {
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1, L = dx * dx + dy * dy; if (!L) return Math.hypot(x - s.x1, y - s.y1) < 1e-9;
    const t = Math.max(0, Math.min(1, ((x - s.x1) * dx + (y - s.y1) * dy) / L)); return Math.hypot(x - (s.x1 + t * dx), y - (s.y1 + t * dy)) < 1e-9; });
  const ptCovered = (c, p) => onEdge(c, p) || pipC(c, p);
  // Lijnstuk AB "covered by" c: knip AB op de snijpunten met de randen van c en test van elk stukje het midden (exact)
  function segCovered(c, A, B) {
    if (!ptCovered(c, A) || !ptCovered(c, B)) return false;
    const ts = [0, 1], dx = B[0] - A[0], dy = B[1] - A[1];
    for (const s of c.rb.search({ minX: Math.min(A[0], B[0]), minY: Math.min(A[1], B[1]), maxX: Math.max(A[0], B[0]), maxY: Math.max(A[1], B[1]) })) {
      const ex = s.x2 - s.x1, ey = s.y2 - s.y1, den = dx * ey - dy * ex; if (!den) continue;
      const t = ((s.x1 - A[0]) * ey - (s.y1 - A[1]) * ex) / den, u = ((s.x1 - A[0]) * dy - (s.y1 - A[1]) * dx) / den;
      if (t > 0 && t < 1 && u >= 0 && u <= 1) ts.push(t);
    }
    ts.sort((a, b) => a - b);
    for (let i = 1; i < ts.length; i++) { const m = (ts[i - 1] + ts[i]) / 2; if (ts[i] - ts[i - 1] > 1e-12 && !ptCovered(c, [A[0] + m * dx, A[1] + m * dy])) return false; }
    return true;
  }
  const lineCovered = (c, g) => { const lines = g.type === "LineString" ? [g.coordinates] : g.coordinates;
    return lines.every(l => l.every((p, i) => i === 0 || segCovered(c, l[i - 1], p))); };
  // Grootste afstand (m) tot de rand van c van de punten van g die buiten c liggen
  function maxDistOut(c, g) {
    let best = 0; const w = co => { if (typeof co[0] === "number") { if (ptCovered(c, co)) return;
      const [x, y] = co, k = Math.cos(y * Math.PI / 180), M = 111320; let d = Infinity;
      for (let r = 0.0005; d === Infinity && r < 1; r *= 4) for (const s of c.rb.search({ minX: x - r, minY: y - r, maxX: x + r, maxY: y + r })) {
        const ax = (s.x1 - x) * k * M, ay = (s.y1 - y) * M, bx = (s.x2 - x) * k * M, by = (s.y2 - y) * M, dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
        const t = L ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L)) : 0; d = Math.min(d, Math.hypot(ax + t * dx, ay + t * dy)); }
      if (d < Infinity) best = Math.max(best, d); } else co.forEach(w); };
    w(g.coordinates); return best;
  }
  const distTxt = d => d >= 1 ? d.toFixed(1).replace(".", ",") + " m" : Math.round(d * 100) + " cm";
  // Deel van g dat buiten container c valt: m² voor vlakken, 1/0 voor lijnen en punten
  function outside(g, c) {
    const b = bbox(g), whole = () => poly(g) ? T.area(feat(g)) : 1;
    if (b[2] < c.bb[0] || b[0] > c.bb[2] || b[3] < c.bb[1] || b[1] > c.bb[3]) return whole();
    const touches = c.rb.search({ minX: b[0] - 1e-7, minY: b[1] - 1e-7, maxX: b[2] + 1e-7, maxY: b[3] + 1e-7 }).length > 0;
    if (!touches) return pipC(c, firstPt(g)) ? 0 : whole();
    if (g.type === "Point") return ptCovered(c, g.coordinates) ? 0 : 1;
    if (/LineString/.test(g.type)) return lineCovered(c, g) ? 0 : 1;
    const clip = safe(() => T.bboxClip(feat(c.g), grow(b)).geometry, null);
    if (emptyG(clip)) return whole();
    if (poly(g)) return safe(() => { const d = T.difference(T.featureCollection([feat(g), feat(clip)])); return d ? T.area(d) : 0; }, 0);
    if (g.type === "Point") return ptCovered(c, g.coordinates) ? 0 : 1;
    return lineCovered(c, g) ? 0 : 1;
  }
  const STRUCT = new Set(["brick", "column", "concrete", "drywall", "glass", "structure", "wood"]);

  // ---- Paarsgewijze overlap binnen groepen ----
  function overlaps(t, rule, list, groupKey, label) {
    mark(t, rule);
    for (const [, grp] of groupBy(list.filter(f => poly(f.geometry)), groupKey)) {
      const items = grp.map(f => ({ f, g: f.geometry })), rb = index(items);
      for (const a of items) for (const b of near(rb, a.g)) {
        if (b.f.id <= a.f.id) continue;
        const ar = interArea(a.g, b.g);
        if (ar > GEO_TOL) add(t, rule, a.f.id, `Overlapt ${label} ${b.f.id} over ${m2(ar)} m².`);
      }
    }
  }
  // ---- "Covered by referenced level" ----
  function coveredByLevel(t, rule) {
    mark(t, rule);
    for (const f of all(t)) {
      const l = levelOf(f); if (!l || !poly(l.geometry) || !f.geometry) continue;
      const o = outside(f.geometry, container(l));
      if (poly(f.geometry) ? o > GEO_TOL : o) { const c = container(l), d = maxDistOut(c, f.geometry);
        add(t, rule, f.id, poly(f.geometry) ? `Valt voor ${m2(o)} m² buiten het verwezen level${d ? ` (tot ${distTxt(d)} van de rand)` : ""}.` : `Ligt ${d ? `tot ${distTxt(d)} ` : "(deels) "}buiten het verwezen level.`); }
    }
  }
  // ---- "Covered by a Unit" + structurele/opentobelow-units ----
  const unitIdx = new Map(); for (const [lid, us] of groupBy(all("unit").filter(u => poly(u.geometry)), u => u.properties.level_id)) unitIdx.set(lid, index(us.map(f => ({ f, g: f.geometry }))));
  function inUnits(t, coverRule, otbRule, structRule) {
    mark(t, coverRule, otbRule, structRule);
    for (const f of all(t)) {
      if (!poly(f.geometry)) continue;
      const rb = unitIdx.get(f.properties.level_id); if (!rb) continue;
      const cand = near(rb, f.geometry);
      const cover = cand.filter(u => !STRUCT.has(u.f.properties.category) && u.f.properties.category !== "opentobelow");
      // Eerst: ligt hij binnen één unit? (snel via randindex); zo niet, dan tegen de unie van de omliggende units
      const inOne = cover.some(u => outside(f.geometry, container(u.f)) <= GEO_TOL);
      if (!inOne) { const un = unionOf(cover.map(u => u.g)), d = un ? diffArea(f.geometry, un) : null;
        if (!un || (d != null && d > GEO_TOL)) add(t, coverRule, f.id, un ? `Valt voor ${m2(d)} m² buiten de units.` : `Ligt in geen enkele unit.`); }
      for (const u of cand) {
        const c = u.f.properties.category;
        if (c === "opentobelow" && outside(f.geometry, container(u.f)) <= GEO_TOL) add(t, otbRule, f.id, `Ligt binnen opentobelow-unit ${u.f.id}.`);
        if (STRUCT.has(c)) { const ar = interArea(f.geometry, u.g); if (ar > GEO_TOL) add(t, structRule, f.id, `Overlapt constructie-unit ${u.f.id} (${c}) over ${m2(ar)} m².`); }
      }
    }
  }

  // ---------- Zelfdoorsnijding (FileMustBeValidGeoJSON) ----------
  progress("Zelfdoorsnijding controleren…");
  { const r = R.get("N/A|FileMustBeValidGeoJSON");
    for (const t in byType) for (const f of byType[t]) {
      const g = f.geometry; if (!g || !/Polygon|LineString/.test(g.type)) continue;
      const k = safe(() => T.kinks(feat(g)).features, []);
      if (k.length) { r.checked = true; r.count++; issues.push({ severity: r.severity, rule: r.rule, feature: "N/A", ftype: t, fid: f.id, attr: "geometry",
        msg: `Geometrie snijdt zichzelf (${k.length} snijpunt${k.length > 1 ? "en" : ""}, o.a. ${k[0].geometry.coordinates.map(c => c.toFixed(7)).join(", ")}).` }); }
    }
    if (r) r.partial = null; }

  // ---------- Bedekking door verwezen level ----------
  progress("Ligging binnen levels controleren…");
  for (const [t, r] of [["unit", "UnitMustBeCoveredByReferencedLevel"], ["section", "SectionMustBeCoveredByReferencedLevel"], ["fixture", "FixtureMustBeCoveredByReferencedLevel"],
    ["kiosk", "KioskMustBeCoveredByReferencedLevel"], ["detail", "DetailMustBeCoveredByReferencedLevel"], ["opening", "OpeningMustBeCoveredByReferencedLevel"]]) coveredByLevel(t, r);
  mark("geofence", "GeofenceNotCoveredByReferencedLevel");
  for (const g of all("geofence")) for (const lid of g.properties.level_ids || []) { const l = byId.get(lid); if (!l || !poly(l.geometry) || !poly(g.geometry)) continue;
    const d = outside(g.geometry, container(l)); if (d > GEO_TOL) add("geofence", "GeofenceNotCoveredByReferencedLevel", g.id, `Valt voor ${m2(d)} m² buiten level ${lid}.`); }

  // ---------- Overlap ----------
  progress("Units op overlap controleren…");
  overlaps("unit", "UnitsMustNotOverlap", all("unit").filter(u => u.properties.category !== "opentobelow"), u => u.properties.level_id, "unit");
  progress("Sections, fixtures en kiosks op overlap controleren…");
  overlaps("section", "SectionsOverlap", all("section"), s => s.properties.level_id, "section");
  overlaps("fixture", "FixturesMustNotOverlap", all("fixture"), f => f.properties.level_id, "fixture");
  overlaps("kiosk", "KiosksMustNotOverlap", all("kiosk"), f => f.properties.level_id, "kiosk");
  overlaps("level", "LevelsShouldNotOverlap", all("level"), l => l.properties.ordinal, "level (zelfde ordinal)");
  mark("geofence", "GeofencesOverlap");
  { const lv = []; for (const g of all("geofence")) for (const l of g.properties.level_ids || []) lv.push({ f: g, l });
    for (const [, grp] of groupBy(lv, x => x.l)) { const items = grp.filter(x => poly(x.f.geometry)).map(x => ({ f: x.f, g: x.f.geometry })), rb = index(items);
      for (const a of items) for (const b of near(rb, a.g)) if (b.f.id > a.f.id) { const ar = interArea(a.g, b.g); if (ar > GEO_TOL) add("geofence", "GeofencesOverlap", a.f.id, `Overlapt geofence ${b.f.id} over ${m2(ar)} m².`); } } }
  mark("fixture", "FixtureMustNotOverlapKiosk");
  for (const [lid, ks] of groupBy(all("kiosk").filter(k => poly(k.geometry)), k => k.properties.level_id)) {
    const rb = index(ks.map(f => ({ f, g: f.geometry })));
    for (const fx of all("fixture").filter(f => f.properties.level_id === lid && poly(f.geometry))) for (const k of near(rb, fx.geometry)) {
      const ar = interArea(fx.geometry, k.g); if (ar > GEO_TOL) add("fixture", "FixtureMustNotOverlapKiosk", fx.id, `Overlapt kiosk ${k.f.id} over ${m2(ar)} m².`); } }

  // ---------- Fixtures en kiosks in units ----------
  progress("Fixtures en kiosks in units controleren…");
  inUnits("fixture", "FixtureMustBeCoveredByUnit", "OpenToBelowUnitMustNotContainFixture", "StructuralUnitMustNotContainFixture");
  inUnits("kiosk", "KioskMustBeCoveredByUnit", "OpenToBelowUnitMustNotContainKiosk", "StructuralUnitMustNotContainKiosk");

  // ---------- Levels volledig bedekt door units ----------
  progress("Bedekking van levels door units controleren…");
  mark("level", "LevelMustBeFullyCoveredByUnits");
  { const byLevel = groupBy(all("unit").filter(u => poly(u.geometry)), u => u.properties.level_id);
    let i = 0; const lv = all("level").filter(l => poly(l.geometry));
    for (const l of lv) {
      progress(`Bedekking van levels door units controleren… (${++i}/${lv.length})`);
      const un = unionOf((byLevel.get(l.id) || []).map(u => u.geometry));
      if (!un) continue;
      const gap = diffArea(l.geometry, un), out = diffArea(un, l.geometry);
      if ((gap != null && gap > GEO_TOL) || (out != null && out > GEO_TOL))
        add("level", "LevelMustBeFullyCoveredByUnits", l.id, "Unie van de units wijkt af van het level: " + [gap > GEO_TOL && `${m2(gap)} m² van het level is niet bedekt door units`, out > GEO_TOL && `${m2(out)} m² aan units valt buiten het level`].filter(Boolean).join(", ") + ".");
    } }

  // ---------- Footprints ----------
  progress("Footprints controleren…");
  const fps = c => all("footprint").filter(f => f.properties.category === c && poly(f.geometry));
  mark("footprint", "AerialFootprintMustNotContainOrEqualAerialFootprint", "GroundFootprintMustNotContainOrEqualGroundFootprint", "AerialFootprintsShouldNotOverlap",
    "GroundFootprintsShouldNotOverlap", "SubterraneanFootprintsOverlap", "AerialFootprintShouldCoverGroundFootprint", "GroundFootprintShouldIntersectSubterraneanFootprint",
    "IndoorLevelNotEqualToAerialFootprint", "IndoorLevelNotEqualToGroundFootprint", "IndoorLevelNotEqualToSubterraneanFootprint");
  for (const [c, containRule, overlapRule] of [["aerial", "AerialFootprintMustNotContainOrEqualAerialFootprint", "AerialFootprintsShouldNotOverlap"],
    ["ground", "GroundFootprintMustNotContainOrEqualGroundFootprint", "GroundFootprintsShouldNotOverlap"], ["subterranean", null, "SubterraneanFootprintsOverlap"]]) {
    const list = fps(c);
    for (let i = 0; i < list.length; i++) for (let j = 0; j < list.length; j++) {
      if (i === j) continue; const a = list[i], b = list[j];
      if (containRule && diffArea(b.geometry, a.geometry) <= GEO_TOL) add("footprint", containRule, a.id, `Bevat of is gelijk aan ${c}-footprint ${b.id}.`);
      else if (j > i) { const ar = interArea(a.geometry, b.geometry); if (ar > GEO_TOL) add("footprint", overlapRule, a.id, `Overlapt ${c}-footprint ${b.id} over ${m2(ar)} m².`); }
    }
  }
  const shareB = (a, b) => (a.properties.building_ids || []).some(x => (b.properties.building_ids || []).includes(x));
  for (const g of fps("ground")) { const aer = fps("aerial").filter(a => shareB(a, g));
    if (aer.length && !aer.some(a => diffArea(g.geometry, a.geometry) <= GEO_TOL)) add("footprint", "AerialFootprintShouldCoverGroundFootprint", g.id, `Geen aerial-footprint van dezelfde building bedekt deze ground-footprint.`); }
  for (const s of fps("subterranean")) if (!fps("ground").some(g => safe(() => T.booleanIntersects(feat(s.geometry), feat(g.geometry)), false)))
    add("footprint", "GroundFootprintShouldIntersectSubterraneanFootprint", s.id, `Snijdt of raakt geen enkele ground-footprint.`);
  // Unie van indoor-levels per building vergelijken met de footprint
  for (const [c, rule, test] of [["aerial", "IndoorLevelNotEqualToAerialFootprint", o => o >= 0], ["ground", "IndoorLevelNotEqualToGroundFootprint", o => o === 0],
    ["subterranean", "IndoorLevelNotEqualToSubterraneanFootprint", o => o <= -1]]) for (const fp of fps(c)) {
    const lv = all("level").filter(l => l.properties.outdoor === false && test(l.properties.ordinal) && poly(l.geometry) && shareB(l, fp));
    if (!lv.length) continue;
    const un = unionOf(lv.map(l => l.geometry)); if (!un) continue;
    const a = diffArea(un, fp.geometry), b = diffArea(fp.geometry, un);
    if ((a != null && a > GEO_TOL) || (b != null && b > GEO_TOL)) add("footprint", rule, fp.id, `Unie van ${lv.length} indoor-level(s) is niet gelijk aan de footprint: ` +
      [a > GEO_TOL && `${m2(a)} m² levels buiten de footprint`, b > GEO_TOL && `${m2(b)} m² footprint zonder level`].filter(Boolean).join(", ") + ".");
  }
  // Levels en footprints: zelfde building
  mark("level", "LevelAndAerialFootprintShouldReferenceSameBuilding", "LevelAndGroundFootprintShouldReferenceSameBuilding", "LevelAndSubterraneanFootprintShouldReferenceSameBuilding", "OutdoorLevelShouldNotOverlapGroundFootprint");
  for (const l of all("level").filter(l => poly(l.geometry))) {
    for (const [c, rule] of [["aerial", "LevelAndAerialFootprintShouldReferenceSameBuilding"], ["ground", "LevelAndGroundFootprintShouldReferenceSameBuilding"], ["subterranean", "LevelAndSubterraneanFootprintShouldReferenceSameBuilding"]])
      for (const fp of fps(c)) if (!shareB(l, fp) && !l.properties.outdoor && interArea(l.geometry, fp.geometry) > GEO_TOL) add("level", rule, l.id, `Overlapt ${c}-footprint ${fp.id}, maar verwijst niet naar dezelfde building.`);
    if (l.properties.outdoor === true && l.properties.ordinal === 0) for (const fp of fps("ground")) { const ar = interArea(l.geometry, fp.geometry);
      if (ar > GEO_TOL) add("level", "OutdoorLevelShouldNotOverlapGroundFootprint", l.id, `Buiten-level overlapt ground-footprint ${fp.id} over ${m2(ar)} m².`); }
  }

  // ---------- Geofence binnen footprints van building ----------
  mark("geofence", "GeofenceNotWithinReferencedBuildingFootprint");
  for (const g of all("geofence").filter(g => poly(g.geometry))) for (const bid of g.properties.building_ids || []) {
    const un = unionOf(all("footprint").filter(f => (f.properties.building_ids || []).includes(bid) && poly(f.geometry)).map(f => f.geometry));
    if (un && diffArea(g.geometry, un) > GEO_TOL) add("geofence", "GeofenceNotWithinReferencedBuildingFootprint", g.id, `Ligt (deels) buiten de footprints van building ${bid}.`); }

  // ---------- Openings en details ----------
  mark("opening", "OpeningMustBeCoveredByUnitBoundary", "OpeningsMustNotCrossOrOverlap");
  mark("detail", "DetailMustNotIntersectOpening");
  for (const [lid, os] of groupBy(all("opening").filter(o => o.geometry?.type === "LineString"), o => o.properties.level_id)) {
    const rb = index(os.map(f => ({ f, g: f.geometry }))), ub = unitIdx.get(lid);
    for (const o of os) {
      const onBoundary = ub && near(ub, o.geometry).some(u => safe(() => T.booleanWithin(feat(o.geometry), T.polygonToLine(feat(u.g))), false)
        || safe(() => (T.polygonToLine(feat(u.g)).features || [T.polygonToLine(feat(u.g))]).some(ln => T.booleanWithin(feat(o.geometry), ln)), false));
      if (!onBoundary) add("opening", "OpeningMustBeCoveredByUnitBoundary", o.id, `Ligt niet op de rand van een unit.`);
      for (const b of near(rb, o.geometry)) if (b.f.id > o.id && (safe(() => T.booleanCrosses(feat(o.geometry), feat(b.g)), false) || safe(() => T.booleanOverlap(feat(o.geometry), feat(b.g)), false)))
        add("opening", "OpeningsMustNotCrossOrOverlap", o.id, `Kruist of overlapt opening ${b.f.id}.`);
    }
    for (const d of all("detail").filter(d => d.properties.level_id === lid && d.geometry)) for (const o of near(rb, d.geometry))
      if (safe(() => T.booleanIntersects(feat(d.geometry), feat(o.g)), false)) add("detail", "DetailMustNotIntersectOpening", d.id, `Snijdt opening ${o.f.id}.`);
  }

  // ---------- Venue bevat alle features ----------
  progress("Ligging binnen de venue controleren…");
  mark("venue", "VenueMustCoverAllChildFeatures");
  { const v = all("venue")[0];
    if (v && poly(v.geometry)) { const c = container(v);
      for (const t of ["level", "footprint", "unit", "section", "fixture", "kiosk", "geofence", "opening", "detail", "amenity", "anchor"]) for (const f of all(t)) {
        if (!f.geometry) continue;
        const o = outside(f.geometry, c);
        if (poly(f.geometry) ? o > GEO_TOL : o) { const d = maxDistOut(c, f.geometry);
          add("venue", "VenueMustCoverAllChildFeatures", f.id, poly(f.geometry) ? `${t} valt voor ${m2(o)} m² buiten de venue${d ? ` (tot ${distTxt(d)})` : ""}.` : `${t} ligt ${d ? `tot ${distTxt(d)} ` : "(deels) "}buiten de venue.`); }
      } } }

  // ---------- Building-inhoud via ground-footprints ----------
  mark("building", "BuildingNameMatchesOccupantName"); mark("anchor", "ReferencedAddressDoesNotMatchBuildingAddress");
  { const fpOf = b => unionOf(all("footprint").filter(f => (f.properties.building_ids || []).includes(b.id) && poly(f.geometry)).map(f => f.geometry));
    const anchors = all("anchor").filter(a => a.geometry?.type === "Point");
    for (const b of all("building")) {
      const un = fpOf(b); if (!un) continue;
      const inside = anchors.filter(a => safe(() => T.booleanPointInPolygon(a.geometry.coordinates, feat(un)), false));
      const insideIds = new Set(inside.map(a => a.id));
      const names = b.properties.name && typeof b.properties.name === "object" ? Object.values(b.properties.name).map(s => String(s).trim().toLowerCase()) : [];
      if (names.length) for (const o of all("occupant")) if (insideIds.has(o.properties.anchor_id) && o.properties.name && Object.values(o.properties.name).some(n => names.includes(String(n).trim().toLowerCase())))
        add("building", "BuildingNameMatchesOccupantName", b.id, `Naam is gelijk aan die van occupant ${o.id} in deze building.`, "name");
      const bAddr = byId.get(b.properties.address_id)?.properties;
      if (bAddr) for (const a of inside) { const aa = byId.get(a.properties.address_id)?.properties; if (!aa) continue;
        const key = x => JSON.stringify([x.address, x.locality, x.province, x.country, x.postal_code]);
        if (key(aa) !== key(bAddr)) add("anchor", "ReferencedAddressDoesNotMatchBuildingAddress", a.id, `Adres van de anchor (zonder unit) wijkt af van het adres van building ${b.id}.`, "address_id"); }
    } }

  // Toelichtingen
  for (const x of result.rules) if (x.checked && !x.partial && /Overlap|Cover|Within|Equal|Contain|Intersect|Overlaps/.test(x.rule) && !/DisplayPoint/.test(x.rule))
    x.partial = `Geometrisch gecontroleerd met Turf.js; verschillen tot ${String(GEO_TOL).replace(".", ",")} m² gelden als afrondingsruis.`;
  const ob = R.get("Opening|OpeningDisplayPointShouldBeWithinBufferedDistanceOfOpening");
  if (ob && !ob.checked) ob.partial = "De standaard noemt geen bufferafstand; niet gecontroleerd.";
  const sev = s => issues.filter(i => i.severity === s).length;
  result.stats = { violations: sev("Violation"), warnings: sev("Warning"), info: sev("Info"), checked: result.rules.filter(r => r.checked).length, total: result.rules.length };
  return result;
}
