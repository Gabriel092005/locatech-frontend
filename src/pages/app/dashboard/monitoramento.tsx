import { Thermometer, Droplets, Flame, Gauge } from 'lucide-react';

export function Monitoramento() {
  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <h2 className="text-gray-400 font-semibold mb-6 text-lg">
        Posto Etu Energies - Viana Sede
      </h2>
      
      {/* Badge Central de Título */}
      <div className="flex justify-center mb-10">
        <div className="bg-[#e5e7eb] px-14 py-3 rounded-full text-gray-700 font-bold uppercase tracking-[0.2em] text-sm">
          Monitoramento Geral
        </div>
      </div>

      {/* Grid de Tanques e Stocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Bloco: Tanque A Gasolina */}
        <div className="bg-[#f3f4f6] rounded-[45px] p-10 flex flex-col items-center border border-gray-100 shadow-inner">
          <h3 className="text-xl font-bold text-[#001140] mb-6">Tanque A Gasolina</h3>
          
          <div className="space-y-4 w-full max-w-[240px]">
            <div className="flex items-center gap-3">
              <Thermometer size={20} className="text-gray-500" />
              <span className="text-gray-700">Temperatura: <span className="text-red-500 font-bold">35°C</span></span>
            </div>
            <div className="flex items-center gap-3">
              <Droplets size={20} className="text-blue-500" />
              <span className="text-gray-700">Humidade: <span className="text-blue-600 font-bold">80%</span></span>
            </div>
            <div className="flex items-center gap-3">
              <Flame size={20} className="text-orange-600" />
              <span className="text-gray-700 italic">Vazamento de fogo: <span className="text-red-600 font-bold uppercase animate-pulse">Activo</span></span>
            </div>
          </div>

          <button className="mt-10 bg-[#16a34a] text-white font-black py-2.5 px-14 rounded-full shadow-md hover:brightness-110">
            250L
          </button>
        </div>

        {/* Bloco: Stock Gás (ATUALIZADO COM HUMIDADE) */}
        <div className="bg-[#f3f4f6] rounded-[45px] p-10 flex flex-col items-center border border-gray-100 shadow-inner">
          <h3 className="text-xl font-bold text-[#001140] mb-6">Stock Laranja 13kg</h3>
          
          <div className="space-y-4 w-full max-w-[240px]">
            <div className="flex items-center gap-3">
              <Thermometer size={20} className="text-gray-500" />
              <span className="text-gray-700">Temperatura: <span className="text-red-500 font-bold">35°C</span></span>
            </div>
            {/* NOVO DADO ADICIONADO ABAIXO */}
            <div className="flex items-center gap-3">
              <Droplets size={20} className="text-blue-500" />
              <span className="text-gray-700">Humidade: <span className="text-blue-600 font-bold">80%</span></span>
            </div>
            <div className="flex items-center gap-3">
              <Gauge size={20} className="text-gray-500" />
              <span className="text-gray-700">Vazamento de gás: <span className="text-green-600 font-bold">None</span></span>
            </div>
            <div className="flex items-center gap-3">
              <Flame size={20} className="text-orange-600" />
              <span className="text-gray-700 italic">Vazamento de fogo: <span className="text-red-600 font-bold uppercase animate-pulse">Activo</span></span>
            </div>
          </div>

          <button className="mt-10 bg-[#fbbf24] text-white font-black py-2.5 px-10 rounded-full shadow-md hover:brightness-110">
            100 Unidades
          </button>
        </div>

      </div>
    </div>
  );
}