"use strict";
// Niet-geometrische IMDF-validatie. Vereist rules.js. Geeft { issues, rules, stats }.

function validateIMDF({ data, fileNames = [], now = new Date(), lang = null }) {
  const R = new Map(IMDF_RULES.map(([f, s, r, d]) => [f + "|" + r, { feature: f, severity: s, rule: r, definition: d, checked: false, partial: null, count: 0 }]));
  const issues = [];
  const F = t => t === "*" ? "N/A" : t[0].toUpperCase() + t.slice(1);   // "unit" → "Unit"
  const rule = (t, r) => R.get(F(t) + "|" + r);
  const mark = (t, ...rs) => rs.forEach(r => { const x = rule(t, r); if (x) x.checked = true; });
  const partial = (t, r, note) => { const x = rule(t, r); if (x) { x.checked = true; x.partial = note; } };
  const add = (t, r, fid, msg, attr = null, ftype = t) => {
    const x = rule(t, r); if (!x) return;
    x.checked = true; x.count++;
    issues.push({ severity: x.severity, rule: r, feature: x.feature, ftype: ftype === "*" ? null : ftype, fid: fid ?? null, attr, msg });
  };

  // ---------- Hulpfuncties ----------
  const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const blank = s => typeof s === "string" && (s.trim() === "" || s !== s.trim());
  const isObj = v => v && typeof v === "object" && !Array.isArray(v);
  const langOk = tag => { try { return typeof tag === "string" && Intl.getCanonicalLocales(tag).length === 1 && /^[a-z]{2,3}([-_]|$)/i.test(tag); } catch { return false; } };
  const regionName = (() => { try { const dn = new Intl.DisplayNames(["en"], { type: "region" }); return c => { try { return dn.of(c); } catch { return null; } }; } catch { return () => null; } })();
  const lbl = v => isObj(v) ? (lang && v[lang]) || Object.values(v)[0] : null;
  const str = v => v == null ? "—" : typeof v === "string" ? `"${v.length > 60 ? v.slice(0, 60) + "…" : v}"` : JSON.stringify(v).slice(0, 80);
  const ptInRing = (x, y, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const ptOnSeg = (x, y, r) => { for (let i = 0; i < r.length - 1; i++) { const [ax, ay] = r[i], [bx, by] = r[i + 1]; const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax); if (Math.abs(cross) > 1e-12) continue; if (Math.min(ax, bx) - 1e-12 <= x && x <= Math.max(ax, bx) + 1e-12 && Math.min(ay, by) - 1e-12 <= y && y <= Math.max(ay, by) + 1e-12) return true; } return false; };
  // Punt binnen (of op de rand van) een Polygon/MultiPolygon
  const ptInGeom = (p, g) => {
    if (!g || !p) return false;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    return polys.some(rings => { if (!rings?.[0]) return false; if (ptOnSeg(p[0], p[1], rings[0])) return true; if (!ptInRing(p[0], p[1], rings[0])) return false;
      return !rings.slice(1).some(h => ptInRing(p[0], p[1], h) && !ptOnSeg(p[0], p[1], h)); });
  };
  const bboxOf = g => { const b = [Infinity, Infinity, -Infinity, -Infinity]; const w = c => { if (typeof c?.[0] === "number") { b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); } else c?.forEach(w); }; w(g?.coordinates); return b; };
  const geomKey = g => g ? g.type + JSON.stringify(g.coordinates) : null;
  const hasInterior = g => g?.type === "Polygon" ? g.coordinates.length > 1 : g?.type === "MultiPolygon" ? g.coordinates.some(p => p.length > 1) : false;
  const isPoint = g => g?.type === "Point" && Array.isArray(g.coordinates) && g.coordinates.length >= 2 && g.coordinates.every(Number.isFinite);
  const metres = (a, b) => { const R0 = 6371008.8, r = Math.PI / 180, dLat = (b[1] - a[1]) * r, dLon = (b[0] - a[0]) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLon / 2) ** 2; return 2 * R0 * Math.asin(Math.sqrt(h)); };
  const lineLen = c => { let s = 0; for (let i = 1; i < c.length; i++) s += metres(c[i - 1], c[i]); return s; };

  // ---------- Bestanden en structuur ----------
  const feats = {}, byId = new Map(), byType = {};
  IMDF_TYPES.forEach(t => byType[t] = []);
  mark("*", "NameMustBeString", "ManifestFileMustBePresent", "FileMustContainFeatureCollection", "FeatureMustHaveId", "FeatureIdMustBeString", "FeatureIdMustNotBeEmpty",
    "FeatureIdMustBeUnique", "FeatureMustHaveFeatureType", "FeatureTypeMustBeString", "FeatureTypeMustNotBeEmpty", "VenueCountMustBeExactlyOne",
    "ReferencedFeatureIDMustBeResolvable", "ZeroCountOfUnitQualifiedAddresses");
  partial("*", "FileMustBeValidGeoJSON", "Structuur, coördinaten, gesloten ringen, minimaal aantal punten en dubbele opeenvolgende punten; snijdende lijnsegmenten worden niet gecontroleerd.");
  if (!data.manifest) add("*", "ManifestFileMustBePresent", null, "manifest.json ontbreekt in het archief.", null, "*");
  for (const t of IMDF_REQUIRED_FILES) if (!data[t]) add("*", "FileMustContainFeatureCollection", null, `${t}.geojson ontbreekt (verplicht bestand).`, null, "*");
  for (const t of IMDF_TYPES) {
    const fc = data[t]; if (fc == null) continue;
    if (!isObj(fc) || fc.type !== "FeatureCollection" || !Array.isArray(fc.features)) { add("*", "FileMustContainFeatureCollection", null, `${t}.geojson bevat geen GeoJSON FeatureCollection.`, null, "*"); continue; }
    feats[t] = fc.features;
    fc.features.forEach((f, i) => {
      const where = `${t}.geojson, feature ${i + 1}`;
      if (!isObj(f) || f.type !== "Feature") { add("*", "FileMustBeValidGeoJSON", null, `${where}: geen GeoJSON Feature.`, null, "*"); return; }
      if (!("id" in f)) add("*", "FeatureMustHaveId", null, `${where}: id ontbreekt.`, "id", t);
      else if (typeof f.id !== "string") add("*", "FeatureIdMustBeString", null, `${where}: id is geen string (${str(f.id)}).`, "id", t);
      else if (f.id.trim() === "") add("*", "FeatureIdMustNotBeEmpty", null, `${where}: id is leeg.`, "id", t);
      else if (byId.has(f.id)) add("*", "FeatureIdMustBeUnique", f.id, `id komt meer dan eens voor (ook in ${byId.get(f.id).feature_type}.geojson).`, "id", t);
      else byId.set(f.id, f);
      if (!("feature_type" in f)) add("*", "FeatureMustHaveFeatureType", f.id, `${where}: feature_type ontbreekt.`, "feature_type", t);
      else if (typeof f.feature_type !== "string") add("*", "FeatureTypeMustBeString", f.id, `feature_type is geen string.`, "feature_type", t);
      else if (f.feature_type.trim() === "") add("*", "FeatureTypeMustNotBeEmpty", f.id, `feature_type is leeg.`, "feature_type", t);
      else if (f.feature_type !== t) add("*", "FileMustBeValidGeoJSON", f.id, `feature_type "${f.feature_type}" hoort niet in ${t}.geojson.`, "feature_type", t);
      if (!isObj(f.properties)) { add("*", "FileMustBeValidGeoJSON", f.id, `${where}: properties ontbreekt of is geen object.`, "properties", t); f.properties = {}; }
      checkGeoJSONGeometry(t, f, where);
      byType[t].push(f);
    });
  }
  function checkGeoJSONGeometry(t, f, where) {
    const g = f.geometry; if (g == null) return;
    const bad = m => add("*", "FileMustBeValidGeoJSON", f.id, `${m}`, "geometry", t);
    const pos = p => Array.isArray(p) && p.length >= 2 && p.every(Number.isFinite);
    const range = p => p[0] >= -180 && p[0] <= 180 && p[1] >= -90 && p[1] <= 90;
    const line = (c, min, ring) => {
      if (!Array.isArray(c) || !c.every(pos)) return bad(`Ongeldige coördinaten in ${g.type}.`);
      if (!c.every(range)) return bad(`Coördinaten buiten WGS84-bereik (lengte −180…180, breedte −90…90).`);
      if (c.length < min) return bad(`${ring ? "Ring" : "Lijn"} heeft ${c.length} punten (minimaal ${min}).`);
      if (ring && (c[0][0] !== c[c.length - 1][0] || c[0][1] !== c[c.length - 1][1])) return bad(`Ring is niet gesloten (eerste en laatste punt verschillen).`);
      for (let i = 1; i < c.length; i++) if (c[i][0] === c[i - 1][0] && c[i][1] === c[i - 1][1]) return bad(`Twee opeenvolgende punten met dezelfde coördinaten (${c[i].join(", ")}).`);
    };
    switch (g.type) {
      case "Point": if (!pos(g.coordinates)) bad("Ongeldige Point-coördinaten."); else if (!range(g.coordinates)) bad("Point buiten WGS84-bereik."); break;
      case "LineString": line(g.coordinates, 2); break;
      case "MultiLineString": (g.coordinates || []).forEach(l => line(l, 2)); break;
      case "Polygon": (g.coordinates || []).forEach(r => line(r, 4, true)); break;
      case "MultiPolygon": (g.coordinates || []).forEach(p => (p || []).forEach(r => line(r, 4, true))); break;
      default: if (g.type !== "GeometryCollection") bad(`Onbekend geometrietype "${g.type}".`);
    }
  }
  const venues = byType.venue;
  if (venues.length !== 1) add("*", "VenueCountMustBeExactlyOne", null, `Archief bevat ${venues.length} venues (precies 1 vereist).`, null, "*");

  // ---------- Manifest ----------
  mark("manifest", "ManifestVersionMustBeValid");
  if (data.manifest && data.manifest.version !== "1.0.0") add("manifest", "ManifestVersionMustBeValid", null, `Versie is ${str(data.manifest.version)}; alleen "1.0.0" is toegestaan.`, "version", "*");

  // ---------- Verwijzingen ----------
  const get = (id, type) => { const f = byId.get(id); return f && (!type || f.feature_type === type) ? f : null; };
  const REFS = { address_id: "address", level_id: "level", unit_id: "unit", anchor_id: "anchor", unit_ids: "unit", building_ids: "building", level_ids: "level" };
  for (const t of IMDF_TYPES) for (const f of byType[t]) {
    const p = f.properties;
    for (const [k, rt] of Object.entries(REFS)) {
      if (p[k] == null) continue;
      const ids = Array.isArray(p[k]) ? p[k] : [p[k]];
      for (const id of ids) if (typeof id !== "string" || !get(id, rt)) add("*", "ReferencedFeatureIDMustBeResolvable", f.id, `${k} verwijst naar ${str(id)}, maar er is geen ${rt} met dat id.`, k, t);
    }
    if (Array.isArray(p.parents)) for (const id of p.parents) if (!get(id, t)) add("*", "ReferencedFeatureIDMustBeResolvable", f.id, `parents verwijst naar ${str(id)}, maar er is geen ${t} met dat id.`, "parents", t);
  }
  // Indexen
  const levelOf = f => get(f?.properties?.level_id, "level");
  const unitsByLevel = new Map();   // ruimtelijke index per verdieping (grid op bbox)
  for (const u of byType.unit) { const l = u.properties.level_id; if (!l || !u.geometry) continue; (unitsByLevel.get(l) || unitsByLevel.set(l, []).get(l)).push({ f: u, b: bboxOf(u.geometry) }); }
  const unitsAt = (p, levelId) => (unitsByLevel.get(levelId) || []).filter(x => p[0] >= x.b[0] && p[0] <= x.b[2] && p[1] >= x.b[1] && p[1] <= x.b[3] && ptInGeom(p, x.f.geometry)).map(x => x.f);
  const STRUCTURAL = new Set(["brick", "column", "concrete", "drywall", "glass", "structure", "wood"]);

  // ---------- Gemeenschappelijke controles per feature ----------
  function common(t, f) {
    const p = f.properties, T = F(t);
    mark(t, "InvalidFeatureID");
    if (typeof f.id === "string" && !UUID4.test(f.id)) add(t, "InvalidFeatureID", f.id, `id ${str(f.id)} is geen geldige UUID versie 4.`, "id");
    // Geometrietype
    const allowed = IMDF_GEOM[t];
    const gr = t === "detail" ? "LinealGeometry" : t === "opening" ? "LineStringGeometry" : allowed.includes("Polygon") ? "PolygonalGeometry" : allowed.includes("Point") ? "PointGeometry" : null;
    if (gr) { mark(t, `${T}MustHave${gr}`); if (!allowed.includes(f.geometry?.type ?? null)) add(t, `${T}MustHave${gr}`, f.id, `Geometrie is ${f.geometry ? f.geometry.type : "null"}; verwacht ${allowed.filter(Boolean).join(" of ")}.`, "geometry"); }
    if (t === "relationship") { mark(t, "RelationshipHasGeometry"); if (f.geometry) add(t, "RelationshipHasGeometry", f.id, `Relationship heeft een geometrie (${f.geometry.type}).`, "geometry"); }
    // Labels (regels gelden als gecontroleerd, ook als een feature geen labels heeft)
    mark(t, "NameMustBeString", "AltNameMustBeString", "InvalidLanguageTag", "LabelMustNotBeBlank");
    for (const k of ["name", "alt_name", "short_name"]) {
      if (!(k in p) || p[k] == null) continue;
      const strRule = k === "alt_name" ? "AltNameMustBeString" : "NameMustBeString";
      mark(t, strRule, "InvalidLanguageTag", "LabelMustNotBeBlank");
      if (!isObj(p[k])) { add(t, strRule, f.id, `${k} is geen LABELS-object met taal → tekst (${str(p[k])}).`, k); continue; }
      for (const [tag, v] of Object.entries(p[k])) {
        if (!langOk(tag)) add(t, "InvalidLanguageTag", f.id, `${k}: ongeldige taalcode ${str(tag)}.`, k);
        if (typeof v !== "string") add(t, strRule, f.id, `${k}.${tag} is geen string (${str(v)}).`, k);
        else if (blank(v)) add(t, "LabelMustNotBeBlank", f.id, `${k}.${tag} is leeg of heeft spaties aan begin/eind (${str(v)}).`, k);
      }
    }
    mark(t, "HasOnlyAltName", "AltNameLangTagHasNoCorrespondingNameLangTag");
    if (isObj(p.alt_name) && p.name == null) add(t, "HasOnlyAltName", f.id, `alt_name is gevuld maar name is leeg.`, "alt_name");
    if (isObj(p.alt_name) && isObj(p.name)) for (const tag of Object.keys(p.alt_name)) if (!(tag in p.name)) add(t, "AltNameLangTagHasNoCorrespondingNameLangTag", f.id, `alt_name heeft taal "${tag}", name niet.`, "alt_name");
    // Categorie
    if (IMDF_ENUMS[t]) {
      mark(t, `${T}MustHaveCategory`, `${T}CategoryMustBeValid`);
      if (p.category == null || p.category === "") add(t, `${T}MustHaveCategory`, f.id, `category ontbreekt.`, "category");
      else if (!IMDF_ENUMS[t].has(p.category)) add(t, `${T}CategoryMustBeValid`, f.id, `category ${str(p.category)} is geen geldige ${t}-categorie.`, "category");
    }
    if ("restriction" in p) { mark(t, "RestrictionCategoryMustBeValid"); if (p.restriction != null && !IMDF_ENUMS.restriction.has(p.restriction)) add(t, "RestrictionCategoryMustBeValid", f.id, `restriction ${str(p.restriction)} is ongeldig.`, "restriction"); }
    if ("accessibility" in p) { mark(t, "AccessibilityMustBeValid"); if (p.accessibility != null && (!Array.isArray(p.accessibility) || p.accessibility.some(a => !IMDF_ENUMS.accessibility.has(a))))
      add(t, "AccessibilityMustBeValid", f.id, `accessibility ${str(p.accessibility)} bevat ongeldige waarden.`, "accessibility"); }
    // display_point
    if ("display_point" in p) {
      mark(t, "DisplayPointMustBePointGeometry", `${T}GeometryMustContainDisplayPoint`);
      if (p.display_point != null) {
        if (!isPoint(p.display_point)) add(t, "DisplayPointMustBePointGeometry", f.id, `display_point is geen geldig Point.`, "display_point");
        else if (f.geometry && /Polygon/.test(f.geometry.type) && !ptInGeom(p.display_point.coordinates, f.geometry))
          add(t, `${T}GeometryMustContainDisplayPoint`, f.id, `display_point ligt buiten de geometrie.`, "display_point");
      }
    }
    // Binnenringen
    const ir = t === "venue" ? "VenueGeometryShouldNotHaveInteriorRing" : `${T}HasInteriorRing`;
    if (rule(t, ir)) { mark(t, ir); if (hasInterior(f.geometry)) add(t, ir, f.id, `Geometrie heeft een binnenring (gat).`, "geometry"); }
    // level_id
    if (rule(t, `${T}MustReferenceLevel`)) { mark(t, `${T}MustReferenceLevel`); if (!levelOf(f)) add(t, `${T}MustReferenceLevel`, f.id, `level_id ${str(p.level_id)} verwijst niet naar een level.`, "level_id"); }
    // Contactgegevens
    if ("phone" in p) { mark(t, "PhoneMustBeValid"); if (p.phone != null && !/^\+[1-9]\d{1,14}( ?(x|ext\.?) ?\d{1,6})?$/.test(p.phone)) add(t, "PhoneMustBeValid", f.id, `phone ${str(p.phone)} is geen E.164-nummer (bijv. +31201234567).`, "phone"); }
    if ("website" in p) { mark(t, "WebsiteMustBeValid"); if (p.website != null) { let ok = false; try { const u = new URL(p.website); ok = /^https?:$/.test(u.protocol) && !!u.hostname; } catch {} if (!ok) add(t, "WebsiteMustBeValid", f.id, `website ${str(p.website)} is geen geldige http(s)-URL.`, "website"); } }
    if ("hours" in p) { mark(t, "HoursMustNotBeBlank"); if (p.hours != null && (typeof p.hours !== "string" || p.hours.trim() === "")) add(t, "HoursMustNotBeBlank", f.id, `hours is leeg.`, "hours"); }
    if ("correlation_id" in p) { mark(t, "InvalidCorrelationID"); if (p.correlation_id != null && !(typeof p.correlation_id === "string" && UUID4.test(p.correlation_id))) add(t, "InvalidCorrelationID", f.id, `correlation_id ${str(p.correlation_id)} is geen UUID versie 4.`, "correlation_id"); }
  }
  // correlation_id over features van hetzelfde type
  function correlation(t) {
    mark(t, "CorrelationIdMustBeMatched", "CategoryShouldBeSameForCorrelationID", "LevelIDsMustBeDissimilarForCorrelationID");
    const groups = new Map();
    for (const f of byType[t]) { const c = f.properties.correlation_id; if (typeof c === "string") (groups.get(c) || groups.set(c, []).get(c)).push(f); }
    for (const [c, g] of groups) {
      if (g.length < 2) { add(t, "CorrelationIdMustBeMatched", g[0].id, `correlation_id ${c} komt bij geen ander ${t} voor.`, "correlation_id"); continue; }
      if (new Set(g.map(f => f.properties.category)).size > 1) g.forEach(f => add(t, "CategoryShouldBeSameForCorrelationID", f.id, `Features met correlation_id ${c} hebben verschillende categorieën.`, "category"));
      const lv = f => t === "amenity" ? (f.properties.unit_ids || []).map(u => get(u)?.properties.level_id).sort().join() : t === "occupant" ? get(get(f.properties.anchor_id)?.properties.unit_id)?.properties.level_id : f.properties.level_id;
      const seen = new Map(); for (const f of g) { const k = lv(f); if (k && seen.has(k)) add(t, "LevelIDsMustBeDissimilarForCorrelationID", f.id, `Zelfde correlation_id en zelfde level als ${seen.get(k)}.`, "correlation_id"); else seen.set(k, f.id); }
    }
  }
  for (const t of IMDF_TYPES) for (const f of byType[t]) common(t, f);
  for (const t of ["amenity", "geofence", "occupant", "section"]) correlation(t);

  // ---------- Address ----------
  {
    const t = "address";
    mark(t, "AddressMustHaveAddressLine", "AddressMustHaveCountryCode", "AddressMustHaveLocality", "AddressUnitMustNotBeBlank", "InvalidCountryCode", "InvalidIsoProvinceCode",
      "InvalidISOCountryAndISOProvinceCodeCombination", "PostalCodeMustNotBeBlank", "PostalCodeExtensionMustNotBeBlank", "VanityPostalCodeMustNotBeBlank",
      "AddressShouldHavePostalCode", "AddressMustBeReferenced", "AddressMustBeDistinct", "AddressHasDissimilarProvinceCode");
    const referenced = new Set();
    for (const tt of IMDF_TYPES) for (const f of byType[tt]) if (typeof f.properties.address_id === "string") referenced.add(f.properties.address_id);
    const seen = new Map(), provinces = new Map();
    for (const f of byType.address) {
      const p = f.properties;
      if (typeof p.address !== "string" || !p.address.trim()) add(t, "AddressMustHaveAddressLine", f.id, `address (adresregel) ontbreekt.`, "address");
      if (typeof p.locality !== "string" || !p.locality.trim()) add(t, "AddressMustHaveLocality", f.id, `locality ontbreekt.`, "locality");
      if (p.country == null || p.country === "") add(t, "AddressMustHaveCountryCode", f.id, `country ontbreekt.`, "country");
      else if (!/^[A-Z]{2}$/.test(p.country) || regionName(p.country) === p.country || !regionName(p.country)) add(t, "InvalidCountryCode", f.id, `country ${str(p.country)} is geen ISO 3166-1-landcode.`, "country");
      if (p.province != null) {
        if (!/^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(p.province)) add(t, "InvalidIsoProvinceCode", f.id, `province ${str(p.province)} heeft niet de vorm van een ISO 3166-2-code (bijv. NL-NH).`, "province");
        else if (p.country && p.province.slice(0, 2) !== p.country) add(t, "InvalidISOCountryAndISOProvinceCodeCombination", f.id, `province ${p.province} hoort niet bij country ${p.country}.`, "province");
        provinces.set(p.province, (provinces.get(p.province) || 0) + 1);
      }
      if (blank(p.unit)) add(t, "AddressUnitMustNotBeBlank", f.id, `unit is leeg.`, "unit");
      if (blank(p.postal_code)) add(t, "PostalCodeMustNotBeBlank", f.id, `postal_code is leeg.`, "postal_code");
      if (blank(p.postal_code_ext)) add(t, "PostalCodeExtensionMustNotBeBlank", f.id, `postal_code_ext is leeg.`, "postal_code_ext");
      if (blank(p.postal_code_vanity)) add(t, "VanityPostalCodeMustNotBeBlank", f.id, `postal_code_vanity is leeg.`, "postal_code_vanity");
      if (p.postal_code == null) add(t, "AddressShouldHavePostalCode", f.id, `postal_code ontbreekt.`, "postal_code");
      if (!referenced.has(f.id)) add(t, "AddressMustBeReferenced", f.id, `Geen enkel feature verwijst naar dit adres.`);
      const k = JSON.stringify([p.address, p.unit, p.locality, p.province, p.country, p.postal_code, p.postal_code_ext]);
      if (seen.has(k)) add(t, "AddressMustBeDistinct", f.id, `Zelfde adres als ${seen.get(k)}.`); else seen.set(k, f.id);
    }
    if (provinces.size > 1) { const main = [...provinces].sort((a, b) => b[1] - a[1])[0][0];
      for (const f of byType.address) if (f.properties.province && f.properties.province !== main) add(t, "AddressHasDissimilarProvinceCode", f.id, `province ${f.properties.province} wijkt af van de meeste adressen (${main}).`, "province"); }
    if (!byType.address.some(a => a.properties.unit != null)) add("*", "ZeroCountOfUnitQualifiedAddresses", null, `Geen enkel adres heeft een unit (unit-gekwalificeerd adres).`, null, "*");
  }

  // ---------- Venue ----------
  {
    const t = "venue";
    mark(t, "VenueMustHaveAddress", "VenueMustHaveAtLeastOneBuilding", "VenueMustHaveName", "VenueHasNoDisplayPoint", "VenueShouldHaveHours", "VenueShouldHavePhone", "VenueShouldHaveWebsite");
    for (const f of venues) {
      const p = f.properties;
      if (!get(p.address_id, "address")) add(t, "VenueMustHaveAddress", f.id, `address_id ontbreekt of verwijst niet naar een adres.`, "address_id");
      if (!byType.building.length) add(t, "VenueMustHaveAtLeastOneBuilding", f.id, `Het archief bevat geen building.`);
      if (!isObj(p.name) || !Object.keys(p.name).length) add(t, "VenueMustHaveName", f.id, `name ontbreekt.`, "name");
      if (p.display_point == null) add(t, "VenueHasNoDisplayPoint", f.id, `display_point ontbreekt.`, "display_point");
      if (p.hours == null) add(t, "VenueShouldHaveHours", f.id, `hours ontbreekt.`, "hours");
      if (p.phone == null) add(t, "VenueShouldHavePhone", f.id, `phone ontbreekt.`, "phone");
      if (p.website == null) add(t, "VenueShouldHaveWebsite", f.id, `website ontbreekt.`, "website");
    }
  }

  // ---------- Building ----------
  {
    const t = "building";
    mark(t, "BuildingHasNoLevel", "BuildingMustHaveAtLeastOneFootprint", "BuildingHasNoAddress", "BuildingHasNoDisplayPoint", "BuildingHasNoName",
      "BuildingHasNoGroundFootprint", "BuildingHasNoAerialFootprint", "BuildingHasNoSubterraneanFootprint", "BuildingLevelOrdinalZeroShouldBePresent",
      "BuildingNameIsNotDistinct", "BuildingAltNameShouldBeDistinct", "LevelNamesInBuildingShouldBeDistinct", "LevelShortNamesInBuildingShouldBeDistinct",
      "LevelOrdinalsForBuildingAreNotSequential", "BuildingsHaveSameAddress", "BuildingAddressResolvesToVenueAddress", "BuildingCategoryShouldBeParking",
      "ParkingBuildingReferencingNonParkingLevel", "NonMatchingNameLangTagsAmongLevelsReferencingSameBuilding",
      "NonMatchingShortNameLangTagsAmongLevelsReferencingSameBuilding", "BuildingFootprintGeometryMustContainDisplayPoint", "BuildingReferencesUnitQualifiedAddress");
    const venueAddr = venues[0]?.properties.address_id;
    const names = new Map(), alts = new Map(), addrs = new Map();
    for (const b of byType.building) {
      const p = b.properties;
      const lv = byType.level.filter(l => (l.properties.building_ids || []).includes(b.id));
      const fp = byType.footprint.filter(x => (x.properties.building_ids || []).includes(b.id));
      if (!lv.length) add(t, "BuildingHasNoLevel", b.id, `Geen enkel level verwijst naar deze building.`);
      if (!fp.length) add(t, "BuildingMustHaveAtLeastOneFootprint", b.id, `Geen enkele footprint verwijst naar deze building.`);
      else {
        const cats = new Set(fp.map(x => x.properties.category));
        if (!cats.has("ground")) add(t, "BuildingHasNoGroundFootprint", b.id, `Geen ground-footprint.`);
        if (!cats.has("aerial")) add(t, "BuildingHasNoAerialFootprint", b.id, `Geen aerial-footprint.`);
        if (!cats.has("subterranean") && lv.some(l => l.properties.ordinal < 0)) add(t, "BuildingHasNoSubterraneanFootprint", b.id, `Er zijn levels met negatieve ordinal, maar geen subterranean-footprint.`);
        if (isPoint(p.display_point) && !fp.some(x => ptInGeom(p.display_point.coordinates, x.geometry))) add(t, "BuildingFootprintGeometryMustContainDisplayPoint", b.id, `display_point ligt in geen enkele footprint van deze building.`, "display_point");
      }
      if (p.address_id == null) add(t, "BuildingHasNoAddress", b.id, `address_id ontbreekt.`, "address_id");
      else {
        if (p.address_id === venueAddr) add(t, "BuildingAddressResolvesToVenueAddress", b.id, `Building en venue delen hetzelfde adres.`, "address_id");
        if (get(p.address_id)?.properties.unit != null) add(t, "BuildingReferencesUnitQualifiedAddress", b.id, `Het adres van de building heeft een unit.`, "address_id");
        if (addrs.has(p.address_id)) add(t, "BuildingsHaveSameAddress", b.id, `Zelfde adres als building ${addrs.get(p.address_id)}.`, "address_id"); else addrs.set(p.address_id, b.id);
      }
      if (p.display_point == null) add(t, "BuildingHasNoDisplayPoint", b.id, `display_point ontbreekt.`, "display_point");
      if (p.name == null) add(t, "BuildingHasNoName", b.id, `name ontbreekt.`, "name");
      else { const k = JSON.stringify(p.name); if (names.has(k)) add(t, "BuildingNameIsNotDistinct", b.id, `Zelfde naam als building ${names.get(k)} (${lbl(p.name)}).`, "name"); else names.set(k, b.id); }
      if (p.alt_name != null) { const k = JSON.stringify(p.alt_name); if (alts.has(k)) add(t, "BuildingAltNameShouldBeDistinct", b.id, `Zelfde alt_name als building ${alts.get(k)}.`, "alt_name"); else alts.set(k, b.id); }
      if (lv.length) {
        const ords = [...new Set(lv.map(l => l.properties.ordinal).filter(Number.isInteger))].sort((a, c) => a - c);
        if (!ords.includes(0)) add(t, "BuildingLevelOrdinalZeroShouldBePresent", b.id, `Geen level met ordinal 0 verwijst naar deze building.`);
        for (let i = 1; i < ords.length; i++) if (ords[i] - ords[i - 1] > 1) { add(t, "LevelOrdinalsForBuildingAreNotSequential", b.id, `Ordinals ${ords.join(", ")} lopen niet aaneen (gat tussen ${ords[i - 1]} en ${ords[i]}).`); break; }
        const dup = (key, r, what) => { const m = new Map(); for (const l of lv) { if (l.properties.outdoor) continue; const v = l.properties[key]; if (v == null) continue; const k = JSON.stringify(v) + "@" + l.properties.ordinal;
          const kk = JSON.stringify(v); if (m.has(kk) && m.get(kk).ord !== l.properties.ordinal) add(t, r, b.id, `${what} ${lbl(v)} komt voor bij ordinal ${m.get(kk).ord} en ${l.properties.ordinal}.`); else if (!m.has(kk)) m.set(kk, { ord: l.properties.ordinal, k }); } };
        dup("name", "LevelNamesInBuildingShouldBeDistinct", "Levelnaam");
        dup("short_name", "LevelShortNamesInBuildingShouldBeDistinct", "Level short_name");
        const tags = key => new Set(lv.map(l => isObj(l.properties[key]) ? Object.keys(l.properties[key]).sort().join(",") : null).filter(x => x != null));
        if (tags("name").size > 1) add(t, "NonMatchingNameLangTagsAmongLevelsReferencingSameBuilding", b.id, `Levels van deze building gebruiken verschillende talen in name: ${[...tags("name")].map(x => "[" + x + "]").join(" ")}.`);
        if (tags("short_name").size > 1) add(t, "NonMatchingShortNameLangTagsAmongLevelsReferencingSameBuilding", b.id, `Levels van deze building gebruiken verschillende talen in short_name: ${[...tags("short_name")].map(x => "[" + x + "]").join(" ")}.`);
        const parkingLv = lv.filter(l => l.properties.category === "parking");
        if (parkingLv.length === lv.length && p.category !== "parking") add(t, "BuildingCategoryShouldBeParking", b.id, `Alle levels zijn parking, maar category is ${str(p.category)}.`, "category");
        if (p.category === "parking" && parkingLv.length < lv.length) add(t, "ParkingBuildingReferencingNonParkingLevel", b.id, `Parking-building heeft ${lv.length - parkingLv.length} level(s) die geen parking zijn.`, "category");
      }
    }
  }

  // ---------- Footprint ----------
  { const t = "footprint"; mark(t, "FootprintMustReferenceBuilding");
    for (const f of byType.footprint) { const ids = f.properties.building_ids;
      if (!Array.isArray(ids) || !ids.length || ids.some(id => !get(id, "building")) || new Set(ids).size !== ids.length) add(t, "FootprintMustReferenceBuilding", f.id, `building_ids moet een niet-lege lijst van bestaande buildings zonder dubbelen zijn (${str(ids)}).`, "building_ids"); } }

  // ---------- Level ----------
  {
    const t = "level";
    mark(t, "LevelMustHaveName", "LevelMustHaveShortName", "LevelMustHaveOrdinal", "LevelOrdinalMustBeInteger", "LevelMustBeReferencedByUnit", "LevelHasSuspiciousOrdinal",
      "OutdoorLevelHasBuildingReference", "IndoorLevelMustHaveBuildingReference", "OutdoorLevelHasNegativeOrdinal", "OutdoorLevelShouldReferenceBuilding",
      "LevelShouldBeReferencedByOpening", "ParkingLevelShouldContainParkingUnit", "ParkingUnitShouldBeContainedByParkingLevel", "ParkingUnitIsNotContainedByParkingLevel",
      "ParkingLevelShouldHaveAutomobileOpening");
    const unitsOn = new Map(), openOn = new Map();
    for (const u of byType.unit) (unitsOn.get(u.properties.level_id) || unitsOn.set(u.properties.level_id, []).get(u.properties.level_id)).push(u);
    for (const o of byType.opening) (openOn.get(o.properties.level_id) || openOn.set(o.properties.level_id, []).get(o.properties.level_id)).push(o);
    for (const l of byType.level) {
      const p = l.properties, us = unitsOn.get(l.id) || [], os = openOn.get(l.id) || [];
      const hasB = Array.isArray(p.building_ids) && p.building_ids.length > 0;
      if (!isObj(p.name) || !Object.keys(p.name).length) add(t, "LevelMustHaveName", l.id, `name ontbreekt.`, "name");
      if (!isObj(p.short_name) || !Object.keys(p.short_name).length) add(t, "LevelMustHaveShortName", l.id, `short_name ontbreekt.`, "short_name");
      if (p.ordinal == null) add(t, "LevelMustHaveOrdinal", l.id, `ordinal ontbreekt.`, "ordinal");
      else if (!Number.isInteger(p.ordinal)) add(t, "LevelOrdinalMustBeInteger", l.id, `ordinal ${str(p.ordinal)} is geen geheel getal.`, "ordinal");
      else if (p.ordinal < -12 || p.ordinal > 163) add(t, "LevelHasSuspiciousOrdinal", l.id, `ordinal ${p.ordinal} valt buiten het gebruikelijke bereik (−12 t/m 163).`, "ordinal");
      if (!us.length) add(t, "LevelMustBeReferencedByUnit", l.id, `Geen enkele unit verwijst naar dit level.`);
      if (p.outdoor === true && p.ordinal === 0 && hasB) add(t, "OutdoorLevelHasBuildingReference", l.id, `Buiten-level op ordinal 0 verwijst naar een building.`, "building_ids");
      if (p.outdoor === false && !hasB) add(t, "IndoorLevelMustHaveBuildingReference", l.id, `Binnen-level verwijst niet naar een building.`, "building_ids");
      if (p.outdoor === true && p.ordinal < 0) add(t, "OutdoorLevelHasNegativeOrdinal", l.id, `Buiten-level heeft negatieve ordinal ${p.ordinal}.`, "ordinal");
      if (p.outdoor === true && p.ordinal !== 0 && !hasB) add(t, "OutdoorLevelShouldReferenceBuilding", l.id, `Buiten-level op ordinal ${p.ordinal} verwijst niet naar een building.`, "building_ids");
      if (!os.length && byType.opening.length) add(t, "LevelShouldBeReferencedByOpening", l.id, `Geen enkele opening verwijst naar dit level.`);
      else if (!byType.opening.length) add(t, "LevelShouldBeReferencedByOpening", l.id, `Geen enkele opening verwijst naar dit level (het archief bevat geen openings).`);
      const parkingUnits = us.filter(u => u.properties.category === "parking");
      if (p.category === "parking") {
        if (!parkingUnits.length) add(t, "ParkingLevelShouldContainParkingUnit", l.id, `Parking-level zonder parking-unit.`);
        if (!os.some(o => o.properties.category === "automobile")) add(t, "ParkingLevelShouldHaveAutomobileOpening", l.id, `Parking-level zonder automobile-opening.`);
      } else if (parkingUnits.length) {
        if (parkingUnits.length === us.length) add(t, "ParkingUnitShouldBeContainedByParkingLevel", l.id, `Level bevat alleen parking-units maar is geen parking-level (category ${str(p.category)}).`, "category");
        else if (us.some(u => u.properties.category !== "parking" && !["office", "platform", "room", "unenclosedarea"].includes(u.properties.category)))
          add(t, "ParkingUnitIsNotContainedByParkingLevel", l.id, `${parkingUnits.length} parking-unit(s) op een level dat geen parking-level is.`, "category");
      }
    }
  }

  // ---------- Opening ----------
  {
    const t = "opening";
    mark(t, "AccessControlMustBeValid", "OpeningDoorTypeMustBeValid", "OpeningDoorMaterialMustBeValid", "OpeningIsSuspiciouslyLarge", "OpeningIsSuspiciouslySmall");
    for (const o of byType.opening) {
      const p = o.properties;
      if (p.access_control != null && (!Array.isArray(p.access_control) || p.access_control.some(a => !IMDF_ENUMS.accesscontrol.has(a)))) add(t, "AccessControlMustBeValid", o.id, `access_control ${str(p.access_control)} bevat ongeldige waarden.`, "access_control");
      if (isObj(p.door)) {
        if (p.door.type != null && !IMDF_ENUMS.doortype.has(p.door.type)) add(t, "OpeningDoorTypeMustBeValid", o.id, `door.type ${str(p.door.type)} is ongeldig.`, "door");
        if (p.door.material != null && !IMDF_ENUMS.doormaterial.has(p.door.material)) add(t, "OpeningDoorMaterialMustBeValid", o.id, `door.material ${str(p.door.material)} is ongeldig.`, "door");
      }
      if (o.geometry?.type === "LineString") { const len = lineLen(o.geometry.coordinates);
        if (len > 45) add(t, "OpeningIsSuspiciouslyLarge", o.id, `Opening is ${len.toFixed(1)} m lang (meer dan 45 m).`, "geometry");
        if (len < 0.8382) add(t, "OpeningIsSuspiciouslySmall", o.id, `Opening is ${len.toFixed(2)} m lang (minder dan 0,8382 m).`, "geometry"); }
    }
  }

  // ---------- Unit-inhoud (amenity, anchor) ----------
  const containing = (pt, levelIds) => levelIds.flatMap(l => unitsAt(pt, l));
  // ---------- Amenity ----------
  {
    const t = "amenity";
    mark(t, "AmenityMustReferenceUnit", "AmenityShouldBeCoveredByReferencedUnit", "AmenityShouldNotEqualAmenity", "AmenityNameAndCategoryAreSame", "AmenityNameShouldNotBeDuplicate",
      "AircraftBoardingGateAmenityShouldHaveName", "ArrivalGateAmenityShouldHaveName", "BusBoardingGateAmenityShouldHaveName", "TrainBoardingGateAmenityShouldHaveName",
      "BaggageCarouselAmenityShouldHaveName", "BaggageCarouselAmenityNameIsDuplicateInSameBuilding", "UnspecifiedAmenityShouldHaveName",
      "ElevatorUnitMayOnlyContainElevatorAmenity", "EscalatorUnitMayOnlyContainEscalatorAmenity", "MovingWalkwayUnitMayOnlyContainMovingWalkwayAmenity",
      "StairsUnitMayOnlyContainStairsAmenity", "OpenToBelowUnitMustNotContainAmenity", "StepsUnitMustNotContainAmenity", "StructuralUnitMustNotContainAmenity",
      "FemaleRestroomUnitMustNotContainRestroomAmenityCategory", "MaleRestroomUnitMustNotContainRestroomAmenityCategory", "RestroomUnitMayOnlyContainAmenityFromRestroomHierarchy",
      "RestroomUnitCategoryShouldNotContainRestroomAmenityCategory", "GenericRestroomUnitCategoryContainsSpecificRestroomAmenityCategory", "KioskMustNotContainAmenityCategory");
    const NAMED = { "boardinggate.aircraft": "AircraftBoardingGateAmenityShouldHaveName", "arrivalgate": "ArrivalGateAmenityShouldHaveName",
      "boardinggate.bus": "BusBoardingGateAmenityShouldHaveName", "boardinggate.train": "TrainBoardingGateAmenityShouldHaveName",
      "baggagecarousel": "BaggageCarouselAmenityShouldHaveName", "unspecified": "UnspecifiedAmenityShouldHaveName" };
    const coinc = new Map(), dupNames = new Map(), carousel = new Map();
    const kiosksByLevel = new Map(); for (const k of byType.kiosk) (kiosksByLevel.get(k.properties.level_id) || kiosksByLevel.set(k.properties.level_id, []).get(k.properties.level_id)).push(k);
    for (const a of byType.amenity) {
      const p = a.properties, cat = p.category || "";
      const units = Array.isArray(p.unit_ids) ? p.unit_ids.map(id => get(id, "unit")).filter(Boolean) : [];
      if (!Array.isArray(p.unit_ids) || !p.unit_ids.length || units.length !== p.unit_ids.length) add(t, "AmenityMustReferenceUnit", a.id, `unit_ids moet naar minstens één bestaande unit verwijzen (${str(p.unit_ids)}).`, "unit_ids");
      const pt = isPoint(a.geometry) ? a.geometry.coordinates : null;
      if (pt) for (const u of units) if (u.geometry && !ptInGeom(pt, u.geometry)) add(t, "AmenityShouldBeCoveredByReferencedUnit", a.id, `Ligt buiten de verwezen unit ${u.id}.`, "unit_ids");
      if (NAMED[cat] && p.name == null) add(t, NAMED[cat], a.id, `Amenity met categorie ${cat} heeft geen naam.`, "name");
      if (isObj(p.name) && Object.values(p.name).some(v => typeof v === "string" && (v.toLowerCase() === cat.toLowerCase() || v.toLowerCase() === cat.replace(/\./g, " ").toLowerCase())))
        add(t, "AmenityNameAndCategoryAreSame", a.id, `Naam is gelijk aan de categorie (${cat}).`, "name");
      const levelIds = [...new Set(units.map(u => u.properties.level_id).filter(Boolean))];
      if (pt) for (const l of levelIds) { const k = l + "|" + pt.join(","); if (coinc.has(k)) add(t, "AmenityShouldNotEqualAmenity", a.id, `Zelfde locatie op hetzelfde level als amenity ${coinc.get(k)}.`, "geometry"); else coinc.set(k, a.id); }
      if (["arrivalgate", "boardinggate.aircraft", "boardinggate.bus", "boardinggate.train"].includes(cat) && isObj(p.name)) {
        const k = cat + "|" + JSON.stringify(p.name); if (dupNames.has(k)) add(t, "AmenityNameShouldNotBeDuplicate", a.id, `Naam ${lbl(p.name)} komt al voor bij ${cat}-amenity ${dupNames.get(k)}.`, "name"); else dupNames.set(k, a.id); }
      if (cat === "baggagecarousel" && isObj(p.name)) for (const u of units) for (const b of (get(u.properties.level_id)?.properties.building_ids || [])) {
        const k = b + "|" + JSON.stringify(p.name); if (carousel.has(k) && carousel.get(k) !== a.id) add(t, "BaggageCarouselAmenityNameIsDuplicateInSameBuilding", a.id, `Naam ${lbl(p.name)} komt al voor bij bagageband ${carousel.get(k)} in dezelfde building.`, "name"); else carousel.set(k, a.id); }
      if (!pt) continue;
      // Units waarin het punt ligt (op de levels van de verwezen units)
      for (const u of containing(pt, levelIds)) {
        const uc = u.properties.category || "";
        const only = { elevator: "ElevatorUnitMayOnlyContainElevatorAmenity", escalator: "EscalatorUnitMayOnlyContainEscalatorAmenity", movingwalkway: "MovingWalkwayUnitMayOnlyContainMovingWalkwayAmenity", stairs: "StairsUnitMayOnlyContainStairsAmenity" }[uc];
        if (only && cat !== uc) add(t, only, a.id, `Ligt in ${uc}-unit ${u.id}, maar is ${cat}.`, "category");
        if (uc === "opentobelow") add(t, "OpenToBelowUnitMustNotContainAmenity", a.id, `Ligt in een opentobelow-unit (${u.id}).`, "geometry");
        if (uc === "steps") add(t, "StepsUnitMustNotContainAmenity", a.id, `Ligt in een steps-unit (${u.id}).`, "geometry");
        if (STRUCTURAL.has(uc)) add(t, "StructuralUnitMustNotContainAmenity", a.id, `Ligt in een constructie-unit (${uc}, ${u.id}).`, "geometry");
        if (uc.startsWith("restroom")) {
          if (!cat.startsWith("restroom")) add(t, "RestroomUnitMayOnlyContainAmenityFromRestroomHierarchy", a.id, `Ligt in ${uc}-unit ${u.id}, maar is ${cat}.`, "category");
          else {
            // Letterlijk volgens de definitie: alleen family/male(female)/transgender/unisex (incl. .wheelchair-varianten)
            if (uc.startsWith("restroom.female") && /^restroom\.(family|male|transgender|unisex)(\.|$)/.test(cat)) add(t, "FemaleRestroomUnitMustNotContainRestroomAmenityCategory", a.id, `${cat} in damestoilet-unit ${u.id}.`, "category");
            if (uc.startsWith("restroom.male") && /^restroom\.(family|female|transgender|unisex)(\.|$)/.test(cat)) add(t, "MaleRestroomUnitMustNotContainRestroomAmenityCategory", a.id, `${cat} in herentoilet-unit ${u.id}.`, "category");
            if (uc.startsWith("restroom.family") && /^restroom\.(female|male|transgender|unisex)(\.|$)/.test(cat)) add(t, "RestroomUnitCategoryShouldNotContainRestroomAmenityCategory", a.id, `${cat} in ${uc}-unit ${u.id}.`, "category");
            if (uc.startsWith("restroom.unisex") && /^restroom\.(family|female|male|transgender)(\.|$)/.test(cat)) add(t, "RestroomUnitCategoryShouldNotContainRestroomAmenityCategory", a.id, `${cat} in ${uc}-unit ${u.id}.`, "category");
            if (uc === "restroom" && /^restroom\.(family|female|male|transgender|unisex)(\.|$)/.test(cat)) add(t, "GenericRestroomUnitCategoryContainsSpecificRestroomAmenityCategory", a.id, `${cat} in algemene restroom-unit ${u.id}.`, "category");
          }
        }
      }
      if (["elevator", "escalator", "movingwalkway", "stairs"].includes(cat)) for (const l of levelIds) for (const k of (kiosksByLevel.get(l) || []))
        if (ptInGeom(pt, k.geometry)) add(t, "KioskMustNotContainAmenityCategory", a.id, `${cat}-amenity ligt in kiosk ${k.id}.`, "geometry");
    }
  }

  // ---------- Anchor ----------
  {
    const t = "anchor";
    mark(t, "AnchorMustReferenceUnit", "AnchorMustBeCoveredByReferencedUnit", "AnchorShouldNotEqualAnchor", "OpenToBelowUnitMustNotContainAnchor", "StructuralUnitMustNotContainAnchor");
    const coinc = new Map();
    for (const a of byType.anchor) {
      const u = get(a.properties.unit_id, "unit");
      if (!u) { add(t, "AnchorMustReferenceUnit", a.id, `unit_id ${str(a.properties.unit_id)} verwijst niet naar een unit.`, "unit_id"); continue; }
      if (!isPoint(a.geometry)) continue;
      const pt = a.geometry.coordinates, l = u.properties.level_id;
      if (u.geometry && !ptInGeom(pt, u.geometry)) add(t, "AnchorMustBeCoveredByReferencedUnit", a.id, `Ligt buiten de verwezen unit ${u.id}.`, "unit_id");
      const k = l + "|" + pt.join(","); if (coinc.has(k)) add(t, "AnchorShouldNotEqualAnchor", a.id, `Zelfde locatie op hetzelfde level als anchor ${coinc.get(k)}.`, "geometry"); else coinc.set(k, a.id);
      for (const c of unitsAt(pt, l)) {
        if (c.properties.category === "opentobelow") add(t, "OpenToBelowUnitMustNotContainAnchor", a.id, `Ligt in een opentobelow-unit (${c.id}).`, "geometry");
        if (STRUCTURAL.has(c.properties.category)) add(t, "StructuralUnitMustNotContainAnchor", a.id, `Ligt in een constructie-unit (${c.properties.category}, ${c.id}).`, "geometry");
      }
    }
  }

  // ---------- Occupant ----------
  {
    const t = "occupant";
    mark(t, "OccupantMustHaveName", "OccupantMustReferenceAnchor", "OccupantShouldHaveHours", "OccupantShouldHavePhone", "OccupantShouldHaveWebsite", "OccupantShouldHaveModifiedTime",
      "EndDateTimeIsBeforeCurrentDateTime", "ModifiedDateTimeIsAfterCurrentDateTime", "StartDateTimeIsAfterEndDateTime", "SimilarOccupantsShouldNotRefSameAnchor");
    const sim = new Map();
    const dt = s => { if (typeof s !== "string") return null; const d = new Date(s); return isNaN(d) ? null : d; };
    for (const o of byType.occupant) {
      const p = o.properties;
      if (!isObj(p.name) || !Object.keys(p.name).length) add(t, "OccupantMustHaveName", o.id, `name ontbreekt.`, "name");
      if (!get(p.anchor_id, "anchor")) add(t, "OccupantMustReferenceAnchor", o.id, `anchor_id ${str(p.anchor_id)} verwijst niet naar een anchor.`, "anchor_id");
      if (p.hours == null) add(t, "OccupantShouldHaveHours", o.id, `hours ontbreekt.`, "hours");
      if (p.phone == null) add(t, "OccupantShouldHavePhone", o.id, `phone ontbreekt.`, "phone");
      if (p.website == null) add(t, "OccupantShouldHaveWebsite", o.id, `website ontbreekt.`, "website");
      const v = isObj(p.validity) ? p.validity : null;
      if (!v || v.modified == null) add(t, "OccupantShouldHaveModifiedTime", o.id, `validity.modified ontbreekt.`, "validity");
      if (v) {
        const s = dt(v.start), e = dt(v.end), m = dt(v.modified);
        if (e && e <= now) add(t, "EndDateTimeIsBeforeCurrentDateTime", o.id, `validity.end (${v.end}) ligt in het verleden.`, "validity");
        if (m && m > now) add(t, "ModifiedDateTimeIsAfterCurrentDateTime", o.id, `validity.modified (${v.modified}) ligt in de toekomst.`, "validity");
        if (s && e && s > e) add(t, "StartDateTimeIsAfterEndDateTime", o.id, `validity.start ligt na validity.end.`, "validity");
      }
      if (isObj(p.name) && p.anchor_id) for (const n of Object.values(p.name)) { if (typeof n !== "string") continue;
        const k = p.anchor_id + "|" + n.trim().toLowerCase(); if (sim.has(k)) add(t, "SimilarOccupantsShouldNotRefSameAnchor", o.id, `Occupant met dezelfde naam (${n}) verwijst naar dezelfde anchor als ${sim.get(k)}.`, "anchor_id"); else sim.set(k, o.id); }
    }
  }

  // ---------- Fixture / Kiosk ----------
  {
    const unitKeys = new Map(); for (const u of byType.unit) unitKeys.set(u.properties.level_id + "|" + geomKey(u.geometry), u.id);
    mark("fixture", "FixtureMustNotEqualFixture", "FixtureMustNotEqualUnit", "BaggageCarouselFixtureShouldHaveName", "FixtureMustContainReferencedAnchor", "BaggageCarouselFixtureShouldHaveDisplayPointAndName");
    const carouselPts = byType.amenity.filter(a => a.properties.category === "baggagecarousel" && isPoint(a.geometry)).map(a => a.geometry.coordinates);
    const fx = new Map();
    for (const f of byType.fixture) {
      const p = f.properties, k = p.level_id + "|" + geomKey(f.geometry);
      if (f.geometry) { if (fx.has(k)) add("fixture", "FixtureMustNotEqualFixture", f.id, `Zelfde geometrie op hetzelfde level als fixture ${fx.get(k)}.`, "geometry"); else fx.set(k, f.id);
        if (unitKeys.has(k)) add("fixture", "FixtureMustNotEqualUnit", f.id, `Zelfde geometrie als unit ${unitKeys.get(k)}.`, "geometry"); }
      if (p.category === "baggagecarousel" && p.name == null) add("fixture", "BaggageCarouselFixtureShouldHaveName", f.id, `Bagageband-fixture zonder naam.`, "name");
      if (p.category === "baggagecarousel" && (p.name == null || p.display_point == null) && f.geometry && !carouselPts.some(pt => ptInGeom(pt, f.geometry)))
        add("fixture", "BaggageCarouselFixtureShouldHaveDisplayPointAndName", f.id, `Bagageband-fixture zonder baggagecarousel-amenity mist ${[p.name == null && "name", p.display_point == null && "display_point"].filter(Boolean).join(" en ")}.`, p.name == null ? "name" : "display_point");
      const an = get(p.anchor_id, "anchor"); if (an && isPoint(an.geometry) && f.geometry && !ptInGeom(an.geometry.coordinates, f.geometry)) add("fixture", "FixtureMustContainReferencedAnchor", f.id, `Verwezen anchor ${an.id} ligt buiten de fixture.`, "anchor_id");
    }
    mark("kiosk", "KioskMustNotEqualUnit", "KioskMustContainReferencedAnchor", "KioskShouldHaveAnchorOrContainAmenity");
    for (const k of byType.kiosk) {
      const p = k.properties, key = p.level_id + "|" + geomKey(k.geometry);
      if (k.geometry && unitKeys.has(key)) add("kiosk", "KioskMustNotEqualUnit", k.id, `Zelfde geometrie als unit ${unitKeys.get(key)}.`, "geometry");
      const an = get(p.anchor_id, "anchor"); if (an && isPoint(an.geometry) && k.geometry && !ptInGeom(an.geometry.coordinates, k.geometry)) add("kiosk", "KioskMustContainReferencedAnchor", k.id, `Verwezen anchor ${an.id} ligt buiten de kiosk.`, "anchor_id");
      if (!an && !byType.amenity.some(a => isPoint(a.geometry) && ptInGeom(a.geometry.coordinates, k.geometry))) add("kiosk", "KioskShouldHaveAnchorOrContainAmenity", k.id, `Kiosk heeft geen anchor en bevat geen amenity.`);
    }
  }

  // ---------- Geofence / Section ----------
  {
    mark("geofence", "GeofenceMustHaveLevelOrBuildingReference", "GeofenceHasNoBuildingReference", "GeofenceHasNoLevelReference", "GeofenceHasParentReference");
    for (const g of byType.geofence) { const p = g.properties, b = Array.isArray(p.building_ids) && p.building_ids.length, l = Array.isArray(p.level_ids) && p.level_ids.length;
      if (!b && !l) add("geofence", "GeofenceMustHaveLevelOrBuildingReference", g.id, `Geen building_ids en geen level_ids.`);
      if (!b) add("geofence", "GeofenceHasNoBuildingReference", g.id, `Geen building_ids.`, "building_ids");
      if (!l) add("geofence", "GeofenceHasNoLevelReference", g.id, `Geen level_ids.`, "level_ids");
      if (Array.isArray(p.parents) && p.parents.length) add("geofence", "GeofenceHasParentReference", g.id, `Heeft parents (${p.parents.length}).`, "parents"); }
    mark("section", "SectionHasParentReference");
    for (const s of byType.section) if (Array.isArray(s.properties.parents) && s.properties.parents.length) add("section", "SectionHasParentReference", s.id, `Heeft parents (${s.properties.parents.length}).`, "parents");
  }

  // ---------- Relationship ----------
  {
    const t = "relationship";
    mark(t, "RelationshipDirectionMustBeValid", "InvalidRelationshipOriginReference", "InvalidRelationshipIntermediaryReference", "InvalidRelationshipDestinationReference");
    const refOk = r => isObj(r) && typeof r.id === "string" && typeof r.feature_type === "string" && get(r.id, r.feature_type);
    for (const r of byType.relationship) {
      const p = r.properties;
      if (!["directed", "undirected"].includes(p.direction)) add(t, "RelationshipDirectionMustBeValid", r.id, `direction ${str(p.direction)} moet "directed" of "undirected" zijn.`, "direction");
      if (p.origin != null && !refOk(p.origin)) add(t, "InvalidRelationshipOriginReference", r.id, `origin ${str(p.origin)} verwijst niet naar een bestaand feature van dat type.`, "origin");
      if (p.destination != null && !refOk(p.destination)) add(t, "InvalidRelationshipDestinationReference", r.id, `destination ${str(p.destination)} verwijst niet naar een bestaand feature van dat type.`, "destination");
      if (p.intermediary != null && (!Array.isArray(p.intermediary) || !p.intermediary.every(refOk))) add(t, "InvalidRelationshipIntermediaryReference", r.id, `intermediary bevat een ongeldige verwijzing.`, "intermediary");
    }
  }

  // Regels zonder (bijbehorende) features in het archief gelden als gecontroleerd zodra er niets te controleren valt
  const present = new Set(Object.keys(feats).map(F));
  for (const x of R.values()) if (!x.checked && x.feature !== "N/A" && x.feature !== "Manifest" && !present.has(x.feature)) { x.checked = true; x.partial = "Geen features van dit type in het archief."; }

  // Waarom een regel niet gecontroleerd wordt
  const WHY = { AddressMustHaveProvinceCode: "Vereist de ISO 3166-2-lijst met landen waarvoor een provinciecode verplicht is.",
    ReferencedAddressDoesNotMatchBuildingAddress: "Vereist bepalen in welke building een anchor ligt (vergelijking van vlakken).",
    BuildingNameMatchesOccupantName: "Vereist bepalen welke occupants in een building liggen (vergelijking van vlakken)." };
  for (const x of R.values()) if (!x.checked) x.partial = WHY[x.rule] || "Vereist een geometrische vergelijking van vlakken of lijnen (overlap, bedekking, snijding); niet ondersteund in deze viewer.";
  const rules = [...R.values()];
  const sev = s => issues.filter(i => i.severity === s).length;
  return { issues, rules, stats: { violations: sev("Violation"), warnings: sev("Warning"), info: sev("Info"),
    checked: rules.filter(r => r.checked).length, total: rules.length } };
}
