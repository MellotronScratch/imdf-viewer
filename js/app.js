"use strict";
// Zoeken, bestanden openen, onthouden tussen verversingen en opstarten.

// ---------- Search ----------
$("search").oninput = debounce(() => {
  const q = $("search").value.trim().toLowerCase(), box = $("results");
  box.innerHTML = "";
  if (q.length < 2) return;
  const all = [...S.points.occupant, ...S.points.amenity]
    .filter(p => p.properties._name.toLowerCase().includes(q) || p.properties.category.includes(q)).slice(0, 60);
  if (!all.length) { box.innerHTML = '<div style="cursor:default;color:var(--muted)">Niets gevonden</div>'; return; }
  for (const p of all) {
    const d = document.createElement("div"), pr = p.properties;
    d.innerHTML = `${iconImg(pr.category, 16, pr._type)}${esc(pr._name)}<small>${esc(nm((S.levelsByOrd.get(pr._ords[0]) || [])[0]?.properties.short_name) || pr._ords[0])}</small>`;
    d.onclick = () => {
      setLevel(pr._ords[0]);
      map.flyTo({ center: p.geometry.coordinates, zoom: Math.max(map.getZoom(), 19) });
      map.once("moveend", () => showPopup(S.featById[pr._fid], p.geometry.coordinates));
    };
    box.appendChild(d);
  }
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
