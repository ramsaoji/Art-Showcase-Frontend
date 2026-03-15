import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ArtworkForm from "@/features/artwork-form";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { getFriendlyErrorMessage } from "@/utils/formatters";
import PageBackground from "@/components/common/PageBackground";
import PageHeader from "@/components/common/PageHeader";
import Alert from "@/components/common/Alert";
import FormCard from "@/components/common/FormCard";
import { PERMISSIONS } from "@/lib/rbac";

/**
 * AddArtwork page — allows artists (and super admins on behalf of an artist)
 * to create a new artwork. Delegates form rendering to the artwork-form feature.
 */
export default function AddArtwork() {
  const navigate = useNavigate();
  const { can, user } = useAuth();
  const [error, setError] = useState(null);
  const [artistId, setArtistId] = useState("");
  const canCreateForAnyArtist = can(PERMISSIONS.ARTWORK_CREATE_ANY);

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
        toast.success("Artwork added successfully");
        utils.artwork.getAllArtworks.invalidate();
        utils.artwork.getFeaturedArtworks.invalidate();
        utils.artwork.getArtworksForHeroCarousel.invalidate();
        utils.user.listArtistsAdmin.invalidate();
        utils.user.listAssignableArtists.invalidate();
        if (artistId) {
          utils.artwork.getArtistUsageStats.invalidate({ artistId });
        }
        utils.misc.getRemainingQuota.invalidate();
        navigate("/gallery");
      },
      onError: (err) => {
        const msg = getFriendlyErrorMessage(err);
        setError(msg);
        toast.error(msg);
      },
    }
  );

  const handleSubmit = async (formData) => {
    try {
      setError(null);
      if (canCreateForAnyArtist && !artistId) {
        setError("Artist is required when adding on behalf of an artist.");
        return;
      }
      // Validate images
      if (
        !formData.images ||
        !Array.isArray(formData.images) ||
        formData.images.length === 0
      ) {
        setError("At least one image is required.");
        return;
      }

      // Artist-level limits are managed in Admin → Artist Management; do not send from artwork form.
      const artworkData = {
        ...formData,
        artistId: canCreateForAnyArtist ? artistId : undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      await createArtworkMutation.mutateAsync(artworkData);
      setArtistId("");
      localStorage.removeItem(ARTIST_ID_KEY);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  // Restore artistId from localStorage on mount
  useEffect(() => {
    if (canCreateForAnyArtist) {
      const saved = localStorage.getItem(ARTIST_ID_KEY);
      if (saved) {
        setArtistId(saved);
      }
    }
  }, [canCreateForAnyArtist, ARTIST_ID_KEY]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] py-12 bg-white/50">
      <PageBackground variant="extended" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Add Artwork"
          subtitle="Share your masterpiece with the world. Fill in the details below to add a new artwork to the gallery."
          as="h2"
        />

        {error && (
          <div className="mb-8">
            <Alert type="error" message={error} />
          </div>
        )}

        {/* Always render the form - artist selection handles its own loading state */}
        <FormCard maxWidth="4xl" noPadding>
          <div className="p-6 sm:p-8">
            <ArtworkForm
              onSubmit={handleSubmit}
              artistId={artistId}
              setArtistId={handleSetArtistId}
            />
          </div>
        </FormCard>
      </div>
    </div>
  );
}
