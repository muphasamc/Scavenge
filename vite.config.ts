import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Para GitHub Pages:
  // - Si REPO_NAME está vacío (repositorio de usuario), usa '/'
  // - Si REPO_NAME tiene valor (proyecto), usa '/nombre-del-repo/'
  // - En desarrollo local (sin REPO_NAME), usa './' para paths relativos
  base: process.env.REPO_NAME !== undefined 
    ? process.env.REPO_NAME === '' 
      ? '/' 
      : `/${process.env.REPO_NAME}/`
    : './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})