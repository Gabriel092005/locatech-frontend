import { JSX, useState, useEffect, useCallback, useRef, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/axios";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StockAPI {
  preco_unitario: number;
  quantidade?: number;
  produto: { nome: string };
}

interface PostoAPI {
  id: number;
  nome: string;
  tipo: string;
  latitude: number | null;
  longitude: number | null;
  endereco?: string | null;
  horario_funcionamento?: string | null;
  email_institucional?: string | null;
  nif?: string | null;
  stocks?: StockAPI[];
  produtos?: { nome: string; preco: number; unidade: string; quantidade: number }[];
  distance?: number; // km — rota /nearby
  dist?: number;     // km — rota /proximos
}

interface Station {
  id: number;
  name: string;
  open: boolean;
  address: string;
  rating: number;
  tipo: string;
  horario: string;
  dist: string;
  produtos: string[];
  precos: { produto: string; valor: number }[];
  tanques: { nome: string; volume: number; nivel: "alto" | "medio" | "baixo" }[];
  latitude: number | null;
  longitude: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function postoToStation(p: PostoAPI): Station {
  // Suporte a ambos os formatos de stock da API (v1: produtos[], v2: stocks[])
  const precos: Station["precos"] = p.stocks
    ? p.stocks.map((s) => ({ produto: s.produto.nome, valor: s.preco_unitario }))
    : (p.produtos ?? []).map((pr) => ({ produto: pr.nome, valor: pr.preco }));

  const nomeProdutos: string[] = p.stocks
    ? p.stocks.map((s) => s.produto.nome)
    : (p.produtos ?? []).map((pr) => pr.nome);

  const tanques: Station["tanques"] = p.stocks
    ? p.stocks.map((s) => {
        const vol = s.quantidade ?? 0;
        return { nome: s.produto.nome, volume: vol, nivel: vol > 5000 ? "alto" : vol > 1000 ? "medio" : "baixo" };
      })
    : (p.produtos ?? []).map((pr) => ({
        nome: pr.nome,
        volume: pr.quantidade,
        nivel: pr.quantidade > 5000 ? "alto" : pr.quantidade > 1000 ? "medio" : "baixo",
      }));

  const distKm = p.distance ?? p.dist;

  return {
    id:       p.id,
    name:     p.nome,
    open:     !!(p.horario_funcionamento),
    address:  p.endereco ?? "Endereço não disponível",
    rating:   4.2,
    tipo:     p.tipo === "COMBUSTIVEL" ? "Combustível" : p.tipo === "GAS" ? "Gás" : "Misto",
    horario:  p.horario_funcionamento ?? "Horário não informado",
    dist:     distKm != null ? `${distKm.toFixed(1)} km` : "—",
    produtos: nomeProdutos,
    precos,
    tanques,
    latitude:  p.latitude,
    longitude: p.longitude,
  };
}

function buildMapUrl(station: Station, userLocation?: { lat: number; lng: number } | null, showRoute?: boolean, travelMode?: string): string {
  if (showRoute && userLocation && station.latitude && station.longitude) {
    return `https://maps.google.com/maps?saddr=${userLocation.lat},${userLocation.lng}&daddr=${station.latitude},${station.longitude}&output=embed&travelmode=${travelMode ?? "driving"}`;
  }
  if (station.latitude && station.longitude) {
    return `https://maps.google.com/maps?q=${station.latitude},${station.longitude}&z=15&output=embed`;
  }
  if (station.address && station.address !== "Endereço não disponível") {
    return `https://maps.google.com/maps?q=${encodeURIComponent(station.address)}&z=14&output=embed`;
  }
  return "https://maps.google.com/maps?q=-8.8368,13.2543&z=13&output=embed";
}

const SPEEDS = { driving: 40, walking: 5, bicycling: 15 } as const;

function calculateRouteInfo(lat1: number, lng1: number, lat2: number, lng2: number, mode: keyof typeof SPEEDS = "driving") {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  const avgSpeed = SPEEDS[mode];
  const timeMinutes = Math.round((distance / avgSpeed) * 60);
  return { distance, timeMinutes, mode };
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

type IconProps = { className?: string };

const IFuel = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="22" x2="15" y2="22"/><line x1="4" y1="9" x2="14" y2="9"/>
    <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/>
    <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/>
  </svg>
);
const INavigate = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
);
const IChevron = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const ICheck = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IPin = ({ className = "w-3.5 h-3.5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IClock = ({ className = "w-3.5 h-3.5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IBookmark = ({ className = "w-4 h-4", filled = false }: IconProps & { filled?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke={filled ? "#f59e0b" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);
const IBarChart = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IBag = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);
const IMoney = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/>
    <path d="M6 12h.01M18 12h.01"/>
  </svg>
);
const IGps = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
    <circle cx="12" cy="12" r="9" strokeDasharray="3 2"/>
  </svg>
);
const IClose = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IMap = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);
const IPlus = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IUpload = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const ISpinner = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10" strokeDasharray="30 10"/>
  </svg>
);

