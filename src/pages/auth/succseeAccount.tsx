import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function SuccessAccount() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");

  useEffect(() => {
    const nomeSalvo = localStorage.getItem("novoUsuarioNome");
    if (nomeSalvo) {
      setNome(nomeSalvo);
      localStorage.removeItem("novoUsuarioNome");
    }
  }, []);

  const primeiroNome = nome.split(" ")[0] || "Utilizador";

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-[350px] sm:max-w-[450px] md:max-w-[600px] bg-white/10 backdrop-blur-md rounded-[30px] sm:rounded-[40px] md:rounded-[50px] p-8 sm:p-10 md:p-16 shadow-2xl border border-white/10 flex flex-col items-center text-center"
    >
      <div className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-[#21A301]/20 rounded-full flex items-center justify-center mb-4 sm:mb-6">
        <svg className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 text-[#21A301]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-white text-lg sm:text-xl md:text-2xl font-black mb-2 sm:mb-4">
        Bem-Vindo, {primeiroNome}!
      </h2>

      <p className="text-white/70 text-sm sm:text-base md:text-lg font-medium mb-6 sm:mb-8 md:mb-10">
        A sua conta foi criada com sucesso.
      </p>

      <button 
        onClick={() => navigate('/')} 
        className="px-8 sm:px-10 py-3 sm:py-4 bg-[#21A301] hover:bg-[#1a8201] transition-all rounded-full text-white font-black text-sm sm:text-base md:text-lg shadow-lg uppercase active:scale-95"
      >
        Continuar
      </button>
    </motion.div>
  );
}