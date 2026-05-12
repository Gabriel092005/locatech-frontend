import { Outlet } from "react-router-dom";
import { NavBar } from "./header";
import { SidebarUnified } from "../app/dashboard/sidebar/SidebarUnified";
import { SensorProvider } from "./gestor"; // Importando o provedor que contém a lógica de áudio e socket

/**
 * Layout principal do painel de administração.
 * Estrutura: [Sidebar | Navbar + Conteúdo]
 */
export function AppLayoutAdmin() {
  return (
    <SensorProvider>
      <div className="flex h-screen w-full overflow-hidden bg-[#0d1b3e] text-white antialiased">

        {/* ── Sidebar fixa à esquerda ── */}
        <aside className="hidden md:flex w-[260px] h-full shrink-0 flex-col ">
          <SidebarUnified />
        </aside>

        {/* ── Área de conteúdo ── */}
        <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">

          {/* Barra de navegação superior */}
          <NavBar />

          {/* Página renderizada pelo router */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <Outlet />
          </main>

        </div>
      </div>
    </SensorProvider>
  );
}