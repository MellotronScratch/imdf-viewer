"use strict";
// Licht/donker-thema en de themakleuren van de kaart.

// ---------- Thema ----------
const darkMQ = matchMedia("(prefers-color-scheme: dark)");
let themePref = (() => { try { return localStorage.getItem("imdf-theme") || "auto"; } catch { return "auto"; } })();
const dark = () => document.documentElement.dataset.theme === "dark";
const pal = () => PALETTE[dark() ? "dark" : "light"];
function applyTheme() {
  const dk = themePref === "dark" || (themePref === "auto" && darkMQ.matches);
  document.documentElement.dataset.theme = dk ? "dark" : "light";
  document.querySelectorAll("#theme button").forEach(b => {
    b.classList.toggle("on", b.dataset.pref === themePref);
    b.setAttribute("aria-pressed", b.dataset.pref === themePref);
  });
  // Niet op isStyleLoaded() wachten: die is false zolang er tegels laden, en dan zou de wissel gemist worden
  if (typeof map !== "undefined" && map.getLayer("bg")) applyMapTheme();
}
document.querySelectorAll("#theme button").forEach(b => b.onclick = () => {
  themePref = b.dataset.pref;
  try { localStorage.setItem("imdf-theme", themePref); } catch {}
  applyTheme();
});
darkMQ.addEventListener("change", () => { if (themePref === "auto") applyTheme(); });

// Zet alle themagevoelige kaartkleuren opnieuw — zonder de kaart opnieuw op te bouwen
function applyMapTheme() {
  const P = pal(), set = (id, prop, v) => map.getLayer(id) && map.setPaintProperty(id, prop, v);
  set("bg", "background-color", P.bg);
  set("basemap", "raster-opacity", P.raster.opacity); set("basemap", "raster-saturation", P.raster.sat);
  set("basemap", "raster-brightness-min", P.raster.min); set("basemap", "raster-brightness-max", P.raster.max);
  set("venue-fill", "fill-color", P.venueFill); set("venue-line", "line-color", P.venueLine);
  set("footprint-line", "line-color", P.levelLine);
  for (const id of ["hl-fill", "hl-line", "hl-pt"]) set(id, id === "hl-pt" ? "circle-stroke-color" : id === "hl-fill" ? "fill-color" : "line-color", P.hl);
  set("level-fill", "fill-color", P.levelFill); set("level-line", "line-color", P.levelLine);
  set("unit-fill", "fill-color", matchColor(P.unit, P.unit.unspecified)); set("unit-fill", "fill-opacity", P.unitOpacity);
  for (const id of ["unit-line", "unit-otb", "fixture-line"]) set(id, "line-color", P.line);
  const secColor = matchColor(P.section, P.section._, "_sg");
  set("section-line", "line-color", secColor); set("section-glow", "line-color", secColor); set("section-glow", "line-opacity", P.sectionGlow);
  set("fixture-fill", "fill-color", matchColor(P.fixture, P.fixture._)); set("fixture-fill", "fill-opacity", P.fixtureOpacity);
  set("kiosk-fill", "fill-color", P.kiosk);
  set("detail-line", "line-color", P.detail); set("opening-line", "line-color", P.opening);
  for (const l of LAYERS) if (l.group.endsWith("-lbl")) { set(l.id, "text-color", P.text); set(l.id, "text-halo-color", P.halo); }
}
