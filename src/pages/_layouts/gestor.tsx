import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SidebarGestor } from "../app/dashboard/sidebar/SidebarGestor"; 
import { NavBar } from "./header"; 
import toast, { Toaster } from 'react-hot-toast';
import { AlertTriangle, Flame, UserPlus, Bell } from 'lucide-react';
import { onConviteRecebido, onNovaNotificacao } from '../../lib/api-socket';

const socket = io('http://192.168.8.112:3001');
const SensorContext = createContext<any>(null);

// Transformado em estado local dentro do Provider para evitar retenção de memória global
export const SensorProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [temNotificacaoNova, setTemNotificacaoNova] = useState(false);
  const [audioAlerta] = useState(new Audio('/sounds/alert.mpeg'));
  const [listaDeAlertasAtivos, setListaDeAlertasAtivos] = useState<string[]>([]);
  
  const [notificacoesLista, setNotificacoesLista] = useState<any[]>(() => {
    const salvas = localStorage.getItem('@Locatech:lista_notificacoes');
    return salvas ? JSON.parse(salvas) : [];
  });
  
  const [config, setConfig] = useState(() => {
    const salvo = localStorage.getItem('@Locatech:config');
    return salvo ? JSON.parse(salvo) : {
      somAtivado: true,
      limiteCombustivel: 20, 
      limiteTemp: 35,
      limiteHumidade: 90,
      limiteTempGas: 35,
      limiteHumidadeGas: 90,
      limiteUnidades: 10
    };
  });

  const [dispositivos, setDispositivos] = useState(() => {
    const salvo = localStorage.getItem('@Locatech:sensores');
    return salvo ? JSON.parse(salvo) : {
      esp1: { id: 'esp1', temp: 0, humi: 0, fogo: false, stock: 0, isCritico: false },
      esp2: { id: 'esp2', temp: 0, humi: 0, gas: false, fogo: false, stock: 0, isCritico: false }
    };
  });

  const dispararToast = (titulo: string, message: string, prioridade: 'alta' | 'media', alertasAtuais: string[]) => {
    setTemNotificacaoNova(true);

    if (config.somAtivado) {
      audioAlerta.currentTime = 0;
      audioAlerta.play().catch(() => console.log("Erro ao tocar som."));
    }

    if (Notification.permission === "granted") {
      new Notification(`${prioridade === 'alta' ? '🚨 EMERGÊNCIA' : '⚠️ AVISO'}: ${titulo}`, {
        body: message, 
        icon: "/logo-icon.png"
      });
    }

    if (location.pathname === '/dashboard/notificacoes') {
      setTemNotificacaoNova(false);
      return;
    }

    const totalAlertas = alertasAtuais.length;
    const isEmergencia = prioridade === 'alta';

    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-xs w-full ${isEmergencia ? 'bg-red-600' : 'bg-white/95'} backdrop-blur-sm shadow-2xl rounded-xl border-l-[6px] ${isEmergencia ? 'border-white' : 'border-red-600'} flex overflow-hidden ring-1 ring-black/5 transition-all`}>
        <div className="flex-1 p-4">
          <div className="flex items-start">
            {isEmergencia ? <Flame size={20} className="text-white shrink-0 animate-bounce" /> : <AlertTriangle size={20} className="text-red-600 shrink-0" />}
            <div className="ml-4">
              <p className={`text-[10px] font-black ${isEmergencia ? 'text-red-100' : 'text-gray-400'} uppercase tracking-widest mb-1`}>
                {isEmergencia ? 'Prioridade Máxima' : 'Alerta de Sistema'}
              </p>
              <p className={`text-sm font-bold ${isEmergencia ? 'text-white' : 'text-[#001140]'} leading-tight`}>
                {isEmergencia ? titulo : `⚠️ ${totalAlertas} Ocorrências`}
              </p>
              <p className={`text-[12px] font-semibold ${isEmergencia ? 'text-white/90' : 'text-red-600/90'} italic`}>
                {isEmergencia ? message : totalAlertas > 1 ? "Múltiplas ações em análise." : message}
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => { 
            setListaDeAlertasAtivos([]);
            setTemNotificacaoNova(false); 
            navigate('/dashboard/notificacoes'); 
            toast.dismiss(); 
          }} 
          className={`px-4 border-l ${isEmergencia ? 'border-red-500 text-white' : 'border-gray-100 text-[#001140]'} text-[10px] font-black uppercase hover:bg-black/5`}
        >
          Ver
        </button>
      </div>
    ), { duration: isEmergencia ? 15000 : 6000, id: 'hybrid-alert' }); 
  };

  useEffect(() => {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    localStorage.setItem('@Locatech:config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('@Locatech:lista_notificacoes', JSON.stringify(notificacoesLista));
  }, [notificacoesLista]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        socket.emit('register', payload.sub);
      } catch { console.error("❌ Erro ao descodificar JWT"); }
    }
  }, []);

  useEffect(() => {
    socket.on('monitoramento_update', (novoDado: any) => {
      if (!novoDado || !novoDado.id) return;
      
      setDispositivos((prev: any) => {
        const anterior = prev[novoDado.id] || { stock: 0 };
        const stockFinal = Number(novoDado.stock); 

        let alertaPrioritario: { title: string; message: string; prioridade: 'alta' | 'media' } | null = null;
        let estaEmEstadoCritico = false;
        
        if (novoDado.fogo) {
          alertaPrioritario = { title: novoDado.id === 'esp1' ? "TANQUE A GASOLINA" : "STOCK LARANJA", message: "🔥 INCÊNDIO DETECTADO!", prioridade: 'alta' };
          estaEmEstadoCritico = true;
        } else if (novoDado.id === 'esp2' && !!novoDado.gas) {
          alertaPrioritario = { title: "STOCK LARANJA", message: "⚠️ VAZAMENTO DE GÁS!", prioridade: 'alta' };
          estaEmEstadoCritico = true;
        } 
        
        if (!alertaPrioritario) {
          if (novoDado.id === 'esp1') {
            if (Number(novoDado.temp) > Number(config.limiteTemp)) {
              alertaPrioritario = { title: "TANQUE A GASOLINA", message: `Temperatura Alta: ${novoDado.temp.toFixed(1)}°C`, prioridade: 'media' };
              estaEmEstadoCritico = true;
            } else if (Number(novoDado.humi) > Number(config.limiteHumidade)) {
              alertaPrioritario = { title: "TANQUE A GASOLINA", message: `Humidade Alta: ${novoDado.humi.toFixed(1)}%`, prioridade: 'media' };
              estaEmEstadoCritico = true;
            } else if (stockFinal >= 0 && stockFinal <= 20) {
              // BLOQUEIO RIGOROSO: Só cria a estrutura de erro se o stock for menor ou igual a 20
              alertaPrioritario = { title: "TANQUE GASOLINA", message: `Stock Crítico: ${stockFinal}%`, prioridade: 'media' };
              estaEmEstadoCritico = true;
            }
          } else if (novoDado.id === 'esp2') {
            if (Number(novoDado.temp) > Number(config.limiteTempGas)) {
              alertaPrioritario = { title: "STOCK LARANJA", message: `Temp. Gás Alta: ${novoDado.temp.toFixed(1)}°C`, prioridade: 'media' };
              estaEmEstadoCritico = true;
            } else if (Number(novoDado.humi) > Number(config.limiteHumidadeGas)) {
              alertaPrioritario = { title: "STOCK LARANJA", message: `Humidade Gás Alta: ${novoDado.humi.toFixed(1)}%`, prioridade: 'media' };
              estaEmEstadoCritico = true;
            } else if (stockFinal <= Number(config.limiteUnidades || 10)) {
              alertaPrioritario = { title: "STOCK LARANJA", message: `Ruptura de Stock: ${stockFinal} un`, prioridade: 'media' };
              estaEmEstadoCritico = true;
            }
          }
        }

        // Atualização da lista de alertas e disparo do Toast condicionado à barreira dos 20%
        setNotificacoesLista((listaAtual) => {
          let novaLista = listaAtual.filter((n) => n.dispositivoId !== novoDado.id);

          if (alertaPrioritario) {
            novaLista.unshift({
              id: `${novoDado.id}-${Date.now()}`,
              dispositivoId: novoDado.id,
              title: alertaPrioritario.title,
              message: alertaPrioritario.message,
              prioridade: alertaPrioritario.prioridade,
              timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
            });
            
            // Tratamento do estado de alertas unificados
            let proximosAlertas = [...listaDeAlertasAtivos];
            if (alertaPrioritario.prioridade === 'alta') {
              proximosAlertas = [alertaPrioritario.message];
              toast.dismiss();
            } else {
              if (!proximosAlertas.includes(alertaPrioritario.message)) {
                proximosAlertas.push(alertaPrioritario.message);
              }
            }
            setListaDeAlertasAtivos(proximosAlertas);
            
            dispararToast(alertaPrioritario.title, alertaPrioritario.message, alertaPrioritario.prioridade, proximosAlertas);
          }
          return novaLista;
        });

        const novoEstado = { 
          ...prev, 
          [novoDado.id]: { 
            ...anterior, 
            ...novoDado, 
            stock: stockFinal,
            isCritico: estaEmEstadoCritico // Passa o estado real de perigo para a interface ler
          } 
        };
        localStorage.setItem('@Locatech:sensores', JSON.stringify(novoEstado));
        return novoEstado;
      });
    });
    return () => { socket.off('monitoramento_update'); };
  }, [config, audioAlerta, location.pathname, listaDeAlertasAtivos]); 

  useEffect(() => {
    const unsubConvite = onConviteRecebido((data) => {
      const notificationContent = `${data.de_user.nome} convidou-o para entrar na comunidade "${data.comunidade.nome}"`;
      setTemNotificacaoNova(true);
      if (config.somAtivado) { audioAlerta.currentTime = 0; audioAlerta.play().catch(() => {}); }
      if (Notification.permission === "granted") { new Notification('📨 Convite', { body: notificationContent, icon: "/logo-icon.png" }); }
      if (location.pathname === '/dashboard/comunidade') { setTemNotificacaoNova(false); return; }

      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-xs w-full bg-white/95 backdrop-blur-sm shadow-2xl rounded-xl border-l-[6px] border-blue-500 flex overflow-hidden ring-1 ring-black/5 transition-all`}>
          <div className="flex-1 p-4">
            <div className="flex items-start">
              <UserPlus size={20} className="text-blue-600 shrink-0" />
              <div className="ml-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Convite Recebido</p>
                <p className="text-sm font-bold text-[#001140] leading-tight">{data.de_user.nome}</p>
                <p className="text-[12px] font-semibold text-blue-600/90 italic">Convidou-o para "{data.comunidade.nome}"</p>
              </div>
            </div>
          </div>
          <button onClick={() => { navigate('/dashboard/comunidade'); toast.dismiss(); }} className="px-4 border-l border-gray-100 text-[10px] font-black uppercase text-[#001140] hover:bg-black/5">Ver</button>
        </div>
      ), { duration: 8000, id: 'convite-toast' });
    });

    const unsubNotif = onNovaNotificacao((data) => {
      setTemNotificacaoNova(true);
      if (config.somAtivado) { audioAlerta.currentTime = 0; audioAlerta.play().catch(() => {}); }
      if (Notification.permission === "granted") { new Notification('📢 Posto', { body: data.content, icon: "/logo-icon.png" }); }

      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-xs w-full bg-white/95 backdrop-blur-sm shadow-2xl rounded-xl border-l-[6px] border-amber-500 flex overflow-hidden ring-1 ring-black/5 transition-all`}>
          <div className="flex-1 p-4">
            <div className="flex items-start">
              <Bell size={20} className="text-amber-600 shrink-0" />
              <div className="ml-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Alteração no Posto</p>
                <p className="text-sm font-semibold text-[#001140] leading-tight">{data.content}</p>
              </div>
            </div>
          </div>
          <button onClick={() => { navigate('/dashboard'); toast.dismiss(); }} className="px-4 border-l border-gray-100 text-[10px] font-black uppercase text-[#001140] hover:bg-black/5">Ver</button>
        </div>
      ), { duration: 8000 });
    });

    return () => { unsubConvite(); unsubNotif(); };
  }, [config.somAtivado, audioAlerta, location.pathname, navigate]);

  return (
    <SensorContext.Provider value={{ dispositivos, temNotificacaoNova, setTemNotificacaoNova, config, setConfig, notificacoesLista, setNotificacoesLista }}>
      <Toaster position="top-right" containerStyle={{ top: 100, right: 30 }} />
      {children}
    </SensorContext.Provider>
  );
};

export const useSensores = () => useContext(SensorContext);

export function GestorLayout() {
  return (
    <SensorProvider>
      <div className="flex min-h-screen bg-[#001140] overflow-hidden">
        <SidebarGestor />
        <div className="flex-1 flex flex-col">
          <NavBar />
          <main className="flex-1 bg-white p-10 overflow-y-auto relative">
            <Outlet />
          </main>
          <footer className="py-4 text-center bg-[#001140]">
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">
              © 2026 LOCATECH – INFORMAÇÃO CERTA
            </p>
          </footer>
        </div>
      </div>
    </SensorProvider>
  );
}