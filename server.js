const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ndjson': 'application/x-ndjson',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/m4a',
  '.aac': 'audio/aac',
  '.txt': 'text/plain',
};

const server = http.createServer((req, res) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`);
  
  // Manejar solicitud raíz
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath.split('?')[0]);
  
  // Obtener la extensión del archivo
  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Leer el archivo
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Archivo no encontrado
        fs.readFile(path.join(__dirname, '404.html'), (error, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('404 - Archivo no encontrado', 'utf-8');
        });
      } else {
        // Error del servidor
        res.writeHead(500);
        res.end(`Error del servidor: ${error.code}`);
      }
    } else {
      // Archivo encontrado
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}/`);
  console.log('Presiona Ctrl+C para detener el servidor');
});
