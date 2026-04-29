import { JSX, useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Bookmark, MapPin, Clock, Fuel, Navigation, Flame, Droplets, Zap } from "lucide-react";

interface PostoAPI {
  id: number;
  nome: string;
  tipo: string;
  latitude: number | null;
  longitude: number | null;
  endereco?: string | null;
  horario_funcionamento?: string | null;
  stocks?: { preco_unitario: number; produto: { nome: string } }[];
}

interface Station {
  id: number;
  name: string;
  open: boolean;
  address: string;
  tipo: string;
  horario: string;
  precos: { produto: string; valor: number; icon: JSX.Element }[];
  latitude: number | null;
  longitude: number | null;
}

function getProdutoIcon(nome: string) {
  const nomeLower = nome.toLowerCase();
  if (nomeLower.includes("gasolina")) return <Flame className="w-3.5 h-3.5 text-orange-500" />;
  if (nomeLower.includes("gasoleo") || nomeLower.includes("diesel")) return <Droplets className="w-3.5 h-3.5 text-blue-500" />;
  if (nomeLower.includes("gas")) return <Zap className="w-3.5 h-3.5 text-green-500" />;
  return <Fuel className="w-3.5 h-3.5 text-slate-500" />;
}

function postoToStation(p: PostoAPI): Station {
  const precos = (p.stocks ?? []).map((s) => ({
    produto: s.produto.nome,
    valor: s.preco_unitario,
    icon: getProdutoIcon(s.produto.nome),
  }));

  return {
    id: p.id,
    name: p.nome,
    open: !!p.horario_funcionamento,
    address: p.endereco ?? "Endereço não disponível",
    tipo: p.tipo === "COMBUSTIVEL" ? "Combustível" : p.tipo === "GAS" ? "Gás" : "Misto",
    horario: p.horario_funcionamento ?? "Horário não informado",
    precos,
    latitude: p.latitude,
    longitude: p.longitude,
  };
}

export function SavedPostsPage() {
  const [savedPosts, setSavedPosts] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSaved() {
      try {
        const { data } = await api.get<{ postos: PostoAPI[] }>("/saved-postos");
        const stations = (data.postos || []).map(postoToStation);
        setSavedPosts(stations);
      } catch (err) {
        console.error("Erro ao carregar postos salvos:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSaved();
  }, []);

  async function removeSaved(id: number) {
    try {
      await api.post(`/saved-postos/${id}`);
      setSavedPosts((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Erro ao remover:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#edf0f4]">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0d1b3e]/20"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0d1b3e] absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edf0f4] p-6 md:p-10">
      {/* Header com gradiente */}
      <div className="mb-8 bg-gradient-to-r from-[#0d1b3e] to-[#162251] rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
            <Bookmark className="w-7 h-7 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black">Postos Salvos</h1>
            <p className="text-white/70 mt-1">
              {savedPosts.length === 0
                ? "Nenhum posto salvo ainda."
                : `${savedPosts.length} posto${savedPosts.length !== 1 ? "s" : ""} salvo${savedPosts.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </div>

      {savedPosts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-slate-100">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bookmark className="w-10 h-10 text-slate-300" />
          </div>
          <p className="text-slate-900 font-black text-lg">Nenhum posto salvo</p>
          <p className="text-slate-500 mt-3 max-w-md mx-auto">
            Clique no ícone de <Bookmark className="w-4 h-4 inline text-amber-400 fill-amber-400" /> bookmark nos
            postos no dashboard para salvá-los e eles aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {savedPosts.map((posto) => (
            <div
              key={posto.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              {/* Barra superior colorida baseada no status */}
              <div className={`h-1.5 ${posto.open ? "bg-green-500" : "bg-red-400"}`} />

              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    {/* Título e status */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-3 h-3 rounded-full shrink-0 ${
                          posto.open ? "bg-green-500" : "bg-red-400"
                        } shadow-lg ${posto.open ? "shadow-green-500/50" : "shadow-red-400/50"}`}
                      />
                      <h3 className="font-black text-slate-900 text-lg truncate">{posto.name}</h3>
                      <span
                        className={`text-[10px] font-bold px-3 py-1 rounded-full shrink-0 ${
                          posto.open
                            ? "bg-green-50 text-green-600 border border-green-200"
                            : "bg-red-50 text-red-600 border border-red-200"
                        }`}
                      >
                        {posto.open ? "ABERTO" : "FECHADO"}
                      </span>
                    </div>

                    {/* Endereço */}
                    <div className="flex items-start gap-2 text-slate-600 mb-2">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[#0d1b3e]" />
                      <span className="text-sm">{posto.address}</span>
                    </div>

                    {/* Horário */}
                    <div className="flex items-center gap-2 text-slate-500 mb-4">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span className="text-sm">{posto.horario}</span>
                    </div>

                    {/* Preços com design melhorado */}
                    {posto.precos.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {posto.precos.map((p, idx) => (
                          <div
                            key={p.produto}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                              idx === 0
                                ? "bg-[#0d1b3e]/5 border-[#0d1b3e]/20"
                                : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            {p.icon}
                            <div className="flex flex-col">
                              <span className="text-[11px] text-slate-500 font-medium">{p.produto}</span>
                              <span className="text-sm font-black text-[#0d1b3e]">
                                {p.valor.toLocaleString("pt-AO")}{" "}
                                <span className="text-[10px]">Kz</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-3 shrink-0">
                    <button
                      onClick={() => removeSaved(posto.id)}
                      className="group/btn p-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition-all duration-200 border border-red-100 hover:border-red-200"
                      title="Remover dos salvos"
                    >
                      <Bookmark className="w-5 h-5 fill-red-500 text-red-500 group-hover/btn:scale-110 transition-transform" />
                    </button>

                    {posto.latitude && posto.longitude && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${posto.latitude},${posto.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-[#0d1b3e] hover:bg-[#162251] text-white transition-all duration-200 hover:scale-105 shadow-lg shadow-[#0d1b3e]/20 flex items-center justify-center"
                        title="Navegar até o posto"
                      >
                        <Navigation className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Tipo de posto tag */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                      posto.tipo === "Combustível"
                        ? "bg-blue-50 text-blue-600"
                        : posto.tipo === "Gás"
                        ? "bg-green-50 text-green-600"
                        : "bg-purple-50 text-purple-600"
                    }`}
                  >
                    {posto.tipo}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
