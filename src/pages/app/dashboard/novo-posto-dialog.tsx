import { useState, useEffect, useRef, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StockAPI {
  preco_unitario: number;
  quantidade?: number;
  produto: { nome: string };
}

export interface PostoAPI {
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
  distance?: number;
  dist?: number;
}

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

  latitude: "",
  longitude: "",
  alvara: null,
};

type FormStatus = "idle" | "loading" | "success" | "error";

// ── Icons ──────────────────────────────────────────────────────────────────────

type IconProps = { className?: string };

const ICheck = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
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

// ── InputField ─────────────────────────────────────────────────────────────────

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

// ── NovoPostoDialog ────────────────────────────────────────────────────────────

export function NovoPostoDialog({
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
    if (form.tipo === "COMBUSTIVEL") return p.nome === "Gasolina" || p.nome === "Gasóleo";
    if (form.tipo === "GAS") return p.nome === "Gás Butano";
    return p.nome !== "Gás";
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

      if (form.latitude)  body.append("latitude",  form.latitude);
      if (form.longitude) body.append("longitude", form.longitude);
      if (form.horario_funcionamento) body.append("horario_funcionamento", form.horario_funcionamento.trim());
      if (form.alvara)    body.append("alvara",    form.alvara);

      const token = localStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.sub) body.append("gestorId", String(payload.sub));
        } catch {}
      }

      const { data: postoData } = await api.post<{ posto: PostoAPI }>("/postos", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const postoId = postoData.posto.id;

      const stocksCriados = produtosVisiveis
        .filter((p) => {
          const prod = produtos.find((pr) => pr.produtoId === p.id);
          return prod && prod.preco && parseFloat(prod.preco) > 0;
        });

      if (stocksCriados.length > 0) {
        await Promise.all(stocksCriados.map((p) => {
          const prod = produtos.find((pr) => pr.produtoId === p.id)!;
          return api.post("/stocks", {
            postoId,
            produtoId: p.id,
            preco_unitario: parseFloat(prod.preco),
          });
        }));
      }

      const { data: postoCompleto } = await api.get<{ posto: PostoAPI }>(`/postos/${postoId}`);

      setStatus("success");
      onCreated(postoCompleto.posto);
      onClose();
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.response?.data?.message ?? err?.message ?? "Erro ao criar posto.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 80 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
      >
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
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <IClose className="w-4 h-4" />
          </motion.button>
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
                <motion.button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, tipo: opt.value }))}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all border",
                    form.tipo === opt.value
                      ? "bg-[#0d1b3e] text-white border-[#0d1b3e] shadow-md"
                      : "bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {opt.label}
                </motion.button>
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

          {/* Coordenadas */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Coordenadas GPS
              </label>
              <motion.button
                type="button"
                onClick={handleGPS}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#0d1b3e] hover:underline"
              >
                <IGps className="w-3 h-3" /> Usar localização actual
              </motion.button>
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
            <motion.button
              type="button"
              onClick={() => fileRef.current?.click()}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 border-dashed hover:border-[#0d1b3e]/40 rounded-xl px-4 py-3 text-sm transition-all text-left group"
            >
              <IUpload className="w-4 h-4 text-slate-400 group-hover:text-[#0d1b3e] transition-colors shrink-0" />
              <span className={cn("truncate text-[13px]", form.alvara ? "text-[#0d1b3e] font-semibold" : "text-slate-400")}>
                {form.alvara ? form.alvara.name : "Clique para seleccionar ficheiro…"}
              </span>
            </motion.button>
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} />
          </div>

          {/* Error */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"
            >
              <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
            </motion.div>
          )}

          {/* Success */}
          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2"
            >
              <ICheck className="w-4 h-4 text-green-500 shrink-0" />
              <p className="text-xs text-green-600 font-semibold">Posto criado com sucesso!</p>
            </motion.div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3 shrink-0">
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </motion.button>
          <motion.button
            onClick={handleSubmit}
            disabled={status === "loading" || status === "success"}
            whileTap={status === "loading" || status === "success" ? {} : { scale: 0.97 }}
            className="flex-1 py-2.5 rounded-xl bg-[#0d1b3e] hover:bg-[#162251] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-[#0d1b3e]/20"
          >
            {status === "loading" ? <><ISpinner /> A criar…</> : status === "success" ? <><ICheck /> Criado!</> : <><IPlus /> Criar Posto</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
