import { Fuel, Edit3, MapPin, Clock, ChevronRight, Droplets, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';

interface PostoResumo {
  id: number;
  nome: string;
  tipo: string;
  endereco: string | null;
  horario_funcionamento: string | null;
  latitude: number | null;
  longitude: number | null;
  produtos: { id: number; nome: string; preco: number }[];
}

function getProdutoIcon(nome: string, className = "w-3.5 h-3.5") {
  const n = nome.toLowerCase();
  if (n.includes("gasolina")) return <Droplets className={`${className} text-orange-500`} />;
  if (n.includes("gasóleo") || n.includes("diesel")) return <Fuel className={`${className} text-blue-500`} />;
  if (n.includes("gás")) return <Zap className={`${className} text-green-500`} />;
  return <Fuel className={`${className} text-slate-400`} />;
}

const TIPO_STYLES: Record<string, string> = {
  MISTO: "bg-purple-100 text-purple-700 border-purple-200",
  COMBUSTIVEL: "bg-blue-100 text-blue-700 border-blue-200",
  GAS: "bg-green-100 text-green-700 border-green-200",
};

const TIPO_LABELS: Record<string, string> = {
  MISTO: "Misto",
  COMBUSTIVEL: "Combustível",
  GAS: "Gás",
};

export function GerirPostosPage() {
  const navigate = useNavigate();
  const [postos, setPostos] = useState<PostoResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get<{ postos: PostoResumo[] }>('/postos/meus');
        setPostos(data.postos || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Erro ao carregar postos.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#edf0f4] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0d1b3e] flex items-center justify-center shadow-lg">
            <Fuel className="w-6 h-6 text-white" />
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#0d1b3e]/40 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edf0f4] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mb-8 bg-gradient-to-r from-[#0d1b3e] to-[#162251] rounded-3xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
              <Edit3 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black">Gerir Postos</h1>
              <p className="text-white/70 mt-1">
                {postos.length === 0
                  ? 'Nenhum posto registado.'
                  : `${postos.length} posto${postos.length !== 1 ? 's' : ''} sob a sua gestão`}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="text-sm font-semibold text-red-700">{error}</span>
          </div>
        )}

        {postos.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-slate-100">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Fuel className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-900 font-black text-lg">Nenhum posto encontrado</p>
            <p className="text-slate-500 mt-3 max-w-md mx-auto text-sm">
              Os postos que criar no dashboard aparecerão aqui para gestão.
            </p>
            <button onClick={() => navigate('/dashboard')}
              className="mt-6 px-6 py-2.5 bg-[#0d1b3e] text-white text-sm font-bold rounded-full hover:opacity-90 transition-opacity">
              Ir para o Dashboard
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {postos.map((posto, index) => (
              <div key={posto.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-slate-100 group cursor-pointer"
                onClick={() => navigate(`/dashboard/editar-posto/${posto.id}`)}
              >
                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-[#0d1b3e]/5 flex items-center justify-center text-[#0d1b3e] text-xs font-black shrink-0">
                          {index + 1}
                        </div>
                        <h3 className="font-black text-slate-900 text-lg truncate group-hover:text-[#0d1b3e] transition-colors">
                          {posto.nome}
                        </h3>
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full shrink-0 border ${TIPO_STYLES[posto.tipo] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {TIPO_LABELS[posto.tipo] || posto.tipo}
                        </span>
                      </div>

                      {posto.endereco && (
                        <div className="flex items-start gap-2 text-slate-500 mb-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span className="text-sm">{posto.endereco}</span>
                        </div>
                      )}

                      {posto.horario_funcionamento && (
                        <div className="flex items-center gap-2 text-slate-400 mb-3">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-sm">{posto.horario_funcionamento}</span>
                        </div>
                      )}

                      {posto.produtos.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {posto.produtos.map((p) => (
                            <div key={p.id} className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5">
                              {getProdutoIcon(p.nome)}
                              <span className="text-[11px] font-semibold text-slate-700">{p.nome}</span>
                              <span className="text-[11px] font-bold text-[#0d1b3e]">{p.preco.toLocaleString('pt-AO')} Kz</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#0d1b3e]/5 group-hover:bg-[#0d1b3e] text-[#0d1b3e] group-hover:text-white transition-all">
                        <Edit3 className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
