import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { uploadImage } from "../config/cloudinary";
import ArtworkForm from "../components/ArtworkForm";

export default function EditArtwork() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadArtwork = async () => {
      try {
        const docRef = doc(db, "artworks", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setArtwork({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Artwork not found");
        }
      } catch (error) {
        console.error("Error loading artwork:", error);
        setError("Failed to load artwork");
      } finally {
        setLoading(false);
      }
    };

    loadArtwork();
  }, [id]);

  const handleSubmit = async (formData) => {
    try {
      // Handle image upload if a new image is provided
      const imageFile = formData.get("image");
      let imageUrl = artwork.url;
      let publicId = artwork.cloudinary_public_id;

      if (imageFile) {
        try {
          // Upload to Cloudinary
          const uploadResult = await uploadImage(imageFile);
          imageUrl = uploadResult.url;
          publicId = uploadResult.public_id;
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }
      }

      // Update artwork document in Firestore
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
        url: imageUrl,
        cloudinary_public_id: publicId,
        updatedAt: new Date(),
      };

      const docRef = doc(db, "artworks", id);
      await updateDoc(docRef, artworkData);

      // Navigate back to the gallery
      navigate("/gallery");
    } catch (error) {
      console.error("Error updating artwork:", error);
      setError("Failed to update artwork");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Artwork</h1>
      <ArtworkForm onSubmit={handleSubmit} initialData={artwork} />
    </div>
  );
}
