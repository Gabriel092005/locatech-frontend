import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Thermometer, Fuel, RefreshCcw, Activity, 
  Droplets, Flame, Gauge, Package, Calculator // Corrigido para Calculator
} from 'lucide-react';
import { useSensores } from '../../_layouts/gestor';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ComposedChart, Line, Bar, Legend
} from 'recharts';

export function MonitoramentoDetalhado() {
  const { dispositivos } = useSensores();
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);

  useEffect(() => {
    if (!dispositivos.esp1 && !dispositivos.esp2) return;

    // Captura de valores individuais
    const t1 = Number(dispositivos.esp1?.temp ?? 0);
    const t2 = Number(dispositivos.esp2?.temp ?? 0);
    const h1 = Number(dispositivos.esp1?.humi ?? 0);
    const h2 = Number(dispositivos.esp2?.humi ?? 0);

    // Cálculo das Médias
    const mediaTemp = (t1 + t2) / 2;
    const mediaHumi = (h1 + h2) / 2;

    const novaEntrada = {
      hora: new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      
      // Volumes Reais
      gasolina: Number(dispositivos.esp1?.stock ?? 0), 
      unidadesGas: Number(dispositivos.esp2?.stock ?? 0),
      
      // Médias para o gráfico
      mediaTemperatura: Number(mediaTemp.toFixed(1)),
      mediaHumidade: Number(mediaHumi.toFixed(1))
    };

    setDadosGrafico(prev => [...prev, novaEntrada].slice(-15)); 
  }, [dispositivos]);

  // Valores médios atuais para os Cards
  const tempMediaAtual = ((Number(dispositivos.esp1?.temp ?? 0) + Number(dispositivos.esp2?.temp ?? 0)) / 2).toFixed(1);
  const humiMediaAtual = ((Number(dispositivos.esp1?.humi ?? 0) + Number(dispositivos.esp2?.humi ?? 0)) / 2).toFixed(1);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-[#F8FAFC] p-4 text-left">
      
      {/* HEADER */}
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-[#001140] text-white rounded-xl">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="text-md font-black text-[#001140] uppercase tracking-tighter">Terminal de Inteligência Operacional</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Análise de Médias: ESP1 + ESP2</p>
          </div>
        </div>
        <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-[#001140] uppercase">
          <RefreshCcw size={14} /> Sincronizar
        </button>
      </div>

      {/* GRID DE CARDS COM MÉDIAS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
        <CardMetrica label="Média Térmica" valor={`${tempMediaAtual}°C`} cor="text-red-600" Icon={Thermometer} />
        <CardMetrica label="Média Humidade" valor={`${humiMediaAtual}%`} cor="text-blue-600" Icon={Droplets} />
        <CardMetrica 
            label="Estado Fogo" 
            valor={(dispositivos.esp1?.fogo || dispositivos.esp2?.fogo) ? "CRÍTICO" : "SEGURO"} 
            cor={(dispositivos.esp1?.fogo || dispositivos.esp2?.fogo) ? "text-red-600 animate-pulse" : "text-gray-400"} 
            Icon={Flame} 
        />
        <CardMetrica label="Status Gás" valor={dispositivos.esp2?.gas ? "ALERTA" : "NORMAL"} cor={dispositivos.esp2?.gas ? "text-red-500" : "text-green-600"} Icon={Gauge} />
        <CardMetrica label="Total Gasolina" valor={`${dispositivos.esp1?.stock || 0}L`} cor="text-[#001140]" Icon={Fuel} />
        <CardMetrica label="Stock Laranja" valor={`${dispositivos.esp2?.stock || 0} Un`} cor="text-orange-500" Icon={Package} />
      </div>

      {/* GRÁFICOS */}
      <div className="flex-1 grid grid-rows-2 gap-4 min-h-0">
        
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-0">
          <span className="text-[11px] font-black text-gray-400 uppercase mb-2 flex items-center gap-2">
            <TrendingUp size={14} /> Performance de Inventário
          </span>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hora" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Area name="Gasolina" type="monotone" dataKey="gasolina" stroke="#001140" fill="#001140" fillOpacity={0.05} strokeWidth={3} />
                <Area name="Unidades Gás" type="monotone" dataKey="unidadesGas" stroke="#f97316" fill="none" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-0">
          <span className="text-[11px] font-black text-gray-400 uppercase mb-2 flex items-center gap-2">
            <Calculator size={14} /> Médias Atmosféricas Combinadas
          </span>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hora" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Bar name="Média Humidade %" dataKey="mediaHumidade" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} opacity={0.6} />
                <Line name="Média Térmica (°C)" type="monotone" dataKey="mediaTemperatura" stroke="#ef4444" strokeWidth={4} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardMetrica({ label, valor, cor, Icon, info }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
      {info && <span className="absolute top-2 right-2 text-[7px] font-bold bg-gray-50 px-1.5 py-0.5 rounded text-gray-400 uppercase">{info}</span>}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{label}</span>
        <Icon size={14} className={cor} />
      </div>
      <span className={`text-lg font-black tracking-tight ${cor}`}>{valor}</span>
    </div>
  );
}