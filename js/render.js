"use strict";
// Kaartlagen, clusters, verdiepingen, filters en zichtbaarheid.

// ---------- Render ----------
const fc = features => ({ type: "FeatureCollection", features });
function matchColor(table, fallback, prop = "category") {
  const m = ["match", ["get", prop]];
  for (const [k, v] of Object.entries(table)) m.push(k, v);
  m.push(fallback); return m;
}
const LAYERS = [];
function addLayer(def, group) { map.addLayer(def); LAYERS.push({ id: def.id, group }); }

// Zoombanden: onder zoom 15 geen punten; tot zoom 18 worden gelijke punten geclusterd (cz = zoom waarop de afstand berekend wordt)
const POINTS_MINZOOM = 15;
const CLUSTER_BANDS = [{ min: POINTS_MINZOOM, max: 16, cz: 15 }, { min: 16, max: 17, cz: 16 }, { min: 17, max: 18, cz: 17 }, { min: 18 }];
const layersOf = (t, kind) => LAYERS.filter(l => l.id.startsWith(`${t}-${kind}-`)).map(l => l.id);
const bandPoints = (t, b) => b.cz == null ? S.points[t].map(f => ({ ...f, properties: { ...f.properties, _count: 1 } })) : clusterPoints(S.points[t], b.cz);
function clusterPoints(points, z) {
  // Wereldpixels (512px-tegels) op zoom z
  const W = 512 * 2 ** z;
  const px = ([lng, lat]) => { const s = Math.sin(lat * Math.PI / 180);
    return [(lng + 180) / 360 * W, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * W]; };
  const iconPx = 26 * (z <= 14 ? 0.4 : z >= 17 ? 0.75 : 0.4 + (z - 14) / 3 * 0.35);
  const R = Math.max(18, iconPx * 2.2), R2 = R * R;
  const groups = new Map();   // zelfde categorie én zelfde verdieping(en)
  for (const f of points) { const k = f.properties.category + f.properties._ok; (groups.get(k) || groups.set(k, []).get(k)).push(f); }
  const out = [];
  for (const g of groups.values()) {
    const P = g.map(f => px(f.geometry.coordinates)), used = new Uint8Array(g.length);
    for (let i = 0; i < g.length; i++) {
      if (used[i]) continue;
      used[i] = 1; const members = [i];
      // Groei het cluster vanuit alle leden (zodat een rij balies één cluster wordt)
      for (let m = 0; m < members.length; m++) for (let j = 0; j < g.length; j++) {
        if (used[j]) continue;
        const dx = P[members[m]][0] - P[j][0], dy = P[members[m]][1] - P[j][1];
        if (dx * dx + dy * dy <= R2) { used[j] = 1; members.push(j); }
      }
      const cs = members.map(k => g[k].geometry.coordinates);
      const lng = cs.reduce((a, c) => a + c[0], 0) / cs.length, lat = cs.reduce((a, c) => a + c[1], 0) / cs.length;
      const bbox = [Math.min(...cs.map(c => c[0])), Math.min(...cs.map(c => c[1])), Math.max(...cs.map(c => c[0])), Math.max(...cs.map(c => c[1]))];
      out.push({ type: "Feature", geometry: { type: "Point", coordinates: [lng, lat] },
        properties: { ...g[i].properties, _count: members.length, _bbox: JSON.stringify(bbox) } });
    }
  }
  return out;
}

