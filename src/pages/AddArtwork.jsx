import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadImage } from "../config/cloudinary";
import ArtworkForm from "../components/ArtworkForm";
import { motion } from "framer-motion";
import { trpc } from "../utils/trpc";
import { useAuth } from "../contexts/AuthContext";

export default function AddArtwork() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [error, setError] = useState(null);
  const [artistId, setArtistId] = useState("");

  // Fetch all artists for admin
  const { data, isLoading: loadingArtists } = trpc.user.listUsers.useQuery(
    undefined,
    { enabled: isSuperAdmin }
  );

  const artists = (
    data?.users?.filter((u) => u.role === "ARTIST") || []
  ).filter((a) => a.approved && a.active);

  // Find the selected artist object (for super admin)
  const selectedArtist =
    isSuperAdmin && artistId ? artists.find((a) => a.id === artistId) : null;

  // tRPC utils for cache invalidation
  const utils = trpc.useContext();

  // Add tRPC mutation
  const createArtworkMutation = trpc.artwork.createArtwork.useMutation({
    onSuccess: () => {
      console.log("Artwork created successfully");

      // Invalidate relevant queries to refresh the UI
      utils.artwork.getAllArtworks.invalidate();
      utils.artwork.getFeaturedArtworks.invalidate();

      navigate("/gallery");
    },
    onError: (error) => {
      console.error("Error creating artwork:", error);
      setError(error.message || "Failed to save artwork. Please try again.");
    },
  });

  const handleSubmit = async (formData) => {
    try {
      setError(null); // Clear previous errors

      // Validate artistId before uploading image
      if (isSuperAdmin && !artistId) {
        setError("Artist is required when adding on behalf of an artist.");
        return;
      }

      // Handle image upload (keep this on client side)
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

      // Prepare data for tRPC mutation
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
        carousel: formData.get("carousel") === "true",
        url: imageUrl,
        cloudinary_public_id: publicId,
      };
      if (isSuperAdmin && artistId) {
        artworkData.artistId = artistId;
        // Add monthlyUploadLimit if present
        const limit = formData.get("monthlyUploadLimit");
        if (limit !== null && limit !== undefined && limit !== "") {
          artworkData.monthlyUploadLimit = Number(limit);
        }
      }

      console.log("Submitting artwork data:", artworkData);

      // Call tRPC mutation
      await createArtworkMutation.mutateAsync(artworkData);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      if (!createArtworkMutation.error) {
        setError(err.message || "Failed to save artwork. Please try again.");
      }
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] bg-gradient-to-b from-gray-50 to-white py-12 sm:py-16">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-96 left-1/2 transform -translate-x-1/2">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-100/30 to-purple-100/30 blur-3xl" />
        </div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
          <div className="w-96 h-96 rounded-full bg-gradient-to-br from-indigo-100/20 to-purple-100/20 blur-3xl" />
        </div>
        <div className="absolute left-0 bottom-0">
          <div className="w-96 h-96 rounded-full bg-gradient-to-tr from-amber-100/20 to-pink-100/20 blur-3xl" />
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="font-artistic text-4xl sm:text-5xl font-bold text-gray-900 tracking-wide mb-4">
            Add New Artwork
          </h2>
          <p className="font-sans text-lg text-gray-600 max-w-2xl mx-auto">
            Share your masterpiece with the world. Fill in the details below to
            add a new artwork to the gallery.
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl font-sans text-sm"
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/50 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-100"
        >
          <div className="p-6 sm:p-8">
            <ArtworkForm
              onSubmit={handleSubmit}
              isSuperAdmin={isSuperAdmin}
              artists={artists}
              loadingArtists={loadingArtists}
              artistId={artistId}
              setArtistId={setArtistId}
              selectedArtist={selectedArtist}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
