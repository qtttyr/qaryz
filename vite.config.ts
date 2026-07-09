import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      registerType: "autoUpdate",
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ["Q.png"],
      manifest: {
        id: "/",
        start_url: "/",
        name: "Qaryz - Учёт долгов",
        short_name: "Qaryz",
        description: "Современное приложение для учёта долгов и совместных расходов",
        theme_color: "#101214",
        background_color: "#101214",
        display: "standalone",
        icons: [
          {
            src: "Q.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "Q.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "Q.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