// ── Sub-components ────────────────────────────────────────────────────────────

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const full = i <= Math.floor(rating);
        const half = !full && i - 0.5 <= rating;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24">
            {half && (
              <defs>
                <linearGradient id={`g${i}`}>
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#d1d5db" />
                </linearGradient>
              </defs>
            )}
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill={full ? "#f59e0b" : half ? `url(#g${i})` : "#d1d5db"}
              stroke="none"
            />
          </svg>
        );
      })}
    </div>
  );
}

function TankRow({ tanque }: { tanque: Station["tanques"][number] }) {
  const cfg = {
    alto:  { bar: "bg-green-500",  w: "w-full", text: "text-green-600" },
    medio: { bar: "bg-amber-400",  w: "w-1/2",  text: "text-amber-500" },
    baixo: { bar: "bg-red-500",    w: "w-1/5",  text: "text-red-500"   },
  };
  const c = cfg[tanque.nivel];
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-slate-500 w-20 shrink-0 truncate">{tanque.nome}</span>
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", c.bar, c.w)} />
      </div>
      <span className={cn("text-xs font-bold w-14 text-right tabular-nums", c.text)}>
        {tanque.volume.toLocaleString("pt-AO")}L
      </span>
    </div>
  );
}

function CardHeader({ Icon, title }: { Icon: (p: IconProps) => JSX.Element; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center text-slate-600 shadow-sm shrink-0">
        <Icon />
      </div>
      <span className="font-bold text-slate-800 text-[14px] tracking-tight">{title}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-10 h-10 rounded-xl bg-slate-200/80 flex items-center justify-center mb-2">
        <IPin className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-xs text-slate-400 font-medium">{text}</p>
    </div>
  );
}

// ── Map Popup ─────────────────────────────────────────────────────────────────

function MapPopup({ station }: { station: Station }) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 min-w-[230px] shadow-2xl border border-white/80 pointer-events-none">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-sm leading-tight truncate">{station.name}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{station.tipo}</p>
        </div>
        <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", station.open ? "bg-green-500" : "bg-red-400")} />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-amber-500 font-bold text-xs">{station.rating}</span>
        <Stars rating={station.rating} />
      </div>
      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
        <IClock className="w-3 h-3" /> {station.horario}
      </p>
    </div>
  );
}

