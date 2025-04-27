// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/luxium-dapp/',   // <--- THIS IS THE MOST IMPORTANT PART
  plugins: [react()],
});