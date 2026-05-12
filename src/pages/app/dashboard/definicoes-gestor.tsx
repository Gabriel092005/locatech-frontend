import React, { useState } from 'react';
import { 
  Settings2, Gauge, FileText, ChevronRight, Activity, AlertTriangle 
} from 'lucide-react';

// IMPORTAÇÃO: Verifique se o caminho está correto para o seu projeto
import { useSensores } from '../../../context/SensorContext'; 

import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';

export function DefinicoesGestor() {
  const context = useSensores();


  // --- BLINDAGEM CONTRA ERRO DE NULL ---
  const { config, setConfig, dispositivos } = context || {
    config: {
      limiteTemp: 35, limiteHumidade: 90, limiteCombustivel: 49,
      limiteTempGas: 35, limiteHumidadeGas: 90, limiteUnidades: 10, somAtivado: true
    },
    setConfig: () => {},
    dispositivos: {
      esp1: { stock: 0, temp: 0, humi: 0, fogo: false },
      esp2: { stock: 0, temp: 0, humi: 0, fogo: false, gas: false }
    }
  };

  const [showResetModal, setShowResetModal] = useState(false);

  // FUNÇÃO CORRIGIDA: Atualiza o estado global e o localStorage simultaneamente
  const salvarConfig = (chave: string, valor: any) => {
    const novaConfig = { ...config, [chave]: valor };
    setConfig(novaConfig); // Atualiza o contexto global (SensorProvider)
    localStorage.setItem('@Locatech:config', JSON.stringify(novaConfig));
    
    toast.success("Parâmetro atualizado", {
      style: { background: '#001140', color: '#fff', fontSize: '11px', borderRadius: '2px' }
    });
  };

  // CORREÇÃO: Resetar apenas configurações sem deslogar o usuário
  const handleResetTotal = () => {
    const configPadrao = {
      somAtivado: true,
      limiteCombustivel: 49,
      limiteTemp: 35,
      limiteHumidade: 90,
      limiteTempGas: 35,
      limiteHumidadeGas: 90,
      limiteUnidades: 10
    };
    
    setConfig(configPadrao);
    localStorage.setItem('@Locatech:config', JSON.stringify(configPadrao));
    localStorage.removeItem('@Locatech:sensores');
    
    setShowResetModal(false);
    toast.success("Sistema restaurado para o padrão!");
    
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    const dataHora = new Date().toLocaleString('pt-AO');

    doc.setFontSize(18);
    doc.setTextColor(0, 17, 64);
    doc.text('LOCATECH - RELATÓRIO TÉCNICO COMPLETO', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Data de Emissão: ${dataHora}`, 14, 30);
    
    const colunas = ["UNIDADE", "PARÂMETRO", "VALOR ATUAL", "LIMITE", "STATUS"];
    
    const linhas: RowInput[] = [
      ["TANQUE A", "Nível de Combustível", `${dispositivos.esp1?.stock || 0}L`, `${config.limiteCombustivel}L`, (dispositivos.esp1?.stock || 0) <= config.limiteCombustivel ? "CRÍTICO" : "NORMAL"],
      ["TANQUE A", "Temperatura", `${dispositivos.esp1?.temp?.toFixed(1) || 0}°C`, `${config.limiteTemp}°C`, (dispositivos.esp1?.temp || 0) > config.limiteTemp ? "ALTA" : "NORMAL"],
      ["TANQUE A", "Humidade", `${dispositivos.esp1?.humi?.toFixed(1) || 0}%`, `${config.limiteHumidade}%`, (dispositivos.esp1?.humi || 0) > config.limiteHumidade ? "ALTA" : "NORMAL"],
      ["TANQUE A", "Segurança (Fogo)", dispositivos.esp1?.fogo ? "DETECTADO" : "INACTIVO", "-", dispositivos.esp1?.fogo ? "PERIGO" : "NORMAL"],
      
      [{ content: '', colSpan: 5, styles: { fillColor: [245, 245, 245] as [number, number, number] } }],

      ["STOCK LARANJA", "Qtd. Unidades", `${dispositivos.esp2?.stock || 0} Un`, `${config.limiteUnidades} Un`, (dispositivos.esp2?.stock || 0) <= config.limiteUnidades ? "BAIXO" : "NORMAL"],
      ["STOCK LARANJA", "Temperatura Gás", `${dispositivos.esp2?.temp?.toFixed(1) || 0}°C`, `${config.limiteTempGas}°C`, (dispositivos.esp2?.temp || 0) > config.limiteTempGas ? "ALTA" : "NORMAL"],
      ["STOCK LARANJA", "Humidade Gás", `${dispositivos.esp2?.humi?.toFixed(1) || 0}%`, `${config.limiteHumidadeGas}%`, (dispositivos.esp2?.humi || 0) > config.limiteHumidadeGas ? "ALTA" : "NORMAL"],
      ["STOCK LARANJA", "Vazamento Gás", dispositivos.esp2?.gas ? "SIM" : "NORMAL", "-", dispositivos.esp2?.gas ? "ALERTA" : "NORMAL"],
      ["STOCK LARANJA", "Incêndio (Fogo)", dispositivos.esp2?.fogo ? "DETECTADO" : "INACTIVO", "-", dispositivos.esp2?.fogo ? "PERIGO" : "NORMAL"]
    ];

    autoTable(doc, {
      startY: 40,
      head: [colunas],
      body: linhas,
      theme: 'grid',
      headStyles: { fillColor: [0, 17, 64], fontSize: 10 },
      styles: { fontSize: 9 },
      didParseCell: (data) => {
        const status = String(data.cell.text[0]);
        const alertas = ["CRÍTICO", "ALTA", "BAIXO", "PERIGO", "ALERTA", "DETECTADO", "SIM"];
        if (data.column.index === 4 && alertas.includes(status)) {
          data.cell.styles.textColor = [200, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    doc.save(`Locatech_Relatorio_Final_${new Date().getTime()}.pdf`);
    toast.success("PDF gerado!");
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300 text-left p-6">
      {/* MODAL DE CONFIRMAÇÃO */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001140]/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 text-red-600 rounded-full"><AlertTriangle size={24} /></div>
                <h2 className="text-sm font-black text-[#001140] uppercase">Confirmar Reset de Parâmetros</h2>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">Esta ação restaurará os limites e o som para o padrão. A sua conta continuará conectada.</p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex gap-3">
              <button onClick={() => setShowResetModal(false)} className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded text-[10px] font-black uppercase text-gray-400">Cancelar</button>
              <button onClick={handleResetTotal} className="flex-1 px-4 py-2 bg-red-600 rounded text-[10px] font-black uppercase text-white shadow-md shadow-red-200">Limpar Agora</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-gray-900 text-white rounded"><Settings2 size={20} /></div>
          <div>
            <h1 className="text-lg font-black text-[#001140]">TERMINAL DE CONFIGURAÇÕES</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Locatech Operational Control</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
              <Gauge size={14} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-500 uppercase">Calibração de Limiares Operacionais</span>
            </div>
            
            <div className="divide-y divide-gray-100 p-6 space-y-8">
               {/* Inputs de Configuração - Tanque A */}
               <div>
                <h3 className="text-[10px] font-black text-[#001140] uppercase mb-4 opacity-50">Setpoints: Tanque A Gasolina</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputConfig label="Temp. Crítica (°C)" value={config.limiteTemp} onChange={(v: number) => setConfig({...config, limiteTemp: v})} onSet={() => salvarConfig('limiteTemp', config.limiteTemp)} />
                  <InputConfig label="Humidade Máx (%)" value={config.limiteHumidade} onChange={(v: number) => setConfig({...config, limiteHumidade: v})} onSet={() => salvarConfig('limiteHumidade', config.limiteHumidade)} />
                  <InputConfig label="Nível Mínimo (L)" value={config.limiteCombustivel} onChange={(v: number) => setConfig({...config, limiteCombustivel: v})} onSet={() => salvarConfig('limiteCombustivel', config.limiteCombustivel)} />
                </div>
              </div>

              {/* Inputs de Configuração - Stock Laranja */}
              <div className="pt-4">
                <h3 className="text-[10px] font-black text-[#001140] uppercase mb-4 opacity-50">Setpoints: Stock Laranja (Gás)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputConfig label="Temp. Máxima (°C)" value={config.limiteTempGas} onChange={(v: number) => setConfig({...config, limiteTempGas: v})} onSet={() => salvarConfig('limiteTempGas', config.limiteTempGas)} />
                  <InputConfig label="Humidade Máx (%)" value={config.limiteHumidadeGas} onChange={(v: number) => setConfig({...config, limiteHumidadeGas: v})} onSet={() => salvarConfig('limiteHumidadeGas', config.limiteHumidadeGas)} />
                  <InputConfig label="Stock Mínimo (Un)" value={config.limiteUnidades} onChange={(v: number) => setConfig({...config, limiteUnidades: v})} onSet={() => salvarConfig('limiteUnidades', config.limiteUnidades)} />
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 bg-[#FBFBFC]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white border border-gray-200 rounded flex items-center justify-center text-[#001140] shadow-sm"><FileText size={24} /></div>
                <div>
                  <h3 className="text-sm font-bold text-[#001140]">Relatórios Técnicos</h3>
                  <p className="text-[11px] text-gray-400 font-medium">Exportar status atual dos ativos para PDF.</p>
                </div>
              </div>
              <button 
                onClick={gerarPDF} 
                className="flex items-center gap-2 bg-[#001140] text-white px-6 py-2.5 rounded text-[11px] font-black uppercase hover:bg-black transition-all shadow-md"
              >
                Download PDF <ChevronRight size={14}/>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar de Sistema */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Activity size={14} /> Sistema</h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-100">
              <span className="text-xs font-bold text-[#001140]">Alertas Sonoros</span>
              <button 
                onClick={() => salvarConfig('somAtivado', !config.somAtivado)} 
                className={`w-10 h-5 rounded-full relative transition-all ${config.somAtivado ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.somAtivado ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="bg-red-50/30 border border-red-100 rounded-lg p-6">
            <h2 className="text-[10px] font-black text-red-600 uppercase mb-2">Danger Zone</h2>
            <button onClick={() => setShowResetModal(true)} className="w-full py-2 bg-white border border-red-200 text-red-600 rounded text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">Reset Total do Sistema</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputConfig({ label, value, onChange, onSet }: any) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">{label}</label>
      <div className="flex gap-1">
        <input 
          type="number" 
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))} 
          className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-[#001140] focus:ring-1 focus:ring-[#001140] outline-none transition-all" 
        />
        <button 
          onClick={onSet} 
          className="bg-[#001140] text-white px-4 rounded text-[10px] font-black uppercase hover:bg-black transition-colors"
        >
          SET
        </button>
      </div>
    </div>
  );
}