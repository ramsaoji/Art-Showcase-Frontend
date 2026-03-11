import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["web-vitals"],
  },
  build: {
    // Raise warning threshold slightly — firebase and exceljs are intentionally large
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // Firebase (authentication, firestore, storage, etc.)
          if (id.includes("firebase")) return "firebase-vendor";

          // React router — separate from react core
          if (
            id.includes("react-router") ||
            id.includes("@remix-run/router")
          )
            return "react-router";

          // React core (react + react-dom)
          if (id.includes("react-dom") || id.includes("/react/"))
            return "react-core";

          // Drag-and-drop / sortable
          if (
            id.includes("sortablejs") ||
            id.includes("@dnd-kit") ||
            id.includes("sortable")
          )
            return "sortable";

          // UI primitives
          if (
            id.includes("@headlessui") ||
            id.includes("@heroicons") ||
            id.includes("framer-motion") ||
            id.includes("@radix-ui") ||
            id.includes("lucide-react") ||
            id.includes("sonner") ||
            id.includes("react-image-crop") ||
            id.includes("react-datepicker")
          )
            return "ui-vendor";

          // Data-fetching
          if (
            id.includes("@tanstack/react-query") ||
            id.includes("@trpc/client") ||
            id.includes("@trpc/react-query")
          )
            return "query-vendor";

          // Excel export
          if (id.includes("exceljs") || id.includes("file-saver") || id.includes("xlsx"))
            return "excel-vendor";

          // Let Rollup handle all other node_modules automatically
          // (do NOT add a catch-all here — it causes circular chunk warnings)
        },
      },
    },
    sourcemap: false,
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
