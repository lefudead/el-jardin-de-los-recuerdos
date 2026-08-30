// Lanzador de servidor estático con rutas fijas (para pruebas locales).
// root = este directorio, puerto = 8123
// Acceso por nombre: http://jardin.local (mapeado en el hosts de Windows)
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const HOST = process.env.HOST || "0.0.0.0";
const PREFERRED_PORT = parseInt(process.env.PORT || "80", 10);
const FALLBACK_PORT = 8123;
const SITE_NAME = process.env.SITE_NAME || "El Jardin de los Recuerdos";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2"
};

const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/") url = "/index.html";
  const filePath = path.join(ROOT, url);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end("not found"); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}).on("error", (err) => {
  if (err.code === "EADDRINUSE" || err.code === "EACCES") {
    // Puerto 80 ocupado o sin permisos: usar el de respaldo
    server.close();
    http.createServer((req, res) => {
      let url = decodeURIComponent(req.url.split("?")[0]);
      if (url === "/") url = "/index.html";
      const fp = path.join(ROOT, url);
      fs.readFile(fp, (re, data) => {
        if (re) { res.writeHead(404); res.end("not found"); return; }
        const ext = path.extname(fp);
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        res.end(data);
      });
    }).listen(FALLBACK_PORT, HOST, () => {
      console.log("Usando puerto de respaldo " + FALLBACK_PORT);
      console.log("  Abre: http://jardin.local:" + FALLBACK_PORT);
    });
    return;
  }
  console.error(err);
});

server.listen(PREFERRED_PORT, HOST, () => {
  console.log("==========================================");
  console.log("  " + SITE_NAME);
  console.log("  Abre en tu navegador: http://jardin.local");
  console.log("  (" + HOST + ":" + PREFERRED_PORT + ")");
  console.log("==========================================");
});
