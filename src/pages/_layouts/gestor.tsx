import { Outlet } from "react-router-dom";
import { SidebarGestor } from "../app/dashboard/sidebar/SidebarGestor"; 
import { NavBar } from "./header"; 

export function GestorLayout() {
  return (
    // Contentor principal em azul escuro (#001140)
    <div className="flex min-h-screen bg-[#001140] overflow-hidden">
      
      {/* Sidebar Lateral à esquerda no azul - Mantém-se fixa */}
      <SidebarGestor />

      <div className="flex-1 flex flex-col">
        
        {/* NavBar Superior no fundo azul */}
        <NavBar />

        {/* ÁREA DE CONTEÚDO TOTALMENTE BRANCA E RECTA */}
        {/* Removido o 'rounded' para que o conteúdo preencha as quinas perfeitamente */}
        <main className="flex-1 bg-white p-10 overflow-y-auto">
          {/* O background aqui será 100% branco e sem curvas, ocupando o espaço todo */}
          <Outlet /> 
        </main>

        {/* Footer no azul escuro, colado à base do conteúdo branco */}
        <footer className="py-4 text-center bg-[#001140]">
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">
            © 2026 LOCATECH – INFORMAÇÃO CERTA COMBUSTÍVEL E GÁS SEM STRESS
          </p>
        </footer>
      </div>
    </div>
  );
}