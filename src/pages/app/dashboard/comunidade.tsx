import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle, Send, ChevronDown, ChevronUp, User, Clock,
  Users, UserPlus, Check, X, Plus, LogIn, Group
} from "lucide-react";
import { api } from "@/lib/axios";

// ── Tipos ─────────────────────────────────────────────────────────────────
interface Resposta {
  id: string;
  autor: string;
  texto: string;
  criadaEm: string;
}

interface Pergunta {
  id: string;
  autor: string;
  texto: string;
  criadaEm: string;
  respostas: Resposta[];
}

interface Convite {
  id: number;
  de_user: { id: number; nome: string };
  comunidade: { id: number; nome: string; descricao: string | null };
  created_at: string;
}

interface Comunidade {
  id: number;
  nome: string;
  descricao: string | null;
  criador: { id: number; nome: string };
  total_membros: number;
  eh_membro: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function gerarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatarData(iso: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

const STORAGE_KEY = "locatech_comunidade_perguntas";

function carregarPerguntas(): Pergunta[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ── Componente principal ───────────────────────────────────────────────────
export function ComunidadePage() {
  // Dúvidas (Q&A)
  const [perguntas, setPerguntas] = useState<Pergunta[]>(carregarPerguntas);
  const [autor, setAutor] = useState("");
  const [texto, setTexto] = useState("");
  const [expandida, setExpandida] = useState<string | null>(null);
  const [respostaTexto, setRespostaTexto] = useState("");

  // Comunidades
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [convites, setConvites] = useState<Convite[]>([]);
  const [novaComNome, setNovaComNome] = useState("");
  const [novaComDesc, setNovaComDesc] = useState("");
  const [mostrarCriar, setMostrarCriar] = useState(false);
  const [loading, setLoading] = useState(true);

  const carregarDados = useCallback(async () => {
    try {
      const [comRes, convRes] = await Promise.all([
        api.get<{ comunidades: Comunidade[] }>("/comunidades"),
        api.get<{ convites: Convite[] }>("/convites/pendentes"),
      ]);
      setComunidades(comRes.data.comunidades);
      setConvites(convRes.data.convites);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  // Dúvidas (localStorage)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(perguntas));
  }, [perguntas]);

  function enviarPergunta(e: React.FormEvent) {
    e.preventDefault();
    const nome = autor.trim() || "Anónimo";
    if (!texto.trim()) return;
    const nova: Pergunta = {
      id: gerarId(), autor: nome, texto: texto.trim(),
      criadaEm: new Date().toISOString(), respostas: [],
    };
    setPerguntas((prev) => [nova, ...prev]);
    setAutor("");
    setTexto("");
  }

  function enviarResposta(idPergunta: string) {
    const nome = autor.trim() || "Anónimo";
    if (!respostaTexto.trim()) return;
    setPerguntas((prev) =>
      prev.map((p) =>
        p.id === idPergunta
          ? { ...p, respostas: [...p.respostas, { id: gerarId(), autor: nome, texto: respostaTexto.trim(), criadaEm: new Date().toISOString() }] }
          : p
      )
    );
    setRespostaTexto("");
  }

  async function criarComunidade(e: React.FormEvent) {
    e.preventDefault();
    if (!novaComNome.trim()) return;
    try {
      await api.post("/comunidades", {
        nome: novaComNome.trim(),
        descricao: novaComDesc.trim() || undefined,
      });
      setNovaComNome("");
      setNovaComDesc("");
      setMostrarCriar(false);
      carregarDados();
    } catch {}
  }

  async function responderConvite(id: number, acao: "ACEITE" | "RECUSADO") {
    try {
      await api.patch(`/convites/${id}/responder`, { acao });
      carregarDados();
    } catch {}
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[#0d1b3e] flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Comunidade</h1>
          <p className="text-sm text-slate-500">Conecte-se, colabore e tire dúvidas com outros utilizadores</p>
        </div>
      </div>

      {/* ── Convites Pendentes ─────────────────────────────────────────── */}
      {convites.length > 0 && (
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200 space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-blue-800 uppercase tracking-wider">
              Convites Pendentes ({convites.length})
            </h2>
          </div>
          {convites.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 bg-white rounded-xl p-3 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                  {c.de_user.nome}
                  <span className="font-normal text-slate-400"> convidou-o para </span>
                  "{c.comunidade.nome}"
                </p>
                {c.comunidade.descricao && (
                  <p className="text-xs text-slate-400 mt-0.5">{c.comunidade.descricao}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => responderConvite(c.id, "ACEITE")}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Aceitar
                </button>
                <button
                  onClick={() => responderConvite(c.id, "RECUSADO")}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── As Minhas Comunidades ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Group className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">As Minhas Comunidades</h2>
          </div>
          <button
            onClick={() => setMostrarCriar(!mostrarCriar)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#0d1b3e] text-white text-xs font-semibold rounded-lg hover:bg-[#0d1b3e]/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Criar
          </button>
        </div>

        {mostrarCriar && (
          <form onSubmit={criarComunidade} className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
            <input
              type="text" placeholder="Nome da comunidade"
              value={novaComNome} onChange={(e) => setNovaComNome(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1b3e]/20 placeholder:text-slate-400"
            />
            <input
              type="text" placeholder="Descrição (opcional)"
              value={novaComDesc} onChange={(e) => setNovaComDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1b3e]/20 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!novaComNome.trim()}
              className="px-4 py-2 bg-[#0d1b3e] text-white text-sm font-semibold rounded-xl hover:bg-[#0d1b3e]/90 transition-colors disabled:opacity-40"
            >
              <Plus className="w-4 h-4 inline mr-1" />Criar Comunidade
            </button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-6 text-sm text-slate-400">A carregar...</div>
        ) : comunidades.filter((c) => c.eh_membro).length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Ainda não pertence a nenhuma comunidade</p>
            <p className="text-xs mt-1">Crie uma ou aguarde um convite!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {comunidades.filter((c) => c.eh_membro).map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{c.nome}</p>
                  <p className="text-xs text-slate-400">
                    {c.total_membros} membro{c.total_membros !== 1 ? "s" : ""}
                    {c.descricao && ` · ${c.descricao}`}
                  </p>
                </div>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-[#0d1b3e]/10 text-[#0d1b3e] text-xs font-semibold rounded-lg hover:bg-[#0d1b3e]/20 transition-colors">
                  <LogIn className="w-3.5 h-3.5" /> Entrar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Dúvidas ────────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dúvidas</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Tem alguma dúvida?</h2>
        <form onSubmit={enviarPergunta} className="space-y-3">
          <input
            type="text" placeholder="O seu nome (opcional)"
            value={autor} onChange={(e) => setAutor(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1b3e]/20 focus:border-[#0d1b3e]/40 transition-all placeholder:text-slate-400"
          />
          <textarea
            placeholder="Escreva a sua dúvida..." rows={3}
            value={texto} onChange={(e) => setTexto(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1b3e]/20 focus:border-[#0d1b3e]/40 transition-all placeholder:text-slate-400 resize-none"
          />
          <button
            type="submit" disabled={!texto.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0d1b3e] text-white text-sm font-semibold rounded-xl hover:bg-[#0d1b3e]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" /> Publicar
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {perguntas.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">Nenhuma dúvida publicada ainda</p>
            <p className="text-xs mt-1">Seja o primeiro a perguntar!</p>
          </div>
        ) : (
          perguntas.map((p) => {
            const aberta = expandida === p.id;
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                <button
                  onClick={() => setExpandida(aberta ? null : p.id)}
                  className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span className="font-medium text-slate-500">{p.autor}</span>
                      <span className="text-slate-300">·</span>
                      <Clock className="w-3 h-3" />
                      <span>{formatarData(p.criadaEm)}</span>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed">{p.texto}</p>
                    <span className="inline-block mt-2 text-xs text-slate-400">
                      {p.respostas.length > 0
                        ? `${p.respostas.length} resposta${p.respostas.length !== 1 ? "s" : ""}`
                        : "Sem respostas"}
                    </span>
                  </div>
                  {aberta ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-1" />}
                </button>
                {aberta && (
                  <div className="border-t border-slate-100 px-4 py-3 space-y-3">
                    {p.respostas.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">Ainda não há respostas. Seja o primeiro a responder!</p>
                    ) : (
                      p.respostas.map((r) => (
                        <div key={r.id} className="bg-slate-50 rounded-xl p-3">
                          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                            <User className="w-3 h-3" />
                            <span className="font-medium text-slate-500">{r.autor}</span>
                            <span className="text-slate-300">·</span>
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatarData(r.criadaEm)}</span>
                          </div>
                          <p className="text-sm text-slate-700">{r.texto}</p>
                        </div>
                      ))
                    )}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text" placeholder="Escreva uma resposta..."
                        value={respostaTexto} onChange={(e) => setRespostaTexto(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") enviarResposta(p.id); }}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1b3e]/20 placeholder:text-slate-400"
                      />
                      <button
                        onClick={() => enviarResposta(p.id)} disabled={!respostaTexto.trim()}
                        className="px-3 py-2 bg-[#0d1b3e] text-white rounded-xl disabled:opacity-40 hover:bg-[#0d1b3e]/90 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
