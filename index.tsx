
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertCircle,
  User,
  TrendingUp,
  CalendarDays,
  History,
  Trophy
} from 'lucide-react';

/**
 * CONFIGURAÇÃO GLOBAL
 */
const CONFIG = {
  MOVIDESK_TOKEN: 'fb6ad8cd-1026-40b2-8224-f2a8dad2c97d',
  REFRESH_MS: 180000,
  NPS_REFRESH_MS: 60000,
  PAGE_REFRESH_MS: 900000,
  AVATAR_OPACITY: 0.25,
  AVATAR_FALLBACK_OPACITY: 0.08
};

const LOGO_URL = 'https://i.postimg.cc/C14PvBhv/Ultra-Academia-transparente.png';
const GOOGLE_SHEET_API = 'https://script.google.com/macros/s/AKfycbwow33xEPcD-y-1bkmgrLjAs7e65S9isuFw7Dw3AyQM1yG6dYC7SiPUNMpi9nRL62IU/exec';

const AGENTES_CONFIG = [
  { id: "Rafael", displayName: "Rafael", fullName: "Rafael Zahner", avatar: "/RAFAEL.png" },
  { id: "MATHEUS", displayName: "MATHEUS", fullName: "MATHEUS RAMOS", avatar: "/MATHEUS.png" },
  { id: "Rubens", displayName: "Rubão", fullName: "Rubens Rodrigues Junior", avatar: "/rubens.png" },
  { id: "Carnaval", displayName: "Carnaval", fullName: "Carnaval", avatar: "/CARNAVAL.png" },
  { id: "JOAO", displayName: "JOÃO", fullName: "JOAO GUILHERME FIGUEIREDO", avatar: "/JOAO.png" }
];

const COLUNA_CORES = ['#d4af37', '#c9a35a', '#b8860b', '#8a6a2f', '#a67c00', '#6b8e23', '#4a90a4', '#9b6b9e'];

const ENTREGAS_COLUNAS_MOCK = [
  {
    key: 'backlog', label: 'Definição / Backlog', color: '#d4af37',
    items: [
      { tags: ['PROJETO', 'FINANCEIRO'], title: 'Cobrança', membros: 1, data: '09/04' },
      { tags: ['MELHORIA'], title: 'Cadastro de Prospect', membros: 4, data: '30/06' },
      { tags: ['MELHORIA', 'BACKLOG'], title: '13 meses no Dashboard de Piscina', membros: 1, data: '20/07' },
      { tags: ['PROJETO'], title: 'Compras', membros: 2, data: '' },
      { tags: ['MELHORIA'], title: 'Cancelamento Assistido via Central do Aluno', membros: 3, data: '' },
      { tags: [], title: 'Importar conta a pagar a partir da nota fiscal', membros: 1, data: '' },
    ],
  },
  {
    key: 'aguardando', label: 'Aguardando', color: '#c9a35a',
    items: [
      { tags: ['PROJETO'], title: 'Campanha de Voucher', membros: 2, data: '30/04' },
      { tags: ['AJUSTE LEGAL', 'JURIDICO'], title: 'Alteração de Termos', membros: 1, data: '30/06' },
      { tags: ['JURIDICO', 'MELHORIA'], title: 'Atualização de Normas de utilização', membros: 3, data: '30/06' },
      { tags: [], title: 'Ajustes modulo imovel', membros: 0, data: '17/07' },
      { tags: ['INTEGRAÇÃO', 'CLASSPASS', 'SPIDERKICK'], title: 'Integração ClassPass', membros: 1, data: '24/07' },
    ],
  },
  {
    key: 'desenvolvimento', label: 'Desenvolvimento', color: '#b8860b',
    items: [
      { tags: ['MELHORIA'], title: 'Adicionar o atalho de acesso a Extranet na Tela Principal', membros: 2, data: '27/04' },
      { tags: [], title: 'Migração conciliador Cielo para F360', membros: 1, data: '31/07' },
      { tags: ['MARKETING', 'MELHORIA', 'IMPLANTAÇÃO'], title: 'Dashboard CAC', membros: 2, data: '31/07' },
      { tags: ['META'], title: 'APP', membros: 3, data: '31/08' },
      { tags: ['META', 'DIRETORIA'], title: 'Novo modelo de vendas', membros: 5, data: '30/09' },
      { tags: ['CERTIFICAÇÃO'], title: 'Certificação PCI', membros: 4, data: '30/09' },
    ],
  },
  {
    key: 'teste', label: 'Teste', color: '#8a6a2f',
    items: [
      { tags: [], title: 'CRM Implantação - Ultra Friday', membros: 1, data: '24/06' },
      { tags: ['MELHORIA', 'DIRETORIA'], title: 'Dashboard Wellhub', membros: 1, data: '30/06' },
      { tags: [], title: 'Mudar o prazo da Diária', membros: 2, data: '' },
    ],
  },
  {
    key: 'piloto', label: 'Piloto', color: '#a67c00',
    items: [],
  },
  {
    key: 'entregue', label: 'Entregue', color: '#6b8e23',
    items: [
      { tags: [], title: 'DASH controle de VIPs Unidade', membros: 1, data: '02/07' },
      { tags: [], title: 'Dashboard Relacionamentos', membros: 1, data: '19/06' },
      { tags: ['SPIDERKICK'], title: 'Mudar os créditos de Spider para valer em todos os Studios', membros: 1, data: '01/06' },
      { tags: ['TRAINING', 'MELHORIA'], title: 'Melhoria no Dashboard Training', membros: 2, data: '' },
      { tags: ['MELHORIA'], title: 'Inclusão de documentos na Observação', membros: 1, data: '25/05' },
      { tags: [], title: 'Melhorias CRM Relacionamentos', membros: 1, data: '' },
      { tags: ['BACKLOG'], title: 'Remover Alunos sem Treino - Dashboard', membros: 1, data: '' },
    ],
  },
];

const MESES_ABREV: Record<string, string> = { '01': 'JAN', '02': 'FEV', '03': 'MAR', '04': 'ABR', '05': 'MAI', '06': 'JUN', '07': 'JUL', '08': 'AGO', '09': 'SET', '10': 'OUT', '11': 'NOV', '12': 'DEZ' };

