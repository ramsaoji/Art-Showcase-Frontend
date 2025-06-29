import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { trpc } from "../../utils/trpc";
import Alert from "../../components/Alert";
import Loader from "../../components/ui/Loader";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import { getFriendlyErrorMessage } from "../../utils/formatters";

export default function ArtistApprovals() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // You can make this adjustable if desired
  const [search, setSearch] = useState("");
  const utils = trpc.useContext();

  // Fetch paginated users
  const {
    data: userPage,
    refetch,
    isLoading,
    isFetching,
  } = trpc.user.listUsers.useQuery({ page, limit, search });

  const allUsers = userPage?.users || [];
  const totalPages = userPage?.totalPages || 1;

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Approve mutation
  const approveMutation = trpc.user.approveArtist.useMutation({
    onSuccess: () => {
      setSuccess("Artist approved!");
      refetch();
      utils.user.listUsers.invalidate();
      utils.user.listArtistsPublic.invalidate();
    },
    onError: (err) => setError(getFriendlyErrorMessage(err)),
  });

  // Activate/deactivate mutation
  const setActiveMutation = trpc.user.setUserActive.useMutation({
    onSuccess: () => {
      setSuccess("Status updated!");
      refetch();
      utils.user.listUsers.invalidate();
      utils.artwork.getAllArtworks.invalidate();
    },
    onError: (err) => setError(getFriendlyErrorMessage(err)),
  });

  // Delete user mutation
  const deleteUserMutation = trpc.user.deleteUser.useMutation({
    onSuccess: () => {
      setSuccess("User deleted successfully!");
      refetch();
      utils.user.listUsers.invalidate();
      utils.user.listArtistsPublic.invalidate();
    },
    onError: (err) => setError(getFriendlyErrorMessage(err)),
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

  // Handler to open delete dialog
  const handleDeleteUserClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
    setError("");
    setSuccess("");
  };

  // Handler to confirm delete
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    setError("");
    setSuccess("");
    try {
      await deleteUserMutation.mutateAsync({ id: userToDelete.id });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleApprove = (id) => {
    setError("");
    setSuccess("");
    approveMutation.mutate({ id });
  };

  const handleSetActive = (id, active, user) => {
    setError("");
    setSuccess("");

    // If activating, directly call the mutation without confirmation dialog
    if (active) {
      setActiveMutation.mutate({ id, active: true });
    } else {
      // Only show confirmation dialog for deactivate actions
      setActiveDialogUser(user);
      setActiveDialogAction("deactivate");
      setActiveDialogOpen(true);
    }
  };

  const confirmSetActive = async () => {
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
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsSettingActive(false);
    }
  };

  // Auto-clear success and error messages after 2.5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const artistUsers = allUsers.filter((u) => u.role === "ARTIST");
  const artistTotalCount = userPage?.artistTotalCount || 0;

  return (
    <div className="relative min-h-screen bg-white/50">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-96 left-1/2 transform -translate-x-1/2">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-500/10 via-indigo-600/10 to-indigo-700/10 blur-3xl" />
        </div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
          <div className="w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/8 via-indigo-600/8 to-indigo-700/8 blur-3xl" />
        </div>
        <div className="absolute left-0 bottom-0">
          <div className="w-96 h-96 rounded-full bg-gradient-to-tr from-indigo-400/8 via-indigo-500/8 to-indigo-600/8 blur-3xl" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative container mx-auto px-4 sm:px-8 py-12"
      >
        <div className="text-center mb-12">
          <h2 className="text-5xl lg:text-6xl font-bold mb-4 font-artistic text-center tracking-wide text-gray-900 leading-[1.1] py-2">
            Artist Management
          </h2>
          <p className="text-lg sm:text-xl font-sans text-gray-600 leading-relaxed">
            Approve new artists, manage their status, and keep your creative
            community thriving.
          </p>
        </div>
        {/* Search Control Only */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 items-stretch sm:items-center justify-between w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full sm:w-80 px-5 py-3 rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm text-gray-900 font-sans placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all duration-200 outline-none hover:border-indigo-200"
            style={{ boxShadow: "0 2px 12px 0 rgba(80, 80, 180, 0.04)" }}
          />
        </div>
        {error && (
          <Alert
            type="error"
            message={error}
            className="mb-4 items-center font-sans"
          />
        )}
        {success && (
          <Alert
            type="success"
            message={success}
            className="mb-4 items-center font-sans"
          />
        )}
        <div className="bg-white/90 backdrop-blur-xl shadow-xl rounded-2xl p-3 sm:p-6 md:p-8 font-sans border border-white/20 ring-1 ring-white/10">
          {isLoading || isFetching ? (
            <div className="flex justify-center py-16">
              <Loader size="medium" />
            </div>
          ) : allUsers &&
            allUsers.filter((u) => u.role === "ARTIST").length > 0 ? (
            <>
              <div className="mb-4 text-sm text-gray-500 font-sans text-right">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {artistUsers.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {artistTotalCount}
                </span>{" "}
                artists
              </div>
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
                    {allUsers
                      .filter((u) => u.role === "ARTIST")
                      .map((artist) => {
                        // Check if artist has artworks (by userId)
                        // We'll use a derived property if available, else fallback to 0
                        // If artworks count is not available, you may need to fetch it per user (not ideal for large lists)
                        // For now, assume userPage includes artworksCount per user, else always show delete if not present
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
                            <td className="px-4 py-3 font-sans align-middle text-left">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold font-sans align-middle inline-block ${
                                    artist.active
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {artist.active ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-sans align-middle text-left">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold font-sans align-middle inline-block ${
                                    artist.approved
                                      ? "bg-indigo-100 text-indigo-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {artist.approved ? "Approved" : "Pending"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-sans align-middle whitespace-normal min-w-[120px] text-left">
                              <div className="flex items-center gap-2 justify-start">
                                {!artist.approved && (
                                  <button
                                    className="min-w-[90px] px-2 py-1.5 sm:px-4 sm:py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-sans transition-all duration-200 border-none outline-none shadow-sm hover:shadow-md text-xs sm:text-sm font-semibold"
                                    onClick={() => handleApprove(artist.id)}
                                    disabled={approveMutation.isLoading}
                                  >
                                    Approve
                                  </button>
                                )}
                                <button
                                  className={`min-w-[90px] px-2 py-1.5 sm:px-4 sm:py-1.5 rounded-lg font-sans font-semibold transition-all duration-200 border-none outline-none shadow-sm hover:shadow-md text-xs sm:text-sm ${
                                    artist.active
                                      ? "bg-gradient-to-r from-amber-300 to-amber-400 text-amber-900 hover:from-amber-400 hover:to-amber-500"
                                      : "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
                                  }`}
                                  onClick={() =>
                                    handleSetActive(
                                      artist.id,
                                      !artist.active,
                                      artist
                                    )
                                  }
                                  disabled={setActiveMutation.isLoading}
                                >
                                  {artist.active ? "Deactivate" : "Activate"}
                                </button>
                                {canDelete && (
                                  <button
                                    className="min-w-[90px] px-2 py-1.5 sm:px-4 sm:py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-sans font-semibold transition-all duration-200 border-none outline-none shadow-sm hover:shadow-md text-xs sm:text-sm"
                                    onClick={() =>
                                      handleDeleteUserClick(artist)
                                    }
                                    disabled={
                                      deleteUserMutation.isLoading ||
                                      isDeletingUser
                                    }
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
              {/* Pagination Controls */}
              <div className="w-full mt-8">
                <div className="flex flex-nowrap justify-center sm:justify-between items-center gap-2 sm:gap-4 min-w-0">
                  <button
                    className="flex-shrink-0 px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-sans font-medium hover:from-gray-200 hover:to-gray-300 transition-all duration-200 border-none outline-none shadow-sm min-w-[64px] sm:min-w-[90px] text-sm sm:text-base"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <div className="flex flex-nowrap gap-2 overflow-x-auto min-w-0 hide-scrollbar py-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          className={`flex-shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-sans font-medium transition-all duration-200 border-none outline-none shadow-sm min-w-[36px] sm:min-w-[44px] text-sm sm:text-base ${
                            p === page
                              ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md"
                              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-indigo-50 hover:to-indigo-100"
                          }`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    className="flex-shrink-0 px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-sans font-medium hover:from-gray-200 hover:to-gray-300 transition-all duration-200 border-none outline-none shadow-sm min-w-[64px] sm:min-w-[90px] text-sm sm:text-base"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <motion.div
              className="text-center py-10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="mt-4 font-artistic text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                No artists found
              </h3>
              <p className="mt-4 text-lg text-gray-500 font-sans">
                There are currently no artists to manage. New artists will
                appear here when they sign up.
              </p>
            </motion.div>
          )}
        </div>
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
      </motion.div>
    </div>
  );
}
