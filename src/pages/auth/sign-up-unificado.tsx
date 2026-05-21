import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/axios";

export function SignUpUnificado() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get("tipo") || "cliente";

  const isGestor = tipo === "gestor";

  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    telefone: "",
    password: "",
  });

  function validar(): string | null {
    if (!formData.nome.trim()) return "Nome é obrigatório.";
    if (!formData.sobrenome.trim()) return "Sobrenome é obrigatório.";
    if (!formData.email.trim()) return "E-mail é obrigatório.";
    if (!formData.telefone.trim()) return "Telefone é obrigatório.";
    if (formData.password.length < 6) return "A palavra-passe deve ter pelo menos 6 caracteres.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const erroValidacao = validar();
    if (erroValidacao) { setErro(erroValidacao); return; }

    setIsLoading(true);
    setErro(null);

    try {
      const nomeCompleto = `${formData.nome.trim()} ${formData.sobrenome.trim()}`;
      const role = isGestor ? "GESTOR" : "MEMBER";

      const formPayload = new FormData();
      formPayload.append("nome", nomeCompleto);
      formPayload.append("email", formData.email.trim());
      formPayload.append("phone", formData.telefone.trim());
      formPayload.append("password", formData.password);
      formPayload.append("role", role);

      await api.post("/users", formPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      localStorage.setItem("contaCriada", "true");
      localStorage.setItem("novoUsuarioNome", nomeCompleto);
      navigate("/auth/success");
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ??
        error?.message ??
        "Erro ao criar conta. Tente novamente.";
      setErro(msg);
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full h-12 sm:h-14 px-4 sm:px-6 rounded-xl bg-[#D9D9D9] text-slate-800 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#001140]/50";

  const labelClass =
    "text-white/80 text-xs sm:text-sm font-semibold uppercase tracking-wider";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[400px] sm:max-w-[500px] bg-white/10 backdrop-blur-md rounded-[40px] sm:rounded-[50px] p-6 sm:p-12 shadow-2xl border border-white/10 text-white flex flex-col items-center"
    >
      <h2 className="text-xl sm:text-2xl font-black text-center mb-2 leading-tight">
        Crie sua conta
      </h2>

      <p className="text-sm text-white/70 mb-6 text-center">
        {isGestor ? (
          <>Registo como <span className="font-bold text-[#21A301]">Gestor</span></>
        ) : (
          <>Registo como <span className="font-bold">Cliente</span></>
        )}
      </p>

      {erro && (
        <div className="w-full mb-4 px-4 py-2.5 bg-[#F13324]/20 border border-[#F13324]/40 rounded-xl text-sm text-center text-red-200">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Nome</label>
            <input
              type="text"
              placeholder="João"
              value={formData.nome}
              onChange={(e) => setFormData((p) => ({ ...p, nome: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Sobrenome</label>
            <input
              type="text"
              placeholder="Silva"
              value={formData.sobrenome}
              onChange={(e) => setFormData((p) => ({ ...p, sobrenome: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>E-mail</label>
          <input
            type="email"
            placeholder="o.teu@email.com"
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Telefone</label>
          <input
            type="tel"
            placeholder="9XX XXX XXX"
            value={formData.telefone}
            onChange={(e) => setFormData((p) => ({ ...p, telefone: e.target.value }))}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Palavra-Passe</label>
          <input
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-6 h-12 sm:h-14 bg-[#001140] hover:bg-[#000a26] disabled:opacity-60 disabled:cursor-not-allowed transition-all rounded-full text-white font-black text-lg sm:text-xl shadow-xl uppercase active:scale-95 flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              A criar…
            </>
          ) : "Criar Conta"}
        </button>

        <p className="text-center text-sm text-white/60 mt-4">
          Já tens conta?{" "}
          <button
            type="button"
            onClick={() => navigate('/auth/login')}
            className="font-bold text-white hover:text-[#21A301] underline underline-offset-2 transition-colors bg-transparent border-none p-0 cursor-pointer inline"
          >
            Fazer login
          </button>
        </p>
      </form>
    </motion.div>
  );
}
