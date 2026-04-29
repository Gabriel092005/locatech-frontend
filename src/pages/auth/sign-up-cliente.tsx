import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/axios";

export function SignUpCliente() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
  });

  function validar(): string | null {
    if (!formData.nome.trim()) return "Nome completo é obrigatório.";
    if (!formData.email.trim()) return "E-mail é obrigatório.";
    if (!formData.telefone.trim()) return "Telefone é obrigatório.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const erroValidacao = validar();
    if (erroValidacao) { setErro(erroValidacao); return; }

    setIsLoading(true);
    setErro(null);

    try {
      await api.post("/users", {
        nome: formData.nome,
        email: formData.email,
        phone: formData.telefone,
        role: "MEMBER",
      });

      localStorage.setItem("contaCriada", "true");
      localStorage.setItem("novoUsuarioNome", formData.nome);
      navigate("/");
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? error?.message ?? "Erro ao criar conta. Tente novamente.";
      setErro(msg);
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full h-12 sm:h-14 px-4 sm:px-6 rounded-xl bg-[#D9D9D9] text-slate-800 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#001140]/50";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[400px] sm:max-w-[500px] bg-white/10 backdrop-blur-md rounded-[40px] sm:rounded-[50px] p-6 sm:p-12 shadow-2xl border border-white/10 text-white relative flex flex-col items-center"
    >
      <h2 className="text-xl sm:text-2xl font-black text-center mb-2 leading-tight">
        Crie uma conta <br />
        <span className="font-bold">(Cliente)</span>
      </h2>

      <p className="text-sm text-white/70 mb-6 text-center">
        Apenas nome, e-mail e telefone
      </p>

      {erro && (
        <div className="w-full mb-4 px-4 py-2.5 bg-[#F13324]/20 border border-[#F13324]/40 rounded-xl text-sm text-center text-red-200">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <input
          type="text"
          placeholder="Nome Completo"
          value={formData.nome}
          onChange={(e) => setFormData((p) => ({ ...p, nome: e.target.value }))}
          className={inputClass}
        />
        <input
          type="email"
          placeholder="E-mail"
          value={formData.email}
          onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
          className={inputClass}
        />
        <input
          type="tel"
          placeholder="Telefone (ex: 9XX XXX XXX)"
          value={formData.telefone}
          onChange={(e) => setFormData((p) => ({ ...p, telefone: e.target.value }))}
          className={inputClass}
        />

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
      </form>
    </motion.div>
  );
}