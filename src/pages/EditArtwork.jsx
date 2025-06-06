import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "../utils/trpc";
import { uploadImage } from "../config/cloudinary";
import ArtworkForm from "../components/ArtworkForm";
import Loader from "../components/ui/Loader";

export default function EditArtwork() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

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
        url: imageUrl,
        cloudinary_public_id: publicId,
      };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Edit Artwork</h1>
        <ArtworkForm
          initialData={artwork}
          onSubmit={handleSubmit}
          isLoading={updateArtworkMutation.isLoading}
          submitLabel="Update Artwork"
        />
      </div>
    </div>
  );
}
