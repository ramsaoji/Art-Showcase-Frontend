import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ArtworkForm from "../components/ArtworkForm";
import { motion } from "framer-motion";
import { trpc } from "../utils/trpc";
import { useAuth } from "../contexts/AuthContext";

export default function AddArtwork() {
  const navigate = useNavigate();
  const { isSuperAdmin, user } = useAuth();
  const [error, setError] = useState(null);
  const [artistId, setArtistId] = useState("");
  const [shouldLoadArtists, setShouldLoadArtists] = useState(false);

  // Create user-specific localStorage key
  const ARTIST_ID_KEY = `artwork_artist_id_${user?.id || "anonymous"}`;

  // Debug: Log user and localStorage key
  useEffect(() => {
    console.log("AddArtwork - user:", user);
    console.log("AddArtwork - ARTIST_ID_KEY:", ARTIST_ID_KEY);
    console.log(
      "AddArtwork - localStorage keys:",
      Object.keys(localStorage).filter((key) => key.includes("artwork"))
    );
  }, [user, ARTIST_ID_KEY]);

  // Helper to set artistId and persist to localStorage
  const handleSetArtistId = (id) => {
    console.log("handleSetArtistId called with:", id);
    console.log("Storing in localStorage with key:", ARTIST_ID_KEY);
    setArtistId(id);
    localStorage.setItem(ARTIST_ID_KEY, id || "");
    console.log(
      "localStorage after setting:",
      localStorage.getItem(ARTIST_ID_KEY)
    );
  };

  // Fetch all artists for admin - only when shouldLoadArtists is true
  const { data, isLoading: loadingArtists } = trpc.user.listUsers.useQuery(
    undefined,
    { enabled: isSuperAdmin && shouldLoadArtists }
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
  const createArtworkMutation = trpc.artwork.createArtworkWithImage.useMutation(
    {
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
    }
  );

  // Restore artistId from localStorage on mount
  useEffect(() => {
    if (isSuperAdmin && artists.length > 0) {
      const saved = localStorage.getItem(ARTIST_ID_KEY);
      if (saved && artists.some((a) => a.id === saved)) {
        setArtistId(saved);
      }
      // If the saved artistId is not in the list, clear it
      if (saved && !artists.some((a) => a.id === saved)) {
        setArtistId("");
        localStorage.removeItem(ARTIST_ID_KEY);
      }
    }
  }, [isSuperAdmin, artists, ARTIST_ID_KEY]);

  // Debug: Log artist selection
  useEffect(() => {
    console.log("AddArtwork - artistId:", artistId);
    console.log("AddArtwork - selectedArtist:", selectedArtist);
    console.log("AddArtwork - artists count:", artists.length);
  }, [artistId, selectedArtist, artists]);

  const handleSubmit = async (formData) => {
    try {
      setError(null); // Clear previous errors

      // Validate artistId before uploading image
      if (isSuperAdmin && !artistId) {
        setError("Artist is required when adding on behalf of an artist.");
        return;
      }

      // Get image file and convert to base64
      const imageFile = formData.get("image");
      let imageBase64 = null;

      if (imageFile) {
        // Check if it's a File object (new upload) or base64 string (from localStorage)
        if (imageFile instanceof File) {
          imageBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
          });
        } else {
          // If it's not a File object, it might be base64 from localStorage
          // In this case, we should show an error asking user to re-upload
          setError(
            "Image data was lost during page refresh. Please upload your image again."
          );
          return;
        }
      } else {
        // No image file provided
        setError("Image is required. Please upload an image.");
        return;
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
        imageBase64,
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
      // After successful submission, clear artistId and localStorage
      setArtistId("");
      localStorage.removeItem(ARTIST_ID_KEY);
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

        {/* Always render the form - artist selection handles its own loading state */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/50 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-100"
        >
          <div className="p-6 sm:p-8">
            <ArtworkForm
              onSubmit={handleSubmit}
              artists={artists}
              loadingArtists={loadingArtists}
              artistId={artistId}
              setArtistId={handleSetArtistId}
              selectedArtist={selectedArtist}
              setShouldLoadArtists={setShouldLoadArtists}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
