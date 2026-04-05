import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ADICIONA ESTE BLOCO AQUI:
  server: {
    port: 5000, 
    strictPort: true, // Opcional: Se a porta 5000 estiver ocupada, o Vite falha em vez de tentar a 5001
    host: true,       // Opcional: Permite que o projeto seja acessível pela rede local (IP)
  },
  build: {
    chunkSizeWarningLimit: 2000,
  }
})
