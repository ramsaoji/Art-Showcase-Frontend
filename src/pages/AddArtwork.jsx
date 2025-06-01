import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { uploadImage } from "../config/cloudinary";
import ArtworkForm from "../components/ArtworkForm";

export default function AddArtwork() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    try {
      // Handle image upload
      const imageFile = formData.get("image");
      let imageUrl = null;
      let publicId = null;

      if (imageFile) {
        try {
          // Upload to Cloudinary
          const uploadResult = await uploadImage(imageFile);
          imageUrl = uploadResult.url;
          publicId = uploadResult.public_id;

          console.log("Upload completed:", uploadResult);
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }
      }

      // Log all form data
      for (let [key, value] of formData.entries()) {
        console.log(`Form data: ${key} = ${value}`);
      }

      // Create artwork document in Firestore
      const artworkData = {
        title: formData.get("title"),
        artist: formData.get("artist"),
        price: parseFloat(formData.get("price")),
        description: formData.get("description"),
        dimensions: formData.get("dimensions"),
        material: formData.get("material"),
        style: formData.get("style"),
        year: parseInt(formData.get("year")),
        featured: formData.get("featured") === "true",
        sold: formData.get("sold") === "true",
        url: imageUrl,
        cloudinary_public_id: publicId,
        createdAt: serverTimestamp(),
      };

      console.log("Saving artwork data:", artworkData);

      // Add to Firestore
      const docRef = await addDoc(collection(db, "artworks"), artworkData);
      console.log("Document written with ID:", docRef.id);

      // Get the saved document to verify
      const savedDocSnap = await getDoc(docRef);
      if (savedDocSnap.exists()) {
        console.log("Saved document data:", savedDocSnap.data());
      }

      // Navigate to the gallery page
      navigate("/gallery");
    } catch (err) {
      console.error("Error saving artwork:", err);
      setError(err.message || "Failed to save artwork. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Add New Artwork
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the details below to add a new artwork to your gallery.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <ArtworkForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
