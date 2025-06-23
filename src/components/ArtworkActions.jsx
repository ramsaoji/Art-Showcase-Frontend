import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { trpc } from "../utils/trpc"; // Adjust path to your trpc setup
import { useAuth } from "../contexts/AuthContext";
import ConfirmationDialog from "./ConfirmationDialog";
import { motion } from "framer-motion";
import Alert from "./Alert";

export default function ArtworkActions({ artworkId, onDelete, artwork }) {
  const { isSuperAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState(artwork?.status || "ACTIVE");
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [error, setError] = useState(null);

  // tRPC utils for cache invalidation
  const utils = trpc.useContext();

  // Only show edit for artists if they own the artwork
  const isOwner = user && artwork && artwork.userId === user.id;
  if (!isSuperAdmin && !isOwner) return null;

  // Sync local status state with prop
  useEffect(() => {
    setStatus(artwork?.status || "ACTIVE");
  }, [artwork?.status]);

  // Delete mutation
  const deleteArtworkMutation = trpc.artwork.deleteArtwork.useMutation({
    onSuccess: (data) => {
      if (onDelete) onDelete(artworkId);
      utils.artwork.getAllArtworks.invalidate();
      utils.artwork.getFeaturedArtworks.invalidate();
      setShowDeleteDialog(false);
      setError(null);
    },
    onError: (error) => {
      setError("Failed to delete artwork. Please try again.");
    },
  });

  // Status update mutation
  const updateArtworkMutation = trpc.artwork.updateArtwork.useMutation({
    onSuccess: () => {
      utils.artwork.getAllArtworks.invalidate();
      utils.artwork.getFeaturedArtworks.invalidate();
      setIsStatusUpdating(false);
    },
    onError: (error) => {
      setError("Failed to update status. Please try again.");
      setIsStatusUpdating(false);
    },
  });

  const handleEdit = (e) => {
    e.stopPropagation();
    e.preventDefault();
    navigate(`/edit-artwork/${artworkId}`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await deleteArtworkMutation.mutateAsync({ id: artworkId });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete artwork. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setIsStatusUpdating(true);
    setError(null);
    try {
      let payload = {
        id: artworkId,
        status: newStatus,
      };
      // If changing from expired to active/inactive, update expiresAt to 1 month from now
      const isExpired =
        artwork.status === "EXPIRED" ||
        (artwork.expiresAt && new Date(artwork.expiresAt) < new Date());
      if ((newStatus === "ACTIVE" || newStatus === "INACTIVE") && isExpired) {
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        payload.expiresAt = oneMonthFromNow.toISOString();
      }
      console.log("Artwork status update payload:", payload);
      await updateArtworkMutation.mutateAsync(payload);
    } catch (err) {
      setError("Failed to update status. Please try again.");
    } finally {
      setIsStatusUpdating(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end sm:justify-start flex-wrap gap-2">
        {/* Edit button: super admin or artist owner */}
        {(isSuperAdmin || isOwner) && (
          <motion.button
            onClick={handleEdit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-sans font-medium rounded-full bg-white/80 backdrop-blur-sm border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50/80 hover:border-indigo-200 shadow-sm transition-all duration-300"
            title="Edit artwork"
          >
            <PencilSquareIcon className="h-4 w-4 mr-1.5" />
            Edit
          </motion.button>
        )}
        {/* Status dropdown: super admin only */}
        {isSuperAdmin && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative inline-flex items-center align-middle"
          >
            <div className="relative flex items-center">
              <select
                value={status}
                onChange={handleStatusChange}
                disabled={isStatusUpdating}
                className="appearance-none inline-flex min-w-[95px] items-center px-3 sm:px-4 py-1.5 sm:py-2 pr-8 sm:pr-12 text-xs sm:text-sm font-sans font-medium rounded-full bg-white/80 backdrop-blur-sm border-2 border-yellow-100 text-yellow-700 hover:bg-yellow-50/80 hover:border-yellow-200 shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300 cursor-pointer"
                title="Change artwork status"
              >
                <option value="ACTIVE" className="font-sans text-sm">
                  Active
                </option>
                <option value="INACTIVE" className="font-sans text-sm">
                  Inactive
                </option>
                <option value="EXPIRED" className="font-sans text-sm">
                  Expired
                </option>
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-yellow-700">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </div>
          </motion.div>
        )}
        {/* Delete button: super admin only */}
        {isSuperAdmin && (
          <motion.button
            onClick={handleDeleteClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isDeleting}
            className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-sans font-medium rounded-full bg-white/80 backdrop-blur-sm border-2 border-red-100 text-red-600 hover:bg-red-50/80 hover:border-red-200 shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete artwork"
          >
            <TrashIcon className="h-4 w-4 mr-1.5" />
            {isDeleting ? "Deleting..." : "Delete"}
          </motion.button>
        )}
      </div>

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        dialogTitle={`Delete ${artwork.title}`}
        description={
          "Are you sure you want to delete this artwork? This action cannot be undone."
        }
        buttonText={"Delete Artwork"}
        isDeleting={isDeleting}
      />

      {error && <Alert type="error" message={error} className="mt-3" />}
    </>
  );
}
