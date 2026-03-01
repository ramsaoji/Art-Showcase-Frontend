import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PencilSquareIcon from "@heroicons/react/24/outline/PencilSquareIcon";
import TrashIcon from "@heroicons/react/24/outline/TrashIcon";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import { motion } from "framer-motion";
import Alert from "@/components/common/Alert";
import { getFriendlyErrorMessage } from "@/utils/formatters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const buttonVariants = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
};

/**
 * ArtworkActions component — renders edit, status-change, and delete controls
 * for artworks. Visible only to the owner artist or super admins.
 * @param {string} artworkId - ID of the artwork.
 * @param {Function} [onDelete] - Callback invoked after a successful deletion.
 * @param {Object} artwork - Full artwork object from the API.
 */
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
  const isOwner = user && artwork && artwork?.userId === user.id;
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
      setError(getFriendlyErrorMessage(error));
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
      setError(getFriendlyErrorMessage(error));
      setIsStatusUpdating(false);
    },
  });

  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    navigate(`/edit-artwork/${artworkId}`);
  }, [navigate, artworkId]);

  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDeleteDialog(true);
  }, []);

  const handleDelete = useCallback(async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await deleteArtworkMutation.mutateAsync({ id: artworkId });
    } catch (error) {
      setError(getFriendlyErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteArtworkMutation, artworkId]);

  // Handle status change
  const handleStatusChange = useCallback(async (newStatus) => {
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
        artwork?.status === "EXPIRED" ||
        (artwork?.expiresAt && new Date(artwork.expiresAt) < new Date());
      if ((newStatus === "ACTIVE" || newStatus === "INACTIVE") && isExpired) {
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        payload.expiresAt = oneMonthFromNow.toISOString();
      }

      await updateArtworkMutation.mutateAsync(payload);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsStatusUpdating(false);
    }
  }, [artwork?.status, artwork?.expiresAt, artworkId, updateArtworkMutation]);

  return (
    <>
      <div className="flex items-center justify-end sm:justify-start flex-wrap gap-2">
        {/* Edit button: super admin or artist owner */}
        {(isSuperAdmin || isOwner) && (
          <motion.button
            onClick={handleEdit}
            {...buttonVariants}
            className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-sans font-medium rounded-xl bg-white/80 backdrop-blur-sm border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50/80 hover:border-indigo-200 shadow-sm transition-all duration-300"
            title="Edit artwork"
          >
            <PencilSquareIcon className="h-4 w-4 mr-1.5" />
            Edit
          </motion.button>
        )}
        {/* Status dropdown: super admin only */}
        {isSuperAdmin && (
          <Select
            value={status}
            onValueChange={handleStatusChange}
            disabled={isStatusUpdating}
          >
            <SelectTrigger
              className="min-w-[100px] h-auto px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-sans font-medium rounded-xl bg-white/80 backdrop-blur-sm border-2 border-yellow-100 text-yellow-700 hover:bg-yellow-50/80 hover:border-yellow-200 shadow-sm transition-all duration-300 [&>svg]:text-yellow-700 [&>svg]:shrink-0 [&>svg]:ml-1"
              title="Change artwork status"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>
        )}
        {/* Delete button: super admin only */}
        {isSuperAdmin && (
          <motion.button
            onClick={handleDeleteClick}
            {...buttonVariants}
            disabled={isDeleting}
            className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-sans font-medium rounded-xl bg-white/80 backdrop-blur-sm border-2 border-red-100 text-red-600 hover:bg-red-50/80 hover:border-red-200 shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
        dialogTitle={`Delete ${artwork?.title}`}
        description={
          "Are you sure you want to delete this artwork? This action cannot be undone."
        }
        buttonText={"Delete Artwork"}
        isDeleting={isDeleting}
      />

      {error && (
        <div className="my-4">
          <Alert type="error" message={error} />
        </div>
      )}
    </>
  );
}