const flattenEntregas = (colunas: typeof ENTREGAS_COLUNAS_MOCK) =>
  colunas.flatMap((coluna) =>
    coluna.items.map((item) => ({ ...item, colunaKey: coluna.key, colunaLabel: coluna.label, colunaColor: coluna.color }))
  );

const buildRoadmapPorMes = (flat: ReturnType<typeof flattenEntregas>) => {
  const grupos: Record<string, typeof flat> = {};
  flat.forEach((item) => {
    if (!item.data) return;
    const mesNum = item.data.split('/')[1];
    const mesLabel = MESES_ABREV[mesNum] || mesNum;
    if (!grupos[mesLabel]) grupos[mesLabel] = [];
    grupos[mesLabel].push(item);
  });
  const ordem = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  return ordem.filter((m) => grupos[m]).map((m) => ({ mes: m, items: grupos[m] }));
};

const buildPipelineSaude = (colunas: typeof ENTREGAS_COLUNAS_MOCK, totalFlat: number) =>
  colunas.map((c) => ({
    key: c.key, label: c.label, color: c.color, count: c.items.length,
    pct: Math.round((c.items.length / (totalFlat || 1)) * 100),
  }));

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
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = max > 0 ? clampedValue / max : 0;

  return (
    <div className="relative w-full max-w-[200px] aspect-[5/6] overflow-hidden flex flex-col items-center justify-center">
      <img src="/AMPULHETA.png" alt="" className="w-full h-full object-contain drop-shadow-lg" />
      <div
        className="absolute bottom-[6%] left-1/2 -translate-x-1/2 h-[1.5%] rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${18 + percentage * 46}%`, backgroundColor: color, opacity: 0.55, filter: 'blur(3px)' }}
      />
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
      className={`relative border-2 rounded-3xl p-6 flex flex-col items-center justify-between text-center shadow-md transition-all duration-700 group overflow-hidden ${onClick ? 'cursor-pointer active:scale-95' : ''} ${isUrgent ? 'border-red-500 animate-pulse' : 'border-slate-700 hover:border-[#d4af37]/30'} ${className}`}
    >
      <div style={{ color: isUrgent ? '#ef4444' : color }} className={`w-full flex justify-center transition-all duration-700`}>
        {isTMA ? <Gauge value={gaugeValue!} max={gaugeMax} color={isUrgent ? '#ef4444' : color} /> : <div className={`group-hover:scale-110 transition-transform mb-6 mt-4 ${isUrgent ? 'animate-bounce' : ''}`}>{icon}</div>}
      </div>
      <div className="flex flex-col items-center mt-auto w-full">
        <span className={`text-[12px] font-black uppercase tracking-[0.2em] mb-3 leading-tight px-4 ${isUrgent ? 'text-red-400' : 'text-slate-400'} select-none`}>{label}</span>
        <span className={`font-black tracking-tighter leading-none whitespace-nowrap px-2 ${String(value).length > 5 ? 'text-5xl' : String(value).length > 4 ? 'text-6xl' : 'text-7xl'}`} style={{ color: isUrgent ? '#ef4444' : color, fontFamily: "'Cinzel', serif" }}>{value}</span>
      </div>
      {trend && <span className={`mt-4 mb-2 text-[11px] font-bold px-4 py-1.5 rounded-full ${isUrgent ? 'bg-red-900 text-red-300' : 'text-[#d4af37] bg-[#d4af37]/5'}`}>{trend}</span>}
      {!trend && <div className="h-4" />}
    </div>
  );
};

