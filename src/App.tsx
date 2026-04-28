import { RouterProvider } from 'react-router-dom'
import './global.css'
import { router } from './routes'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/react-query'
import { ThemeProvider } from './components/theme/theme-provider'
import { useEffect } from 'react'
import { SensorProvider } from './context/SensorContext'

import AOS from 'aos';
import 'aos/dist/aos.css';

export function App() {
  
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,     
      easing: 'ease-out-cubic',
    });
  }, []);

  return (
    <HelmetProvider>
      <Helmet titleTemplate='%s | LocaTech' defaultTitle="LocaTech" />
      <Toaster richColors position="top-center" />

      <ThemeProvider storageKey="vite-ui-theme" defaultTheme="light">
        <QueryClientProvider client={queryClient}>
          {/* O SensorProvider deve envolver o RouterProvider para os dados serem globais */}
          <SensorProvider> 
            <RouterProvider router={router} />
          </SensorProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  )
}