import { ArrowLeft, Save, Plus, Fuel, X, Loader2, Droplets, Zap, AlertCircle, Check } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';

// ── Types ─────────────────────────────────────────────────────────────────

interface Produto {
  id: number;
  nome: string;
  unidade_medida: string;
}

interface StockData {
  id: number;
  produtoId: number;
  nome: string;
  preco_unitario: number;
  quantidade_atual: number;
}

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
  stocks: {
    id: number;
    produtoId: number;
    preco_unitario: number;
    quantidade_atual: number;
    produto: { id: number; nome: string; unidade_medida: string };
  }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getProdutoIcon(nome: string, className = "w-4 h-4") {
  const n = nome.toLowerCase();
  if (n.includes("gasolina")) return <Droplets className={`${className} text-orange-500`} />;
  if (n.includes("gasóleo") || n.includes("diesel")) return <Fuel className={`${className} text-blue-500`} />;
  if (n.includes("gás")) return <Zap className={`${className} text-green-500`} />;
  return <Fuel className={`${className} text-slate-400`} />;
}

// ── Types Card ────────────────────────────────────────────────────────────

const TIPO_OPTIONS = [
  { value: "MISTO", label: "Misto", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "COMBUSTIVEL", label: "Combustível", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "GAS", label: "Gás", color: "bg-green-100 text-green-700 border-green-200" },
];

// ── Component ─────────────────────────────────────────────────────────────

