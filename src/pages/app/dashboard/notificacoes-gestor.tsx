import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AlertTriangle, Thermometer, Droplets, Flame, Gauge } from 'lucide-react';
import { useSensores } from '../../_layouts/gestor'; 

const socket = io('http://192.168.8.9:3001');

export function NotificacoesGestor() {
  const { config } = useSensores(); 
  const [alertas, setAlertas] = useState<any[]>([]);
  const [dispositivos, setDispositivos] = useState<any>(() => {
    const salvo = localStorage.getItem('@Locatech:sensores');
    return salvo ? JSON.parse(salvo) : {};
  });

  const gerarAlertas = (dados: any) => {
    if (!dados) return [];
    const novaLista: any[] = [];

    // --- TANQUE A GASOLINA (ESP1) ---
    if (dados.esp1) {
      if (dados.esp1.fogo) novaLista.push({ id: 'e1-f', titulo: "TANQUE A GASOLINA", mensagem: "FOGO: ACTIVO", corDestaque: "text-red-600", valorLabel: "PERIGO", corBotao: "bg-red-600", IconeSub: Flame });
      if (dados.esp1.temp > (config.limiteTemp || 35)) novaLista.push({ id: 'e1-t', titulo: "TANQUE A GASOLINA", mensagem: `Temperatura Alta (${dados.esp1.temp.toFixed(1)}°C)`, corDestaque: "text-red-600", valorLabel: "ALERTA", corBotao: "bg-red-600", IconeSub: Thermometer });
      if (dados.esp1.humi > (config.limiteHumidade || 90)) novaLista.push({ id: 'e1-h', titulo: "TANQUE A GASOLINA", mensagem: `Humidade Crítica (${dados.esp1.humi.toFixed(1)}%)`, corDestaque: "text-amber-500", valorLabel: "ALERTA", corBotao: "bg-red-600", IconeSub: Droplets });
      if ((dados.esp1.stock || 0) <= (config.limiteCombustivel || 49)) {
        novaLista.push({ id: 'e1-s', titulo: "TANQUE A GASOLINA", mensagem: "NÍVEL BAIXO DE COMBUSTÍVEL", corDestaque: "text-red-600", valorLabel: `${dados.esp1.stock}L`, corBotao: "bg-red-600", IconeSub: AlertTriangle });
      }
    }

    // --- STOCK LARANJA 13KG (ESP2) ---
    if (dados.esp2) {
      if (dados.esp2.fogo) novaLista.push({ id: 'e2-f', titulo: "STOCK LARANJA 13KG", mensagem: "FOGO: ACTIVO", corDestaque: "text-red-600", valorLabel: "ALERTA", corBotao: "bg-red-600", IconeSub: Flame });
      if (dados.esp2.gas) novaLista.push({ id: 'e2-g', titulo: "STOCK LARANJA 13KG", mensagem: "VAZAMENTO DE GÁS", corDestaque: "text-red-600", valorLabel: "ALERTA", corBotao: "bg-red-600", IconeSub: Gauge });
      if (dados.esp2.temp > (config.limiteTempGas || 35)) novaLista.push({ id: 'e2-t', titulo: "STOCK LARANJA 13KG", mensagem: `Temperatura Alta (${dados.esp2.temp.toFixed(1)}°C)`, corDestaque: "text-red-600", valorLabel: "ALERTA", corBotao: "bg-red-600", IconeSub: Thermometer });
      if (dados.esp2.humi > (config.limiteHumidadeGas || 90)) novaLista.push({ id: 'e2-h', titulo: "STOCK LARANJA 13KG", mensagem: `Humidade Elevada (${dados.esp2.humi.toFixed(1)}%)`, corDestaque: "text-amber-500", valorLabel: "ALERTA", corBotao: "bg-red-600", IconeSub: Droplets });
      if (dados.esp2.stock <= (config.limiteUnidades || 10)) novaLista.push({ id: 'e2-s', titulo: "STOCK LARANJA 13KG", mensagem: "Ruptura de Stock Iminente", corDestaque: "text-red-600", valorLabel: `${dados.esp2.stock} Unid`, corBotao: "bg-red-600", IconeSub: AlertTriangle });
    }
    return novaLista;
  };

  useEffect(() => {
    socket.on('monitoramento_update', (novoDado: any) => {
      if (novoDado.id) {
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
    return () => { socket.off('monitoramento_update'); };
  }, []);

  useEffect(() => {
    setAlertas(gerarAlertas(dispositivos));
  }, [dispositivos, config]); 

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 text-left">
      <h2 className="text-gray-400 font-semibold mb-4 text-lg">Posto Etu Energies - Viana Sede</h2>
      <div className="flex flex-col h-full gap-4">
        <div className="flex justify-center">
          <div className="bg-[#e5e7eb] px-12 py-2 rounded-full text-gray-700 font-bold uppercase tracking-[0.25em] text-xs">MONITORAMENTO GERAL</div>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto pb-10">
          {alertas.length > 0 ? alertas.map((alerta) => (
            <div key={alerta.id} className="bg-[#e5e7eb] rounded-[20px] p-6 flex items-center gap-6 border border-gray-200/50 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <div className="shrink-0 p-3 bg-white rounded-2xl shadow-inner"><AlertTriangle size={32} className="text-black" /></div>
              <div className="flex-1 flex flex-col items-center">
                <h3 className="text-sm font-bold text-black uppercase tracking-wider">{alerta.titulo}</h3>
                <span className={`text-base font-bold flex items-center gap-2 ${alerta.corDestaque}`}>
                  <alerta.IconeSub size={20} className="text-gray-500" /> {alerta.mensagem}
                </span>
              </div>
              <div className={`shrink-0 ${alerta.corBotao} text-white font-bold px-5 py-1.5 rounded-full text-xs shadow-md`}>{alerta.valorLabel}</div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center mt-20 opacity-40">
              <p className="text-gray-500 font-medium">Sistemas operando dentro da normalidade.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}