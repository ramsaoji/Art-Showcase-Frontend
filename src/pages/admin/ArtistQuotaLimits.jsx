import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import Alert from "@/components/common/Alert";

import AdminTableSkeleton from "@/components/skeletons/AdminTableSkeleton";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    onError: (err) => {
      const msg = getFriendlyErrorMessage(err);
      setError(msg);
      toast.error(msg);
    },
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

      {isLoading ? (
        <AdminTableSkeleton />
      ) : artistUsers.length > 0 ? (
        <>
          <ResultCount count={artistUsers.length} total={artistTotalCount} label="artists" />
          <div className="w-full bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-4">
            <div className="w-full overflow-x-auto custom-scrollbar">
              <Table className="min-w-[600px] w-full text-left font-sans">
                <TableHeader className="bg-gray-50/80 border-b border-gray-100">
                  <TableRow className="hover:bg-transparent border-0">
                    <TableHead className="px-5 py-4 font-sans text-gray-700 text-[13px] font-semibold whitespace-nowrap text-left">
                      Artist Name
                    </TableHead>
                    <TableHead className="px-5 py-4 font-sans text-gray-700 text-[13px] font-semibold whitespace-nowrap text-left">
                      Email
                    </TableHead>
                    <TableHead className="px-5 py-4 font-sans text-gray-700 text-[13px] font-semibold whitespace-nowrap text-left" title="Monthly upload / AI daily / Images per artwork">
                      Limits
                    </TableHead>
                    <TableHead className="px-5 py-4 font-sans text-gray-700 text-[13px] font-semibold whitespace-nowrap text-left">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {artistUsers.map((artist) => (
                    <TableRow
                      key={artist.id}
                      className="group border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200"
                    >
                      <TableCell
                        className="px-5 py-4 font-sans align-middle text-gray-900 font-medium whitespace-nowrap max-w-[180px] truncate text-left"
                        title={artist.artistName}
                      >
                        {artist.artistName}
                      </TableCell>
                      <TableCell
                        className="px-5 py-4 font-sans align-middle text-gray-600 whitespace-nowrap max-w-[200px] truncate text-left group-hover:text-gray-900 transition-colors"
                        title={artist.email}
                      >
                        {artist.email}
                      </TableCell>
                      <TableCell className="px-5 py-4 font-sans align-middle text-left">
                        <span
                          className="text-sm text-gray-700 font-mono tabular-nums font-medium"
                          title="Monthly / AI daily / Images per artwork"
                        >
                          {getLimitsSummary(artist, backendLimits)}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 font-sans align-middle text-left">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openLimitsDialog(artist)}
                          title="Edit quota & limits"
                          className="font-medium text-xs bg-white text-gray-700 border-gray-300 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
                        >
                          Edit limits
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
