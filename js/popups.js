"use strict";
// Pop-ups en klikken op de kaart.

// ---------- Popups ----------
let popup = null;
function levelLabel(ord) {
  const lv = (S.levelsByOrd.get(ord) || [])[0];
  return lv ? (nm(lv.properties.short_name) || "") + " " + (nm(lv.properties.name) || "") : String(ord);
}
function rows(pairs) {
  return "<table>" + pairs.filter(([, v]) => v != null && v !== "" && !(Array.isArray(v) && !v.length))
    .map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v}</td></tr>`).join("") + "</table>";
}
function popupHtml(f) {
  const p = f.properties, t = f.feature_type;
  const link = u => u ? extLink(u) : null;
  let unit = null, extra = [];
  if (t === "occupant") {
    const an = S.anchorById[p.anchor_id]; unit = an && S.unitById[an.properties.unit_id];
    if (p.validity) extra.push(["Geldig", esc([p.validity.start?.slice(0, 10), p.validity.end?.slice(0, 10) || "…"].join(" → "))]);
  } else if (t === "amenity") {
    unit = S.unitById[(p.unit_ids || [])[0]];
  } else if (p.level_id) {
    unit = null;
  }
  const lvl = S.levelById[(unit || f).properties.level_id];
  const title = nm(p.name) || prettyCat(p.category) || t;
  return `<div class="pop"><h3>${esc(title)}</h3><div class="cat">${esc(t)} · ${esc(prettyCat(p.category))}</div>` + rows([
    ["Alt. naam", esc(nm(p.alt_name))],
    ["Openingstijden", esc(p.hours)],
    ["Telefoon", esc(p.phone)],
    ["Website", link(p.website)],
    ["Toegankelijk", esc((p.accessibility || []).join(", "))],
    ["Restrictie", esc(p.restriction)],
    ...extra,
    ["Unit", unit ? esc(nm(unit.properties.name) || prettyCat(unit.properties.category)) : null],
    ["Verdieping", lvl ? esc(levelLabel(lvl.properties.ordinal) + (lvl.properties.outdoor ? " (buiten)" : "")) : null],
    ["ID", `<code style="font-size:11px">${esc(f.id)}</code>`]
  ]) + "</div>";
}
function showPopup(f, lngLat) {
  if (popup) popup.remove();
  popup = new maplibregl.Popup({ maxWidth: "320px", offset: 10 }).setLngLat(lngLat).setHTML(popupHtml(f)).addTo(map);
}
const clickable = () => [...layersOf("occupant", "pt"), ...layersOf("amenity", "pt"), ...layersOf("occupant", "lbl"), "fixture-fill", "section-fill", "unit-fill"];
map.on("click", e => {
  if (!S.loaded) return;
  const hits = map.queryRenderedFeatures(e.point, { layers: clickable().filter(id => map.getLayer(id)) });
  if (!hits.length) return;
  const h = hits[0];
  if (h.properties._count > 1) {   // cluster: inzoomen tot de losse punten zichtbaar zijn
    const [x1, y1, x2, y2] = JSON.parse(h.properties._bbox);
    const cam = map.cameraForBounds([[x1, y1], [x2, y2]], { padding: 80, maxZoom: 21 });
    map.easeTo({ center: cam.center, zoom: Math.max(cam.zoom, 18.2) });
    return;
  }
  const f = S.featById[h.properties._fid];
  if (!f) return;
  const at = h.geometry.type === "Point" ? h.geometry.coordinates : e.lngLat;
  showPopup(f, at);
});
map.on("mousemove", e => {
  if (!S.loaded) return;
  const hits = map.queryRenderedFeatures(e.point, { layers: [...layersOf("occupant", "pt"), ...layersOf("amenity", "pt")].filter(id => map.getLayer(id)) });
  map.getCanvas().style.cursor = hits.length ? "pointer" : "";
});
