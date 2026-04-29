import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function ErrorAccount() {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-[350px] sm:max-w-[450px] md:max-w-[600px] bg-white/10 backdrop-blur-md rounded-[30px] sm:rounded-[40px] md:rounded-[50px] p-8 sm:p-10 md:p-16 shadow-2xl border border-white/10 flex flex-col items-center text-center"
    >
      <h2 className="text-white text-lg sm:text-xl md:text-2xl font-black mb-6 sm:mb-8 md:mb-10">
        Ops... Algo aconteceu
      </h2>

      <button className="w-full max-w-[250px] sm:max-w-[300px] md:max-w-[350px] py-6 sm:py-7 md:py-8 bg-[#F13324] hover:bg-[#d12a1d] transition-all rounded-[30px] sm:rounded-[40px] text-white font-black text-base sm:text-lg md:text-xl shadow-lg cursor-default mb-6 sm:mb-8 leading-tight">
        Conta não criada<br />Tente novamente
      </button>

      <button 
        onClick={() => navigate(-1)} 
        className="text-white/80 hover:text-white text-base sm:text-lg md:text-lg font-medium transition-colors"
      >
        Voltar
      </button>
    </motion.div>
  );
}