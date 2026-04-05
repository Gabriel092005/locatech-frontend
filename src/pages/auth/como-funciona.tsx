export function ComoFunciona() {
  return (
    /* Removido o bg-cover e bgImage para não duplicar com o layout pai */
    <div className="relative w-full flex flex-col items-center pt-10 md:pt-16 overflow-x-hidden">
      
      {/* Container Principal - Sem overlay próprio para não escurecer demais */}
      <div className="relative z-10 max-w-5xl w-full px-6 py-10 text-center text-white flex flex-col items-center">
        
        {/* Bloco 1: Título e Introdução */}
        <div data-aos="fade-down" className="mb-16 flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tighter text-yellow-400">
            Como Funciona?
          </h1>
          
          <p className="text-lg md:text-xl font-light max-w-3xl leading-relaxed opacity-90 text-gray-100">
            Os dados no <span className="font-bold text-yellow-400">LocaTech</span> são alimentados diretamente pelos gestores autorizados, garantindo precisão e responsabilidade em tempo real.
          </p>
        </div>

        {/* Bloco 2: Lista de Destaques Centralizada */}
        <div 
          className="w-full max-w-3xl mb-16 bg-white/5 p-10 rounded-[40px] border border-white/10 backdrop-blur-sm flex flex-col items-center shadow-xl"
          data-aos="fade-right"
          data-aos-delay="200"
        >
           <h2 className="text-xl font-bold mb-6 italic text-yellow-400 uppercase tracking-widest text-center">A plataforma exibe:</h2>
           <ul className="text-xl md:text-2xl font-bold space-y-4 list-none flex flex-col items-center text-center">
             <li className="flex items-center gap-3 justify-center w-full">
               <div className="min-w-[10px] h-2 bg-yellow-400 rounded-full" /> Localização geográfica
             </li>
             <li className="flex items-center gap-3 justify-center w-full">
               <div className="min-w-[10px] h-2 bg-yellow-400 rounded-full" /> Dados operacionais
             </li>
             <li className="flex items-center gap-3 justify-center w-full">
               <div className="min-w-[10px] h-2 bg-yellow-400 rounded-full" /> Atualizações em tempo real
             </li>
           </ul>
        </div>

        {/* Bloco 3: Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full">
          
          {/* Card 1 */}
          <div 
            className="bg-white/10 backdrop-blur-md border border-white/20 p-10 rounded-[45px] shadow-2xl hover:bg-white/15 transition-all group flex flex-col items-center text-center"
            data-aos="zoom-in-up"
            data-aos-delay="400"
          >
            <div className="flex flex-col items-center mb-6">
               <div className="bg-white/15 p-5 rounded-full mb-3 group-hover:scale-105 transition-transform duration-300">
                <span className="text-4xl">📍</span>
               </div>
               <h3 className="text-xl font-black uppercase tracking-tight text-yellow-400">Localização</h3>
            </div>
            <p className="text-sm md:text-base font-light leading-relaxed opacity-90 text-gray-100">
              Encontre a unidade mais próxima com precisão GPS, entendendo a logística de acesso de cada posto.
            </p>
          </div>

          {/* Card 2 */}
          <div 
            className="bg-white/10 backdrop-blur-md border border-white/20 p-10 rounded-[45px] shadow-2xl hover:bg-white/15 transition-all group flex flex-col items-center text-center"
            data-aos="zoom-in-up"
            data-aos-delay="600"
          >
            <div className="flex flex-col items-center mb-6">
               <div className="bg-white/15 p-5 rounded-full mb-3 group-hover:scale-105 transition-transform duration-300">
                <span className="text-4xl">⛽</span>
               </div>
               <h3 className="text-xl font-black uppercase tracking-tight text-yellow-400">Dados Técnicos</h3>
            </div>
            <p className="text-sm md:text-base font-light leading-relaxed opacity-90 text-gray-100">
              Capacidade de atendimento, serviços e horários. Decisões baseadas em fatos e dados operacionais.
            </p>
          </div>

          {/* Card 3 */}
          <div 
            className="bg-white/10 backdrop-blur-md border border-white/20 p-10 rounded-[45px] shadow-2xl hover:bg-white/15 transition-all group flex flex-col items-center text-center"
            data-aos="zoom-in-up"
            data-aos-delay="800"
          >
            <div className="flex flex-col items-center mb-6">
               <div className="bg-white/15 p-5 rounded-full mb-3 group-hover:scale-105 transition-transform duration-300">
                <span className="text-4xl">🕒</span>
               </div>
               <h3 className="text-xl font-black uppercase tracking-tight text-yellow-400">Tempo Real</h3>
            </div>
            <p className="text-sm md:text-base font-light leading-relaxed opacity-90 text-gray-100">
              Alertas imediatos sobre preços e stock, garantindo que a sua estratégia esteja sempre à frente.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}