const AgentShowcaseCard: React.FC<{ agent: any, rank: number }> = ({ agent, rank }) => {
  const config = AGENTES_CONFIG.find(c => c.id === agent.agente);

  return (
    <div className="relative bg-slate-800/60 backdrop-blur-md border-2 border-[#8a6a2f]/50 rounded-3xl p-8 flex flex-col justify-between shadow-xl overflow-hidden group transition-all duration-700 h-full">
      <div className="absolute inset-0 pointer-events-none transition-all duration-700">
        {config?.avatar ? <img src={config.avatar} alt="" className="w-full h-full object-cover scale-110" style={{ opacity: CONFIG.AVATAR_OPACITY }} /> : (
          <div className="absolute -top-12 -right-12 grayscale" style={{ opacity: CONFIG.AVATAR_FALLBACK_OPACITY }}><User size={280} className="text-slate-500" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-slate-900/40" />
      </div>

      <div className="z-10 flex items-start justify-between gap-3">
        <h2 className="text-4xl font-black text-slate-100 tracking-tight leading-tight uppercase truncate drop-shadow-sm">{config?.displayName || agent.agente}</h2>
        <span className="text-5xl font-black leading-none tracking-tighter text-[#d4af37] tabular-nums shrink-0 group-hover:scale-105 transition-transform duration-700" style={{ fontFamily: "'Cinzel', serif" }}>
          {agent.encerrados}
        </span>
      </div>

      <div className="z-10 mt-6 w-full space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-[#8a6a2f]/50" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Atividade Recente</span>
          <div className="h-px flex-1 bg-[#8a6a2f]/50" />
        </div>
        <div className="space-y-1.5">
          {agent.recentTickets && agent.recentTickets.length > 0 ? (
            agent.recentTickets.map((t: any, idx: number) => (
              <div key={idx} className="bg-slate-900/60 backdrop-blur-sm border border-[#8a6a2f]/40 rounded-xl p-2.5 flex flex-col group/row hover:bg-slate-900 hover:shadow-sm transition-all overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <div className="bg-slate-950 text-[#d4af37] text-[9px] font-black px-1.5 py-0.5 rounded italic transform -skew-x-12 shrink-0">#{t.id}</div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">CRIADO: {t.criado}</div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold text-slate-200 truncate leading-tight flex-1">{t.subject}</span>
                  <div className="text-[10px] font-black text-[#d4af37] tabular-nums shrink-0">{t.hora}</div>
                </div>
                <div className="text-[8px] font-black text-[#d4af37] uppercase mt-1 opacity-80">{t.status}</div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Aguardando Missão...</div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full flex h-2 overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${rank === 1 ? 'w-[100%] bg-[#d4af37]' : rank === 2 ? 'w-[80%] bg-[#d4af37]/70' : rank === 3 ? 'w-[60%] bg-[#d4af37]/40' : 'w-[40%] bg-[#d4af37]/20'}`} />
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ label: string, value: number, icon: React.ReactNode, color: string, isUrgent?: boolean }> = ({ label, value, icon, color, isUrgent }) => (
  <div className={`border ${isUrgent ? 'border-red-400 shadow-red-950 shadow-xl' : 'border-slate-700'} rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden h-full transition-all duration-700`}>
    <div className="flex justify-between items-start">
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <div style={{ color }} className={`opacity-70 ${isUrgent ? 'animate-bounce' : ''}`}>{icon}</div>
    </div>
    <div className={`text-6xl font-black leading-none ${isUrgent ? 'animate-pulse' : ''}`} style={{ color, fontFamily: "'Cinzel', serif" }}>{value}</div>
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
  const [currentView, setCurrentView] = useState(3); // Alterado para 3 (Níveis de Atendimento)
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
  const [joaoTicketsCount, setJoaoTicketsCount] = useState(0);
  const [rafaelTicketsCount, setRafaelTicketsCount] = useState(0);
  const [rubensTicketsCount, setRubensTicketsCount] = useState(0);
  const [showForaPrazoModal, setShowForaPrazoModal] = useState(false);
  const [entregasColunas, setEntregasColunas] = useState(ENTREGAS_COLUNAS_MOCK);
  const [entregasIsMock, setEntregasIsMock] = useState(true);
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

    // Toca o som de notificação (Agora usando o arquivo local alerta.mp3)
    try {
      const audioPath = window.location.origin + '/alerta.mp3';
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
        const recentTicketsData = ticketsData.slice(0, 1);

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

      // --- LOGICA CHAMADOS DO JOAO (NIVEL 1) ---
      const filterJoao = encodeURIComponent("owner/businessName eq 'JOAO GUILHERME FIGUEIREDO' and status ne 'Resolvido' and status ne 'Cancelado' and status ne 'Fechado'");
      const joaoUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id&$filter=${filterJoao}`;
      const joaoData = await fetchJson(joaoUrl);
      if (Array.isArray(joaoData)) {
        setJoaoTicketsCount(joaoData.length);
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
    const plannerRt = setInterval(fetchPlannerData, CONFIG.REFRESH_MS);
    const npsRt = setInterval(fetchNpsData, CONFIG.NPS_REFRESH_MS);
    const pageRt = setInterval(() => window.location.reload(), CONFIG.PAGE_REFRESH_MS);

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
      clearInterval(plannerRt);
      clearInterval(npsRt);
      clearInterval(pageRt);
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

  const fetchPlannerData = async () => {
    try {
      const res = await fetch('/api/planner');
      if (!res.ok) {
        console.error('[Planner Debug] Resposta não OK:', res.status);
        return;
      }
      const data = await res.json();
      if (data.error) {
        console.error('[Planner Debug] Erro da API:', data.error);
        return;
      }

      const { tasks, buckets } = data;
      if (!Array.isArray(tasks) || !Array.isArray(buckets)) return;

      const bucketOrder = buckets.map((b: any) => b.id);
      const bucketMap: Record<string, { id: string; name: string }> = {};
      buckets.forEach((b: any) => { bucketMap[b.id] = b; });

      const colunasMap: Record<string, { key: string; label: string; color: string; items: any[] }> = {};
      bucketOrder.forEach((bId: string, idx: number) => {
        colunasMap[bId] = {
          key: bId,
          label: bucketMap[bId]?.name || 'Sem nome',
          color: COLUNA_CORES[idx % COLUNA_CORES.length],
          items: [],
        };
      });

      tasks.forEach((t: any) => {
        const bId = t.bucketId;
        if (!colunasMap[bId]) {
          colunasMap[bId] = { key: bId, label: 'Outros', color: COLUNA_CORES[0], items: [] };
        }
        let dataFormatada = '';
        if (t.dueDateTime) {
          const d = new Date(t.dueDateTime);
          const pad = (n: number) => String(n).padStart(2, '0');
          dataFormatada = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
        }
        colunasMap[bId].items.push({
          tags: [],
          title: t.title,
          membros: Object.keys(t.assignments || {}).length,
          data: dataFormatada,
        });
      });

      const novasColunas = bucketOrder.map((bId: string) => colunasMap[bId]);
      setEntregasColunas(novasColunas);
      setEntregasIsMock(false);
    } catch (e) {
      console.error('[Planner Debug] Erro ao buscar dados do Planner:', e);
    }
  };

  const sortedAgentes = useMemo(() => [...agentes].sort((a, b) => b.encerrados - a.encerrados), [agentes]);
  const entregasFlat = useMemo(() => flattenEntregas(entregasColunas), [entregasColunas]);
  const roadmapPorMes = useMemo(() => buildRoadmapPorMes(entregasFlat), [entregasFlat]);
  const pipelineSaude = useMemo(() => buildPipelineSaude(entregasColunas, entregasFlat.length), [entregasColunas, entregasFlat]);
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
      className="flex flex-col h-screen w-screen p-4 space-y-4 overflow-hidden bg-slate-950 text-slate-100 relative touch-pan-y bg-cover bg-center bg-no-repeat"
      style={currentView === 0 ? { backgroundImage: 'url(/FUNDO1.png)' } : currentView === 1 ? { backgroundImage: 'url(/FUNDO2.png)' } : currentView === 2 ? { backgroundImage: 'url(/FUNDO3.png)' } : currentView === 3 ? { backgroundImage: 'url(/FUNDO4.png)' } : currentView === 4 ? { backgroundImage: 'url(/FUNDO5.jpg)' } : currentView === 5 ? { backgroundImage: 'url(/FUNDO6.jpg)' } : undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <header className="flex justify-between items-center shrink-0 h-20">
        <div className="flex items-center gap-6">
          <img src={LOGO_URL} alt="Ultra" className="h-16 w-auto" />
          <div className="h-12 w-px bg-slate-700" />
          <div>
            <h1 className="text-2xl font-black uppercase leading-none" style={{ fontFamily: "'Cinzel', serif" }}>
              {currentView === 0 ? 'Visão Geral do Suporte' : currentView === 1 ? 'Produtividade por Operador' : currentView === 2 ? 'Satisfação do Cliente (NPS)' : currentView === 3 ? 'Níveis de Atendimento' : currentView === 4 ? 'Entregas' : 'Cronograma'}
            </h1>
            <div className="flex items-center gap-4 mt-1.5 text-sm font-bold text-slate-400">
              <span className={isOffline ? 'text-red-500 font-black' : 'text-[#d4af37]'}>{isOffline ? 'DESCONECTADO' : 'CONECTADO AO MOVIDESK'}</span>
              <span>|</span>
              <span>Atualizado há {diffSeconds}s</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div
            onClick={() => { setCurrentView((v) => (v + 1) % 6); setCarouselTimer(20); }}
            className="inline-flex items-center justify-between gap-4 px-5 py-3 min-w-[230px] bg-slate-800 rounded-full shadow-[0_8px_18px_rgba(0,0,0,0.3)] select-none cursor-pointer active:scale-95 transition-transform"
            title="Clique para trocar de tela"
          >
            <div className="flex flex-col leading-none">
              <span className="text-[10px] tracking-[0.12em] font-bold text-[#b8a06a] mb-1.5 font-sans whitespace-nowrap">PRÓXIMA TELA</span>
              <div className="text-[26px] font-black text-[#d4af37] font-sans -mt-0.5">
                <span className="tabular-nums">{carouselTimer}</span><span className="text-xl">s</span>
              </div>
            </div>
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(212,175,55,0.18)" strokeWidth="5.5" />
                <circle
                  cx="22" cy="22" r="18"
                  fill="none"
                  stroke="#d4af37"
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
            className="text-6xl font-black text-[#d4af37] tabular-nums tracking-tighter cursor-pointer hover:opacity-70 transition-opacity"
            style={{ fontFamily: "'Cinzel', serif" }}
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
              <KpiCard label="Pendentes" value={resumo.pendentes} icon={<img src="/ELMO.png" alt="" style={{ height: 80, width: 'auto', objectFit: 'contain' }} />} color="#c9a35a" />
              <KpiCard label="Novos" value={resumo.novos} icon={<img src="/PAPIRO.png" alt="" style={{ height: 70, width: 'auto', objectFit: 'contain' }} />} color="#d4af37" />
              <KpiCard label="Em Atendimento" value={resumo.em_atendimento} icon={<img src="/ANCORA.png" alt="" style={{ height: 70, width: 'auto', objectFit: 'contain' }} />} color="#8a6a2f" />
              <KpiCard label="Parados" value={resumo.parados} icon={<img src="/ampulhetagrega.png" alt="" style={{ height: 70, width: 'auto', objectFit: 'contain' }} />} color="#b8860b" />
              <KpiCard label="Vencidos" value={resumo.vencidos.venceram} icon={<img src="/ESPADAS.png" alt="" style={{ height: 70, width: 'auto', objectFit: 'contain' }} />} color="#ef4444" isUrgent={resumo.vencidos.venceram > 0} />
            </div>
            <div className="flex-1 min-h-0 grid grid-cols-5 gap-6">
              <MetricCard label="Chamados no Mês" value={resumo.abertos_mes} icon={<CalendarDays size={48} />} color="#c9a35a" onClick={playBellSound} />
              <MetricCard label="Fora do Prazo" value={resumo.fora_prazo} icon={<History size={48} />} color="#ef4444" onClick={() => { setShowForaPrazoModal(true); setTimeout(() => setShowForaPrazoModal(false), 10000); }} />
              <MetricCard label="Abertos Hoje" value={resumo.abertos_hoje} icon={<TrendingUp size={48} />} color="#b8860b" />
              <div className="flex flex-col gap-6">
                <MetricCard className="flex-1" label="TMA 1ª Resp Hoje" value={resumo.media_primeira_resposta_dia} color="#d4af37" gaugeValue={resumo.media_primeira_resposta_dia_raw} gaugeMax={60} isUrgent={resumo.media_primeira_resposta_dia_raw > 60} />
                <MetricCard className="flex-1" label="TMA 1ª Resp Mês" value={resumo.media_primeira_resposta_mes} color="#d4af37" gaugeValue={resumo.media_primeira_resposta_mes_raw} gaugeMax={60} isUrgent={resumo.media_primeira_resposta_mes_raw > 60} />
              </div>
              <div className="flex flex-col gap-6">
                <MetricCard className="flex-1" label="TMA Solução Hoje" value={resumo.media_solucao_dia} color="#d4af37" gaugeValue={resumo.media_solucao_dia_raw} gaugeMax={240} isUrgent={resumo.media_solucao_dia_raw > 120} />
                <MetricCard className="flex-1" label="TMA Solução Mês" value={resumo.media_solucao_mes} color="#d4af37" gaugeValue={resumo.media_solucao_mes_raw} gaugeMax={240} isUrgent={resumo.media_solucao_mes_raw > 120} />
              </div>
            </div>
          </div>

          {/* VIEW 1: Agentes */}
          <div className="min-w-full h-full p-1 overflow-y-auto flex items-stretch justify-center gap-6 px-12">
            {sortedAgentes.slice(0, 5).map((ag, idx) => (
              <div key={idx} className="w-full max-w-[360px]">
                <AgentShowcaseCard agent={ag} rank={idx + 1} />
              </div>
            ))}
          </div>

          {/* VIEW 2: NPS */}
          <div className="min-w-full h-full p-1 overflow-hidden flex flex-row gap-4">

            {/* Coluna Esquerda */}
            <div className="flex flex-col gap-3 flex-1 min-w-0">
              {/* Título */}
              <div className="flex flex-col items-center shrink-0 pt-1">
                <div className="flex items-center gap-4">
                  <span className="text-2xl text-[#d4af37] opacity-70">&#10230;</span>
                  <h1 className="text-3xl font-black uppercase tracking-[0.15em] text-[#d4af37] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" style={{ fontFamily: "'Cinzel', serif" }}>A Jornada Até Ítaca</h1>
                  <span className="text-2xl text-[#d4af37] opacity-70 scale-x-[-1]">&#10230;</span>
                </div>
                <p className="text-xs text-slate-400 italic mt-1">Cada chamada atendida é um passo a mais na nossa Odisseia.</p>
              </div>

              {/* Cards de Rating (formato carta) */}
              <div className="grid grid-cols-5 gap-3 flex-1 min-h-0">
                {[
                  { key: 'pessimo', label: 'Péssimo', icon: '⚡', img: '/PESSIMO.png', zoom: true },
                  { key: 'ruim', label: 'Ruim', icon: '🌧️', img: '/RUIM.png', zoom: true },
                  { key: 'regular', label: 'Regular', icon: '🧭', img: '/REGULAR.png', zoom: true },
                  { key: 'bom', label: 'Bom', icon: '⛵', img: '/BOM.png', zoom: false },
                  { key: 'otimo', label: 'Ótimo', icon: '🏛️', img: '/OTIMO.png', zoom: false },
                ].map((c) => (
                  <div key={c.key} className="col-span-1 rounded-2xl flex flex-col items-center justify-between text-white shadow-xl relative overflow-hidden bg-black border-2 border-[#8a6a2f]">
                    <div className="absolute inset-0 bg-black">
                      <img src={c.img} alt={c.label} className={`w-full h-full object-cover ${c.zoom ? 'scale-125' : ''}`} />
                    </div>
                    <div className="relative z-10 mt-3 w-9 h-9 rounded-full bg-black/60 border border-[#d4af37] flex items-center justify-center text-lg shadow-[0_0_8px_rgba(212,175,55,0.5)]">
                      {c.icon}
                    </div>
                    <div className="relative z-10 flex flex-col items-center mb-3 bg-black/50 backdrop-blur-sm rounded-xl px-2 py-2 w-[92%]">
                      <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#d4af37] mb-1">{c.label}</span>
                      <span className="text-3xl font-black text-white leading-none" style={{ fontFamily: "'Cinzel', serif" }}>{(npsStats as any)[c.key]}</span>
                      <div className="mt-1 text-xs font-bold text-[#c9a35a]">{(((npsStats as any)[c.key] / npsStats.total || 0) * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trilha da Jornada */}
              <div className="grid grid-cols-5 gap-3 shrink-0 relative px-2 py-2">
                <div className="absolute left-[10%] right-[10%] top-[17px] h-[2px] bg-gradient-to-r from-[#8a6a2f] via-[#d4af37] to-[#8a6a2f] opacity-70" />
                {[
                  { title: 'ILHA DA TEMPESTADE', desc: 'Os desafios nos fortalecem.' },
                  { title: 'MAR REVOLTO', desc: 'Persistimos mesmo nas adversidades.' },
                  { title: 'MAR ABERTO', desc: 'Seguimos em frente, sempre aprendendo.' },
                  { title: 'AVISTANDO ÍTACA', desc: 'A vitória está próxima, o caminho clareia.' },
                  { title: 'CHEGADA EM ÍTACA', desc: 'Missão cumprida! Voltamos para casa.' },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center text-center relative z-10">
                    <div className="w-5 h-5 rounded-full bg-[#0f0f0f] border-2 border-[#d4af37] shadow-[0_0_6px_rgba(212,175,55,0.6)]" />
                    <span className="mt-2 text-sm font-black uppercase tracking-[0.1em] text-[#d4af37]">{s.title}</span>
                    <span className="text-xs text-slate-300 leading-snug px-1 mt-0.5">{s.desc}</span>
                  </div>
                ))}
              </div>

              {/* Linha de métricas */}
              <div className="grid grid-cols-3 gap-4 h-32 shrink-0">
                {/* Tickets Encerrados */}
                <div className="bg-slate-900 rounded-3xl p-6 flex items-center justify-between shadow-lg border border-[#8a6a2f]/40 relative overflow-hidden">
                  <div className="absolute left-0 bottom-0 top-0 w-2 bg-[#c9a35a]" />
                  <div className="flex flex-col ml-4">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Tickets Encerrados</span>
                    <span className="text-5xl font-black text-slate-100" style={{ fontFamily: "'Cinzel', serif" }}>{npsStats.encerrados}</span>
                  </div>
                  <div className="pr-4"><img src="/PAPIRO.png" alt="" style={{ height: 48, width: 'auto', objectFit: 'contain' }} /></div>
                </div>
                {/* Usuários que Responderam */}
                <div className="bg-slate-900 rounded-3xl p-6 flex items-center justify-between shadow-lg border border-[#8a6a2f]/40 relative overflow-hidden">
                  <div className="absolute left-0 bottom-0 top-0 w-2 bg-[#d4af37]" />
                  <div className="flex flex-col ml-4">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Usuários que Responderam</span>
                    <span className="text-5xl font-black text-[#d4af37]" style={{ fontFamily: "'Cinzel', serif" }}>{npsStats.total}</span>
                  </div>
                  <div className="pr-4"><img src="/ELMO.png" alt="" style={{ height: 48, width: 'auto', objectFit: 'contain' }} /></div>
                </div>
                {/* Usuários S/ Resposta */}
                <div className="bg-slate-900 rounded-3xl p-6 flex items-center justify-between shadow-lg border border-slate-700 relative overflow-hidden">
                  <div className="absolute left-0 bottom-0 top-0 w-2 bg-[#ef4444]" />
                  <div className="flex flex-col ml-4">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Usuários S/ Resposta</span>
                    <span className="text-5xl font-black text-red-500" style={{ fontFamily: "'Cinzel', serif" }}>{npsStats.encerrados - npsStats.total > 0 ? npsStats.encerrados - npsStats.total : 0}</span>
                  </div>
                  <div className="pr-4"><img src="/ESPADAS.png" alt="" style={{ height: 48, width: 'auto', objectFit: 'contain' }} /></div>
                </div>
              </div>
            </div>{/* fim coluna esquerda */}

            {/* Coluna Direita: Lista de últimos NPS respondidos */}
            <div className="w-80 shrink-0 flex flex-col gap-3">
              <div className="flex items-center justify-between px-1 shrink-0">
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Últimos Respondidos</h2>
                <span className="text-xs font-bold bg-slate-800 text-slate-400 px-3 py-1 rounded-full">{npsRecentTickets.length}</span>
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
                    ? { bg: 'bg-red-950', border: 'border-red-800', badge: 'bg-red-500', text: 'text-red-400' }
                    : ticket.nota === 3
                      ? { bg: 'bg-yellow-950', border: 'border-yellow-800', badge: 'bg-yellow-500', text: 'text-yellow-400' }
                      : { bg: 'bg-teal-950', border: 'border-teal-800', badge: 'bg-teal-500', text: 'text-teal-400' };
                  const op = ticket.operador.toLowerCase().trim();
                  const agente = AGENTES_CONFIG.find(a => {
                    const id = (a.id || '').toLowerCase();
                    const display = (a.displayName || '').toLowerCase();
                    const full = (a.fullName || '').toLowerCase();
                    return op === id || op === display || op === full ||
                      op.includes(id) || op.includes(display) ||
                      id.includes(op) || display.includes(op) || full.includes(op);
                  });
                  const ringColor = ticket.nota <= 2 ? 'ring-red-400' : ticket.nota === 3 ? 'ring-yellow-400' : 'ring-teal-400';
                  const accentColor = ticket.nota <= 2 ? '#ef4444' : ticket.nota === 3 ? '#eab308' : '#2fabab';
                  return (
                    <div key={ticket.id} className={`flex-1 rounded-2xl border-2 ${notaColor.border} ${notaColor.bg} px-4 py-3 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-200 hover:shadow-md`}>
                      <div className="absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl" style={{ background: accentColor }} />
                      {/* Operador + Nota */}
                      <div className="flex items-center gap-3 ml-2">
                        {agente?.avatar ? (
                          <img src={agente.avatar} alt={agente.displayName || ticket.operador}
                            className={`w-14 h-14 rounded-full object-cover ring-2 ${ringColor} shadow-md shrink-0`} />
                        ) : (
                          <div className={`w-14 h-14 rounded-full bg-slate-700 ring-2 ${ringColor} flex items-center justify-center shrink-0 shadow-md`}>
                            <span className="text-base font-black text-slate-300">{ticket.operador.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div className="flex flex-col min-w-0 flex-1 gap-1">
                          <span className="text-sm font-black text-slate-100 truncate">{agente?.displayName || ticket.operador}</span>
                          <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full text-white w-fit ${notaColor.badge}`}>{notaLabel}</span>
                        </div>
                      </div>
                      {/* Chamado + Data */}
                      <div className="flex items-center justify-between ml-2 mt-1">
                        <span className="text-xs font-black text-slate-300 bg-slate-700 px-2 py-0.5 rounded-md tracking-wide">#{ticket.id}</span>
                        <span className="text-xs text-slate-400 font-semibold">{ticket.data}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* VIEW 3: Níveis de Atendimento */}
          <div className="min-w-full h-full p-1 overflow-y-auto">
            <div className="relative h-full rounded-3xl overflow-hidden border-2 border-[#8a6a2f]/50">
              {/* Trilha conectora (sobre o mapa do FUNDO4) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="10" y1="52" x2="90" y2="52" stroke="#d4af37" strokeWidth="0.3" strokeDasharray="1.5 1.5" opacity="0.6" />
              </svg>

              <div className="relative z-10 grid grid-cols-5 h-full divide-x divide-[#8a6a2f]/40">

                {/* Coluna Nível 1 */}
                <div className="flex flex-col items-center px-4 py-6">
                  <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase text-center" style={{ fontFamily: "'Cinzel', serif" }}>Nível 1</h2>
                  <p className="text-sm text-slate-300 text-center mt-2 leading-snug">Atendimento inicial e resolução imediata.</p>

                  <div className="flex-1 flex flex-col justify-center gap-4 w-full mt-4">
                    {[
                      { name: 'JOAO', count: joaoTicketsCount },
                      { name: 'MATHEUS', count: 0 },
                      { name: 'Carnaval', count: carnavalTicketsCount },
                    ].map((entry, idx) => {
                      const agentConfig = AGENTES_CONFIG.find(c => c.displayName === entry.name || c.id === entry.name);
                      const displayName = agentConfig?.displayName || entry.name;
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1.5">
                          <div className="w-24 h-24 rounded-full border-4 border-[#d4af37] shadow-[0_0_14px_rgba(212,175,55,0.5)] overflow-hidden bg-slate-800 flex items-center justify-center">
                            {agentConfig?.avatar ? (
                              <img src={agentConfig.avatar} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-black text-slate-400 text-sm">{displayName.charAt(0)}</span>
                            )}
                          </div>
                          <span className="text-xs font-black text-slate-200 uppercase tracking-tight">{displayName}</span>
                          <div className="bg-[#d4af37] text-slate-950 px-3 py-0.5 rounded-full text-sm font-black shadow-sm min-w-[32px] text-center" style={{ fontFamily: "'Cinzel', serif" }}>
                            {entry.count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coluna Nível 2 */}
                <div className="flex flex-col items-center px-4 py-6">
                  <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase text-center" style={{ fontFamily: "'Cinzel', serif" }}>Nível 2</h2>
                  <p className="text-sm text-slate-300 text-center mt-2 leading-snug">Análise e investigação. Busca da melhor solução.</p>

                  <div className="flex-1 flex flex-col justify-center items-center gap-2">
                    {(() => {
                      const agentConfig = AGENTES_CONFIG.find(c => c.displayName === 'Rafael');
                      return (
                        <>
                          <div className="w-28 h-28 rounded-full border-4 border-[#c9a35a] shadow-[0_0_16px_rgba(201,163,90,0.5)] overflow-hidden bg-slate-800 flex items-center justify-center">
                            {agentConfig?.avatar ? (
                              <img src={agentConfig.avatar} alt="Rafael" className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-black text-slate-400 text-2xl">R</span>
                            )}
                          </div>
                          <span className="text-sm font-black text-slate-200 uppercase tracking-tight mt-1">Rafael</span>
                          <div className="bg-[#c9a35a] text-slate-950 px-4 py-1 rounded-full text-xl font-black shadow-sm min-w-[44px] text-center" style={{ fontFamily: "'Cinzel', serif" }}>
                            {rafaelTicketsCount}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Coluna Nível 3 */}
                <div className="flex flex-col items-center px-4 py-6">
                  <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase text-center" style={{ fontFamily: "'Cinzel', serif" }}>Nível 3</h2>
                  <p className="text-sm text-slate-300 text-center mt-2 leading-snug">Solução especializada. Ação para resolução do chamado.</p>

                  <div className="flex-1 flex flex-col justify-center items-center gap-2">
                    {(() => {
                      const agentConfig = AGENTES_CONFIG.find(c => c.id === 'Rubens' || c.displayName === 'Rubão');
                      const displayName = agentConfig?.displayName || 'Rubão';
                      return (
                        <>
                          <div className="w-28 h-28 rounded-full border-4 border-[#8a6a2f] shadow-[0_0_16px_rgba(138,106,47,0.5)] overflow-hidden bg-slate-800 flex items-center justify-center">
                            {agentConfig?.avatar ? (
                              <img src={agentConfig.avatar} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-black text-slate-400 text-2xl">{displayName.charAt(0)}</span>
                            )}
                          </div>
                          <span className="text-sm font-black text-slate-200 uppercase tracking-tight mt-1">{displayName}</span>
                          <div className="bg-[#8a6a2f] text-slate-100 px-4 py-1 rounded-full text-xl font-black shadow-sm min-w-[44px] text-center" style={{ fontFamily: "'Cinzel', serif" }}>
                            {rubensTicketsCount}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Coluna Liberação de Versão */}
                <div className="flex flex-col items-center px-4 py-6">
                  <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase text-center leading-none" style={{ fontFamily: "'Cinzel', serif" }}>Lib. Versão</h2>
                  <p className="text-sm text-slate-300 text-center mt-2 leading-snug">Validação e liberação. Preparação para encerramento.</p>

                  <div className="flex-1 flex flex-col justify-center items-center gap-2">
                    <div className="w-24 h-24 rounded-full border-4 border-[#b8860b] shadow-[0_0_16px_rgba(184,134,11,0.5)] bg-[#b8860b]/20 flex items-center justify-center">
                      <span className="text-2xl font-black text-[#b8860b]" style={{ fontFamily: "'Cinzel', serif" }}>LV</span>
                    </div>
                    <span className="text-sm font-black text-slate-200 uppercase tracking-tight mt-1">Lib. Versão</span>
                    <div className="bg-[#b8860b] text-slate-950 px-4 py-1 rounded-full text-xl font-black shadow-sm min-w-[44px] text-center" style={{ fontFamily: "'Cinzel', serif" }}>
                      {chamadosLiberacao.length}
                    </div>
                  </div>
                </div>

                {/* Coluna Enotas */}
                <div className="flex flex-col items-center px-4 py-6">
                  <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase text-center" style={{ fontFamily: "'Cinzel', serif" }}>Enotas</h2>
                  <p className="text-sm text-slate-300 text-center mt-2 leading-snug">Escalonamento. Casos críticos e urgentes.</p>

                  <div className="flex-1 flex flex-col justify-center items-center gap-2">
                    <div className="w-28 h-28 rounded-full border-4 border-[#a67c00] shadow-[0_0_16px_rgba(166,124,0,0.5)] overflow-hidden bg-[#a67c00]/20 flex items-center justify-center">
                      <span className="font-black text-slate-400 text-2xl">E</span>
                    </div>
                    <span className="text-sm font-black text-slate-200 uppercase tracking-tight mt-1">Enotas</span>
                    <div className="bg-[#a67c00] text-slate-950 px-4 py-1 rounded-full text-xl font-black shadow-sm min-w-[44px] text-center" style={{ fontFamily: "'Cinzel', serif" }}>
                      {chamadosEnotas.length}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* VIEW 4: Entregas */}
          <div className="min-w-full h-full p-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <div className="w-1 h-5 bg-[#d4af37] rounded-full" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">Pipeline de Desenvolvimento</span>
              <span className="ml-auto text-xs font-bold text-slate-500">{entregasColunas.reduce((acc, c) => acc + c.items.length, 0)} itens</span>
            </div>
            <div className="flex-1 min-h-0 grid grid-cols-6 gap-3">
              {entregasColunas.map((coluna) => (
                <div key={coluna.key} className="flex flex-col border border-[#8a6a2f]/40 rounded-2xl overflow-hidden h-full">
                  <div className="flex items-center gap-2 px-3 py-3 border-b border-[#8a6a2f]/40 shrink-0">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: coluna.color }} />
                    <span className="text-[11px] font-black uppercase tracking-wide text-slate-200 flex-1 truncate">{coluna.label}</span>
                    <span className="text-[11px] font-black rounded-full px-2 py-0.5 min-w-[22px] text-center" style={{ backgroundColor: `${coluna.color}30`, color: coluna.color }}>{coluna.items.length}</span>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
                    {coluna.items.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-600 border-2 border-dashed border-slate-700 rounded-xl m-1">
                        <span className="text-xl">+</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">Nenhum item</span>
                      </div>
                    ) : (
                      coluna.items.map((item, idx) => (
                        <div key={idx} className="bg-slate-950/25 border rounded-xl p-2.5" style={{ borderColor: `${coluna.color}50` }}>
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {item.tags.map((tag, tIdx) => (
                                <span key={tIdx} className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: `${coluna.color}30`, color: coluna.color }}>{tag}</span>
                              ))}
                            </div>
                          )}
                          <div className="text-base font-bold text-slate-100 leading-snug mb-2">{item.title}</div>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                            <span>👤 {item.membros} membro{item.membros > 1 ? 's' : ''}</span>
                            {item.data && <span>{item.data}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VIEW 5: Cronograma */}
          <div className="min-w-full h-full p-1 overflow-hidden flex flex-col gap-3">

            {/* Roadmap de Entregas */}
            <div className="bg-slate-950/40 backdrop-blur-sm border border-[#8a6a2f]/40 rounded-3xl p-6 shrink-0">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-xs font-black flex items-center justify-center">2</span>
                <span className="text-sm font-black uppercase tracking-widest text-slate-200">Roadmap de Entregas</span>
              </div>
              <div className="relative">
                <div className="absolute left-0 right-0 top-[7px] h-[2px] bg-slate-700" />
                <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${roadmapPorMes.length}, minmax(0,1fr))` }}>
                  {roadmapPorMes.map((grupo, idx) => (
                    <div key={grupo.mes} className="relative flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-3.5 h-3.5 rounded-full border-2 ${idx === 1 ? 'bg-[#d4af37] border-[#d4af37]' : 'bg-slate-800 border-slate-600'}`} />
                        <span className={`text-xs font-black uppercase tracking-widest ${idx === 1 ? 'text-[#d4af37]' : 'text-slate-400'}`}>{grupo.mes}</span>
                      </div>
                      {idx === 1 && <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37] mb-2">Próximas Entregas</span>}
                      <div className="space-y-1.5">
                        {grupo.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.colunaColor }} />
                            <span className="truncate">{item.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-2 gap-3">
              {/* Próximas Entregas por Prazo */}
              <div className="bg-slate-950/40 backdrop-blur-sm border border-[#8a6a2f]/40 rounded-3xl p-6 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-4 shrink-0">
                  <span className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-xs font-black flex items-center justify-center">3</span>
                  <span className="text-sm font-black uppercase tracking-widest text-slate-200">Próximas Entregas por Prazo</span>
                </div>
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 shrink-0">
                  <span>Tarefa</span>
                  <span>Prazo</span>
                  <span>Status</span>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                  {entregasFlat.filter((i) => i.data).slice(0, 8).map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center py-1.5 border-b border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.tags[0] && (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: `${item.colunaColor}30`, color: item.colunaColor }}>{item.tags[0]}</span>
                        )}
                        <span className="text-xs font-bold text-slate-200 truncate">{item.title}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-400 tabular-nums">{item.data}</span>
                      <span className="text-xs font-black text-red-400 uppercase">Atrasado</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-2.5 flex items-center justify-between shrink-0">
                  <span className="text-xs font-black text-red-400">⏰ {entregasFlat.filter(i => i.data).length} entregas atrasadas</span>
                  <span className="text-[10px] font-black uppercase text-red-400">Atenção</span>
                </div>
              </div>

              {/* Saúde do Pipeline */}
              <div className="bg-slate-950/40 backdrop-blur-sm border border-[#8a6a2f]/40 rounded-3xl p-6 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-4 shrink-0">
                  <span className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-xs font-black flex items-center justify-center">4</span>
                  <span className="text-sm font-black uppercase tracking-widest text-slate-200">Saúde do Pipeline</span>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
                  <div className="rounded-2xl border border-slate-700 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-slate-100" style={{ fontFamily: "'Cinzel', serif" }}>{entregasFlat.length}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Total</span>
                  </div>
                  {pipelineSaude.map((p) => (
                    <div key={p.key} className="rounded-2xl border flex flex-col items-center justify-center" style={{ borderColor: `${p.color}50` }}>
                      <span className="text-4xl font-black" style={{ fontFamily: "'Cinzel', serif", color: p.color }}>{p.count}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{p.label}</span>
                      <span className="text-[10px] font-bold mt-0.5" style={{ color: p.color }}>{p.pct}%</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-2.5 flex items-center justify-between shrink-0">
                  <span className="text-xs font-black text-red-400">{entregasFlat.filter(i => i.data).length} Atrasadas</span>
                  <span className="text-[10px] text-red-400">Acompanhe as entregas no prazo!</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {activeNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4">
          <div className={`relative bg-slate-800/90 backdrop-blur-3xl border-4 rounded-[40px] p-12 flex flex-col items-center shadow-[0_32px_64px_rgba(0,0,0,0.4)] animate-nps-notification overflow-hidden max-w-2xl
                ${activeNotification.score && activeNotification.score <= 2 ? 'border-red-500 scale-105' :
              activeNotification.score && activeNotification.score >= 4 ? 'border-[#2fabab] animate-glow-positive' : 'border-slate-700'}`}
          >
            {/* Background Effects */}
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
                ${activeNotification.score && activeNotification.score <= 2 ? 'bg-red-500' : 'bg-[#2fabab]'}`} />
              <div className={`relative w-56 h-56 rounded-full border-4 overflow-hidden bg-slate-700 shadow-xl flex items-center justify-center
                ${activeNotification.score && activeNotification.score <= 2 ? 'border-red-500' : 'border-[#2fabab]'}`}>
                {activeNotification.avatar ? (
                  <img src={activeNotification.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[100px] font-black text-slate-300 select-none">
                    {(activeNotification.operator || 'O').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Trophy Icon for high scores */}
              {activeNotification.score && activeNotification.score >= 4 && (
                <div className="absolute -top-6 -right-6 bg-yellow-400 p-4 rounded-full shadow-lg border-4 border-slate-800 animate-bounce z-20">
                  <Trophy size={40} className="text-white" fill="white" />
                </div>
              )}

              {/* Badge de Nota */}
              {activeNotification.score && (
                <div className={`absolute -bottom-4 right-0 w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-lg border-4 border-slate-800
                  ${activeNotification.score <= 2 ? 'bg-red-500' : activeNotification.score >= 4 ? 'bg-[#2fabab]' : 'bg-slate-400'}`}>
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
              <p className="text-7xl font-black text-slate-100 uppercase tracking-tighter leading-none mb-4">
                {activeNotification.operator}
              </p>
              <div className="flex items-center justify-center gap-4">
                {activeNotification.score && (
                  <p className={`text-xl font-black uppercase tracking-widest px-8 py-2 rounded-full inline-block
                    ${activeNotification.score <= 2 ? 'bg-red-950 text-red-400' : activeNotification.score >= 4 ? 'bg-teal-950 text-teal-400' : 'bg-slate-700 text-slate-300'}`}>
                    Nota: {activeNotification.score === 1 ? 'Péssimo' : activeNotification.score === 2 ? 'Ruim' : activeNotification.score === 3 ? 'Regular' : activeNotification.score === 4 ? 'Bom' : 'Ótimo'}
                  </p>
                )}
                {activeNotification.ticketId && (
                  <p className="text-xl font-black bg-slate-950 text-white px-8 py-2 rounded-full uppercase tracking-widest">
                    Ticket: #{activeNotification.ticketId}
                  </p>
                )}
              </div>
            </div>

            <div className={`absolute -bottom-1 left-0 w-full h-3 animate-nps-bar
              ${activeNotification.score && activeNotification.score <= 2 ? 'bg-red-500' : 'bg-[#2fabab]'}`} />
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
                border-color: #2fabab; 
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
