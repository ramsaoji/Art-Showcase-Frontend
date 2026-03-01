import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, AlertCircle, RefreshCw } from "lucide-react";

/**
 * ArtworkQuotaBanner
 * Renders persistent <Alert>-based quota status displays for the artwork form.
 * These are intentionally NOT sonner toasts because they must:
 *   (a) survive page renders and remain visible while the form is open
 *   (b) provide interactive retry buttons on fetch errors
 *   (c) show real-time numeric quota data inline within the form
 *
 * @param {object} props
 * @param {boolean} props.showArtistMonthlyBanner - Whether to render the artist monthly quota section
 * @param {boolean} props.loadingArtistQuota - Whether the artist quota is loading
 * @param {object|null} props.artistQuotaError - Error from the artist quota query, if any
 * @param {Function} props.refetchArtistQuota - Retry handler for artist quota fetch errors
 * @param {number} props.monthlyUploadCount - Artist's uploads used this month
 * @param {number} props.monthlyUploadLimit - Artist's monthly upload cap
 * @param {boolean} props.showAdminSelectedBanner - Whether to render the admin-selected-artist quota section
 * @param {boolean} props.loadingSelectedArtist - Whether the selected artist quota is loading
 * @param {object|null} props.selectedArtistError - Error from the selected artist query, if any
 * @param {string} props.selectedArtistName - Display name of the selected artist
 * @param {number} props.selectedArtistUploadCount - Selected artist's uploads used this month
 * @param {number} props.selectedArtistUploadLimit - Selected artist's monthly upload cap
 */
export default function ArtworkQuotaBanner({
  // Artist own quota
  showArtistMonthlyBanner,
  loadingArtistQuota,
  artistQuotaError,
  refetchArtistQuota,
  monthlyUploadCount,
  monthlyUploadLimit,
  // Admin selected artist quota
  showAdminSelectedBanner,
  loadingSelectedArtist,
  selectedArtistError,
  selectedArtistName,
  selectedArtistUploadCount,
  selectedArtistUploadLimit,
}) {
  return (
    <>
      {/* ── Artist's own monthly upload quota ─────────────────────────────── */}
      {showArtistMonthlyBanner && (
        <div className="my-4">
          {loadingArtistQuota ? (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="flex items-center gap-2 text-blue-700">
                <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
                Loading upload count...
              </AlertDescription>
            </Alert>
          ) : artistQuotaError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="flex justify-between items-center">
                <span>Failed to load upload count: {artistQuotaError.message}</span>
                <Button variant="outline" size="sm" onClick={refetchArtistQuota}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert
              variant={monthlyUploadCount >= monthlyUploadLimit ? "destructive" : "default"}
              className={
                monthlyUploadCount >= monthlyUploadLimit * 0.8 &&
                monthlyUploadCount < monthlyUploadLimit
                  ? "bg-amber-50 border-amber-200"
                  : ""
              }
            >
              <AlertDescription className="flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0" />
                {monthlyUploadCount >= monthlyUploadLimit
                  ? `Monthly upload limit reached (${monthlyUploadCount}/${monthlyUploadLimit}). You cannot upload more artwork this month.`
                  : monthlyUploadCount >= monthlyUploadLimit * 0.8
                  ? `Monthly upload count: ${monthlyUploadCount}/${monthlyUploadLimit}. You're approaching your limit.`
                  : `Monthly upload count: ${monthlyUploadCount}/${monthlyUploadLimit}`}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* ── Admin: selected artist's monthly quota ────────────────────────── */}
      {showAdminSelectedBanner && (
        <div className="my-4">
          {loadingSelectedArtist ? (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="flex items-center gap-2 text-blue-700">
                <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
                Loading {selectedArtistName}'s upload count...
              </AlertDescription>
            </Alert>
          ) : selectedArtistError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load {selectedArtistName}'s upload count:{" "}
                {selectedArtistError.message}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert
              variant={
                selectedArtistUploadCount >= selectedArtistUploadLimit
                  ? "destructive"
                  : "default"
              }
              className={
                selectedArtistUploadCount >= selectedArtistUploadLimit * 0.8 &&
                selectedArtistUploadCount < selectedArtistUploadLimit
                  ? "bg-amber-50 border-amber-200"
                  : ""
              }
            >
              <AlertDescription className="flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0" />
                {selectedArtistUploadCount >= selectedArtistUploadLimit
                  ? `${selectedArtistName}'s monthly upload limit reached (${selectedArtistUploadCount}/${selectedArtistUploadLimit}).`
                  : selectedArtistUploadCount >= selectedArtistUploadLimit * 0.8
                  ? `${selectedArtistName}'s monthly upload count: ${selectedArtistUploadCount}/${selectedArtistUploadLimit}. They're approaching their limit.`
                  : `${selectedArtistName}'s monthly upload count: ${selectedArtistUploadCount}/${selectedArtistUploadLimit}`}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </>
  );
}
