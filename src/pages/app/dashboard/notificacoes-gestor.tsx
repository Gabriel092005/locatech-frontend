import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Bell, AlertTriangle, Thermometer, Droplets, Flame, Gauge, ChevronRight, Clock, RefreshCw } from 'lucide-react';
import { useSensores } from '../../../context/SensorContext';
import { api } from '@/lib/axios';
import { onNovaNotificacao, apiSocket } from '@/lib/api-socket';

const sensorSocket = io('http://192.168.8.84:3001');

interface NotifDB {
  id: number;
  content: string;
  created_at: string;
}

const typeIcons: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  preco: { icon: Droplets, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  novo: { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50' },
  atualizou: { icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-50' },
};

function detectType(content: string) {
  if (content.toLowerCase().includes('preço') || content.toLowerCase().includes('preco')) return typeIcons.preco;
  if (content.toLowerCase().includes('novo')) return typeIcons.novo;
  if (content.toLowerCase().includes('atualizou')) return typeIcons.atualizou;
  return { icon: Bell, color: 'text-slate-600', bg: 'bg-slate-50' };
}

export function NotificacoesGestor() {
  const { config } = useSensores();
  const [alertas, setAlertas] = useState<any[]>([]);
  const [notificacoesDB, setNotificacoesDB] = useState<NotifDB[]>([]);
  const [activeTab, setActiveTab] = useState<'sensores' | 'sistema'>('sensores');
  const [socketStatus, setSocketStatus] = useState(apiSocket.connected);
  const [dispositivos, setDispositivos] = useState<any>(() => {
    const salvo = localStorage.getItem('@Locatech:sensores');
    return salvo ? JSON.parse(salvo) : {};
  });

  const audioAlert = useRef(new Audio('/sounds/alert.mp3'));

  const dispararAvisoExterno = (mensagem: string) => {
    audioAlert.current.play().catch(() => {});
    if (Notification.permission === "granted") {
      new Notification("ALERTA CRÍTICO - LOCATECH", {
        body: mensagem,
        icon: "/logo-icon.png",
      });
    }
  };

  const gerarAlertas = (dados: any) => {
    if (!dados) return [];
    const novaLista: any[] = [];

    if (dados.esp1) {
      const e1 = dados.esp1;
      if (e1.fogo) novaLista.push({ id: 'e1-f', titulo: "Tanque Gasolina", mensagem: "FOGO DETECTADO", cor: "text-red-600", bg: "bg-red-50", Icone: Flame, gravidade: 'crítico' });
      if (e1.temp > (config.limiteTemp || 35)) novaLista.push({ id: 'e1-t', titulo: "Tanque Gasolina", mensagem: `Temperatura: ${e1.temp.toFixed(1)}°C`, cor: "text-orange-500", bg: "bg-orange-50", Icone: Thermometer, gravidade: 'alerta' });
      if (e1.humi > (config.limiteHumidade || 90)) novaLista.push({ id: 'e1-h', titulo: "Tanque Gasolina", mensagem: `Humidade: ${e1.humi.toFixed(1)}%`, cor: "text-amber-500", bg: "bg-amber-50", Icone: Droplets, gravidade: 'aviso' });
      if ((e1.stock || 0) <= (config.limiteCombustivel || 49)) {
        novaLista.push({ id: 'e1-s', titulo: "Tanque Gasolina", mensagem: `Stock: ${e1.stock}L`, cor: "text-red-600", bg: "bg-red-50", Icone: AlertTriangle, gravidade: 'crítico' });
      }
    }

    if (dados.esp2) {
      const e2 = dados.esp2;
      if (e2.fogo) novaLista.push({ id: 'e2-f', titulo: "Gás 13kg", mensagem: "FOGO DETECTADO", cor: "text-red-600", bg: "bg-red-50", Icone: Flame, gravidade: 'crítico' });
      if (e2.gas) novaLista.push({ id: 'e2-g', titulo: "Gás 13kg", mensagem: "VAZAMENTO DE GÁS", cor: "text-red-600", bg: "bg-red-50", Icone: Gauge, gravidade: 'crítico' });
      if (e2.temp > (config.limiteTempGas || 35)) novaLista.push({ id: 'e2-t', titulo: "Gás 13kg", mensagem: `Temperatura: ${e2.temp.toFixed(1)}°C`, cor: "text-orange-500", bg: "bg-orange-50", Icone: Thermometer, gravidade: 'alerta' });
      if (e2.humi > (config.limiteHumidade || 90)) novaLista.push({ id: 'e2-h', titulo: "Tanque Gasolina", mensagem: `Humidade: ${e2.humi.toFixed(1)}%`, cor: "text-amber-500", bg: "bg-amber-50", Icone: Droplets, gravidade: 'aviso' });
      if (e2.stock <= (config.limiteUnidades || 10)) novaLista.push({ id: 'e2-s', titulo: "Gás 13kg", mensagem: `Stock: ${e2.stock} unid`, cor: "text-red-600", bg: "bg-red-50", Icone: AlertTriangle, gravidade: 'crítico' });
    }
    return novaLista;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        sensorSocket.emit('register', payload.sub);
      } catch { console.error("❌ Erro ao descodificar JWT para socket"); }
    }
  }, []);

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    sensorSocket.on('monitoramento_update', (novoDado: any) => {
      if (novoDado.id) {
        if (novoDado.fogo || novoDado.gas) {
          dispararAvisoExterno(`EMERGÊNCIA: ${novoDado.fogo ? 'FOGO' : 'GÁS'} DETECTADO!`);
        }

        setDispositivos((prev: any) => {
          const anterior = prev[novoDado.id] || { stock: 0 };
          let stockFinal = novoDado.stock;
          if (novoDado.id === 'esp1' && novoDado.stock === 0 && anterior.stock > 0) stockFinal = anterior.stock;

          const novoEstado = { ...prev, [novoDado.id]: { ...prev[novoDado.id], ...novoDado, stock: stockFinal } };
          localStorage.setItem('@Locatech:sensores', JSON.stringify(novoEstado));
          return novoEstado;
        });
      }
    });

    return () => { sensorSocket.off('monitoramento_update'); };
  }, []);

  useEffect(() => {
    function fetchNotif() {
      api.get<{ notifications: NotifDB[] }>('/notif')
        .then((res) => setNotificacoesDB(res.data.notifications))
        .catch(() => {});
    }

    fetchNotif();
    const interval = setInterval(fetchNotif, 5000);

    const unsub = onNovaNotificacao((data) => {
      setNotificacoesDB((prev) => [
        { id: Date.now(), content: data.content, created_at: data.created_at || new Date().toISOString() },
        ...prev,
      ]);
    });

    return () => { clearInterval(interval); unsub(); };
  }, []);

  useEffect(() => {
    setAlertas(gerarAlertas(dispositivos));
  }, [dispositivos, config]);

  // Estado da ligação Socket.IO (API)
  useEffect(() => {
    const onC = () => setSocketStatus(true);
    const onD = () => setSocketStatus(false);
    apiSocket.on('connect', onC);
    apiSocket.on('disconnect', onD);
    setSocketStatus(apiSocket.connected);
    return () => { apiSocket.off('connect', onC); apiSocket.off('disconnect', onD); };
  }, []);

  const criticos = alertas.filter((a) => a.gravidade === 'crítico');
  const temCritico = criticos.length > 0;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-white overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Notificações</h1>
            <p className="text-sm text-slate-400 mt-0.5">Posto Etu Energies – Viana Sede</p>
          </div>
          {temCritico && (
            <div className="flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {criticos.length} crítico(s)
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Socket status */}
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
              socketStatus ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${socketStatus ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {socketStatus ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('sensores')}
            className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'sensores'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Sensores
            {alertas.length > 0 && activeTab !== 'sensores' && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {alertas.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sistema')}
            className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'sistema'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Sistema
            {notificacoesDB.length > 0 && activeTab !== 'sistema' && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {notificacoesDB.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">

        {/* ─── TAB: SENSORES ─── */}
        {activeTab === 'sensores' && (
          alertas.length > 0 ? alertas.map((alerta) => (
            <div
              key={alerta.id}
              className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                alerta.gravidade === 'crítico'
                  ? 'bg-red-50 border-red-200'
                  : alerta.gravidade === 'alerta'
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`shrink-0 p-2.5 rounded-xl ${
                  alerta.gravidade === 'crítico' ? 'bg-red-100' : alerta.gravidade === 'alerta' ? 'bg-orange-100' : 'bg-amber-100'
                }`}>
                  <alerta.Icone size={20} className={alerta.cor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{alerta.titulo}</p>
                  <p className={`text-sm font-bold mt-0.5 ${alerta.cor}`}>{alerta.mensagem}</p>
                </div>
                <span className={`shrink-0 self-start text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                  alerta.gravidade === 'crítico'
                    ? 'bg-red-200 text-red-700'
                    : alerta.gravidade === 'alerta'
                    ? 'bg-orange-200 text-orange-700'
                    : 'bg-amber-200 text-amber-700'
                }`}>
                  {alerta.gravidade}
                </span>
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center pt-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                <AlertTriangle size={28} className="text-emerald-400" />
              </div>
              <p className="text-slate-500 font-medium">Sistemas operando normalmente</p>
              <p className="text-xs text-slate-300 mt-1">Nenhum alerta de sensor no momento</p>
            </div>
          )
        )}

        {/* ─── TAB: SISTEMA ─── */}
        {activeTab === 'sistema' && (
          notificacoesDB.length > 0 ? notificacoesDB.map((n, i) => {
            const tipo = detectType(n.content);
            const Icon = tipo.icon;
            return (
              <div
                key={n.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 p-2.5 rounded-xl ${tipo.bg}`}>
                    <Icon size={18} className={tipo.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 leading-relaxed">{n.content}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Clock size={11} className="text-slate-300" />
                      <p className="text-[11px] text-slate-400 font-medium">
                        {new Intl.DateTimeFormat("pt-PT", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        }).format(new Date(n.created_at))}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-200 group-hover:text-slate-400 transition-colors duration-200 shrink-0 self-center" />
                </div>
              </div>
            );
          }) : (
            <div className="flex flex-col items-center justify-center pt-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                <Bell size={28} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Nenhuma notificação</p>
              <p className="text-xs text-slate-300 mt-1">As notificações do sistema aparecerão aqui</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
