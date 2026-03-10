import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import Loader from "@/components/common/Loader";
import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import { getFriendlyErrorMessage } from "@/utils/formatters";
import { ADMIN_LIST_QUERY_OPTIONS } from "@/lib/queryOptions";
import SectionHeader from "@/components/common/SectionHeader";
import SearchBar from "@/components/common/SearchBar";
import ResultCount from "@/components/common/ResultCount";
import Pagination from "@/components/common/Pagination";
import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
/**
 * ArtistApprovals Page
 * Admin view for reviewing, approving, activating, and removing artist accounts.
 * Uses sonner toast for all user-triggered feedback (S4).
 */
export default function ArtistApprovals() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [search, setSearch] = useState("");
  const utils = trpc.useContext();

  // Fetch paginated users
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

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Approve mutation
  const approveMutation = trpc.user.approveArtist.useMutation({
    onSuccess: () => {
      toast.success("Artist approved!");
      refetch();
      utils.user.listUsers.invalidate();
      utils.user.listArtistsPublic.invalidate();
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  });

  // Activate/deactivate mutation
  const setActiveMutation = trpc.user.setUserActive.useMutation({
    onSuccess: () => {
      toast.success("Status updated!");
      refetch();
      utils.user.listUsers.invalidate();
      utils.artwork.getAllArtworks.invalidate();
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  });

  // Delete user mutation
  const deleteUserMutation = trpc.user.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully!");
      refetch();
      utils.user.listUsers.invalidate();
      utils.user.listArtistsPublic.invalidate();
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  });

  // State for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // State for activate/deactivate dialog
  const [activeDialogOpen, setActiveDialogOpen] = useState(false);
  const [activeDialogUser, setActiveDialogUser] = useState(null);
  const [activeDialogAction, setActiveDialogAction] = useState(null); // 'activate' or 'deactivate'
  const [isSettingActive, setIsSettingActive] = useState(false);

  // Memoized handlers (rerender-functional-setstate)
  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
  }, []);

  const handlePreviousPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const handleNextPage = useCallback((totalPages) => {
    setPage((p) => Math.min(totalPages, p + 1));
  }, []);

  // Handler to open delete dialog
  const handleDeleteUserClick = useCallback((user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  }, []);

  // Handler to confirm delete
  const handleConfirmDeleteUser = useCallback(async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await deleteUserMutation.mutateAsync({ id: userToDelete.id });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsDeletingUser(false);
    }
  }, [userToDelete, deleteUserMutation]);

  const handleApprove = useCallback((id) => {
    approveMutation.mutate({ id });
  }, [approveMutation]);

  const handleSetActive = useCallback((id, active, user) => {
    // If activating, directly call the mutation without confirmation dialog
    if (active) {
      setActiveMutation.mutate({ id, active: true });
    } else {
      // Only show confirmation dialog for deactivate actions
      setActiveDialogUser(user);
      setActiveDialogAction("deactivate");
      setActiveDialogOpen(true);
    }
  }, [setActiveMutation]);

  const confirmSetActive = useCallback(async () => {
    if (!activeDialogUser) return;
    setIsSettingActive(true);
    try {
      await setActiveMutation.mutateAsync({
        id: activeDialogUser.id,
        active: activeDialogAction === "activate",
      });
      setActiveDialogOpen(false);
      setActiveDialogUser(null);
      setActiveDialogAction(null);
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsSettingActive(false);
    }
  }, [activeDialogUser, activeDialogAction, setActiveMutation]);

  // Memoize filtered artists to avoid recalculating on every render (js-cache-function-results)
  const artistUsers = useMemo(
    () => allUsers.filter((u) => u.role === "ARTIST"),
    [allUsers]
  );
  const artistTotalCount = userPage?.artistTotalCount || 0;

  return (
    <>
      <SectionHeader
        title="Manage Artist Approvals"
        description="Review, approve, activate, or remove artists. Use the search to find artists by name or email. Only approved and active artists can submit artworks."
      />
      <SearchBar
        value={search}
        onChange={handleSearchChange}
        placeholder="Search by name or email..."
      />
      {isLoading || isFetching ? (
        <div className="flex justify-center py-16">
          <Loader size="medium" />
        </div>
      ) : artistUsers.length > 0 ? (
        <>
          <ResultCount count={artistUsers.length} total={artistTotalCount} label="artists" />
          <div className="w-full bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-4">
            <div className="w-full overflow-x-auto custom-scrollbar">
              <Table className="min-w-[700px] w-full text-left font-sans">
                <TableHeader className="bg-gray-50/80 border-b border-gray-100">
                  <TableRow className="hover:bg-transparent border-0">
                    <TableHead className="px-5 py-4 font-sans text-gray-700 text-[13px] font-semibold whitespace-nowrap text-left">
                      Artist Name
                    </TableHead>
                    <TableHead className="px-5 py-4 font-sans text-gray-700 text-[13px] font-semibold whitespace-nowrap text-left">
                      Email
                    </TableHead>
                    <TableHead className="px-5 py-4 font-sans text-gray-700 text-[13px] font-semibold whitespace-nowrap text-center">
                      Artworks
                    </TableHead>
                    <TableHead className="px-5 py-4 font-sans text-gray-700 text-[13px] font-semibold whitespace-nowrap text-center">
                      Email Verified
                    </TableHead>
                    <TableHead className="px-5 py-4 font-sans text-gray-700 text-[13px] font-semibold whitespace-nowrap text-left">
                      Active
                    </TableHead>
                    <TableHead className="px-5 py-4 font-sans text-gray-700 text-[13px] font-semibold whitespace-nowrap text-left">
                      Approved
                    </TableHead>
                    <TableHead className="px-5 py-4 font-sans text-gray-700 text-[13px] font-semibold whitespace-nowrap text-left">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {artistUsers.map((artist) => {
                      const canDelete = (artist.artworksCount ?? 0) === 0;

                      return (
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
                          <TableCell className="px-5 py-4 font-sans align-middle text-gray-700 text-center font-medium">
                            {artist.artworksCount ?? 0}
                          </TableCell>
                          <TableCell className="px-5 py-4 font-sans align-middle text-center">
                            <Badge variant={artist.emailVerified ? "success" : "destructive"}>
                              {artist.emailVerified ? "Verified" : "Not Verified"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-4 font-sans align-middle text-left">
                            <Badge variant={artist.active ? "success" : "destructive"}>
                              {artist.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-4 font-sans align-middle text-left">
                            <Badge variant={artist.approved ? "default" : "warning"}>
                              {artist.approved ? "Approved" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-4 font-sans align-middle whitespace-normal min-w-[120px] text-left">
                            <div className="flex items-center gap-2 justify-start">
                              {artist.emailVerified && !artist.approved && (
                                <button
                                  className="min-w-[100px] px-3 py-1.5 sm:px-3 sm:py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-sans font-medium transition-all duration-200 border-none outline-none shadow-sm text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => handleApprove(artist.id)}
                                  disabled={approveMutation.isLoading}
                                >
                                  Approve
                                </button>
                              )}
                              {artist.emailVerified && (
                                <button
                                  className={`min-w-[100px] px-3 py-1.5 sm:px-3 sm:py-1.5 rounded-md font-sans font-medium transition-all duration-200 border-none outline-none shadow-sm text-xs disabled:opacity-50 disabled:cursor-not-allowed ${
                                    artist.active
                                      ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                      : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  }`}
                                  onClick={() => handleSetActive(artist.id, !artist.active, artist)}
                                  disabled={setActiveMutation.isLoading}
                                >
                                  {artist.active ? "Deactivate" : "Activate"}
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  className="min-w-[100px] px-3 py-1.5 sm:px-3 sm:py-1.5 bg-rose-100 text-rose-700 rounded-md hover:bg-rose-200 font-sans font-medium transition-all duration-200 border-none outline-none shadow-sm text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => handleDeleteUserClick(artist)}
                                  disabled={deleteUserMutation.isLoading || isDeletingUser}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState
          title="No artists found"
          description="There are currently no artists to manage. New artists will appear here when they sign up."
        />
      )}
      {deleteDialogOpen && userToDelete && (
        <ConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setUserToDelete(null);
            setDeleteDialogOpen(false);
          }}
          onConfirm={handleConfirmDeleteUser}
          dialogTitle={`Delete ${
            userToDelete.artistName || userToDelete.email
          }`}
          description={
            "Are you sure you want to delete this artist? This action cannot be undone."
          }
          buttonText={"Delete Artist"}
          loadingText={"Deleting artist..."}
          isDeleting={isDeletingUser}
        />
      )}
      {activeDialogOpen && activeDialogUser && (
        <ConfirmationDialog
          isOpen={activeDialogOpen}
          onClose={() => {
            setActiveDialogUser(null);
            setActiveDialogAction(null);
            setActiveDialogOpen(false);
          }}
          onConfirm={confirmSetActive}
          dialogTitle={`${
            activeDialogAction === "activate" ? "Activate" : "Deactivate"
          } ${activeDialogUser.artistName || activeDialogUser.email}`}
          isDeleting={isSettingActive}
          description={
            activeDialogAction === "activate"
              ? "Are you sure you want to activate this artist? All their non-expired artworks will become active and visible."
              : "Are you sure you want to deactivate this artist? All their non-expired artworks will become inactive and hidden."
          }
          buttonText={
            activeDialogAction === "activate"
              ? "Activate Artist"
              : "Deactivate Artist"
          }
          loadingText={
            activeDialogAction === "activate"
              ? "Activating artist..."
              : "Deactivating artist..."
          }
        />
      )}
    </>
  );
}
