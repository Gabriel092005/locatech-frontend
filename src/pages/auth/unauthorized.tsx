import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen bg-[#edf0f4] flex items-center justify-center px-4"
    >
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
        <div className="text-6xl mb-4">🚫</div>
        
        <h1 className="text-2xl font-black text-slate-900 mb-2">
          Acesso Negado
        </h1>
        
        <p className="text-slate-500 text-sm mb-6">
          Você não tem permissão para aceder a esta página.
          <br />
          Contacte o administrador se precisa de acesso.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
          >
            Voltar
          </button>
          
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/");
            }}
            className="px-6 py-2.5 bg-[#0d1b3e] hover:bg-[#162251] text-white font-semibold rounded-xl transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </div>
    </motion.div>
  );
}
