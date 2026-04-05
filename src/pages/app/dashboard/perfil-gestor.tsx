import { User, Camera, Plus, Edit2, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // IMPORTADO

export function PerfilGestor() {
  const navigate = useNavigate(); // INSTANCIADO

  return (
    <div className="flex flex-col h-full overflow-hidden px-2">
      
      {/* 1. Header de Ações Rápidas - Margem reduzida (mb-4) */}
      <div className="flex justify-end gap-2 mb-4">
        <button className="bg-[#001140] text-white px-4 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-[#001a66] transition-colors shadow-sm">
          <Plus size={14} /> Criar um Posto
        </button>
        
        {/* BOTÃO ATUALIZADO COM NAVEGAÇÃO */}
        <button 
          onClick={() => navigate('/gestor/editar-posto')}
          className="bg-[#001140] text-white px-4 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-[#001a66] transition-colors shadow-sm"
        >
          <Edit2 size={12} /> Editar Posto
        </button>

        <button className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold hover:bg-red-700 transition-colors shadow-sm">
          Sair da conta
        </button>
        <button className="bg-gray-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
          Status <ChevronDown size={12} />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        
        {/* 2. Card de Foto - Padding reduzido (p-4) e Ícone menor */}
        <div className="bg-[#e5e7eb] rounded-[20px] p-4 flex items-center justify-between shadow-sm border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="shrink-0 p-2 bg-white rounded-full shadow-inner">
              <User size={45} className="text-black" />
            </div>
            <h2 className="text-lg font-black text-black tracking-tight uppercase">
              Atualizar uma Nova Foto
            </h2>
          </div>
          
          <button className="bg-[#001140] text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md">
            <Camera size={16} /> Actualizar
          </button>
        </div>

        {/* 3. Card de Informações - Padding vertical reduzido (py-5) */}
        <div className="bg-[#e5e7eb] rounded-[20px] px-8 py-5 flex flex-col items-center shadow-sm border border-gray-200/50">
          <h3 className="text-base font-black text-black mb-5 uppercase tracking-wide">
            Trocar as informações do usuário aqui:
          </h3>

          {/* Grid mais compacta (gap-y-4) */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full max-w-4xl">
            <input 
              type="text" 
              placeholder="Nome Completo"
              className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
            />
            <input 
              type="email" 
              placeholder="E-mail"
              className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
            />
            <input 
              type="text" 
              placeholder="Contactos"
              className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
            />
            <input 
              type="password" 
              placeholder="Palavra-Passe"
              className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
            />
          </div>

          {/* Botões de Ação Final - Margem superior reduzida (mt-6) */}
          <div className="flex flex-col items-center gap-3 mt-6 w-full max-w-xs">
            <button className="w-full bg-[#6b7280] hover:bg-[#4b5563] text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md">
              Actualizar as Informações
            </button>
            <button className="w-fit bg-red-600 hover:bg-red-700 text-white font-bold px-10 py-2 rounded-xl transition-all shadow-md uppercase text-[10px]">
              Excluir Conta
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}