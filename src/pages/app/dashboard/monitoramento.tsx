import { useSensores } from '../../../context/SensorContext';
import { Thermometer, Droplets, Flame, Gauge } from 'lucide-react';

export function Monitoramento() {
  // Pegamos os dados do contexto global (SensorProvider)
  const context = useSensores();

  console.log(context)
  
  // PROTEÇÃO: Se o contexto ou dispositivos não existirem, mostra loading
  if (!context || !context.dispositivos) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500 animate-pulse font-medium">
          Carregando sensores...
        </div>
      </div>
    );
  }

  const { dispositivos } = context;

  /**
   * Função para definir a cor do botão de estoque com base no dispositivo
   * @param qtd Valor atual do estoque
   * @param id ID do dispositivo (esp1 ou esp2)
   */
  const getStockColor = (qtd: number, id: string) => {
    if (id === 'esp1') {
      // Regras para Tanque A Gasolina (0-250L)
      if (qtd <= 49) return 'bg-red-600';      // Vermelho (Crítico)
      if (qtd <= 149) return 'bg-yellow-500';  // Amarelo (Médio)
      return 'bg-[#1EB056]';                   // Verde (Normal)
    } else {
      // Regras para Stock Laranja (Unidades)
      if (qtd <= 10) return 'bg-red-600';
      if (qtd <= 20) return 'bg-yellow-500';
      return 'bg-[#1EB056]';
    }
  };

  return (
    <div className="flex flex-col h-full p-6 bg-white overflow-y-auto">
      <h2 className="text-gray-400 font-semibold mb-6 text-lg">Posto Etu Energies - Viana Sede</h2>
      
      <div className="flex justify-center mb-10">
        <div className="bg-[#e5e7eb] px-14 py-3 rounded-full text-gray-700 font-bold uppercase tracking-[0.2em] text-sm">
          Monitoramento Geral
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* ── CARD A - TANQUE GASOLINA ── */}
        <div className="bg-[#f3f4f6] rounded-[45px] p-10 flex flex-col items-center border border-gray-100 shadow-inner">
          <h3 className="text-xl font-bold text-[#001140] mb-8 uppercase tracking-wide">Tanque A Gasolina</h3>
          
          <div className="space-y-5 w-full max-w-[260px]">
            <div className="flex items-center gap-4 text-lg">
              <Thermometer size={24} className="text-gray-400" />
              <span className="text-gray-600">Temperatura: 
                <span className="text-[#E35D5D] font-bold ml-1">
                  {(dispositivos.esp1?.temp ?? 0).toFixed(1)}°C
                </span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-lg">
              <Droplets size={24} className="text-gray-400" />
              <span className="text-gray-600">Humidade: 
                <span className="text-[#4A72B2] font-bold ml-1">
                  {(dispositivos.esp1?.humi ?? 0).toFixed(1)}%
                </span>
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-4 text-lg text-gray-600"><Flame size={24} className="text-gray-400" /> Vazamento de fogo:</div>
              <div className={`ml-10 font-bold italic text-xl ${dispositivos.esp1?.fogo ? "text-red-600 animate-pulse" : "text-gray-400"}`}>
                {dispositivos.esp1?.fogo ? "ACTIVO" : "INACTIVO"}
              </div>
            </div>
          </div>

          {/* BOTÃO DE ESTOQUE - DINÂMICO GASOLINA */}
          <button className={`mt-12 text-white font-black py-3 px-12 rounded-full shadow-lg text-xl transition-colors duration-500 ${getStockColor(dispositivos.esp1?.stock ?? 0, 'esp1')}`}>
            {dispositivos.esp1?.stock ?? 0}L
          </button>
        </div>

        {/* ── CARD B - STOCK LARANJA ── */}
        <div className="bg-[#f3f4f6] rounded-[45px] p-10 flex flex-col items-center border border-gray-100 shadow-inner">
          <h3 className="text-xl font-bold text-[#001140] mb-8 uppercase text-center">Stock Laranja 13kg</h3>
          
          <div className="space-y-5 w-full max-w-[260px]">
            <div className="flex items-center gap-4 text-lg">
              <Thermometer size={24} className="text-gray-400" />
              <span className="text-gray-600">Temperatura: 
                <span className="text-red-500 font-bold ml-1">
                  {(dispositivos.esp2?.temp ?? 0).toFixed(1)}°C
                </span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-lg">
              <Droplets size={24} className="text-gray-400" />
              <span className="text-gray-600">Humidade: 
                <span className="text-blue-600 font-bold ml-1">
                  {(dispositivos.esp2?.humi ?? 0).toFixed(1)}%
                </span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-lg">
              <Gauge size={24} className="text-gray-400" />
              <span className="text-gray-600">Gás: 
                <span className={`ml-1 font-bold ${dispositivos.esp2?.gas ? "text-red-600" : "text-green-600"}`}>
                  {dispositivos.esp2?.gas ? "ALERTA" : "NORMAL"}
                </span>
              </span>
            </div>

            <div className="flex flex-col gap-1 text-lg text-gray-600">
              <div className="flex items-center gap-4"><Flame size={24} className="text-gray-400" /> Fogo:</div>
              <div className={`ml-10 font-bold italic text-xl ${dispositivos.esp2?.fogo ? "text-red-600 animate-pulse" : "text-gray-400"}`}>
                {dispositivos.esp2?.fogo ? "ACTIVO" : "INACTIVO"}
              </div>
            </div>
          </div>

          {/* BOTÃO DE ESTOQUE - DINÂMICO GÁS */}
          <button className={`mt-12 text-white font-black py-3 px-12 rounded-full shadow-lg text-xl transition-colors duration-500 ${getStockColor(dispositivos.esp2?.stock ?? 0, 'esp2')}`}>
            {dispositivos.esp2?.stock ?? 0} Unidades
          </button>
        </div>

      </div>
    </div>
  );
}