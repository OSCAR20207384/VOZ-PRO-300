
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Definición crítica para compatibilidad de process.env en el navegador
    'process.env': {
      NODE_ENV: JSON.stringify('production'),
      API_KEY: JSON.stringify(process.env.API_KEY || '')
    },
    'global': 'window'
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true
  }
});
