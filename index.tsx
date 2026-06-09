
import React, { useState, useEffect, useMemo, Fragment, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertCircle,
  User,
  Timer,
  PauseCircle,
  PlusCircle,
  TrendingUp,
  XCircle,
  CalendarDays,
  History,
  Trophy
} from 'lucide-react';

/**
 * CONFIGURAÇÃO GLOBAL
 */
const CONFIG = {
  MOVIDESK_TOKEN: import.meta.env.VITE_MOVIDESK_TOKEN as string,
  REFRESH_MS: 180000,
  NPS_REFRESH_MS: 60000,
  AVATAR_OPACITY: 0.85,
  AVATAR_FALLBACK_OPACITY: 0.08
};

const LOGO_URL = 'https://i.postimg.cc/C14PvBhv/Ultra-Academia-transparente.png';
const GOOGLE_SHEET_API = 'https://script.google.com/macros/s/AKfycbwow33xEPcD-y-1bkmgrLjAs7e65S9isuFw7Dw3AyQM1yG6dYC7SiPUNMpi9nRL62IU/exec';

const PLANNER_CONFIG = {
  PLAN_ID: import.meta.env.VITE_PLANNER_PLAN_ID,
  TENANT_ID: import.meta.env.VITE_TENANT_ID,
  CLIENT_ID: import.meta.env.VITE_CLIENT_ID,
  CLIENT_SECRET: import.meta.env.VITE_CLIENT_SECRET,
  TASKS_REFRESH_MS: 15000,
  TOKEN_REFRESH_MS: 3540000, // 59 minutos (token expira em 60min)
  BUCKET_IDS: {
    entregue: 'FWbREOaRx0ar5289lO5IxWUAAg1q',
    piloto: '1WfjCxsNfEGAHiA7yJFcOmUAD8TI',
    teste: 'hnTraM5PAEO75MIrkb6bdWUAKPnd',
    desenvolvimento: '0CbUo_ARC06AfrxKvOqTyWUANaB8',
    backlog: 'U0gqHHynsESTw52ILjKidmUACP-w',
  }
};

// Token renovado automaticamente a cada 59min via fetchPlannerToken()
let plannerToken = '';

const AGENTES_CONFIG = [
  { id: "Rafael", displayName: "Rafael", fullName: "Rafael Zahner", avatar: "/rafael.png" },
  { id: "CAROLINE", displayName: "Carol", fullName: "CAROLINE ARAUJO DA COSTA", avatar: "/carol.png" },
  { id: "Rubens", displayName: "Rubão", fullName: "Rubens Rodrigues Junior", avatar: "/rubens.png" },
  { id: "Carnaval", displayName: "Carnaval", fullName: "Carnaval", avatar: "/carnaval.png" }
];

const MOCK_RESUMO = {
  "pendentes": 0, "novos": 0, "em_atendimento": 0, "parados": 0, "abertos_hoje": 0,
  "abertos_mes": 0, "fora_prazo": 0, "reabertos": 0,
  "media_primeira_resposta": "0 min", "media_primeira_resposta_raw": 0,
  "media_primeira_resposta_mes": "0 min", "media_primeira_resposta_mes_raw": 0,
  "media_primeira_resposta_dia": "0 min", "media_primeira_resposta_dia_raw": 0,
  "media_solucao": "0h 00m", "media_solucao_raw": 0,
  "media_solucao_mes": "0h 00m", "media_solucao_mes_raw": 0,
  "media_solucao_dia": "0h 00m", "media_solucao_dia_raw": 0,
  "vencidos": { "venceram": 0, "vencem_hoje": 0, "vencem_semana": 0 }
};

const Gauge: React.FC<{ value: number, max: number, color: string }> = ({ value, max, color }) => {
  const clampedValue = Math.min(value, max);
  const percentage = clampedValue / max;
  const rotation = -90 + (percentage * 180);
  const tickValues = [0, 1, 2, 3, 4, 5, 6].map(i => Math.round((i * max) / 6));
  const ticks = tickValues.map(v => {
    const angle = Math.PI - (v / max * Math.PI);
    const x1 = 50 + 34 * Math.cos(angle);
    const y1 = 50 - 34 * Math.sin(angle);
    const x2 = 50 + 41 * Math.cos(angle);
    const y2 = 50 - 41 * Math.sin(angle);
    const tx = 50 + 47 * Math.cos(angle);
    const ty = 50 - 47 * Math.sin(angle);
    return { v, x1, y1, x2, y2, tx, ty };
  });

  return (
    <div className="relative w-full max-w-[280px] aspect-[5/3] overflow-hidden">
      <svg viewBox="0 0 100 65" className="w-full h-full overflow-visible">
        <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="#f1f5f9" strokeWidth="11" strokeLinecap="round" />
        <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" strokeDasharray="119.4" strokeDashoffset={119.4 * (1 - percentage)} className="transition-all duration-1000 ease-out" style={{ opacity: 0.9 }} />
        {ticks.map(t => (
          <Fragment key={t.v}>
            <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={color} strokeWidth="1.2" strokeOpacity="0.4" />
            <text x={t.tx} y={t.ty} fontSize="4.8" fontWeight="900" textAnchor="middle" fill={color} fillOpacity="0.8" className="tabular-nums font-inter select-none">{t.v}</text>
          </Fragment>
        ))}
        <g transform={`rotate(${rotation} 50 50)`} className="transition-transform duration-1000 ease-out">
          <path d="M 48 50 L 52 50 L 50 14 Z" fill={color} style={{ filter: 'drop-shadow(0px 3px 3px rgba(0,0,0,0.15))' }} />
          <circle cx="50" cy="50" r="4.5" fill={color} />
          <circle cx="50" cy="50" r="1.8" fill="white" />
        </g>
      </svg>
    </div>
  );
};

const MetricCard: React.FC<{
  label: string, value: string | number, icon?: React.ReactNode, color: string, trend?: string,
  isUrgent?: boolean, gaugeValue?: number, gaugeMax?: number, className?: string, onClick?: () => void
}> = ({ label, value, icon, color, trend, isUrgent, gaugeValue, gaugeMax = 60, className = "", onClick }) => {
  const isTMA = gaugeValue !== undefined;
  return (
    <div 
      onClick={onClick}
      className={`relative border-2 rounded-3xl p-6 flex flex-col items-center justify-between text-center shadow-md transition-all duration-700 group overflow-hidden ${onClick ? 'cursor-pointer active:scale-95' : ''} ${isUrgent ? 'bg-red-50 border-red-500 animate-pulse' : 'bg-white border-slate-100 hover:border-[#009B3A]/30'} ${className}`}
    >
      <div style={{ color: isUrgent ? '#ef4444' : color }} className={`w-full flex justify-center transition-all duration-700`}>
        {isTMA ? <Gauge value={gaugeValue!} max={gaugeMax} color={isUrgent ? '#ef4444' : color} /> : <div className={`group-hover:scale-110 transition-transform mb-6 mt-4 ${isUrgent ? 'animate-bounce' : ''}`}>{icon}</div>}
      </div>
      <div className="flex flex-col items-center mt-auto w-full">
        <span className={`text-[12px] font-black uppercase tracking-[0.2em] mb-3 leading-tight px-4 ${isUrgent ? 'text-red-600' : 'text-slate-400'} select-none`}>{label}</span>
        <span className={`font-black tracking-tighter leading-none whitespace-nowrap px-2 ${String(value).length > 5 ? 'text-5xl' : String(value).length > 4 ? 'text-6xl' : 'text-7xl'}`} style={{ color: isUrgent ? '#ef4444' : color }}>{value}</span>
      </div>
      {trend && <span className={`mt-4 mb-2 text-[11px] font-bold px-4 py-1.5 rounded-full ${isUrgent ? 'bg-red-200 text-red-700' : 'text-[#009B3A] bg-[#009B3A]/5'}`}>{trend}</span>}
      {!trend && <div className="h-4" />}
    </div>
  );
};

