import { useNavigate } from "react-router-dom";
import { usuarioAutenticado } from "@/lib/auth";

export function Home() {
  const navigate = useNavigate();

  function handleComecar() {
    if (usuarioAutenticado()) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/auth/select-type');
    }
  }

  return (
    <div className="w-full max-w-[900px] bg-white/10 backdrop-blur-md rounded-[60px] p-16 shadow-2xl border border-white/5 flex flex-col items-center text-center">
      <h1 className="text-white text-2xl md:text-3xl font-black leading-[1.2] tracking-normal mb-10 max-w-[750px]">
        LOCATECH - SISTEMA DE LOCALIZAÇÃO DE POSTOS DE COMBUSTÍVEIS E DISTRIBUIDORES DE GÁS BUTANO
      </h1>
      <p className="text-white text-lg md:text-xl font-normal leading-relaxed max-w-[650px] mb-14 opacity-80">
        UMA PLATAFORMA CAPAZ DE LOCALIZAR E MONITORAR POSTOS <br className="hidden md:block" />
        DE COMBUSTÍVEIS E DISTRIBUIDORES DE GÁS BUTANO EM TEMPO REAL
      </p>
      <button 
        onClick={handleComecar}
        className="w-[320px] h-16 bg-[#05267B] hover:bg-[#031b58] transition-all rounded-full text-white font-bold text-2xl shadow-2xl active:scale-95 uppercase tracking-[0.1em]"
      >
        COMEÇAR
      </button>
    </div>
  );
}