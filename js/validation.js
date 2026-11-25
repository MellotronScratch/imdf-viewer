"use strict";
// Validatie-paneel; de validatie zelf draait in js/validator/ (Web Worker).

// ---------- Validatie (regels uit de OGC-lijst imdf-validations-1.0.3) ----------
const SEV = { Violation: { nl: "Fout", ord: 0, cls: "v", icon: "✕" }, Warning: { nl: "Waarschuwing", ord: 1, cls: "w", icon: "⚠" }, Info: { nl: "Info", ord: 2, cls: "i", icon: "ℹ" } };
// Validatie draait in een Web Worker (js/validator/worker.js, met Turf.js/RBush uit vendor/ voor de
// geometrische regels), zodat de kaart bruikbaar blijft. Lukt dat niet, dan alleen de niet-geometrische
// regels op de hoofdthread.
let valWorker = null;
function setValStatus(t) { const el = $("val-body"); if (el && !S.val) el.innerHTML = `<span class="muted"><span class="spin"></span>${esc(t)}</span>`; }
function runValidation() {
  if (!S.loaded || typeof validateIMDF !== "function") return;
  const t0 = performance.now(), gen = S.valGen = (S.valGen || 0) + 1, lang = S.data.manifest?.language || S.lang;
  S.val = null; setValStatus("Valideren…");
  const done = v => { if (gen !== S.valGen) return; S.val = v; S.val.ms = Math.round(performance.now() - t0); valWorker?.terminate(); valWorker = null; renderValidation(); };
  const fallback = why => { if (gen !== S.valGen) return; valWorker?.terminate(); valWorker = null;
    try { const v = validateIMDF({ data: S.data, lang }); v.geoError = why; done(v); } catch (e) { console.error(e); done({ error: e.message }); } };
  try {
    valWorker?.terminate();
    valWorker = new Worker("js/validator/worker.js");
    valWorker.onmessage = e => { const m = e.data; if (m.progress) return gen === S.valGen && setValStatus(m.progress); m.error ? done({ error: m.error }) : done(m.result); };
    valWorker.onerror = e => { e.preventDefault?.(); fallback("Achtergrondvalidatie niet beschikbaar (" + (e.message || "worker-fout") + "); geometrische regels niet gecontroleerd."); };
    valWorker.postMessage({ data: S.data, lang });
  } catch (e) { fallback("Achtergrondvalidatie niet beschikbaar (" + e.message + "); geometrische regels niet gecontroleerd."); }
}
function renderValidation() {
  const el = $("val-body"); if (!el || !S.val) return;
  if (S.val.error) { el.innerHTML = `<span class="vbadge v">Validatie mislukt: ${esc(S.val.error)}</span>`; return; }
  const st = S.val.stats, plural = (n, a, b) => `${n.toLocaleString("nl-NL")} ${n === 1 ? a : b}`;
  el.innerHTML = `<div class="val-sum">
      <button class="vbadge v${st.violations ? "" : " zero"}" data-sev="Violation" title="Violations: overtredingen van de standaard">✕ ${plural(st.violations, "fout", "fouten")}</button>
      <button class="vbadge w${st.warnings ? "" : " zero"}" data-sev="Warning" title="Warnings: waarschijnlijk een probleem">⚠ ${plural(st.warnings, "waarschuwing", "waarschuwingen")}</button>
      <button class="vbadge i${st.info ? "" : " zero"}" data-sev="Info" title="Info: ter informatie">ℹ ${plural(st.info, "info", "info")}</button>
    </div>
    ${S.val.geoError ? `<div class="val-warn">⚠ ${esc(S.val.geoError)}</div>` : ""}
    <div class="muted val-meta">${st.checked} van ${st.total} regels gecontroleerd · ${S.val.ms != null ? (S.val.ms / 1000).toLocaleString("nl-NL", { maximumFractionDigits: 1 }) + " s" : "?"} ·
      <button class="linkbtn" id="val-all">alle bevindingen</button> · <button class="linkbtn" id="val-rules">regels</button> · <button class="linkbtn" id="val-rerun">opnieuw</button></div>`;
  el.querySelectorAll("[data-sev]").forEach(b => b.onclick = () => openIssues({ severity: b.dataset.sev }));
  $("val-all").onclick = () => openIssues({});
  $("val-rules").onclick = openRules;
  $("val-rerun").onclick = () => runValidation();
}
const sevCell = v => SEV[v] ? `<span class="vbadge ${SEV[v].cls} sm">${SEV[v].icon} ${SEV[v].nl}</span>` : null;
const sevSort = (c, v) => c === "ernst" ? (SEV[v]?.ord ?? 9) : undefined;
function openIssues({ severity, rule, feature }) {
  if (!S.val?.issues) return;
  const list = S.val.issues.filter(x => (!severity || x.severity === severity) && (!rule || (x.rule === rule && x.feature === feature)))
    .sort((a, b) => SEV[a.severity].ord - SEV[b.severity].ord || a.rule.localeCompare(b.rule));
  const rows = list.map((x, i) => ({ type: "Feature", id: "val-" + i, feature_type: "_issue", geometry: null,
    properties: { ernst: x.severity, regel: x.rule, featuretype: x.ftype || (x.feature === "N/A" ? "archief" : x.feature.toLowerCase()), feature: x.fid, attribuut: x.attr, melding: x.msg } }));
  openTable("validatie", { rows, hideId: true, cell: (c, v) => c === "ernst" ? sevCell(v) : null, sortKey: sevSort,
    title: "Validatie · " + (rule ? rule : severity ? SEV[severity].nl.toLowerCase().replace(/^fout$/, "fouten").replace(/^waarschuwing$/, "waarschuwingen") : "alle bevindingen") });
}
function openRules() {
  if (!S.val?.rules) return;
  const rows = S.val.rules.map((r, i) => ({ type: "Feature", id: "rule-" + i, feature_type: "_rule", geometry: null,
    properties: { featuretype: r.feature === "N/A" ? "archief" : r.feature.toLowerCase(), ernst: r.severity, regel: r.rule, bevindingen: r.count,
      status: !r.checked ? "niet gecontroleerd" : r.partial ? "gedeeltelijk" : "gecontroleerd", toelichting: r.partial, definitie: r.definition, _rule: r } }))
    .sort((a, b) => (b.properties.bevindingen > 0) - (a.properties.bevindingen > 0) || SEV[a.properties.ernst].ord - SEV[b.properties.ernst].ord || a.properties.regel.localeCompare(b.properties.regel));
  const ST = { "gecontroleerd": "ok", "gedeeltelijk": "part", "niet gecontroleerd": "no" };
  openTable("validatieregels", { rows, hideId: true, title: "Validatie · regels (OGC imdf-validations-1.0.3)",
    cell: (c, v) => c === "ernst" ? sevCell(v) : c === "status" ? `<span class="vstat ${ST[v]}">${esc(v)}</span>` : c === "bevindingen" ? (v ? `<span class="chip ref">${v.toLocaleString("nl-NL")} →</span>` : '<span class="nil">0</span>') : null,
    sortKey: sevSort, onRow: row => { const r = row.properties._rule; if (r.count) openIssues({ rule: r.rule, feature: r.feature }); } });
}