export function EditarPosto() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Formulário do posto
  const [form, setForm] = useState({
    nome: '',
    email_institucional: '',
    nif: '',
    tipo: 'MISTO' as string,
    endereco: '',
    horario_funcionamento: '',
    latitude: '',
    longitude: '',
  });

  // Stocks
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [originalStocks, setOriginalStocks] = useState<StockData[]>([]);
  const [stocksChanged, setStocksChanged] = useState<Set<number>>(new Set());

  // Add product
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<Produto[]>([]);
  const [novoProdutoId, setNovoProdutoId] = useState<number | ''>('');
  const [novoPreco, setNovoPreco] = useState('');
  const [novoQuantidade, setNovoQuantidade] = useState('');
  const [addingStock, setAddingStock] = useState(false);

  // Create new product type
  const [criarNovoProduto, setCriarNovoProduto] = useState(false);
  const [novoProdutoNome, setNovoProdutoNome] = useState('');
  const [novoProdutoUnidade, setNovoProdutoUnidade] = useState('L');
  const [criandoProduto, setCriandoProduto] = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const postoId = id || '1';
        const [postoRes, produtosRes] = await Promise.all([
          api.get<{ posto: PostoData }>(`/postos/${postoId}`),
          api.get<{ produtos: Produto[] }>('/produtos'),
        ]);

        const p = postoRes.data.posto;
        setForm({
          nome: p.nome || '',
          email_institucional: p.email_institucional || '',
          nif: p.nif || '',
          tipo: p.tipo || 'MISTO',
          endereco: p.endereco || '',
          horario_funcionamento: p.horario_funcionamento || '',
          latitude: p.latitude?.toString() || '',
          longitude: p.longitude?.toString() || '',
        });

        const mapped = (p.stocks || []).map((s) => ({
          id: s.id,
          produtoId: s.produtoId,
          nome: s.produto.nome,
          preco_unitario: s.preco_unitario,
          quantidade_atual: s.quantidade_atual,
        }));
        setStocks(mapped);
        setOriginalStocks(JSON.parse(JSON.stringify(mapped)));

        setProdutosDisponiveis(produtosRes.data.produtos || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Erro ao carregar posto.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // ── Stock change tracking ─────────────────────────────────────────────

  function updateStock(stockId: number, field: 'preco_unitario' | 'quantidade_atual', value: number) {
    setStocks((prev) => {
      const next = prev.map((s) => s.id === stockId ? { ...s, [field]: value } : s);
      return next;
    });
    setStocksChanged((prev) => new Set(prev).add(stockId));
  }

  function hasStockChanged(stockId: number): boolean {
    const current = stocks.find((s) => s.id === stockId);
    const original = originalStocks.find((s) => s.id === stockId);
    if (!current || !original) return false;
    return current.preco_unitario !== original.preco_unitario ||
           current.quantidade_atual !== original.quantidade_atual;
  }

  // ── Save posto info ───────────────────────────────────────────────────

  async function handleSavePosto() {
    setSaving('posto');
    setError(null);
    setSuccess(null);
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

      await api.patch(`/postos/${id}`, payload);
      setSuccess('Informações do posto atualizadas!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao salvar posto.');
    } finally {
      setSaving(null);
    }
  }

  // ── Save single stock ─────────────────────────────────────────────────

  async function handleSaveStock(stockId: number) {
    setSaving(`stock-${stockId}`);
    setError(null);
    setSuccess(null);
    try {
      const stock = stocks.find((s) => s.id === stockId);
      if (!stock) return;

      await api.patch(`/stocks/${stockId}`, {
        preco_unitario: stock.preco_unitario,
        quantidade_atual: stock.quantidade_atual,
      });

      setOriginalStocks((prev) =>
        prev.map((s) => s.id === stockId ? { ...s, preco_unitario: stock.preco_unitario, quantidade_atual: stock.quantidade_atual } : s)
      );
      setStocksChanged((prev) => { const next = new Set(prev); next.delete(stockId); return next; });
      setSuccess(`Preço de "${stock.nome}" atualizado!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao salvar stock.');
    } finally {
      setSaving(null);
    }
  }

  // ── Create new product type ────────────────────────────────────────────

  async function handleCriarProdutoEAdicionar() {
    if (!novoProdutoNome.trim()) return;
    setCriandoProduto(true);
    setError(null);
    try {
      const { data } = await api.post('/produtos', {
        nome: novoProdutoNome.trim(),
        unidade_medida: novoProdutoUnidade,
      });
      const produtoNovo: Produto = data.produto;
      setProdutosDisponiveis((prev) => [...prev, produtoNovo]);
      setNovoProdutoId(produtoNovo.id);
      setCriarNovoProduto(false);
      setNovoProdutoNome('');
      setSuccess(`Produto "${produtoNovo.nome}" criado! Agora define o preço.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao criar produto.');
    } finally {
      setCriandoProduto(false);
    }
  }

  // ── Add new stock ─────────────────────────────────────────────────────

  async function handleAddStock() {
    if (!novoProdutoId || !novoPreco) return;
    setAddingStock(true);
    setError(null);
    try {
      const { data } = await api.post('/stocks', {
        postoId: Number(id),
        produtoId: Number(novoProdutoId),
        preco_unitario: parseFloat(novoPreco),
        quantidade_atual: parseFloat(novoQuantidade) || 0,
      });

      const novo: StockData = {
        id: data.stock.id,
        produtoId: data.stock.produtoId,
        nome: produtosDisponiveis.find((p) => p.id === Number(novoProdutoId))?.nome || '',
        preco_unitario: data.stock.preco_unitario,
        quantidade_atual: data.stock.quantidade_atual,
      };
      setStocks((prev) => [...prev, novo]);
      setOriginalStocks((prev) => [...prev, { ...novo }]);

      setNovoProdutoId('');
      setNovoPreco('');
      setNovoQuantidade('');
      setSuccess(`"${novo.nome}" adicionado ao posto!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao adicionar produto.');
    } finally {
      setAddingStock(false);
    }
  }

  // ── Loading screen ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#edf0f4] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
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

  // ── Error screen ──────────────────────────────────────────────────────

  if (error && !stocks.length && !form.nome) {
    return (
      <div className="min-h-screen bg-[#edf0f4] flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl p-10 max-w-md text-center shadow-lg border border-red-100">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-slate-800 font-bold text-lg mb-2">Posto não encontrado</p>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-[#0d1b3e] text-white text-sm font-bold rounded-full hover:opacity-90 transition-opacity">
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────

  const produtosFiltrados = produtosDisponiveis.filter(
    (prod) => !stocks.some((s) => s.produtoId === prod.id)
  );

  return (
    <div className="min-h-screen bg-[#edf0f4] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* ── Top Bar ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors">
            <ArrowLeft size={18} /> Voltar
          </button>
          <div className="bg-white/70 backdrop-blur-sm px-6 py-2 rounded-full text-slate-700 font-bold uppercase tracking-wider text-xs shadow-sm border border-slate-200/60">
            Gerir Posto
          </div>
          <div className="w-[80px]" />
        </div>

        {/* ── Success Toast ────────────────────────────────────────────── */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
            <Check className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-sm font-semibold text-green-700">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-sm font-semibold text-red-700">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ══════════════ CARD 1: Informações do Posto ════════════════ */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/60">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#0d1b3e] flex items-center justify-center">
                <Fuel className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Informações do Posto</h2>
                <p className="text-[11px] text-slate-400">Dados institucionais e localização</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Nome do Posto</label>
                <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full bg-slate-100 border border-slate-200 focus:border-[#0d1b3e] focus:bg-white outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Email</label>
                  <input type="email" value={form.email_institucional} onChange={(e) => setForm({ ...form, email_institucional: e.target.value })} className="w-full bg-slate-100 border border-slate-200 focus:border-[#0d1b3e] focus:bg-white outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">NIF</label>
                  <input type="text" value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })} className="w-full bg-slate-100 border border-slate-200 focus:border-[#0d1b3e] focus:bg-white outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Tipo</label>
                <div className="flex gap-2">
                  {TIPO_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setForm({ ...form, tipo: opt.value })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${form.tipo === opt.value ? `${opt.color} shadow-sm` : 'bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Endereço</label>
                <input type="text" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className="w-full bg-slate-100 border border-slate-200 focus:border-[#0d1b3e] focus:bg-white outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Horário</label>
                <input type="text" value={form.horario_funcionamento} onChange={(e) => setForm({ ...form, horario_funcionamento: e.target.value })} placeholder="Ex: 07h–22h" className="w-full bg-slate-100 border border-slate-200 focus:border-[#0d1b3e] focus:bg-white outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Latitude</label>
                  <input type="text" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="-8.921" className="w-full bg-slate-100 border border-slate-200 focus:border-[#0d1b3e] focus:bg-white outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Longitude</label>
                  <input type="text" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="13.184" className="w-full bg-slate-100 border border-slate-200 focus:border-[#0d1b3e] focus:bg-white outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all" />
                </div>
              </div>

              <button onClick={handleSavePosto} disabled={saving === 'posto'}
                className="w-full py-3 bg-[#0d1b3e] hover:bg-[#162251] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-[#0d1b3e]/20">
                {saving === 'posto' ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar Alterações</>}
              </button>
            </div>
          </div>

          {/* ══════════════ CARD 2: Produtos / Stocks ════════════════════ */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/60">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Fuel className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Produtos e Preços</h2>
                <p className="text-[11px] text-slate-400">{stocks.length} produto{stocks.length !== 1 ? 's' : ''} registado{stocks.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Lista de stocks */}
            {stocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                  <Fuel className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-xs text-slate-400 font-medium">Nenhum produto registado</p>
                <p className="text-[10px] text-slate-300 mt-1">Adicione produtos abaixo</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {stocks.map((stock) => {
                  const changed = hasStockChanged(stock.id);
                  return (
                    <div key={stock.id} className={`bg-slate-50 rounded-2xl p-4 border transition-all ${changed ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          {getProdutoIcon(stock.nome, "w-5 h-5")}
                          <span className="font-bold text-slate-800 text-sm">{stock.nome}</span>
                        </div>
                        {changed && <span className="text-[10px] font-bold text-amber-500 bg-amber-100 px-2 py-0.5 rounded-full">Alterado</span>}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Preço (Kz)</label>
                          <input type="number" step="0.01" min="0" value={stock.preco_unitario}
                            onChange={(e) => updateStock(stock.id, 'preco_unitario', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 focus:border-[#0d1b3e] outline-none rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 transition-all" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Quantidade (L)</label>
                          <input type="number" step="0.1" min="0" value={stock.quantidade_atual}
                            onChange={(e) => updateStock(stock.id, 'quantidade_atual', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 focus:border-[#0d1b3e] outline-none rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 transition-all" />
                        </div>
                      </div>

                      {changed && (
                        <button onClick={() => handleSaveStock(stock.id)} disabled={saving === `stock-${stock.id}`}
                          className="mt-3 w-full py-2 bg-[#0d1b3e] hover:bg-[#162251] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5">
                          {saving === `stock-${stock.id}` ? <><Loader2 className="w-3 h-3 animate-spin" /> Salvando...</> : <><Save className="w-3 h-3" /> Salvar {stock.nome}</>}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="h-px bg-slate-200 my-5" />

            {/* Adicionar novo produto */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-700 text-xs flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-[#0d1b3e]" />
                  Adicionar Produto
                </h3>
                <button
                  onClick={() => { setCriarNovoProduto(!criarNovoProduto); setNovoProdutoId(''); }}
                  className="text-[10px] font-bold text-[#0d1b3e] hover:underline flex items-center gap-1"
                >
                  {criarNovoProduto ? 'Usar existente' : 'Criar novo tipo'}
                </button>
              </div>

              {criarNovoProduto ? (
                /* ── Criar novo tipo de produto ── */
                <div className="space-y-3 bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Nome do Produto</label>
                      <input type="text" value={novoProdutoNome} onChange={(e) => setNovoProdutoNome(e.target.value)}
                        placeholder="Ex: Etanol" className="w-full bg-white border border-slate-200 focus:border-[#0d1b3e] outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Unidade</label>
                      <select value={novoProdutoUnidade} onChange={(e) => setNovoProdutoUnidade(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-[#0d1b3e] outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all">
                        <option value="L">L (Litros)</option>
                        <option value="Kg">Kg (Quilogramas)</option>
                        <option value="UN">UN (Unidades)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Preço (Kz)</label>
                      <input type="number" step="0.01" min="0" value={novoPreco} onChange={(e) => setNovoPreco(e.target.value)} placeholder="0.00" className="w-full bg-white border border-slate-200 focus:border-[#0d1b3e] outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Quantidade</label>
                      <input type="number" step="0.1" min="0" value={novoQuantidade} onChange={(e) => setNovoQuantidade(e.target.value)} placeholder="0" className="w-full bg-white border border-slate-200 focus:border-[#0d1b3e] outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all" />
                    </div>
                  </div>

                  <button onClick={handleCriarProdutoEAdicionar} disabled={!novoProdutoNome.trim() || !novoPreco || criandoProduto}
                    className="w-full py-2.5 bg-[#0d1b3e] hover:bg-[#162251] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm">
                    {criandoProduto ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Criando...</> : <><Plus className="w-3.5 h-3.5" /> Criar e Adicionar</>}
                  </button>
                </div>
              ) : (
                /* ── Selecionar produto existente ── */
                <div className="space-y-3">
                  {produtosFiltrados.length === 0 ? (
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <p className="text-[11px] text-slate-400 font-medium">Todos os produtos já foram adicionados.</p>
                      <button onClick={() => setCriarNovoProduto(true)}
                        className="mt-2 text-[11px] font-bold text-[#0d1b3e] hover:underline">
                        Criar novo tipo de produto
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Produto</label>
                        <select value={novoProdutoId} onChange={(e) => setNovoProdutoId(e.target.value ? Number(e.target.value) : '')}
                          className="w-full bg-slate-100 border border-slate-200 focus:border-[#0d1b3e] focus:bg-white outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all">
                          <option value="">Selecionar produto...</option>
                          {produtosFiltrados.map((prod) => (
                            <option key={prod.id} value={prod.id}>{prod.nome} ({prod.unidade_medida})</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Preço (Kz)</label>
                          <input type="number" step="0.01" min="0" value={novoPreco} onChange={(e) => setNovoPreco(e.target.value)} placeholder="0.00" className="w-full bg-slate-100 border border-slate-200 focus:border-[#0d1b3e] focus:bg-white outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Quantidade</label>
                          <input type="number" step="0.1" min="0" value={novoQuantidade} onChange={(e) => setNovoQuantidade(e.target.value)} placeholder="0" className="w-full bg-slate-100 border border-slate-200 focus:border-[#0d1b3e] focus:bg-white outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all" />
                        </div>
                      </div>

                      <button onClick={handleAddStock} disabled={!novoProdutoId || !novoPreco || addingStock}
                        className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm">
                        {addingStock ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Adicionando...</> : <><Plus className="w-3.5 h-3.5" /> Adicionar Produto</>}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
