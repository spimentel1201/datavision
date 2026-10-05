// DataVision Analytics - servidor sin dependencias externas (solo módulos nativos de Node.js)
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.csv': 'text/csv; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  // Health check (útil para el Application Load Balancer / Target Group)
  if (url === '/health') return json(res, 200, { status: 'ok' });

  if (url === '/api/status') {
    return json(res, 200, {
      servicio: 'DataVision Analytics',
      estado: 'Operativo',
      version: require('./package.json').version,
      host: os.hostname(),
      node: process.version,
      uptime_segundos: Math.round(process.uptime()),
      hora_servidor: new Date().toISOString()
    });
  }

  if (url === '/api/samples') {
    const dir = path.join(PUB, 'samples');
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.csv')).sort() : [];
    return json(res, 200, files);
  }

  const file = path.normalize(path.join(PUB, url === '/' ? 'index.html' : url));
  if (file.indexOf(PUB) !== 0) { res.writeHead(403); return res.end('Prohibido'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('No encontrado'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => console.log('DataVision Analytics escuchando en el puerto ' + PORT));
