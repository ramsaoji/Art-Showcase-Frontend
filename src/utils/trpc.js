import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact();

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: import.meta.env.VITE_API_URL || "http://localhost:3001/trpc",
      fetch(url, options = {}) {
        // Inject JWT token from localStorage
        const token = localStorage.getItem("token");
        const headers = new Headers(options.headers || {});
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        return fetch(url, { ...options, headers });
      },
    }),
  ],
});

// Helper for monthly upload count
export function useMonthlyUploadCount() {
  return trpc.useQuery(["artwork.getMonthlyUploadCount"]);
}

// Artists search (infinite scroll, search)
export function useArtistsSearch(params) {
  return trpc.user.listArtistsPublic.useQuery(params);
}

// Materials search (infinite scroll, search)
export function useMaterialsSearch(params) {
  return trpc.artwork.getMaterials.useQuery(params);
}

// Styles search (infinite scroll, search)
export function useStylesSearch(params) {
  return trpc.artwork.getStyles.useQuery(params);
}
