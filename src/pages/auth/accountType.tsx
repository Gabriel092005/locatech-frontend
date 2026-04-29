import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function SelectAccountType() {
  const navigate = useNavigate();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-[350px] sm:max-w-[500px] md:max-w-[700px] bg-white/10 backdrop-blur-lg rounded-[30px] sm:rounded-[40px] md:rounded-[50px] p-8 sm:p-10 md:p-14 shadow-2xl border border-white/10 flex flex-col items-center text-white"
    >
      <motion.div variants={item}>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase mb-2 sm:mb-3 tracking-tight text-center">
          Que tipo de conta<br />deseja criar?
        </h2>
      </motion.div>
      
      <motion.p variants={item} className="text-base sm:text-lg md:text-xl font-medium mb-6 sm:mb-8 md:mb-10 text-white/70">
        Selecione a opção:
      </motion.p>

      <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full justify-center">
        <motion.button 
          variants={item}
          whileHover={{ scale: 1.03, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/auth/sign-up-cliente')}
          className="group w-full sm:w-48 md:w-64 h-20 sm:h-24 md:h-28 bg-[#001140] hover:bg-[#000a26] transition-all rounded-[30px] sm:rounded-[40px] text-white font-black text-lg sm:text-xl md:text-2xl shadow-xl uppercase tracking-wider flex flex-col items-center justify-center gap-1 sm:gap-2"
        >
          <svg className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 mb-0.5 opacity-80 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9m-9-3h9m9-3h9m-9-3h9M4.5 9.75h9m-9-3h9" />
          </svg>
          Cliente
        </motion.button>

        <motion.button 
          variants={item}
          whileHover={{ scale: 1.03, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/auth/sign-up-gestor')}
          className="group w-full sm:w-48 md:w-64 h-20 sm:h-24 md:h-28 bg-[#21A301] hover:bg-[#1a8201] transition-all rounded-[30px] sm:rounded-[40px] text-white font-black text-lg sm:text-xl md:text-2xl shadow-xl uppercase tracking-wider flex flex-col items-center justify-center gap-1 sm:gap-2"
        >
          <svg className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 mb-0.5 opacity-80 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0h3.79m-5.79 0H3.09m8.45-4.71h.38m4.34.25h.38m-3.88-3.88h3.88M19.5 12c0-1.23-.5-2.36-1.32-3.13M13.5 3.75a3 3 0 116 0 3 3 0 01-6 0z" />
          </svg>
          Gestor
        </motion.button>
      </motion.div>
    </motion.div>
  );
}