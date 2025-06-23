import React, { useState, useEffect, useRef, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { PhotoIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import Alert from "./Alert";
import Loader from "./ui/Loader";
import { getPreviewUrl } from "../config/cloudinary"; // Keep this for image preview
import { useAuth } from "../contexts/AuthContext";
import { trpc } from "../utils/trpc";
import {
  useMonthlyUploadCount,
  useArtistMonthlyUploadCount,
} from "../utils/trpc";
import { toDatetimeLocalValue } from "../utils/formatters";

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
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
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
  artists,
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
    artistId: yup.string().when([], {
      is: () => isSuperAdmin && !initialData,
      then: (schema) => schema.required("Artist is required"),
      otherwise: (schema) => schema.optional(),
    }),
    image: yup
      .mixed()
      .test("image-required", "Image is required", function (value) {
        const { initialData } = this.options.context || {};

        // If it's edit mode and user hasn't removed the image, don't require new image
        if (initialData && !imageRemoved) {
          return true;
        }

        // For all other cases (new artwork or edit mode with removed image), require image
        return !!value;
      }),
    expiresAt: yup.date().nullable().optional(),
  });
};

export default function ArtworkForm({
  onSubmit,
  initialData = null,
  artists = [],
  loadingArtists = false,
  artistId = "",
  setArtistId = () => {},
  selectedArtist = null,
  setShouldLoadArtists = () => {},
}) {
  const { isSuperAdmin, isArtist, user } = useAuth();
  // Debug log
  console.log(
    "ArtworkForm: isSuperAdmin",
    isSuperAdmin,
    "isArtist",
    isArtist,
    "initialData",
    initialData
  );
  console.log(
    "ArtworkForm: artistId",
    artistId,
    "type:",
    typeof artistId,
    "length:",
    artistId?.length
  );
  // Only fetch monthly upload count for artists creating new artwork
  const shouldFetchUploadCount = isArtist && !isSuperAdmin && !initialData; // Only for artists (not admins) creating new artwork
  let monthlyUploadData, loadingMonthlyUpload, monthlyUploadError;
  if (shouldFetchUploadCount) {
    const query = useMonthlyUploadCount(true);
    monthlyUploadData = query.data;
    loadingMonthlyUpload = query.isLoading;
    monthlyUploadError = query.error;
  } else {
    monthlyUploadData = undefined;
    loadingMonthlyUpload = false;
    monthlyUploadError = undefined;
  }
  const monthlyUploadCount = monthlyUploadData?.count ?? 0;
  const monthlyUploadLimit = monthlyUploadData?.limit ?? 10;

  // For admins: fetch selected artist's upload count
  let selectedArtistUploadData,
    loadingSelectedArtistUpload,
    selectedArtistUploadError;

  // Only fetch if we have a valid artistId and are in the right conditions
  const shouldFetchArtistUploadCount = Boolean(
    isSuperAdmin && !initialData && artistId && artistId.trim() !== ""
  );

  console.log(
    "Debug - shouldFetchArtistUploadCount:",
    shouldFetchArtistUploadCount
  );
  console.log("Debug - artistId:", artistId, "type:", typeof artistId);

  // Always create the query, but control when it runs with enabled
  const artistUploadQuery = trpc.artwork.getArtistMonthlyUploadCount.useQuery(
    { artistId: artistId?.trim() || "" },
    {
      enabled: shouldFetchArtistUploadCount,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  if (shouldFetchArtistUploadCount) {
    selectedArtistUploadData = artistUploadQuery?.data;
    loadingSelectedArtistUpload = artistUploadQuery?.isLoading || false;
    selectedArtistUploadError = artistUploadQuery?.error;
  } else {
    selectedArtistUploadData = undefined;
    loadingSelectedArtistUpload = false;
    selectedArtistUploadError = undefined;
  }
  const selectedArtistUploadCount = selectedArtistUploadData?.count ?? 0;
  const selectedArtistUploadLimit = selectedArtistUploadData?.limit ?? 10;
  const selectedArtistName =
    selectedArtistUploadData?.artistName ??
    selectedArtist?.artistName ??
    "Selected Artist";

  // Form state
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
  const [status, setStatus] = useState(initialData?.status || "ACTIVE");
  const [artistFieldTouched, setArtistFieldTouched] = useState(false);
  const [expiresAt, setExpiresAt] = useState(() => {
    if (!initialData && isSuperAdmin) {
      // 30 days from now, formatted for datetime-local
      const now = new Date();
      const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return toDatetimeLocalValue(future);
    }
    return "";
  });

  // Track if the monthly upload limit input has been manually changed
  const [monthlyLimitTouched, setMonthlyLimitTouched] = useState(false);

  useEffect(() => {
    if (initialData?.expiresAt) {
      setExpiresAt(toDatetimeLocalValue(initialData.expiresAt));
    }
  }, [initialData]);

  // Local storage keys - make them user-specific
  const userId = user?.id || "anonymous";
  const FORM_DATA_KEY = `artwork_form_data_${userId}`;
  const DIMENSIONS_KEY = `artwork_dimensions_${userId}`;
  const ARTIST_ID_KEY = `artwork_artist_id_${userId}`;
  const IMAGE_FLAG_KEY = `artwork_form_has_image_${userId}`;

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
      artists,
      artistId,
      imageRemoved
    );
  }, [isSuperAdmin, initialData, artists, artistId, imageRemoved]);

  // Custom resolver that handles dynamic validation by passing a reactive context
  const customResolver = useMemo(() => {
    return yupResolver(validationSchema);
  }, [validationSchema]);

  // Get initial form data
  const getInitialFormData = () => {
    if (initialData) {
      // Parse dimensions for edit mode
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
        carousel: initialData.carousel || false,
        monthlyUploadLimit: initialData.monthlyUploadLimit ?? 10,
        artistId: "", // No artist selection for edit mode
        width: width,
        height: height,
        dimensions: initialData.dimensions || "",
        expiresAt: initialData.expiresAt
          ? new Date(initialData.expiresAt)
          : null,
      };
    }

    // Try to restore from localStorage (only for new artwork, excluding image data)
    const savedData = localStorage.getItem(FORM_DATA_KEY);
    const savedArtistId = localStorage.getItem(ARTIST_ID_KEY);

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Remove image-related data from saved data
        const { image, imageFile, imagePreview, ...cleanData } = parsedData;
        return {
          ...cleanData,
          artistId: savedArtistId || "", // Include saved artist ID
        };
      } catch (error) {
        console.error("Error parsing saved form data:", error);
      }
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
      carousel: false,
      monthlyUploadLimit: 10,
      artistId: savedArtistId || "", // Include saved artist ID
      width: "",
      height: "",
      dimensions: "",
    };
  };

  // Get initial dimensions
  const getInitialDimensions = () => {
    if (initialData?.dimensions) {
      const match = initialData.dimensions.match(
        /(\d+(?:\.\d+)?)cm × (\d+(?:\.\d+)?)cm/
      );
      if (match) {
        return { width: match[1], height: match[2] };
      }
    }

    // Try to restore from localStorage
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

  // Get initial image preview
  function getInitialImagePreview() {
    if (initialData?.url) {
      return initialData.url;
    }
    return null;
  }

  // Clear persisted data
  const clearPersisted = () => {
    localStorage.removeItem(FORM_DATA_KEY);
    localStorage.removeItem(DIMENSIONS_KEY);
    localStorage.removeItem(ARTIST_ID_KEY);
    localStorage.removeItem(IMAGE_FLAG_KEY);
  };

  // Initialize form with React Hook Form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitted, isDirty },
    reset,
  } = useForm({
    resolver: customResolver,
    mode: "onSubmit",
    defaultValues: getInitialFormData(),
    context: { initialData },
  });

  const watchedValues = watch();

  // This effect will run when the image is removed, ensuring validation is
  // triggered AFTER the form has been submitted at least once.
  useEffect(() => {
    // This makes the image field's validation reactive post-submission,
    // matching the behavior of all other fields.
    if (isSubmitted && imageRemoved) {
      trigger("image");
    }
  }, [imageRemoved, isSubmitted, trigger]);

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

  // Additional effect to handle artist restoration after artists are loaded
  useEffect(() => {
    if (!initialData && isSuperAdmin && artists.length > 0) {
      const savedArtistId = localStorage.getItem(ARTIST_ID_KEY);
      if (savedArtistId && !watchedValues.artistId) {
        setValue("artistId", savedArtistId, { shouldValidate: true });
        setArtistFieldTouched(true);
      }
    }
  }, [
    artists,
    initialData,
    isSuperAdmin,
    setValue,
    watchedValues.artistId,
    ARTIST_ID_KEY,
  ]);

  // Persist form data, dimensions, and artist ID on change (Add mode only)
  useEffect(() => {
    // Only persist data if the form is dirty (i.e., has been modified by the user)
    // This prevents the form from overwriting localStorage with empty values on reset.
    if (!initialData && isDirty) {
      // Include artistId in the form data being saved, but exclude image data
      const formDataToSave = {
        ...watchedValues,
        artistId: watchedValues.artistId || artistId, // Use form value or prop value
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
    isDirty,
  ]);

  // Check if form has data but no image (for page refresh notification)
  const hasFormDataButNoImage = (() => {
    if (initialData) return false; // Don't show for edit mode
    if (imageFile || imagePreview) return false; // Don't show if image exists

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
      return !!(
        parsedData.title ||
        parsedData.material ||
        parsedData.style ||
        parsedData.description ||
        parsedData.price ||
        (parsedData.year && parsedData.year !== new Date().getFullYear())
      );
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
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageError("");
    setImageRemoved(false);

    // Clear any existing form errors when user uploads an image
    if (error) {
      setError(null);
    }

    if (file) {
      // Check file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setImageError("Please upload only JPG, JPEG or PNG files");
        e.target.value = null;
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setImageError("Image size must be less than 5MB");
        e.target.value = null;
        return;
      }

      setImageFile(file);
      setImageLoaded(false); // Reset loader state
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Set image in form
      setValue("image", file, { shouldValidate: true });

      // Set the flag in localStorage
      if (!initialData) {
        localStorage.setItem(IMAGE_FLAG_KEY, "true");
      }
    }
  };

  // Handle image remove
  const handleImageRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(true);
    setImageLoaded(false);
    setValue("image", undefined, { shouldValidate: true });

    // Remove the flag from localStorage
    if (!initialData) {
      localStorage.removeItem(IMAGE_FLAG_KEY);
    }

    // Reset file input
    const fileInput = document.getElementById("file-upload");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Handle monthly upload limit change
  const handleMonthlyLimitChange = (e) => {
    setMonthlyLimitTouched(true);
    const value =
      e.target.value === ""
        ? ""
        : Math.max(1, Math.min(1000, Number(e.target.value)));
    setValue("monthlyUploadLimit", value);
  };

  useEffect(() => {
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
  }, [selectedArtistUploadLimit]);

  // Get field error class
  const getFieldErrorClass = (fieldName) => {
    return errors[fieldName]
      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
      : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500";
  };

  // Handle expiry date change
  const handleExpiryDateChange = (e) => {
    const newDate = e.target.value;
    setExpiresAt(newDate);

    if (newDate) {
      const selectedDate = new Date(newDate);
      const now = new Date();

      // If date is in the past, set to EXPIRED
      if (selectedDate < now) {
        setStatus("EXPIRED");
      }
      // If date is in the future and current status is EXPIRED, set to ACTIVE
      else if (selectedDate > now && status === "EXPIRED") {
        setStatus("ACTIVE");
      }
    }
  };

  // Form submission handler
  const onSubmitForm = async (data) => {
    setError(null);
    setIsSubmitting(true);
    setCurrentStep("uploading");

    let submissionSuccessful = false;

    try {
      setCurrentStep("uploading");

      // Check if expiry date is in the past
      if (expiresAt && new Date(expiresAt) < new Date()) {
        setStatus("EXPIRED");
      }

      // Create FormData object to handle file upload
      const submitData = new FormData();
      if (imageFile) {
        submitData.append("image", imageFile);
      }

      // Add a flag to indicate if image was removed
      if (imageRemoved) {
        submitData.append("imageRemoved", "true");
      }

      // Append form data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          const formValue = typeof value === "boolean" ? String(value) : value;
          submitData.append(key, formValue);
        }
      });

      // Add dimensions
      if (dimensionInputs.width && dimensionInputs.height) {
        submitData.set(
          "dimensions",
          `${dimensionInputs.width}cm × ${dimensionInputs.height}cm`
        );
      }

      // For super admin, always include monthlyUploadLimit
      if (isSuperAdmin) {
        const limitValue = data.monthlyUploadLimit || 10;
        submitData.set("monthlyUploadLimit", limitValue);
      }

      // Pass status if admin
      if (isSuperAdmin) {
        submitData.set("status", status);
      }

      if (isSuperAdmin && expiresAt) {
        const iso = new Date(expiresAt).toISOString();
        submitData.set("expiresAt", iso);
      }

      // Log all FormData fields before submitting
      for (let pair of submitData.entries()) {
        console.log("FormData:", pair[0], pair[1]);
      }

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(uploadInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onSubmit(submitData);

      // Complete upload progress
      clearInterval(uploadInterval);
      setUploadProgress(100);
      setCurrentStep("saving");

      // Simulate saving progress
      const savingInterval = setInterval(() => {
        setSavingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(savingInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Wait for a moment to show completion
      await new Promise((resolve) => setTimeout(resolve, 500));
      clearInterval(savingInterval);
      setSavingProgress(100);

      // Mark submission as successful
      submissionSuccessful = true;
    } catch (error) {
      console.error("Error submitting artwork:", error);
      setError("Failed to submit artwork. Please try again.");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
        setCurrentStep(null);
        setUploadProgress(0);
        setSavingProgress(0);
      }, 1000);
    }

    // Reset form only after successful submission (only for new artwork)
    if (submissionSuccessful && !initialData) {
      reset();
      setDimensionInputs({ width: "", height: "" });
      setImageFile(null);
      setImagePreview(null);
      setImageRemoved(false);
      setImageError("");
      setImageLoaded(false);
      if (isSuperAdmin && setArtistId) setArtistId("");
      clearPersisted();
    }
  };

  // Scroll to top if validation fails on submit
  const onInvalid = (errors) => {
    if (Object.keys(errors).length > 0) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // Get the current step label for display
  const getStepLabel = () => {
    switch (currentStep) {
      case "uploading":
        return imageFile ? "Uploading new image..." : "Processing...";
      case "saving":
        return initialData ? "Updating artwork..." : "Saving artwork...";
      default:
        return "Processing...";
    }
  };

  // Check if we should show the image preview
  const shouldShowPreview = imagePreview && !imageRemoved;

  // Update monthlyUploadLimit when selected artist changes (for super admin add mode)
  useEffect(() => {
    if (
      isSuperAdmin &&
      !initialData &&
      selectedArtistUploadLimit !== undefined &&
      selectedArtistUploadLimit !== null
    ) {
      setValue("monthlyUploadLimit", selectedArtistUploadLimit, {
        shouldValidate: true,
      });
    }
  }, [isSuperAdmin, initialData, selectedArtistUploadLimit, setValue]);

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm, onInvalid)}
      className="space-y-6 font-sans"
    >
      {/* Page refresh notification */}
      {hasFormDataButNoImage && !imageRemoved && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800 font-sans">
                Form data restored
              </h3>
              <div className="mt-2 text-sm text-amber-700 font-sans">
                <p>
                  Your form data was saved from your previous session, but the
                  image was lost during page refresh. Please upload your image
                  again to continue.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Upload Count Display - Only for Artists */}
      {shouldFetchUploadCount && (
        <div className="mb-6">
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
        <div className="mb-6">
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
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 font-sans mb-1">
          Artwork Image <span className="text-red-500">*</span>
        </label>

        {shouldShowPreview ? (
          // Show preview with properly positioned controls
          <div className="border-2 border-gray-200 border-dashed rounded-xl p-6 bg-gray-50/30">
            <div className="relative">
              {/* Image container */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-64 w-auto object-contain rounded-lg shadow-md"
                    onLoad={() => setImageLoaded(true)}
                  />
                  {/* Close button positioned at top-right of image */}
                  {imageLoaded && (
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
                      title="Remove image"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Change image button */}
              <div className="flex justify-center">
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-sans font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Change Image
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                </label>
              </div>
            </div>
          </div>
        ) : (
          // Show upload dropzone when no image
          <label
            className={`block cursor-pointer ${
              imageError || errors.image
                ? "border-red-300 bg-red-50/30"
                : "border-gray-200"
            } border-2 border-dashed rounded-xl hover:bg-gray-50/50 transition-colors duration-200 relative overflow-hidden group`}
          >
            <div className="px-6 pt-5 pb-6 relative z-10 flex flex-col items-center justify-center min-h-[200px]">
              <PhotoIcon className="h-12 w-12 text-gray-400" />
              <div className="mt-4 flex flex-col items-center text-sm text-gray-600 font-sans">
                <span className="relative cursor-pointer rounded-md font-medium text-gray-600 hover:text-gray-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gray-500">
                  Upload a file
                </span>
                <p className="mt-1 text-sm text-gray-500 font-sans">
                  PNG, JPG up to 5MB
                </p>
                {/* {imageRemoved && (
                  <p className="mt-2 text-xs text-red-500 font-sans">
                    Image removed - Please select a new image
                  </p>
                )} */}
                {hasFormDataButNoImage && !imageRemoved && (
                  <p className="mt-2 text-xs text-amber-600 font-sans px-2 py-1 rounded">
                    Your form data was saved, but please upload your image again
                  </p>
                )}
              </div>
            </div>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              onChange={handleImageChange}
              accept="image/*"
            />
            {/* Decorative gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-gray-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </label>
        )}

        {imageError && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 font-sans">{imageError}</p>
          </div>
        )}
        {errors.image && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 font-sans">
              {errors.image.message}
            </p>
          </div>
        )}
        {/* Show image required error when form has data but no image, or when validation fails */}
      </div>

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
            <div className="relative">
              <Controller
                name="artistId"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    id="artistSelect"
                    className={`block w-full border rounded-xl shadow-sm py-3 px-4 pr-10 focus:ring-2 focus:border-transparent focus:outline-none font-sans bg-white appearance-none ${getFieldErrorClass(
                      "artistId"
                    )}`}
                    onFocus={() => {
                      if (artists.length === 0 && !loadingArtists) {
                        setShouldLoadArtists(true);
                      }
                    }}
                    // onBlur={() => {
                    //   setArtistFieldTouched(true);
                    //   trigger("artistId");
                    // }}
                    onChange={(e) => {
                      field.onChange(e);
                      trigger("artistId");
                      // Also update the parent component's artistId state for localStorage
                      if (isSuperAdmin && setArtistId) {
                        setArtistId(e.target.value);
                      }
                    }}
                  >
                    <option value="" className="font-sans">
                      Select an artist
                    </option>
                    {loadingArtists ? (
                      <option value="" disabled className="font-sans">
                        Loading artists...
                      </option>
                    ) : (
                      artists &&
                      artists
                        .filter((artist) => artist.approved && artist.active)
                        .map((artist) => (
                          <option
                            key={artist.id}
                            value={artist.id}
                            className="font-sans"
                          >
                            {artist.artistName || artist.email} ({artist.email})
                          </option>
                        ))
                    )}
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
            {errors.artistId && (isSubmitted || artistFieldTouched) && (
              <p className="mt-1 text-sm text-red-600 font-sans">
                {errors.artistId?.message || "Artist is required"}
              </p>
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
            <p className="mt-1 text-sm text-red-600 font-sans">
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
            <p className="mt-1 text-sm text-red-600 font-sans">
              {errors.price.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="col-span-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 font-sans mb-1"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                id="description"
                rows={4}
                placeholder="Describe the artwork, its inspiration, and any unique features..."
                className={`mt-1 block w-full border rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:border-transparent focus:outline-none font-sans resize-none ${getFieldErrorClass(
                  "description"
                )}`}
              />
            )}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 font-sans">
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
                <p className="mt-1 text-sm text-red-600 font-sans">
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
                <p className="mt-1 text-sm text-red-600 font-sans">
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
            <p className="mt-1 text-sm text-red-600 font-sans">
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
            <p className="mt-1 text-sm text-red-600 font-sans">
              {errors.style.message}
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
            <p className="mt-1 text-sm text-red-600 font-sans">
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
              <select
                name="status"
                value={status}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  // Prevent setting ACTIVE or INACTIVE status if expiry date is in the past
                  if (
                    (newStatus === "ACTIVE" || newStatus === "INACTIVE") &&
                    expiresAt &&
                    new Date(expiresAt) < new Date()
                  ) {
                    return; // Don't update status
                  }
                  setStatus(newStatus);
                }}
                className={`mt-1 block w-full border rounded-xl shadow-sm py-3 px-4 pr-10 focus:ring-2 focus:border-transparent focus:outline-none font-sans bg-white appearance-none ${
                  expiresAt &&
                  new Date(expiresAt) < new Date() &&
                  (status === "ACTIVE" || status === "INACTIVE")
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
              >
                <option
                  value="ACTIVE"
                  className="font-sans"
                  disabled={expiresAt && new Date(expiresAt) < new Date()}
                >
                  Active
                </option>
                <option
                  value="INACTIVE"
                  className="font-sans"
                  disabled={expiresAt && new Date(expiresAt) < new Date()}
                >
                  Inactive
                </option>
                <option value="EXPIRED" className="font-sans">
                  Expired
                </option>
              </select>
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
            {expiresAt &&
              new Date(expiresAt) < new Date() &&
              (status === "ACTIVE" || status === "INACTIVE") && (
                <p className="mt-1 text-sm text-red-600 font-sans">
                  Cannot set status to Active or Inactive with a past expiry
                  date. Please change the expiry date or select Expired status.
                </p>
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
                  placeholder="Default is 10. Leave blank or set to 10 for standard limit."
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

        {/* Super Admin: Expires At */}
        {isSuperAdmin && (
          <div className="col-span-2">
            <label
              htmlFor="expiresAt"
              className="block text-sm font-medium text-gray-700 font-sans mb-1"
            >
              Expires At
            </label>
            <input
              type="datetime-local"
              id="expiresAt"
              name="expiresAt"
              value={expiresAt || ""}
              onChange={handleExpiryDateChange}
              className={`mt-1 block w-full border rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:border-transparent focus:outline-none font-sans ${getFieldErrorClass(
                "expiresAt"
              )}`}
            />
            {errors.expiresAt && (
              <p className="mt-1 text-sm text-red-600 font-sans">
                {errors.expiresAt.message}
              </p>
            )}
          </div>
        )}

        {/* Checkboxes */}
        <div className="col-span-2 flex flex-wrap gap-6">
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
          {isSuperAdmin && (
            <label className="flex items-center space-x-3">
              <Controller
                name="carousel"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="checkbox"
                    checked={field.value || false}
                    className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                )}
              />
              <span className="text-sm font-medium text-gray-700 font-sans">
                Show in Carousel
              </span>
            </label>
          )}
        </div>
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
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 font-sans">{error}</p>
        </div>
      )}

      {/* Submit and Reset Button */}
      <div className="pt-4 flex flex-col sm:flex-row gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 border-2 border-indigo-600 rounded-full bg-indigo-600 text-white font-sans text-base font-medium hover:bg-indigo-500 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
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
                carousel: false,
                monthlyUploadLimit: 10,
                artistId: "",
              });

              // Reset other state
              setDimensionInputs({ width: "", height: "" });
              setImageFile(null);
              setImagePreview(null);
              setImageRemoved(false);
              setImageError("");
              setImageLoaded(false);
              setArtistFieldTouched(false);

              // Clear artist selection
              if (isSuperAdmin && setArtistId) {
                setArtistId("");
              }

              // Clear localStorage
              clearPersisted();

              // Scroll to top
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 border-2 border-gray-400 rounded-full bg-white text-gray-700 font-sans text-base font-medium hover:bg-gray-100 hover:border-gray-500 focus:outline-none focus:ring-0 transition-colors duration-300"
          >
            Reset Form
          </button>
        )}
      </div>
    </form>
  );
}
