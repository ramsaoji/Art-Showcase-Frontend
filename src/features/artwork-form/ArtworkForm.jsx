import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Info, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import Loader from "@/components/common/Loader";
import ProgressBar from "@/components/common/ProgressBar";

import { useAuth } from "@/contexts/AuthContext";
import { trpc, baseUrl } from "@/lib/trpc";
import { getFriendlyErrorMessage } from "@/utils/formatters";

// shadcn artwork-form feature modules
import { createValidationSchema } from "./schema/artworkValidation";
import { useArtworkQuota } from "./hooks/useArtworkQuota";
import { useArtworkPersist } from "./hooks/useArtworkPersist";
import { useArtworkSubmit } from "./hooks/useArtworkSubmit";
import ArtworkQuotaBanner from "./components/ArtworkQuotaBanner";
import ArtworkImageSection from "./components/ArtworkImageSection";
import ArtworkFormFields from "./components/ArtworkFormFields";

/**
 * ArtworkForm
 * Orchestrates the artwork create/edit form.
 * Composes hooks (quota, persist, submit) and sub-components (quota banner,
 * image section, field renderer) — contains no business logic itself.
 *
 * @param {Function} props.onSubmit - Async callback receiving the final validated payload.
 * @param {object|null} props.initialData - Existing artwork for edit mode; null for create.
 * @param {string} props.artistId - Selected artist ID (admin create mode).
 * @param {Function} props.setArtistId - Setter to update the selected artist ID in the parent.
 * @param {object|null} props.selectedArtist - Full artist object for the selected artist (if known).
 */
