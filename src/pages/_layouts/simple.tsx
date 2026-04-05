import { Outlet } from 'react-router-dom'
import { NavBar } from './header' 
// Adicione o import do seu Footer aqui (exemplo abaixo)
// import { Footer } from './footer' 

export function SimpleLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <NavBar /> 
      
      <main className="flex-1">
        <Outlet /> 
      </main>

      {/* Adicione o Footer aqui para ele aparecer na página Sobre */}
      <footer className="bg-[#0a1931] py-6 text-center text-white text-[10px] tracking-widest uppercase">
        @ 2026 LOCATECH - INFORMAÇÃO CERTA COMBUSTÍVEL E GÁS SEM STRESS
      </footer>
    </div>
  )
}