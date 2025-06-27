import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ArtworkForm from "../components/ArtworkForm";
import { motion } from "framer-motion";
import { trpc, uploadToCloudinary } from "../utils/trpc";
import { useAuth } from "../contexts/AuthContext";
import { getFriendlyErrorMessage } from "../utils/formatters";

export default function AddArtwork() {
  const navigate = useNavigate();
  const { isSuperAdmin, user } = useAuth();
  const [error, setError] = useState(null);
  const [artistId, setArtistId] = useState("");

  // Create user-specific localStorage key
  const ARTIST_ID_KEY = `artwork_artist_id_${user?.id || "anonymous"}`;

  // Helper to set artistId and persist to localStorage
  const handleSetArtistId = (id) => {
    setArtistId(id);
    localStorage.setItem(ARTIST_ID_KEY, id || "");
  };

  // tRPC utils for cache invalidation
  const utils = trpc.useContext();

  const createArtworkMutation = trpc.artwork.createArtworkWithImage.useMutation(
    {
      onSuccess: () => {
        utils.artwork.getAllArtworks.invalidate();
        utils.artwork.getFeaturedArtworks.invalidate();
        // Invalidate user data to refresh monthlyUploadLimit
        utils.user.listUsers.invalidate();
        // Invalidate artist's monthly upload count
        if (artistId) {
          utils.artwork.getArtistMonthlyUploadCount.invalidate({ artistId });
        }
        navigate("/gallery");
      },
      onError: (err) => {
        setError(getFriendlyErrorMessage(err));
      },
    }
  );

  const handleSubmit = async (formData) => {
    try {
      setError(null);
      if (isSuperAdmin && !artistId) {
        setError("Artist is required when adding on behalf of an artist.");
        return;
      }
      const imageFile = formData.get("image");
      if (!imageFile || !(imageFile instanceof File)) {
        setError("Image is required. Please upload an image.");
        return;
      }
      // Upload to Cloudinary first
      const cloudinaryResult = await uploadToCloudinary(imageFile);

      if (!cloudinaryResult || !cloudinaryResult.secure_url) {
        setError(
          getFriendlyErrorMessage({ message: "Cloudinary upload failed" })
        );
        return;
      }

      // Prepare data for tRPC mutation
      const artworkData = {
        title: formData.get("title"),
        price: parseFloat(formData.get("price")),
        description: formData.get("description"),
        dimensions: formData.get("dimensions"),
        material: formData.get("material"),
        style: formData.get("style"),
        year: parseInt(formData.get("year")),
        featured: formData.get("featured") === "true",
        sold: formData.get("sold") === "true",
        carousel: formData.get("carousel") === "true",
        imageUrl: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      if (isSuperAdmin && artistId) {
        artworkData.artistId = artistId;
        const limit = formData.get("monthlyUploadLimit");
        if (limit !== null && limit !== undefined && limit !== "") {
          artworkData.monthlyUploadLimit = parseInt(limit);
        }
        const aiLimit = formData.get("aiDescriptionDailyLimit");
        if (aiLimit !== null && aiLimit !== undefined && aiLimit !== "") {
          artworkData.aiDescriptionDailyLimit = parseInt(aiLimit);
        }
      }
      if (isSuperAdmin) {
        const status = formData.get("status");
        if (status) {
          artworkData.status = status;
          if (status === "EXPIRED") {
            artworkData.expiredBy = "admin";
          }
        }
      }
      const expiresAt = formData.get("expiresAt");
      if (isSuperAdmin && expiresAt) {
        artworkData.expiresAt = new Date(expiresAt);
      }
      await createArtworkMutation.mutateAsync(artworkData);
      setArtistId("");
      localStorage.removeItem(ARTIST_ID_KEY);
    } catch (err) {
      console.error("Artwork submission failed:", err);
      setError(getFriendlyErrorMessage(err));
    }
  };

  // Restore artistId from localStorage on mount
  useEffect(() => {
    if (isSuperAdmin) {
      const saved = localStorage.getItem(ARTIST_ID_KEY);
      if (saved) {
        setArtistId(saved);
      }
    }
  }, [isSuperAdmin, ARTIST_ID_KEY]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] py-12 bg-white/50">
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
          <h2 className="text-5xl lg:text-6xl font-bold mb-4 font-artistic text-center tracking-wide text-gray-900">
            Add Artwork
          </h2>
          <p className="text-lg sm:text-xl font-sans text-gray-600 leading-relaxed">
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

        {/* Always render the form - artist selection handles its own loading state */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-100"
        >
          <div className="p-6 sm:p-8">
            <ArtworkForm
              onSubmit={handleSubmit}
              artistId={artistId}
              setArtistId={handleSetArtistId}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