export default function ArtworkForm({
  onSubmit,
  initialData = null,
  artistId = "",
  setArtistId = () => {},
  selectedArtist = null,
}) {
  const { isSuperAdmin, isArtist, user } = useAuth();
  const utils = trpc.useContext();

  // ─── Hooks ────────────────────────────────────────────────────────────────

  const quota = useArtworkQuota({ isArtist, isSuperAdmin, initialData, artistId });

  const persist = useArtworkPersist({
    userId: user?.id || "anonymous",
    isSuperAdmin,
    initialData,
  });

  // ─── Form setup ───────────────────────────────────────────────────────────

  const [imageRemoved, setImageRemoved] = useState(false);

  const validationSchema = useMemo(
    () => createValidationSchema(isSuperAdmin, initialData),
    [isSuperAdmin, initialData]
  );

  const form = useForm({
    resolver: zodResolver(validationSchema),
    mode: "onSubmit",
    defaultValues: persist.getInitialFormData(),
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    clearErrors,
    formState: { errors, isSubmitted },
    reset,
  } = form;

  const watchedValues = watch();

  // ─── Image state ──────────────────────────────────────────────────────────

  const [images, setImages] = useState(() => {
    if (initialData?.images) {
      return initialData.images.map((img) => ({
        ...img,
        preview: img.url,
        uploaded: true,
        uuid: img.id || uuidv4(),
      }));
    }
    return [];
  });

  const [imageErrors, setImageErrors] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isAutoDismissible, setIsAutoDismissible] = useState(false);
  const [croppingImage, setCroppingImage] = useState(null);
  const [croppingImageIndex, setCroppingImageIndex] = useState(null);
  const [artistFieldTouched, setArtistFieldTouched] = useState(false);

  // ─── AI description state ─────────────────────────────────────────────────

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const generateAIDescriptionMutation = trpc.ai.generateAIDescription.useMutation();

  // ─── Admin edit mode: fetch artist usage stats via raw fetch ──────────────
  // (TRPC query requires artistId at hook call time; edit mode derives it from initialData)
  const [editArtistUsageStats, setEditArtistUsageStats] = useState(null);

  useEffect(() => {
    if (!isSuperAdmin || !initialData) return;
    const targetArtistId = initialData.userId || initialData.artistId;
    if (!targetArtistId) return;

    fetch(
      baseUrl +
        "/trpc/artwork.getArtistUsageStats?input=" +
        encodeURIComponent(JSON.stringify({ artistId: targetArtistId })),
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    )
      .then((r) => r.json())
      .then((json) => setEditArtistUsageStats(json?.result?.data ?? null))
      .catch(() => {}); // Silently handled — UI shows stale data
  }, [isSuperAdmin, initialData]);

  // ─── Persistence effects ──────────────────────────────────────────────────

  const skipNextPersist = useRef(false);
  const [dimensionInputs, setDimensionInputs] = useState(persist.getInitialDimensions);

  // Restore persisted artist ID on mount (admin create mode)
  useEffect(() => {
    if (!initialData && isSuperAdmin) {
      const savedId = persist.getPersistedArtistId();
      if (savedId) {
        setArtistId(savedId);
        setValue("artistId", savedId, { shouldValidate: true });
        setArtistFieldTouched(true);
      }
    }
  }, []);

  // Persist form data to localStorage whenever watched values change
  useEffect(() => {
    if (skipNextPersist.current) { skipNextPersist.current = false; return; }
    persist.persist({ watchedValues, dimensionInputs, artistId });
  }, [watchedValues, dimensionInputs, artistId]);

  // Sync images array into form state
  useEffect(() => {
    setValue("images", images, { shouldValidate: false });
  }, [images, setValue]);

  // Clear image validation error when images are present
  useEffect(() => {
    if (images.length > 0) { setValidationErrors([]); return; }
    if (errors.images?.message) setValidationErrors([errors.images.message]);
  }, [errors.images?.message, images]);

  // ─── Object URL cleanup ───────────────────────────────────────────────────

  useEffect(() => {
    return () => images.forEach((img) => {
      if (img.preview && !img.uploaded) URL.revokeObjectURL(img.preview);
    });
  }, [images]);

  useEffect(() => {
    return () => { if (croppingImage) URL.revokeObjectURL(croppingImage); };
  }, [croppingImage]);

  // ─── Scroll-to-top ref ────────────────────────────────────────────────────

  const formTopRef = useRef(null);

  useEffect(() => {
    if ((imageErrors.length > 0 || validationErrors.length > 0) && formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [imageErrors, validationErrors]);

  // ─── Image handlers ───────────────────────────────────────────────────────

  const imageUploadMax = isSuperAdmin ? 1000 : quota.imageUploadLimit;

  const handleImageFiles = useCallback((files) => {
    let next = [...images];
    const errors = [];
    const rejected = [];
    const maxSizeMB = quota.backendLimits?.fileSizeMB ?? 5;

    for (const file of files) {
      if (next.length >= imageUploadMax) { errors.push("Image upload limit reached."); break; }
      if (!file.type.startsWith("image/")) { rejected.push(`${file.name} (not a valid image)`); continue; }
      if (file.size > maxSizeMB * 1024 * 1024) { rejected.push(`${file.name} (too large, max ${maxSizeMB}MB)`); continue; }
      next.push({ file, preview: URL.createObjectURL(file), uploaded: false, order: next.length, uuid: uuidv4() });
    }

    setImages(next);

    if (next.length > 0) { persist.markImagePresent(); setImageRemoved(false); }
    if (next.length === 0) { persist.clearImageFlag(); setImageRemoved(true); }

    if (rejected.length > 0) {
      setImageErrors([`${rejected.length} file(s) were not added: ${rejected.join(", ")}.`]);
      setIsAutoDismissible(true);
      setTimeout(() => { setImageErrors([]); setIsAutoDismissible(false); }, 5000);
    } else if (errors.length > 0) {
      setImageErrors(errors);
      setIsAutoDismissible(false);
    } else {
      setImageErrors([]);
    }
  }, [images, imageUploadMax, quota.backendLimits?.fileSizeMB, persist]);

  const handleRemoveImage = useCallback((idx) => {
    const removed = images[idx];

    if (removed?.showInCarousel && !isSuperAdmin) {
      setImageErrors(["Cannot remove carousel image. Contact an administrator."]);
      setIsAutoDismissible(false);
      return;
    }

    if (removed?.preview && !removed.uploaded) URL.revokeObjectURL(removed.preview);

    const wasCarousel = removed?.showInCarousel;
    const next = images.filter((_, i) => i !== idx).map((img, i) => ({ ...img, order: i, showInCarousel: img.showInCarousel || false }));

    if (wasCarousel && next.length > 0) {
      next[0].showInCarousel = true;
      setImageErrors(["Carousel image auto-reassigned to the first remaining image."]);
      setIsAutoDismissible(true);
      setTimeout(() => { setImageErrors([]); setIsAutoDismissible(false); }, 5000);
    }

    setImages(next);
    if (next.length === 0) { persist.clearImageFlag(); setImageRemoved(true); }
  }, [images, isSuperAdmin, persist]);

  const handleCropImage = useCallback(async (idx) => {
    const img = images[idx];
    if (!img) return;
    if (img.file) {
      setCroppingImageIndex(idx);
      setCroppingImage(URL.createObjectURL(img.file));
    } else if (img.url) {
      const blob = await fetch(img.url).then((r) => r.blob());
      const file = new File([blob], `cropped-${idx}.jpg`, { type: blob.type });
      const next = [...images];
      next[idx] = { ...next[idx], file };
      setImages(next);
      setCroppingImageIndex(idx);
      setCroppingImage(URL.createObjectURL(file));
    }
  }, [images]);

  const handleCropComplete = useCallback((result) => {
    if (croppingImageIndex !== null && result) {
      const { blob, url } = result;
      const croppedFile = new File(
        [blob],
        `cropped-${images[croppingImageIndex]?.file?.name || croppingImageIndex}.jpg`,
        { type: "image/jpeg", lastModified: Date.now() }
      );
      const next = [...images];
      next[croppingImageIndex] = { ...next[croppingImageIndex], file: croppedFile, preview: url, uploaded: false, url: undefined, cloudinary_public_id: undefined };
      setImages(next);
    }
    setCroppingImage(null);
    setCroppingImageIndex(null);
  }, [croppingImageIndex, images]);

  const handleCropCancel = useCallback(() => {
    setCroppingImage(null);
    setCroppingImageIndex(null);
  }, []);

  const handleDismissErrors = useCallback(() => {
    setImageErrors([]);
    setIsAutoDismissible(false);
  }, []);

  // ─── AI description handler ───────────────────────────────────────────────

  const handleAIDescription = async () => {
    setAiError("");
    setAiLoading(true);
    try {
      let imageData = null;
      const first = images[0];
      if (first) {
        if (first.file) {
          imageData = await compressImageToBase64(first.file);
        } else if (first.preview?.startsWith("data:")) {
          imageData = first.preview.split(",")[1];
        } else if (first.url) {
          const blob = await fetch(first.url).then((r) => r.blob());
          imageData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      }
      if (!imageData) { setAiError("Please upload at least one image first."); return; }

      const data = await generateAIDescriptionMutation.mutateAsync({
        imageData,
        artworkId: initialData?.id ?? undefined,
        artworkTitle: watch("title") || initialData?.title || undefined,
      });
      if (data?.description) setValue("description", data.description, { shouldValidate: true });
      utils.misc.getRemainingQuota.invalidate();
    } catch (err) {
      setAiError(getFriendlyErrorMessage(err));
    } finally {
      setAiLoading(false);
    }
  };

  // ─── Submit hook ──────────────────────────────────────────────────────────

  const submitHook = useArtworkSubmit({
    isSuperAdmin,
    isArtist,
    initialData,
    onSubmit,
    clearPersisted: persist.clearPersisted,
    setValue,
    trigger,
    clearErrors,
  });

  const onFormSubmit = (formData) =>
    submitHook.handleFormSubmit(formData, images, setImageErrors, setValidationErrors, setIsAutoDismissible);

  // ─── Reset handler ────────────────────────────────────────────────────────

  const handleReset = () => {
    const defaultExpiresAt = isSuperAdmin ? persist.getDefaultExpiresAt() : "";
    reset({
      title: "", material: "", style: "", description: "", price: "",
      year: new Date().getFullYear(), featured: false, sold: false,
      instagramReelLink: "", youtubeVideoLink: "", artistId: "",
      status: "ACTIVE", ...(isSuperAdmin && { expiresAt: defaultExpiresAt }),
      width: "", height: "", dimensions: "", images: [],
      discountPercent: "", discountStartAt: "", discountEndAt: "",
    });
    clearErrors();
    setDimensionInputs({ width: "", height: "" });
    images.forEach((img) => { if (img.preview && !img.uploaded) URL.revokeObjectURL(img.preview); });
    setImages([]);
    setImageRemoved(false);
    setArtistFieldTouched(false);
    setImageErrors([]);
    setValidationErrors([]);
    setIsAutoDismissible(false);
    if (isSuperAdmin && setArtistId) setArtistId("");
    persist.clearPersisted();
    skipNextPersist.current = true;
    const container = document.getElementById("main-scroll-container");
    if (container) container.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Derived flags ────────────────────────────────────────────────────────

  const hasFormDataButNoImage = persist.checkHasFormDataButNoImage() && !imageRemoved;
  const isArtistAtMonthlyLimit = isArtist && !isSuperAdmin && quota.monthlyUploadCount >= quota.monthlyUploadLimit;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Form {...form}>
      <form
        ref={formTopRef}
        onSubmit={handleSubmit(onFormSubmit)}
        className="space-y-6 font-sans"
        noValidate
      >
        {/* Artist name label in edit mode (admin only) */}
        {isSuperAdmin && initialData?.artistName && (
          <div className="flex justify-center mb-2">
            <span className="text-lg font-semibold text-gray-700 font-artistic text-center">
              Artwork by: {initialData.artistName}
            </span>
          </div>
        )}

        {/* Page-refresh image-loss notification */}
        {hasFormDataButNoImage && (
          <Alert variant="default" className="my-4 bg-amber-50 border-amber-200">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Form data restored</AlertTitle>
            <AlertDescription className="text-amber-700">
              Your form data was saved from your previous session, but the image was lost during
              page refresh. Please upload your image again to continue.
            </AlertDescription>
          </Alert>
        )}

        {/* Quota banners */}
        <ArtworkQuotaBanner
          showArtistMonthlyBanner={quota.showArtistMonthlyBanner}
          loadingArtistQuota={quota.loadingArtistQuota}
          artistQuotaError={quota.artistQuotaError}
          refetchArtistQuota={quota.refetchArtistQuota}
          monthlyUploadCount={quota.monthlyUploadCount}
          monthlyUploadLimit={quota.monthlyUploadLimit}
          showAdminSelectedBanner={quota.shouldFetchSelectedArtist}
          loadingSelectedArtist={quota.loadingSelectedArtist}
          selectedArtistError={quota.selectedArtistError}
          selectedArtistName={quota.selectedArtistName}
          selectedArtistUploadCount={quota.selectedArtistUploadCount}
          selectedArtistUploadLimit={quota.selectedArtistUploadLimit}
        />

        {/* Image upload section */}
        <ArtworkImageSection
          images={images}
          setImages={setImages}
          imageUploadLimit={quota.imageUploadLimit}
          isSuperAdmin={isSuperAdmin}
          imageErrors={imageErrors}
          setImageErrors={setImageErrors}
          validationErrors={validationErrors}
          isAutoDismissible={isAutoDismissible}
          setIsAutoDismissible={setIsAutoDismissible}
          fileSizeMB={quota.backendLimits?.fileSizeMB}
          validationError={errors.images?.message}
          isSubmitted={isSubmitted}
          croppingImage={croppingImage}
          onFilesSelected={handleImageFiles}
          onRemoveImage={handleRemoveImage}
          onCropImage={handleCropImage}
          onCropComplete={handleCropComplete}
          onCropCancel={handleCropCancel}
          onDismissErrors={handleDismissErrors}
        />

        {/* Config-driven form fields */}
        <ArtworkFormFields
          isSuperAdmin={isSuperAdmin}
          isArtist={isArtist}
          initialData={initialData}
          editArtistUsageStats={editArtistUsageStats}
          selectedArtistUploadData={quota.selectedArtistData}
          selectedArtistName={quota.selectedArtistName}
          backendLimits={quota.backendLimits}
          aiRemaining={quota.aiRemaining}
          aiLimit={quota.aiLimit}
          aiLoading={aiLoading}
          aiError={aiError}
          images={images}
          handleAIDescription={handleAIDescription}
          watchedValues={watchedValues}
          setArtistId={setArtistId}
          artistFieldTouched={artistFieldTouched}
          isSubmitted={isSubmitted}
        />

        {/* Upload + Save progress bars */}
        {submitHook.isSubmitting && (
          <div className="space-y-4 pt-4">
            {submitHook.currentStep === "uploading" && (
              <ProgressBar progress={submitHook.uploadProgress} label={submitHook.getStepLabel()} />
            )}
            {submitHook.currentStep === "saving" && (
              <ProgressBar
                progress={submitHook.savingProgress}
                label={initialData ? "Updating artwork..." : "Saving artwork..."}
              />
            )}
          </div>
        )}

        {/* Submit & Reset actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button
            type="submit"
            disabled={submitHook.isSubmitting || isArtistAtMonthlyLimit}
            className="w-full sm:w-auto h-11 px-8 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-700 text-white hover:from-indigo-600 hover:to-indigo-800 shadow"
          >
            {submitHook.isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader size="xsmall" color="indigo-600" />
                {submitHook.getStepLabel()}
              </span>
            ) : initialData ? (
              "Update Artwork"
            ) : (
              "Save Artwork"
            )}
          </Button>

          {/* Reset — only in create mode */}
          {!initialData && (
            <Button
              type="button"
              variant="outline"
              disabled={submitHook.isSubmitting}
              onClick={handleReset}
              className="w-full sm:w-auto h-11 px-8 rounded-xl shadow-sm"
            >
              Reset Form
            </Button>
          )}

          {/* Monthly limit reached message */}
          {isArtistAtMonthlyLimit && (
            <span className="mt-1 block text-xs text-red-500 font-sans break-words sm:max-w-[30vw]">
              <span className="inline-flex items-center gap-1">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>
                  You have reached your monthly upload limit. You cannot upload more artwork this month.
                </span>
              </span>
            </span>
          )}
        </div>
      </form>
    </Form>
  );
}

// ─── Utility: compress image file to base64 ────────────────────────────────

/**
 * Compresses an image File to a base64 JPEG string.
 * Used for AI description generation (reduces payload size).
 *
 * @param {File} file
 * @param {number} maxSize - Max dimension in pixels (default 1024).
 * @param {number} quality - JPEG quality (0–1, default 0.7).
 * @returns {Promise<string>} Base64-encoded JPEG image data.
 */
async function compressImageToBase64(file, maxSize = 1024, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = Math.round((height * maxSize) / width); width = maxSize; }
          else { width = Math.round((width * maxSize) / height); height = maxSize; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality).split(",")[1]);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
