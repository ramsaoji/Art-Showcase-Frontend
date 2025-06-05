import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { trpc } from "../utils/trpc"; // Adjust path to your trpc setup
import { useAuth } from "../contexts/AuthContext";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { deleteImage } from "../config/cloudinary";
import { motion } from "framer-motion";
import Alert from "./Alert";

export default function ArtworkActions({ artworkId, onDelete }) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState(null);

  // tRPC utils for cache invalidation
  const utils = trpc.useContext();

  // Get artwork data for Cloudinary cleanup
  const { data: artwork } = trpc.getArtworkById.useQuery(
    { id: artworkId },
    {
      enabled: false, // Only fetch when needed for deletion
    }
  );

  // Delete mutation
  const deleteArtworkMutation = trpc.deleteArtwork.useMutation({
    onSuccess: (data) => {
      console.log("Artwork deleted successfully:", data.deletedId);

      // Call parent callback if provided
      if (onDelete) {
        onDelete(artworkId);
      }

      // Invalidate relevant queries to refresh the UI
      utils.getAllArtworks.invalidate();
      utils.getFeaturedArtworks.invalidate();

      setShowDeleteDialog(false);
      setError(null);
    },
    onError: (error) => {
      console.error("Error deleting artwork:", error);
      setError("Failed to delete artwork. Please try again.");
    },
  });

  if (!isAdmin) return null;

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
    setIsDeleting(true); // Start loading

    try {
      let artworkData = artwork;
      if (!artworkData) {
        artworkData = await utils.getArtworkById.fetch({ id: artworkId });
      }

      if (!artworkData) {
        throw new Error("Artwork not found");
      }

      const { cloudinary_public_id } = artworkData;

      if (cloudinary_public_id) {
        try {
          await deleteImage(cloudinary_public_id);
          console.log("Image deleted from Cloudinary successfully");
        } catch (cloudinaryError) {
          console.error(
            "Error deleting image from Cloudinary:",
            cloudinaryError
          );
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000)); // Optional delay

      await deleteArtworkMutation.mutateAsync({ id: artworkId });
    } catch (error) {
      console.error("Error in handleDelete:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete artwork. Please try again."
      );
    } finally {
      setIsDeleting(false); // End loading
    }
  };

  return (
    <>
      <div className="flex items-center space-x-3">
        <motion.button
          onClick={handleEdit}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center px-4 py-2 text-sm font-sans font-medium rounded-full bg-white/80 backdrop-blur-sm border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50/80 hover:border-indigo-200 shadow-sm transition-all duration-300"
          title="Edit artwork"
        >
          <PencilSquareIcon className="h-4 w-4 mr-1.5" />
          Edit
        </motion.button>
        <motion.button
          onClick={handleDeleteClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isDeleting}
          className="inline-flex items-center px-4 py-2 text-sm font-sans font-medium rounded-full bg-white/80 backdrop-blur-sm border-2 border-red-100 text-red-600 hover:bg-red-50/80 hover:border-red-200 shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete artwork"
        >
          <TrashIcon className="h-4 w-4 mr-1.5" />
          {isDeleting ? "Deleting..." : "Delete"}
        </motion.button>
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Artwork"
        isDeleting={isDeleting}
      />

      {error && <Alert type="error" message={error} className="mt-3" />}
    </>
  );
}
