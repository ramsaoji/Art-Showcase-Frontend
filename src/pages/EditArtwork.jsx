import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trpc, uploadToCloudinary } from "../utils/trpc";
import ArtworkForm from "../components/ArtworkForm";
import Loader from "../components/ui/Loader";
import { useAuth } from "../contexts/AuthContext";
import Alert from "../components/Alert";
import { getFriendlyErrorMessage } from "../utils/formatters";
import { useCallback } from "react";
import { motion } from "framer-motion";

// Hoisted static motion configurations (rendering-hoist-jsx)
const containerMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const headerMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: 0.1 },
};

const formContainerMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: 0.2 },
};

export default function EditArtwork() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isSuperAdmin, user } = useAuth();
  const [error, setError] = useState(null);
  const [artwork, setArtwork] = useState(null);



  // tRPC utils for cache invalidation
  const utils = trpc.useContext();

  // tRPC queries and mutations
  const {
    data: artworkData,
    isLoading,
    error: fetchError,
    refetch,
  } = trpc.artwork.getArtworkById.useQuery(
    { id: id },
    {
      enabled: !!id,
      onError: (error) => setError(getFriendlyErrorMessage(error)),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch all artists for admin (for super admin to edit monthly limit)
  const { data: artistsRaw = [], isLoading: loadingArtists } =
    trpc.user.listUsers.useQuery(undefined, {
      enabled: isSuperAdmin,
      select: (users) => users.filter((u) => u.role === "ARTIST"),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 2 * 60 * 1000,
    });
  const artists = artistsRaw.filter((a) => a.approved && a.active);

  // Handle case where artwork is not found
  useEffect(() => {
    if (!isLoading && !artworkData && !fetchError) {
      setError("Artwork not found");
    }
  }, [isLoading, artworkData, fetchError]);

  const updateArtworkMutation = trpc.artwork.updateArtworkWithImage.useMutation(
    {
      onSuccess: () => {
        utils.artwork.getAllArtworks.invalidate();
        utils.artwork.getFeaturedArtworks.invalidate();
        utils.artwork.getArtworkById.invalidate({ id: artworkData.id });
        navigate("/gallery");
      },
      onError: (err) => {
        setError(getFriendlyErrorMessage(err));
      },
    }
  );

  const handleSubmit = async (formData) => {
    if (!artworkData) return;
    try {
      setError(null);
      const images = (formData.images || []).map((img) => ({
        id: img.id,
        url: img.url,
        cloudinary_public_id: img.cloudinary_public_id,
        galleryOrder: img.galleryOrder,
        showInCarousel: img.showInCarousel,
      }));
      // Artist-level limits are managed in Admin → Artist Management; do not send from artwork form.
      // Always send featured/sold as booleans (fallback to existing artwork when form value is missing)
      const updateData = {
        id: artworkData.id,
        title: formData.title,
        price: Number(formData.price),
        description: formData.description,
        dimensions: formData.dimensions,
        material: formData.material,
        style: formData.style,
        year: Number(formData.year),
        featured: typeof formData.featured === "boolean" ? formData.featured : !!artworkData.featured,
        sold: typeof formData.sold === "boolean" ? formData.sold : !!artworkData.sold,
        instagramReelLink: formData.instagramReelLink,
        youtubeVideoLink: formData.youtubeVideoLink,
        status: formData.status || "ACTIVE",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        images,
        expiresAt: formData.expiresAt
          ? new Date(formData.expiresAt)
          : undefined,
      };
      await updateArtworkMutation.mutateAsync(updateData);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="w-full max-w-xl">
          <Alert
            type="error"
            message={error}
            onRetry={() => {
              setError(null);
              refetch();
            }}
          />
        </div>
      </div>
    );
  }

  // Artwork not found
  if (!artworkData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-xl font-semibold mb-2">Artwork not found</p>
          <button
            onClick={() => navigate("/gallery")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Gallery
          </button>
        </div>
      </div>
    );
  }

  // Find the artist for this artwork (for super admin)
  const selectedArtist =
    isSuperAdmin && artworkData.userId
      ? artists.find((a) => a.id === artworkData.userId)
      : null;



  return (
    <div className="relative min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] py-12 sm:py-16 bg-white/50">
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

      <motion.div
        {...containerMotion}
        className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <motion.div {...headerMotion} className="text-center mb-12">
          <h2 className="text-5xl lg:text-6xl font-bold mb-4 font-artistic text-center tracking-wide text-gray-900">
            Edit Artwork
          </h2>
          <p className="text-lg sm:text-xl font-sans text-gray-600 leading-relaxed">
            Update your artwork details below. Make changes to your masterpiece
            and save to keep your gallery up to date.
          </p>
        </motion.div>

        <motion.div
          {...formContainerMotion}
          className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-100"
        >
          <div className="p-6 sm:p-8">
            <ArtworkForm
              initialData={artworkData}
              onSubmit={handleSubmit}
              isLoading={false}
              submitLabel="Update Artwork"
              artists={artists}
              loadingArtists={loadingArtists}
              selectedArtist={selectedArtist}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
