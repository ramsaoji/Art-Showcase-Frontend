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
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) return "firebase-vendor";
            if (id.includes("react")) return "react-vendor";
            if (
              id.includes("@headlessui") ||
              id.includes("@heroicons") ||
              id.includes("framer-motion")
            )
              return "ui-vendor";
            if (
              id.includes("@tanstack/react-query") ||
              id.includes("@trpc/client") ||
              id.includes("@trpc/react-query")
            )
              return "query-vendor";
          }
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
