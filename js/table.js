"use strict";
// Attributentabel onder de kaart.

// ---------- Attributentabel ----------
const TABLE_ICON = '<svg viewBox="0 0 24 24"><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 4v4h6V8H5Zm8 0v4h6V8h-6Zm-8 6v4h6v-4H5Zm8 0v4h6v-4h-6Z"/></svg>';
const ZOOM_ICON = '<svg viewBox="0 0 24 24"><path d="M9.5 3a6.5 6.5 0 0 1 5.25 10.34l5.46 5.45-1.42 1.42-5.45-5.46A6.5 6.5 0 1 1 9.5 3Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"/></svg>';
const EYE_ICON = '<svg viewBox="0 0 24 24"><path d="M12 5c5 0 9 4.5 10 7-1 2.5-5 7-10 7S3 14.5 2 12c1-2.5 5-7 10-7Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/></svg>';
const T = { type: null, rows: [], view: [], cols: [], sort: null, dir: 1, sel: null, RH: 29 };

// Tabelknopje in iedere laag-rij
document.querySelectorAll("label.chk[data-feat]").forEach(l => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "tblbtn"; b.title = "Toon tabelinhoud"; b.innerHTML = TABLE_ICON;
  b.onclick = e => { e.preventDefault(); e.stopPropagation(); openTable(l.dataset.feat); };
  l.querySelector(".cnt")?.after(b) ?? l.append(b);
});
// Rechtermuisklik op een laag → contextmenu
$("side").addEventListener("contextmenu", e => {
  const l = e.target.closest("label.chk[data-feat]");
  if (!l || !S.loaded) return;
  e.preventDefault();
  const t = l.dataset.feat, inp = l.querySelector("[data-layer]");
  showCtx(e.clientX, e.clientY, [
    [TABLE_ICON, "Toon tabelinhoud", () => openTable(t)],
    null,
    [EYE_ICON, "Alleen deze laag tonen", () => { document.querySelectorAll("[data-layer]").forEach(i => { if (i.dataset.layer !== "basemap") i.checked = i === inp; }); inp.onchange(); }],
    [EYE_ICON, "Alle lagen tonen", () => { document.querySelectorAll("[data-layer]").forEach(i => i.checked = true); inp.onchange(); }],
  ]);
});
function showCtx(x, y, items) {
  const m = $("ctx"); m.innerHTML = "";
  for (const it of items) {
    if (!it) { m.append(document.createElement("hr")); continue; }
    const b = document.createElement("button"); b.innerHTML = it[0] + esc(it[1]);
    b.onclick = () => { hideCtx(); it[2](); }; m.append(b);
  }
  m.classList.remove("hidden");
  const r = m.getBoundingClientRect();
  m.style.left = Math.min(x, innerWidth - r.width - 8) + "px"; m.style.top = Math.min(y, innerHeight - r.height - 8) + "px";
}
const hideCtx = () => $("ctx").classList.add("hidden");
const hidePop = () => $("jsonpop").classList.add("hidden");
document.addEventListener("click", e => { if (!e.target.closest("#ctx")) hideCtx(); if (!e.target.closest("#jsonpop, .chip.obj")) hidePop(); });
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  const open = !$("ctx").classList.contains("hidden") || !$("jsonpop").classList.contains("hidden");
  hideCtx(); hidePop();
  if (!open && T.sel && !e.target.closest("input, select, textarea")) deselect();
});