// ── Nearby Dialog ─────────────────────────────────────────────────────────────

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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
        {/* Mobile handle */}
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
                {postos.length === 0
                  ? "Nenhum posto encontrado"
                  : `${postos.length} posto${postos.length !== 1 ? "s" : ""} encontrado${postos.length !== 1 ? "s" : ""}`}
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

        {/* List */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {postos.length === 0 ? (
            <EmptyState text="Nenhum posto encontrado nesta área. Tente aumentar o raio de busca." />
          ) : (
            postos.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { onSelect(s); onClose(); }}
                className="w-full flex items-center gap-4 bg-slate-50 hover:bg-[#0d1b3e]/5 border border-slate-100 hover:border-[#0d1b3e]/20 rounded-2xl px-4 py-3.5 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#0d1b3e] flex items-center justify-center text-white text-xs font-black shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#0d1b3e] transition-colors">
                      {s.name}
                    </p>
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.open ? "bg-green-500" : "bg-red-400")} />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <IPin className="w-3 h-3" />
                      {s.address !== "Endereço não disponível" ? s.address.split("/")[0]?.trim() : "Sem endereço"}
                    </span>
                    {s.dist !== "—" && (
                      <span className="text-[11px] font-semibold text-[#0d1b3e] bg-[#0d1b3e]/8 px-2 py-0.5 rounded-full">
                        {s.dist}
                      </span>
                    )}
                  </div>
                  {s.precos.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {s.precos.slice(0, 3).map((p) => (
                        <span key={p.produto} className="flex items-center gap-1 text-[10px] font-semibold bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full">
                          {p.produto}
                          <span className="text-[#0d1b3e] font-bold">{p.valor.toLocaleString("pt-AO")} Kz</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
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

// ── Novo Posto Dialog ─────────────────────────────────────────────────────────

type TipoPostoEnum = "COMBUSTIVEL" | "GAS" | "MISTO";

interface ProdutoCatalogo {
  id: number;
  nome: string;
  unidade_medida: string;
}

interface ProdutoPreco {
  produtoId: number;
  nome: string;
  preco: string;
}

interface NovoPostoForm {
  nome: string;
  email_institucional: string;
  nif: string;
  tipo: TipoPostoEnum;
  endereco: string;
  horario_funcionamento: string;
  gestorId: string;
  latitude: string;
  longitude: string;
  alvara: File | null;
}

const FORM_INITIAL: NovoPostoForm = {
  nome: "",
  email_institucional: "",
  nif: "",
  tipo: "MISTO",
  endereco: "",
  horario_funcionamento: "",
  gestorId: "",
  latitude: "",
  longitude: "",
  alvara: null,
};

type FormStatus = "idle" | "loading" | "success" | "error";

function InputField({
  label, name, value, onChange, type = "text", placeholder, required,
}: {
  label: string; name: string; value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="bg-slate-100 border border-slate-200 focus:border-[#0d1b3e] focus:bg-white outline-none rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-all"
      />
    </div>
  );
}

function NovoPostoDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (posto: PostoAPI) => void;
}) {
  const [form, setForm]       = useState<NovoPostoForm>(FORM_INITIAL);
  const [status, setStatus]   = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [catalogo, setCatalogo] = useState<ProdutoCatalogo[]>([]);
  const [produtos, setProdutos] = useState<ProdutoPreco[]>([]);
  const fileRef               = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<{ produtos: ProdutoCatalogo[] }>("/produtos").then(({ data }) => {
      if (data?.produtos?.length) {
        setCatalogo(data.produtos);
        setProdutos(data.produtos.map((p) => ({ produtoId: p.id, nome: p.nome, preco: "" })));
      }
    }).catch((err) => console.error("Erro ao carregar produtos:", err));
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, alvara: e.target.files?.[0] ?? null }));
  };

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setForm((prev) => ({
        ...prev,
        latitude:  coords.latitude.toFixed(6),
        longitude: coords.longitude.toFixed(6),
      }));
    });
  };

  const handlePrecoChange = (produtoId: number, value: string) => {
    setProdutos((prev) => prev.map((p) => p.produtoId === produtoId ? { ...p, preco: value } : p));
  };

  const tipoOptions: { value: TipoPostoEnum; label: string }[] = [
    { value: "MISTO",       label: "Misto" },
    { value: "COMBUSTIVEL", label: "Combustível" },
    { value: "GAS",         label: "Gás" },
  ];

  const produtosVisiveis = catalogo.filter((p) => {
    if (form.tipo === "COMBUSTIVEL") return p.nome !== "Gás";
    if (form.tipo === "GAS") return p.nome === "Gás";
    return true;
  });

  const handleSubmit = async () => {
    if (!form.nome.trim() || !form.endereco.trim()) {
      setErrorMsg("Nome e endereço são obrigatórios.");
      return;
    }
    setStatus("loading");
    setErrorMsg(null);

    try {
      const body = new FormData();
      body.append("nome",                form.nome.trim());
      body.append("tipo",                form.tipo);
      body.append("endereco",            form.endereco.trim());
      if (form.email_institucional) body.append("email_institucional", form.email_institucional.trim());
      if (form.nif)      body.append("nif",      form.nif.trim());
      if (form.gestorId) body.append("gestorId", form.gestorId.trim());
      if (form.latitude)  body.append("latitude",  form.latitude);
      if (form.longitude) body.append("longitude", form.longitude);
      if (form.horario_funcionamento) body.append("horario_funcionamento", form.horario_funcionamento.trim());
      if (form.alvara)    body.append("alvara",    form.alvara);

      const { data: postoData } = await api.post<PostoAPI>("/postos", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const postoId = postoData.id;

      // Criar stocks para produtos com preço
      const stocksCriados = produtosVisiveis
        .filter((p) => {
          const prod = produtos.find((pr) => pr.produtoId === p.id);
          return prod && prod.preco && parseFloat(prod.preco) > 0;
        });

      await Promise.all(stocksCriados.map((p) => {
        const prod = produtos.find((pr) => pr.produtoId === p.id)!;
        return api.post("/stocks", {
          postoId,
          produtoId: p.id,
          preco_unitario: parseFloat(prod.preco),
        });
      }));

      // Buscar posto completo com stocks para mostrar no dashboard
      const { data: postoCompleto } = await api.get<{ posto: PostoAPI }>(`/postos/${postoId}`);

      setStatus("success");
      setTimeout(() => { onCreated(postoCompleto.posto); onClose(); }, 1200);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.response?.data?.message ?? err?.message ?? "Erro ao criar posto.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Mobile handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0d1b3e] flex items-center justify-center">
              <IPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Novo Posto</p>
              <p className="text-[11px] text-slate-400">Preencha os dados do posto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <IClose className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3.5">

          {/* Tipo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Tipo <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              {tipoOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, tipo: opt.value }))}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all border",
                    form.tipo === opt.value
                      ? "bg-[#0d1b3e] text-white border-[#0d1b3e] shadow-md"
                      : "bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <InputField label="Nome do Posto" name="nome" value={form.nome} onChange={handleChange} placeholder="Ex: Posto Sonangol Talatona" required />
          <InputField label="Endereço" name="endereco" value={form.endereco} onChange={handleChange} placeholder="Ex: Via AL4, Luanda" required />
          <InputField label="Horário de funcionamento" name="horario_funcionamento" value={form.horario_funcionamento} onChange={handleChange} placeholder="Ex: 07h–22h" />

          <div className="grid grid-cols-2 gap-3">
            <InputField label="Email institucional" name="email_institucional" value={form.email_institucional} onChange={handleChange} type="email" placeholder="posto@empresa.ao" />
            <InputField label="NIF" name="nif" value={form.nif} onChange={handleChange} placeholder="5000XXXXXXX" />
          </div>

          <InputField label="ID do Gestor" name="gestorId" value={form.gestorId} onChange={handleChange} placeholder="1" />

          {/* Coordenadas */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Coordenadas GPS
              </label>
              <button
                type="button"
                onClick={handleGPS}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#0d1b3e] hover:underline"
              >
                <IGps className="w-3 h-3" /> Usar localização actual
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                name="latitude"
                value={form.latitude}
                onChange={handleChange}
                placeholder="Latitude (ex: -8.921)"
                className="bg-slate-100 border border-slate-200 focus:border-[#0d1b3e] focus:bg-white outline-none rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-all"
              />
              <input
                name="longitude"
                value={form.longitude}
                onChange={handleChange}
                placeholder="Longitude (ex: 13.184)"
                className="bg-slate-100 border border-slate-200 focus:border-[#0d1b3e] focus:bg-white outline-none rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          {/* Preços dos Produtos */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <IMoney className="w-4 h-4 text-slate-500" />
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Preços dos Produtos
              </label>
            </div>
            {produtosVisiveis.length === 0 ? (
              <p className="text-xs text-slate-400 italic">A carregar produtos…</p>
            ) : (
              <div className="flex flex-col gap-2">
                {produtosVisiveis.map((p) => {
                  const prod = produtos.find((pr) => pr.produtoId === p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-700 w-24 shrink-0">{p.nome}</span>
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          value={prod?.preco ?? ""}
                          onChange={(e) => handlePrecoChange(p.id, e.target.value)}
                          className="w-full bg-slate-100 border border-slate-200 focus:border-[#0d1b3e] focus:bg-white outline-none rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition-all"
                        />
                        <span className="text-[11px] font-bold text-slate-400 w-8">Kz</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Alvará */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Alvará</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 border-dashed hover:border-[#0d1b3e]/40 rounded-xl px-4 py-3 text-sm transition-all text-left group"
            >
              <IUpload className="w-4 h-4 text-slate-400 group-hover:text-[#0d1b3e] transition-colors shrink-0" />
              <span className={cn("truncate text-[13px]", form.alvara ? "text-[#0d1b3e] font-semibold" : "text-slate-400")}>
                {form.alvara ? form.alvara.name : "Clique para seleccionar ficheiro…"}
              </span>
            </button>
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} />
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <ICheck className="w-4 h-4 text-green-500 shrink-0" />
              <p className="text-xs text-green-600 font-semibold">Posto criado com sucesso!</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={status === "loading" || status === "success"}
            className="flex-1 py-2.5 rounded-xl bg-[#0d1b3e] hover:bg-[#162251] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-[#0d1b3e]/20"
          >
            {status === "loading" ? <><ISpinner /> A criar…</> : status === "success" ? <><ICheck /> Criado!</> : <><IPlus /> Criar Posto</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Loading Screen ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#edf0f4] flex-col gap-3">
      <div className="w-12 h-12 rounded-2xl bg-[#0d1b3e] flex items-center justify-center shadow-lg">
        <IFuel className="w-6 h-6 text-white" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-[#0d1b3e] font-bold text-sm tracking-wide">LocaTech</p>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#0d1b3e]/40 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Empty Screen ─────────────────────────────────────────────────────────────

function EmptyScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-screen items-center justify-center bg-[#edf0f4] flex-col gap-4 p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center">
        <IMap className="w-7 h-7 text-slate-400" />
      </div>
      <div>
        <p className="text-slate-700 font-bold text-sm">Nenhum posto encontrado</p>
        <p className="text-slate-400 text-xs mt-1">Não foi possível carregar os dados dos postos.</p>
      </div>
      <button
        onClick={onRetry}
        className="px-5 py-2 bg-[#0d1b3e] text-white text-sm font-bold rounded-full hover:opacity-90 transition-opacity"
      >
        Tentar novamente
      </button>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function LocaTechDashboard() {
  const navigate = useNavigate();
  const [allStations, setAllStations]       = useState<Station[]>([]);
  const [selected, setSelected]             = useState<Station | null>(null);
  const [savedIds, setSavedIds]             = useState<Set<number>>(() => {
    const saved = localStorage.getItem('@Locatech:saved');
    return saved ? new Set(JSON.parse(saved)) : new Set<number>();
  });
  const [loading, setLoading]               = useState(true);
  const [locating, setLocating]             = useState(false);
  const [gpsError, setGpsError]             = useState<string | null>(null);
  const [nearbyStations, setNearbyStations] = useState<Station[]>([]);
  const [showDialog, setShowDialog]         = useState(false);
  const [showNovoPosto, setShowNovoPosto]   = useState(false);
  const [userRole, setUserRole]             = useState<string | null>(null);
  const [userLocation, setUserLocation]     = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError]   = useState<string | null>(null);
  const [showRoute, setShowRoute]           = useState(false);
  const [travelMode, setTravelMode]         = useState<"driving" | "walking" | "bicycling">("driving");
  const watchIdRef                          = useRef<number | null>(null);
  const lastAutoKeyRef                      = useRef<string>("");

  // Limpar watchPosition ao desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Auto‑seleccionar modo com base na distância (inteligente)
  useEffect(() => {
    if (userLocation && selected?.latitude && selected?.longitude) {
      const dLat = ((selected.latitude - userLocation.lat) * Math.PI) / 180;
      const dLng = ((selected.longitude - userLocation.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((userLocation.lat * Math.PI) / 180) *
          Math.cos((selected.latitude * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      const key = `${userLocation.lat.toFixed(2)}-${userLocation.lng.toFixed(2)}-${selected.id}`;
      if (lastAutoKeyRef.current !== key) {
        lastAutoKeyRef.current = key;
        if (dist < 1) setTravelMode("walking");
        else if (dist < 5) setTravelMode("bicycling");
        else setTravelMode("driving");
      }
    }
  }, [userLocation, selected?.id]);

  // Obter role do utilizador do token JWT
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch {
        setUserRole(null);
      }
    }
  }, []);

  // Pedir localização ao utilizador — watchPosition para tracking ao vivo + auto‑nearby
  const handleRequestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("GPS não suportado neste browser.");
      return;
    }
    setLocationError(null);
    setLocating(true);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setUserLocation({ lat: coords.latitude, lng: coords.longitude });
        setLocationError(null);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Permissão de localização negada. Permite nas definições do browser.");
        } else if (err.code === err.TIMEOUT) {
          setLocationError("Tempo limite excedido. Tenta novamente.");
        } else {
          setLocationError("Não foi possível obter a localização.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, []);

  // ── Carregar todos os postos ───────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ postos: PostoAPI[] } | PostoAPI[]>("/postos");
      const raw: PostoAPI[] = Array.isArray(data) ? data : data.postos;
      const formatted = raw.map(postoToStation);
      setAllStations(formatted);
      if (formatted.length > 0 && !selected) setSelected(formatted[0]);
    } catch (err) {
      console.error("Erro ao carregar postos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Buscar postos próximos ────────────────────────────────────────────────
  const doNearbySearch = useCallback(async (lat: number, lon: number) => {
    setLocating(true);
    setGpsError(null);
    try {
      let raw: PostoAPI[] = [];
      try {
        const { data } = await api.get<{ postos: PostoAPI[] }>("/postos/nearby", {
          params: { latitude: lat, longitude: lon },
        });
        raw = data.postos;
      } catch {
        const { data } = await api.get<PostoAPI[]>("/proximos", {
          params: { latitude: lat, longitude: lon },
        });
        raw = data;
      }

      const converted = raw.map(postoToStation);
      setNearbyStations(converted);
      setShowDialog(true);

      const first = converted.find((s) => s.latitude && s.longitude);
      if (first) setSelected(first);
    } catch (err: any) {
      setGpsError(err?.response?.data?.message ?? err?.message ?? "Erro ao buscar postos.");
    } finally {
      setLocating(false);
    }
  }, []);

  const handleFindNearby = useCallback(() => {
    if (userLocation) {
      doNearbySearch(userLocation.lat, userLocation.lng);
      return;
    }
    if (!navigator.geolocation) {
      setGpsError("GPS não suportado neste browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => doNearbySearch(coords.latitude, coords.longitude),
      (geoErr) => {
        console.warn("GPS negado, usando coords de Luanda:", geoErr.message);
        doNearbySearch(-8.8368, 13.2543);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [userLocation, doNearbySearch]);

  const handlePostoCriado = useCallback((raw: PostoAPI) => {
    const novo = postoToStation(raw);
    setAllStations((prev) => [novo, ...prev]);
    setSelected(novo);
  }, []);

  const toggleSaved = async (id: number) => {
    try {
      const { data } = await api.post(`/saved-postos/${id}`);
      setSavedIds((prev) => {
        const next = new Set(prev);
        data.saved ? next.add(id) : next.delete(id);
        return next;
      });
    } catch (err) {
      console.error("Erro ao favoritar:", err);
    }
  };

  // ── Render guards ─────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;
  if (!selected) return <EmptyScreen onRetry={loadAll} />;

  const temLocalizacao = !!(userLocation && selected.latitude && selected.longitude);
  const mapUrl  = buildMapUrl(selected, userLocation, showRoute && temLocalizacao, travelMode);
  const routeInfo = temLocalizacao && showRoute
    ? calculateRouteInfo(userLocation!.lat, userLocation!.lng, selected.latitude!, selected.longitude!, travelMode)
    : null;
  const isSaved = savedIds.has(selected.id);

  return (
    <div className="flex flex-col min-h-screen bg-[#edf0f4] font-sans">
      <main className="flex-1 overflow-y-auto flex flex-col">

        {/* ── Mapa ── */}
        <div className="relative h-[360px] shrink-0 bg-slate-200">
          <iframe
            key={mapUrl}
            title="mapa"
            className="w-full h-full border-0 block"
            loading="lazy"
            allowFullScreen
            src={mapUrl}
          />
          {!showRoute && <MapPopup station={selected} />}

          {/* Indicador minimalista de localização ativa */}
          {userLocation && !showRoute && (
            <div className="absolute top-4 left-4 z-10">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-[3px] border-white shadow-lg animate-pulse" />
            </div>
          )}

          {/* Rota Info Overlay — só quando rota NÃO está ativa */}
          {!showRoute && routeInfo && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-2xl border border-white/80 flex flex-col items-center gap-3">
              <div className="flex items-center gap-1.5">
                {(["driving", "walking", "bicycling"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTravelMode(mode)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[11px] font-bold transition-all",
                      travelMode === mode
                        ? "bg-[#0d1b3e] text-white shadow-md"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    )}
                  >
                    {mode === "driving" ? "Carro" : mode === "walking" ? "A pé" : "Bicicleta"}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <INavigate className="w-4 h-4 text-[#0d1b3e]" />
                  <span className="text-sm font-bold text-slate-900">{routeInfo.distance.toFixed(1)} km</span>
                </div>
                <div className="w-px h-5 bg-slate-200" />
                <div className="flex items-center gap-2">
                  <IClock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-bold text-slate-900">
                    {routeInfo.timeMinutes < 60
                      ? `${routeInfo.timeMinutes} min`
                      : `${Math.floor(routeInfo.timeMinutes / 60)}h ${routeInfo.timeMinutes % 60}min`}
                  </span>
                </div>
                <div className="w-px h-5 bg-slate-200" />
                <a
                  href={
                    selected.latitude && selected.longitude
                      ? `https://www.google.com/maps/dir/?api=1&travelmode=${travelMode}&destination=${selected.latitude},${selected.longitude}`
                      : "#"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-red-500 hover:text-red-600 hover:underline transition-colors whitespace-nowrap"
                >
                  Abrir no Google Maps
                </a>
              </div>
            </div>
          )}

          {/* Rota Info — badge minimalista no canto quando rota ativa */}
          {showRoute && routeInfo && (
            <div className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Rota ativa · {routeInfo.distance.toFixed(1)} km
            </div>
          )}

          {/* Localização e Rota */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5">
            {locationError && (
              <span className="bg-red-500/90 text-white text-[11px] px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                {locationError}
              </span>
            )}
            <div className="flex items-center gap-2">
              {!userLocation ? (
                <button
                  onClick={handleRequestLocation}
                  className="bg-white/95 backdrop-blur-sm rounded-full px-5 py-2.5 shadow-xl border border-white/80 text-[13px] font-bold text-slate-700 hover:bg-white transition-all active:scale-95 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                  Partilhar localização
                </button>
              ) : (
                <>
                  <div className="bg-white/90 backdrop-blur-sm rounded-full pl-3 pr-4 py-1.5 shadow-lg text-[11px] text-slate-600 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="hidden sm:inline">Localização ativa</span>
                  </div>
                  {showRoute ? (
                    <button
                      onClick={() => setShowRoute(false)}
                      className="bg-red-500 hover:bg-red-600 text-white backdrop-blur-sm rounded-full px-4 py-2 shadow-xl border border-white/80 text-[13px] font-bold transition-all active:scale-95 flex items-center gap-2"
                    >
                      <INavigate className="w-4 h-4" />
                      Parar Rota
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowRoute(true)}
                      className="bg-[#0d1b3e]/90 hover:bg-[#0d1b3e] text-white backdrop-blur-sm rounded-full px-4 py-2 shadow-xl border border-white/80 text-[13px] font-bold transition-all active:scale-95 flex items-center gap-2"
                    >
                      <INavigate className="w-4 h-4" />
                      Traçar Rota
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Grid cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">

          {/* Card 1 – Info + Lista */}
          <div className="bg-[#e4e7ec] rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            {/* Station header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center text-slate-600 shadow-sm shrink-0 mt-0.5">
                  <IFuel />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[15px] text-slate-900 truncate">{selected.name}</span>
                    <span className={cn("w-2 h-2 rounded-full shrink-0", selected.open ? "bg-green-500" : "bg-red-400")} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug truncate">{selected.address}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-[11px]">
                    <IClock className="w-3 h-3" />
                    <span>{selected.horario}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  onClick={() => toggleSaved(selected.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                  title={isSaved ? "Remover dos guardados" : "Guardar posto"}
                >
                  <IBookmark filled={isSaved} />
                </button>
                {(userRole === 'GESTOR' || userRole === 'ADMIN') && (
                  <button
                    onClick={() => navigate(`/dashboard/editar-posto/${selected.id}`)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-400 hover:text-[#0d1b3e]"
                    title="Editar posto"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                )}
                <a
                  href={
                    selected.latitude && selected.longitude
                      ? `https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`
                      : "#"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-[13px] font-bold px-4 py-2 rounded-full shadow-md shadow-red-500/25 transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  <INavigate /> Navegar
                </a>
              </div>
            </div>

            {/* Rota Info — só visível quando rota NÃO está ativa no mapa */}
            {routeInfo && !showRoute && (
              <div className="flex items-center gap-4 bg-white/70 rounded-xl px-4 py-2.5 mb-3 border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <INavigate className="w-4 h-4 text-[#0d1b3e]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Distância</span>
                    <span className="text-sm font-black text-slate-800">{routeInfo.distance.toFixed(1)} km</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="flex items-center gap-2">
                  <IClock className="w-4 h-4 text-slate-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">ETA</span>
                    <span className="text-sm font-black text-slate-800">
                      {routeInfo.timeMinutes < 60
                        ? `${routeInfo.timeMinutes} min`
                        : `${Math.floor(routeInfo.timeMinutes / 60)}h ${routeInfo.timeMinutes % 60}min`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="h-px bg-slate-300/60 my-4" />

            {/* Botão Novo Posto - apenas para GESTOR/ADMIN */}
            {(userRole === 'GESTOR' || userRole === 'ADMIN') && (
              <button
                onClick={() => setShowNovoPosto(true)}
                className="flex items-center justify-center gap-2 w-full py-3 mb-2 bg-white/70 hover:bg-white border border-slate-300/60 text-slate-700 text-[13px] font-bold rounded-full transition-all active:scale-95 shadow-sm"
              >
                <IPlus className="w-4 h-4" /> Adicionar Novo Posto
              </button>
            )}

            {/* Botão GPS */}
            <button
              onClick={handleFindNearby}
              disabled={locating}
              className="flex items-center justify-center gap-2 w-full py-3 mb-2 bg-[#0d1b3e] hover:bg-[#162251] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-full shadow-sm transition-all active:scale-95"
            >
              {locating ? <><ISpinner /> A localizar…</> : <><IGps /> Ver Postos Próximos</>}
            </button>

            {/* Re-abrir dialog */}
            {nearbyStations.length > 0 && !showDialog && (
              <button
                onClick={() => setShowDialog(true)}
                className="flex items-center justify-center gap-2 w-full py-2 mb-2 border border-[#0d1b3e]/25 text-[#0d1b3e] text-[12px] font-semibold rounded-full hover:bg-[#0d1b3e]/5 transition-all"
              >
                <IMap className="w-4 h-4" />
                Ver lista ({nearbyStations.length} postos)
              </button>
            )}

            {/* Erro GPS */}
            {gpsError && (
              <p className="text-[11px] text-red-400 text-center mb-2 px-1">{gpsError}</p>
            )}

            {/* Lista de todos os postos */}
            {allStations.length > 0 && (
              <div className="mt-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Todos os postos
                </p>
                <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-0.5">
                  {allStations.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelected(s)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-semibold text-left transition-all w-full border-none",
                        selected.id === s.id
                          ? "bg-[#0d1b3e] text-white"
                          : "bg-white/50 text-slate-700 hover:bg-white/80"
                      )}
                    >
                      <div className="flex flex-col min-w-0 flex-1 mr-2">
                        <span className="truncate">{s.name}</span>
                        <span className="text-[10px] font-normal opacity-60">{s.dist}</span>
                        {s.precos.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {s.precos.slice(0, 2).map((p) => (
                              <span key={p.produto} className="text-[9px] font-semibold bg-white/60 px-1.5 py-0.5 rounded">
                                {p.produto} {p.valor.toLocaleString("pt-AO")}Kz
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={cn("w-1.5 h-1.5 rounded-full", s.open ? "bg-green-400" : "bg-red-400")} />
                        <IChevron className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 2 – Preços */}
          <div className="bg-[#e4e7ec] rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <CardHeader Icon={IMoney} title="Preços Actuais" />
            {selected.precos.length > 0 ? (
              <div className="flex flex-col gap-2">
                {selected.precos.map((p) => (
                  <div
                    key={p.produto}
                    className="flex items-center justify-between bg-white/60 hover:bg-white/90 rounded-xl px-4 py-3 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <IFuel className="w-4 h-4 text-slate-400" />
                      <span className="text-[13px] font-semibold text-slate-700">{p.produto}</span>
                    </div>
                    <span className="bg-[#0d1b3e]/10 text-[#0d1b3e] font-bold text-[13px] px-3 py-1 rounded-lg tabular-nums">
                      {p.valor.toLocaleString("pt-AO")} Kz
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="Sem preços registados" />
            )}
            <div className="h-px bg-slate-300/60 my-4" />
            <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <IPin /> <span className="truncate">{selected.address}</span>
            </p>
          </div>

          {/* Card 3 – Produtos */}
          <div className="bg-[#e4e7ec] rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <CardHeader Icon={IBag} title="Produtos Disponíveis" />
            {selected.produtos.length > 0 ? (
              <div className="flex flex-col gap-2">
                {selected.produtos.map((prod) => (
                  <div
                    key={prod}
                    className="flex items-center gap-3 bg-white/60 hover:bg-white/90 rounded-xl px-4 py-2.5 transition-colors"
                  >
                    <ICheck className="text-green-500 w-4 h-4 shrink-0" />
                    <span className="text-[13px] font-semibold text-slate-700">{prod}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="Sem produtos registados" />
            )}
          </div>

          {/* Card 4 – Estoque / Tanques */}
          <div className="bg-[#e4e7ec] rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <CardHeader Icon={IBarChart} title="Disponibilidade" />
            {selected.tanques.length > 0 ? (
              <>
                <div className="flex flex-col gap-3.5">
                  {selected.tanques.map((t) => <TankRow key={t.nome} tanque={t} />)}
                </div>
                <div className="h-px bg-slate-300/60 my-4" />
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  {[
                    ["bg-green-500", "Alto"],
                    ["bg-amber-400", "Médio"],
                    ["bg-red-500",   "Baixo"],
                  ].map(([color, label]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", color)} />
                      {label}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState text="Sem dados de stock disponíveis" />
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0d1b3e] h-10 flex items-center justify-center shrink-0">
        <p className="text-white/35 text-[10px] font-semibold tracking-widest uppercase">
          © 2026 LocaTech · Combustível e Gás Sem Stress
        </p>
      </footer>

      {/* Dialog Novo Posto */}
      {showNovoPosto && (
        <NovoPostoDialog
          onClose={() => setShowNovoPosto(false)}
          onCreated={handlePostoCriado}
        />
      )}

      {/* Dialog Postos Próximos */}
      {showDialog && (
        <DialogPostos
          postos={nearbyStations}
          onClose={() => setShowDialog(false)}
          onSelect={(s) => setSelected(s)}
        />
      )}
    </div>
  );
}