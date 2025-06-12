import { useState } from "react";
import { PhotoIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import Alert from "./Alert";
import Loader from "./ui/Loader";
import { deleteImage } from "../config/cloudinary"; // Add this import

// Progress bar component
function ProgressBar({ progress, label }) {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-base font-sans font-medium text-indigo-700">
          {label}
        </span>
        <span className="text-base font-sans font-medium text-indigo-700">
          {progress}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

export default function ArtworkForm({ onSubmit, initialData = null }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    artist: initialData?.artist || "",
    price: initialData?.price || "",
    description: initialData?.description || "",
    dimensions: initialData?.dimensions || "",
    material: initialData?.material || "",
    style: initialData?.style || "",
    year: initialData?.year || new Date().getFullYear(),
    featured: initialData?.featured || false,
    sold: initialData?.sold || false,
  });

  // Separate state for dimension inputs
  const [dimensionInputs, setDimensionInputs] = useState(() => {
    if (initialData?.dimensions) {
      // Parse existing dimensions like "24cm × 36cm"
      const match = initialData.dimensions.match(
        /(\d+(?:\.\d+)?)\s*cm\s*×\s*(\d+(?:\.\d+)?)\s*cm/
      );
      if (match) {
        return { width: match[1], height: match[2] };
      }
    }
    return { width: "", height: "" };
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialData?.url || null);
  const [imageRemoved, setImageRemoved] = useState(false); // Track if image was intentionally removed
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savingProgress, setSavingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(null);
  const [imageError, setImageError] = useState("");

  // Predefined options for materials and styles
  const materialOptions = [
    "Oil on Canvas",
    "Acrylic on Canvas",
    "Watercolor on Paper",
    "Mixed Media",
    "Digital Art",
    "Charcoal on Paper",
    "Pencil on Paper",
    "Ink on Paper",
    "Pastel on Paper",
    "Gouache on Paper",
    "Tempera on Canvas",
    "Collage",
    "Photography",
    "Sculpture - Bronze",
    "Sculpture - Marble",
    "Sculpture - Wood",
    "Sculpture - Clay",
    "Other",
  ];

  const styleOptions = [
    "Abstract",
    "Contemporary",
    "Modern",
    "Impressionist",
    "Expressionist",
    "Surrealist",
    "Minimalist",
    "Pop Art",
    "Cubist",
    "Realist",
    "Portrait",
    "Landscape",
    "Still Life",
    "Street Art",
    "Folk Art",
    "Traditional",
    "Conceptual",
    "Other",
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    console.log(`Input changed: ${name} = ${newValue} (${typeof newValue})`);
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  // Handle dimension inputs separately
  const handleDimensionChange = (field, value) => {
    const newDimensions = { ...dimensionInputs, [field]: value };
    setDimensionInputs(newDimensions);

    // Update the main form data with formatted dimensions
    if (newDimensions.width && newDimensions.height) {
      const formattedDimensions = `${newDimensions.width}cm × ${newDimensions.height}cm`;
      setFormData((prev) => ({ ...prev, dimensions: formattedDimensions }));
    } else {
      setFormData((prev) => ({ ...prev, dimensions: "" }));
    }
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageError("");
    setImageRemoved(false); // Reset removed state when new image is selected

    if (file) {
      // Check file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setImageError("Please upload only JPG, JPEG or PNG files");
        e.target.value = null; // Reset file input
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setImageError("Image size must be less than 5MB");
        e.target.value = null; // Reset file input
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(true);

    // Reset file input
    const fileInput = document.getElementById("file-upload");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate image requirement
    const hasImage = imageFile || (initialData?.url && !imageRemoved);
    if (!hasImage) {
      setImageError("Please select an image for the artwork");
      return;
    }

    // Validate dimensions
    if (!dimensionInputs.width || !dimensionInputs.height) {
      setImageError("Please enter both width and height dimensions");
      return;
    }

    setIsSubmitting(true);
    setCurrentStep("uploading");
    setUploadProgress(0);
    setSavingProgress(0);

    try {
      // Handle Cloudinary cleanup for edit mode
      if (
        initialData &&
        (imageFile || imageRemoved) &&
        initialData.cloudinary_public_id
      ) {
        setCurrentStep("cleaning");
        try {
          await deleteImage(initialData.cloudinary_public_id);
          console.log("Old image deleted from Cloudinary successfully");
        } catch (cloudinaryError) {
          console.error(
            "Error deleting old image from Cloudinary:",
            cloudinaryError
          );
          // Continue with the update even if old image deletion fails
        }
      }

      setCurrentStep("uploading");

      // Create FormData object to handle file upload
      const submitData = new FormData();
      if (imageFile) {
        submitData.append("image", imageFile);
      }

      // Add a flag to indicate if image was removed (for backend handling)
      if (imageRemoved) {
        submitData.append("imageRemoved", "true");
      }

      // Log form data before submission
      console.log("Form data before submission:", formData);

      // Append other form data
      Object.entries(formData).forEach(([key, value]) => {
        // Convert boolean to string "true"/"false" for FormData
        const formValue = typeof value === "boolean" ? String(value) : value;
        submitData.append(key, formValue);
        console.log(
          `Appending to FormData: ${key} = ${formValue} (${typeof formValue})`
        );
      });

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

      // Reset form after successful submission (only for new artwork)
      if (!initialData) {
        setFormData({
          title: "",
          artist: "",
          price: "",
          description: "",
          dimensions: "",
          material: "",
          style: "",
          year: new Date().getFullYear(),
          featured: false,
          sold: false,
        });
        setDimensionInputs({ width: "", height: "" });
        setImageFile(null);
        setImagePreview(null);
        setImageRemoved(false);
      }
    } catch (error) {
      console.error("Error submitting artwork:", error);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
        setCurrentStep(null);
        setUploadProgress(0);
        setSavingProgress(0);
      }, 1000);
    }
  };

  // Get the current step label for display
  const getStepLabel = () => {
    switch (currentStep) {
      case "cleaning":
        return "Removing old image...";
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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
                  />
                  {/* Close button positioned at top-right of image */}
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
                </div>
              </div>

              {/* Status message */}
              {/* {imageFile && (
                <div className="flex justify-center mb-4">
                  <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-sans rounded-full">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    New Image Selected
                  </div>
                </div>
              )} */}

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
              imageError ? "border-red-300" : "border-gray-200"
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
                {imageRemoved && (
                  <p className="mt-2 text-xs text-red-500 font-sans">
                    Image removed - Please select a new image
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
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Title */}
        <div className="col-span-2">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 font-sans mb-1"
          >
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter the artwork title"
            className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none font-sans"
          />
        </div>

        {/* Artist */}
        <div className="col-span-2 sm:col-span-1">
          <label
            htmlFor="artist"
            className="block text-sm font-medium text-gray-700 font-sans mb-1"
          >
            Artist <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="artist"
            id="artist"
            required
            value={formData.artist}
            onChange={handleInputChange}
            placeholder="Enter artist's name"
            className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none font-sans"
          />
        </div>

        {/* Price */}
        <div className="col-span-2 sm:col-span-1">
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700 font-sans mb-1"
          >
            Price <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="price"
            id="price"
            required
            value={formData.price}
            onChange={handleInputChange}
            placeholder="Enter price in INR"
            min="0"
            step="1"
            className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none font-sans"
          />
        </div>

        {/* Description */}
        <div className="col-span-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 font-sans mb-1"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            id="description"
            rows={4}
            required
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe the artwork, its inspiration, and any unique features..."
            className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none font-sans resize-none"
          />
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
              <input
                type="number"
                id="width"
                required
                value={dimensionInputs.width}
                onChange={(e) => handleDimensionChange("width", e.target.value)}
                placeholder="24"
                min="0.1"
                step="0.1"
                className="block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none font-sans"
              />
            </div>
            <div>
              <label
                htmlFor="height"
                className="block text-xs text-gray-500 mb-1 font-sans"
              >
                Height (cm)
              </label>
              <input
                type="number"
                id="height"
                required
                value={dimensionInputs.height}
                onChange={(e) =>
                  handleDimensionChange("height", e.target.value)
                }
                placeholder="36"
                min="0.1"
                step="0.1"
                className="block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none font-sans"
              />
            </div>
          </div>
          {formData.dimensions && (
            <p className="mt-2 text-sm text-gray-600 font-sans">
              Preview:{" "}
              <span className="font-medium">{formData.dimensions}</span>
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
            <select
              name="material"
              id="material"
              required
              value={formData.material}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none font-sans bg-white appearance-none"
            >
              <option value="">Select material</option>
              {materialOptions.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
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
            <select
              name="style"
              id="style"
              required
              value={formData.style}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none font-sans bg-white appearance-none"
            >
              <option value="">Select style</option>
              {styleOptions.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Year */}
        <div className="col-span-2">
          <label
            htmlFor="year"
            className="block text-sm font-medium text-gray-700 font-sans mb-1"
          >
            Year <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="year"
            id="year"
            required
            value={formData.year}
            onChange={handleInputChange}
            placeholder={new Date().getFullYear().toString()}
            min="1800"
            max={new Date().getFullYear()}
            className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none font-sans"
          />
        </div>

        {/* Checkboxes */}
        <div className="col-span-2 flex flex-wrap gap-6">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleInputChange}
              className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700 font-sans">
              Featured Artwork
            </span>
          </label>
          {initialData && (
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="sold"
                checked={formData.sold}
                onChange={handleInputChange}
                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700 font-sans">
                Mark as Sold
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex justify-center items-center px-6 py-3.5 border-2 border-indigo-600 rounded-full bg-indigo-600 text-white font-sans text-base font-medium hover:bg-indigo-500 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
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
      </div>

      {/* Progress Indicators */}
      {isSubmitting && (
        <div className="space-y-4 pt-4">
          {currentStep === "cleaning" && (
            <ProgressBar progress={30} label="Removing old image..." />
          )}
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
    </form>
  );
}