// --- Waarden weergeven ---
const isLangObj = v => v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length && Object.keys(v).every(k => /^[a-z]{2,3}(-[A-Za-z0-9]+)*$/.test(k)) && Object.values(v).every(x => typeof x === "string");
const isGeom = v => v && typeof v === "object" && typeof v.type === "string" && ("coordinates" in v || "geometries" in v);
const countPts = c => typeof c?.[0] === "number" ? 1 : (c || []).reduce((a, x) => a + countPts(x), 0);
function refLabel(id) {
  const f = S.featById[id]; if (!f) return null;
  const p = f.properties, t = f.feature_type;
  if (t === "level") return (nm(p.short_name) ? nm(p.short_name) + " · " : "") + (nm(p.name) || "level");
  if (t === "anchor") return "⚓ " + (refLabel(p.unit_id) || "anchor");
  if (t === "address") return [p.address, p.locality].filter(Boolean).join(", ") || "address";
  return nm(p.name) || prettyCat(p.category) || t;
}
function cellHtml(v) {
  if (v == null || v === "") return '<span class="nil">—</span>';
  if (typeof v === "boolean") return `<span class="chip bool-${v ? "t" : "f"}">${v ? "✓ ja" : "✗ nee"}</span>`;
  if (typeof v === "number") return esc(v.toLocaleString("nl-NL", { maximumFractionDigits: 6 }));
  if (typeof v === "string") {
    const ref = refLabel(v);
    if (ref) return `<span class="chip ref" data-ref="${esc(v)}" title="${esc(S.featById[v].feature_type + " · " + v)}">${esc(ref)}</span>`;
    if (/^https?:\/\//.test(v)) return extLink(v, v.replace(/^https?:\/\//, ""));
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) { const d = new Date(v); if (!isNaN(d)) return `<span title="${esc(v)}">${esc(d.toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" }))}</span>`; }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(v)) return `<span class="mono">${esc(v)}</span>`;
    return esc(v);
  }
  if (isLangObj(v)) {
    const keys = Object.keys(v), shown = nm(v), others = keys.length - 1;
    return `<span title="${esc(keys.map(k => k + ": " + v[k]).join("\n"))}">${esc(shown)}</span>${others > 0 ? `<span class="lbadge">+${others}</span>` : ""}`;
  }
  if (Array.isArray(v)) {
    if (!v.length) return '<span class="nil">[ ]</span>';
    const max = 3, parts = v.slice(0, max).map(x => {
      if (x != null && typeof x === "object") return objChip(x);
      const ref = typeof x === "string" && refLabel(x);
      return ref ? `<span class="chip ref" data-ref="${esc(x)}" title="${esc(x)}">${esc(ref)}</span>` : `<span class="chip">${esc(x)}</span>`;
    });
    if (v.length > max) parts.push(`<span class="chip obj more" data-json="1">+${v.length - max}</span>`);
    return parts.join("");
  }
  return objChip(v);
}
function objChip(v) {
  let label;
  if (isGeom(v)) label = v.type + (v.coordinates ? ` · ${countPts(v.coordinates).toLocaleString("nl-NL")} pt` : "");
  else if (isLangObj(v)) label = nm(v);
  else { const ks = Object.keys(v); label = "{ " + ks.slice(0, 2).map(k => k + ": " + (v[k] != null && typeof v[k] === "object" ? "…" : String(v[k]).slice(0, 14))).join(", ") + (ks.length > 2 ? ", …" : "") + " }"; }
  return `<span class="chip obj" data-json="1">${esc(label)}</span>`;
}
// Ingekleurde JSON voor de popover
function jsonHtml(v, ind = "") {
  const pad = ind + "  ";
  if (v === null) return '<span class="j-z">null</span>';
  if (typeof v === "string") { const r = refLabel(v); return `<span class="j-s">"${esc(v)}"</span>` + (r ? ` <span class="j-z">← ${esc(r)}</span>` : ""); }
  if (typeof v === "number") return `<span class="j-n">${v}</span>`;
  if (typeof v === "boolean") return `<span class="j-b">${v}</span>`;
  if (Array.isArray(v)) {
    if (!v.length) return "[]";
    if (v.every(x => typeof x === "number")) return "[" + v.map(x => `<span class="j-n">${x}</span>`).join(", ") + "]";
    const items = v.slice(0, 200).map(x => pad + jsonHtml(x, pad));
    if (v.length > 200) items.push(pad + `<span class="j-z">… nog ${v.length - 200}</span>`);
    return "[\n" + items.join(",\n") + "\n" + ind + "]";
  }
  const ks = Object.keys(v); if (!ks.length) return "{}";
  return "{\n" + ks.map(k => `${pad}<span class="j-k">${esc(k)}</span>: ${jsonHtml(v[k], pad)}`).join(",\n") + "\n" + ind + "}";
}
function showJson(x, y, title, v) {
  const p = $("jsonpop");
  p.innerHTML = `<div class="jp-head">${esc(title)}</div><pre>${jsonHtml(v)}</pre>`;
  p.classList.remove("hidden");
  const r = p.getBoundingClientRect();
  p.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + "px";
  p.style.top = Math.max(8, Math.min(y + 12, innerHeight - r.height - 8)) + "px";
}