// Zet de ringrichting vast (buitenring tegen de klok in, gaten met de klok mee),
// zodat een positieve line-offset altijd naar binnen wijst
function rewind(features) {
  const area = r => { let a = 0; for (let i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return a; };
  const fix = (r, ccw) => (area(r) > 0) === ccw ? r : [...r].reverse();
  const poly = rings => rings.map((r, i) => fix(r, i === 0));
  return features.map(f => {
    const g = f.geometry; if (!g) return f;
    if (g.type === "Polygon") return { ...f, geometry: { type: "Polygon", coordinates: poly(g.coordinates) } };
    if (g.type === "MultiPolygon") return { ...f, geometry: { type: "MultiPolygon", coordinates: g.coordinates.map(poly) } };
    return f;
  });
}

function render() {
  if (typeof T !== "undefined") { T.type = null; T.sel = null; $("tbl").classList.add("hidden"); }
  for (const l of LAYERS.splice(0)) if (map.getLayer(l.id)) map.removeLayer(l.id);
  for (const s of Object.keys(map.getStyle().sources)) if (s !== "basemap") map.removeSource(s);

  const src = (id, features) => map.addSource(id, { type: "geojson", data: fc(features.filter(f => f.geometry)) });
  src("venue", feats("venue")); src("footprint", feats("footprint")); src("level", feats("level"));
  src("unit", feats("unit")); src("section", rewind(feats("section"))); src("fixture", feats("fixture"));
  src("detail", feats("detail")); src("opening", feats("opening")); src("kiosk", feats("kiosk"));
  // Punten per zoomband: uitgezoomd worden gelijke punten (zelfde categorie + verdieping) samengevoegd
  for (const t of ["amenity", "occupant"]) CLUSTER_BANDS.forEach((b, i) => src(`${t}-${i}`, bandPoints(t, b)));

  // Kleuren zijn neutraal-placeholders; applyMapTheme() zet direct daarna het actieve palet
  addLayer({ id: "venue-fill", type: "fill", source: "venue", paint: { "fill-opacity": 0.4 } }, "venue");
  addLayer({ id: "venue-line", type: "line", source: "venue", paint: { "line-width": 1.5, "line-dasharray": [3, 2], "line-opacity": 0.55 } }, "venue");
  addLayer({ id: "footprint-line", type: "line", source: "footprint", paint: { "line-width": 1, "line-opacity": 0.6 } }, "footprint");
  addLayer({ id: "level-fill", type: "fill", source: "level", paint: { "fill-opacity": 0.97 } }, "level");
  addLayer({ id: "level-line", type: "line", source: "level", paint: { "line-width": 1.2 } }, "level");
  addLayer({ id: "unit-fill", type: "fill", source: "unit", paint: {} }, "unit");
  addLayer({ id: "unit-line", type: "line", source: "unit", filter: ["!=", ["get", "category"], "opentobelow"], paint: { "line-width": ["interpolate", ["linear"], ["zoom"], 16, 0.3, 20, 1] } }, "unit");
  addLayer({ id: "unit-otb", type: "line", source: "unit", filter: ["==", ["get", "category"], "opentobelow"], paint: { "line-width": 1, "line-dasharray": [2, 2] } }, "unit");
  // Section: onzichtbare vulling (alleen voor klikken), een gloed die vanaf de rand naar binnen vervaagt, en een dunne rand
  const glowW = ["interpolate", ["exponential", 1.5], ["zoom"], 15, 2, 17, 6, 19, 14, 21, 28];
  addLayer({ id: "section-fill", type: "fill", source: "section", paint: { "fill-opacity": 0 } }, "section");
  addLayer({ id: "section-glow", type: "line", source: "section", layout: { "line-join": "round" }, paint: {
    "line-width": glowW, "line-blur": glowW,
    "line-offset": ["interpolate", ["exponential", 1.5], ["zoom"], 15, 1, 17, 3, 19, 7, 21, 14] } }, "section");
  addLayer({ id: "section-line", type: "line", source: "section", layout: { "line-join": "round" }, paint: {
    "line-width": ["interpolate", ["linear"], ["zoom"], 15, 0.5, 19, 1.4], "line-opacity": 0.8 } }, "section");
  addLayer({ id: "fixture-fill", type: "fill", source: "fixture", paint: {} }, "fixture");
  addLayer({ id: "fixture-line", type: "line", source: "fixture", paint: { "line-width": 0.4 } }, "fixture");
  addLayer({ id: "kiosk-fill", type: "fill", source: "kiosk", paint: {} }, "kiosk");
  addLayer({ id: "detail-line", type: "line", source: "detail", minzoom: 16, paint: { "line-width": 0.6 } }, "detail");
  addLayer({ id: "opening-line", type: "line", source: "opening", paint: { "line-width": 3 } }, "opening");

  for (const t of ["amenity", "occupant"]) for (const p of S.points[t]) {
    const id = p.properties._icon;
    if (!map.hasImage(id)) {
      const cv = iconCanvas(p.properties.category, t);
      map.addImage(id, cv.getContext("2d").getImageData(0, 0, cv.width, cv.height), { pixelRatio: ICON_RATIO });
    }
  }
  const band = b => ({ ...(b.min != null && { minzoom: b.min }), ...(b.max != null && { maxzoom: b.max }) });
  for (const t of ["occupant", "amenity"]) CLUSTER_BANDS.forEach((b, i) => addLayer({ id: `${t}-pt-${i}`, type: "symbol", source: `${t}-${i}`, ...band(b),
    layout: {
      "icon-image": ["get", "_icon"], "icon-allow-overlap": true, "icon-ignore-placement": true,
      "icon-size": ["interpolate", ["linear"], ["zoom"], 14, 0.4, 17, 0.75, 19, 1, 21, 1.25],
      // Aantal-badge rechtsboven bij een cluster
      "text-field": ["case", [">", ["get", "_count"], 1], ["to-string", ["get", "_count"]], ""],
      "text-font": ["Noto Sans Bold"], "text-size": ["interpolate", ["linear"], ["zoom"], 14, 8, 17, 10],
      "text-offset": [1.05, -0.95], "text-allow-overlap": true, "text-ignore-placement": true },
    paint: { "text-color": "#ffffff", "text-halo-color": ["get", "_color"], "text-halo-width": 2.5 } }, t));
  // Namen alleen bij losse punten
  const LABEL = { occupant: { minzoom: 17, size: 12 }, amenity: { minzoom: 19.5, size: 11 } };
  for (const t of ["occupant", "amenity"]) CLUSTER_BANDS.forEach((b, i) => {
    if (b.max != null && b.max <= LABEL[t].minzoom) return;
    addLayer({ id: `${t}-lbl-${i}`, type: "symbol", source: `${t}-${i}`,
      ...band({ min: Math.max(b.min ?? 0, LABEL[t].minzoom), max: b.max }), layout: {
        "text-field": ["get", "_name"], "text-font": ["Noto Sans Regular"], "text-size": LABEL[t].size, "text-offset": [0, 1.5],
        "text-anchor": "top", "text-max-width": 9, "text-optional": true },
      paint: { "text-halo-width": 1.4 } }, t + "-lbl");
  });
  // Oplichten van een geselecteerde tabelregel
  map.addSource("hl", { type: "geojson", data: fc([]) });
  addLayer({ id: "hl-fill", type: "fill", source: "hl", filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-opacity": 0.18 } }, "hl");
  addLayer({ id: "hl-line", type: "line", source: "hl", filter: ["!=", ["geometry-type"], "Point"], layout: { "line-join": "round" }, paint: { "line-width": 3 } }, "hl");
  addLayer({ id: "hl-pt", type: "circle", source: "hl", filter: ["==", ["geometry-type"], "Point"], paint: {
    "circle-radius": 16, "circle-color": "rgba(0,0,0,0)", "circle-stroke-width": 3 } }, "hl");
  applyMapTheme();

  renderLevelButtons();
  setLevel(S.ord, false);
  document.querySelectorAll("[data-feat]").forEach(l => l.classList.toggle("hidden", !feats(l.dataset.feat).length));
  document.querySelectorAll("[data-cnt]").forEach(c => c.textContent = feats(c.dataset.cnt).length.toLocaleString("nl-NL"));
  applyVisibility();
  fitVenue();
  $("cnt-occupant").textContent = S.points.occupant.length;
  $("cnt-amenity").textContent = S.points.amenity.length;
}

function fitVenue() {
  const b = new maplibregl.LngLatBounds();
  const walk = c => typeof c[0] === "number" ? b.extend(c) : c.forEach(walk);
  const src = feats("venue").length ? feats("venue") : feats("level");
  src.forEach(f => f.geometry && walk(f.geometry.coordinates));
  if (!b.isEmpty()) map.fitBounds(b, { padding: 40, duration: 0 });
}

function renderLevelButtons() {
  const el = $("levels"); el.innerHTML = "";
  for (const o of S.ordinals) {
    const lvls = S.levelsByOrd.get(o);
    const main = lvls.find(l => !l.properties.outdoor) || lvls[0];
    const b = document.createElement("button");
    b.textContent = nm(main.properties.short_name) || String(o);
    b.title = nm(main.properties.name) || `Ordinal ${o}`;
    b.dataset.ord = o;
    b.onclick = () => setLevel(o);
    el.appendChild(b);
  }
  el.classList.toggle("hidden", !S.ordinals.length);
}

function levelFilter(extra) {
  const f = ["==", ["get", "_ord"], S.ord];
  return extra ? ["all", f, extra] : f;
}
function pointFilter(type) {
  const f = ["all", ["in", "|" + S.ord + "|", ["get", "_ok"]]];
  const hidden = [...S.hiddenCats[type]];
  if (hidden.length) f.push(["!", ["in", ["get", "category"], ["literal", hidden]]]);
  return f;
}
function applyPointFilter(t) {
  for (const id of layersOf(t, "pt")) map.setFilter(id, pointFilter(t));
  for (const id of layersOf(t, "lbl")) map.setFilter(id, ["all", pointFilter(t), ["==", ["get", "_count"], 1]]);
}
function setLevel(o, closePopups = true) {
  S.ord = o;
  for (const id of ["level-fill", "level-line", "unit-fill", "section-fill", "section-glow", "section-line", "fixture-fill", "fixture-line", "kiosk-fill", "detail-line", "opening-line"])
    map.setFilter(id, levelFilter());
  map.setFilter("unit-line", levelFilter(["!=", ["get", "category"], "opentobelow"]));
  map.setFilter("unit-otb", levelFilter(["==", ["get", "category"], "opentobelow"]));
  for (const t of ["amenity", "occupant"]) applyPointFilter(t);
  document.querySelectorAll("#levels button").forEach(b => b.classList.toggle("on", Number(b.dataset.ord) === o));
  const lvls = S.levelsByOrd.get(o) || [];
  const names = [...new Set(lvls.map(l => nm(l.properties.name)).filter(Boolean))];
  const short = nm((lvls.find(l => !l.properties.outdoor) || lvls[0])?.properties.short_name);
  $("levelname").textContent = (short ? short + " · " : "") + (names.join(" / ") || "Verdieping " + o);
  $("levelname").classList.remove("hidden");
  if (closePopups && popup) popup.remove();
  renderCategories();
  if (typeof T !== "undefined" && T.type && $("tbl-level").checked && !$("tbl").classList.contains("hidden")) applyTableFilter(false);
  saveView();
}

function renderCategories() {
  for (const type of ["occupant", "amenity"]) {
    const counts = {};
    for (const p of S.points[type]) if (p.properties._ords.includes(S.ord)) counts[p.properties.category] = (counts[p.properties.category] || 0) + 1;
    const box = $("cats-" + type); box.innerHTML = "";
    const cats = Object.keys(counts).sort();
    if (!cats.length) { box.innerHTML = '<div style="color:var(--muted);padding:3px 0">Geen op deze verdieping</div>'; continue; }
    for (const c of cats) {
      const lab = document.createElement("label"); lab.className = "chk";
      const mark = iconImg(c, 16, type);
      lab.innerHTML = `<input type="checkbox" ${S.hiddenCats[type].has(c) ? "" : "checked"}>${mark}${esc(prettyCat(c))}<span class="cnt">${counts[c]}</span>`;
      lab.querySelector("input").onchange = e => {
        e.target.checked ? S.hiddenCats[type].delete(c) : S.hiddenCats[type].add(c);
        applyPointFilter(type);
      };
      box.appendChild(lab);
    }
  }
}

function applyVisibility() {
  const on = {};
  document.querySelectorAll("[data-layer]").forEach(i => on[i.dataset.layer] = i.checked);
  const set = (id, v) => map.getLayer(id) && map.setLayoutProperty(id, "visibility", v ? "visible" : "none");
  set("basemap", on.basemap);
  for (const l of LAYERS) {
    const g = l.group;
    const v = g === "occupant-lbl" ? on.occupant && on.labels : g === "amenity-lbl" ? on.amenity && on.labels :
      (g in on ? on[g] : true);
    set(l.id, v);
  }
}
try { const saved = JSON.parse(localStorage.getItem("imdf-layers") || "{}");
  document.querySelectorAll("[data-layer]").forEach(i => { if (i.dataset.layer in saved) i.checked = saved[i.dataset.layer]; }); } catch {}
document.querySelectorAll("[data-layer]").forEach(i => i.onchange = () => {
  const on = {}; document.querySelectorAll("[data-layer]").forEach(x => on[x.dataset.layer] = x.checked);
  try { localStorage.setItem("imdf-layers", JSON.stringify(on)); } catch {}
  applyVisibility();
});
