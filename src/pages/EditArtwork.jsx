import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "../utils/trpc";
import { uploadImage } from "../config/cloudinary";
import ArtworkForm from "../components/ArtworkForm";
import Loader from "../components/ui/Loader";
import { useAuth } from "../contexts/AuthContext";

export default function EditArtwork() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const { isSuperAdmin, user } = useAuth();
  const [artistId, setArtistId] = useState(null);

  console.log("Route ID from useParams:", id, "Type:", typeof id);

  // tRPC utils for cache invalidation
  const utils = trpc.useContext();

  // tRPC queries and mutations
  const {
    data: artwork,
    isLoading,
    error: fetchError,
    refetch,
  } = trpc.artwork.getArtworkById.useQuery(
    { id: id },
    {
      enabled: !!id, // Only run query if ID exists
      onError: (error) => {
        console.error("Error loading artwork:", error);
        setError("Failed to load artwork");
      },
    }
  );

  const updateArtworkMutation = trpc.artwork.updateArtwork.useMutation({
    onSuccess: () => {
      console.log("Artwork updated successfully");
      // Invalidate relevant queries to refresh the UI
      utils.artwork.getAllArtworks.invalidate();
      utils.artwork.getFeaturedArtworks.invalidate();
      utils.artwork.getArtworkById.invalidate({ id: id });

      navigate("/gallery");
    },
    onError: (error) => {
      console.error("Error updating artwork:", error);
      setError(`Failed to update artwork: ${error.message}`);
    },
  });

  // Fetch all artists for admin (for super admin to edit monthly limit)
  const { data: artists = [], isLoading: loadingArtists } =
    trpc.user.listUsers.useQuery(undefined, {
      enabled: isSuperAdmin,
      select: (users) => users.filter((u) => u.role === "ARTIST"),
    });

  // Handle case where artwork is not found
  useEffect(() => {
    if (!isLoading && !artwork && !fetchError) {
      setError("Artwork not found");
    }
  }, [isLoading, artwork, fetchError]);

  const handleSubmit = async (formData) => {
    if (!artwork) return;

    try {
      setError(null); // Clear any previous errors

      // Handle image upload if a new image is provided
      const imageFile = formData.get("image");
      let imageUrl = artwork.url;
      let publicId = artwork.cloudinary_public_id;

      if (imageFile && imageFile.size > 0) {
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

      // Prepare update data
      const updateData = {
        id: artwork.id,
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
        status: formData.get("status"),
      };

      // For super admin, include monthlyUploadLimit if set
      if (isSuperAdmin) {
        const limit = formData.get("monthlyUploadLimit");
        if (limit !== null && limit !== undefined && limit !== "") {
          updateData.monthlyUploadLimit = Number(limit);
        }
      }

      console.log("Artwork ID before update:", artwork.id);
      console.log("Update data ID before update:", updateData.id);
      // Update artwork using tRPC mutation
      await updateArtworkMutation.mutateAsync(updateData);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setError(error.message || "Failed to update artwork");
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
  if (error || fetchError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error || fetchError?.message}</p>
          <button
            onClick={() => {
              setError(null);
              refetch();
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Artwork not found
  if (!artwork) {
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
    isSuperAdmin && artwork.userId
      ? artists.find((a) => a.id === artwork.userId)
      : null;

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
        <div className="text-center mb-12">
          <h2 className="font-artistic text-4xl sm:text-5xl font-bold text-gray-900 tracking-wide mb-4">
            Edit Artwork
          </h2>
          <p className="font-sans text-lg text-gray-600 max-w-2xl mx-auto">
            Update your artwork details below. Make changes to your masterpiece
            and save to keep your gallery up to date.
          </p>
        </div>

        <div className="bg-white/50 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-100">
          <div className="p-6 sm:p-8">
            <ArtworkForm
              initialData={artwork}
              onSubmit={handleSubmit}
              isLoading={updateArtworkMutation.isLoading}
              submitLabel="Update Artwork"
              isSuperAdmin={isSuperAdmin}
              artists={artists}
              loadingArtists={loadingArtists}
              artistId={artwork.userId}
              setArtistId={setArtistId}
              selectedArtist={selectedArtist}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
