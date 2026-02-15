import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { trpc } from "../../utils/trpc";
import Alert from "../../components/Alert";
import Loader from "../../components/ui/Loader";
import ArtistLimitsModal from "../../components/ArtistLimitsModal";
import { getFriendlyErrorMessage } from "../../utils/formatters";
import { useBackendLimits } from "../../utils/trpc";
import { getLimitsSummary } from "../../utils/artistLimits";
import { ADMIN_LIST_QUERY_OPTIONS } from "../../utils/queryOptions";

const emptyStateMotion = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 },
};

export default function ArtistQuotaLimits() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
      setSuccess("Artist limits updated.");
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
      setSuccess("");
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
    if (success || error) {
      const t = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  const artistUsers = useMemo(
    () => allUsers.filter((u) => u.role === "ARTIST"),
    [allUsers]
  );
  const artistTotalCount = userPage?.artistTotalCount || 0;

  return (
    <>
      <div className="font-sans w-full mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          Quota & limits
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          View and edit per-artist upload and AI limits. Changes apply to all
          artworks for that artist.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 items-stretch sm:items-center justify-between w-full">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name or email..."
          className="w-full sm:w-80 px-5 py-3 rounded-xl bg-white border border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder-gray-400 text-gray-900 font-sans"
        />
      </div>

      {error && (
        <Alert type="error" message={error} className="mb-4 items-center font-sans" />
      )}
      {success && (
        <Alert type="success" message={success} className="mb-4 items-center font-sans" />
      )}

      {isLoading || isFetching ? (
        <div className="flex justify-center py-16">
          <Loader size="medium" />
        </div>
      ) : artistUsers.length > 0 ? (
        <>
          <div className="mb-4 text-sm text-gray-500 font-sans text-right">
            Showing{" "}
            <span className="font-semibold text-gray-900">{artistUsers.length}</span> of{" "}
            <span className="font-semibold text-gray-900">{artistTotalCount}</span> artists
          </div>
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
                      <button
                        type="button"
                        className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-sans text-sm font-semibold transition-all duration-200 border-none outline-none shadow-sm hover:shadow-md focus:ring-2 focus:ring-indigo-300"
                        onClick={() => openLimitsDialog(artist)}
                        title="Edit quota & limits"
                      >
                        Edit limits
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls - server-side, same as Approvals */}
          <div className="w-full mt-8">
            <div className="flex flex-nowrap justify-center sm:justify-between items-center gap-2 sm:gap-4 min-w-0">
              <button
                type="button"
                className="flex-shrink-0 px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-sans font-medium hover:from-gray-200 hover:to-gray-300 transition-all duration-200 border-none outline-none shadow-sm min-w-[64px] sm:min-w-[90px] text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handlePreviousPage}
                disabled={page === 1}
              >
                Previous
              </button>
              <div className="flex flex-nowrap gap-2 overflow-x-auto min-w-0 hide-scrollbar py-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`flex-shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-sans font-medium transition-all duration-200 border-none outline-none shadow-sm min-w-[36px] sm:min-w-[44px] text-sm sm:text-base ${
                      p === page
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md"
                        : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-indigo-50 hover:to-indigo-100"
                    }`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="flex-shrink-0 px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-sans font-medium hover:from-gray-200 hover:to-gray-300 transition-all duration-200 border-none outline-none shadow-sm min-w-[64px] sm:min-w-[90px] text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleNextPage(totalPages)}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <motion.div
          {...emptyStateMotion}
          className="text-center py-16 px-4 rounded-2xl bg-white/60 border border-gray-100"
        >
          <h3 className="mt-4 font-artistic text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
            No artists found
          </h3>
          <p className="mt-4 text-lg text-gray-500 font-sans">
            No artists match your search. Try a different query or check the
            Approvals tab for pending artists.
          </p>
        </motion.div>
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
