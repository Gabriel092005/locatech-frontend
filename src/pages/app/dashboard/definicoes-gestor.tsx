import React, { useState } from 'react';
import { 
  Settings2, Gauge, FileText, ChevronRight, Activity, AlertTriangle, X
} from 'lucide-react';
import { useSensores } from '../../_layouts/gestor';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';

export function DefinicoesGestor() {
  const { config, setConfig, dispositivos } = useSensores();
  // Estado para controlar o modal de confirmação
  const [showResetModal, setShowResetModal] = useState(false);

  const salvarConfig = (chave: string, valor: any) => {
    setConfig((prev: any) => ({ ...prev, [chave]: valor }));
    toast.success("Parâmetro atualizado", {
      style: { background: '#001140', color: '#fff', fontSize: '11px', borderRadius: '2px' }
    });
  };

  const handleResetTotal = () => {
    localStorage.clear();
    window.location.reload();
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
        const status = data.cell.text[0];
        const alertas = ["CRÍTICO", "ALTA", "BAIXO", "PERIGO", "ALERTA", "DETECTADO", "SIM"];
        if (data.column.index === 4 && alertas.includes(status)) {
          data.cell.styles.textColor = [200, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Relatório gerado automaticamente pelo sistema de monitoramento Locatech – Angola.', 14, 285);

    doc.save(`Locatech_Relatorio_Final_${new Date().getTime()}.pdf`);
    toast.success("PDF gerado com sucesso!");
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300 text-left">
      {/* MODAL DE CONFIRMAÇÃO ESTILIZADO */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001140]/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 text-red-600 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <h2 className="text-sm font-black text-[#001140] uppercase tracking-tight">Confirmar Reset Total</h2>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Esta ação irá apagar permanentemente todas as configurações locais e limiares definidos. Deseja continuar?
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex gap-3">
              <button 
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded text-[10px] font-black uppercase text-gray-400 hover:bg-gray-100 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleResetTotal}
                className="flex-1 px-4 py-2 bg-red-600 rounded text-[10px] font-black uppercase text-white hover:bg-red-700 transition-all shadow-md shadow-red-200"
              >
                Limpar Agora
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-gray-900 text-white rounded">
            <Settings2 size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#001140] tracking-tight">TERMINAL DE CONFIGURAÇÕES</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Locatech Operational Control</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
              <Gauge size={14} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Calibração de Limiares Operacionais</span>
            </div>
            
            <div className="divide-y divide-gray-100">
              <div className="p-6">
                <h3 className="text-[10px] font-black text-[#001140] uppercase mb-4 opacity-50">Setpoints: Tanque A Gasolina</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Temp. Crítica (°C)</label>
                    <div className="flex gap-1">
                      <input type="number" value={config.limiteTemp || 35} onChange={(e) => setConfig({...config, limiteTemp: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs font-mono" />
                      <button onClick={() => salvarConfig('limiteTemp', config.limiteTemp)} className="bg-[#001140] text-white px-3 rounded text-[9px] font-bold">SET</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Humidade Máx (%)</label>
                    <div className="flex gap-1">
                      <input type="number" value={config.limiteHumidade || 90} onChange={(e) => setConfig({...config, limiteHumidade: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs font-mono" />
                      <button onClick={() => salvarConfig('limiteHumidade', config.limiteHumidade)} className="bg-[#001140] text-white px-3 rounded text-[9px] font-bold">SET</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Nível Mínimo (L)</label>
                    <div className="flex gap-1">
                      <input type="number" value={config.limiteCombustivel || 49} onChange={(e) => setConfig({...config, limiteCombustivel: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs font-mono" />
                      <button onClick={() => salvarConfig('limiteCombustivel', config.limiteCombustivel)} className="bg-[#001140] text-white px-3 rounded text-[9px] font-bold">SET</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50/30">
                <h3 className="text-[10px] font-black text-[#001140] uppercase mb-4 opacity-50">Setpoints: Stock Laranja (Gás)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Temp. Máxima (°C)</label>
                    <div className="flex gap-1">
                      <input type="number" value={config.limiteTempGas || 35} onChange={(e) => setConfig({...config, limiteTempGas: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs font-mono" />
                      <button onClick={() => salvarConfig('limiteTempGas', config.limiteTempGas)} className="bg-[#001140] text-white px-3 rounded text-[9px] font-bold">SET</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Humidade Máx (%)</label>
                    <div className="flex gap-1">
                      <input type="number" value={config.limiteHumidadeGas || 90} onChange={(e) => setConfig({...config, limiteHumidadeGas: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs font-mono" />
                      <button onClick={() => salvarConfig('limiteHumidadeGas', config.limiteHumidadeGas)} className="bg-[#001140] text-white px-3 rounded text-[9px] font-bold">SET</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Stock Mínimo (Un)</label>
                    <div className="flex gap-1">
                      <input type="number" value={config.limiteUnidades || 10} onChange={(e) => setConfig({...config, limiteUnidades: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs font-mono" />
                      <button onClick={() => salvarConfig('limiteUnidades', config.limiteUnidades)} className="bg-[#001140] text-white px-3 rounded text-[9px] font-bold">SET</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 bg-[#FBFBFC]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white border border-gray-200 rounded flex items-center justify-center text-[#001140] shadow-sm">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#001140]">Relatórios Técnicos</h3>
                  <p className="text-[11px] text-gray-400 font-medium">Exportar status atual dos ativos para PDF.</p>
                </div>
              </div>
              <button onClick={gerarPDF} className="flex items-center gap-2 bg-white border border-gray-300 px-6 py-2.5 rounded text-[11px] font-black uppercase hover:border-[#001140] transition-all shadow-sm">
                Download PDF <ChevronRight size={14}/>
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Activity size={14} /> Sistema
            </h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-100">
              <span className="text-xs font-bold text-[#001140]">Alertas Sonoros</span>
              <button onClick={() => salvarConfig('somAtivado', !config.somAtivado)} className={`w-10 h-5 rounded-full relative transition-all ${config.somAtivado ? 'bg-green-600' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.somAtivado ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="bg-red-50/30 border border-red-100 rounded-lg p-6">
            <h2 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Danger Zone</h2>
            <button 
              onClick={() => setShowResetModal(true)}
              className="w-full py-2 bg-white border border-red-200 text-red-600 rounded text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all shadow-sm"
            >
              Reset Total do Sistema
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}