"use strict";
// Bestand-paneel (manifest, metadata, venue, inhoud) en de taalkeuze.

// ---------- Bestandsinformatie (manifest, metadata, venue, inhoud) ----------
function renderInfo() {
  const d = S.data, m = d.manifest || {}, v = feats("venue")[0]?.properties || {};
  const adr = feats("address").find(a => a.id === v.address_id)?.properties || feats("address")[0]?.properties;
  const table = pairs => "<table>" + pairs.filter(([, x]) => x != null && x !== "")
    .map(([k, x]) => `<tr><td>${esc(k)}</td><td>${x}</td></tr>`).join("") + "</table>";
  const date = t => { const dt = new Date(t); return isNaN(dt) ? esc(t) : esc(dt.toLocaleString("nl-NL", { dateStyle: "long", timeStyle: "short" })); };
  const val = x => x == null ? null : typeof x === "object" ? esc(nm(x) ?? JSON.stringify(x)) : esc(x);
  // Per taal tellen hoeveel features een naam in die taal hebben
  const langs = new Set(), langCount = {}, NAMED = ["venue", "building", "level", "unit", "section", "fixture", "kiosk", "occupant", "amenity", "opening"];
  let named = 0;
  for (const t of NAMED) for (const f of feats(t)) {
    const n = f.properties.name; if (!n || typeof n !== "object") continue;
    named++; Object.keys(n).forEach(l => { langs.add(l); langCount[l] = (langCount[l] || 0) + 1; }); }
  renderLangs([...langs]);
  const ext = Array.isArray(m.extensions) && m.extensions.length ? m.extensions.map(e => `<span class="tag">${esc(typeof e === "string" ? e : JSON.stringify(e))}</span>`).join("") : "geen";
  const known = new Set(["version", "created", "generated_by", "language", "extensions"]);
  let html = '<div class="sub">Manifest</div>' + table([
    ["IMDF-versie", val(m.version)], ["Aangemaakt", m.created ? date(m.created) : null],
    ["Gegenereerd door", val(m.generated_by)], ["Taal", val(m.language)], ["Extensies", ext],
    ...Object.entries(m).filter(([k]) => !known.has(k)).map(([k, x]) => [k, val(x)])]);
  if (d.metadata && typeof d.metadata === "object")
    html += '<div class="sub">Metadata</div>' + table(Object.entries(d.metadata).map(([k, x]) => [k.replace(/_/g, " "), val(x)]));
  html += '<div class="sub">Venue</div>' + table([
    ["Categorie", val(prettyCat(v.category))],
    ["Adres", adr ? esc([adr.address, [adr.postal_code, adr.locality].filter(Boolean).join(" "), adr.country].filter(Boolean).join(", ")) : null],
    ["Telefoon", val(v.phone)], ["Website", v.website ? `<a href="${esc(v.website)}" target="_blank" rel="noopener">${esc(v.website.replace(/^https?:\/\//, ""))}</a>` : null],
    ["Namen in", langs.size ? [...langs].sort().map(l => `<button class="tag lang-tag${l === S.lang ? " on" : ""}" data-lang="${esc(l)}" title="${langCount[l].toLocaleString("nl-NL")} van ${named.toLocaleString("nl-NL")} namen in ${esc(l)} · klik om deze taal te tonen">${esc(l)}<span class="lcnt">${langCount[l].toLocaleString("nl-NL")}</span></button>`).join("") : null]]);
  const types = ["building", "footprint", "level", "unit", "opening", "section", "fixture", "detail", "kiosk", "geofence", "anchor", "occupant", "amenity", "relationship"];
  html += '<div class="sub">Inhoud</div><div class="counts">' + types.filter(t => feats(t).length)
    .map(t => `<span><button data-table="${t}" title="Toon tabelinhoud van ${t}">${t}</button></span><span>${feats(t).length.toLocaleString("nl-NL")}</span>`).join("") + "</div>";
  html += '<div class="sub">Validatie <span class="muted" style="text-transform:none;letter-spacing:0">· OGC IMDF 1.0.0</span></div><div id="val-body"><span class="muted">Valideren…</span></div>';
  $("info-body").innerHTML = html;
  if (S.val) renderValidation();
  $("info-body").querySelectorAll(".lang-tag").forEach(b => b.onclick = () => setLang(b.dataset.lang));
  $("info-body").querySelectorAll("[data-table]").forEach(b => b.onclick = () => openTable(b.dataset.table));
  $("info").classList.remove("hidden");
}

// ---------- Taal van namen ----------
function renderLangs(langs) {
  const sel = $("lang"), dn = new Intl.DisplayNames(["nl"], { type: "language" });
  const label = l => { try { return dn.of(l) || l; } catch { return l; } };
  if (!langs.includes(S.lang) && langs.length) langs.push(S.lang);
  // Kort label (NL) in de kop; de volledige naam staat in de tooltip
  sel.innerHTML = langs.sort().map(l => `<option value="${esc(l)}" title="${esc(label(l))}"${l === S.lang ? " selected" : ""}>${esc(l.toUpperCase())}</option>`).join("");
  sel.title = "Taal van namen: " + label(S.lang);
  sel.classList.toggle("hidden", langs.length < 2);
}
$("lang").onchange = e => setLang(e.target.value);
try { if (localStorage.getItem("imdf-info-open") === "0") $("info").open = false; } catch {}
$("info").addEventListener("toggle", () => { try { localStorage.setItem("imdf-info-open", $("info").open ? "1" : "0"); } catch {} });
function setLang(l) {
  S.lang = l;
  try { localStorage.setItem("imdf-lang", l); } catch {}
  const ord = S.ord;
  build();                       // namen opnieuw afleiden
  S.ord = ord;
  for (const t of ["amenity", "occupant"]) CLUSTER_BANDS.forEach((b, i) => map.getSource(`${t}-${i}`)?.setData(fc(bandPoints(t, b))));
  renderLevelButtons();
  setLevel(ord, true);
  $("search").oninput();
  if (T.type && !$("tbl").classList.contains("hidden")) { T.text = new Map(); renderRows(); }
}
