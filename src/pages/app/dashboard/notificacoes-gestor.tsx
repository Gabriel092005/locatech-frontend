import { AlertTriangle, Thermometer, Droplets, Flame, Gauge } from 'lucide-react';

export function NotificacoesGestor() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* Cabeçalho no canto superior esquerdo - Margem reduzida (mb-4) */}
      <h2 className="text-gray-400 font-semibold mb-4 text-lg">
        Posto Etu Energies - Viana Sede
      </h2>

      <div className="flex flex-col h-full gap-4">
        
        {/* Título Centralizado - Margem superior zero (mt-0) e padding menor */}
        <div className="flex justify-center mt-0">
          <div className="bg-[#e5e7eb] px-12 py-2 rounded-full text-gray-700 font-bold uppercase tracking-[0.25em] text-xs shadow-sm">
            MONITORAMENTO GERAL
          </div>
        </div>

        {/* Lista de Alertas - Gap reduzido para gap-3 */}
        <div className="flex flex-col gap-3">

          {/* ALERTA 1: Stock Laranja - Padding reduzido (p-6) */}
          <div className="bg-[#e5e7eb] rounded-[20px] p-6 flex items-center gap-6 shadow-sm border border-gray-200/50">
            <div className="shrink-0 p-3 bg-white rounded-2xl shadow-inner">
              <AlertTriangle size={32} className="text-black" />
            </div>
            
            <div className="flex-1 flex flex-col items-center gap-1">
              <h3 className="text-sm font-bold text-black uppercase tracking-wider">Stock Laranja 13kg</h3>
              <div className="flex items-center gap-2">
                <span className="text-black text-base font-bold flex items-center gap-2">
                  <Thermometer size={20} className="text-gray-500" />
                  Temperatura: <span className="text-red-600">Muito alta (35°C)</span>
                </span>
              </div>
            </div>

            <div className="shrink-0 bg-red-600 text-white font-bold px-5 py-1.5 rounded-full text-xs shadow-md">
              13 unidades
            </div>
          </div>

          {/* ALERTA 2: Tanque Gasolina */}
          <div className="bg-[#e5e7eb] rounded-[20px] p-6 flex items-center gap-6 shadow-sm border border-gray-200/50">
            <div className="shrink-0 p-3 bg-white rounded-2xl shadow-inner">
              <AlertTriangle size={32} className="text-black" />
            </div>
            
            <div className="flex-1 flex flex-col items-center gap-1">
              <h3 className="text-sm font-bold text-black uppercase tracking-wider">Tanque A Gasolina</h3>
              <div className="flex items-center gap-2">
                <span className="text-black text-base font-bold flex items-center gap-2">
                  <Droplets size={20} className="text-black" />
                  Humidade: <span className="text-amber-500">Preocupante (70%)</span>
                </span>
              </div>
            </div>

            <div className="shrink-0 bg-red-600 text-white font-bold px-8 py-1.5 rounded-full text-xs shadow-md">
              50L
            </div>
          </div>

          {/* ALERTA 3: Bloco com Divisória Vertical - Mais compacto */}
          <div className="bg-[#e5e7eb] rounded-[20px] p-6 flex items-center gap-6 shadow-sm border border-gray-200/50">
            <div className="shrink-0 p-3 bg-white rounded-2xl shadow-inner">
              <AlertTriangle size={32} className="text-black" />
            </div>
            
            {/* Lado Esquerdo */}
            <div className="flex-1 flex flex-col items-center gap-1">
              <h3 className="text-sm font-bold text-black uppercase tracking-wider">Tanque A Gasolina</h3>
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-black" />
                <span className="text-black text-xs font-bold uppercase">
                  Fogo: <span className="text-red-600">Activo</span>
                </span>
              </div>
            </div>

            {/* Linha Vertical Divisória - Altura menor (h-12) */}
            <div className="w-[1.5px] h-12 bg-black/30 shrink-0" />

            {/* Lado Direito */}
            <div className="flex-1 flex flex-col items-center gap-1">
              <h3 className="text-sm font-bold text-black uppercase tracking-wider">Stock Laranja 13kg</h3>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <Flame size={18} className="text-black" />
                  <span className="text-black text-xs font-bold uppercase">
                    Fogo: <span className="text-red-600">Activo</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge size={18} className="text-black" />
                  <span className="text-black text-xs font-bold uppercase">
                    Gás: <span className="text-red-600">Activo</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}