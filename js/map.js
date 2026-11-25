"use strict";
// De MapLibre-kaart en de achtergrondkaart.

// ---------- Map ----------
const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      // BRT Achtergrondkaart grijs (Kadaster/PDOK) — dekt alleen Nederland, zoom 0–19
      basemap: { type: "raster", tileSize: 256, maxzoom: 19,
        tiles: ["https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/grijs/EPSG:3857/{z}/{x}/{y}.png"],
        attribution: 'Kaartgegevens © <a href="https://www.kadaster.nl">Kadaster</a> (BRT Achtergrondkaart)' }
    },
    layers: [
      { id: "bg", type: "background", paint: { "background-color": pal().bg } },
      { id: "basemap", type: "raster", source: "basemap", paint: { "raster-opacity": pal().raster.opacity, "raster-saturation": pal().raster.sat,
        "raster-brightness-min": pal().raster.min, "raster-brightness-max": pal().raster.max } }
    ]
  },
  center: [4.76, 52.31], zoom: 2, maxZoom: 22, attributionControl: { compact: true }
});
map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-left");
map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
const mapReady = new Promise(r => map.on("load", r));
applyTheme();
