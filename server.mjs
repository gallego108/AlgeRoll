import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};

function safePath(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const relative = decoded === '/' ? '/index.html' : decoded;
  const resolved = path.resolve(root, `.${relative}`);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

function createRequestHandler(root) {
  return (req, res) => {
    const requested = safePath(root, req.url || '/');
    if (!requested) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Acceso denegado');
      return;
    }

    fs.stat(requested, (statError, stat) => {
      let filePath = requested;
      if (!statError && stat.isDirectory()) filePath = path.join(requested, 'index.html');
      fs.readFile(filePath, (error, data) => {
        if (error) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Archivo no encontrado');
          return;
        }
        res.writeHead(200, {
          'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        });
        res.end(data);
      });
    });
  };
}

export function createStaticServer({ root = projectRoot, port = 4173, host = '127.0.0.1' } = {}) {
  const server = http.createServer(createRequestHandler(root));

  server.on('error', (error) => {
    console.error(`[AlgeRoll] No se pudo iniciar el servidor: ${error.message}`);
    process.exitCode = 1;
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.removeListener('error', reject);
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      resolve({
        server,
        root,
        host,
        port: actualPort,
        close() {
          return new Promise((done) => server.close(() => done()));
        },
      });
    });
  });
}

function runCli() {
  const args = process.argv.slice(2);
  const portArg = args.indexOf('--port');
  const port = Number(portArg >= 0 ? args[portArg + 1] : process.env.PORT || 4173);
  const host = '127.0.0.1';

  createStaticServer({ port, host })
    .then(({ server, port: actualPort }) => {
      console.log(`[AlgeRoll] Servidor listo en http://${host}:${actualPort}`);
      console.log('[AlgeRoll] Ejecuta nuevamente AlgeRoll.bat para detenerlo.');

      const shutdown = (signal) => {
        console.log(`[AlgeRoll] Cerrando servidor (${signal})...`);
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(0), 1500).unref();
      };

      process.on('SIGINT', () => shutdown('SIGINT'));
      process.on('SIGTERM', () => shutdown('SIGTERM'));
    })
    .catch((error) => {
      console.error(`[AlgeRoll] No se pudo iniciar el servidor: ${error.message}`);
      process.exitCode = 1;
    });
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) runCli();
