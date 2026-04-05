// src/pages/auth/sobre.tsx
import bgImage from '../../assets/bg.jpeg';

export function Sobre() {
    return (
        <div className="flex flex-col w-full min-h-screen font-sans bg-white overflow-hidden">

            {/* 1. SEÇÃO HERO com Efeito de Parallax Suave */}
            <section
                className="relative h-[450px] md:h-[550px] flex items-center justify-center bg-cover bg-center bg-no-repeat bg-fixed"
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

                <div
                    className="relative z-10 max-w-6xl px-6 text-center text-white"
                    data-aos="fade-up" // Animação de entrada do Hero
                >
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-10 md:p-16 rounded-[40px] shadow-2xl">
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 uppercase tracking-widest text-white">
                            Sobre o Locatech
                        </h1>
                        <p className="text-lg md:text-xl font-light leading-relaxed max-w-4xl mx-auto opacity-95 text-gray-100">
                            O LocaTech nasce para resolver um problema real em Angola: a falta de informação viável,
                            atualizada e acessível sobre postos de combustíveis e distribuidores de gás butano.
                            Eliminamos a incerteza para que o cidadão não perca tempo, combustível e dinheiro.
                        </p>
                    </div>
                </div>
            </section>

            {/* 2. CONTEÚDO PRINCIPAL */}
            <main className="w-full flex-1 bg-white">

                {/* Bloco 1: Missão (Fundo Branco - Animação Direita) */}
                <div className="py-24 px-4 w-full flex justify-center">
                    <div className="max-w-5xl w-full" data-aos="fade-right">
                        <div className="bg-[#5c6b84] text-white p-16 md:p-24 rounded-[50px] text-center shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
                            <h2 className="text-3xl font-bold mb-8 uppercase tracking-wider text-white">
                                Nossa Missão
                            </h2>
                            <p className="text-xl md:text-2xl font-light leading-relaxed text-gray-100">
                                Facilitar o acesso à informação energética, promover transparência no abastecimento
                                e usar tecnologia para melhorar o dia-a-dia das pessoas.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bloco 2: Visão e Valores (Fundo Cinza Claro - Animação Esquerda) */}
                <div className="bg-[#f8f9fa] py-24 px-4 w-full flex justify-center border-y border-gray-100">
                    <div className="max-w-5xl w-full space-y-16">

                        <div className="bg-[#5a7a5a] text-white p-16 md:p-24 rounded-[50px] text-center shadow-2xl transform hover:scale-[1.02] transition-transform duration-300" data-aos="fade-left">
                            <h2 className="text-3xl font-bold mb-8 uppercase tracking-wider text-white">
                                Nossa Visão
                            </h2>
                            <p className="text-xl md:text-2xl font-light leading-relaxed text-gray-100">
                                Ser a principal referência digital em monitoramento de combustíveis e gás em Angola,
                                contribuindo para um sistema mais organizado, eficiente e confiável.
                            </p>
                        </div>

                        <div className="bg-[#5c6b84] text-white p-16 md:p-24 rounded-[50px] text-center shadow-2xl transform hover:scale-[1.02] transition-transform duration-300" data-aos="fade-right">
                            <h2 className="text-3xl font-bold mb-10 uppercase tracking-wider text-white">
                                Nossos Valores
                            </h2>
                            <div className="text-xl md:text-2xl font-light grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-left leading-relaxed text-gray-100">
                                <p><strong className="text-white">Transparência:</strong> Dados claros e verificáveis</p>
                                <p><strong className="text-white">Responsabilidade:</strong> Informação gera impacto</p>
                                <p><strong className="text-white">Inovação Prática:</strong> Tecnologia que resolve problemas reais</p>
                                <p><strong className="text-white">Compromisso Social:</strong> Foco no cidadão</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Bloco 3: Para quem é o LocaTech? */}
                <div className="py-20 px-4 w-full flex justify-center bg-white">
                    <div className="max-w-4xl w-full" data-aos="fade-up">
                        <div className="bg-[#6b8e6b] text-white p-12 md:p-20 rounded-[50px] text-center shadow-lg">

                            <h2 className="text-2xl md:text-3xl font-bold mb-8 uppercase tracking-widest">
                                Para quem é o LocaTech?
                            </h2>

                            <div className="space-y-4 text-lg md:text-xl font-light leading-relaxed mb-12 opacity-90">
                                <p>Utilizadores comuns, que querem saber onde abastecer sem perder tempo</p>
                                <p>Gestores de postos, que precisam divulgar disponibilidade e preços com transparência</p>
                                <p>Instituições e decisores, que necessitam de dados para análise e planeamento</p>
                            </div>

                            {/* Frase Final com destaque */}
                            <p className="text-xl md:text-2xl font-bold border-t border-white/20 pt-8">
                                O LocaTech não é apenas informativo. É uma ferramenta de apoio à decisão.
                            </p>

                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}