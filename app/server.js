const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { host, port } = require('../config/env');

const publicDir = path.join(__dirname, 'public');
const files = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/app.js', ['app.js', 'text/javascript']],
  ['/calculator.js', ['calculator.js', 'text/javascript']],
  ['/styles.css', ['styles.css', 'text/css']],
]);

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }
  const file = files.get(new URL(req.url, `http://${host}`).pathname);
  if (!file) {
    res.writeHead(404).end('Not found');
    return;
  }
  try {
    const content = await fs.readFile(path.join(publicDir, file[0]));
    res.writeHead(200, {
      'Content-Type': `${file[1]}; charset=utf-8`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'",
    });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch (error) {
    console.error('Could not serve app asset:', error);
    res.writeHead(500).end('Could not load the application');
  }
});

server.listen(port, host, () => console.log(`Loan planner listening on ${host}:${port}`));
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
