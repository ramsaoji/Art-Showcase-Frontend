import { lazy, Suspense } from "react";
import ArtworkImageGrid from "@/components/artwork/ArtworkImageGrid";
import Loader from "@/components/common/Loader";

// Lazy-load cropper to avoid bloating the initial bundle
const ImageCropper = lazy(() => import("@/components/artwork/ImageCropper"));

/**
 * ArtworkImageSection
 * Encapsulates the image upload grid and the image crop modal.
 * Keeps the orchestrator free of image-specific rendering.
 *
 * @param {object} props
 * @param {Array} props.images - Current images array (file/preview objects).
 * @param {Function} props.setImages - Setter for the images array.
 * @param {number} props.imageUploadLimit - Max images allowed for this user.
 * @param {boolean} props.canAssignArtwork - Whether the current user can create artwork for another artist.
 * @param {boolean} props.canManageCarousel - Whether the current user can manage carousel-specific image flags.
 * @param {Array<string>} props.imageErrors - Array of image-level error messages.
 * @param {Function} props.setImageErrors - Setter for image errors.
 * @param {Array<string>} props.validationErrors - Form-level validation error messages for images.
 * @param {boolean} props.isAutoDismissible - Whether the current error should auto-dismiss.
 * @param {Function} props.setIsAutoDismissible - Setter for auto-dismiss flag.
 * @param {number|null} props.fileSizeMB - Max file size in MB from backend config.
 * @param {string|null} props.validationError - Zod image validation error message (post-submit).
 * @param {boolean} props.isSubmitted - Whether the form has been submitted (controls error display).
 * @param {object|null} props.croppingImage - Object URL of the image currently being cropped, or null.
 * @param {Function} props.onFilesSelected - Called when the user selects new files.
 * @param {Function} props.onRemoveImage - Called when an image is removed.
 * @param {Function} props.onCropImage - Called to initiate crop for a given index.
 * @param {Function} props.onCropComplete - Called when the crop is confirmed.
 * @param {Function} props.onCropCancel - Called when the crop is cancelled.
 * @param {Function} props.onDismissErrors - Called to manually dismiss error messages.
 */
export default function ArtworkImageSection({
  images,
  setImages,
  imageUploadLimit,
  canAssignArtwork,
  canManageCarousel,
  imageErrors,
  setImageErrors,
  validationErrors,
  isAutoDismissible,
  setIsAutoDismissible,
  fileSizeMB,
  validationError,
  isSubmitted,
  croppingImage,
  onFilesSelected,
  onRemoveImage,
  onCropImage,
  onCropComplete,
  onCropCancel,
  onDismissErrors,
}) {
  return (
    <>
      <ArtworkImageGrid
        images={images}
        setImages={setImages}
        imageUploadLimit={canAssignArtwork ? 1000 : imageUploadLimit}
        imageErrors={imageErrors}
        validationErrors={validationErrors}
        onFilesSelected={onFilesSelected}
        onRemoveImage={onRemoveImage}
        onCrop={onCropImage}
        onDismissErrors={onDismissErrors}
        fileSizeMB={fileSizeMB ?? 5}
        isAutoDismissible={isAutoDismissible}
        canAssignArtwork={canAssignArtwork}
        canManageCarousel={canManageCarousel}
        validationError={isSubmitted ? validationError : null}
        setImageErrors={setImageErrors}
        setIsAutoDismissible={setIsAutoDismissible}
      />

      {/* Image Crop Modal — lazy loaded */}
      {croppingImage && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <Loader size="large" />
            </div>
          }
        >
          <ImageCropper
            image={croppingImage}
            onCropComplete={onCropComplete}
            onCancel={onCropCancel}
            aspectRatio={1}
            minWidth={100}
            minHeight={100}
          />
        </Suspense>
      )}
    </>
  );
}
