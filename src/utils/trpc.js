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
export function useMonthlyUploadCount(enabled = true) {
  return trpc.useQuery(["artwork.getMonthlyUploadCount"], {
    enabled: enabled,
  });
}

// Helper for getting a specific artist's monthly upload count (for admins)
export function useArtistMonthlyUploadCount(artistId, enabled = true) {
  // Extra validation to prevent any invalid values
  const isValidArtistId =
    artistId &&
    typeof artistId === "string" &&
    artistId.trim() !== "" &&
    artistId.length > 0;

  // Only create the query if we have a valid artistId
  if (!isValidArtistId) {
    return {
      data: undefined,
      isLoading: false,
      error: undefined,
      refetch: () => {},
    };
  }

  return trpc.useQuery(
    ["artwork.getArtistMonthlyUploadCount", { artistId: artistId.trim() }],
    {
      enabled: enabled && isValidArtistId,
    }
  );
}

// Artists search (infinite scroll, search)
export function useArtistsSearch(params, options = {}) {
  return trpc.user.listArtistsPublic.useQuery(params, options);
}

// Materials search (infinite scroll, search)
export function useMaterialsSearch(params, options = {}) {
  return trpc.artwork.getMaterials.useQuery(params, options);
}

// Styles search (infinite scroll, search)
export function useStylesSearch(params, options = {}) {
  return trpc.artwork.getStyles.useQuery(params, options);
}
