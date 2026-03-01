import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import Alert from "@/components/common/Alert";
import Loader from "@/components/common/Loader";
import ArtistLimitsModal from "@/features/artist-limits";
import { getFriendlyErrorMessage } from "@/utils/formatters";
import { useBackendLimits } from "@/lib/trpc";
import { getLimitsSummary } from "@/features/artist-limits/utils/artistLimits";
import { ADMIN_LIST_QUERY_OPTIONS } from "@/lib/queryOptions";
import SectionHeader from "@/components/common/SectionHeader";
import SearchBar from "@/components/common/SearchBar";
import ResultCount from "@/components/common/ResultCount";
import Pagination from "@/components/common/Pagination";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

/**
 * ArtistQuotaLimits page — admin view for reviewing and editing per-artist
 * upload and AI quota limits. Uses sonner toast-free inline Alert for feedback (S4).
 */
export default function ArtistQuotaLimits() {
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const utils = trpc.useContext();

  const {
    data: userPage,
    refetch,
    isLoading,
    isFetching,
  } = trpc.user.listUsers.useQuery(
    { page, limit, search },
    ADMIN_LIST_QUERY_OPTIONS
  );

  const allUsers = userPage?.users || [];
  const totalPages = userPage?.totalPages || 1;
  const { data: backendLimits } = useBackendLimits();

  useEffect(() => setPage(1), [search]);

  const [limitsDialogOpen, setLimitsDialogOpen] = useState(false);
  const [limitsDialogUser, setLimitsDialogUser] = useState(null);
  const [limitsForm, setLimitsForm] = useState({
    monthlyUploadLimit: "",
    aiDescriptionDailyLimit: "",
    imageUploadLimit: "",
  });
  const [isSavingLimits, setIsSavingLimits] = useState(false);

  const updateUserMutation = trpc.user.updateUser.useMutation({
    onSuccess: () => {
      toast.success("Artist limits updated.");
      setLimitsDialogOpen(false);
      setLimitsDialogUser(null);
      refetch();
      utils.user.listUsers.invalidate();
    },
    onError: (err) => setError(getFriendlyErrorMessage(err)),
  });

  const openLimitsDialog = useCallback(
    (user) => {
      setError("");
      setLimitsDialogUser(user);
      const defaultMonthly = backendLimits?.monthlyUpload ?? 10;
      const defaultAi = backendLimits?.aiDescriptionDaily ?? 5;
      const defaultImage = backendLimits?.imageUpload ?? 2;
      setLimitsForm({
        monthlyUploadLimit:
          user.monthlyUploadLimit != null
            ? String(user.monthlyUploadLimit)
            : String(defaultMonthly),
        aiDescriptionDailyLimit:
          user.aiDescriptionDailyLimit != null
            ? String(user.aiDescriptionDailyLimit)
            : String(defaultAi),
        imageUploadLimit:
          user.imageUploadLimit != null
            ? String(user.imageUploadLimit)
            : String(defaultImage),
      });
      setLimitsDialogOpen(true);
    },
    [backendLimits]
  );

  const closeLimitsDialog = useCallback(() => {
    setLimitsDialogOpen(false);
    setLimitsDialogUser(null);
  }, []);

  const handleResetLimitsToDefaults = useCallback(() => {
    setLimitsForm({
      monthlyUploadLimit: String(backendLimits?.monthlyUpload ?? 10),
      aiDescriptionDailyLimit: String(backendLimits?.aiDescriptionDaily ?? 5),
      imageUploadLimit: String(backendLimits?.imageUpload ?? 2),
    });
  }, [backendLimits]);

  const handleSaveLimits = useCallback(async () => {
    if (!limitsDialogUser) return;
    setIsSavingLimits(true);
    setError("");
    try {
      await updateUserMutation.mutateAsync({
        id: limitsDialogUser.id,
        monthlyUploadLimit:
          limitsForm.monthlyUploadLimit === ""
            ? null
            : Math.max(1, Math.min(1000, Number(limitsForm.monthlyUploadLimit))),
        aiDescriptionDailyLimit:
          limitsForm.aiDescriptionDailyLimit === ""
            ? null
            : Math.max(
                1,
                Math.min(100, Number(limitsForm.aiDescriptionDailyLimit))
              ),
        imageUploadLimit:
          limitsForm.imageUploadLimit === ""
            ? null
            : Math.max(
                1,
                Math.min(1000, Number(limitsForm.imageUploadLimit))
              ),
      });
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsSavingLimits(false);
    }
  }, [limitsDialogUser, limitsForm, updateUserMutation]);

  const handleSearchChange = useCallback((e) => setSearch(e.target.value), []);
  const handlePreviousPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const handleNextPage = useCallback(
    (totalPages) => setPage((p) => Math.min(totalPages, p + 1)),
    []
  );

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 2500);
      return () => clearTimeout(t);
    }
  }, [error]);

  const artistUsers = useMemo(
    () => allUsers.filter((u) => u.role === "ARTIST"),
    [allUsers]
  );
  const artistTotalCount = userPage?.artistTotalCount || 0;

  return (
    <>
      <SectionHeader
        title="Quota & limits"
        description="View and edit per-artist upload and AI limits. Changes apply to all artworks for that artist."
      />
      <SearchBar
        value={search}
        onChange={handleSearchChange}
        placeholder="Search by name or email..."
      />

      {error && (
        <Alert type="error" message={error} className="mb-4 items-center font-sans" />
      )}

      {isLoading || isFetching ? (
        <div className="flex justify-center py-16">
          <Loader size="medium" />
        </div>
      ) : artistUsers.length > 0 ? (
        <>
          <ResultCount count={artistUsers.length} total={artistTotalCount} label="artists" />
          <div className="w-full overflow-x-auto rounded-xl custom-scrollbar">
            <table className="min-w-[500px] w-full text-left font-sans border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="px-4 py-3 font-sans text-gray-700 text-sm font-semibold whitespace-nowrap text-left">
                    Artist Name
                  </th>
                  <th className="px-4 py-3 font-sans text-gray-700 text-sm font-semibold whitespace-nowrap text-left">
                    Email
                  </th>
                  <th className="px-4 py-3 font-sans text-gray-700 text-sm font-semibold whitespace-nowrap text-left" title="Monthly upload / AI daily / Images per artwork">
                    Limits
                  </th>
                  <th className="px-6 py-3 font-sans text-gray-700 text-sm font-semibold whitespace-nowrap text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {artistUsers.map((artist) => (
                  <tr
                    key={artist.id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-white/20"
                  >
                    <td
                      className="px-4 py-3 font-sans align-middle text-gray-900 font-medium whitespace-nowrap max-w-[180px] truncate text-left"
                      title={artist.artistName}
                    >
                      {artist.artistName}
                    </td>
                    <td
                      className="px-4 py-3 font-sans align-middle text-gray-700 whitespace-nowrap max-w-[200px] truncate text-left"
                      title={artist.email}
                    >
                      {artist.email}
                    </td>
                    <td className="px-4 py-3 font-sans align-middle text-left">
                      <span
                        className="text-sm text-gray-600 font-mono tabular-nums"
                        title="Monthly / AI daily / Images per artwork"
                      >
                        {getLimitsSummary(artist, backendLimits)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans align-middle text-left">
                      <Button
                        size="sm"
                        onClick={() => openLimitsDialog(artist)}
                        title="Edit quota & limits"
                      >
                        Edit limits
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState
          title="No artists found"
          description="No artists match your search. Try a different query or check the Approvals tab for pending artists."
        />
      )}

      <ArtistLimitsModal
        isOpen={limitsDialogOpen}
        onClose={closeLimitsDialog}
        user={limitsDialogUser}
        formValues={limitsForm}
        onFormChange={setLimitsForm}
        onSave={handleSaveLimits}
        onResetToDefaults={handleResetLimitsToDefaults}
        isSaving={isSavingLimits}
      />
    </>
  );
}
