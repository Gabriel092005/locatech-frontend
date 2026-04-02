import { JSX, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/axios";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PostoAPI {
  id: number;
  nome: string;
  tipo: string;
  latitude: number | null;
  longitude: number | null;
  endereco?: string;
  horario_funcionamento?: string;
  email_institucional?: string;
  nif?: string;
  stocks?: { preco_unitario: number; produto: { nome: string } }[];
  dist?: number; // km — vem da rota /proximos
}

interface Station {
  id: number;
  name: string;
  open: boolean;
  address: string;
  rating: number;
  reviews: number;
  tipo: string;
  horario: string;
  dist: string;
  produtos: string[];
  precos: { produto: string; valor: number }[];
  tanques: { nome: string; volume: number; nivel: string }[];
  latitude: number | null;
  longitude: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function postoToStation(p: PostoAPI): Station {
  return {
    id:       p.id,
    name:     p.nome,
    open:     !!p.horario_funcionamento,
    address:  p.endereco ?? "—",
    rating:   4.0,
    reviews:  0,
    tipo:     p.tipo === "COMBUSTIVEL" ? "Combustível" : p.tipo === "GAS" ? "Gás" : "Misto",
    horario:  p.horario_funcionamento ?? "Consulte o posto",
    dist:     p.dist != null ? `${p.dist.toFixed(1)} km` : "—",
    produtos: p.stocks?.map((s) => s.produto.nome) ?? [],
    precos:   p.stocks?.map((s) => ({ produto: s.produto.nome, valor: s.preco_unitario })) ?? [],
    tanques:  [],
    latitude:  p.latitude,
    longitude: p.longitude,
  };
}

// ── Fallback ──────────────────────────────────────────────────────────────────
const stationsDefault: Station[] = [
  {
    id: 1,
    name: "Posto Sonangol",
    open: true,
    address: "Via Avenida Deolinda Rodrigues / Luanda / Angola",
    rating: 3.5,
    reviews: 113,
    tipo: "Gas station",
    horario: "Open 24 hours",
    dist: "0.8 km",
    latitude: -8.8368,
    longitude: 13.2543,
    produtos: ["Gasolina", "Gasóleo"],
    precos: [{ produto: "Gasolina", valor: 300 }, { produto: "Gasóleo", valor: 200 }],
    tanques: [
      { nome: "Tanque 1", volume: 250, nivel: "alto" },
      { nome: "Tanque 2", volume: 150, nivel: "medio" },
      { nome: "Tanque 3", volume: 20,  nivel: "baixo" },
    ],
  },
  {
    id: 2,
    name: "Total Energies EPSi",
    open: true,
    address: "Cacuaco / Luanda / Angola",
    rating: 4.2,
    reviews: 87,
    tipo: "Gas station",
    horario: "06h – 22h",
    dist: "2.1 km",
    latitude: -8.7800,
    longitude: 13.2900,
    produtos: ["Gasolina", "Gasóleo", "Gás Butano"],
    precos: [{ produto: "Gasolina", valor: 310 }, { produto: "Gasóleo", valor: 210 }],
    tanques: [
      { nome: "Tanque 1", volume: 400, nivel: "alto" },
      { nome: "Tanque 2", volume: 90,  nivel: "medio" },
    ],
  },
];

// ── Icons ─────────────────────────────────────────────────────────────────────
function IFuel({ className = "w-5 h-5" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="15" y2="22"/><line x1="4" y1="9" x2="14" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>;
}
function INavigate({ className = "w-4 h-4" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>;
}
function IChevron({ className = "w-3.5 h-3.5" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}
function ICheck({ className = "w-4 h-4" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function IPin({ className = "w-3.5 h-3.5" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function IClock({ className = "w-3.5 h-3.5" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function IBookmark({ className = "w-4 h-4", filled = false }: { className?: string; filled?: boolean }) {
  return <svg className={className} viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke={filled ? "#f59e0b" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
}
function IBarChart({ className = "w-5 h-5" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function IBag({ className = "w-5 h-5" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
}
function IMoney({ className = "w-5 h-5" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>;
}
function IGps({ className = "w-4 h-4" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="9" strokeDasharray="3 2"/></svg>;
}
function IClose({ className = "w-5 h-5" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function IMap({ className = "w-5 h-5" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;
}

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => {
        const full = i <= Math.floor(rating);
        const half = !full && i - 0.5 <= rating;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24">
            <defs>{half && <linearGradient id={`g${i}`}><stop offset="50%" stopColor="#f59e0b"/><stop offset="50%" stopColor="#d1d5db"/></linearGradient>}</defs>
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={full ? "#f59e0b" : half ? `url(#g${i})` : "#d1d5db"} stroke="none"/>
          </svg>
        );
      })}
    </div>
  );
}

// ── TankRow ───────────────────────────────────────────────────────────────────
function TankRow({ tanque }: { tanque: { nome: string; volume: number; nivel: string } }) {
  const cfg: Record<string, { bar: string; w: string; text: string }> = {
    alto:  { bar: "bg-green-500",  w: "w-full", text: "text-green-500" },
    medio: { bar: "bg-orange-400", w: "w-1/2",  text: "text-orange-400" },
    baixo: { bar: "bg-red-500",    w: "w-1/5",  text: "text-red-500" },
  };
  const c = cfg[tanque.nivel] ?? cfg.baixo;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-slate-500 w-16 shrink-0">{tanque.nome}</span>
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${c.bar} ${c.w}`}/>
      </div>
      <span className={`text-xs font-bold w-12 text-right ${c.text}`}>{tanque.volume}L</span>
    </div>
  );
}

// ── CardHeader ────────────────────────────────────────────────────────────────
function CardHeader({ Icon, title }: { Icon: () => JSX.Element; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-slate-300/70 flex items-center justify-center text-slate-600 shrink-0">
        <Icon />
      </div>
      <span className="font-bold text-slate-900 text-[15px]">{title}</span>
    </div>
  );
}

// ── MapPopup ──────────────────────────────────────────────────────────────────
function MapPopup({ station }: { station: Station }) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white rounded-2xl px-4 py-3 min-w-[240px] shadow-2xl border border-slate-100">
      <p className="font-bold text-slate-900 text-sm">{station.name}</p>
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="text-amber-500 font-bold text-sm">{station.rating}</span>
        <Stars rating={station.rating} />
        <span className="text-slate-400 text-xs">({station.reviews})</span>
      </div>
      <p className="text-xs text-slate-500 mt-0.5">{station.tipo}</p>
      <p className="text-xs text-green-600 font-semibold mt-0.5">{station.horario}</p>
      <div className="flex gap-2 mt-3">
        <a
          href={station.latitude && station.longitude
            ? `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`
            : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-[#0d1b3e] hover:bg-[#162251] text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          <INavigate className="w-3 h-3" /> Ir
        </a>
      </div>
    </div>
  );
}

// ── Dialog Postos Próximos ────────────────────────────────────────────────────
function DialogPostos({
  postos,
  onClose,
  onSelect,
}: {
  postos: Station[];
  onClose: () => void;
  onSelect: (s: Station) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">

        {/* Handle mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0d1b3e] flex items-center justify-center">
              <IMap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Postos Próximos</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {postos.length} posto{postos.length !== 1 ? "s" : ""} encontrado{postos.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <IClose className="w-4 h-4" />
          </button>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {postos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <IPin className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Nenhum posto encontrado</p>
              <p className="text-xs text-slate-400 mt-1">Tente aumentar o raio de busca.</p>
            </div>
          ) : (
            postos.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { onSelect(s); onClose(); }}
                className="w-full flex items-center gap-4 bg-slate-50 hover:bg-[#0d1b3e]/5 border border-slate-100 hover:border-[#0d1b3e]/20 rounded-2xl px-4 py-3.5 text-left transition-all group"
              >
                {/* Número */}
                <div className="w-8 h-8 rounded-xl bg-[#0d1b3e] flex items-center justify-center text-white text-xs font-black shrink-0">
                  {i + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#0d1b3e]">
                      {s.name}
                    </p>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.open ? "bg-green-500" : "bg-red-400"}`} />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <IPin className="w-3 h-3" />
                      {s.address !== "—" ? s.address.split("/")[0]?.trim() : "Sem endereço"}
                    </span>
                    {s.dist !== "—" && (
                      <span className="text-[11px] font-semibold text-[#0d1b3e] bg-[#0d1b3e]/8 px-2 py-0.5 rounded-full">
                        {s.dist}
                      </span>
                    )}
                  </div>
                  {s.produtos.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {s.produtos.slice(0, 3).map((p) => (
                        <span key={p} className="text-[10px] font-semibold bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seta */}
                <div className="shrink-0 text-slate-300 group-hover:text-[#0d1b3e] group-hover:translate-x-0.5 transition-all">
                  <IChevron className="w-4 h-4" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mapa com marcadores via iframe ────────────────────────────────────────────
// Gera URL do Google Maps com múltiplos marcadores usando a API de embed
function buildMapUrl(stations: Station[], selected: Station): string {
  // Se o posto selecionado tem coordenadas, centra o mapa nele
  if (selected.latitude && selected.longitude) {
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyD-PLACEHOLDER&q=${selected.latitude},${selected.longitude}&zoom=14`;
  }
  // Fallback: embed estático de Luanda
  return "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d31572.58!2d13.2543!3d-8.8368!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1spt!2sao!4v1";
}

// Versão sem API key — usa search query
function buildMapUrlSimple(selected: Station): string {
  if (selected.latitude && selected.longitude) {
    return `https://maps.google.com/maps?q=${selected.latitude},${selected.longitude}&z=15&output=embed`;
  }
  if (selected.address && selected.address !== "—") {
    const q = encodeURIComponent(selected.address);
    return `https://maps.google.com/maps?q=${q}&z=14&output=embed`;
  }
  return "https://maps.google.com/maps?q=-8.8368,13.2543&z=13&output=embed";
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function LocaTechDashboard() {
  const [stations, setStations]         = useState<Station[]>(stationsDefault);
  const [selected, setSelected]         = useState<Station>(stationsDefault[0]);
  const [saved, setSaved]               = useState(false);
  const [carregando, setCarregando]     = useState(false);
  const [erroGps, setErroGps]           = useState<string | null>(null);
  const [postosProximos, setPostosProximos] = useState<Station[]>([]);
  const [showDialog, setShowDialog]     = useState(false);

  // ── Buscar postos próximos ─────────────────────────────────────────────────
  async function buscarPostosProximos() {
    if (!navigator.geolocation) {
      setErroGps("O seu browser não suporta geolocalização.");
      return;
    }

    setCarregando(true);
    setErroGps(null);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { data } = await api.get<PostoAPI[]>("/proximos", {
            params: {
              latitude:  coords.latitude,
              longitude: coords.longitude,
            },
          });

          console.log("✅ Postos recebidos:", data);

          const convertidos = data.map(postoToStation);

          // Atualiza a lista lateral e abre o dialog
          setStations(convertidos.length > 0 ? convertidos : stationsDefault);
          setPostosProximos(convertidos);

          // Seleciona o primeiro com coordenadas
          const primeiro = convertidos.find((s) => s.latitude && s.longitude);
          if (primeiro) setSelected(primeiro);

          setShowDialog(true);
        } catch (error: any) {
          console.error("❌ Erro API:", error?.response?.data ?? error?.message);
          setErroGps(
            error?.response?.data?.message ??
            error?.message ??
            "Erro ao buscar postos."
          );
        } finally {
          setCarregando(false);
        }
      },
      (geoErro) => {
        console.error("❌ GPS:", geoErro.message);
        // fallback com coords fixas de Luanda para testes
        api.get<PostoAPI[]>("/proximos", { params: { latitude: -8.83, longitude: 13.23 } })
          .then(({ data }) => {
            const convertidos = data.map(postoToStation);
            setStations(convertidos.length > 0 ? convertidos : stationsDefault);
            setPostosProximos(convertidos);
            const primeiro = convertidos.find((s) => s.latitude && s.longitude);
            if (primeiro) setSelected(primeiro);
            setShowDialog(true);
          })
          .catch(() => setErroGps("Permissão de GPS negada e falha na busca."))
          .finally(() => setCarregando(false));
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  const mapUrl = buildMapUrlSimple(selected);

  return (
    <div className="flex flex-col min-h-screen bg-[#edf0f4] font-sans">
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto flex flex-col">

          {/* ── Mapa ── */}
          <div className="relative h-[370px] shrink-0">
            <iframe
              key={mapUrl} // força reload quando muda o posto
              title="mapa"
              className="w-full h-full border-0 block"
              loading="lazy"
              allowFullScreen
              src={mapUrl}
            />
            <MapPopup station={selected} />
          </div>

          <div className="grid grid-cols-2 gap-4 p-5">

            {/* ── Card 1 – Posto selecionado + lista ── */}
            <div className="bg-[#e4e7ec] rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-300/70 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                    <IFuel />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[15px] text-slate-900 truncate">{selected.name}</span>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${selected.open ? "bg-green-500" : "bg-red-500"}`} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">Localização – {selected.address}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-slate-400 text-[11px]">
                      <IClock className="w-3 h-3" />{selected.horario}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => setSaved(!saved)}
                    className={`p-1.5 rounded-lg transition-colors hover:bg-slate-200 ${saved ? "text-amber-400" : "text-slate-400"}`}
                  >
                    <IBookmark filled={saved} />
                  </button>
                  <a
                    href={selected.latitude && selected.longitude
                      ? `https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`
                      : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-[13px] font-bold px-5 py-2 rounded-full shadow-md shadow-red-500/30 transition-all hover:-translate-y-0.5"
                  >
                    <INavigate /> Iniciar
                  </a>
                </div>
              </div>

              <div className="h-px bg-slate-300/60 my-4" />

              {/* Botão Ver Postos Próximos */}
              <button
                onClick={buscarPostosProximos}
                disabled={carregando}
                className="flex items-center justify-center gap-2 w-full py-2.5 mb-3
                           bg-[#0d1b3e] hover:bg-[#162251] disabled:opacity-60
                           disabled:cursor-not-allowed text-white text-[13px] font-bold
                           rounded-full shadow-md transition-all active:scale-95"
              >
                {carregando ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" strokeDasharray="30 10"/>
                    </svg>
                    A localizar…
                  </>
                ) : (
                  <><IGps /> Ver Postos Próximos</>
                )}
              </button>

              {/* Botão reabrir dialog se já buscou */}
              {postosProximos.length > 0 && !showDialog && (
                <button
                  onClick={() => setShowDialog(true)}
                  className="flex items-center justify-center gap-2 w-full py-2 mb-3
                             border border-[#0d1b3e]/30 text-[#0d1b3e] text-[13px] font-semibold
                             rounded-full hover:bg-[#0d1b3e]/5 transition-all"
                >
                  <IMap className="w-4 h-4" />
                  Ver lista ({postosProximos.length} postos)
                </button>
              )}

              {erroGps && (
                <p className="text-[11px] text-red-400 text-center mb-2 px-2">{erroGps}</p>
              )}

              {/* Lista lateral */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Postos próximos
                </p>
                <div className="flex flex-col gap-1.5">
                  {stations.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelected(s)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-[13px]
                                  font-semibold text-left transition-all w-full cursor-pointer border-none
                                  ${selected.id === s.id
                                    ? "bg-[#0d1b3e] text-white"
                                    : "bg-slate-200/60 text-slate-700 hover:bg-slate-300/60"}`}
                    >
                      <div className="flex flex-col">
                        <span className="truncate max-w-[140px]">{s.name}</span>
                        <span className="text-[10px] font-normal opacity-60">{s.dist}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${s.open ? "bg-green-400" : "bg-red-400"}`} />
                        <IChevron />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Card 2 – Preço ── */}
            <div className="bg-[#e4e7ec] rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardHeader Icon={IMoney} title="Preço" />
              {selected.precos.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {selected.precos.map((p) => (
                    <div key={p.produto} className="flex items-center justify-between bg-white/60 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <IFuel className="w-4 h-4 text-slate-500" />
                        <span className="text-[13px] font-semibold text-slate-700">{p.produto}</span>
                      </div>
                      <span className="bg-[#0d1b3e]/10 text-[#0d1b3e] font-bold text-[13px] px-3 py-1 rounded-lg">
                        {p.valor} Kz
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Sem preços disponíveis</p>
              )}
              <div className="h-px bg-slate-300/60 my-4" />
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <IPin /><span className="truncate">{selected.address}</span>
              </div>
            </div>

            {/* ── Card 3 – Produtos ── */}
            <div className="bg-[#e4e7ec] rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardHeader Icon={IBag} title="Produtos" />
              {selected.produtos.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {selected.produtos.map((prod) => (
                    <div key={prod} className="flex items-center gap-3 bg-white/60 rounded-xl px-4 py-2.5">
                      <ICheck className="text-slate-500" />
                      <span className="text-[13px] font-semibold text-slate-700">{prod}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Sem produtos registados</p>
              )}
            </div>

            {/* ── Card 4 – Quantidade ── */}
            <div className="bg-[#e4e7ec] rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardHeader Icon={IBarChart} title="Quantidade" />
              {selected.tanques.length > 0 ? (
                <>
                  <div className="flex flex-col gap-3">
                    {selected.tanques.map((t) => <TankRow key={t.nome} tanque={t} />)}
                  </div>
                  <div className="h-px bg-slate-300/60 my-4" />
                  <div className="flex items-center gap-5 text-xs text-slate-500">
                    {[["bg-green-500","Alto"],["bg-orange-400","Médio"],["bg-red-500","Baixo"]].map(([c,l]) => (
                      <div key={l} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${c}`}/>{l}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Sem dados de tanques</p>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-[#0d1b3e] h-11 flex items-center justify-center shrink-0">
        <p className="text-white/40 text-[11px] font-semibold tracking-widest uppercase">
          © 2026 LocaTech – Informação Certa Combustível e Gás Sem Stress
        </p>
      </footer>

      {/* ── Dialog Postos Próximos ── */}
      {showDialog && (
        <DialogPostos
          postos={postosProximos}
          onClose={() => setShowDialog(false)}
          onSelect={(s) => setSelected(s)}
        />
      )}
    </div>
  );
}