// --- Tabel opbouwen ---
const rowVal = (f, c) => c === "id" ? f.id : c === "geometry" ? f.geometry : f.properties[c];
function sortKey(v) {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") return (refLabel(v) || v).toLowerCase();
  if (isLangObj(v)) return (nm(v) || "").toLowerCase();
  if (Array.isArray(v)) return v.length;
  if (isGeom(v)) return v.type;
  return JSON.stringify(v);
}
function searchText(f) {
  const parts = [f.id];
  for (const [k, v] of Object.entries(f.properties)) {
    if (k.startsWith("_") || v == null) continue;
    if (typeof v === "string") parts.push(v, refLabel(v) || "");
    else if (isLangObj(v)) parts.push(...Object.values(v));
    else if (Array.isArray(v)) v.forEach(x => parts.push(typeof x === "object" ? JSON.stringify(x) : String(x), (typeof x === "string" && refLabel(x)) || ""));
    else parts.push(typeof v === "object" ? JSON.stringify(v) : String(v));
  }
  return parts.join(" ").toLowerCase();
}
const ordsOf = f => {
  f = target(f); if (!f || f.feature_type?.startsWith("_")) return null;
  const p = f.properties;
  if (f.feature_type === "level") return [p.ordinal];
  if (p._ord != null) return [p._ord];
  const pt = S.pointById?.get(f.id);
  return pt ? pt.properties._ords : null;
};
// opts: { rows, title, hideId, cell(col, v) → html, sortKey(col, v), onRow(row) }
function openTable(type, opts = {}) {
  if (!S.loaded) return;
  hideCtx();
  T.type = type; T.opts = opts; T.rows = opts.rows || feats(type); T.sort = null; T.dir = 1; T.sel = null; T.lastClick = null;
  T.text = new Map();
  // Kolommen: alle attributen (volgorde van eerste voorkomen, interne _-velden niet), dan geometrie
  const keys = [], seen = new Set();
  for (const f of T.rows) for (const k of Object.keys(f.properties || {})) if (!k.startsWith("_") && !seen.has(k)) { seen.add(k); keys.push(k); }
  const allNull = k => T.rows.every(f => f.properties[k] == null);
  const shown = keys.filter(k => !allNull(k)), hidden = keys.filter(allNull);
  // Attributen eerst; id en geometrie achteraan (breed en minder vaak nodig)
  T.cols = opts.hideId ? shown : [...shown, "id"]; if (T.rows.some(f => f.geometry)) T.cols.push("geometry");
  T.emptyCols = hidden;
  // Kolombreedtes schatten op een steekproef
  const sample = T.rows.slice(0, 300);
  T.autoW = T.cols.map(c => {
    if (c === "id") return 300;
    if (c === "ernst") return 140;
    let m = c.length + 2;
    for (const f of sample) { const v = rowVal(f, c); const tx = v == null ? "" : typeof v === "string" ? (refLabel(v) || v) : isLangObj(v) ? nm(v) + "  +1" : Array.isArray(v) ? v.slice(0, 3).map(x => (typeof x === "string" && refLabel(x)) || String(x).slice(0, 18)).join("   ") : typeof v === "object" ? "{ xxxxxxxxxxxxxxxxxxxx }" : String(v); m = Math.max(m, tx.length); }
    return Math.max(70, Math.min(c === "melding" || c === "definitie" || c === "toelichting" ? 520 : 320, m * 7 + 26));
  });
  let saved = {}; try { saved = JSON.parse(localStorage.getItem("imdf-colw") || "{}")[type] || {}; } catch {}
  T.widths = T.cols.map((c, i) => (Object.hasOwn(saved, c) && Number.isFinite(saved[c]) ? saved[c] : 0) || T.autoW[i]);
  $("tbl-title").textContent = opts.title || type;
  $("tbl-q").value = "";
  $("tbl-level").parentElement.classList.toggle("hidden", !T.rows.some(f => ordsOf(f)));
  $("tbl").classList.remove("hidden");
  $("tbl-zoom").disabled = true; $("tbl-desel").disabled = true;
  setHL(null);
  applyColWidths();
  renderHead(); applyTableFilter();
  map.resize();
}
function applyColWidths() {
  const cg = $("tbl-table").querySelector("colgroup");
  cg.innerHTML = '<col style="width:34px">' + T.widths.map(w => `<col style="width:${w}px">`).join("");
  $("tbl-table").style.width = (34 + T.widths.reduce((a, b) => a + b, 0)) + "px";
}
function saveColWidths() {
  try {
    const all = JSON.parse(localStorage.getItem("imdf-colw") || "{}"), m = {};
    T.cols.forEach((c, i) => { if (T.widths[i] !== T.autoW[i]) m[c] = T.widths[i]; });
    all[T.type] = m; localStorage.setItem("imdf-colw", JSON.stringify(all));
  } catch {}
}
function renderHead() {
  $("tbl-table").querySelector("thead").innerHTML = '<tr><th class="zoomcol" title="Zoom"></th>' + T.cols.map((c, i) =>
    `<th data-col="${esc(c)}" title="${esc(c)} — klik om te sorteren">${esc(c)}${T.sort === c ? `<span class="arr">${T.dir > 0 ? "▲" : "▼"}</span>` : ""}` +
    `<span class="rsz" data-i="${i}" title="Sleep om de breedte te wijzigen · dubbelklik voor automatische breedte"></span></th>`).join("") + "</tr>";
  // Kolombreedte slepen
  $("tbl-table").querySelectorAll("th .rsz").forEach(h => {
    const i = +h.dataset.i, cols = $("tbl-table").querySelectorAll("colgroup col");
    h.onclick = e => e.stopPropagation();
    h.ondblclick = e => { e.stopPropagation(); T.widths[i] = T.autoW[i]; applyColWidths(); saveColWidths(); };
    h.onpointerdown = e => {
      e.preventDefault(); e.stopPropagation();
      const x0 = e.clientX, w0 = T.widths[i];
      h.classList.add("on"); document.body.classList.add("col-resizing");
      const move = ev => {
        T.widths[i] = Math.max(40, Math.min(1200, Math.round(w0 + ev.clientX - x0)));
        cols[i + 1].style.width = T.widths[i] + "px";
        $("tbl-table").style.width = (34 + T.widths.reduce((a, b) => a + b, 0)) + "px";
      };
      const up = () => { h.classList.remove("on"); document.body.classList.remove("col-resizing");
        removeEventListener("pointermove", move); removeEventListener("pointerup", up); saveColWidths(); };
      addEventListener("pointermove", move); addEventListener("pointerup", up);
    };
  });
  $("tbl-table").querySelectorAll("th[data-col]").forEach(th => th.onclick = () => {
    const c = th.dataset.col;
    if (T.sort === c) T.dir = -T.dir; else { T.sort = c; T.dir = 1; }
    renderHead(); applyTableFilter(false);
  });
}
function applyTableFilter(resetScroll = true) {
  const q = $("tbl-q").value.trim().toLowerCase(), lvl = $("tbl-level").checked;
  let v = T.rows;
  if (lvl) v = v.filter(f => ordsOf(f)?.includes(S.ord));
  if (q) v = v.filter(f => { let t = T.text.get(f); if (t == null) T.text.set(f, t = searchText(f)); return q.split(/\s+/).every(w => t.includes(w)); });
  if (T.sort) {
    const c = T.sort, d = T.dir;
    const key = f => { const x = rowVal(f, c), k = T.opts.sortKey ? T.opts.sortKey(c, x) : undefined; return k !== undefined ? k : sortKey(x); };
    v = v.map(f => [key(f), f]).sort((a, b) => a[0] == null ? 1 : b[0] == null ? -1 : (a[0] < b[0] ? -d : a[0] > b[0] ? d : 0)).map(x => x[1]);
  }
  T.view = v;
  $("tbl-count").textContent = `${v.length.toLocaleString("nl-NL")} van ${T.rows.length.toLocaleString("nl-NL")} regels` +
    (T.emptyCols.length ? ` · ${T.emptyCols.length} lege kolom${T.emptyCols.length > 1 ? "men" : ""} verborgen` : "");
  $("tbl-count").title = T.emptyCols.length ? "Altijd leeg: " + T.emptyCols.join(", ") : "";
  if (resetScroll) $("tbl-scroll").scrollTop = 0;
  renderRows();
}
// Virtueel scrollen: alleen de zichtbare regels staan in de DOM
function renderRows() {
  const sc = $("tbl-scroll"), body = $("tbl-table").querySelector("tbody");
  const n = T.view.length, RH = T.RH;
  const first = Math.max(0, Math.floor((sc.scrollTop) / RH) - 10);
  const last = Math.min(n, Math.ceil((sc.scrollTop + sc.clientHeight) / RH) + 10);
  const colspan = T.cols.length + 1;
  let html = first ? `<tr style="height:${first * RH}px"><td colspan="${colspan}" style="padding:0;border:0"></td></tr>` : "";
  for (let i = first; i < last; i++) {
    const f = T.view[i];
    html += `<tr data-i="${i}"${T.sel === f ? ' class="sel"' : ""}><td class="zoomcol"><button class="zbtn" data-zoom="${i}" title="Zoom naar dit feature">${ZOOM_ICON}</button></td>` +
      T.cols.map(c => { const v = rowVal(f, c), cu = T.opts.cell?.(c, v); return `<td${typeof v === "number" ? ' class="num"' : ""} data-c="${esc(c)}"${c === "melding" || c === "definitie" || c === "toelichting" ? ` title="${esc(v ?? "")}"` : ""}>${cu != null ? cu : c === "geometry" ? (v ? objChip(v) : '<span class="nil">—</span>') : c === "id" ? `<span class="mono">${esc(v)}</span>` : cellHtml(v)}</td>`; }).join("") + "</tr>";
  }
  if (last < n) html += `<tr style="height:${(n - last) * RH}px"><td colspan="${colspan}" style="padding:0;border:0"></td></tr>`;
  if (!n) html = `<tr><td colspan="${colspan}" class="nil" style="text-align:center;height:60px">Geen regels${$("tbl-q").value ? " voor deze zoekopdracht" : ""}</td></tr>`;
  body.innerHTML = html;
}
$("tbl-scroll").addEventListener("scroll", () => { if (!T.raf) T.raf = requestAnimationFrame(() => { T.raf = 0; renderRows(); }); });
$("tbl-q").oninput = debounce(() => applyTableFilter());
$("tbl-level").onchange = () => applyTableFilter();
$("tbl-close").onclick = () => { deselect(); $("tbl").classList.add("hidden"); map.resize(); };
$("tbl-zoom").onclick = () => T.sel && zoomTo(T.sel);
// CSV-export van de zichtbare (gefilterde, gesorteerde) regels.
// Puntkomma als scheidingsteken (Nederlandse Excel), UTF-8 met BOM. Tekst die met = + - @ begint krijgt een '
// ervoor, zodat Excel/LibreOffice hem niet als formule uitvoert (CSV-injectie).
function csvValue(c, v) {
  if (v == null) return "";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  let s = typeof v === "string" ? v : isLangObj(v) ? nm(v) : Array.isArray(v) && v.every(x => x == null || typeof x !== "object") ? v.join(", ") : JSON.stringify(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
$("tbl-csv").onclick = () => {
  if (!T.view?.length) return;
  const cols = T.cols, lines = [cols.map(c => csvValue(c, c)).join(";")];
  for (const f of T.view) lines.push(cols.map(c => csvValue(c, rowVal(f, c))).join(";"));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
  a.download = (T.opts.title || T.type).replace(/[^\w.-]+/g, "_").replace(/^_|_$/g, "") + ".csv";
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
};
$("tbl-desel").onclick = () => deselect();
function deselect() {
  if (!T.sel) return;
  T.sel = null; setHL(null);
  if (popup) popup.remove();
  $("tbl-zoom").disabled = true; $("tbl-desel").disabled = true;
  markSel();
}
$("tbl-table").addEventListener("click", e => {
  const ref = e.target.closest("[data-ref]");
  if (ref) { const f = S.featById[ref.dataset.ref]; if (f) { selectFeature(f); zoomTo(f); } return; }
  const obj = e.target.closest("[data-json]");
  if (obj) { const td = obj.closest("td"), f = T.view[+td.parentElement.dataset.i]; e.stopPropagation();
    showJson(e.clientX, e.clientY, `${T.type} · ${td.dataset.c}`, rowVal(f, td.dataset.c)); return; }
  const z = e.target.closest("[data-zoom]");
  if (z) { const f = T.view[+z.dataset.zoom]; selectFeature(f); zoomTo(f); return; }
  const tr = e.target.closest("tr[data-i]");
  if (!tr) return;
  const f = T.view[+tr.dataset.i], now = Date.now();
  if (T.opts.onRow) { T.opts.onRow(f); return; }
  // Dubbelklik zelf herkennen (twee klikken op dezelfde regel binnen 400 ms): selecteren en zoomen
  if (T.lastClick && T.lastClick.f === f && now - T.lastClick.t < 400) { T.lastClick = null; selectFeature(f); zoomTo(f); return; }
  T.lastClick = { f, t: now };
  T.sel === f ? deselect() : selectFeature(f);   // nogmaals klikken = deselecteren
});
// Alleen de selectiemarkering bijwerken (geen rijen herbouwen, zodat een dubbelklik op dezelfde regel blijft landen)
function markSel() { document.querySelectorAll("#tbl-table tbody tr[data-i]").forEach(tr => tr.classList.toggle("sel", T.view[+tr.dataset.i] === T.sel)); }
// Hoogte aanpassen door te slepen
(() => {
  try { const h = localStorage.getItem("imdf-tbl-h"); if (h) $("tbl").style.setProperty("--tbl-h", h + "px"); } catch {}
  let y0, h0;
  const move = e => { const h = Math.max(120, Math.min(innerHeight * 0.8, h0 + (y0 - e.clientY))); $("tbl").style.setProperty("--tbl-h", h + "px"); map.resize(); renderRows(); };
  const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); document.body.style.cursor = "";
    try { localStorage.setItem("imdf-tbl-h", Math.round($("tbl").getBoundingClientRect().height)); } catch {} };
  $("tbl-grip").addEventListener("pointerdown", e => { e.preventDefault(); y0 = e.clientY; h0 = $("tbl").getBoundingClientRect().height;
    document.body.style.cursor = "ns-resize"; addEventListener("pointermove", move); addEventListener("pointerup", up); });
})();

