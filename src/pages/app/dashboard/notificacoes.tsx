import { FetchNotification } from "@/api/fetch-notification";
import { useQuery } from "@tanstack/react-query";

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-12 h-12 text-slate-700 shrink-0"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export default function NotificacoesPage() {
  // 1. Buscamos os dados. Note que 'data' contém o objeto { notifications: [...] }
  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => FetchNotification({ userId: 1 }),
  });

  // 2. Tratamento de carregamento e erro
  if (isLoading) return <div className="flex justify-center p-10">Carregando notificações...</div>;
  if (isError) return <div className="flex justify-center p-10 text-red-500">Erro ao carregar dados.</div>;

  // 3. Pegamos a lista de dentro do objeto retornado pelo seu Backend
  // Usamos um array vazio de fallback caso não existam dados
  const listaNotificacoes = data?.notifications || [];

  return (
    <div className="min-h-full bg-[#edf0f4] flex flex-col">
      {/* Conteúdo */}
      <div className="flex-1 px-10 py-8 flex flex-col gap-5">
        {listaNotificacoes.length > 0 ? (
          listaNotificacoes.map((n) => (
            <div
              key={n.id}
              className="flex items-center gap-6 bg-[#dde1e7] rounded-2xl px-8 py-6 
                         shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="shrink-0">
                <AlertIcon />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-[15px] leading-snug">
                   {/* Ajustado para o campo 'content' que vem do seu JSON */}
                   Notificação #{n.id}
                </p>
                <p className="font-bold text-slate-800 text-[13px] mt-1.5">
                  {n.content}
                </p>
                <p className="text-slate-500 text-[11px] mt-1 italic">
                  Recebido em: {new Date(n.created_at).toLocaleString('pt-AO')}
                </p>
              </div>

              {/* Botão de ação opcional */}
              <button
                className="shrink-0 bg-blue-600 hover:bg-blue-700 active:scale-95 
                           text-white text-[13px] font-bold px-6 py-2.5 rounded-full shadow-md transition-all"
              >
                Lida
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-slate-500">Nenhuma notificação nova.</p>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-[#0d1b3e] h-11 flex items-center justify-center mt-auto">
        <p className="text-white/40 text-[11px] font-semibold tracking-widest uppercase">
          © 2026 LocaTech – Informação Certa Combustível e Gás Sem Stress
        </p>
      </footer>
    </div>
  );
}