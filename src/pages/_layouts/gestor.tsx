import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SidebarGestor } from "../app/dashboard/sidebar/SidebarGestor"; 
import { NavBar } from "./header"; 
import toast, { Toaster } from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

const socket = io('http://192.168.8.9:3001');
const SensorContext = createContext<any>(null);

const audioAlerta = new Audio('/sounds/alert.mpeg');

export const SensorProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [temNotificacaoNova, setTemNotificacaoNova] = useState(false);
  
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

  const dispararToast = (titulo: string, mensagem: string) => {
    if (location.pathname === '/gestor/notificacoes') return;

    if (config.somAtivado) {
      audioAlerta.currentTime = 0;
      audioAlerta.play().catch(() => console.log("Interação áudio necessária."));
    }

    toast.dismiss();
    setTemNotificacaoNova(true);
    
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-xs w-full bg-white/95 backdrop-blur-sm shadow-2xl rounded-xl border-l-[6px] border-red-600 flex overflow-hidden ring-1 ring-black/5 transition-all`}>
        <div className="flex-1 p-4">
          <div className="flex items-start">
            <AlertTriangle size={20} className="text-red-600 shrink-0" />
            <div className="ml-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Alerta de Sistema</p>
              <p className="text-sm font-bold text-[#001140] leading-tight">{titulo}</p>
              <p className="text-[12px] font-semibold text-red-600/90 italic">{mensagem}</p>
            </div>
          </div>
        </div>
        <button onClick={() => { setTemNotificacaoNova(false); navigate('/gestor/notificacoes'); toast.dismiss(); }} className="px-4 border-l border-gray-100 text-[10px] font-black text-[#001140] uppercase hover:bg-gray-50">Ver</button>
      </div>
    ), { duration: 6000, id: 'gestor-alert' }); 
  };

  useEffect(() => {
    localStorage.setItem('@Locatech:config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    socket.on('monitoramento_update', (novoDado: any) => {
      if (!novoDado || !novoDado.id) return;
      
      setDispositivos((prev: any) => {
        const anterior = prev[novoDado.id] || { stock: 0 };
        let stockFinal = novoDado.stock;
        
        if (novoDado.id === 'esp1' && novoDado.stock === 0 && anterior.stock > 0) stockFinal = anterior.stock;

        const alerts: Array<{ title: string; message: string }> = [];
        
        if (novoDado.fogo) alerts.push({ title: novoDado.id === 'esp1' ? "TANQUE A GASOLINA" : "STOCK LARANJA", message: "🔥 INCÊNDIO DETECTADO!" });
        if (novoDado.id === 'esp2' && !!novoDado.gas) alerts.push({ title: "STOCK LARANJA", message: "⚠️ VAZAMENTO DE GÁS!" });

        // --- Lógica de Alertas com Configurações ---
        if (novoDado.id === 'esp1') {
          if (novoDado.temp > config.limiteTemp) alerts.push({ title: "TANQUE A GASOLINA", message: `Temperatura Alta: ${novoDado.temp.toFixed(1)}°C` });
          if (novoDado.humi > config.limiteHumidade) alerts.push({ title: "TANQUE A GASOLINA", message: `Humidade Crítica: ${novoDado.humi.toFixed(1)}%` });
          if (novoDado.stock > 0 && novoDado.stock <= config.limiteCombustivel) alerts.push({ title: "TANQUE A GASOLINA", message: `Nível Crítico: ${novoDado.stock}L` });
        }

        if (novoDado.id === 'esp2') {
          if (novoDado.temp > config.limiteTempGas) alerts.push({ title: "STOCK LARANJA", message: `Temperatura Gás Alta: ${novoDado.temp.toFixed(1)}°C` });
          if (novoDado.humi > config.limiteHumidadeGas) alerts.push({ title: "STOCK LARANJA", message: `Humidade Elevada: ${novoDado.humi.toFixed(1)}%` });
          if (novoDado.stock <= config.limiteUnidades) alerts.push({ title: "STOCK LARANJA", message: `Ruptura de Stock: ${novoDado.stock} un` });
        }

        if (alerts.length > 0) dispararToast(alerts[alerts.length - 1].title, alerts[alerts.length - 1].message);

        const novoEstado = { ...prev, [novoDado.id]: { ...anterior, ...novoDado, stock: stockFinal } };
        localStorage.setItem('@Locatech:sensores', JSON.stringify(novoEstado));
        return novoEstado;
      });
    });
    return () => { socket.off('monitoramento_update'); };
  }, [config]); // Re-assina o socket para os limites funcionarem no Toast

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
          <main className="flex-1 bg-white p-10 overflow-y-auto"><Outlet /></main>
          <footer className="py-4 text-center bg-[#001140]">
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">© 2026 LOCATECH – INFORMAÇÃO CERTA</p>
          </footer>
        </div>
      </div>
    </SensorProvider>
  );
}