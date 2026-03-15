import { useState, useCallback } from "react";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/trpc";
import { getFriendlyErrorMessage } from "@/utils/formatters";

/**
 * Encapsulates the full artwork form submission pipeline:
 * 1. Validates image presence.
 * 2. Loops over images, uploading new ones to Cloudinary with animated progress.
 * 3. Constructs the final payload (strips non-admin fields for artists).
 * 4. Calls the provided `onSubmit` callback.
 *
 * @param {object} params
 * @param {boolean} params.canAssignArtwork - Whether the current user can create artwork for another artist.
 * @param {boolean} params.canManageArtworkFeatures - Whether the current user can set featured/sold fields.
 * @param {boolean} params.canManageArtworkStatus - Whether the current user can set status/expiry fields.
 * @param {object|null} params.initialData - Existing artwork in edit mode, or null.
 * @param {Function} params.onSubmit - Async callback passed from the consuming page.
 * @param {Function} params.clearPersisted - From useArtworkPersist — clears localStorage on success.
 * @param {Function} params.setValue - From react-hook-form — used to sync images before trigger.
 * @param {Function} params.trigger - From react-hook-form — triggers validation.
 * @param {Function} params.clearErrors - From react-hook-form — clears errors on success.
 * @returns {object} Submit handler and related state.
 */
export function useArtworkSubmit({
  canAssignArtwork,
  canManageArtworkFeatures,
  canManageArtworkStatus,
  initialData,
  onSubmit,
  clearPersisted,
  setValue,
  trigger,
  clearErrors,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(null); // "uploading" | "saving" | null
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savingProgress, setSavingProgress] = useState(0);

  /**
   * Returns the human-readable label for the current submission step.
   * @returns {string}
   */
  const getStepLabel = useCallback(() => {
    switch (currentStep) {
      case "uploading": return "Uploading images...";
      case "saving": return initialData ? "Updating artwork..." : "Saving artwork...";
      default: return "Processing...";
    }
  }, [currentStep, initialData]);

  /**
   * Main submission handler — called by react-hook-form's handleSubmit after
   * field-level Zod validation passes.
   *
   * @param {object} formData - Validated form values from react-hook-form.
   * @param {Array} images - Current image array from component state.
   * @param {Function} setImageErrors - Setter for image-level errors.
   * @param {Function} setValidationErrors - Setter for form-level validation errors.
   * @param {Function} setIsAutoDismissible - Setter for auto-dismiss flag on image errors.
   */
  const handleFormSubmit = useCallback(
    async (formData, images, setImageErrors, setValidationErrors, setIsAutoDismissible) => {
      if (isSubmitting) return;

      // Guard: images must exist before we proceed
      if (!images || images.length === 0) {
        setValidationErrors(["At least one image is required"]);
        return;
      }

      // Sync images into form state and trigger full validation
      setValidationErrors([]);
      setValue("images", images, { shouldValidate: false });
      const isValid = await trigger();
      if (!isValid) return;

      setIsSubmitting(true);
      setCurrentStep("uploading");
      setUploadProgress(0);
      setImageErrors([]);

      // ─── Image upload loop ─────────────────────────────────────────────────
      const uploadErrors = [];
      const uploadedImages = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const prevProgress = Math.round((i / images.length) * 100);
        const nextProgress = Math.round(((i + 1) / images.length) * 100);

        if (img.uploaded) {
          // Already on Cloudinary — pass through
          uploadedImages.push({
            url: img.url,
            cloudinary_public_id: img.cloudinary_public_id,
            order: i,
            id: img.id,
            showInCarousel: img.showInCarousel || false,
          });
          // Animate progress bar forward for already-uploaded images
          for (let p = prevProgress + 1; p <= nextProgress; p++) {
            setUploadProgress(p);
            await new Promise((res) => setTimeout(res, 8));
          }
        } else if (img.file instanceof File) {
          // New image — upload to Cloudinary with fake incremental progress
          let fakeProgress = prevProgress;
          const fakeInterval = setInterval(() => {
            if (fakeProgress < nextProgress - 5) {
              fakeProgress++;
              setUploadProgress(fakeProgress);
            }
          }, 20);

          try {
            const result = await uploadToCloudinary(img.file);
            clearInterval(fakeInterval);
            setUploadProgress(nextProgress);
            if (!result?.secure_url) {
              uploadErrors.push(`Upload failed for ${img.file.name}.`);
            } else {
              uploadedImages.push({
                url: result.secure_url,
                cloudinary_public_id: result.public_id,
                order: i,
                showInCarousel: img.showInCarousel || false,
              });
            }
          } catch (err) {
            clearInterval(fakeInterval);
            setUploadProgress(nextProgress);
            uploadErrors.push(`Upload failed for ${img.file.name}.`);
          }
        } else {
          uploadErrors.push(`Image file missing for ${img.file?.name || "unknown"}.`);
          setUploadProgress(nextProgress);
        }
      }

      // Abort if any uploads failed
      if (uploadErrors.length > 0) {
        setImageErrors([...new Set(uploadErrors)]);
        setIsAutoDismissible(false);
        setIsSubmitting(false);
        setCurrentStep(null);
        return;
      }

      // ─── Payload construction ──────────────────────────────────────────────
      setCurrentStep("saving");
      setSavingProgress(100);

      const payload = { ...formData, images: uploadedImages };

      if (!canAssignArtwork) {
        delete payload.artistId;
      }

      if (canManageArtworkFeatures) {
        payload.featured = Boolean(formData.featured);
        payload.sold = Boolean(formData.sold);
      } else {
        delete payload.featured;
        delete payload.sold;
      }

      if (!canManageArtworkStatus) {
        delete payload.status;
        delete payload.expiresAt;
      }

      // Strip internal limit fields that may have bled into form data
      delete payload.monthlyUploadLimit;
      delete payload.aiDescriptionDailyLimit;
      delete payload.imageUploadLimit;

      // Coerce discount fields: empty string → null (backend expects null, not "")
      payload.discountPercent =
        payload.discountPercent !== "" && payload.discountPercent !== null && payload.discountPercent !== undefined
          ? Number(payload.discountPercent)
          : null;
      payload.discountStartAt = payload.discountStartAt ? new Date(payload.discountStartAt) : null;
      payload.discountEndAt = payload.discountEndAt ? new Date(payload.discountEndAt) : null;

      // ─── Submit ────────────────────────────────────────────────────────────
      try {
        await onSubmit(payload);
        clearPersisted();
        clearErrors();
        setImageErrors([]);
        setValidationErrors([]);
      } catch (err) {
        // onSubmit errors are surfaced as toasts — page-level error handling
        toast.error(getFriendlyErrorMessage(err));
      } finally {
        setIsSubmitting(false);
        setCurrentStep(null);
        setUploadProgress(0);
        setSavingProgress(0);
      }
    },
    [
      isSubmitting,
      canAssignArtwork,
      canManageArtworkFeatures,
      canManageArtworkStatus,
      onSubmit,
      clearPersisted,
      setValue,
      trigger,
      clearErrors,
    ]
  );

  return {
    handleFormSubmit,
    isSubmitting,
    currentStep,
    uploadProgress,
    savingProgress,
    getStepLabel,
  };
}
