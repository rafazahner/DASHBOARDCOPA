export const config = { runtime: 'edge' };

const TENANT_ID = process.env.PLANNER_TENANT_ID || '';
const CLIENT_ID = process.env.PLANNER_CLIENT_ID || '';
const CLIENT_SECRET = process.env.PLANNER_CLIENT_SECRET || '';
const PLAN_ID = process.env.PLANNER_PLAN_ID || '';

async function getAccessToken(): Promise<string> {
  const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Falha ao obter token: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

export default async function handler(req: Request): Promise<Response> {
  try {
    if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET || !PLAN_ID) {
      return new Response(JSON.stringify({ error: 'Variáveis de ambiente do Planner não configuradas (PLANNER_TENANT_ID, PLANNER_CLIENT_ID, PLANNER_CLIENT_SECRET, PLANNER_PLAN_ID).' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = await getAccessToken();

    const [tasksRes, bucketsRes] = await Promise.all([
      fetch(`https://graph.microsoft.com/v1.0/planner/plans/${PLAN_ID}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`https://graph.microsoft.com/v1.0/planner/plans/${PLAN_ID}/buckets`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (!tasksRes.ok) {
      const errText = await tasksRes.text();
      return new Response(JSON.stringify({ error: `Erro ao buscar tarefas: ${tasksRes.status} ${errText}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!bucketsRes.ok) {
      const errText = await bucketsRes.text();
      return new Response(JSON.stringify({ error: `Erro ao buscar buckets: ${bucketsRes.status} ${errText}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const tasksData = await tasksRes.json();
    const bucketsData = await bucketsRes.json();

    return new Response(JSON.stringify({ tasks: tasksData.value, buckets: bucketsData.value }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=60' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
