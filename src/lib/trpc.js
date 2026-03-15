import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { NO_REFETCH_ON_FOCUS } from "./queryOptions";

/** tRPC React client — use this for all `.useQuery` / `.useMutation` hooks. */
export const trpc = createTRPCReact();

/** Normalised API base URL (trailing slashes stripped). */
export const baseUrl = (
  import.meta.env.VITE_API_URL || "http://localhost:3001/"
).replace(/\/+$/, "");

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: baseUrl + "/trpc",
      fetch(url, options = {}) {
        return fetch(url, {
          ...options,
          credentials: "include", // Enables sending 'HttpOnly' cookies
        });
      },
    }),
  ],
});

/**
 * Returns tRPC query result for a specific artist's usage stats (admin only).
 * @param {string} artistId - The artist's user ID.
 * @param {boolean} [enabled=true] - Whether the query should run.
 */
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
    { enabled: enabled && isValidArtistId, ...NO_REFETCH_ON_FOCUS }
  );
}

/**
 * Queries the public artist list (supports search + pagination).
 * @param {Object} params - Query parameters (search, limit, page).
 * @param {Object} [options={}] - Additional useQuery options.
 */
export function useArtistsSearch(params, options = {}) {
  return trpc.user.listArtistsPublic.useQuery(params, {
    ...NO_REFETCH_ON_FOCUS,
    ...options,
  });
}

export function useAssignableArtistsSearch(params, options = {}) {
  return trpc.user.listAssignableArtists.useQuery(params, {
    ...NO_REFETCH_ON_FOCUS,
    ...options,
  });
}

/**
 * Queries available artwork materials.
 * @param {Object} params - Query parameters.
 * @param {Object} [options={}] - Additional useQuery options.
 */
export function useMaterialsSearch(params, options = {}) {
  return trpc.artwork.getMaterials.useQuery(params, {
    ...NO_REFETCH_ON_FOCUS,
    ...options,
  });
}

/**
 * Queries available artwork styles.
 * @param {Object} params - Query parameters.
 * @param {Object} [options={}] - Additional useQuery options.
 */
export function useStylesSearch(params, options = {}) {
  return trpc.artwork.getStyles.useQuery(params, {
    ...NO_REFETCH_ON_FOCUS,
    ...options,
  });
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
  formData.append("overwrite", "false");

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

/**
 * Returns backend-configured global limits (monthlyUpload, aiDescriptionDaily, imageUpload).
 */
export function useBackendLimits() {
  return trpc.misc.getConfigLimits.useQuery(undefined, NO_REFETCH_ON_FOCUS);
}

/**
 * Returns the current user's remaining AI generation quota.
 * @param {Object} [options={}] - Additional useQuery options.
 */
export function useRemainingQuota(options = {}) {
  return trpc.misc.getRemainingQuota.useQuery(undefined, {
    ...NO_REFETCH_ON_FOCUS,
    ...options,
  });
}
