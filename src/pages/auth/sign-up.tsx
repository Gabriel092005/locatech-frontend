import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/axios"; // ajuste o caminho conforme seu projeto

// ── Types ──────────────────────────────────────────────────────────────────────

interface Step1Data {
  nomePosto: string;
  emailInstitucional: string;
  tipoPosto: string;
  nif: string;
  endereco: string;
}

interface Step2Data {
  produtoId: string;
  precoAtual: string;
  horario: string;
  alvara: File | null;
}

interface Step3Data {
  nome: string;
  email: string;
  palavraPasse: string;
  confirmarPasse: string;
  foto: File | null;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function SignUpGestor() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [step1, setStep1] = useState<Step1Data>({
    nomePosto: "",
    emailInstitucional: "",
    tipoPosto: "",
    nif: "",
    endereco: "",
  });

  const [step2, setStep2] = useState<Step2Data>({
    produtoId: "",
    precoAtual: "",
    horario: "",
    alvara: null,
  });

  const [step3, setStep3] = useState<Step3Data>({
    nome: "",
    email: "",
    palavraPasse: "",
    confirmarPasse: "",
    foto: null,
  });

  const nextStep = () => { setErro(null); setStep((p) => p + 1); };
  const prevStep = () => { setErro(null); setStep((p) => p - 1); };

  // ── Validações simples por step ──────────────────────────────────────────────

  function validarStep1(): string | null {
    if (!step1.nomePosto.trim())       return "Nome da empresa é obrigatório.";
    if (!step1.nif.trim())             return "NIF é obrigatório.";
    if (!step1.tipoPosto)              return "Selecione o tipo de empresa.";
    if (!step1.endereco)               return "Selecione a localização.";
    return null;
  }

  function validarStep2(): string | null {
    if (!step2.produtoId)              return "Selecione um produto.";
    if (!step2.precoAtual.trim())      return "Informe o preço do produto.";
    if (!step2.horario.trim())         return "Informe o horário de funcionamento.";
    return null;
  }

  function validarStep3(): string | null {
    if (!step3.nome.trim())            return "Nome completo é obrigatório.";
    if (!step3.email.trim())           return "E-mail é obrigatório.";
    if (step3.palavraPasse.length < 6) return "A palavra-passe deve ter pelo menos 6 caracteres.";
    if (step3.palavraPasse !== step3.confirmarPasse) return "As palavras-passe não coincidem.";
    return null;
  }

  // ── Submit final ─────────────────────────────────────────────────────────────

  async function handleSubmit() {
    const erroValidacao = validarStep3();
    if (erroValidacao) { setErro(erroValidacao); return; }

    setIsLoading(true);
    setErro(null);

    try {
      // 1. Criar o utilizador (gestor) com foto opcional
      const formDataUser = new FormData();
      formDataUser.append("nome", step3.nome);
      formDataUser.append("email", step3.email);
      formDataUser.append("password", step3.palavraPasse);
      if (step3.foto) formDataUser.append("image", step3.foto);

      const { data: userData } = await api.post("/users", formDataUser, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const gestorId: number = userData.user.id;

      // 2. Criar o Posto vinculado ao gestor
      const formDataPosto = new FormData();
      formDataPosto.append("nome", step1.nomePosto);
      formDataPosto.append("email_institucional", step1.emailInstitucional);
      formDataPosto.append("nif", step1.nif);
      formDataPosto.append("tipo", step1.tipoPosto);
      formDataPosto.append("endereco", step1.endereco);
      formDataPosto.append("horario_funcionamento", step2.horario);
      formDataPosto.append("gestorId", String(gestorId));
      if (step2.alvara) formDataPosto.append("alvara", step2.alvara);

      const { data: postoData } = await api.post("/postos", formDataPosto, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const postoId: number = postoData.posto.id;

      // 3. Criar o Stock (produto + preço) vinculado ao posto
      await api.post("/stocks", {
        postoId,
        produtoId: Number(step2.produtoId),
        preco_unitario: Number(step2.precoAtual),
        quantidade_atual: 0,
        capacidade_maxima: 0,
      });

      navigate("/auth/success");
    } catch (error: any) {
      console.log(error)
      const msg =
        error?.response?.data?.message ??
        error?.message ??
        "Erro ao criar conta. Tente novamente.";
      setErro(msg);
    } finally {
      setIsLoading(false);
    }
  }

  // ── Avançar com validação ────────────────────────────────────────────────────

  function handleNext() {
    if (step === 1) {
      const err = validarStep1();
      if (err) { setErro(err); return; }
    }
    if (step === 2) {
      const err = validarStep2();
      if (err) { setErro(err); return; }
    }
    nextStep();
  }

  // ── Animação ─────────────────────────────────────────────────────────────────

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: -20 },
  };

  const inputClass =
    "w-full h-14 px-6 rounded-xl bg-[#D9D9D9] text-slate-800 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#21A301]/50";

  const selectClass =
    "w-full h-14 px-6 rounded-xl bg-[#D9D9D9] text-slate-800 appearance-none focus:outline-none cursor-pointer focus:ring-2 focus:ring-[#21A301]/50";

