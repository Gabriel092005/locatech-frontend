import { useRef, FormEvent } from 'react';
import emailjs from '@emailjs/browser';
import { toast } from 'sonner'; 
import { Phone, MapPin } from 'lucide-react';

export function Contactos() {
  const form = useRef<HTMLFormElement>(null);

  const sendEmail = (e: FormEvent) => {
    e.preventDefault();
    if (!form.current) return;

    // CRITICAL: Substitua estas strings pelos seus IDs reais do painel EmailJS
    // Se mantiver 'service_id', o envio sempre falhará.
    const YOUR_SERVICE_ID = 'service_r4wtwxj'; 
    const YOUR_TEMPLATE_ID = 'template_v8rg58r';
    const YOUR_PUBLIC_KEY = 'c9KbUEzHGDAY1IBVe';

    emailjs.sendForm(
      YOUR_SERVICE_ID, 
      YOUR_TEMPLATE_ID, 
      form.current, 
      YOUR_PUBLIC_KEY
    )
      .then(() => {
        toast.success('Gmail enviado com sucesso!');
        form.current?.reset();
      })
      .catch((error) => {
        console.error('Erro EmailJS:', error);
        toast.error('Erro ao enviar o Gmail. Verifique as credenciais no código.');
      });
  };

  return (
    <div 
      className="w-full max-w-5xl mx-auto px-6 text-center text-white flex flex-col justify-center min-h-[calc(100vh-150px)] overflow-hidden"
    >
      
      {/* Título e Subtítulo com animação de descida */}
      <div data-aos="fade-down" data-aos-duration="1200">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 uppercase tracking-wider">Contacte-nos</h1>
        <p className="mb-8 opacity-90 max-w-2xl mx-auto text-lg leading-relaxed text-gray-100">
          Se precisar de informações adicionais ou assistência, por favor não hesite em contactar-nos.
        </p>
      </div>

      {/* Card do Formulário com animação de "Zoom in" e efeito Glassmorphism */}
      <div 
        className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-[30px] mb-8 shadow-2xl transition-all duration-300 hover:shadow-[#002f6c]/30"
        data-aos="zoom-in"
        data-aos-delay="300" // Atraso para aparecer depois do título
        data-aos-duration="1000"
      >
        <form ref={form} onSubmit={sendEmail} className="space-y-6">
          <div className="text-left">
            <label className="block text-sm font-bold mb-2 uppercase text-white/90">Comentários</label>
            <textarea 
              name="message"
              placeholder="Escreva o seu comentário aqui..." 
              className="w-full p-4 rounded-xl text-gray-800 h-32 outline-none focus:ring-2 focus:ring-yellow-400 transition-shadow"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <input 
              type="text" 
              name="user_name" 
              placeholder="Nome" 
              className="p-3 rounded-lg text-gray-800 outline-none w-full focus:ring-2 focus:ring-yellow-400 transition-shadow" 
              required 
            />
            <input 
              type="email" 
              name="user_gmail" 
              placeholder="Seu Gmail" 
              className="p-3 rounded-lg text-gray-800 outline-none w-full focus:ring-2 focus:ring-yellow-400 transition-shadow" 
              pattern=".+@gmail\.com" 
              required 
            />
            <button 
              type="submit" 
              className="bg-[#1e3a8a] hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.03] active:scale-95 shadow-md hover:shadow-lg w-full"
            >
              Comentar
            </button>
          </div>
        </form>
      </div>

      {/* Infos de Telefone e Localização com animação de subida */}
      <div 
        className="bg-white/95 p-6 rounded-[40px] text-[#001529] flex flex-col md:flex-row justify-around items-center shadow-xl border border-white/10 transition-transform duration-300 hover:scale-[1.01]"
        data-aos="fade-up"
        data-aos-delay="600" // Último elemento a aparecer
        data-aos-duration="1000"
      >
        <div className="flex flex-col items-center gap-1">
          <div className="bg-black p-2 rounded-full text-white mb-1"><Phone size={20} /></div>
          <h3 className="font-black text-sm uppercase tracking-wider">Telefone</h3>
          <div className="font-bold text-base">
            <p>+244 945 801 024</p>
            <p>+244 940 614 212</p>
          </div>
        </div>
        
        <div className="h-12 w-[1px] bg-gray-300 hidden md:block mx-4" />

        <div className="flex flex-col items-center gap-1">
          <div className="bg-black p-2 rounded-full text-white mb-1"><MapPin size={20} /></div>
          <h3 className="font-black text-sm uppercase tracking-wider">Localização</h3>
          <p className="font-bold text-center leading-tight text-base">
            Vila De Viana -<br />Bomba dos Mutilados
          </p>
        </div>
      </div>
    </div>
  );
}