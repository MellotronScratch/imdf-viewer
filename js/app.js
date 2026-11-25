"use strict";
// Zoeken, bestanden openen, onthouden tussen verversingen en opstarten.

// ---------- Zoeken in alle IMDF-objecten ----------
const SEARCH_MAX = 60;
$("search").oninput = debounce(() => {
  const q = $("search").value.trim().toLowerCase(), box = $("results");
  box.innerHTML = "";
  if (q.length < 2 || !S.searchIndex) return;
  // Tekst (naam, categorie, adres) gaat voor id-treffers; daarna op objecttype en naam
  const hits = [];
  for (const e of S.searchIndex) {
    const byText = e.text.includes(q), byId = byText ? null : e.ids.find(x => x[2].includes(q));
    if (byText || byId) hits.push({ e, via: byId?.[0] ?? null, rank: byText ? (e.text.startsWith(q) ? 0 : 1) : (byId[0] === "id" ? 2 : 3) });
  }
  if (!hits.length) { box.innerHTML = '<div class="res-none">Niets gevonden</div>'; return; }
  for (const h of hits) h.label = refLabel(h.e.f.id) || h.e.t;
  hits.sort((a, b) => a.rank - b.rank || a.e.order - b.e.order || a.label.localeCompare(b.label));
  for (const { e, via, label } of hits.slice(0, SEARCH_MAX)) {
    const f = e.f, p = f.properties || {}, o = ordsOf(f)?.[0];
    const lvl = o != null ? nm((S.levelsByOrd.get(o) || [])[0]?.properties.short_name) || String(o) : "";
    const icon = e.t === "amenity" || e.t === "occupant" ? iconImg(p.category, 16, e.t) : `<span class="res-ico t-${esc(e.t)}">${esc(e.t[0].toUpperCase())}</span>`;
    const d = document.createElement("div");
    d.title = `${e.t} · ${f.id}`;
    d.innerHTML = `${icon}<span class="res-name">${esc(label)}${via ? `<span class="res-via">${esc(via)}</span>` : ""}</span><small>${esc(e.t)}${lvl ? " · " + esc(lvl) : ""}</small>`;
    d.onclick = () => {
      if (geomOf(f)) { selectFeature(f); zoomTo(f); }
      else { openTable(e.t); $("tbl-q").value = f.id; applyTableFilter(); }   // geen plek op de kaart: in de tabel tonen
    };
    box.appendChild(d);
  }
  if (hits.length > SEARCH_MAX) box.insertAdjacentHTML("beforeend", `<div class="res-none">… en nog ${(hits.length - SEARCH_MAX).toLocaleString("nl-NL")} — verfijn de zoekopdracht</div>`);
});

// ---------- File input / drag & drop ----------
const pick = () => $("file").click();
$("pick-btn").onclick = pick;
$("open-btn").onclick = pick;
$("close-btn").onclick = forget;
// ---------- Onthouden tussen verversingen (IndexedDB, blijft lokaal in deze browser) ----------
const idb = () => new Promise((res, rej) => {
  const r = indexedDB.open("imdf-viewer", 1);
  r.onupgradeneeded = () => r.result.createObjectStore("kv");
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
async function idbDo(mode, fn) {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction("kv", mode), req = fn(tx.objectStore("kv"));
    tx.oncomplete = () => { db.close(); res(req?.result); }; tx.onerror = () => { db.close(); rej(tx.error); };
  });
}
const store = {
  get: k => idbDo("readonly", s => s.get(k)),
  set: (k, v) => idbDo("readwrite", s => s.put(v, k)),
  del: k => idbDo("readwrite", s => s.delete(k)),
};
// Kaartpositie en verdieping bewaren
function saveView() {
  if (!S.loaded) return;
  const c = map.getCenter();
  try { localStorage.setItem("imdf-view", JSON.stringify({ c: [c.lng, c.lat], z: map.getZoom(), b: map.getBearing(), p: map.getPitch(), o: S.ord })); } catch {}
}
map.on("moveend", saveView);
function restoreView() {
  let v; try { v = JSON.parse(localStorage.getItem("imdf-view")); } catch {}
  if (!v) return;
  if (S.ordinals.includes(v.o)) setLevel(v.o);
  map.jumpTo({ center: v.c, zoom: v.z, bearing: v.b, pitch: v.p });
}
async function forget() {
  try { await store.del("files"); localStorage.removeItem("imdf-view"); } catch {}
  location.href = location.pathname;
}

async function handle(fileList) {
  const files = [...fileList];   // direct kopiëren: het file-input wordt meteen daarna leeggemaakt
  if (!files.length) return;
  $("drop").classList.remove("hidden");
  try {
    await loadFiles(files);
    localStorage.removeItem("imdf-view");
    saveView();
    $("close-btn").classList.remove("hidden");
    try { await store.set("files", files); }
    catch (e) { console.warn("Kon bestand niet onthouden:", e); }
  }
  catch (e) { console.error(e); setStatus("Fout: " + e.message); }
}
$("file").onchange = e => { handle(e.target.files); e.target.value = ""; };
let dragDepth = 0;
window.addEventListener("dragenter", e => { e.preventDefault(); dragDepth++; $("drop").classList.remove("hidden"); $("drop").classList.add("over"); });
window.addEventListener("dragover", e => e.preventDefault());
window.addEventListener("dragleave", () => { if (--dragDepth <= 0) { dragDepth = 0; $("drop").classList.remove("over"); if (S.loaded) $("drop").classList.add("hidden"); } });
window.addEventListener("drop", e => { e.preventDefault(); dragDepth = 0; $("drop").classList.remove("over"); handle(e.dataTransfer.files); });
$("drop").addEventListener("click", e => { if (e.target === $("drop") && S.loaded) $("drop").classList.add("hidden"); });

// Optioneel: ?src=pad/naar/imdf.zip — alleen bestanden van dezelfde server (geen willekeurige externe adressen,
// zodat een link naar deze viewer geen data van derden onder dit domein kan tonen)
(async () => {
  const src = new URLSearchParams(location.search).get("src");
  if (!src) {
    // Geen ?src: het laatst geopende bestand herstellen
    let files; try { files = await store.get("files"); } catch {}
    if (!files?.length) return;
    try {
      setStatus("Vorig bestand herstellen…");
      await loadFiles(files);
      restoreView();
      $("close-btn").classList.remove("hidden");
    } catch (e) { console.error(e); setStatus("Kon vorig bestand niet herstellen: " + e.message); }
    return;
  }
  try {
    const url = new URL(src, location.href);
    if (url.origin !== location.origin) throw new Error("alleen bestanden van deze server zijn toegestaan");
    setStatus("Laden: " + src + "…");
    const res = await fetch(url, { credentials: "same-origin" }); if (!res.ok) throw new Error(res.status + " " + res.statusText);
    await ingest(await readZip(await res.blob()), src.split("/").pop());
  } catch (e) { console.error(e); setStatus("Kon " + src + " niet laden: " + e.message); }
})();