  return (
    <div className="w-full max-w-[500px] bg-white/10 backdrop-blur-md rounded-[50px] p-12 shadow-2xl border border-white/10 text-white relative flex flex-col items-center overflow-hidden">

      {/* Botão voltar */}
      {step > 1 && (
        <button
          onClick={prevStep}
          className="absolute left-10 top-12 text-[#F13324] text-4xl hover:scale-110 transition-transform z-20"
        >
          <span className="leading-none">←</span>
        </button>
      )}

      {/* Título */}
      <h2 className="text-2xl font-black text-center mb-2 leading-tight">
        Crie uma conta <br />
        <span className="font-bold">(Gestor)</span>
      </h2>

      {/* Indicador de steps */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              s === step
                ? "w-6 bg-[#21A301]"
                : s < step
                ? "w-2 bg-[#21A301]/60"
                : "w-2 bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* Erro global */}
      {erro && (
        <div className="w-full mb-4 px-4 py-2.5 bg-[#F13324]/20 border border-[#F13324]/40 rounded-xl text-sm text-center text-red-200">
          {erro}
        </div>
      )}

      {/* Steps */}
      <div className="w-full min-h-[300px] relative">
        <AnimatePresence mode="wait">

          {/* ── Step 1: Dados da Empresa ─────────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="Nome da Empresa"
                value={step1.nomePosto}
                onChange={(e) => setStep1((p) => ({ ...p, nomePosto: e.target.value }))}
                className={inputClass}
              />
              <input
                type="email"
                placeholder="E-mail Institucional"
                value={step1.emailInstitucional}
                onChange={(e) => setStep1((p) => ({ ...p, emailInstitucional: e.target.value }))}
                className={inputClass}
              />
              <div className="relative">
                <select
                  value={step1.tipoPosto}
                  onChange={(e) => setStep1((p) => ({ ...p, tipoPosto: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">Tipo de Empresa</option>
                  <option value="COMBUSTIVEL">Combustível</option>
                  <option value="GAS">Gás</option>
                  <option value="MISTO">Misto</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-800 text-[10px]">▼</div>
              </div>
              <input
                type="text"
                placeholder="NIF"
                value={step1.nif}
                onChange={(e) => setStep1((p) => ({ ...p, nif: e.target.value }))}
                className={inputClass}
              />
              <div className="relative">
                <select
                  value={step1.endereco}
                  onChange={(e) => setStep1((p) => ({ ...p, endereco: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">Localização</option>
                  <option value="Luanda">Luanda</option>
                  <option value="Benguela">Benguela</option>
                  <option value="Huambo">Huambo</option>
                  <option value="Lubango">Lubango</option>
                  <option value="Cabinda">Cabinda</option>
                  <option value="Malanje">Malanje</option>
                  <option value="Uíge">Uíge</option>
                  <option value="Namibe">Namibe</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-800 text-[10px]">▼</div>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Dados do Posto / Stock ───────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="relative">
                <select
                  value={step2.produtoId}
                  onChange={(e) => setStep2((p) => ({ ...p, produtoId: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">Produtos Geridos</option>
                  {/* Idealmente carregue via API: GET /produtos */}
                  <option value="1">Gasolina</option>
                  <option value="2">Gasóleo</option>
                  <option value="3">Gás</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-800 text-[10px]">▼</div>
              </div>

              <input
                type="number"
                placeholder="Preço Atual do Produto (Kz)"
                value={step2.precoAtual}
                onChange={(e) => setStep2((p) => ({ ...p, precoAtual: e.target.value }))}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Horário de Funcionamento (ex: 07h–22h)"
                value={step2.horario}
                onChange={(e) => setStep2((p) => ({ ...p, horario: e.target.value }))}
                className={inputClass}
              />

              {/* Upload do Alvará */}
              <label className="flex items-center gap-3 w-full h-14 px-6 rounded-xl bg-[#D9D9D9] text-slate-600 cursor-pointer hover:bg-[#c8c8c8] transition-colors">
                <span className="text-slate-500 text-sm">📎</span>
                <span className="text-sm truncate flex-1">
                  {step2.alvara ? step2.alvara.name : "Upload do Alvará (PDF/imagem)"}
                </span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={(e) =>
                    setStep2((p) => ({ ...p, alvara: e.target.files?.[0] ?? null }))
                  }
                />
              </label>
            </motion.div>
          )}

          {/* ── Step 3: Dados do Gestor ───────────────────────────────────── */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="Nome Completo"
                value={step3.nome}
                onChange={(e) => setStep3((p) => ({ ...p, nome: e.target.value }))}
                className={inputClass}
              />
              <input
                type="email"
                placeholder="E-mail"
                value={step3.email}
                onChange={(e) => setStep3((p) => ({ ...p, email: e.target.value }))}
                className={inputClass}
              />
              <input
                type="password"
                placeholder="Palavra-Passe"
                value={step3.palavraPasse}
                onChange={(e) => setStep3((p) => ({ ...p, palavraPasse: e.target.value }))}
                className={inputClass}
              />
              <input
                type="password"
                placeholder="Confirmar Palavra-Passe"
                value={step3.confirmarPasse}
                onChange={(e) => setStep3((p) => ({ ...p, confirmarPasse: e.target.value }))}
                className={inputClass}
              />

              {/* Foto de perfil opcional */}
              <label className="flex items-center gap-3 w-full h-14 px-6 rounded-xl bg-[#D9D9D9] text-slate-600 cursor-pointer hover:bg-[#c8c8c8] transition-colors">
                <span className="text-sm">🖼️</span>
                <span className="text-sm truncate flex-1">
                  {step3.foto ? step3.foto.name : "Foto de Perfil (opcional)"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    setStep3((p) => ({ ...p, foto: e.target.files?.[0] ?? null }))
                  }
                />
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Botão principal */}
      <div className="mt-10 flex justify-center z-20">
        <button
          onClick={step === 3 ? handleSubmit : handleNext}
          disabled={isLoading}
          className="px-12 h-14 bg-[#21A301] hover:bg-[#1a8201] disabled:opacity-60 disabled:cursor-not-allowed transition-all rounded-full text-white font-black text-xl shadow-xl uppercase active:scale-95 flex items-center gap-3"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              A criar…
            </>
          ) : step === 3 ? "Criar Conta" : "Seguinte"}
        </button>
      </div>
    </div>
  );
}