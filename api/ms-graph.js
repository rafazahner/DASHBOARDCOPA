export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // Remove o prefixo /api/ms-graph do caminho para montar a URL do Graph
  const graphPath = req.url.replace(/^\/api\/ms-graph/, '') || '/';
  const graphUrl = `https://graph.microsoft.com${graphPath}`;

  try {
    const response = await fetch(graphUrl, {
      method: req.method,
      headers: {
        Authorization: req.headers.authorization || '',
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
