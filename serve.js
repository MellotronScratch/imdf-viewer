// Minimale statische webserver: node serve.js  →  http://localhost:8080
const http = require("http"), fs = require("fs"), path = require("path");
const root = __dirname, port = Number(process.env.PORT) || 8080;
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".geojson": "application/geo+json", ".zip": "application/zip" };
http.createServer((req, res) => {
  const p = path.normalize(path.join(root, decodeURIComponent(req.url.split("?")[0]) === "/" ? "index.html" : decodeURIComponent(req.url.split("?")[0])));
  if (!p.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (err, buf) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": types[path.extname(p).toLowerCase()] || "application/octet-stream" });
    res.end(buf);
  });
}).listen(port, () => console.log(`IMDF Viewer op http://localhost:${port}`));
