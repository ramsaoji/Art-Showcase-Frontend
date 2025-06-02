import { useState } from "react";
import { PhotoIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import Alert from "./Alert";
import Loader from "./ui/Loader";

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

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialData?.url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savingProgress, setSavingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(null);
  const [imageError, setImageError] = useState("");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    console.log(`Input changed: ${name} = ${newValue} (${typeof newValue})`);
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageError("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCurrentStep("uploading");
    setUploadProgress(0);
    setSavingProgress(0);

    try {
      // Create FormData object to handle file upload
      const submitData = new FormData();
      if (imageFile) {
        submitData.append("image", imageFile);
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

      // Reset form after successful submission
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
        setImageFile(null);
        setImagePreview(null);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Image Upload Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 font-sans mb-1">
          Artwork Image <span className="text-red-500">*</span>
        </label>
        <label
          className={`block cursor-pointer ${
            imageError ? "border-red-300" : "border-gray-200"
          } border-2 border-dashed rounded-xl hover:bg-gray-50/50 transition-colors duration-200 relative overflow-hidden group`}
        >
          <div className="px-6 pt-5 pb-6 relative z-10 flex flex-col items-center justify-center min-h-[200px]">
            {imagePreview ? (
              <div className="relative w-full flex justify-center">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-64 w-auto object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/80 backdrop-blur-sm text-white rounded-full hover:bg-red-600/80 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
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
            ) : (
              <>
                <PhotoIcon className="h-12 w-12 text-gray-400" />
                <div className="mt-4 flex flex-col items-center text-sm text-gray-600 font-sans">
                  <label className="relative cursor-pointer rounded-md font-medium text-gray-600 hover:text-gray-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gray-500">
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleImageChange}
                      accept="image/*"
                      required={!initialData?.url}
                    />
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </>
            )}
          </div>
          {/* Decorative gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-gray-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </label>
        {imageError && (
          <Alert type="error" message={imageError} className="mt-2" />
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
        <div>
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
        <div>
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

        {/* Dimensions */}
        <div>
          <label
            htmlFor="dimensions"
            className="block text-sm font-medium text-gray-700 font-sans mb-1"
          >
            Dimensions <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="dimensions"
            id="dimensions"
            required
            value={formData.dimensions}
            onChange={handleInputChange}
            placeholder="e.g., 24cm × 36cm"
            className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none font-sans"
          />
        </div>

        {/* Material */}
        <div>
          <label
            htmlFor="material"
            className="block text-sm font-medium text-gray-700 font-sans mb-1"
          >
            Material <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="material"
            id="material"
            required
            value={formData.material}
            onChange={handleInputChange}
            placeholder="e.g., Oil on Canvas, Acrylic, Mixed Media"
            className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none font-sans"
          />
        </div>

        {/* Style */}
        <div>
          <label
            htmlFor="style"
            className="block text-sm font-medium text-gray-700 font-sans mb-1"
          >
            Style <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="style"
            id="style"
            required
            value={formData.style}
            onChange={handleInputChange}
            placeholder="e.g., Abstract, Contemporary, Impressionist"
            className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none font-sans"
          />
        </div>

        {/* Year */}
        <div>
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
              {currentStep === "uploading" ? "Uploading..." : "Saving..."}
            </div>
          ) : (
            "Save Artwork"
          )}
        </button>
      </div>

      {/* Progress Indicators */}
      {isSubmitting && (
        <div className="space-y-4 pt-4">
          {currentStep === "uploading" && (
            <ProgressBar progress={uploadProgress} label="Uploading image..." />
          )}
          {currentStep === "saving" && (
            <ProgressBar progress={savingProgress} label="Saving artwork..." />
          )}
        </div>
      )}
    </form>
  );
}
