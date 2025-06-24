import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact();

// Normalize base URL (remove trailing slashes)
export const baseUrl = (
  import.meta.env.VITE_API_URL || "http://localhost:3001/"
).replace(/\/+$/, "");

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: baseUrl + "/trpc",
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

// Helper for getting a specific artist's usage stats (for admins)
export function useArtistUsageStats(artistId, enabled = true) {
  const isValidArtistId =
    artistId &&
    typeof artistId === "string" &&
    artistId.trim() !== "" &&
    artistId.length > 0;

  if (!isValidArtistId) {
    return {
      data: undefined,
      isLoading: false,
      error: undefined,
      refetch: () => {},
    };
  }

  return trpc.useQuery(
    ["artwork.getArtistUsageStats", { artistId: artistId.trim() }],
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

/**
 * Utility to upload an image file directly to Cloudinary using a backend-provided signature
 */
export async function uploadToCloudinary(file) {
  // Get signature from backend via tRPC client
  const { signature, timestamp, apiKey, cloudName, folder } =
    await trpcClient.misc.getCloudinarySignature.query();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );
  if (!res.ok) throw new Error("Cloudinary upload failed");
  return await res.json(); // contains secure_url, public_id, etc.
}

// Helper for backend config limits (tRPC)
export function useBackendLimits() {
  return trpc.misc.getConfigLimits.useQuery();
}

// Helper for remaining AI quota (tRPC)
export function useRemainingQuota(options = {}) {
  return trpc.misc.getRemainingQuota.useQuery(undefined, options);
}
