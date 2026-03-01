import { useMemo } from "react";
import { trpc, useBackendLimits, useRemainingQuota } from "@/lib/trpc";

/**
 * Encapsulates all quota-related data fetching and computation for the artwork form.
 *
 * For artists: fetches their own monthly upload + AI description quotas.
 * For admins (add mode): fetches the selected artist's usage stats when an artist is chosen.
 * For admins (edit mode): usage stats are fetched lazily via raw fetch in the orchestrator
 *   (because TRPC query requires the artistId at hook call time; edit mode derives it from initialData).
 *
 * @param {object} params
 * @param {boolean} params.isArtist - True if current user is an artist (not admin).
 * @param {boolean} params.isSuperAdmin - True if current user is a super admin.
 * @param {object|null} params.initialData - Existing artwork (edit mode) or null (create mode).
 * @param {string} params.artistId - Selected artist ID (admin create mode only).
 * @returns {object} Normalized quota data for UI consumption.
 */
export function useArtworkQuota({ isArtist, isSuperAdmin, initialData, artistId }) {
  // ─── Backend configuration limits ────────────────────────────────────────
  const { data: backendLimits, isLoading: loadingBackendLimits } = useBackendLimits();

  // ─── Artist own quota (AI + monthly uploads) ──────────────────────────────
  const {
    data: artistQuotaData,
    isLoading: loadingArtistQuota,
    error: artistQuotaError,
    refetch: refetchArtistQuota,
  } = useRemainingQuota({ enabled: isArtist });

  // ─── Admin: selected artist's stats (add mode only) ───────────────────────
  const shouldFetchSelectedArtist = Boolean(
    isSuperAdmin && !initialData && artistId && artistId.trim() !== ""
  );

  const {
    data: selectedArtistData,
    isLoading: loadingSelectedArtist,
    error: selectedArtistError,
  } = trpc.artwork.getArtistUsageStats.useQuery(
    { artistId: artistId?.trim() || "" },
    {
      enabled: shouldFetchSelectedArtist,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000,
    }
  );

  // ─── Derived values ────────────────────────────────────────────────────────
  const aiLimit = artistQuotaData?.ai?.limit ?? backendLimits?.aiDescriptionDaily;
  const aiRemaining = artistQuotaData?.ai?.remaining ?? aiLimit;

  const monthlyUploadCount = artistQuotaData?.monthlyUploads?.used ?? 0;
  const monthlyUploadLimit =
    artistQuotaData?.monthlyUploads?.limit ??
    backendLimits?.monthlyUpload ??
    10;

  // Only show artist monthly count for non-admin artists in create mode
  const showArtistMonthlyBanner = isArtist && !isSuperAdmin && !initialData;

  // Admin selected artist data (add mode)
  const selectedArtistUploadCount = selectedArtistData?.monthlyUploadCount ?? 0;
  const selectedArtistUploadLimit = selectedArtistData?.monthlyUploadLimit ?? 10;
  const selectedArtistName = selectedArtistData?.artistName ?? "Selected Artist";
  const selectedArtistAiLimit = selectedArtistData?.aiDescriptionDailyLimit ?? 5;
  const imageUploadLimit = isArtist
    ? (artistQuotaData?.imageUploadLimit ?? backendLimits?.imageUpload ?? 1)
    : (selectedArtistData?.imageUploadLimit ?? backendLimits?.imageUpload ?? 1);

  return {
    // Backend config
    backendLimits,
    loadingBackendLimits,

    // Artist own quota
    aiLimit,
    aiRemaining,
    monthlyUploadCount,
    monthlyUploadLimit,
    loadingArtistQuota,
    artistQuotaError,
    refetchArtistQuota,
    showArtistMonthlyBanner,

    // Admin-selected artist quota
    selectedArtistData,
    selectedArtistUploadCount,
    selectedArtistUploadLimit,
    selectedArtistName,
    selectedArtistAiLimit,
    loadingSelectedArtist,
    selectedArtistError,
    shouldFetchSelectedArtist,
    imageUploadLimit,
  };
}
