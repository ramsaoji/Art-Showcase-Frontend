import { useState, useEffect } from "react";
import { trpc } from "../../utils/trpc";
import Alert from "../../components/Alert";
import Loader from "../../components/ui/Loader";
import DeleteConfirmationDialog from "../../components/DeleteConfirmationDialog";

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
    },
    onError: (err) => setError(err.message),
  });

  // Activate/deactivate mutation
  const setActiveMutation = trpc.user.setUserActive.useMutation({
    onSuccess: () => {
      setSuccess("Status updated!");
      refetch();
      utils.user.listUsers.invalidate();
    },
    onError: (err) => setError(err.message),
  });

  // Delete user mutation
  const deleteUserMutation = trpc.user.deleteUser.useMutation({
    onSuccess: () => {
      setSuccess("User deleted successfully!");
      refetch();
      utils.user.listUsers.invalidate();
    },
    onError: (err) => setError(err.message),
  });

  // State for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

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
      setError(err.message || "Failed to delete user");
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleApprove = (id) => {
    setError("");
    setSuccess("");
    approveMutation.mutate({ id });
  };

  const handleSetActive = (id, active) => {
    setError("");
    setSuccess("");
    setActiveMutation.mutate({ id, active });
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans">
      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 font-artistic text-center tracking-tight text-gray-900">
        Artist Management
      </h2>
      <p className="max-w-2xl mx-auto mb-8 text-center text-base sm:text-lg text-gray-500 font-sans">
        Approve new artists, manage their status, and keep your creative
        community thriving.
      </p>
      {/* Search Control Only */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 items-stretch sm:items-center justify-between w-full">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full sm:w-80 px-5 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 font-sans placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all duration-200 outline-none hover:border-indigo-200"
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
      <div className="bg-white/90 shadow-xl rounded-2xl p-3 sm:p-6 md:p-8 font-sans border border-gray-100">
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
                    <th className="py-3 px-4 font-sans text-gray-700 text-sm font-semibold whitespace-nowrap">
                      Artist Name
                    </th>
                    <th className="font-sans text-gray-700 text-sm font-semibold whitespace-nowrap">
                      Email
                    </th>
                    <th className="font-sans text-gray-700 text-sm font-semibold whitespace-nowrap">
                      Artworks
                    </th>
                    <th className="font-sans text-gray-700 text-sm font-semibold whitespace-nowrap">
                      Active
                    </th>
                    <th className="font-sans text-gray-700 text-sm font-semibold whitespace-nowrap">
                      Approved
                    </th>
                    <th className="font-sans text-gray-700 text-sm font-semibold whitespace-nowrap">
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
                          className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <td className="py-3 px-4 font-sans align-middle rounded-l-xl text-gray-900 font-medium whitespace-nowrap max-w-[180px] truncate">
                            {artist.artistName}
                          </td>
                          <td className="font-sans align-middle text-gray-700 whitespace-nowrap max-w-[200px] truncate">
                            {artist.email}
                          </td>
                          <td className="font-sans align-middle text-gray-700 text-center">
                            {artist.artworksCount ?? 0}
                          </td>
                          <td className="font-sans align-middle">
                            <span
                              className={`px-2.5 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold font-sans align-middle inline-block ${
                                artist.active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {artist.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="font-sans align-middle">
                            <span
                              className={`px-2.5 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold font-sans align-middle inline-block ${
                                artist.approved
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {artist.approved ? "Approved" : "Pending"}
                            </span>
                          </td>
                          <td className="font-sans align-middle rounded-r-xl">
                            <div className="flex flex-wrap gap-2">
                              {!artist.approved && (
                                <button
                                  className="px-2 py-1.5 sm:px-4 sm:py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-sans transition-all duration-200 focus:ring-2 focus:ring-green-300 border-none outline-none shadow-sm hover:shadow-md text-xs sm:text-sm"
                                  onClick={() => handleApprove(artist.id)}
                                  disabled={approveMutation.isLoading}
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                className={`px-2 py-1.5 sm:px-4 sm:py-1.5 rounded-lg font-sans transition-all duration-200 focus:ring-2 focus:ring-indigo-300 border-none outline-none shadow-sm hover:shadow-md text-xs sm:text-sm ${
                                  artist.active
                                    ? "bg-amber-300 text-amber-900 hover:bg-amber-400"
                                    : "bg-green-500 text-white hover:bg-green-600"
                                }`}
                                onClick={() =>
                                  handleSetActive(artist.id, !artist.active)
                                }
                                disabled={setActiveMutation.isLoading}
                              >
                                {artist.active ? "Deactivate" : "Activate"}
                              </button>
                              {canDelete && (
                                <button
                                  className="px-2 py-1.5 sm:px-4 sm:py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-sans transition-all duration-200 focus:ring-2 focus:ring-red-300 border-none outline-none shadow-sm hover:shadow-md text-xs sm:text-sm"
                                  onClick={() => handleDeleteUserClick(artist)}
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
                  className="flex-shrink-0 px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-gray-100 text-gray-700 font-sans font-medium hover:bg-gray-200 transition-all duration-200 border-none outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm min-w-[64px] sm:min-w-[90px] text-sm sm:text-base"
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
                        className={`flex-shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-sans font-medium transition-all duration-200 border-none outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm min-w-[36px] sm:min-w-[44px] text-sm sm:text-base ${
                          p === page
                            ? "bg-indigo-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-indigo-50"
                        }`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>
                <button
                  className="flex-shrink-0 px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-gray-100 text-gray-700 font-sans font-medium hover:bg-gray-200 transition-all duration-200 border-none outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm min-w-[64px] sm:min-w-[90px] text-sm sm:text-base"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-gray-400 font-sans text-center py-16 text-lg">
            No artists found.
          </div>
        )}
      </div>
      {/* Delete Confirmation Dialog for User */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDeleteUser}
        title={
          userToDelete ? userToDelete.artistName || userToDelete.email : "User"
        }
        isDeleting={isDeletingUser}
      />
    </div>
  );
}