const AgentShowcaseCard: React.FC<{ agent: any, rank: number }> = ({ agent, rank }) => {
  const config = AGENTES_CONFIG.find(c => c.id === agent.agente);
  const getPlayerBadge = (pos: number) => (
    <div className="flex items-center group/badge">
      <div className="relative">
        <div className="bg-slate-900 h-8 flex items-center px-4 transform -skew-x-12 border-l-2 border-[#FFDF00] shadow-md">
          <span className="text-white font-black text-xl italic tracking-tighter transform skew-x-12 select-none leading-none">
            <span className="text-[#FFDF00]">P</span>{pos}
          </span>
        </div>
        <div className="absolute -bottom-2.5 left-4 bg-[#FFDF00] text-[6px] px-1 font-bold text-slate-900 uppercase tracking-tighter transform -skew-x-12">READY</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* Card superior: foto + número */}
      <div className="relative bg-white border-2 border-slate-100 rounded-3xl p-6 flex flex-col justify-between shadow-xl overflow-hidden group transition-all duration-700" style={{ height: '82%', minHeight: 0 }}>
        <div className="absolute inset-0 pointer-events-none transition-all duration-700">
          {config?.avatar ? <img src={config.avatar} alt="" className="w-full h-full object-cover object-center" style={{ opacity: CONFIG.AVATAR_OPACITY }} /> : (
            <div className="absolute -top-12 -right-12 grayscale" style={{ opacity: CONFIG.AVATAR_FALLBACK_OPACITY }}><User size={280} className="text-slate-300" /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/20" />
        </div>


        <div className="z-10 flex items-center justify-between px-2">
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Encerrados Hoje</span>
          <div className="relative flex items-center justify-center">
            <div className="absolute w-14 h-14 rounded-full bg-white shadow-md" />
            <span className="relative text-[36px] font-black leading-none tracking-tighter text-slate-800 tabular-nums z-10">
              {agent.encerrados}
            </span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full flex h-2 overflow-hidden">
          <div className={`h-full transition-all duration-1000 ${rank === 1 ? 'w-[100%] bg-[#FFDF00]' : rank === 2 ? 'w-[80%] bg-[#FFDF00]/70' : rank === 3 ? 'w-[60%] bg-[#FFDF00]/40' : 'w-[40%] bg-[#FFDF00]/20'}`} />
        </div>
      </div>

      {/* Cards inferiores: chamados recentes */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0 pr-0.5">
        <div className="flex items-center gap-2 px-1 shrink-0">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Atividade Recente</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        {agent.recentTickets && agent.recentTickets.length > 0 ? (
          agent.recentTickets.slice(0, 1).map((t: any, idx: number) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col shadow-sm hover:shadow-md transition-all overflow-hidden shrink-0">
              <div className="flex items-center justify-between mb-1">
                <div className="bg-slate-900 text-[#FFDF00] text-[9px] font-black px-1.5 py-0.5 rounded italic transform -skew-x-12 shrink-0">#{t.id}</div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">CRIADO: {t.criado}</div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold text-slate-700 truncate leading-tight flex-1">{t.subject}</span>
                <div className="text-[10px] font-black text-[#009B3A] tabular-nums shrink-0">{t.hora}</div>
              </div>
              <div className="text-[8px] font-black text-[#FFDF00] uppercase mt-1 opacity-80">{t.status}</div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Aguardando Missão...</div>
        )}
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ label: string, value: number, icon: React.ReactNode, color: string, isUrgent?: boolean }> = ({ label, value, icon, color, isUrgent }) => (
  <div className={`bg-white border ${isUrgent ? 'border-red-400 shadow-red-100 shadow-xl' : 'border-slate-200'} rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden h-full transition-all duration-700`}>
    <div className="flex justify-between items-start">
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <div style={{ color }} className={`opacity-70 ${isUrgent ? 'animate-bounce' : ''}`}>{icon}</div>
    </div>
    <div className={`text-6xl font-black leading-none ${isUrgent ? 'animate-pulse' : ''}`} style={{ color }}>{value}</div>
    <div className={`absolute bottom-0 left-0 w-full h-2 ${isUrgent ? 'animate-pulse' : ''}`} style={{ backgroundColor: color }} />
  </div>
);

const Dashboard = () => {
  const [resumo, setResumo] = useState(MOCK_RESUMO);
  const [agentes, setAgentes] = useState(AGENTES_CONFIG.map(a => ({ agente: a.id, encerrados: 0, vencidos: 0, recentTickets: [] })));
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [currentView, setCurrentView] = useState(3);
  const [buckets, setBuckets] = useState<Array<{ id: string; name: string; items: any[] }>>([]);
  const [npsStats, setNpsStats] = useState({ pessimo: 0, ruim: 0, regular: 0, bom: 0, otimo: 0, total: 0, nps: 0, encerrados: 0 });
  const [npsRecentTickets, setNpsRecentTickets] = useState<Array<{ id: string; cliente: string; operador: string; nota: number; comentario?: string; data: string }>>([
    { id: '123456', cliente: 'Empresa Alpha Ltda', operador: 'Enzo', nota: 5, comentario: 'Atendimento excelente, resolveu meu problema rapidamente!', data: '05/03 14:32' },
  ]);
  const [carouselTimer, setCarouselTimer] = useState(20);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [activeNotification, setActiveNotification] = useState<{ operator: string, avatar?: string, score?: number, ticketId?: string } | null>(null);
  const [chamadosLiberacao, setChamadosLiberacao] = useState<any[]>([{ id: '99991', subject: 'Chamado Liberação de Versão (Provisório)' }]);
  const [chamadosEnotas, setChamadosEnotas] = useState<any[]>([{ id: '99992', subject: 'Chamado Enotas (Provisório)' }]);
  const [carolTicketsCount, setCarolTicketsCount] = useState(0);
  const [carnavalTicketsCount, setCarnavalTicketsCount] = useState(0);
  const [rafaelTicketsCount, setRafaelTicketsCount] = useState(0);
  const [rubensTicketsCount, setRubensTicketsCount] = useState(0);
  const [showForaPrazoModal, setShowForaPrazoModal] = useState(false);
  const lastProcessedTicketId = useRef<string | null>(null);
  const lastNpsCount = useRef<number | null>(null);
  const touchStartX = useRef(0);

  const triggerNotification = (operatorId: string, score?: number, ticketId?: string) => {
    const op = operatorId?.trim().toLowerCase();
    console.log(`[Notification Debug] Solicitado card para: "${operatorId}" (Score: ${score}, Ticket: ${ticketId})`);

    // Busca o agente de forma mais flexível (checa se o nome contém ou é contido)
    const config = AGENTES_CONFIG.find(c => {
      if (!op) return false;
      const cId = c.id.toLowerCase();
      const cDisplay = c.displayName.toLowerCase();
      const cFull = c.fullName?.toLowerCase();

      return op === cId || op === cDisplay || op === cFull ||
        (cFull && op.includes(cFull)) ||
        op.includes(cId) ||
        cId.includes(op);
    });

    let activeData = { operator: operatorId || 'Operador', avatar: '', score, ticketId };

    if (config) {
      console.log(`[Notification Debug] Sucesso! Agente encontrado: ${config.id}`);
      activeData = { operator: config.displayName, avatar: config.avatar, score, ticketId };
    } else {
      console.log(`[Notification Debug] Agente não listado nas configurações: "${operatorId}", usando nome original.`);
    }

    setActiveNotification(activeData);

    // Toca o som de notificação — ruim/péssimo (score <= 2) toca derrota, bom/ótimo (score >= 4) toca gol do brasil, neutro toca alerta
    try {
      const isBad = score !== undefined && score <= 2;
      const isGood = score !== undefined && score >= 4;
      const audioPath = window.location.origin + (isBad ? '/virou-passeio-gol-da-alemanha.mp3' : isGood ? '/goldobrasil.mp3' : '/alerta.mp3');
      console.log(`[Audio Debug] Tentando tocar áudio de: ${audioPath}`);
      const audio = new Audio(audioPath);
      audio.volume = 1.0;
      audio.play()
        .then(() => console.log('[Audio Debug] Áudio iniciado com sucesso!'))
        .catch(e => {
          console.error('[Audio Debug] Erro ao tocar áudio:', e);
          console.warn('[Audio Debug] DICA: Clique uma vez em qualquer lugar do dashboard para "desbloquear" o som.');
        });
    } catch (e) {
      console.error('[Audio Debug] Erro na criação do objeto Audio:', e);
    }

    // Remove a notificação após 10 segundos
    setTimeout(() => setActiveNotification(null), 10000);
  };

  const fetchJson = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  };

  const fetchPlannerToken = async (): Promise<boolean> => {
    try {
      const url = import.meta.env.DEV ? 'http://localhost:3001/get-token' : '/api/get-token';
      console.log('[Planner Token] Buscando novo token via servidor local...');

      const res = await fetch(url, { method: 'POST' });

      const text = await res.text();
      console.log('[Planner Token] Status:', res.status, '| Resposta:', text.slice(0, 200));

      if (!res.ok) {
        console.error('[Planner Token] Erro ao renovar token:', res.status);
        return false;
      }

      const data = JSON.parse(text);
      plannerToken = data.access_token;
      console.log('[Planner Token] Token renovado com sucesso! Expira em:', data.expires_in, 's');
      return true;
    } catch (e) {
      console.error('[Planner Token] Erro:', e);
      return false;
    }
  };

  const fetchPlannerData = async () => {
    // Sempre tenta renovar o token antes de buscar (garante token fresco)
    const tokenOk = await fetchPlannerToken();
    if (!tokenOk) {
      console.error('[Planner] Sem token válido, abortando busca.');
      return;
    }

    try {
      const headers = {
        'Authorization': `Bearer ${plannerToken}`,
        'Content-Type': 'application/json',
      };

      // Busca buckets, tasks e detalhes do plano (categorias) em paralelo
      const GRAPH_BASE = 'https://graph.microsoft.com';
      const [bucketsRes, tasksRes, detailsRes] = await Promise.all([
        fetch(`${GRAPH_BASE}/v1.0/planner/plans/${PLANNER_CONFIG.PLAN_ID}/buckets`, { headers }),
        fetch(`${GRAPH_BASE}/v1.0/planner/plans/${PLANNER_CONFIG.PLAN_ID}/tasks`, { headers }),
        fetch(`${GRAPH_BASE}/v1.0/planner/plans/${PLANNER_CONFIG.PLAN_ID}/details`, { headers }),
      ]);

      if (!bucketsRes.ok || !tasksRes.ok) {
        console.error('[Planner] Erro:', bucketsRes.status, tasksRes.status);
        return;
      }

      const bucketsData = await bucketsRes.json();
      const tasksData = await tasksRes.json();
      const detailsData = detailsRes.ok ? await detailsRes.json() : {};

      const apiBuckets: any[] = bucketsData.value || [];
      const tasks: any[] = tasksData.value || [];

      // Mapa de categoria -> nome (ex: { category3: 'Ajustes', category4: 'Integração', ... })
      const categoryMap: Record<string, string> = detailsData.categoryDescriptions || {};

      // Monta a lista de buckets dinamicamente — usa TODOS os buckets da API na ordem que chegam
      const ENTREGUE_ID = PLANNER_CONFIG.BUCKET_IDS.entregue;
      const bucketList = apiBuckets.map((apiBucket: any) => {
        const bucketId = apiBucket.id;
        const items = tasks
          .filter((task: any) => task.bucketId === bucketId)
          .map((task: any) => {
            const total = task.checklistItemCount || 0;
            const done = task.checkedItemsCount || 0;
            const progresso = total > 0 ? Math.round((done / total) * 100) : task.percentComplete || 0;

            const etiquetas: string[] = Object.entries(task.appliedCategories || {})
              .filter(([, active]) => active)
              .map(([cat]) => categoryMap[cat])
              .filter(Boolean) as string[];

            return {
              id: task.id?.slice(-6),
              titulo: task.title,
              etiquetas,
              createdDateTime: task.createdDateTime || null,
              dueDateTimeRaw: task.dueDateTime || null,
              responsavel: task.assignments && Object.keys(task.assignments).length > 0
                ? `${Object.keys(task.assignments).length} membro(s)`
                : null,
              data: task.dueDateTime
                ? new Date(task.dueDateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                : null,
              progresso: progresso > 0 ? progresso : undefined,
            };
          });

        // Bucket "Entregue": mais novo primeiro | Demais: prazo mais próximo primeiro
        const sortedItems = bucketId === ENTREGUE_ID
          ? [...items].sort((a, b) => {
              if (!a.createdDateTime) return 1;
              if (!b.createdDateTime) return -1;
              return new Date(b.createdDateTime).getTime() - new Date(a.createdDateTime).getTime();
            })
          : [...items].sort((a, b) => {
              if (!a.dueDateTimeRaw && !b.dueDateTimeRaw) return 0;
              if (!a.dueDateTimeRaw) return 1;
              if (!b.dueDateTimeRaw) return -1;
              return new Date(a.dueDateTimeRaw).getTime() - new Date(b.dueDateTimeRaw).getTime();
            });

        return {
          id: bucketId,
          name: apiBucket.name,
          items: sortedItems,
        };
      });

      setBuckets(prev => {
        const prevJson = JSON.stringify(prev.map(b => ({ id: b.id, items: b.items.map((i: any) => i.id) })));
        const nextJson = JSON.stringify(bucketList.map(b => ({ id: b.id, items: b.items.map((i: any) => i.id) })));
        if (prevJson === nextJson) return prev;
        console.log('[Planner] Mudança detectada, atualizando buckets.');
        return bucketList;
      });
    } catch (e) {
      console.error('[Planner] Erro:', e);
    }
  };

  const fetchCount = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return 0;
      const text = await res.text();
      const cleanText = text.replace(/"/g, '').trim();
      const num = parseInt(cleanText, 10);
      return isNaN(num) ? 0 : num;
    } catch (e) {
      return 0;
    }
  };

  // Função para buscar TODOS os registros com paginação (similar ao Python)
  const fetchAllPaginated = async (baseUrl: string, maxPages: number = 20) => {
    const allRecords: any[] = [];
    const top = 1000; // Máximo da API
    let skip = 0;

    for (let page = 0; page < maxPages; page++) {
      const url = `${baseUrl}&$top=${top}&$skip=${skip}`;
      const batch = await fetchJson(url);

      if (!Array.isArray(batch) || batch.length === 0) {
        break; // Acabou a lista
      }

      allRecords.push(...batch);
      // console.log(`[Paginação] Página ${page + 1}: ${batch.length} registros (Total: ${allRecords.length})`);

      if (batch.length < top) {
        break; // Última página
      }

      skip += top;
    }

    return allRecords;
  };

  // Função para calcular minutos úteis (horário comercial 9h-18h, dias úteis)
  const calcularMinutosUteis = (inicio: Date, fim: Date): number => {
    if (inicio >= fim) return 0;

    const HORA_INICIO = { hour: 9, minute: 0, second: 0 };
    const HORA_FIM = { hour: 18, minute: 0, second: 0 };

    let inicioAjustado = new Date(inicio);
    let fimAjustado = new Date(fim);

    // Ajusta início para dentro da janela 09-18
    const horaInicio = inicioAjustado.getHours();
    if (horaInicio < 9) {
      inicioAjustado.setHours(9, 0, 0, 0);
    } else if (horaInicio >= 18) {
      inicioAjustado.setDate(inicioAjustado.getDate() + 1);
      inicioAjustado.setHours(9, 0, 0, 0);
    }

    // Ajusta fim para dentro da janela 09-18
    const horaFim = fimAjustado.getHours();
    if (horaFim > 18 || (horaFim === 18 && fimAjustado.getMinutes() > 0)) {
      fimAjustado.setHours(18, 0, 0, 0);
    } else if (horaFim < 9) {
      fimAjustado.setDate(fimAjustado.getDate() - 1);
      fimAjustado.setHours(18, 0, 0, 0);
    }

    let minutosUteis = 0;
    let cursor = new Date(inicioAjustado);

    while (cursor < fimAjustado) {
      // Pula Sábado(6) e Domingo(0) - JavaScript usa 0=Domingo, 6=Sábado
      // Python usa 5=Sábado, 6=Domingo (weekday() >= 5)
      const diaSemana = cursor.getDay();
      if (diaSemana === 0 || diaSemana === 6) {
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(9, 0, 0, 0);
        continue;
      }

      const fimExpediente = new Date(cursor);
      fimExpediente.setHours(18, 0, 0, 0);

      const limiteAtual = fimAjustado < fimExpediente ? fimAjustado : fimExpediente;

      if (cursor > limiteAtual) {
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(9, 0, 0, 0);
        continue;
      }

      // Diferença em minutos
      minutosUteis += (limiteAtual.getTime() - cursor.getTime()) / 60000;
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(9, 0, 0, 0);
    }

    return minutosUteis;
  };


  const fetchNpsData = async () => {
    let countPessimo = 0;
    let countRuim = 0;
    let countRegular = 0;
    let countBom = 0;
    let countOtimo = 0;
    const now = new Date();

    try {
      const gRes = await fetchJson(GOOGLE_SHEET_API);
      if (gRes && gRes.data && Array.isArray(gRes.data)) {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const filteredData = gRes.data.filter((item: any) => {
          if (!item.Data) return false;
          const itemDate = new Date(item.Data);
          return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        });

        filteredData.forEach((item: any) => {
          const nota = Number(item.Nota);
          if (nota === 1) countPessimo++;
          else if (nota === 2) countRuim++;
          else if (nota === 3) countRegular++;
          else if (nota === 4) countBom++;
          else if (nota === 5) countOtimo++;
        });

        if (filteredData.length > 0) {
          const latestEntry = filteredData[filteredData.length - 1];
          const possibleIdKeys = Object.keys(latestEntry).filter(k => /(ticket|chamado|numero|id)/i.test(k));
          const exactIdKey = possibleIdKeys.length > 0 ? possibleIdKeys[0] : Object.keys(latestEntry)[0];
          const latestTicketId = String(
            latestEntry.Ticket || latestEntry.TicketID || latestEntry.ID || latestEntry.Numero ||
            latestEntry["Número do Chamado"] || latestEntry["numero"] || (exactIdKey ? latestEntry[exactIdKey] : '')
          );
          const operatorName = String(latestEntry.Operador || latestEntry.Atendente || latestEntry.Agente || latestEntry.operador || '');
          const score = latestEntry.Nota || latestEntry.nota ? Number(latestEntry.Nota || latestEntry.nota) : undefined;

          console.log('[NPS Debug] Dados recebidos:', { latestTicketId, operatorName, score, total: filteredData.length });

          const isNewTicket = latestTicketId !== lastProcessedTicketId.current;
          const countIncreased = lastNpsCount.current !== null && filteredData.length > lastNpsCount.current;

          if (lastProcessedTicketId.current === null) {
            // Primeiro carregamento
            lastProcessedTicketId.current = latestTicketId;
            lastNpsCount.current = filteredData.length;

            // Se for novo (menos de 5 min)
            const itemDate = new Date(latestEntry.Data);
            if ((now.getTime() - itemDate.getTime()) / 60000 < 5 && operatorName) {
              console.log('[NPS Debug] Detectado NPS fresquinho no carregamento inicial.');
              triggerNotification(operatorName, score, latestTicketId);
            }
          } else if (isNewTicket || countIncreased) {
            if (operatorName && operatorName.trim() !== '') {
              console.log(`[NPS Debug] NOVO NPS DETECTADO!`);
              triggerNotification(operatorName, score, latestTicketId);
              lastProcessedTicketId.current = latestTicketId;
            }
          }
        }

        // Always update count to track total rows, even if incomplete
        lastNpsCount.current = filteredData.length;

        const totalSurveys = countPessimo + countRuim + countRegular + countBom + countOtimo;
        const promoters = countOtimo;
        const detractors = countPessimo + countRuim + countRegular;
        const npsScore = totalSurveys > 0 ? ((promoters - detractors) / totalSurveys) * 100 : 0;

        setNpsStats(prev => ({
          ...prev,
          pessimo: countPessimo,
          ruim: countRuim,
          regular: countRegular,
          bom: countBom,
          otimo: countOtimo,
          total: totalSurveys,
          nps: Math.round(npsScore)
        }));

        // Popula lista de últimos chamados respondidos (mais recente primeiro) sem duplicar chamados
        const seenNpsTickets = new Set();
        const recentTickets = [...filteredData]
          .reverse()
          .map((item: any) => {
            const possibleIdKeys = Object.keys(item).filter(k => /(ticket|chamado|numero|id)/i.test(k));
            const exactIdKey = possibleIdKeys.length > 0 ? possibleIdKeys[0] : Object.keys(item)[0];
            const ticketId = String(
              item.Ticket || item.TicketID || item.ID || item.Numero ||
              item['Número do Chamado'] || item['numero'] || (exactIdKey ? item[exactIdKey] : '')
            );
            const operador = String(
              item.Operador || item.Atendente || item.Agente || item.operador || ''
            );
            const cliente = String(
              item.Cliente || item.Requester || item.Solicitante || item.cliente ||
              item['Nome do Cliente'] || item.nome || ''
            );
            const comentario = String(
              item.Comentario || item.Comentário || item.Observacao ||
              item.Observação || item.Feedback || item.comentario || item.feedback || ''
            );
            const nota = Number(item.Nota || item.nota || 0);

            // Formata data: DD/MM HH:mm
            let dataFormatada = '';
            if (item.Data) {
              try {
                const d = new Date(item.Data);
                const pad = (n: number) => String(n).padStart(2, '0');
                dataFormatada = `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
              } catch {
                dataFormatada = String(item.Data);
              }
            }

            return {
              id: ticketId,
              cliente,
              operador,
              nota,
              comentario: comentario || undefined,
              data: dataFormatada,
            };
          })
          .filter(t => {
            if (t.nota >= 1 && t.nota <= 5 && !seenNpsTickets.has(t.id)) {
              seenNpsTickets.add(t.id);
              return true;
            }
            return false;
          })
          .slice(0, 20);

        setNpsRecentTickets(recentTickets);
      }
    } catch (e) {
      console.error('Erro Google API', e);
    }
  };

  // ─── Helper: Formatar tempo em minutos ───
  const formatarTempo = (minutos: number): string => {
    if (minutos < 60) return `${Math.round(minutos)}min`;
    const h = Math.floor(minutos / 60);
    const m = Math.round(minutos % 60);
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  // ─── Helper: Buscar todos os tickets com paginação ───
  const buscarTicketsPaginado = async (baseUrl: string): Promise<any[]> => {
    const PAGE_SIZE = 100;
    let todos: any[] = [];
    let skip = 0;

    while (true) {
      const url = `${baseUrl}&$top=${PAGE_SIZE}&$skip=${skip}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Erro na API (HTTP ${res.status}): ${await res.text()}`);
      }

      const pagina = await res.json();

      if (!Array.isArray(pagina) || pagina.length === 0) break;

      todos = todos.concat(pagina);

      if (pagina.length < PAGE_SIZE) break;
      skip += PAGE_SIZE;
    }

    return todos;
  };

  // ─── Helper: Calcular TMS usando lógica correta ───
  const calcularTMS = (tickets: any[]): { media: number; total: number } => {
    if (tickets.length === 0) return { media: 0, total: 0 };

    const tempos = tickets.map((t: any) => {
      const life = t.lifeTimeWorkingTime ?? 0;
      const stopped = t.stoppedTimeWorkingTime ?? 0;
      return Math.max(0, life - stopped);
    });

    const soma = tempos.reduce((acc, v) => acc + v, 0);
    const media = soma / tempos.length;

    return { media, total: tempos.length };
  };

  const fetchData = async () => {
    try {
      const now = new Date();
      const padL = (n: number) => String(n).padStart(2, "0");

      const year = now.getFullYear();
      const month = padL(now.getMonth() + 1);
      const day = padL(now.getDate());

      const todayStartStr = `${year}-${month}-${day}T03:00:00.000Z`;
      const dEnd = new Date(now);
      dEnd.setDate(dEnd.getDate() + 1);
      const todayEndStr = `${dEnd.getFullYear()}-${padL(dEnd.getMonth() + 1)}-${padL(dEnd.getDate())}T02:59:59.00z`;
      const monthStartStr = `${year}-${month}-01T03:00:00.000Z`;

      // Calcular o primeiro dia do próximo mês (fim do mês atual)
      const nextMonthObj = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonthYear = nextMonthObj.getFullYear();
      const nextMonthNum = padL(nextMonthObj.getMonth() + 1);
      const monthEndStr = `${nextMonthYear}-${nextMonthNum}-01T03:00:00.000Z`;

      const isoNow = now.toISOString();


      const agentResultsPromises = AGENTES_CONFIG.map(async (ag) => {
        const filterEncerrados = encodeURIComponent(`resolvedIn ge ${todayStartStr} and contains(owner/businessName, '${ag.id}')`);
        console.log(`[Agente ${ag.id}] Filtro: resolvedIn ge ${todayStartStr} and contains(owner/businessName, '${ag.id}')`);

        // Busca tickets ao invés de usar /count
        const ticketsBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,resolvedIn,status,createdDate&$filter=${filterEncerrados}&$orderby=resolvedIn desc`;
        console.log(`[Agente ${ag.id}] URL Base: ${ticketsBaseUrl}`);

        const ticketsData = await fetchAllPaginated(ticketsBaseUrl);
        const encerradosCount = ticketsData.length;
        const recentTicketsData = ticketsData.slice(0, 3);

        console.log(`[Agente ${ag.id}] Resultado: ${encerradosCount} tickets`);

        return {
          agente: ag.id,
          encerrados: encerradosCount,
          vencidos: 0,
          recentTickets: Array.isArray(recentTicketsData) ? recentTicketsData.map((t: any) => {
            const dtCri = new Date(t.createdDate);
            return {
              id: t.id,
              subject: t.subject,
              status: t.status,
              criado: `${padL(dtCri.getDate())}/${padL(dtCri.getMonth() + 1)}`,
              hora: t.resolvedIn ? new Date(new Date(t.resolvedIn).getTime() - (3 * 3600000)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'
            };
          }) : []
        };
      });

      const nextAgentes = await Promise.all(agentResultsPromises);

      // --- LOGICA VENCIDOS GLOBAL (Filtro exato solicitado pelo usuário) ---
      // Lógica: slaSolutionDate ne null E data menor que agora E (status New OU InAttendance OU Stopped)
      const filterVencidosUser = encodeURIComponent(`slaSolutionDate ne null and slaSolutionDate lt ${isoNow} and (baseStatus eq 'New' or baseStatus eq 'InAttendance' or baseStatus eq 'Stopped')`);
      const vencidosUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,baseStatus,status,slaSolutionDate,lastUpdate&$filter=${filterVencidosUser}&$top=100&$skip=0`;
      const vencidosData = await fetchJson(vencidosUrl);
      const countVencidosGlobal = Array.isArray(vencidosData) ? vencidosData.length : 0;

      // --- LOGICA NOVOS ---
      const novosBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,status,baseStatus,createdDate,owner&$filter=${encodeURIComponent("baseStatus eq 'New'")}&$orderby=createdDate asc`;
      const novosData = await fetchAllPaginated(novosBaseUrl);
      const countNew = novosData.length;


      // --- LOGICA PARADOS ---
      const paradosBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,status,baseStatus,justification,createdDate&$filter=${encodeURIComponent("baseStatus eq 'Stopped'")}`;
      const paradosData = await fetchAllPaginated(paradosBaseUrl);
      const countParados = paradosData.length;

      // --- LOGICA PENDENTES ---
      const pendentesBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,status,baseStatus,owner,createdDate&$filter=${encodeURIComponent("(baseStatus eq 'New' or baseStatus eq 'InAttendance' or baseStatus eq 'Stopped')")}&$orderby=createdDate desc`;
      const pendentesData = await fetchAllPaginated(pendentesBaseUrl);
      const countPendentes = pendentesData.length;

      // --- LOGICA EM ATENDIMENTO ---
      const emAtendimentoBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,status,baseStatus,owner,createdDate&$filter=${encodeURIComponent("baseStatus eq 'InAttendance'")}`;
      const emAtendimentoData = await fetchAllPaginated(emAtendimentoBaseUrl);
      const countInAtt = emAtendimentoData.length;


      // --- LOGICA ABERTOS HOJE (COM PAGINAÇÃO COMPLETA) ---
      // Busca TODOS os chamados criados hoje (incluindo cancelados)
      const filterHoje = encodeURIComponent(`createdDate ge ${todayStartStr} and createdDate lt ${todayEndStr}`);
      const hojeBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,createdDate,baseStatus,status,owner&$filter=${filterHoje}&$orderby=createdDate desc`;
      const chamadosHojeData = await fetchAllPaginated(hojeBaseUrl);
      const countHoje = chamadosHojeData.length;


      // --- LOGICA CHAMADOS DO MÊS (COM PAGINAÇÃO COMPLETA) ---
      const filterMes = encodeURIComponent(`createdDate ge ${monthStartStr} and createdDate lt ${monthEndStr}`);
      const mesBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,createdDate,status,owner&$filter=${filterMes}&$orderby=createdDate desc`;
      const chamadosMesData = await fetchAllPaginated(mesBaseUrl);
      const countMes = chamadosMesData.length;

      // --- LOGICA FORA DO PRAZO (COM PAGINAÇÃO COMPLETA) ---
      // Busca tickets resolvidos no mês que foram resolvidos após o prazo SLA
      const filterForaPrazo = encodeURIComponent(`(baseStatus eq 'Resolved' or baseStatus eq 'Closed') and lastUpdate ge ${monthStartStr}`);
      const foraPrazoBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,slaSolutionDate,resolvedIn,owner&$filter=${filterForaPrazo}&$orderby=resolvedIn desc`;
      const foraPrazoData = await fetchAllPaginated(foraPrazoBaseUrl);

      // Filtra apenas os que foram resolvidos NESTE mês e após o prazo
      const ticketsForaPrazo = foraPrazoData.filter((ticket: any) => {
        const prazo = ticket.slaSolutionDate;
        const resolucao = ticket.resolvedIn;

        if (!resolucao || !prazo) return false;

        // Garante que foi resolvido NESTE mês
        if (resolucao < monthStartStr || resolucao >= monthEndStr) return false;

        // Verifica se resolveu após o prazo
        return resolucao > prazo;
      });

      const countFora = ticketsForaPrazo.length;

      // --- LOGICA TMA 1ª RESPOSTA (createdDate -> slaRealResponseDate) ---
      // O filtro por origin enum no OData do Movidesk é inconsistente, então aplicamos
      // o recorte WebApi + não cancelado no cliente após buscar os tickets do período.
      // Esse recorte é usado apenas para Mês/Geral, já que o indicador de Hoje no sistema
      // considera um conjunto mais amplo de tickets.
      const isTicketTma1Valido = (t: any) => t.origin === 9 && t.baseStatus !== 'Canceled';

      // DIA: filtra por createdDate (tickets criados hoje)
      const FILTER_TMA1_DIA = `createdDate ge ${todayStartStr} and createdDate le ${todayEndStr}`;
      const tma1DiaUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=${encodeURIComponent("id,origin,baseStatus,createdDate,slaRealResponseDate")}&$filter=${encodeURIComponent(FILTER_TMA1_DIA)}`;
      const tma1DiaDataRaw = await buscarTicketsPaginado(tma1DiaUrl);

      // MÊS: filtra por createdDate (tickets criados no mês vigente que foram respondidos)
      const FILTER_TMA1_MES = `createdDate ge ${monthStartStr} and createdDate lt ${monthEndStr}`;
      const tma1MesUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=${encodeURIComponent("id,origin,baseStatus,createdDate,slaRealResponseDate")}&$filter=${encodeURIComponent(FILTER_TMA1_MES)}`;
      const tma1MesDataRaw = await buscarTicketsPaginado(tma1MesUrl);

      // Filtrar apenas tickets com slaRealResponseDate (que foram respondidos)
      // MÊS: verificar que foram criados E respondidos no mês de abril
      const tma1MesData = tma1MesDataRaw.filter((t: any) => {
        if (!isTicketTma1Valido(t)) return false;
        if (!t.slaRealResponseDate) return false;
        const respDate = new Date(t.slaRealResponseDate);
        const createdDate = new Date(t.createdDate);
        const monthStart = new Date(monthStartStr);
        const monthEnd = new Date(monthEndStr);
        // Ambos devem estar no intervalo do mês de abril
        return createdDate >= monthStart && createdDate < monthEnd &&
               respDate >= monthStart && respDate < monthEnd;
      });

      const tma1DiaData = tma1DiaDataRaw.filter((t: any) => t.slaRealResponseDate);

      const calcularTempoPrimeiraResposta = (tickets: any[], usarHorasUteis: boolean): number[] => {
        const tempos: number[] = [];

        tickets.forEach((t: any) => {
          // A API do Movidesk está retornando esses campos sem offset explícito.
          // Para o TMA de 1ª resposta, aplicar -3h mantém a métrica alinhada ao sistema.
          const dtCriacao = new Date(new Date(t.createdDate).getTime() - (3 * 3600000));
          const dtResposta = new Date(new Date(t.slaRealResponseDate).getTime() - (3 * 3600000));
          const minutos = usarHorasUteis
            ? calcularMinutosUteis(dtCriacao, dtResposta)
            : (dtResposta.getTime() - dtCriacao.getTime()) / (1000 * 60);

          if (minutos >= 0) tempos.push(minutos);
        });

        return tempos;
      };

      // Calcular TMA1 para o Mês usando horas úteis para alinhar com o indicador do Movidesk
      const temposMes = calcularTempoPrimeiraResposta(tma1MesData, true);

      // Calcular TMA1 para o Dia (usando horas úteis)
      const temposDia = calcularTempoPrimeiraResposta(tma1DiaData, true);

      // Calcular TMA1 Geral (últimos 30 dias)
      const dataInicio30Dias = new Date(now);
      dataInicio30Dias.setDate(dataInicio30Dias.getDate() - 30);
      const inicio30DiasStr = `${dataInicio30Dias.getFullYear()}-${padL(dataInicio30Dias.getMonth() + 1)}-${padL(dataInicio30Dias.getDate())}T03:00:00.000Z`;
      const FILTER_TMA1_GERAL = `createdDate ge ${inicio30DiasStr}`;
      const tma1GeralUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=${encodeURIComponent("id,origin,baseStatus,createdDate,slaRealResponseDate")}&$filter=${encodeURIComponent(FILTER_TMA1_GERAL)}`;
      const tma1GeralDataRaw = await buscarTicketsPaginado(tma1GeralUrl);
      const tma1GeralData = tma1GeralDataRaw.filter((t: any) => isTicketTma1Valido(t) && t.slaRealResponseDate);

      const temposGeral = calcularTempoPrimeiraResposta(tma1GeralData, true);


      const tma1Res = temposGeral.length > 0 ? Math.round(temposGeral.reduce((a, b) => a + b, 0) / temposGeral.length) : 0;
      const tma1ResMes = temposMes.length > 0 ? Math.round(temposMes.reduce((a, b) => a + b, 0) / temposMes.length) : 0;
      const tma1ResDia = temposDia.length > 0 ? Math.round(temposDia.reduce((a, b) => a + b, 0) / temposDia.length) : 0;


      // --- LOGICA TMA SOLUÇÃO (NOVA - lifeTimeWorkingTime - stoppedTimeWorkingTime) ---
      // Busca tickets resolvidos no mês e dia usando a API correta
      const SELECT = "id,createdDate,resolvedIn,lifeTimeWorkingTime,stoppedTimeWorkingTime";

      // TMS MÊS
      const FILTER_MES = `resolvedIn ge ${monthStartStr} and resolvedIn le ${monthEndStr}`;
      const tmaSolMesUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=${encodeURIComponent(SELECT)}&$filter=${encodeURIComponent(FILTER_MES)}`;
      const tmaSolMesData = await buscarTicketsPaginado(tmaSolMesUrl);
      const tmsMesResult = calcularTMS(tmaSolMesData);
      const tmaSolMinutosMes = tmsMesResult.media;
      const tmaSolMes = Math.round(tmaSolMinutosMes * 10) / 10;

      // TMS DIA
      const FILTER_DIA = `resolvedIn ge ${todayStartStr} and resolvedIn le ${todayEndStr}`;
      const tmaSolDiaUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=${encodeURIComponent(SELECT)}&$filter=${encodeURIComponent(FILTER_DIA)}`;
      const tmaSolDiaData = await buscarTicketsPaginado(tmaSolDiaUrl);
      const tmsDiaResult = calcularTMS(tmaSolDiaData);
      const tmaSolMinutosDia = tmsDiaResult.media;
      const tmaSolDia = Math.round(tmaSolMinutosDia * 10) / 10;

      // TMS GERAL (últimos 30 dias aproximadamente)
      const dataInicio30DiasTms = new Date(now);
      dataInicio30DiasTms.setDate(dataInicio30DiasTms.getDate() - 30);
      const inicio30DiasStrTms = `${dataInicio30DiasTms.getFullYear()}-${padL(dataInicio30DiasTms.getMonth() + 1)}-${padL(dataInicio30DiasTms.getDate())}T03:00:00.000Z`;
      const FILTER_GERAL = `resolvedIn ge ${inicio30DiasStrTms}`;
      const tmaSolGeralUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=${encodeURIComponent(SELECT)}&$filter=${encodeURIComponent(FILTER_GERAL)}`;
      const tmaSolGeralData = await buscarTicketsPaginado(tmaSolGeralUrl);
      const tmsGeralResult = calcularTMS(tmaSolGeralData);
      const tmaSolMinutos = tmsGeralResult.media;
      const tmaSol = Math.round(tmaSolMinutos * 10) / 10;

      // --- LOGICA CHAMADOS DE LIBERAÇÃO DE VERSÃO ---
      const filterLiberacao = encodeURIComponent("justification eq 'Liberação de versão'");
      const liberacaoUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id&$filter=${filterLiberacao}`;
      const liberacaoData = await fetchJson(liberacaoUrl);
      if (Array.isArray(liberacaoData)) {
        setChamadosLiberacao(liberacaoData);
      }

      // --- LOGICA CHAMADOS DA CAROL (NIVEL 1) ---
      const filterCarol = encodeURIComponent("owner/businessName eq 'CAROLINE ARAUJO DA COSTA' and status ne 'Resolvido' and status ne 'Cancelado' and status ne 'Fechado'");
      const carolUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id&$filter=${filterCarol}`;
      const carolData = await fetchJson(carolUrl);
      if (Array.isArray(carolData)) {
        setCarolTicketsCount(carolData.length);
      }

      // --- LOGICA CHAMADOS DO CARNAVAL (NIVEL 1) ---
      const filterCarnaval = encodeURIComponent("owner/businessName eq 'Gabriel de Oliveira Carnaval' and status ne 'Resolvido' and status ne 'Cancelado' and status ne 'Fechado'");
      const carnavalUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id&$filter=${filterCarnaval}`;
      const carnavalData = await fetchJson(carnavalUrl);
      if (Array.isArray(carnavalData)) {
        setCarnavalTicketsCount(carnavalData.length);
      }

      // --- LOGICA CHAMADOS DO RAFAEL (NIVEL 2) ---
      const filterRafael = encodeURIComponent("owner/businessName eq 'rafael Zahner' and status ne 'Resolvido' and status ne 'Cancelado' and status ne 'Fechado'");
      const rafaelUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id&$filter=${filterRafael}`;
      const rafaelData = await fetchJson(rafaelUrl);
      if (Array.isArray(rafaelData)) {
        setRafaelTicketsCount(rafaelData.length);
      }

      // --- LOGICA CHAMADOS DO RUBENS (NIVEL 3) ---
      const filterRubens = encodeURIComponent("justification eq 'Equipe de desenvolvimento' and status ne 'Resolvido' and status ne 'Cancelado' and status ne 'Fechado'");
      const rubensUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id&$filter=${filterRubens}`;
      const rubensData = await fetchJson(rubensUrl);
      if (Array.isArray(rubensData)) {
        setRubensTicketsCount(rubensData.length);
      }

      // --- LOGICA CHAMADOS DO ENOTAS ---
      const filterEnotas = encodeURIComponent("status eq 'Chamado Enotas' and justification eq 'Aguardando Enotas'");
      const enotasUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id&$filter=${filterEnotas}`;
      const enotasData = await fetchJson(enotasUrl);
      if (Array.isArray(enotasData)) {
        setChamadosEnotas(enotasData);
      }

      // --- LOGICA NPS / SATISFAÇÃO ---
      await fetchNpsData();
      setNpsStats(prev => ({ ...prev, encerrados: countMes }));

      setResumo(prev => ({
        ...prev,
        pendentes: countPendentes,
        novos: countNew,
        em_atendimento: countInAtt,
        parados: countParados,
        abertos_hoje: countHoje,
        abertos_mes: countMes,
        fora_prazo: countFora,
        media_primeira_resposta: `${tma1Res} min`,
        media_primeira_resposta_raw: tma1Res,
        media_primeira_resposta_mes: `${tma1ResMes} min`,
        media_primeira_resposta_mes_raw: tma1ResMes,
        media_primeira_resposta_dia: `${tma1ResDia} min`,
        media_primeira_resposta_dia_raw: tma1ResDia,
        media_solucao: `${Math.round(tmaSol)} min`,
        media_solucao_raw: tmaSol,
        media_solucao_mes: `${Math.round(tmaSolMes)} min`,
        media_solucao_mes_raw: tmaSolMes,
        media_solucao_dia: `${Math.round(tmaSolDia)} min`,
        media_solucao_dia_raw: tmaSolDia,
        vencidos: { venceram: countVencidosGlobal, vencem_hoje: 0, vencem_semana: 0 }
      }));

      setAgentes(nextAgentes);
      setLastUpdate(new Date());
      setIsOffline(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setIsOffline(true);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselTimer((prev) => {
        if (prev <= 1 && !isTimerPaused) {
          setCurrentView((v) => (v + 1) % 6);
          return 20;
        }
        if (isTimerPaused) return prev; // Mantém o timer parado
        return prev - 1;
      });
    }, 1000);

    fetchData();
    fetchPlannerData();
    const rt = setInterval(fetchData, CONFIG.REFRESH_MS);
    const npsRt = setInterval(fetchNpsData, CONFIG.NPS_REFRESH_MS);
    const plannerRt = setInterval(fetchPlannerData, PLANNER_CONFIG.TASKS_REFRESH_MS);
    // Renova o token a cada 59 minutos (token expira em 60min)
    const tokenRt = setInterval(async () => {
      await fetchPlannerToken();
    }, PLANNER_CONFIG.TOKEN_REFRESH_MS);

    // Listener para "desbloquear" o áudio no primeiro clique (regra de segurança dos navegadores)
    const unlockAudio = () => {
      console.log('[Audio Debug] Interação detectada: Áudio desbloqueado!');
      window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const numKey = parseInt(e.key);

      if (key === 'A') {
        console.log('[NPS Debug] Busca manual acionada (Tecla A)');
        fetchNpsData();
      } else if (!isNaN(numKey) && numKey >= 1 && numKey <= 5) {
        // Dispara uma notificação de teste para o Enzo com a nota pressionada
        triggerNotification('Enzo', numKey, '123456');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      clearInterval(rt);
      clearInterval(npsRt);
      clearInterval(plannerRt);
      clearInterval(tokenRt);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTimerPaused]);

  // Cronômetro sempre rodando
  useEffect(() => {
    const ct = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(ct);
  }, []);

  // Recarrega a página inteira a cada 60 segundos
  useEffect(() => {
    const rt = setTimeout(() => window.location.reload(), 300000);
    return () => clearTimeout(rt);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setDragOffset(e.touches[0].clientX - touchStartX.current);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const threshold = 30; // Apenas 30px — pequeno deslize ou toque já muda a tela
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset < 0) setCurrentView((v) => (v + 1) % 6);
      else setCurrentView((v) => (v - 1 + 6) % 6);
    }
    setDragOffset(0);
    setCarouselTimer(20);
  };

  const sortedAgentes = useMemo(() => [...agentes].sort((a, b) => b.encerrados - a.encerrados), [agentes]);
  const diffSeconds = Math.floor((currentTime.getTime() - lastUpdate.getTime()) / 1000);
  
  const playBellSound = () => {
    try {
      const audio = new Audio('https://www.myinstants.com/media/sounds/ding-sound-effect_2.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('[Audio Debug] Erro ao tocar sino:', e));
    } catch (err) {
      console.log('[Audio Debug] Erro ao carregar áudio:', err);
    }
  };

  return (
    <div
      className="flex flex-col h-screen w-screen p-4 space-y-4 overflow-hidden text-slate-900 relative touch-pan-y"
      style={{ backgroundColor: '#fff' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'url(/bandeira.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', opacity: 0.13 }} />
      <header className="flex justify-between items-center shrink-0 h-20">
        <div className="flex items-center gap-6">
          <img src={LOGO_URL} alt="Ultra" className="h-16 w-auto" />
          <div className="h-12 w-px bg-slate-200" />
          <div>
            <h1 className="text-2xl font-black uppercase leading-none">
              {currentView === 0 ? 'Visão Geral do Suporte' : currentView === 1 ? 'Produtividade por Operador' : currentView === 2 ? 'Satisfação do Cliente (NPS)' : currentView === 3 ? 'Níveis de Atendimento' : currentView === 4 ? 'Entregas' : 'Cronograma'}
            </h1>
            <div className="flex items-center gap-4 mt-1.5 text-sm font-bold text-slate-400">
              <span className={isOffline ? 'text-red-500 font-black' : 'text-[#009B3A]'}>{isOffline ? 'DESCONECTADO' : 'CONECTADO AO MOVIDESK'}</span>
              <span>|</span>
              <span>Atualizado há {diffSeconds}s</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div
            onClick={() => { setCurrentView((v) => (v + 1) % 6); setCarouselTimer(20); }}
            className="inline-flex items-center justify-between gap-4 px-5 py-3 min-w-[230px] bg-[#F0FFF4] rounded-full shadow-[0_8px_18px_rgba(0,0,0,0.08)] select-none cursor-pointer active:scale-95 transition-transform"
            title="Clique para trocar de tela"
          >
            <div className="flex flex-col leading-none">
              <span className="text-[10px] tracking-[0.12em] font-bold text-[#8AA2AD] mb-1.5 font-sans whitespace-nowrap">PRÓXIMA TELA</span>
              <div className="text-[26px] font-black text-[#009B3A] font-sans -mt-0.5">
                <span className="tabular-nums">{carouselTimer}</span><span className="text-xl">s</span>
              </div>
            </div>
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(0,155,58,0.18)" strokeWidth="5.5" />
                <circle
                  cx="22" cy="22" r="18"
                  fill="none"
                  stroke="#009B3A"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeDasharray={113.097}
                  strokeDashoffset={113.097 * (1 - carouselTimer / 20)}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
            </div>
          </div>
          <div
            className="text-6xl font-black text-[#009B3A] tabular-nums tracking-tighter cursor-pointer hover:opacity-70 transition-opacity"
            onClick={(e: any) => {
              e.stopPropagation();
              setIsTimerPaused(!isTimerPaused);
            }}
            title={isTimerPaused ? "Clique para retomar" : "Clique para pausar"}
          >
            {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {isTimerPaused && <span className="text-3xl ml-2">⏸</span>}
          </div>
        </div>
      </header>

      {/* Container Deslizante */}
      <div className="flex-1 min-h-0 relative overflow-hidden rounded-3xl">
        <div
          className="flex h-full w-full"
          style={{
            transform: `translateX(calc(-${currentView * 100}% + ${dragOffset}px))`,
            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          {/* VIEW 0: Visão Geral */}
          <div className="min-w-full h-full p-1 flex flex-col space-y-6 overflow-y-auto">
            <div className="grid grid-cols-5 gap-4 shrink-0 h-44">
              <KpiCard label="Pendentes" value={resumo.pendentes} icon={<AlertCircle size={40} />} color="#003087" />
              <KpiCard label="Novos" value={resumo.novos} icon={<PlusCircle size={40} />} color="#009B3A" />
              <KpiCard label="Em Atendimento" value={resumo.em_atendimento} icon={<Timer size={40} />} color="#003087" />
              <KpiCard label="Parados" value={resumo.parados} icon={<PauseCircle size={40} />} color="#FFDF00" />
              <KpiCard label="Vencidos" value={resumo.vencidos.venceram} icon={<XCircle size={40} />} color="#ef4444" isUrgent={resumo.vencidos.venceram > 0} />
            </div>
            <div className="flex-1 min-h-0 grid grid-cols-5 gap-6">
              <MetricCard label="Chamados no Mês" value={resumo.abertos_mes} icon={<CalendarDays size={48} />} color="#003087" onClick={playBellSound} />
              <MetricCard label="Fora do Prazo" value={resumo.fora_prazo} icon={<History size={48} />} color="#ef4444" onClick={() => { setShowForaPrazoModal(true); setTimeout(() => setShowForaPrazoModal(false), 10000); }} />
              <MetricCard label="Abertos Hoje" value={resumo.abertos_hoje} icon={<TrendingUp size={48} />} color="#003087" />
              <div className="flex flex-col gap-6">
                <MetricCard className="flex-1" label="TMA 1ª Resp Hoje" value={resumo.media_primeira_resposta_dia} color="#009B3A" gaugeValue={resumo.media_primeira_resposta_dia_raw} gaugeMax={60} isUrgent={resumo.media_primeira_resposta_dia_raw > 60} />
                <MetricCard className="flex-1" label="TMA 1ª Resp Mês" value={resumo.media_primeira_resposta_mes} color="#009B3A" gaugeValue={resumo.media_primeira_resposta_mes_raw} gaugeMax={60} isUrgent={resumo.media_primeira_resposta_mes_raw > 60} />
              </div>
              <div className="flex flex-col gap-6">
                <MetricCard className="flex-1" label="TMA Solução Hoje" value={resumo.media_solucao_dia} color="#009B3A" gaugeValue={resumo.media_solucao_dia_raw} gaugeMax={240} isUrgent={resumo.media_solucao_dia_raw > 120} />
                <MetricCard className="flex-1" label="TMA Solução Mês" value={resumo.media_solucao_mes} color="#009B3A" gaugeValue={resumo.media_solucao_mes_raw} gaugeMax={240} isUrgent={resumo.media_solucao_mes_raw > 120} />
              </div>
            </div>
          </div>

          {/* VIEW 1: Agentes */}
          <div className="min-w-full h-full p-1 overflow-hidden flex items-stretch gap-6">
            {sortedAgentes.slice(0, 5).map((ag, idx) => (
              <div key={idx} className="flex-1 min-w-0 h-full">
                <AgentShowcaseCard agent={ag} rank={idx + 1} />
              </div>
            ))}
          </div>

          {/* VIEW 2: NPS */}
          <div className="min-w-full h-full p-1 overflow-hidden flex flex-row gap-4">

            {/* Coluna Esquerda */}
            <div className="flex flex-col gap-4 flex-1 min-w-0">
              {/* Cards de Rating */}
              <div className="grid grid-cols-5 gap-4 flex-1 min-h-0">
                {/* Péssimo */}
                <div className="col-span-1 rounded-3xl p-6 flex flex-col items-center justify-center text-white shadow-xl relative overflow-hidden group bg-slate-900">
                  <div className="absolute inset-0">
                    <img src="/PESSIMO.png" alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                    {[...Array(60)].map((_, i) => (
                      <div key={`snow-1-${i}`} className="absolute bg-white rounded-full opacity-60 animate-snow" style={{ left: `${Math.random() * 100}%`, top: `-${Math.random() * 20}%`, width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 3 + 1}px`, animationDuration: `${Math.random() * 5 + 3}s`, animationDelay: `${Math.random() * 2}s`, animationTimingFunction: 'linear', animationIterationCount: 'infinite' } as React.CSSProperties} />
                    ))}
                    <style>{`@keyframes snow { to { transform: translateY(400px); } } .animate-snow { animation-name: snow; }`}</style>
                  </div>
                  <div className="relative z-30 flex flex-col items-center mt-32">
                    <span className="text-2xl font-black uppercase tracking-widest mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Péssimo</span>
                    <span className="text-8xl font-black drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">{npsStats.pessimo}</span>
                    <div className="mt-6 text-2xl font-black bg-black/50 px-6 py-2 rounded-full backdrop-blur-md shadow-lg border border-white/20">{((npsStats.pessimo / npsStats.total || 0) * 100).toFixed(1)}%</div>
                  </div>
                </div>
                {/* Ruim */}
                <div className="col-span-1 rounded-3xl p-6 flex flex-col items-center justify-center text-white shadow-xl relative overflow-hidden group bg-slate-800">
                  <div className="absolute inset-0">
                    <img src="/RUIM.png" alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/30" />
                  </div>
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                    {[...Array(80)].map((_, i) => (
                      <div key={`rain-${i}`} className="absolute bg-blue-200 opacity-50 animate-rain" style={{ left: `${Math.random() * 100}%`, top: `-${Math.random() * 20}%`, width: '1px', height: `${Math.random() * 15 + 20}px`, animationDuration: `${Math.random() * 0.4 + 0.3}s`, animationDelay: `${Math.random() * 2}s`, animationTimingFunction: 'linear', animationIterationCount: 'infinite' } as React.CSSProperties} />
                    ))}
                    <style>{`@keyframes rain { to { transform: translateY(600px); } } .animate-rain { animation-name: rain; }`}</style>
                  </div>
                  <div className="relative z-30 flex flex-col items-center mt-32">
                    <span className="text-2xl font-black uppercase tracking-widest mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Ruim</span>
                    <span className="text-8xl font-black drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">{npsStats.ruim}</span>
                    <div className="mt-6 text-2xl font-black bg-black/50 px-6 py-2 rounded-full backdrop-blur-md shadow-lg border border-white/20">{((npsStats.ruim / npsStats.total || 0) * 100).toFixed(1)}%</div>
                  </div>
                </div>
                {/* Regular */}
                <div className="col-span-1 rounded-3xl p-6 flex flex-col items-center justify-center text-white shadow-xl relative overflow-hidden group bg-blue-900">
                  <div className="absolute inset-0">
                    <img src="/NEUTRO.png" alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                      <div key={`wind-${i}`} className="absolute bg-white/20 rounded-full animate-wind" style={{ left: `-${Math.random() * 20}%`, top: `${Math.random() * 100}%`, width: `${Math.random() * 100 + 50}px`, height: `${Math.random() * 2 + 1}px`, animationDuration: `${Math.random() * 2 + 3}s`, animationDelay: `${Math.random() * 2}s`, animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite' } as React.CSSProperties} />
                    ))}
                    <style>{`@keyframes wind { to { transform: translateX(600px); } } .animate-wind { animation-name: wind; }`}</style>
                  </div>
                  <div className="relative z-30 flex flex-col items-center mt-32">
                    <span className="text-2xl font-black uppercase tracking-widest mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-yellow-100">Regular</span>
                    <span className="text-8xl font-black drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-white">{npsStats.regular}</span>
                    <div className="mt-6 text-2xl font-black bg-black/50 text-white px-6 py-2 rounded-full backdrop-blur-md shadow-lg border border-white/20">{((npsStats.regular / npsStats.total || 0) * 100).toFixed(1)}%</div>
                  </div>
                </div>
                {/* Bom */}
                <div className="col-span-1 rounded-3xl p-6 flex flex-col items-center justify-center text-white shadow-xl relative overflow-hidden group bg-green-800">
                  <div className="absolute inset-0">
                    <img src="/BOM.png" alt="" className="w-full h-full object-cover scale-110 transition-transform duration-700 group-hover:scale-125" />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                    {[...Array(15)].map((_, i) => (
                      <div key={`float-${i}`} className="absolute bg-white/40 rounded-full animate-float" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: `${Math.random() * 4 + 2}px`, height: `${Math.random() * 4 + 2}px`, animationDuration: `${Math.random() * 5 + 5}s`, animationDelay: `${Math.random() * 5}s`, animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite' } as React.CSSProperties} />
                    ))}
                    <style>{`@keyframes float { 0%, 100% { transform: translate(0, 0); opacity: 0.2; } 50% { transform: translate(10px, -20px); opacity: 0.6; } } .animate-float { animation-name: float; }`}</style>
                  </div>
                  <div className="relative z-30 flex flex-col items-center mt-32">
                    <span className="text-2xl font-black uppercase tracking-widest mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-green-100">Bom</span>
                    <span className="text-8xl font-black drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-white">{npsStats.bom}</span>
                    <div className="mt-6 text-2xl font-black bg-black/50 text-white px-6 py-2 rounded-full backdrop-blur-md shadow-lg border border-white/20">{((npsStats.bom / npsStats.total || 0) * 100).toFixed(1)}%</div>
                  </div>
                </div>
                {/* Ótimo */}
                <div className="col-span-1 rounded-3xl p-6 flex flex-col items-center justify-center text-white shadow-xl relative overflow-hidden group bg-green-600">
                  <div className="absolute inset-0">
                    <img src="/OTIMO.png" alt="" className="w-full h-full object-cover transition-transform duration-700 scale-110 group-hover:scale-125 -translate-y-12" />
                    <div className="absolute inset-0 bg-black/10" />
                  </div>
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden mix-blend-overlay">
                    <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(255,223,186,0.4)_20deg,transparent_40deg,rgba(255,223,186,0.4)_60deg,transparent_80deg,rgba(255,223,186,0.4)_100deg,transparent_120deg)] opacity-50 animate-sun-spin" />
                    <style>{`@keyframes sun-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-sun-spin { animation-name: sun-spin; animation-duration: 25s; animation-timing-function: linear; animation-iteration-count: infinite; }`}</style>
                  </div>
                  <div className="relative z-30 flex flex-col items-center mt-32">
                    <span className="text-2xl font-black uppercase tracking-widest mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-green-50">Ótimo</span>
                    <span className="text-8xl font-black drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-white">{npsStats.otimo}</span>
                    <div className="mt-6 text-2xl font-black bg-black/50 text-white px-6 py-2 rounded-full backdrop-blur-md shadow-lg border border-white/20">{((npsStats.otimo / npsStats.total || 0) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              {/* Linha de métricas */}
              <div className="grid grid-cols-3 gap-4 h-36 shrink-0">
                {/* Tickets Encerrados */}
                <div className="bg-white rounded-3xl p-6 flex items-center justify-between shadow-lg border border-slate-100 relative overflow-hidden">
                  <div className="absolute left-0 bottom-0 top-0 w-2 bg-[#003087]" />
                  <div className="flex flex-col ml-4">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Tickets Encerrados</span>
                    <span className="text-5xl font-black text-slate-800">{npsStats.encerrados}</span>
                  </div>
                  <div className="pr-4 text-[#003087] opacity-20"><History size={52} /></div>
                </div>
                {/* Usuários que Responderam */}
                <div className="bg-white rounded-3xl p-6 flex items-center justify-between shadow-lg border border-slate-100 relative overflow-hidden">
                  <div className="absolute left-0 bottom-0 top-0 w-2 bg-[#009B3A]" />
                  <div className="flex flex-col ml-4">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Usuários que Responderam</span>
                    <span className="text-5xl font-black text-[#009B3A]">{npsStats.total}</span>
                  </div>
                  <div className="pr-4 text-[#009B3A] opacity-20"><TrendingUp size={52} /></div>
                </div>
                {/* Usuários S/ Resposta */}
                <div className="bg-white rounded-3xl p-6 flex items-center justify-between shadow-lg border border-slate-100 relative overflow-hidden">
                  <div className="absolute left-0 bottom-0 top-0 w-2 bg-[#ef4444]" />
                  <div className="flex flex-col ml-4">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Usuários S/ Resposta</span>
                    <span className="text-5xl font-black text-red-500">{npsStats.encerrados - npsStats.total > 0 ? npsStats.encerrados - npsStats.total : 0}</span>
                  </div>
                  <div className="pr-4 text-[#ef4444] opacity-20"><AlertCircle size={52} /></div>
                </div>
              </div>
            </div>{/* fim coluna esquerda */}

            {/* Coluna Direita: Lista de últimos NPS respondidos */}
            <div className="w-80 shrink-0 flex flex-col gap-3">
              <div className="flex items-center justify-between px-1 shrink-0">
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Últimos Respondidos</h2>
                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{npsRecentTickets.length}</span>
              </div>
              <div className="flex-1 flex flex-col gap-2 min-h-0">

                {npsRecentTickets.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-slate-400">
                    <span className="text-xs font-black uppercase tracking-widest">Sem respostas</span>
                  </div>
                )}
                {npsRecentTickets.slice(0, 5).map((ticket) => {
                  const notaLabel = ticket.nota === 1 ? 'Péssimo' : ticket.nota === 2 ? 'Ruim' : ticket.nota === 3 ? 'Regular' : ticket.nota === 4 ? 'Bom' : 'Ótimo';
                  const notaColor = ticket.nota <= 2
                    ? { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-500', text: 'text-red-600' }
                    : ticket.nota === 3
                      ? { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-500', text: 'text-yellow-700' }
                      : { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-500', text: 'text-green-800' };
                  const op = ticket.operador.toLowerCase().trim();
                  const agente = AGENTES_CONFIG.find(a => {
                    const id = (a.id || '').toLowerCase();
                    const display = (a.displayName || '').toLowerCase();
                    const full = (a.fullName || '').toLowerCase();
                    return op === id || op === display || op === full ||
                      op.includes(id) || op.includes(display) ||
                      id.includes(op) || display.includes(op) || full.includes(op);
                  });
                  const ringColor = ticket.nota <= 2 ? 'ring-red-400' : ticket.nota === 3 ? 'ring-yellow-300' : 'ring-green-500';
                  const accentColor = ticket.nota <= 2 ? '#ef4444' : ticket.nota === 3 ? '#FFDF00' : '#009B3A';
                  return (
                    <div key={ticket.id} className={`flex-1 rounded-2xl border-2 ${notaColor.border} ${notaColor.bg} px-4 py-3 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-200 hover:shadow-md`}>
                      <div className="absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl" style={{ background: accentColor }} />
                      {/* Operador + Nota */}
                      <div className="flex items-center gap-3 ml-2">
                        {agente?.avatar ? (
                          <img src={agente.avatar} alt={agente.displayName || ticket.operador}
                            className={`w-14 h-14 rounded-full object-cover ring-2 ${ringColor} shadow-md shrink-0`} />
                        ) : (
                          <div className={`w-14 h-14 rounded-full bg-slate-200 ring-2 ${ringColor} flex items-center justify-center shrink-0 shadow-md`}>
                            <span className="text-base font-black text-slate-600">{ticket.operador.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div className="flex flex-col min-w-0 flex-1 gap-1">
                          <span className="text-sm font-black text-slate-800 truncate">{agente?.displayName || ticket.operador}</span>
                          <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full text-white w-fit ${notaColor.badge}`}>{notaLabel}</span>
                        </div>
                      </div>
                      {/* Chamado + Data */}
                      <div className="flex items-center justify-between ml-2 mt-1">
                        <span className="text-xs font-black text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md tracking-wide">#{ticket.id}</span>
                        <span className="text-xs text-slate-400 font-semibold">{ticket.data}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* VIEW 3: Níveis de Atendimento — Campo de Futebol */}
          <div className="min-w-full h-full p-1 overflow-hidden">
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-[#1a5c1a]"
              style={{ background: 'linear-gradient(90deg, #2d7a2d 0%, #236b23 10%, #2d7a2d 20%, #236b23 30%, #2d7a2d 40%, #236b23 50%, #2d7a2d 60%, #236b23 70%, #2d7a2d 80%, #236b23 90%, #2d7a2d 100%)' }}>

              {/* Linhas do campo */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none">
                <rect x="2%" y="3%" width="96%" height="94%" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" rx="4" />
                <line x1="50%" y1="3%" x2="50%" y2="97%" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
                <circle cx="50%" cy="50%" r="9%" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
                <circle cx="50%" cy="50%" r="1.2%" fill="rgba(255,255,255,0.8)" />
                {/* Área grande esquerda */}
                <rect x="2%" y="22%" width="13%" height="56%" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                {/* Área pequena esquerda */}
                <rect x="2%" y="34%" width="6%" height="32%" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                {/* Área grande direita */}
                <rect x="85%" y="22%" width="13%" height="56%" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                {/* Área pequena direita */}
                <rect x="92%" y="34%" width="6%" height="32%" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                {/* Ponto pênalti */}
                <circle cx="13%" cy="50%" r="0.8%" fill="rgba(255,255,255,0.7)" />
                <circle cx="87%" cy="50%" r="0.8%" fill="rgba(255,255,255,0.7)" />
                {/* Linhas divisórias de setor (tracejadas) */}
                <line x1="22%" y1="3%" x2="22%" y2="97%" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="5,5" />
                <line x1="40%" y1="3%" x2="40%" y2="97%" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="5,5" />
                <line x1="60%" y1="3%" x2="60%" y2="97%" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="5,5" />
                <line x1="78%" y1="3%" x2="78%" y2="97%" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="5,5" />
              </svg>

              {/* Traves */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20" style={{ height: '30%', width: '1.5%', background: 'rgba(255,255,255,0.95)', borderRadius: '0 4px 4px 0', boxShadow: '2px 0 6px rgba(0,0,0,0.4)' }} />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20" style={{ height: '30%', width: '1.5%', background: 'rgba(255,255,255,0.95)', borderRadius: '4px 0 0 4px', boxShadow: '-2px 0 6px rgba(0,0,0,0.4)' }} />

              {/* Labels de setor no topo */}
              <div className="absolute top-3 left-0 w-full flex z-30 pointer-events-none" style={{ paddingLeft: '2%', paddingRight: '2%' }}>
                {[
                  { label: 'NÍVEL 1', sub: 'Defesa', color: '#009B3A', w: '20%' },
                  { label: 'NÍVEL 2', sub: 'Meio Campo', color: '#003087', w: '18%' },
                  { label: 'NÍVEL 3', sub: 'Ataque', color: '#b8a200', w: '20%' },
                  { label: 'LIB. VERSÃO', sub: '', color: '#7c3aed', w: '18%' },
                  { label: 'ENOTAS', sub: 'VAR', color: '#dc2626', w: '20%' },
                ].map((s, i) => (
                  <div key={i} className="flex justify-center" style={{ width: s.w }}>
                    <div className="px-4 py-1.5 rounded-xl text-center shadow-lg" style={{ background: `${s.color}dd`, border: '2px solid rgba(255,255,255,0.4)' }}>
                      <div className="text-white text-sm font-black uppercase tracking-widest leading-none">{s.label}</div>
                      {s.sub && <div className="text-white/80 text-[11px] font-bold uppercase leading-none mt-1">{s.sub}</div>}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── BOTÕES DE JOGADOR ── */}
              {/* Componente inline: círculo com foto + nome + contagem */}

              {/* Carol — Nível 1, canto superior esquerdo da defesa */}
              {(() => {
                const cfg = AGENTES_CONFIG.find(c => c.displayName === 'Carol');
                return (
                  <div className="absolute z-30 flex flex-col items-center gap-1" style={{ left: '8%', top: '22%', transform: 'translate(-50%, 0)' }}>
                    <div className="relative">
                      <div className="rounded-full overflow-hidden shadow-xl" style={{ width: 120, height: 120, border: '4px solid #FFDF00', boxShadow: '0 0 0 3px #009B3A, 0 6px 20px rgba(0,0,0,0.6)' }}>
                        {cfg?.avatar ? <img src={cfg.avatar} alt="Carol" className="w-full h-full object-cover object-top" /> : <div className="w-full h-full bg-[#009B3A] flex items-center justify-center text-white font-black text-2xl">C</div>}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-[#009B3A] text-white text-xs font-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-white text-base">{carolTicketsCount}</div>
                    </div>
                    <div className="bg-black/60 backdrop-blur-sm text-white text-sm font-black uppercase tracking-wide px-3 py-1 rounded-full shadow border border-white/20">Carol</div>
                  </div>
                );
              })()}

              {/* Carnaval — Nível 1, canto inferior esquerdo da defesa */}
              {(() => {
                const cfg = AGENTES_CONFIG.find(c => c.displayName === 'Carnaval');
                return (
                  <div className="absolute z-30 flex flex-col items-center gap-1" style={{ left: '8%', top: '58%', transform: 'translate(-50%, 0)' }}>
                    <div className="relative">
                      <div className="rounded-full overflow-hidden shadow-xl" style={{ width: 120, height: 120, border: '4px solid #FFDF00', boxShadow: '0 0 0 3px #009B3A, 0 6px 20px rgba(0,0,0,0.6)' }}>
                        {cfg?.avatar ? <img src={cfg.avatar} alt="Carnaval" className="w-full h-full object-cover object-top" /> : <div className="w-full h-full bg-[#009B3A] flex items-center justify-center text-white font-black text-2xl">C</div>}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-[#009B3A] text-white text-xs font-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-white text-base">{carnavalTicketsCount}</div>
                    </div>
                    <div className="bg-black/60 backdrop-blur-sm text-white text-sm font-black uppercase tracking-wide px-3 py-1 rounded-full shadow border border-white/20">Carnaval</div>
                  </div>
                );
              })()}

              {/* Rafael — Nível 2, meio campo defensivo */}
              {(() => {
                const cfg = AGENTES_CONFIG.find(c => c.displayName === 'Rafael');
                return (
                  <div className="absolute z-30 flex flex-col items-center gap-1" style={{ left: '31%', top: '38%', transform: 'translate(-50%, 0)' }}>
                    <div className="relative">
                      <div className="rounded-full overflow-hidden shadow-xl" style={{ width: 120, height: 120, border: '4px solid #FFDF00', boxShadow: '0 0 0 3px #003087, 0 6px 20px rgba(0,0,0,0.6)' }}>
                        {cfg?.avatar ? <img src={cfg.avatar} alt="Rafael" className="w-full h-full object-cover object-top" /> : <div className="w-full h-full bg-[#003087] flex items-center justify-center text-white font-black text-2xl">R</div>}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-[#003087] text-white text-xs font-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-white text-base">{rafaelTicketsCount}</div>
                    </div>
                    <div className="bg-black/60 backdrop-blur-sm text-white text-sm font-black uppercase tracking-wide px-3 py-1 rounded-full shadow border border-white/20">Rafael</div>
                  </div>
                );
              })()}

              {/* Rubão — Nível 3, meio campo ofensivo */}
              {(() => {
                const cfg = AGENTES_CONFIG.find(c => c.displayName === 'Rubão');
                return (
                  <div className="absolute z-30 flex flex-col items-center gap-1" style={{ left: '50%', top: '38%', transform: 'translate(-50%, 0)' }}>
                    <div className="relative">
                      <div className="rounded-full overflow-hidden shadow-xl" style={{ width: 120, height: 120, border: '4px solid #FFDF00', boxShadow: '0 0 0 3px #b8a200, 0 6px 20px rgba(0,0,0,0.6)' }}>
                        {cfg?.avatar ? <img src={cfg.avatar} alt="Rubão" className="w-full h-full object-cover object-top" /> : <div className="w-full h-full bg-[#FFDF00] flex items-center justify-center text-slate-900 font-black text-2xl">R</div>}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-[#FFDF00] text-slate-900 text-xs font-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-white text-base">{rubensTicketsCount}</div>
                    </div>
                    <div className="bg-black/60 backdrop-blur-sm text-white text-sm font-black uppercase tracking-wide px-3 py-1 rounded-full shadow border border-white/20">Rubão</div>
                  </div>
                );
              })()}

              {/* Liberação de Versão — setor ataque, sem foto */}
              <div className="absolute z-30 flex flex-col items-center gap-1" style={{ left: '69%', top: '38%', transform: 'translate(-50%, 0)' }}>
                <div className="relative">
                  <div className="rounded-full flex items-center justify-center shadow-xl" style={{ width: 120, height: 120, border: '4px solid #FFDF00', boxShadow: '0 0 0 3px #7c3aed, 0 6px 20px rgba(0,0,0,0.6)', background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}>
                    <span className="text-white text-4xl font-black">LV</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-[#7c3aed] text-white text-xs font-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-white text-base">{chamadosLiberacao.length}</div>
                </div>
                <div className="bg-black/60 backdrop-blur-sm text-white text-sm font-black uppercase tracking-wide px-3 py-1 rounded-full shadow border border-white/20">Lib. Versão</div>
              </div>

              {/* Enotas — setor VAR/goleiro direita */}
              <div className="absolute z-30 flex flex-col items-center gap-1" style={{ left: '89%', top: '38%', transform: 'translate(-50%, 0)' }}>
                <div className="relative">
                  <div className="rounded-full flex items-center justify-center shadow-xl" style={{ width: 120, height: 120, border: '4px solid #FFDF00', boxShadow: '0 0 0 3px #dc2626, 0 6px 20px rgba(0,0,0,0.6)', background: 'linear-gradient(135deg, #dc2626, #7f1d1d)' }}>
                    <span className="text-white text-4xl font-black">EN</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-[#dc2626] text-white text-xs font-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-white text-base">{chamadosEnotas.length}</div>
                </div>
                <div className="bg-black/60 backdrop-blur-sm text-white text-sm font-black uppercase tracking-wide px-3 py-1 rounded-full shadow border border-white/20">Enotas</div>
              </div>

              {/* Bola no centro */}
              <div className="absolute z-20" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="w-6 h-6 rounded-full shadow-lg" style={{ background: 'radial-gradient(circle at 35% 35%, #fff 30%, #888 100%)', border: '2px solid rgba(0,0,0,0.3)' }} />
              </div>

            </div>
          </div>

          {/* VIEW 4: Entregas */}
          <div className="min-w-full h-full p-1 overflow-hidden flex flex-col gap-3">
            {/* Header da tela */}
            <div className="flex items-center gap-4 shrink-0 px-1">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 rounded-full bg-[#003087]" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Pipeline de Desenvolvimento</span>
              </div>
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                {buckets.reduce((acc, b) => acc + b.items.length, 0)} itens
              </span>
            </div>

            {/* Colunas Kanban */}
            {(() => {
              const BUCKET_ORDER = ['defini', 'aguard', 'desenvolv', 'teste', 'piloto', 'entreg'];
              const sortedBuckets = [...buckets].sort((a, b) => {
                const ai = BUCKET_ORDER.findIndex(k => a.name.toLowerCase().includes(k));
                const bi = BUCKET_ORDER.findIndex(k => b.name.toLowerCase().includes(k));
                return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
              });
              return (
            <div className="flex-1 min-h-0 grid gap-4" style={{ gridTemplateColumns: `repeat(${sortedBuckets.length || 1}, minmax(0, 1fr))` }}>
              {sortedBuckets.map((bucket, idx) => {
                const COLORS = [
                  { color: '#64748b', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600' },
                  { color: '#003087', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
                  { color: '#d97706', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700' },
                  { color: '#7c3aed', bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700' },
                  { color: '#009B3A', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
                ];
                const col = COLORS[idx % COLORS.length];
                const items = bucket.items;
                return (
                  <div key={bucket.id} className={`flex flex-col rounded-3xl border-2 ${col.border} ${col.bg} overflow-hidden`}>
                    {/* Header da coluna */}
                    <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: `2px solid`, borderColor: col.color + '22' }}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-3 h-3 rounded-full ${col.dot}`} />
                        <span className="text-sm font-black uppercase tracking-wider" style={{ color: col.color }}>{bucket.name}</span>
                      </div>
                      <span className={`text-lg font-black px-2.5 py-1 rounded-full ${col.badge}`}>{items.length}</span>
                    </div>

                    {/* Cards de items */}
                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0">
                      {items.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-8 opacity-40">
                          <div className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center mb-3" style={{ borderColor: col.color }}>
                            <span className="text-lg font-black" style={{ color: col.color }}>+</span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-center" style={{ color: col.color }}>
                            Nenhum item
                          </span>
                        </div>
                      ) : (
                        items.slice(0, bucket.id === PLANNER_CONFIG.BUCKET_IDS.entregue ? 7 : 6).map((item: any, idx: number) => {
                          const isAtrasado = item.dueDateTimeRaw && new Date(item.dueDateTimeRaw) < new Date() &&
                            bucket.id !== PLANNER_CONFIG.BUCKET_IDS.entregue &&
                            bucket.id !== PLANNER_CONFIG.BUCKET_IDS.piloto &&
                            bucket.id !== PLANNER_CONFIG.BUCKET_IDS.teste;
                          return (
                          <div key={idx} className={`bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-2 ${isAtrasado ? 'border-2 border-red-500 animate-pulse' : 'border border-white/80'}`}>
                            {/* Etiquetas */}
                            {item.etiquetas && item.etiquetas.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.etiquetas.map((etiqueta: string, i: number) => (
                                  <span key={i} className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide text-white" style={{ backgroundColor: col.color }}>
                                    {etiqueta}
                                  </span>
                                ))}
                              </div>
                            )}
                            {/* Título */}
                            <span className="text-sm font-bold text-slate-800 leading-snug">{item.titulo || item.subject || item.title || 'Sem título'}</span>
                            {/* Responsável + Data */}
                            <div className="flex items-center justify-between mt-1">
                              {item.responsavel && (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                                    <span className="text-[8px] font-black text-slate-600">{item.responsavel.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500 truncate max-w-[80px]">{item.responsavel}</span>
                                </div>
                              )}
                              {item.data && (
                                <span className="text-[10px] font-bold text-slate-400">{item.data}</span>
                              )}
                            </div>
                          </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
              );
            })()}
          </div>

          {/* VIEW 5: Cronograma */}
          {(() => {
            const totalItens = buckets.reduce((acc, b) => acc + b.items.length, 0);

            // Identifica bucket "Entregue" pelo ID configurado ou pelo nome (fallback)
            const bucketEntregue = buckets.find(b => b.id === PLANNER_CONFIG.BUCKET_IDS.entregue)
              || buckets.find(b => /entregue/i.test(b.name));
            const entregues = bucketEntregue?.items || [];
            const concluidas = entregues.length;
            const percentConcluido = totalItens > 0 ? Math.round((concluidas / totalItens) * 100) : 0;

            // Buckets ativos (tudo exceto o de entregue)
            const bucketsAtivos = buckets.filter(b => b.id !== bucketEntregue?.id);
            const todasTarefas = buckets.flatMap(b => b.items);
            const atrasadasGlobal = todasTarefas.filter(item =>
              item.dueDateTimeRaw && new Date(item.dueDateTimeRaw) < new Date()
            );

            const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
            const hoje = new Date();
            const mesAtual = hoje.getMonth();

            // Próximas entregas por prazo (apenas buckets ativos, com data, ordenadas)
            const proximasEntregas = bucketsAtivos
              .flatMap(b => b.items.map((item: any) => ({ ...item, bucketName: b.name, bucketId: b.id })))
              .filter((item: any) => item.dueDateTimeRaw)
              .sort((a: any, b: any) => new Date(a.dueDateTimeRaw).getTime() - new Date(b.dueDateTimeRaw).getTime())
              .slice(0, 6);

            // Roadmap: agrupa itens de buckets ativos por mês
            const roadmapMeses = [mesAtual - 1, mesAtual, mesAtual + 1, mesAtual + 2].map(m => {
              const idx = ((m % 12) + 12) % 12;
              const ano = hoje.getFullYear() + (m < 0 ? -1 : m > 11 ? 1 : 0);
              const itensDoMes = bucketsAtivos
                .flatMap(b => b.items)
                .filter((item: any) => {
                  if (!item.dueDateTimeRaw) return false;
                  const d = new Date(item.dueDateTimeRaw);
                  return d.getMonth() === idx && d.getFullYear() === ano;
                });
              return { label: meses[idx], mes: idx, ano, itens: itensDoMes, isAtual: idx === mesAtual };
            });

            const ETIQUETA_COLORS = ['#3b82f6','#f59e0b','#8b5cf6','#10b981','#ef4444','#06b6d4','#f97316','#6366f1','#84cc16','#ec4899'];

            return (
              <div className="min-w-full h-full p-2 overflow-hidden grid gap-2" style={{ gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '42% 58%' }}>

                {/* BLOCO 2: Roadmap de Entregas */}
                <div className="col-span-3 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="w-8 h-8 rounded bg-slate-100 text-slate-600 text-base font-black flex items-center justify-center">2</span>
                    <span className="text-xl font-black uppercase tracking-widest text-slate-500">Roadmap de Entregas</span>
                  </div>
                  {/* Timeline */}
                  <div className="flex items-center gap-0 shrink-0 px-2 py-1">
                    {roadmapMeses.map((m, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className={`text-base font-black uppercase tracking-widest ${m.isAtual ? 'text-blue-600' : 'text-slate-400'}`}>{m.label}</span>
                        <div className="relative w-full flex items-center">
                          <div className="flex-1 h-0.5 bg-slate-200" />
                          <div className={`w-5 h-5 rounded-full border-2 shrink-0 ${m.isAtual ? 'bg-blue-500 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-300 border-slate-300'}`} />
                          <div className="flex-1 h-0.5 bg-slate-200" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Colunas por mês */}
                  <div className="flex-1 grid grid-cols-4 gap-4 min-h-0 overflow-hidden">
                    {roadmapMeses.map((m, i) => (
                      <div key={i} className="flex flex-col gap-3 overflow-y-auto">
                        {i === 1 && (
                          <span className="text-sm font-black uppercase tracking-widest text-blue-600 mb-0.5">Próximas entregas</span>
                        )}
                        {i === 3 && (
                          <span className="text-sm font-black uppercase tracking-widest text-slate-400 mb-0.5">Em planejamento</span>
                        )}
                        {m.itens.length === 0 ? (
                          <span className="text-sm text-slate-300 italic">Sem itens</span>
                        ) : m.itens.slice(0, 6).map((item: any, j: number) => (
                          <div key={j} className="flex items-start gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${i <= 1 ? 'bg-green-500' : 'bg-slate-300'}`} />
                            <span className="text-base text-slate-600 leading-snug">{item.titulo}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* BLOCO 3: Próximas Entregas por Prazo */}
                <div className="col-span-1 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 overflow-hidden shadow-sm min-h-0">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-7 h-7 rounded bg-slate-100 text-slate-600 text-sm font-black flex items-center justify-center">3</span>
                    <span className="text-base font-black uppercase tracking-widest text-slate-500">Próximas Entregas por Prazo</span>
                  </div>
                  <div className="flex-1 overflow-y-auto flex flex-col gap-0 min-h-0">
                    <div className="grid grid-cols-3 gap-2 text-xs font-black uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-200 shrink-0">
                      <span>Tarefa</span><span className="text-center">Prazo</span><span className="text-right">Status</span>
                    </div>
                    {proximasEntregas.map((item: any, i: number) => {
                      const d = new Date(item.dueDateTimeRaw);
                      const diffDias = Math.ceil((d.getTime() - Date.now()) / 86400000);
                      const venceLabel = diffDias < 0 ? 'Atrasado' : diffDias === 0 ? 'Vence hoje' : diffDias === 1 ? 'Vence em 1 dia' : `Vence em ${diffDias} dias`;
                      const venceCor = diffDias < 0 ? 'text-red-500' : diffDias <= 1 ? 'text-red-500' : diffDias <= 7 ? 'text-amber-500' : 'text-green-600';
                      return (
                        <div key={i} className="grid grid-cols-3 gap-2 py-2.5 border-b border-slate-100 items-center">
                          <div className="flex items-center gap-2 min-w-0">
                            {item.etiquetas?.[0] && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 text-white" style={{ backgroundColor: ETIQUETA_COLORS[i % ETIQUETA_COLORS.length] }}>
                                {item.etiquetas[0]}
                              </span>
                            )}
                            <span className="text-sm font-bold text-slate-700 truncate">{item.titulo}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-500 text-center">{item.data}</span>
                          <span className={`text-sm font-black text-right ${venceCor}`}>{venceLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                  {atrasadasGlobal.length > 0 && (
                    <div className="shrink-0 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mt-1">
                      <span className="text-red-500 text-2xl">⏰</span>
                      <div>
                        <span className="text-red-500 font-black text-lg">{atrasadasGlobal.length}</span>
                        <span className="text-sm text-red-500 font-bold ml-1">entregas atrasadas</span>
                      </div>
                      <span className="text-sm text-red-400 ml-auto font-black">ATENÇÃO</span>
                    </div>
                  )}
                </div>

                {/* BLOCO 4: Saúde do Pipeline */}
                <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-7 h-7 rounded bg-slate-100 text-slate-600 text-sm font-black flex items-center justify-center">4</span>
                    <span className="text-base font-black uppercase tracking-widest text-slate-500">Saúde do Pipeline</span>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3 min-h-0 overflow-y-auto">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-slate-800">{totalItens}</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mt-1">Total</span>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-green-600">{concluidas}</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mt-1">Concluídas</span>
                      <span className="text-base font-black text-green-600">{percentConcluido}%</span>
                    </div>
                    {bucketsAtivos.map((b, i) => {
                      const PALETTE = [
                        { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
                        { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
                        { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600' },
                        { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600' },
                        { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600' },
                        { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
                      ];
                      const p = PALETTE[i % PALETTE.length];
                      return (
                        <div key={b.id} className={`${p.bg} border ${p.border} rounded-xl p-3 flex flex-col items-center justify-center`}>
                          <span className={`text-4xl font-black ${p.text}`}>{b.items.length}</span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mt-1 leading-tight">{b.name}</span>
                          <span className={`text-base font-black ${p.text}`}>{totalItens > 0 ? Math.round((b.items.length / totalItens) * 100) : 0}%</span>
                        </div>
                      );
                    })}
                  </div>
                  {atrasadasGlobal.length > 0 && (
                    <div className="shrink-0 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2">
                      <AlertCircle size={18} className="text-red-500 shrink-0" />
                      <div className="flex-1">
                        <span className="text-red-500 font-black text-lg">{atrasadasGlobal.length}</span>
                        <span className="text-sm text-red-500 font-bold ml-1">Atrasadas</span>
                        <span className="text-sm text-red-400 block">Acompanhe as entregas no prazo!</span>
                      </div>
                      <span className="text-sm font-black text-red-500">
                        {totalItens > 0 ? Math.round((atrasadasGlobal.length / totalItens) * 100) : 0}%
                      </span>
                    </div>
                  )}
                </div>


              </div>
            );
          })()}

        </div>
      </div>

      {activeNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4">
          <div className={`relative bg-white/90 backdrop-blur-3xl border-4 rounded-[40px] p-12 flex flex-col items-center shadow-[0_32px_64px_rgba(0,0,0,0.4)] animate-nps-notification overflow-hidden max-w-2xl
                ${activeNotification.score && activeNotification.score <= 2 ? 'border-red-500 scale-105' :
              activeNotification.score && activeNotification.score >= 4 ? 'border-[#009B3A] animate-glow-positive' : 'border-slate-200'}`}
          >
            {activeNotification.score && activeNotification.score >= 4 && (
              <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                {[...Array(20)].map((_, i) => (
                  <div key={`star-${i}`} className="absolute text-yellow-500 animate-pulse"
                    style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, fontSize: `${Math.random() * 20 + 10}px` }}>★</div>
                ))}
              </div>
            )}
            {activeNotification.score && activeNotification.score <= 2 && (
              <div className="absolute inset-0 z-0 pointer-events-none bg-red-500/10 animate-pulse" />
            )}

            <div className="relative mb-8 z-10">
              <div className={`absolute inset-0 rounded-full animate-ping opacity-25
                ${activeNotification.score && activeNotification.score <= 2 ? 'bg-red-500' : 'bg-[#009B3A]'}`} />
              <div className={`relative w-56 h-56 rounded-full border-4 overflow-hidden bg-slate-100 shadow-xl flex items-center justify-center
                ${activeNotification.score && activeNotification.score <= 2 ? 'border-red-500' : 'border-[#009B3A]'}`}>
                {activeNotification.avatar ? (
                  <img src={activeNotification.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[100px] font-black text-slate-400 select-none">
                    {(activeNotification.operator || 'O').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {activeNotification.score && activeNotification.score >= 4 && (
                <div className="absolute -top-6 -right-6 bg-yellow-400 p-4 rounded-full shadow-lg border-4 border-white animate-bounce z-20">
                  <Trophy size={40} className="text-white" fill="white" />
                </div>
              )}

              {activeNotification.score && (
                <div className={`absolute -bottom-4 right-0 w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-lg border-4 border-white
                  ${activeNotification.score <= 2 ? 'bg-red-500' : activeNotification.score >= 4 ? 'bg-[#009B3A]' : 'bg-slate-400'}`}>
                  {activeNotification.score}
                </div>
              )}
            </div>

            <div className="text-center z-10">
              <div className="flex items-center justify-center gap-3 mb-3">
                {activeNotification.score && activeNotification.score <= 2 && <AlertCircle className="text-red-500" size={32} />}
                <h3 className={`text-2xl font-black uppercase tracking-[0.3em]
                  ${activeNotification.score && activeNotification.score <= 2 ? 'text-red-600' : 'text-slate-400'}`}>
                  {activeNotification.score && activeNotification.score <= 2 ? '🚨 Atenção: Crítica Recebida' : 'Novo NPS Respondido!'}
                </h3>
              </div>
              <p className="text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">
                {activeNotification.operator}
              </p>
              <div className="flex items-center justify-center gap-4">
                {activeNotification.score && (
                  <p className={`text-xl font-black uppercase tracking-widest px-8 py-2 rounded-full inline-block
                    ${activeNotification.score <= 2 ? 'bg-red-100 text-red-600' : activeNotification.score >= 4 ? 'bg-teal-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    Nota: {activeNotification.score === 1 ? 'Péssimo' : activeNotification.score === 2 ? 'Ruim' : activeNotification.score === 3 ? 'Regular' : activeNotification.score === 4 ? 'Bom' : 'Ótimo'}
                  </p>
                )}
                {activeNotification.ticketId && (
                  <p className="text-xl font-black bg-slate-900 text-white px-8 py-2 rounded-full uppercase tracking-widest">
                    Ticket: #{activeNotification.ticketId}
                  </p>
                )}
              </div>
            </div>

            <div className={`absolute -bottom-1 left-0 w-full h-3 animate-nps-bar
              ${activeNotification.score && activeNotification.score <= 2 ? 'bg-red-500' : 'bg-[#009B3A]'}`} />
          </div>
          <style>{`
            @keyframes nps-notification {
              0% { transform: scale(0.5) translateY(100px); opacity: 0; }
              5% { transform: scale(1.05) translateY(0); opacity: 1; }
              8% { transform: scale(1) translateY(0); opacity: 1; }
              92% { transform: scale(1) translateY(0); opacity: 1; }
              100% { transform: scale(0.9) translateY(-100px); opacity: 0; }
            }
            @keyframes nps-bar {
              from { width: 100%; }
              to { width: 0%; }
            }
            @keyframes glow-positive {
              0%, 100% {
                box-shadow: 0 0 20px rgba(47, 171, 171, 0.4), 0 0 40px rgba(255, 215, 0, 0.2), 0 32px 64px rgba(0,0,0,0.4);
                border-color: #009B3A;
              }
              50% {
                box-shadow: 0 0 60px rgba(47, 171, 171, 0.8), 0 0 80px rgba(255, 215, 0, 0.4), 0 32px 64px rgba(0,0,0,0.4);
                border-color: #ffd700;
              }
            }
            .animate-nps-notification {
              animation: nps-notification 10s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            }
            .animate-nps-bar {
              animation: nps-bar 10s linear forwards;
            }
            .animate-glow-positive {
              animation: glow-positive 1.5s ease-in-out infinite;
            }
          `}</style>
        </div>
      )}

      {showForaPrazoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4">
          <div className="relative rounded-[40px] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)] animate-fora-prazo-notification border-4 border-[#ef4444]" style={{ maxWidth: '680px', width: '100%' }}>
            <img
              src="https://i.postimg.cc/rp8CdwTJ/Chat-GPT-Image-28-de-abr-de-2026-10-19-45.png"
              alt="Fora do Prazo"
              className="w-full h-auto block"
            />
            <div className="absolute bottom-0 left-0 w-full h-3 bg-[#ef4444] animate-fora-prazo-bar" />
          </div>
          <style>{`
            @keyframes fora-prazo-notification {
              0%   { transform: scale(0.5) translateY(100px); opacity: 0; }
              5%   { transform: scale(1.05) translateY(0);    opacity: 1; }
              8%   { transform: scale(1)    translateY(0);    opacity: 1; }
              92%  { transform: scale(1)    translateY(0);    opacity: 1; }
              100% { transform: scale(0.9) translateY(-100px); opacity: 0; }
            }
            @keyframes fora-prazo-bar {
              from { width: 100%; }
              to   { width: 0%; }
            }
            .animate-fora-prazo-notification {
              animation: fora-prazo-notification 10s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            }
            .animate-fora-prazo-bar {
              animation: fora-prazo-bar 10s linear forwards;
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Dashboard />);
