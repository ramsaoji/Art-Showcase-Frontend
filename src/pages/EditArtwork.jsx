import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import ArtworkForm from "@/features/artwork-form";
import Loader from "@/components/common/Loader";
import { useAuth } from "@/contexts/AuthContext";
import Alert from "@/components/common/Alert";
import { getFriendlyErrorMessage } from "@/utils/formatters";
import PageBackground from "@/components/common/PageBackground";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import FormCard from "@/components/common/FormCard";

/**
 * EditArtwork page — loads an existing artwork by ID and allows the owner or
 * super admin to update its details. Delegates form rendering to the artwork-form feature.
 */
export default function EditArtwork() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isSuperAdmin, user } = useAuth();
  const [error, setError] = useState(null);

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
          <p className="text-xl font-semibold mb-4 font-artistic text-gray-900">Artwork not found</p>
          <Button onClick={() => navigate("/gallery")}>Back to Gallery</Button>
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
      <PageBackground variant="extended" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Edit Artwork"
          subtitle="Update your artwork details below. Make changes to your masterpiece and save to keep your gallery up to date."
          as="h2"
        />

        <FormCard maxWidth="4xl" noPadding>
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
        </FormCard>
      </div>
    </div>
  );
}
