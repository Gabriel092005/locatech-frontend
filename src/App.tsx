import { RouterProvider } from 'react-router-dom'
import './global.css'
import { router } from './routes'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/react-query'
import { ThemeProvider } from './components/theme/theme-provider'
import { useEffect } from 'react' // Adicionado para inicializar as animações

// Importação do AOS
import AOS from 'aos';
import 'aos/dist/aos.css';

export function App() {
  
  // Inicializa as animações assim que o App carrega
  useEffect(() => {
    AOS.init({
      duration: 1000, // Duração de 1 segundo
      once: true,     // Anima apenas na primeira vez que aparece no scroll
      easing: 'ease-out-cubic', // Movimento mais suave e profissional
    });
  }, []);

  return (
    <HelmetProvider>
      {/* Ajustei o título para LocaTech conforme o seu projeto */}
      <Helmet titleTemplate='%s | LocaTech' defaultTitle="LocaTech" />
      
      {/* Este Toaster global já cuida de todas as páginas! */}
      <Toaster richColors position="top-center" />

      <ThemeProvider storageKey="vite-ui-theme" defaultTheme="light">
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  )
}