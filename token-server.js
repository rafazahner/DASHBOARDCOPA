// Servidor proxy local para renovar o token do Microsoft sem expor credenciais no browser
import http from 'http';
import https from 'https';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Carrega .env manualmente (Node não lê automaticamente)
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envFile = readFileSync(resolve(__dirname, '.env'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  });
} catch {}

const TENANT_ID = process.env.VITE_TENANT_ID;
const CLIENT_ID = process.env.VITE_CLIENT_ID;
const CLIENT_SECRET = process.env.VITE_CLIENT_SECRET;
const PORT = 3001;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/get-token') {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
    }).toString();

    const options = {
      hostname: 'login.microsoftonline.com',
      path: `/${TENANT_ID}/oauth2/v2.0/token`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const msReq = https.request(options, (msRes) => {
      let data = '';
      msRes.on('data', chunk => data += chunk);
      msRes.on('end', () => {
        res.writeHead(msRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
        console.log('[Token Server] Token gerado. Status:', msRes.statusCode);
      });
    });

    msReq.on('error', (e) => {
      console.error('[Token Server] Erro:', e);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    });

    msReq.write(body);
    msReq.end();
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`[Token Server] Rodando em http://localhost:${PORT}`);
});
