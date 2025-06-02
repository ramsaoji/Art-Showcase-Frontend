import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { deleteImage } from "../config/cloudinary";
import { motion } from "framer-motion";
import Alert from "./Alert";

export default function ArtworkActions({ artworkId, onDelete }) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState(null);

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
    setIsDeleting(true);
    setError(null);
    try {
      // First, get the artwork document to get the Cloudinary public_id
      const artworkDoc = await getDoc(doc(db, "artworks", artworkId));
      if (!artworkDoc.exists()) {
        throw new Error("Artwork not found");
      }

      const { cloudinary_public_id } = artworkDoc.data();

      // Delete the image from Cloudinary if public_id exists
      if (cloudinary_public_id) {
        try {
          await deleteImage(cloudinary_public_id);
          console.log("Image deleted from Cloudinary successfully");
        } catch (cloudinaryError) {
          console.error(
            "Error deleting image from Cloudinary:",
            cloudinaryError
          );
          // Continue with Firestore deletion even if Cloudinary deletion fails
        }
      }

      // Add a small delay to show the progress animation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Delete the document from Firestore
      await deleteDoc(doc(db, "artworks", artworkId));

      if (onDelete) {
        onDelete(artworkId);
      }
    } catch (error) {
      console.error("Error deleting artwork:", error);
      setError("Failed to delete artwork. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
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
