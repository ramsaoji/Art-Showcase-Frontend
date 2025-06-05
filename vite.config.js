import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { splitVendorChunkPlugin } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), splitVendorChunkPlugin()],
  optimizeDeps: {
    exclude: ["web-vitals"],
  },
  build: {
    // Enable chunk size warnings at 500kb
    chunkSizeWarningLimit: 500,
    // Optimize chunks
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "framer-motion",
            "@headlessui/react",
            "@heroicons/react",
          ],
          "firebase-vendor": ["firebase", "react-firebase-hooks"],
          "query-vendor": [
            "@tanstack/react-query",
            "@trpc/client",
            "@trpc/react-query",
          ],
        },
      },
    },
    // Enable source maps for production
    sourcemap: true,
    // Enable minification
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
