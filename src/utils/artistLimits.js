/**
 * Summary string for limits column: monthly / AI daily / images per artwork.
 * Used by Artist Approvals and Quota & limits views.
 */
export function getLimitsSummary(artist, backendLimits) {
  const m =
    artist.monthlyUploadLimit ?? backendLimits?.monthlyUpload ?? 10;
  const a =
    artist.aiDescriptionDailyLimit ?? backendLimits?.aiDescriptionDaily ?? 5;
  const i =
    artist.imageUploadLimit ?? backendLimits?.imageUpload ?? 2;
  return `${m} / ${a} / ${i}`;
}
