import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SidebarGestor } from "../app/dashboard/sidebar/SidebarGestor"; 
import { NavBar } from "./header"; 
import toast, { Toaster } from 'react-hot-toast';
import { AlertTriangle, Flame } from 'lucide-react';

const socket = io('http://192.168.8.84:3001');
const SensorContext = createContext<any>(null);

// Variável de controle para o agrupamento inteligente
let listaDeAlertasAtivos: string[] = [];

export const SensorProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [temNotificacaoNova, setTemNotificacaoNova] = useState(false);
  
  const [audioAlerta] = useState(new Audio('/sounds/alert.mpeg'));
  
  const [config, setConfig] = useState(() => {
    const salvo = localStorage.getItem('@Locatech:config');
    return salvo ? JSON.parse(salvo) : {
      somAtivado: true,
      limiteCombustivel: 49,
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
      esp1: { id: 'esp1', temp: 0, humi: 0, fogo: false, stock: 0 },
      esp2: { id: 'esp2', temp: 0, humi: 0, gas: false, fogo: false, stock: 0 }
    };
  });

  const dispararToast = (titulo: string, mensagem: string, prioridade: 'alta' | 'media') => {
    setTemNotificacaoNova(true);

    if (config.somAtivado) {
      audioAlerta.currentTime = 0;
      audioAlerta.play().catch(() => console.log("Erro ao tocar som."));
    }

    if (Notification.permission === "granted") {
      new Notification(`${prioridade === 'alta' ? '🚨 EMERGÊNCIA' : '⚠️ AVISO'}: ${titulo}`, {
        body: mensagem,
        icon: "/logo-icon.png"
      });
    }

    if (location.pathname === '/dashboard/notificacoes') {
      setTemNotificacaoNova(false);
      return;
    }

    if (prioridade === 'alta') {
      listaDeAlertasAtivos = [mensagem];
      toast.dismiss(); 
    } else {
      if (!listaDeAlertasAtivos.includes(mensagem)) {
        listaDeAlertasAtivos.push(mensagem);
      }
    }

    const totalAlertas = listaDeAlertasAtivos.length;
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
                {isEmergencia ? mensagem : totalAlertas > 1 ? "Múltiplos accções em análise." : mensagem}
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => { 
            listaDeAlertasAtivos = [];
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
    socket.on('monitoramento_update', (novoDado: any) => {
      if (!novoDado || !novoDado.id) return;
      
      setDispositivos((prev: any) => {
        const anterior = prev[novoDado.id] || { stock: 0 };
        let stockFinal = novoDado.stock;
        if (novoDado.id === 'esp1' && novoDado.stock === 0 && anterior.stock > 0) stockFinal = anterior.stock;

        let alertaPrioritario: { title: string; message: string; prioridade: 'alta' | 'media' } | null = null;
        
        // 🚨 Prioridade ALTA: Fogo e Gás (Emergência Total)
        if (novoDado.fogo) {
          alertaPrioritario = { title: novoDado.id === 'esp1' ? "TANQUE A GASOLINA" : "STOCK LARANJA", message: "🔥 INCÊNDIO DETECTADO!", prioridade: 'alta' };
        } else if (novoDado.id === 'esp2' && !!novoDado.gas) {
          alertaPrioritario = { title: "STOCK LARANJA", message: "⚠️ VAZAMENTO DE GÁS!", prioridade: 'alta' };
        } 
        
        // ⚠️ Prioridade MÉDIA: Temperatura, Humidade e Stock
        if (!alertaPrioritario) {
          if (novoDado.id === 'esp1') {
            if (novoDado.temp > config.limiteTemp) alertaPrioritario = { title: "TANQUE A GASOLINA", message: `Temperatura Alta: ${novoDado.temp.toFixed(1)}°C`, prioridade: 'media' };
            else if (novoDado.humi > config.limiteHumidade) alertaPrioritario = { title: "TANQUE A GASOLINA", message: `Humidade Alta: ${novoDado.humi.toFixed(1)}%`, prioridade: 'media' };
            else if (novoDado.stock > 0 && novoDado.stock <= config.limiteCombustivel) alertaPrioritario = { title: "TANQUE A GASOLINA", message: `Nível Crítico: ${novoDado.stock}L`, prioridade: 'media' };
          } else if (novoDado.id === 'esp2') {
            if (novoDado.temp > config.limiteTempGas) alertaPrioritario = { title: "STOCK LARANJA", message: `Temp. Gás Alta: ${novoDado.temp.toFixed(1)}°C`, prioridade: 'media' };
            else if (novoDado.humi > config.limiteHumidadeGas) alertaPrioritario = { title: "STOCK LARANJA", message: `Humidade Gás Alta: ${novoDado.humi.toFixed(1)}%`, prioridade: 'media' };
            else if (novoDado.stock <= config.limiteUnidades) alertaPrioritario = { title: "STOCK LARANJA", message: `Ruptura de Stock: ${novoDado.stock} un`, prioridade: 'media' };
          }
        }

        if (alertaPrioritario) {
          dispararToast(alertaPrioritario.title, alertaPrioritario.message, alertaPrioritario.prioridade);
        }

        const novoEstado = { ...prev, [novoDado.id]: { ...anterior, ...novoDado, stock: stockFinal } };
        localStorage.setItem('@Locatech:sensores', JSON.stringify(novoEstado));
        return novoEstado;
      });
    });
    return () => { socket.off('monitoramento_update'); };
  }, [config, audioAlerta, location.pathname]); 

  return (
    <SensorContext.Provider value={{ dispositivos, temNotificacaoNova, setTemNotificacaoNova, config, setConfig }}>
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