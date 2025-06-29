import React, { useState, useEffect, useRef, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import Alert from "./Alert";
import Loader from "./ui/Loader";
// import { getPreviewUrl } from "../config/cloudinary"; // Keep this for image preview
import { useAuth } from "../contexts/AuthContext";
import {
  trpc,
  useRemainingQuota,
  useBackendLimits,
  baseUrl,
  uploadToCloudinary,
} from "../utils/trpc";
import { toDatetimeLocalValue } from "../utils/formatters";
import ArtistSelect from "./ArtistSelect";
import { getFriendlyErrorMessage } from "../utils/formatters";
import { v4 as uuidv4 } from "uuid";
import ArtworkImageGrid from "./ArtworkImageGrid";

// Progress bar component
function ProgressBar({ progress, label }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-600 font-sans">
        <span>{label}</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Validation schema
const createValidationSchema = (
  isSuperAdmin,
  initialData,
  artistId,
  imageRemoved
) => {
  return yup.object().shape({
    title: yup.string().trim().required("Title is required"),
    material: yup.string().trim().required("Material is required"),
    style: yup.string().trim().required("Style is required"),
    description: yup.string().trim().required("Description is required"),
    price: yup
      .number()
      .typeError("Price must be a number")
      .positive("Price must be greater than 0")
      .required("Price is required"),
    year: yup
      .number()
      .typeError("Year must be a number")
      .min(1900, "Year must be at least 1900")
      .max(new Date().getFullYear() + 1, "Year cannot be in the future")
      .required("Year is required"),
    width: yup
      .number()
      .typeError("Width must be a number")
      .positive("Width must be greater than 0")
      .required("Width is required"),
    height: yup
      .number()
      .typeError("Height must be a number")
      .positive("Height must be greater than 0")
      .required("Height is required"),
    instagramReelLink: yup.string().url("Must be a valid URL").optional(),
    youtubeVideoLink: yup.string().url("Must be a valid URL").optional(),
    artistId: yup.string().when([], {
      is: () => isSuperAdmin && !initialData,
      then: (schema) => schema.required("Artist is required"),
      otherwise: (schema) => schema.optional(),
    }),
    images: yup.array().min(1, "At least one image is required"),
    // Only include expiresAt validation for super admins
    ...(isSuperAdmin && {
      expiresAt: yup
        .date()
        .nullable()
        .typeError("Expiry date must be a valid date")
        .optional(),
    }),
  });
};

// Compress image file to base64 (JPEG, quality 0.7, max width/height 1024px)
async function compressImageToBase64(file, maxSize = 1024, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        // Draw to canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        // Export as JPEG
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl.split(",")[1]); // base64 only
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ArtworkForm({
  onSubmit,
  initialData = null,
  artistId = "",
  setArtistId = () => {},
  selectedArtist = null,
}) {
  const { isSuperAdmin, isArtist, user } = useAuth();

  // 1. Call all hooks that provide data needed by helpers
  const { data: backendLimits, isLoading: loadingBackendLimits } =
    useBackendLimits();
  // Use the correct quota hook for both AI and monthly upload quotas (single call)
  const {
    data: artistQuotaData,
    isLoading: loadingMonthlyUpload,
    error: monthlyUploadError,
    refetch: refetchMonthlyUpload,
  } = useRemainingQuota({ enabled: isArtist });
  const aiLimit =
    artistQuotaData?.ai?.limit ?? backendLimits?.aiDescriptionDaily;
  const aiRemaining = artistQuotaData?.ai?.remaining ?? aiLimit;
  const utils = trpc.useContext();
  const generateAIDescriptionMutation =
    trpc.ai.generateAIDescription.useMutation();

  // 2. Now define helpers that use backendLimits
  const userId = user?.id || "anonymous";
  const FORM_DATA_KEY = `artwork_form_data_${userId}`;
  const DIMENSIONS_KEY = `artwork_dimensions_${userId}`;
  const ARTIST_ID_KEY = `artwork_artist_id_${userId}`;
  const IMAGE_FLAG_KEY = `artwork_form_has_image_${userId}`;

  // Helper: Get default expiresAt value (30 days from now, formatted for datetime-local)
  const getDefaultExpiresAt = () => {
    const now = new Date();
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return toDatetimeLocalValue(future);
  };

  const getInitialFormData = () => {
    if (initialData) {
      let width = "",
        height = "";
      if (initialData.dimensions) {
        const match = initialData.dimensions.match(
          /(\d+(?:\.\d+)?)cm × (\d+(?:\.\d+)?)cm/
        );
        if (match) {
          width = match[1];
          height = match[2];
        }
      }
      return {
        title: initialData.title || "",
        material: initialData.material || "",
        style: initialData.style || "",
        description: initialData.description || "",
        price: initialData.price || "",
        year: initialData.year || new Date().getFullYear(),
        featured: initialData.featured || false,
        sold: initialData.sold || false,
        instagramReelLink: initialData.instagramReelLink || "",
        youtubeVideoLink: initialData.youtubeVideoLink || "",
        monthlyUploadLimit:
          initialData.monthlyUploadLimit ?? backendLimits?.monthlyUpload ?? 10,
        aiDescriptionDailyLimit:
          initialData.aiDescriptionDailyLimit ??
          backendLimits?.aiDescriptionDaily ??
          5,
        artistId: "",
        width: width,
        height: height,
        dimensions: initialData.dimensions || "",
        expiresAt: initialData.expiresAt
          ? toDatetimeLocalValue(new Date(initialData.expiresAt))
          : "",
        status: initialData.status || "ACTIVE",
        images: initialData.images || [],
        // Include imageUploadLimit for superadmins in edit mode
        ...(isSuperAdmin && {
          imageUploadLimit:
            initialData.imageUploadLimit ?? backendLimits?.imageUpload ?? 1,
        }),
      };
    }
    const savedData = localStorage.getItem(FORM_DATA_KEY);
    const savedArtistId = localStorage.getItem(ARTIST_ID_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        const { image, imageFile, imagePreview, ...cleanData } = parsedData;
        return {
          ...cleanData,
          artistId: savedArtistId || cleanData.artistId || "",
          aiDescriptionDailyLimit:
            parsedData.aiDescriptionDailyLimit ??
            backendLimits?.aiDescriptionDaily ??
            5,
          monthlyUploadLimit:
            parsedData.monthlyUploadLimit ?? backendLimits?.monthlyUpload ?? 10,
          status: parsedData.status || "ACTIVE",
          // Only include expiresAt for super admins
          ...(isSuperAdmin && {
            expiresAt: parsedData.expiresAt
              ? toDatetimeLocalValue(parsedData.expiresAt)
              : "",
            imageUploadLimit:
              parsedData.imageUploadLimit ?? backendLimits?.imageUpload ?? 1,
          }),
          images: [],
        };
      } catch (error) {
        console.error("Error parsing saved form data:", error);
      }
    }
    // If super admin and add mode, set expiresAt to 30 days from now
    let expiresAtDefault = "";
    if (isSuperAdmin) {
      expiresAtDefault = getDefaultExpiresAt();
    }
    return {
      title: "",
      material: "",
      style: "",
      description: "",
      price: "",
      year: new Date().getFullYear(),
      featured: false,
      sold: false,
      instagramReelLink: "",
      youtubeVideoLink: "",
      monthlyUploadLimit: backendLimits?.monthlyUpload ?? 10,
      aiDescriptionDailyLimit: backendLimits?.aiDescriptionDaily ?? 5,
      artistId: savedArtistId || "",
      width: "",
      height: "",
      dimensions: "",
      status: "ACTIVE",
      // Only include expiresAt and imageUploadLimit for super admins
      ...(isSuperAdmin && {
        expiresAt: expiresAtDefault,
        imageUploadLimit: backendLimits?.imageUpload ?? 1,
      }),
      images: [],
    };
  };

  const getInitialDimensions = () => {
    if (initialData?.dimensions) {
      const match = initialData.dimensions.match(
        /(\d+(?:\.\d+)?)cm × (\d+(?:\.\d+)?)cm/
      );
      if (match) {
        return { width: match[1], height: match[2] };
      }
    }
    const savedDimensions = localStorage.getItem(DIMENSIONS_KEY);
    if (savedDimensions) {
      try {
        return JSON.parse(savedDimensions);
      } catch (error) {
        console.error("Error parsing saved dimensions:", error);
      }
    }
    return { width: "", height: "" };
  };

  function getInitialImagePreview() {
    return null;
  }

  const clearPersisted = () => {
    localStorage.removeItem(FORM_DATA_KEY);
    localStorage.removeItem(DIMENSIONS_KEY);
    localStorage.removeItem(ARTIST_ID_KEY);
    localStorage.removeItem(IMAGE_FLAG_KEY);
  };

  // Now safe to use getInitialFormData for all state initializations
  const initialFormData = getInitialFormData();

  // Debug: Log initial form data to see if social media links are included
  console.log("Initial form data:", initialFormData);
  console.log("Initial form data keys:", Object.keys(initialFormData));

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(getInitialImagePreview());
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageError, setImageError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savingProgress, setSavingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [artistFieldTouched, setArtistFieldTouched] = useState(false);
  // Track if the monthly upload limit input has been manually changed
  const [monthlyLimitTouched, setMonthlyLimitTouched] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiLimitTouched, setAiLimitTouched] = useState(false);
  // Add state for editArtistUsageStats
  const [editArtistUsageStats, setEditArtistUsageStats] = useState(null);
  // Add a ref to skip the next persist after reset
  const skipNextPersist = useRef(false);
  const isInitialLoad = useRef(true);

  // Only fetch monthly upload count for artists creating new artwork
  const shouldFetchUploadCount = isArtist && !isSuperAdmin && !initialData; // Only for artists (not admins) creating new artwork

  const monthlyUploadCount = artistQuotaData?.monthlyUploads?.used ?? 0;
  const monthlyUploadLimit =
    artistQuotaData?.monthlyUploads?.limit ??
    backendLimits?.monthlyUpload ??
    10;

  // Compute once and reuse: shouldFetchArtistUploadCount
  const shouldFetchArtistUploadCount = Boolean(
    isSuperAdmin && !initialData && artistId && artistId.trim() !== ""
  );

  // Replace the old query with the new one for super admin
  const artistUsageQuery = trpc.artwork.getArtistUsageStats
    ? trpc.artwork.getArtistUsageStats.useQuery
    : undefined;

  const artistUsageStatsQuery = artistUsageQuery
    ? artistUsageQuery(
        { artistId: artistId?.trim() || "" },
        {
          enabled: shouldFetchArtistUploadCount,
          retry: false,
          refetchOnWindowFocus: false,
        }
      )
    : { data: undefined, isLoading: false, error: undefined };

  // Fix: Declare these variables before assignment
  let selectedArtistUploadData,
    loadingSelectedArtistUpload,
    selectedArtistUploadError;
  if (shouldFetchArtistUploadCount) {
    selectedArtistUploadData = artistUsageStatsQuery?.data;
    loadingSelectedArtistUpload = artistUsageStatsQuery?.isLoading || false;
    selectedArtistUploadError = artistUsageStatsQuery?.error;
  } else {
    selectedArtistUploadData = undefined;
    loadingSelectedArtistUpload = false;
    selectedArtistUploadError = undefined;
  }

  const selectedArtistUploadCount =
    selectedArtistUploadData?.monthlyUploadCount ?? 0;
  const selectedArtistUploadLimit =
    selectedArtistUploadData?.monthlyUploadLimit ?? 10;
  const selectedArtistName =
    selectedArtistUploadData?.artistName ??
    selectedArtist?.artistName ??
    "Selected Artist";

  const selectedArtistAiLimit =
    selectedArtistUploadData?.aiDescriptionDailyLimit ?? 5;

  // Material and style options
  const materialOptions = [
    "Oil on Canvas",
    "Acrylic on Canvas",
    "Watercolor on Paper",
    "Mixed Media",
    "Digital Art",
    "Sculpture",
    "Photography",
    "Printmaking",
    "Collage",
    "Drawing",
    "Other",
  ];

  const styleOptions = [
    "Abstract",
    "Realistic",
    "Impressionist",
    "Expressionist",
    "Surrealist",
    "Contemporary",
    "Traditional",
    "Modern",
    "Landscape",
    "Portrait",
    "Still Life",
    "Other",
  ];

  // Create validation schema inside component to have access to current props and state
  const validationSchema = useMemo(() => {
    return createValidationSchema(
      isSuperAdmin,
      initialData,
      artistId,
      imageRemoved
    );
  }, [isSuperAdmin, initialData, artistId, imageRemoved]);

  // Custom resolver that handles dynamic validation by passing a reactive context
  const customResolver = useMemo(() => {
    return yupResolver(validationSchema);
  }, [validationSchema]);

  // Initialize form with React Hook Form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    clearErrors,
    formState: { errors, isSubmitted, isDirty },
    reset,
  } = useForm({
    resolver: customResolver,
    mode: "onSubmit",
    defaultValues: initialFormData,
    context: { initialData },
  });

  const watchedValues = watch();

  // Debug: Log watched values to see if social media links are being tracked
  console.log("Watched values:", watchedValues);
  console.log("Watched values keys:", Object.keys(watchedValues));

  // State for multiple images (store File or {file, preview, ...} objects)
  const [images, setImages] = useState(() => {
    const initialImages = initialFormData.images || [];
    if (initialData?.images) {
      return initialData.images.map((img) => ({
        ...img,
        preview: img.url,
        uploaded: true,
        uuid: img.id || uuidv4(),
      }));
    }
    return initialImages;
  });

  const imageUploadLimit =
    initialData?.imageUploadLimit || backendLimits?.imageUpload || 1; // Use backend config, fallback to 1
  const [imageErrors, setImageErrors] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isAutoDismissible, setIsAutoDismissible] = useState(false);

  // Update form images value when component mounts
  useEffect(() => {
    setValue("images", images, { shouldValidate: false });
  }, []); // Only run once on mount

  // Sync images state with form field whenever images change
  useEffect(() => {
    setValue("images", images, { shouldValidate: false });
  }, [images, setValue]);

  // Handle images validation error and show in alert
  useEffect(() => {
    // If images are present, clear any validation errors
    if (images && images.length > 0) {
      setValidationErrors([]);
      return;
    }

    // Only show validation errors if no images are present
    if (errors.images?.message) {
      setValidationErrors([errors.images.message]);
    } else if (validationErrors.length > 0) {
      // Clear validation errors if validation passes
      setValidationErrors([]);
    }
  }, [errors.images?.message, validationErrors.length, images]);

  // Mark artist field as touched if there's a saved artist ID
  useEffect(() => {
    if (!initialData && isSuperAdmin) {
      const savedArtistId = localStorage.getItem(ARTIST_ID_KEY);
      if (savedArtistId) {
        setArtistFieldTouched(true);
      }
    }
  }, [initialData, isSuperAdmin, ARTIST_ID_KEY]);

  // Initialize dimensions state
  const [dimensionInputs, setDimensionInputs] = useState(
    getInitialDimensions()
  );

  // Restore artist ID from localStorage (only for new artwork)
  useEffect(() => {
    if (!initialData && isSuperAdmin) {
      const savedArtistId = localStorage.getItem(ARTIST_ID_KEY);
      if (savedArtistId && setArtistId) {
        setArtistId(savedArtistId);
        setValue("artistId", savedArtistId, { shouldValidate: true });
        // Mark artist field as touched to show it's been interacted with
        setArtistFieldTouched(true);
      }
    }
  }, [initialData, isSuperAdmin, setArtistId, setValue, ARTIST_ID_KEY]);

  // Persist form data, dimensions, and artist ID on change (Add mode only)
  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    // Always persist data on any change (add mode only)
    if (!initialData) {
      // Include artistId in the form data being saved, but exclude image data
      const formDataToSave = {
        ...watchedValues,
        artistId: watchedValues.artistId || artistId, // Use form value or prop value
        monthlyUploadLimit: watchedValues.monthlyUploadLimit, // Save monthly upload limit
        aiDescriptionDailyLimit: watchedValues.aiDescriptionDailyLimit, // Save AI limit
      };

      // Remove image-related data before saving to localStorage
      const { image, imageFile, imagePreview, ...cleanFormData } =
        formDataToSave;

      localStorage.setItem(FORM_DATA_KEY, JSON.stringify(cleanFormData));
      localStorage.setItem(DIMENSIONS_KEY, JSON.stringify(dimensionInputs));
      if (isSuperAdmin && artistId) {
        localStorage.setItem(ARTIST_ID_KEY, artistId);
      }
    }
  }, [
    watchedValues,
    dimensionInputs,
    artistId,
    initialData,
    isSuperAdmin,
    FORM_DATA_KEY,
    DIMENSIONS_KEY,
    ARTIST_ID_KEY,
  ]);

  const hasFormDataButNoImage = (() => {
    if (initialData) return false; // Don't show for edit mode
    if (images && images.length > 0) return false; // Don't show if images exist

    // The key condition: only show the warning if an image was previously
    // selected in this session before the refresh.
    const hadImage = localStorage.getItem(IMAGE_FLAG_KEY) === "true";
    if (!hadImage) return false;

    // Also check if there's meaningful saved text data.
    const savedData = localStorage.getItem(FORM_DATA_KEY);
    if (!savedData) return false;

    try {
      const parsedData = JSON.parse(savedData);
      // Only show if there's actual form content (not just default values)
      const hasContent = !!(
        parsedData.title ||
        parsedData.material ||
        parsedData.style ||
        parsedData.description ||
        parsedData.price ||
        (parsedData.year && parsedData.year !== new Date().getFullYear())
      );

      console.log("Form data restoration check:", {
        initialData,
        imagesLength: images?.length,
        hadImage,
        savedData: !!savedData,
        hasContent,
        imageRemoved,
      });

      return hasContent;
    } catch {
      return false;
    }
  })();

  // Handle dimension changes
  const handleDimensionChange = (field, value) => {
    const newDimensions = { ...dimensionInputs, [field]: value };
    setDimensionInputs(newDimensions);

    // Update the main form data with formatted dimensions
    if (newDimensions.width && newDimensions.height) {
      const formattedDimensions = `${newDimensions.width}cm × ${newDimensions.height}cm`;
      setValue("dimensions", formattedDimensions, { shouldValidate: true });
    } else {
      setValue("dimensions", "", { shouldValidate: true });
    }
  };

  // Handle image change

  // Handle monthly upload limit change
  const handleMonthlyLimitChange = (e) => {
    setMonthlyLimitTouched(true);
    const value =
      e.target.value === ""
        ? ""
        : Math.max(1, Math.min(1000, Number(e.target.value)));
    setValue("monthlyUploadLimit", value);
  };

  // Update monthlyUploadLimit when selected artist changes (for super admin add mode)
  useEffect(() => {
    if (isInitialLoad.current) return;
    if (
      isSuperAdmin &&
      !initialData &&
      selectedArtistUploadLimit !== undefined &&
      selectedArtistUploadLimit !== null &&
      !monthlyLimitTouched
    ) {
      setValue("monthlyUploadLimit", selectedArtistUploadLimit, {
        shouldValidate: true,
      });
    }
  }, [
    isSuperAdmin,
    initialData,
    selectedArtistUploadLimit,
    setValue,
    monthlyLimitTouched,
  ]);

  // Reset touched state when selected artist changes
  useEffect(() => {
    setMonthlyLimitTouched(false);
    setAiLimitTouched(false);
  }, [artistId]);

  // Update aiDescriptionDailyLimit when selected artist changes (for super admin add mode)
  useEffect(() => {
    if (isInitialLoad.current) return;
    if (
      isSuperAdmin &&
      !initialData &&
      selectedArtistAiLimit !== undefined &&
      selectedArtistAiLimit !== null &&
      !aiLimitTouched
    ) {
      setValue("aiDescriptionDailyLimit", selectedArtistAiLimit, {
        shouldValidate: true,
      });
    }
  }, [
    isSuperAdmin,
    initialData,
    selectedArtistAiLimit,
    setValue,
    aiLimitTouched,
  ]);

  // Get field error class
  const getFieldErrorClass = (fieldName) => {
    return errors[fieldName]
      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
      : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500";
  };

  // Handle expiry date change
  const handleExpiryDateChange = (e) => {
    const newDate = e.target.value;

    if (newDate) {
      const selectedDate = new Date(newDate);
      const now = new Date();

      // If date is in the past, set to EXPIRED
      if (selectedDate < now) {
        setValue("status", "EXPIRED", { shouldValidate: true });
      }
      // If date is in the future and current status is EXPIRED, set to ACTIVE
      else if (selectedDate > now && watchedValues.status === "EXPIRED") {
        setValue("status", "ACTIVE", { shouldValidate: true });
      }
    }
  };

  // AI Description Handler
  const handleAIDescription = async () => {
    setAiError("");
    setAiLoading(true);
    try {
      // Get the first image from the images array
      let imageData = null;
      const firstImage = images[0];

      if (firstImage) {
        if (firstImage.file) {
          // New image file - compress and convert to base64
          imageData = await compressImageToBase64(firstImage.file);
        } else if (
          firstImage.preview &&
          firstImage.preview.startsWith("data:")
        ) {
          // Existing base64 preview
          imageData = firstImage.preview.split(",")[1];
        } else if (firstImage.url) {
          // Existing uploaded image - fetch and convert to base64
          const response = await fetch(firstImage.url);
          const blob = await response.blob();
          const reader = new FileReader();
          imageData = await new Promise((resolve, reject) => {
            reader.onload = () => {
              const base64 = reader.result.split(",")[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      }

      if (!imageData) {
        setAiError("Please upload at least one image first.");
        setAiLoading(false);
        return;
      }

      const data = await generateAIDescriptionMutation.mutateAsync({
        imageData,
      });
      if (data?.description) {
        setValue("description", data.description, { shouldValidate: true });
      }
      // Invalidate quota so it refetches
      utils.misc.getRemainingQuota.invalidate();
    } catch (err) {
      console.error("AI description error:", err);
      setAiError(getFriendlyErrorMessage(err));
    } finally {
      setAiLoading(false);
    }
  };

  // Handle image file selection (just preview, no upload)
  const handleImageFiles = (files) => {
    let newImages = [...images];
    let errors = [];
    let removedFiles = [];
    // Super admins can upload up to 1000 images, artists are limited by imageUploadLimit
    const maxImages = isSuperAdmin ? 1000 : imageUploadLimit;

    for (let file of files) {
      if (newImages.length >= maxImages) {
        errors.push("Image upload limit reached.");
        break;
      }

      // Only allow image types
      if (!file.type.startsWith("image/")) {
        removedFiles.push(`${file.name} (not a valid image file)`);
        continue;
      }

      // File size check
      const MAX_SIZE_MB = backendLimits?.fileSizeMB ?? 5;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        removedFiles.push(`${file.name} (too large, max ${MAX_SIZE_MB}MB)`);
        continue;
      }

      // If we get here, file is valid
      newImages.push({
        file,
        preview: URL.createObjectURL(file),
        uploaded: false,
        order: newImages.length,
        uuid: uuidv4(),
      });
    }

    setImages(newImages);

    // Set image flag in localStorage when images are added
    if (newImages.length > 0) {
      localStorage.setItem(IMAGE_FLAG_KEY, "true");
      setImageRemoved(false);
    }

    // Show temporary notification for removed files instead of persistent errors
    if (removedFiles.length > 0) {
      const message =
        removedFiles.length === 1
          ? `File "${removedFiles[0]}" was not added because it exceeds the ${
              backendLimits?.fileSizeMB ?? 5
            }MB limit.`
          : `${
              removedFiles.length
            } files were not added because they exceed the ${
              backendLimits?.fileSizeMB ?? 5
            }MB limit or are not valid image files.`;
      setImageErrors([message]);
      setIsAutoDismissible(true);

      // Auto-clear the error after 5 seconds
      setTimeout(() => {
        setImageErrors([]);
        setIsAutoDismissible(false);
      }, 5000);
    } else if (errors.length > 0) {
      setImageErrors(errors);
      setIsAutoDismissible(false);
    } else {
      setImageErrors([]);
      setIsAutoDismissible(false);
    }

    // Remove image flag from localStorage if no images remain
    if (newImages.length === 0) {
      localStorage.removeItem(IMAGE_FLAG_KEY);
      setImageRemoved(true);
    }
  };

  // Remove image
  const handleRemoveImage = (idx) => {
    const removed = images[idx];

    // Prevent artists from removing carousel images
    if (removed?.showInCarousel && !isSuperAdmin) {
      const errorMessage =
        "Cannot remove carousel image. This image is used in the homepage carousel. Please contact an administrator if you need to remove it.";
      setImageErrors([errorMessage]);
      setIsAutoDismissible(false);
      return;
    }

    if (removed && removed.preview && !removed.uploaded) {
      URL.revokeObjectURL(removed.preview);
    }

    // Check if the removed image was marked for carousel
    const wasCarouselImage = removed?.showInCarousel;

    const newImages = images
      .filter((_, i) => i !== idx)
      .map((img, i) => ({
        ...img,
        order: i,
        // Preserve showInCarousel property
        showInCarousel: img.showInCarousel || false,
      }));

    // If we removed a carousel image and there are remaining images,
    // automatically assign carousel to the first remaining image
    if (wasCarouselImage && newImages.length > 0) {
      newImages[0].showInCarousel = true;

      // Show notification to user about automatic reassignment
      const notificationMessage =
        "The carousel image was automatically reassigned to the first remaining image to keep your artwork visible in the carousel.";
      setImageErrors([notificationMessage]);
      setIsAutoDismissible(true);

      // Auto-clear the notification after 5 seconds
      setTimeout(() => {
        setImageErrors([]);
        setIsAutoDismissible(false);
      }, 5000);
    }

    setImages(newImages);

    // Remove image flag from localStorage if no images remain
    if (newImages.length === 0) {
      localStorage.removeItem(IMAGE_FLAG_KEY);
      setImageRemoved(true);
    }
  };

  // Dismiss error messages
  const handleDismissErrors = () => {
    setImageErrors([]);
    setIsAutoDismissible(false);
  };

  // On form submit: upload new images, then submit
  const handleFormSubmit = async (formData) => {
    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    // Check if images exist before proceeding
    if (!images || images.length === 0) {
      setValidationErrors(["At least one image is required"]);
      return;
    }

    // Clear any existing validation errors
    setValidationErrors([]);

    // Ensure images are properly set in form data
    setValue("images", images, { shouldValidate: false });

    console.log("Form submission - images:", images);
    console.log("Form submission - images length:", images.length);

    // Trigger validation for all fields, including images
    const isValid = await trigger();
    if (!isValid) {
      console.log("Form validation failed");
      return;
    }

    // Ensure imageUploadLimit is a number before submit
    if (
      formData.imageUploadLimit !== undefined &&
      formData.imageUploadLimit !== null &&
      typeof formData.imageUploadLimit !== "number"
    ) {
      formData.imageUploadLimit = Number(formData.imageUploadLimit);
    }
    setIsSubmitting(true);
    setCurrentStep("uploading");
    setUploadProgress(0);
    setImageErrors([]);
    let uploadErrors = [];
    let uploadedImages = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const prevProgress = Math.round((i / images.length) * 100);
      const nextProgress = Math.round(((i + 1) / images.length) * 100);
      if (img.uploaded) {
        uploadedImages.push({
          url: img.url,
          cloudinary_public_id: img.cloudinary_public_id,
          order: i,
          id: img.id,
          showInCarousel: img.showInCarousel || false,
        });
        // Animate progress bar from prevProgress to nextProgress
        for (let p = prevProgress + 1; p <= nextProgress; p++) {
          setUploadProgress(p);
          await new Promise((res) => setTimeout(res, 8));
        }
      } else if (img.file instanceof File) {
        try {
          // Animate progress bar in small increments while uploading
          let fakeProgress = prevProgress;
          let stopFake = false;
          const fakeInterval = setInterval(() => {
            if (fakeProgress < nextProgress - 5) {
              fakeProgress++;
              setUploadProgress(fakeProgress);
            }
          }, 20);
          const cloudinaryResult = await uploadToCloudinary(img.file);
          stopFake = true;
          clearInterval(fakeInterval);
          setUploadProgress(nextProgress);
          if (!cloudinaryResult || !cloudinaryResult.secure_url) {
            uploadErrors.push(`Image upload failed for ${img.file.name}.`);
            continue;
          }
          uploadedImages.push({
            url: cloudinaryResult.secure_url,
            cloudinary_public_id: cloudinaryResult.public_id,
            order: i,
            showInCarousel: img.showInCarousel || false,
          });
        } catch (err) {
          setUploadProgress(nextProgress);
          uploadErrors.push(`Image upload failed for ${img.file.name}.`);
        }
      } else {
        uploadErrors.push(
          `Image file missing or invalid for ${
            img.file?.name || img.preview || "unknown"
          }.`
        );
        setUploadProgress(nextProgress);
      }
    }
    if (uploadErrors.length > 0) {
      setImageErrors([...new Set(uploadErrors)]);
      setIsAutoDismissible(false);
      setIsSubmitting(false);
      setCurrentStep(null); // Reset step
      return;
    }
    setCurrentStep("saving");
    setSavingProgress(0);
    // Simulate saving progress (or update as needed)
    setSavingProgress(100);
    // Submit form with images array
    const payload = {
      ...formData,
      images: uploadedImages,
    };

    // Debug: Log the payload to see what's being submitted
    console.log("Form submission payload:", payload);
    console.log("Form data keys:", Object.keys(formData));
    console.log("Instagram reel link:", formData.instagramReelLink);
    console.log("YouTube video link:", formData.youtubeVideoLink);

    // Remove expiresAt field for artists (only super admins should have this field)
    if (!isSuperAdmin) {
      delete payload.expiresAt;
    }

    try {
      await onSubmit(payload);
      clearPersisted();
      // Clear validation errors on successful submission
      clearErrors();
      setImageErrors([]);
      setValidationErrors([]);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      console.error("Form submission error:", err);
    } finally {
      setIsSubmitting(false);
      setCurrentStep(null); // Reset after done
      setUploadProgress(0);
      setSavingProgress(0);
    }
  };

  // Scroll to top if validation fails on submit

  // Get the current step label for display
  const getStepLabel = () => {
    switch (currentStep) {
      case "uploading":
        return images && images.length > 1
          ? "Uploading images..."
          : "Uploading image...";
      case "saving":
        return initialData ? "Updating artwork..." : "Saving artwork...";
      default:
        return "Processing...";
    }
  };

  // Add a handler for the AI limit field
  const handleAiLimitChange = (e) => {
    setAiLimitTouched(true);
    const value =
      e.target.value === ""
        ? ""
        : Math.max(1, Math.min(100, Number(e.target.value)));
    setValue("aiDescriptionDailyLimit", value);
  };

  // Fetch usage stats for the artist in edit mode (super admin)
  useEffect(() => {
    async function fetchEditArtistUsageStats() {
      if (
        isSuperAdmin &&
        initialData &&
        (initialData.userId || initialData.artistId)
      ) {
        try {
          const artistId = initialData.userId || initialData.artistId;
          const response = await fetch(
            baseUrl +
              "/trpc/artwork.getArtistUsageStats?input=" +
              encodeURIComponent(JSON.stringify({ artistId })),
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          const json = await response.json();
          // TRPC returns { result: { data: ... } }
          setEditArtistUsageStats(json?.result?.data ?? null);
        } catch (err) {
          console.error("Error fetching artist usage stats:", err);
        }
      }
    }
    fetchEditArtistUsageStats();
  }, [isSuperAdmin, initialData]);

  // Clean up object URLs when images are removed or component unmounts
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.preview && !img.uploaded) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [images]);

  // When images change, auto-update imageUploadLimit to match images.length for super admins
  useEffect(() => {
    if (
      isSuperAdmin &&
      images.length >
        (watch("imageUploadLimit") ||
          initialData?.imageUploadLimit ||
          backendLimits?.imageUpload ||
          1)
    ) {
      setValue("imageUploadLimit", images.length);
    }
  }, [
    images.length,
    isSuperAdmin,
    initialData,
    setValue,
    watch,
    backendLimits?.imageUpload,
  ]);

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6 font-sans"
    >
      {/* Show loading state when backend limits are being fetched */}
      {/* {loadingBackendLimits && (
        <div className="my-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-sm text-blue-700 font-sans">
                Loading configuration...
              </span>
            </div>
          </div>
        </div>
      )} */}

      {/* Error Summary at the top */}
      {/* {showErrorSummary && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-red-800 font-sans mb-1">
                Please fix the following errors:
              </h3>
              <ul className="list-disc pl-5 text-sm text-red-700 font-sans">
                {Object.entries(errors).map(([field, err]) => (
                  <li key={field}>
                    {err.message ||
                      (err[0] && err[0].message) ||
                      "Invalid value"}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )} */}

      {/* Show artist name above image label in edit mode for admins */}
      {isSuperAdmin && initialData && initialData.artistName && (
        <div className="flex justify-center mb-2">
          <span className="text-lg font-semibold text-gray-700 font-artistic text-center">
            Artwork by: {initialData.artistName}
          </span>
        </div>
      )}

      {/* Page refresh notification */}
      {hasFormDataButNoImage && !imageRemoved && (
        <div className="my-4">
          {console.log("Rendering form data restoration notification")}
          <Alert
            type="warning"
            message={
              <>
                <h3 className="font-semibold">Form data restored</h3>
                <div className="mt-1">
                  <p>
                    Your form data was saved from your previous session, but the
                    image was lost during page refresh. Please upload your image
                    again to continue.
                  </p>
                </div>
              </>
            }
          />
        </div>
      )}

      {/* Monthly Upload Count Display - Only for Artists */}
      {shouldFetchUploadCount && (
        <div className="my-4">
          {loadingMonthlyUpload ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-sm text-blue-700 font-sans">
                  Loading upload count...
                </span>
              </div>
            </div>
          ) : monthlyUploadError ? (
            <Alert
              type="error"
              message={`Failed to load upload count: ${monthlyUploadError.message}`}
              onRetry={refetchMonthlyUpload}
            />
          ) : (
            <Alert
              type={
                monthlyUploadCount >= monthlyUploadLimit
                  ? "error"
                  : monthlyUploadCount >= monthlyUploadLimit * 0.8
                  ? "warning"
                  : "info"
              }
              message={
                monthlyUploadCount >= monthlyUploadLimit
                  ? `Monthly upload limit reached (${monthlyUploadCount}/${monthlyUploadLimit}). You cannot upload more artwork this month.`
                  : monthlyUploadCount >= monthlyUploadLimit * 0.8
                  ? `Monthly upload count: ${monthlyUploadCount}/${monthlyUploadLimit}. You're approaching your limit.`
                  : `Monthly upload count: ${monthlyUploadCount}/${monthlyUploadLimit}`
              }
            />
          )}
        </div>
      )}

      {/* For admins: fetch selected artist's upload count */}
      {isSuperAdmin && !initialData && shouldFetchArtistUploadCount && (
        <div className="my-4">
          {loadingSelectedArtistUpload ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-sm text-blue-700 font-sans">
                  Loading {selectedArtistName}'s upload count...
                </span>
              </div>
            </div>
          ) : selectedArtistUploadError ? (
            <Alert
              type="error"
              message={`Failed to load selected artist's upload count: ${selectedArtistUploadError.message}`}
              onRetry={refetchSelectedArtistUpload}
            />
          ) : (
            <Alert
              type={
                selectedArtistUploadCount >= selectedArtistUploadLimit
                  ? "error"
                  : selectedArtistUploadCount >= selectedArtistUploadLimit * 0.8
                  ? "warning"
                  : "info"
              }
              message={
                selectedArtistUploadCount >= selectedArtistUploadLimit
                  ? `${selectedArtistName}'s monthly upload limit reached (${selectedArtistUploadCount}/${selectedArtistUploadLimit}).`
                  : selectedArtistUploadCount >= selectedArtistUploadLimit * 0.8
                  ? `${selectedArtistName}'s monthly upload count: ${selectedArtistUploadCount}/${selectedArtistUploadLimit}. They're approaching their limit.`
                  : `${selectedArtistName}'s monthly upload count: ${selectedArtistUploadCount}/${selectedArtistUploadLimit}`
              }
            />
          )}
        </div>
      )}

      {/* Image Upload Section */}
      <ArtworkImageGrid
        images={images}
        setImages={setImages}
        imageUploadLimit={isSuperAdmin ? 1000 : imageUploadLimit}
        imageErrors={imageErrors}
        validationErrors={validationErrors}
        onFilesSelected={handleImageFiles}
        onRemoveImage={handleRemoveImage}
        onDismissErrors={handleDismissErrors}
        fileSizeMB={backendLimits?.fileSizeMB ?? 5}
        isAutoDismissible={isAutoDismissible}
        isSuperAdmin={isSuperAdmin}
        validationError={isSubmitted ? errors.images?.message : null}
        setImageErrors={setImageErrors}
        setIsAutoDismissible={setIsAutoDismissible}
      />

      {/* Form Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Artist Selection - Only for Super Admin and only in Add mode */}
        {isSuperAdmin && !initialData && (
          <div className="col-span-2">
            <label
              htmlFor="artistSelect"
              className="block text-sm font-medium text-gray-700 font-sans mb-1"
            >
              Select Artist <span className="text-red-500">*</span>
            </label>
            <Controller
              name="artistId"
              control={control}
              render={({ field }) => (
                <ArtistSelect
                  value={field.value}
                  onChange={(id) => {
                    field.onChange(id);
                    trigger("artistId");
                    if (isSuperAdmin && setArtistId) {
                      setArtistId(id);
                    }
                    isInitialLoad.current = false;
                  }}
                  error={!!errors.artistId}
                />
              )}
            />
            {errors.artistId && (isSubmitted || artistFieldTouched) && (
              <div className="mt-2">
                <p className="text-sm text-red-600 mt-1 font-sans">
                  {errors.artistId?.message || "Artist is required"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <div className="col-span-2">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 font-sans mb-1"
          >
            Title <span className="text-red-500">*</span>
          </label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                id="title"
                placeholder="Enter the artwork title"
                className={`mt-1 block w-full border rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:border-transparent focus:outline-none font-sans ${getFieldErrorClass(
                  "title"
                )}`}
              />
            )}
          />
          {errors.title && (
            <p className="text-sm text-red-600 mt-1 font-sans">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="col-span-2">
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700 font-sans mb-1"
          >
            Price <span className="text-red-500">*</span>
          </label>
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                id="price"
                placeholder="Enter price in INR"
                min="0"
                step="1"
                className={`mt-1 block w-full border rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:border-transparent focus:outline-none font-sans ${getFieldErrorClass(
                  "price"
                )}`}
              />
            )}
          />
          {errors.price && (
            <p className="text-sm text-red-600 mt-1 font-sans">
              {errors.price.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-1">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 font-sans"
            >
              Description <span className="text-red-500">*</span>
            </label>
            {isSuperAdmin && initialData && editArtistUsageStats ? (
              <span className="text-xs text-gray-500 font-sans">
                AI description usage:{" "}
                <span className="font-semibold">
                  {editArtistUsageStats.aiDescriptionUsed ?? 0}
                </span>
                /
                <span className="font-semibold">
                  {editArtistUsageStats.aiDescriptionDailyLimit ??
                    backendLimits?.aiDescriptionDaily ??
                    5}
                </span>{" "}
                used today
              </span>
            ) : isSuperAdmin && !initialData && selectedArtistUploadData ? (
              <span className="text-xs text-gray-500 font-sans">
                {selectedArtistName}'s AI description usage:{" "}
                <span className="font-semibold">
                  {selectedArtistUploadData.aiDescriptionUsed ?? 0}
                </span>
                /
                <span className="font-semibold">
                  {selectedArtistUploadData.aiDescriptionDailyLimit ??
                    backendLimits?.aiDescriptionDaily ??
                    5}
                </span>{" "}
                used today
              </span>
            ) : isArtist &&
              typeof aiRemaining === "number" &&
              typeof aiLimit === "number" ? (
              <span className="text-xs text-gray-500 font-sans">
                AI description usage:{" "}
                <span className="font-semibold">{aiLimit - aiRemaining}</span>/
                <span className="font-semibold">{aiLimit}</span> used today
              </span>
            ) : null}
          </div>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                id="description"
                rows={4}
                placeholder="Describe the artwork, its inspiration, and any unique features or generate with AI"
                className={`mt-1 block w-full border rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:border-transparent focus:outline-none font-sans resize-none min-h-[150px] ${getFieldErrorClass(
                  "description"
                )}`}
              />
            )}
          />
          <div className="flex flex-row items-center gap-x-2 mt-2">
            <button
              type="button"
              className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white text-sm rounded-lg shadow hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 w-fit whitespace-nowrap"
              onClick={handleAIDescription}
              disabled={
                aiLoading ||
                images.length === 0 ||
                (isArtist && aiRemaining <= 0)
              }
              title={
                isArtist && aiRemaining <= 0
                  ? "You have reached your daily AI description limit"
                  : images.length === 0
                  ? "Please upload at least one image first to generate AI description"
                  : "Generate description using AI (uses the first image)"
              }
            >
              {aiLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  AI Generate
                </>
              )}
            </button>
            {isArtist && aiRemaining <= 0 && !aiLoading && (
              <span className="text-xs text-red-500 font-sans break-words max-w-[70vw]">
                🚫 You have reached your daily AI description limit
              </span>
            )}
            {images.length === 0 && !aiLoading && (
              <span className="text-xs text-gray-500 font-sans break-words max-w-[70vw]">
                💡 Upload at least one image to use AI description generation
              </span>
            )}
            {images.length > 1 && !aiLoading && (
              <span className="text-xs text-blue-600 font-sans break-words max-w-[70vw]">
                ℹ️ AI will generate description from the first image
              </span>
            )}
          </div>
          {aiError && (
            <div className="mt-2">
              <p className="text-sm text-red-600 mt-1 font-sans">{aiError}</p>
            </div>
          )}
          {errors.description && (
            <p className="text-sm text-red-600 mt-1 font-sans">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Dimensions - Split into Width and Height */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 font-sans mb-1">
            Dimensions <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="width"
                className="block text-xs text-gray-500 mb-1 font-sans"
              >
                Width (cm)
              </label>
              <Controller
                name="width"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    id="width"
                    placeholder="24"
                    min="0.1"
                    step="0.1"
                    onChange={(e) => {
                      field.onChange(e);
                      handleDimensionChange("width", e.target.value);
                    }}
                    className={`block w-full border rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:border-transparent focus:outline-none font-sans ${getFieldErrorClass(
                      "width"
                    )}`}
                  />
                )}
              />
              {errors.width && (
                <p className="text-sm text-red-600 mt-1 font-sans">
                  {errors.width.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="height"
                className="block text-xs text-gray-500 mb-1 font-sans"
              >
                Height (cm)
              </label>
              <Controller
                name="height"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    id="height"
                    placeholder="36"
                    min="0.1"
                    step="0.1"
                    onChange={(e) => {
                      field.onChange(e);
                      handleDimensionChange("height", e.target.value);
                    }}
                    className={`block w-full border rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:border-transparent focus:outline-none font-sans ${getFieldErrorClass(
                      "height"
                    )}`}
                  />
                )}
              />
              {errors.height && (
                <p className="text-sm text-red-600 mt-1 font-sans">
                  {errors.height.message}
                </p>
              )}
            </div>
          </div>
          {watchedValues.dimensions && (
            <p className="mt-2 text-sm text-gray-600 font-sans">
              Preview:{" "}
              <span className="font-medium">{watchedValues.dimensions}</span>
            </p>
          )}
        </div>

        {/* Material - Dropdown */}
        <div className="col-span-2 sm:col-span-1">
          <label
            htmlFor="material"
            className="block text-sm font-medium text-gray-700 font-sans mb-1"
          >
            Material <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Controller
              name="material"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  id="material"
                  className={`mt-1 block w-full border rounded-xl shadow-sm py-3 px-4 pr-10 focus:ring-2 focus:border-transparent focus:outline-none font-sans bg-white appearance-none ${getFieldErrorClass(
                    "material"
                  )}`}
                >
                  <option value="">Select material</option>
                  {materialOptions.map((material) => (
                    <option
                      key={material}
                      value={material}
                      className="font-sans"
                    >
                      {material}
                    </option>
                  ))}
                </select>
              )}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 9l4 4 4-4"
                />
              </svg>
            </div>
          </div>
          {errors.material && (
            <p className="text-sm text-red-600 mt-1 font-sans">
              {errors.material.message}
            </p>
          )}
        </div>

        {/* Style - Dropdown */}
        <div className="col-span-2 sm:col-span-1">
          <label
            htmlFor="style"
            className="block text-sm font-medium text-gray-700 font-sans mb-1"
          >
            Style <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Controller
              name="style"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  id="style"
                  className={`mt-1 block w-full border rounded-xl shadow-sm py-3 px-4 pr-10 focus:ring-2 focus:border-transparent focus:outline-none font-sans bg-white appearance-none ${getFieldErrorClass(
                    "style"
                  )}`}
                >
                  <option value="">Select style</option>
                  {styleOptions.map((style) => (
                    <option key={style} value={style} className="font-sans">
                      {style}
                    </option>
                  ))}
                </select>
              )}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 9l4 4 4-4"
                />
              </svg>
            </div>
          </div>
          {errors.style && (
            <p className="text-sm text-red-600 mt-1 font-sans">
              {errors.style.message}
            </p>
          )}
        </div>

        {/* Instagram Link */}
        <div className="col-span-2 sm:col-span-1">
          <label
            htmlFor="instagramReelLink"
            className="block text-sm font-medium text-gray-700 font-sans mb-1"
          >
            Instagram Link
          </label>
          <Controller
            name="instagramReelLink"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="url"
                id="instagramReelLink"
                placeholder="https://www.instagram.com/reel/..."
                className={`mt-1 block w-full border rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:border-transparent focus:outline-none font-sans ${getFieldErrorClass(
                  "instagramReelLink"
                )}`}
              />
            )}
          />
          {errors.instagramReelLink && (
            <p className="text-sm text-red-600 mt-1 font-sans">
              {errors.instagramReelLink.message}
            </p>
          )}
        </div>

        {/* YouTube Video Link */}
        <div className="col-span-2 sm:col-span-1">
          <label
            htmlFor="youtubeVideoLink"
            className="block text-sm font-medium text-gray-700 font-sans mb-1"
          >
            YouTube Video Link
          </label>
          <Controller
            name="youtubeVideoLink"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="url"
                id="youtubeVideoLink"
                placeholder="https://www.youtube.com/watch?v=..."
                className={`mt-1 block w-full border rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:border-transparent focus:outline-none font-sans ${getFieldErrorClass(
                  "youtubeVideoLink"
                )}`}
              />
            )}
          />
          {errors.youtubeVideoLink && (
            <p className="text-sm text-red-600 mt-1 font-sans">
              {errors.youtubeVideoLink.message}
            </p>
          )}
        </div>

        {/* Year */}
        <div className="col-span-2">
          <label
            htmlFor="year"
            className="block text-sm font-medium text-gray-700 font-sans mb-1"
          >
            Year <span className="text-red-500">*</span>
          </label>
          <Controller
            name="year"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                id="year"
                placeholder={new Date().getFullYear().toString()}
                min="1800"
                max={new Date().getFullYear()}
                className={`mt-1 block w-full border rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:border-transparent focus:outline-none font-sans ${getFieldErrorClass(
                  "year"
                )}`}
              />
            )}
          />
          {errors.year && (
            <p className="text-sm text-red-600 mt-1 font-sans">
              {errors.year.message}
            </p>
          )}
        </div>

        {/* Super Admin: Status - Dropdown */}
        {isSuperAdmin && (
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 font-sans mb-1">
              Status
            </label>
            <div className="relative">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={`mt-1 block w-full border rounded-xl shadow-sm py-3 px-4 pr-10 focus:ring-2 focus:border-transparent focus:outline-none font-sans bg-white appearance-none ${
                      watchedValues.expiresAt &&
                      new Date(watchedValues.expiresAt) < new Date()
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      // Prevent setting ACTIVE or INACTIVE status if expiry date is in the past
                      const currentExpiresAt = watchedValues.expiresAt;
                      if (
                        (newStatus === "ACTIVE" || newStatus === "INACTIVE") &&
                        currentExpiresAt &&
                        new Date(currentExpiresAt) < new Date()
                      ) {
                        return; // Don't update status
                      }
                      field.onChange(newStatus);
                    }}
                  >
                    <option
                      value="ACTIVE"
                      className="font-sans"
                      disabled={
                        watchedValues.expiresAt &&
                        new Date(watchedValues.expiresAt) < new Date()
                      }
                    >
                      Active
                    </option>
                    <option
                      value="INACTIVE"
                      className="font-sans"
                      disabled={
                        watchedValues.expiresAt &&
                        new Date(watchedValues.expiresAt) < new Date()
                      }
                    >
                      Inactive
                    </option>
                    <option value="EXPIRED" className="font-sans">
                      Expired
                    </option>
                  </select>
                )}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 9l4 4 4-4"
                  />
                </svg>
              </div>
            </div>
            {watchedValues.expiresAt &&
              new Date(watchedValues.expiresAt) < new Date() &&
              (watchedValues.status === "ACTIVE" ||
                watchedValues.status === "INACTIVE") && (
                <div className="mt-2">
                  <p className="text-sm text-red-600 mt-1 font-sans">
                    Cannot set status to Active or Inactive with a past expiry
                    date. Please change the expiry date or select Expired
                    status.
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Super Admin: Set monthly upload limit for selected artist */}
        {isSuperAdmin && (
          <div className="col-span-2 sm:col-span-1">
            <label
              htmlFor="monthlyUploadLimit"
              className="block text-sm font-medium text-gray-700 font-sans mb-1"
            >
              Monthly Upload Limit for Artist
            </label>
            <Controller
              name="monthlyUploadLimit"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  id="monthlyUploadLimit"
                  placeholder={`Default is ${
                    backendLimits?.monthlyUpload ?? 10
                  }. Leave blank or set to ${
                    backendLimits?.monthlyUpload ?? 10
                  } for standard limit.`}
                  min={1}
                  max={1000}
                  onChange={handleMonthlyLimitChange}
                  className={`mt-1 block w-full border rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:border-transparent focus:outline-none font-sans ${getFieldErrorClass(
                    "monthlyUploadLimit"
                  )}`}
                />
              )}
            />
          </div>
        )}

        {/* Super Admin: Set AI description daily limit for selected artist */}
        {isSuperAdmin && (
          <div className="col-span-2 sm:col-span-1">
            <label
              htmlFor="aiDescriptionDailyLimit"
              className="block text-sm font-medium text-gray-700 font-sans mb-1"
            >
              AI Description Daily Limit for Artist
            </label>
            <Controller
              name="aiDescriptionDailyLimit"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  id="aiDescriptionDailyLimit"
                  placeholder={`Default is ${
                    backendLimits?.aiDescriptionDaily ?? 5
                  } or set any other.`}
                  min={1}
                  max={100}
                  onChange={handleAiLimitChange}
                  className={`mt-1 block w-full border rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:border-transparent focus:outline-none font-sans ${getFieldErrorClass(
                    "aiDescriptionDailyLimit"
                  )}`}
                />
              )}
            />
          </div>
        )}

        {/* Super Admin: Expires At */}
        {isSuperAdmin && (
          <div className="col-span-2 sm:col-span-1">
            <label
              htmlFor="expiresAt"
              className="block text-sm font-medium text-gray-700 font-sans mb-1"
            >
              Expires At
            </label>
            <Controller
              name="expiresAt"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="datetime-local"
                  id="expiresAt"
                  value={field.value || ""}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    handleExpiryDateChange(e);
                  }}
                  className={`mt-1 block w-full border rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:border-transparent focus:outline-none font-sans ${getFieldErrorClass(
                    "expiresAt"
                  )}`}
                />
              )}
            />
            {errors.expiresAt && (
              <p className="text-sm text-red-600 mt-1 font-sans">
                {errors.expiresAt.message}
              </p>
            )}
          </div>
        )}

        {/* Super Admin: Set image upload limit for selected artist */}
        {isSuperAdmin && (
          <div className="col-span-2 sm:col-span-1 mt-4">
            <label
              htmlFor="imageUploadLimit"
              className="block text-sm font-medium text-gray-700 font-sans mb-1"
            >
              Image Upload Limit for Artist
            </label>
            <Controller
              name="imageUploadLimit"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <input
                    {...field}
                    type="number"
                    id="imageUploadLimit"
                    min={Math.max(1, images.length)}
                    max={1000}
                    value={
                      field.value ??
                      (initialData?.imageUploadLimit ||
                        backendLimits?.imageUpload ||
                        1)
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      const numVal = val === "" ? "" : Number(val);
                      // Ensure the limit is at least equal to the number of selected images
                      const minLimit = Math.max(1, images.length);
                      if (numVal !== "" && numVal < minLimit) {
                        field.onChange(minLimit);
                      } else {
                        field.onChange(numVal);
                      }
                    }}
                    className={`mt-1 block w-full border rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:border-transparent focus:outline-none font-sans ${getFieldErrorClass(
                      "imageUploadLimit"
                    )}`}
                  />
                  {images.length > (field.value || 1) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        Auto-updated
                      </span>
                    </div>
                  )}
                </div>
              )}
            />
            <p className="text-xs text-gray-500 mt-1 font-sans">
              Artist's image limit for this artwork (1-1000). You can upload up
              to 1000 images.
            </p>
            {images.length > 0 && (
              <p className="text-xs text-blue-600 mt-1 font-sans">
                Current images: {images.length} - limit auto-updates to{" "}
                {Math.max(images.length, watch("imageUploadLimit") || 1)}
              </p>
            )}
          </div>
        )}

        {/* Checkboxes */}
        {isSuperAdmin && (
          <div className="col-span-2 flex flex-wrap gap-6 my-2">
            {isSuperAdmin && (
              <label className="flex items-center space-x-3">
                <Controller
                  name="featured"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="checkbox"
                      checked={field.value}
                      className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  )}
                />
                <span className="text-sm font-medium text-gray-700 font-sans">
                  Featured Artwork
                </span>
              </label>
            )}
            {isSuperAdmin && (
              <label className="flex items-center space-x-3">
                <Controller
                  name="sold"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="checkbox"
                      checked={field.value}
                      className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  )}
                />
                <span className="text-sm font-medium text-gray-700 font-sans">
                  Mark as Sold
                </span>
              </label>
            )}
          </div>
        )}
      </div>

      {/* Progress Indicators */}
      {isSubmitting && (
        <div className="space-y-4 pt-4">
          {currentStep === "uploading" && (
            <ProgressBar
              progress={uploadProgress}
              label={imageFile ? "Uploading new image..." : "Processing..."}
            />
          )}
          {currentStep === "saving" && (
            <ProgressBar
              progress={savingProgress}
              label={initialData ? "Updating artwork..." : "Saving artwork..."}
            />
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="my-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {/* Submit and Reset Button */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          type="submit"
          disabled={
            isSubmitting ||
            (isArtist &&
              !isSuperAdmin &&
              monthlyUploadCount >= monthlyUploadLimit)
          }
          className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 border-2 border-indigo-600 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white font-sans text-base font-medium hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800 hover:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <Loader size="small" className="mr-2" />
              {getStepLabel()}
            </div>
          ) : initialData ? (
            "Update Artwork"
          ) : (
            "Save Artwork"
          )}
        </button>

        {/* Reset Form Button: Only show when adding new artwork */}
        {!initialData && (
          <button
            type="button"
            onClick={() => {
              // Compute default expiresAt for reset
              const defaultExpiresAt = isSuperAdmin
                ? getDefaultExpiresAt()
                : "";
              // Reset form data
              reset({
                title: "",
                material: "",
                style: "",
                description: "",
                price: "",
                year: new Date().getFullYear(),
                featured: false,
                sold: false,
                instagramReelLink: "",
                youtubeVideoLink: "",
                monthlyUploadLimit: backendLimits?.monthlyUpload ?? 10,
                aiDescriptionDailyLimit: backendLimits?.aiDescriptionDaily ?? 5,
                artistId: "",
                status: "ACTIVE",
                // Only include expiresAt and imageUploadLimit for super admins
                ...(isSuperAdmin && {
                  expiresAt: defaultExpiresAt,
                  imageUploadLimit: backendLimits?.imageUpload ?? 1,
                }),
                width: "",
                height: "",
                dimensions: "",
                images: [],
              });

              // Clear form validation errors
              clearErrors();

              // Reset other state
              setDimensionInputs({ width: "", height: "" });

              // Clear images and clean up object URLs
              images.forEach((img) => {
                if (img.preview && !img.uploaded) {
                  URL.revokeObjectURL(img.preview);
                }
              });
              setImages([]);

              setImageFile(null);
              setImagePreview(null);
              setImageRemoved(false);
              setImageError("");
              setImageLoaded(false);
              setArtistFieldTouched(false);
              setImageErrors([]); // Clear any image errors
              setValidationErrors([]); // Clear validation errors
              setIsAutoDismissible(false);

              // Clear artist selection
              if (isSuperAdmin && setArtistId) {
                setArtistId("");
              }

              // Clear localStorage
              clearPersisted();
              skipNextPersist.current = true;

              // Scroll to top
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 border-2 border-gray-400 rounded-xl bg-white text-gray-700 font-sans text-base font-medium hover:bg-gray-100 hover:border-gray-500 focus:outline-none focus:ring-0 transition-colors duration-300"
          >
            Reset Form
          </button>
        )}

        {/* Show message if artist reached monthly upload limit */}
        {isArtist &&
          !isSuperAdmin &&
          monthlyUploadCount >= monthlyUploadLimit && (
            <span className="text-xs text-red-500 font-sans break-words sm:max-w-[30vw] mt-1 block">
              🚫 You have reached your monthly upload limit. You cannot upload
              more artwork this month.
            </span>
          )}
      </div>
    </form>
  );
}
