// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://guillermojaume.dev',
  markdown: {
    shikiConfig: {
      // Fondo oscuro neutro, a juego con el tema zinc de la web
      theme: 'vitesse-dark',
    },
  },
  vite: {
    plugins: [tailwindcss()]
  }
});