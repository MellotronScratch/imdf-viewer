// Minimale statische webserver voor lokaal gebruik: node serve.js  →  http://localhost:8080
// (Web Workers en ?src= werken niet vanaf file://, vandaar deze server.)
const http = require("http"), fs = require("fs"), path = require("path");
const root = __dirname, port = Number(process.env.PORT) || 8080;
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".geojson": "application/geo+json", ".zip": "application/zip", ".svg": "image/svg+xml",
  ".png": "image/png", ".md": "text/markdown; charset=utf-8", ".csv": "text/csv; charset=utf-8" };
http.createServer((req, res) => {
  let rel; try { rel = decodeURIComponent(req.url.split("?")[0]); } catch { res.writeHead(400); return res.end(); }
  const p = path.normalize(path.join(root, rel === "/" ? "index.html" : rel));
  if (!p.startsWith(root + path.sep) && p !== root) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (err, buf) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    // Tijdens ontwikkelen altijd de nieuwste versie laden
    res.writeHead(200, { "Content-Type": types[path.extname(p).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(buf);
  });
}).listen(port, () => console.log(`IMDF Viewer op http://localhost:${port}`));
