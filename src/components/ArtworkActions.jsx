import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { deleteImage } from "../config/cloudinary";

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
      <div className="flex items-center space-x-2">
        <button
          onClick={handleEdit}
          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          title="Edit artwork"
        >
          <PencilSquareIcon className="h-4 w-4 mr-1" />
          Edit
        </button>
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Delete artwork"
        >
          <TrashIcon className="h-4 w-4 mr-1" />
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Artwork"
      />

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </>
  );
}
