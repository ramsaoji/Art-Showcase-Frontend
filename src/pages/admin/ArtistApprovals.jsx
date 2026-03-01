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
          <div className="w-full overflow-x-auto rounded-xl custom-scrollbar">
            <table className="min-w-[600px] w-full text-left font-sans border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="px-4 py-3 font-sans text-gray-700 text-sm font-semibold whitespace-nowrap text-left">
                    Artist Name
                  </th>
                  <th className="px-4 py-3 font-sans text-gray-700 text-sm font-semibold whitespace-nowrap text-left">
                    Email
                  </th>
                  <th className="px-4 py-3 font-sans text-gray-700 text-sm font-semibold whitespace-nowrap text-center">
                    Artworks
                  </th>
                  <th className="px-4 py-3 font-sans text-gray-700 text-sm font-semibold whitespace-nowrap text-center">
                    Email Verified
                  </th>
                  <th className="px-6 py-3 font-sans text-gray-700 text-sm font-semibold whitespace-nowrap text-left">
                    Active
                  </th>
                  <th className="px-6 py-3 font-sans text-gray-700 text-sm font-semibold whitespace-nowrap text-left">
                    Approved
                  </th>
                  <th className="px-6 py-3 font-sans text-gray-700 text-sm font-semibold whitespace-nowrap text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {artistUsers.map((artist) => {
                    const canDelete = (artist.artworksCount ?? 0) === 0;

                    return (
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
                        <td className="px-4 py-3 font-sans align-middle text-gray-700 text-center">
                          {artist.artworksCount ?? 0}
                        </td>
                        <td className="px-4 py-3 font-sans align-middle text-center">
                          <Badge variant={artist.emailVerified ? "success" : "destructive"}>
                            {artist.emailVerified ? "Verified" : "Not Verified"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-sans align-middle text-left">
                          <Badge variant={artist.active ? "success" : "destructive"}>
                            {artist.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-sans align-middle text-left">
                          <Badge variant={artist.approved ? "default" : "warning"}>
                            {artist.approved ? "Approved" : "Pending"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-sans align-middle whitespace-normal min-w-[120px] text-left">
                          <div className="flex items-center gap-2 justify-start">
                            {artist.emailVerified && !artist.approved && (
                              <button
                                className="min-w-[110px] px-4 py-1.5 sm:px-4 sm:py-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800 font-sans font-semibold transition-all duration-200 border-none outline-none shadow-sm hover:shadow-md text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleApprove(artist.id)}
                                disabled={approveMutation.isLoading}
                              >
                                Approve
                              </button>
                            )}
                            {artist.emailVerified && (
                              <button
                                className={`min-w-[110px] px-4 py-1.5 sm:px-4 sm:py-1.5 rounded-lg font-sans font-semibold transition-all duration-200 border-none outline-none shadow-sm hover:shadow-md text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                                  artist.active
                                    ? "bg-gradient-to-r from-amber-300 to-amber-400 text-amber-900 hover:from-amber-400 hover:to-amber-500"
                                    : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                                }`}
                                onClick={() => handleSetActive(artist.id, !artist.active, artist)}
                                disabled={setActiveMutation.isLoading}
                              >
                                {artist.active ? "Deactivate" : "Activate"}
                              </button>
                            )}
                            {canDelete && (
                              <button
                                className="min-w-[110px] px-4 py-1.5 sm:px-4 sm:py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-sans font-semibold transition-all duration-200 border-none outline-none shadow-sm hover:shadow-md text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleDeleteUserClick(artist)}
                                disabled={deleteUserMutation.isLoading || isDeletingUser}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
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
