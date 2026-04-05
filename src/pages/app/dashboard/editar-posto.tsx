import { ArrowLeft, ChevronDown, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function EditarPosto() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full overflow-hidden px-2">
      
      {/* 1. Top Bar com Botão Voltar */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-black font-bold text-sm transition-colors"
        >
          <ArrowLeft size={18} /> Voltar
        </button>

        <div className="bg-[#e5e7eb] px-12 py-2 rounded-full text-gray-700 font-bold uppercase tracking-[0.15em] text-xs shadow-sm">
          Edite as informações do Posto
        </div>
        
        <div className="w-[80px]" /> {/* Spacer para equilibrar o título centralizado */}
      </div>

      {/* 2. Container Principal de Formulários */}
      <div className="grid grid-cols-2 gap-6 flex-1 h-fit">
        
        {/* Bloco Esquerdo: Informações Institucionais */}
        <div className="bg-[#e5e7eb] rounded-[20px] p-8 flex flex-col gap-5 shadow-sm border border-gray-200/50">
          <input 
            type="text" 
            placeholder="Nome da Empresa"
            className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
          />
          <input 
            type="email" 
            placeholder="E-mail Institucional"
            className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
          />
          <div className="relative">
            <select className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium appearance-none">
              <option>Tipo de Empresa</option>
              <option>Posto de Combustível</option>
              <option>Distribuidora</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-4 text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="NIF"
            className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
          />
        </div>

        {/* Bloco Direito: Localização e Operação */}
        <div className="bg-[#e5e7eb] rounded-[20px] p-8 flex flex-col gap-5 shadow-sm border border-gray-200/50">
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Latitude"
              className="p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
            />
            <input 
              type="text" 
              placeholder="Longitude"
              className="p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Produtos"
              className="p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
            />
            <input 
              type="text" 
              placeholder="Preço Actual"
              className="p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
            />
          </div>

          <input 
            type="text" 
            placeholder="Horário de Funcionamento"
            className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
          />

          <div className="relative">
            <button className="w-full p-3 rounded-xl border border-gray-300 bg-white text-xs font-medium text-left text-gray-400 flex justify-between items-center">
              Upload do Alvará
              <Upload size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Botão Salvar (Centralizado abaixo dos blocos) */}
      <div className="flex justify-center mt-6">
        <button className="bg-[#15a300] hover:bg-[#128a00] text-white font-black px-24 py-3 rounded-full text-sm uppercase shadow-lg transition-transform active:scale-95">
          Salvar
        </button>
      </div>
    </div>
  );
}