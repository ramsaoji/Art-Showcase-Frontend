import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ArtworkForm from "@/features/artwork-form";
import RouteSuspenseFallback from "@/components/common/RouteSuspenseFallback";
import { useAuth } from "@/contexts/AuthContext";
import Alert from "@/components/common/Alert";
import ErrorState from "@/components/common/ErrorState";
import { getFriendlyErrorMessage } from "@/utils/formatters";
import PageBackground from "@/components/common/PageBackground";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import FormCard from "@/components/common/FormCard";
import { trackError } from "@/services/analytics";
import { PERMISSIONS } from "@/lib/rbac";

/**
 * EditArtwork page — loads an existing artwork by ID and allows the owner or
 * super admin to update its details. Delegates form rendering to the artwork-form feature.
 */
export default function EditArtwork() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { can } = useAuth();
  const canManageAnyArtwork = can(PERMISSIONS.ARTWORK_UPDATE_ANY);
  const canManageArtworkFeatures = can(PERMISSIONS.ARTWORK_FEATURE_MANAGE);
  const canManageArtworkStatus = can(PERMISSIONS.ARTWORK_STATUS_MANAGE);
  const [loadError, setLoadError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const hasLoggedLoadError = useRef(false);

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
      onError: (err) => {
        const msg = getFriendlyErrorMessage(err);
        setLoadError(msg);
        setIsNotFound(false);
        if (!hasLoggedLoadError.current) {
          trackError(msg || "Failed to load artwork for edit.", "EditArtwork");
          hasLoggedLoadError.current = true;
        }
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch assignable artists for staff artwork reassignment/edit context
  const { data: artistsRaw = [], isLoading: loadingArtists } =
    trpc.user.listAssignableArtists.useQuery(undefined, {
      enabled: canManageAnyArtwork,
      select: (result) => result?.artists ?? [],
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 2 * 60 * 1000,
    });
  const artists = artistsRaw;

  // Handle case where artwork is not found
  useEffect(() => {
    if (!isLoading && !artworkData && !fetchError) {
      setIsNotFound(true);
      setLoadError(null);
    } else if (artworkData) {
      setIsNotFound(false);
      setLoadError(null);
    }
  }, [isLoading, artworkData, fetchError]);

  useEffect(() => {
    if (!loadError) {
      hasLoggedLoadError.current = false;
    }
  }, [loadError]);

  const updateArtworkMutation = trpc.artwork.updateArtworkWithImage.useMutation(
    {
      onSuccess: () => {
        toast.success("Artwork updated successfully");
        setSubmitError(null);
        utils.artwork.getAllArtworks.invalidate();
        utils.artwork.getFeaturedArtworks.invalidate();
        utils.artwork.getArtworksForHeroCarousel.invalidate();
        utils.artwork.getArtworkById.invalidate({ id: artworkData.id });
        navigate("/gallery");
      },
      onError: (err) => {
        const msg = getFriendlyErrorMessage(err);
        setSubmitError(msg);
        trackError(msg || "Failed to update artwork.", "EditArtworkSubmit");
        toast.error(msg);
      },
    }
  );

  const handleSubmit = async (formData) => {
    if (!artworkData) return;
    try {
      setSubmitError(null);
      const images = (formData.images || []).map((img) => ({
        id: img.id,
        url: img.url,
        cloudinary_public_id: img.cloudinary_public_id,
        galleryOrder: img.galleryOrder,
        showInCarousel: img.showInCarousel,
      }));
      // Artist-level limits are managed in Admin → Artist Management; do not send from artwork form.
      // Admin-only artwork fields are added below only when the current user can manage them.
      const updateData = {
        id: artworkData.id,
        title: formData.title,
        price: Number(formData.price),
        description: formData.description,
        dimensions: formData.dimensions,
        material: formData.material,
        style: formData.style,
        year: Number(formData.year),
        instagramReelLink: formData.instagramReelLink,
        youtubeVideoLink: formData.youtubeVideoLink,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        images,
        discountPercent: formData.discountPercent ? Number(formData.discountPercent) : null,
        discountStartAt: formData.discountStartAt ? new Date(formData.discountStartAt) : null,
        discountEndAt: formData.discountEndAt ? new Date(formData.discountEndAt) : null,
      };
      if (canManageArtworkFeatures) {
        updateData.featured =
          typeof formData.featured === "boolean"
            ? formData.featured
            : !!artworkData.featured;
        updateData.sold =
          typeof formData.sold === "boolean"
            ? formData.sold
            : !!artworkData.sold;
      }
      if (canManageArtworkStatus) {
        updateData.status = formData.status || artworkData.status || "ACTIVE";
        updateData.expiresAt = formData.expiresAt
          ? new Date(formData.expiresAt)
          : null;
      }
      await updateArtworkMutation.mutateAsync(updateData);
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] py-12 sm:py-16 bg-white/50">
        <RouteSuspenseFallback />
      </div>
    );
  }

  // Error state (fetch/load failure only)
  if (loadError) {
    return (
      <div className="relative min-h-screen bg-white/50">
        <PageBackground variant="extended" />
        <div className="flex justify-center items-center min-h-screen p-4">
          <div className="w-full max-w-xl">
            <ErrorState
              title="Failed to load artwork"
              description={loadError}
              primaryAction={
                <Button
                  variant="default"
                  className="rounded-full px-8 font-artistic text-base"
                  onClick={() => {
                    setLoadError(null);
                    refetch();
                  }}
                >
                  Retry
                </Button>
              }
              secondaryAction={
                <Button
                  variant="outline"
                  className="rounded-full px-6 font-artistic text-base"
                  onClick={() => navigate("/gallery")}
                >
                  Back to Gallery
                </Button>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  // Artwork not found
  if (isNotFound) {
    return (
      <div className="relative min-h-screen bg-white/50">
        <PageBackground variant="extended" />
        <div className="flex justify-center items-center min-h-screen p-4">
          <div className="w-full max-w-xl">
            <ErrorState
              severity="warning"
              title="Artwork not found"
              description="The artwork might have been removed or is no longer available."
              secondaryAction={
                <Button
                  variant="outline"
                  className="rounded-full px-6 font-artistic text-base"
                  onClick={() => navigate("/gallery")}
                >
                  Back to Gallery
                </Button>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  // Find the artist for this artwork (for super admin)
  const selectedArtist =
    canManageAnyArtwork && artworkData.userId
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

        {submitError && (
          <div className="mb-4">
            <Alert type="error" message={submitError} />
          </div>
        )}

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
