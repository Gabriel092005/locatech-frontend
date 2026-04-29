import { ArrowLeft, ChevronDown, Upload, Fuel, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { useParams } from 'react-router-dom';

interface PostoData {
  id: number;
  nome: string;
  email_institucional: string;
  nif: string;
  tipo: string;
  endereco: string;
  horario_funcionamento: string;
  latitude: number | null;
  longitude: number | null;
  stocks?: { id: number; produto: { nome: string }; preco_unitario: number }[];
}

export function EditarPosto() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [posto, setPosto] = useState<PostoData | null>(null);
  const [form, setForm] = useState({
    nome: '',
    email_institucional: '',
    nif: '',
    tipo: 'MISTO' as string,
    endereco: '',
    horario_funcionamento: '',
    latitude: '',
    longitude: '',
    produto: '',
    preco: '',
  });

  useEffect(() => {
    async function loadPosto() {
      try {
        const { data } = await api.get<{ posto: PostoData }>(`/postos/${id || '1'}`);
        const p = data.posto;
        setPosto(p);
        setForm({
          nome: p.nome || '',
          email_institucional: p.email_institucional || '',
          nif: p.nif || '',
          tipo: p.tipo || 'MISTO',
          endereco: p.endereco || '',
          horario_funcionamento: p.horario_funcionamento || '',
          latitude: p.latitude?.toString() || '',
          longitude: p.longitude?.toString() || '',
          produto: p.stocks?.[0]?.produto?.nome || '',
          preco: p.stocks?.[0]?.preco_unitario?.toString() || '',
        });
      } catch (err) {
        console.error("Erro ao carregar posto:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPosto();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const payload: any = {
        nome: form.nome,
        email_institucional: form.email_institucional,
        nif: form.nif,
        tipo: form.tipo,
        endereco: form.endereco,
        horario_funcionamento: form.horario_funcionamento,
      };

      if (form.latitude) payload.latitude = parseFloat(form.latitude);
      if (form.longitude) payload.longitude = parseFloat(form.longitude);

      await api.patch(`/postos/${id || posto?.id}`, payload);

      // Atualizar preço se fornecido
      if (form.preco && posto?.stocks?.[0]) {
        await api.patch(`/stocks/${posto.stocks[0].id}`, {
          preco_unitario: parseFloat(form.preco),
        });
      }

      alert("Posto atualizado com sucesso!");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d1b3e]"></div>
      </div>
    );
  }

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
        
        <div className="w-[80px]" /> {/* Spacer para equilibrar o título */}
      </div>

      {/* 2. Container Principal de Formulários */}
      <div className="grid grid-cols-2 gap-6 flex-1 h-fit">
         
        {/* Bloco Esquerdo: Informações Institucionais */}
        <div className="bg-[#e5e7eb] rounded-[20px] p-8 flex flex-col gap-5 shadow-sm border border-gray-200/50">
          <input 
            type="text" 
            placeholder="Nome da Empresa"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
          />
          <input 
            type="email" 
            placeholder="E-mail Institucional"
            value={form.email_institucional}
            onChange={(e) => setForm({ ...form, email_institucional: e.target.value })}
            className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
          />
          <div className="relative">
            <select 
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}
              className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium appearance-none"
            >
              <option value="MISTO">Misto</option>
              <option value="COMBUSTIVEL">Combustível</option>
              <option value="GAS">Gás</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-4 text-gray-400 pointer-events-none" />
          </div>
          <input 
            type="text" 
            placeholder="NIF"
            value={form.nif}
            onChange={(e) => setForm({ ...form, nif: e.target.value })}
            className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
          />
        </div>

        {/* Bloco Direito: Localização e Operação */}
        <div className="bg-[#e5e7eb] rounded-[20px] p-8 flex flex-col gap-5 shadow-sm border border-gray-200/50">
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Latitude"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              className="p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
            />
            <input 
              type="text" 
              placeholder="Longitude"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              className="p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <select 
                value={form.produto}
                onChange={(e) => setForm({ ...form, produto: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium appearance-none"
              >
                <option value="">Selecione o Produto</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Gasóleo">Gasóleo</option>
                <option value="Gás">Gás</option>
              </select>
              <Fuel size={14} className="absolute right-4 top-4 text-gray-400 pointer-events-none" />
            </div>
            <input 
              type="text" 
              placeholder="Preço Atual (Kz)"
              value={form.preco}
              onChange={(e) => setForm({ ...form, preco: e.target.value })}
              className="p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
            />
          </div>

          <input 
            type="text" 
            placeholder="Horário de Funcionamento (ex: 07h–22h)"
            value={form.horario_funcionamento}
            onChange={(e) => setForm({ ...form, horario_funcionamento: e.target.value })}
            className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none bg-white text-xs font-medium"
          />

          <div className="relative">
            <button className="w-full p-3 rounded-xl border border-gray-300 bg-white text-xs font-medium text-left text-gray-400 flex justify-between items-center hover:bg-gray-50 transition-colors">
              Upload do Alvará (Opcional)
              <Upload size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Botão Salvar (Centralizado abaixo dos blocos) */}
      <div className="flex justify-center mt-6">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-[#15a300] hover:bg-[#128a00] disabled:opacity-60 text-white font-black px-24 py-3 rounded-full text-sm uppercase shadow-lg transition-transform active:scale-95 flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save size={16} /> Salvar Alterações
            </>
          )}
        </button>
      </div>
    </div>
  );
}