// --- Oplichten en zoomen op de kaart ---
// Een validatiebevinding staat voor het feature waar ze over gaat
const target = f => f?.feature_type === "_issue" ? S.featById[f.properties.feature] || null : f;
function geomOf(f) {
  f = target(f); if (!f || f.feature_type?.startsWith("_")) return null;
  if (f.feature_type === "occupant") return S.anchorById[f.properties.anchor_id]?.geometry || null;
  if (f.feature_type === "amenity") return f.geometry || S.unitById[(f.properties.unit_ids || [])[0]]?.properties.display_point || null;
  if (f.feature_type === "anchor") return f.geometry;
  return f.geometry || f.properties.display_point || null;
}
function setHL(f) {
  const src = map.getSource("hl"); if (!src) return;
  const g = f && geomOf(f);
  src.setData(fc(g ? [{ type: "Feature", geometry: g, properties: {} }] : []));
}
function selectFeature(f) {
  T.sel = f; $("tbl-zoom").disabled = !geomOf(f); $("tbl-desel").disabled = false;
  const o = ordsOf(f);
  if (o && o.length && !o.includes(S.ord) && S.ordinals.includes(o[0])) setLevel(o[0]);
  setHL(f); markSel();
}
function zoomTo(f) {
  const g = geomOf(f); if (!g) return;
  const b = new maplibregl.LngLatBounds();
  const walk = c => typeof c[0] === "number" ? b.extend(c) : c.forEach(walk);
  walk(g.coordinates);
  const center = b.getCenter();
  if (g.type === "Point") map.flyTo({ center, zoom: Math.max(map.getZoom(), 19) });
  else map.fitBounds(b, { padding: 60, maxZoom: 20.5 });
  map.once("moveend", () => { if (T.sel === f && target(f)) showPopup(target(f), g.type === "Point" ? g.coordinates : center); });
}
