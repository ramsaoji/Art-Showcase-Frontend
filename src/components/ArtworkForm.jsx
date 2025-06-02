import { useState } from "react";
import { PhotoIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

// Progress bar component
function ProgressBar({ progress, label }) {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-indigo-700">{label}</span>
        <span className="text-sm font-medium text-indigo-700">{progress}%</span>
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Artwork Image
        </label>
        <label
          className={`block mt-2 cursor-pointer ${
            imageError ? "border-red-300" : "border-gray-300"
          } border-2 border-dashed rounded-lg hover:bg-gray-50 transition-colors duration-200`}
        >
          <div className="px-6 pt-5 pb-6">
            <div className="space-y-2 text-center">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mx-auto h-64 w-auto object-contain"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setImageFile(null);
                      setImagePreview(null);
                      setImageError("");
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <PhotoIcon
                    className={`mx-auto h-12 w-12 ${
                      imageError ? "text-red-400" : "text-gray-400"
                    }`}
                  />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <span
                      className={`${
                        imageError
                          ? "text-red-600 hover:text-red-500"
                          : "text-indigo-600 hover:text-indigo-500"
                      } font-medium`}
                    >
                      Upload a file
                    </span>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleImageChange}
                    />
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p
                    className={`text-xs ${
                      imageError ? "text-red-500" : "text-gray-500"
                    }`}
                  >
                    JPG, JPEG, PNG up to 5MB
                  </p>
                  {imageError && (
                    <div className="flex items-center justify-center gap-1 text-sm text-red-600 mt-2">
                      <ExclamationCircleIcon className="h-5 w-5" />
                      <span>{imageError}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </label>
      </div>

      {/* Artwork Details */}
      <div className="grid grid-cols-1 gap-y-6 gap-x-8 sm:grid-cols-2">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            value={formData.title}
            onChange={handleInputChange}
            className="block w-full h-10 px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="artist"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Artist
          </label>
          <input
            type="text"
            name="artist"
            id="artist"
            required
            value={formData.artist}
            onChange={handleInputChange}
            className="block w-full h-10 px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Price
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">₹</span>
            </div>
            <input
              type="number"
              name="price"
              id="price"
              required
              min="0"
              step="1"
              value={formData.price}
              onChange={handleInputChange}
              className="block w-full h-10 pl-7 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="dimensions"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Dimensions
          </label>
          <input
            type="text"
            name="dimensions"
            id="dimensions"
            required
            placeholder="e.g., 80x100 cm"
            value={formData.dimensions}
            onChange={handleInputChange}
            className="block w-full h-10 px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="material"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Material
          </label>
          <input
            type="text"
            name="material"
            id="material"
            required
            placeholder="e.g., Oil on Canvas"
            value={formData.material}
            onChange={handleInputChange}
            className="block w-full h-10 px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="style"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Style
          </label>
          <input
            type="text"
            name="style"
            id="style"
            required
            placeholder="e.g., Abstract"
            value={formData.style}
            onChange={handleInputChange}
            className="block w-full h-10 px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="year"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Year
          </label>
          <input
            type="number"
            name="year"
            id="year"
            required
            min="1800"
            max={new Date().getFullYear()}
            value={formData.year}
            onChange={handleInputChange}
            className="block w-full h-10 px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="sm:col-span-2 flex items-center space-x-8">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              name="featured"
              checked={formData.featured}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="featured"
              className="ml-2 block text-sm text-gray-700"
            >
              Featured Artwork
            </label>
          </div>
          {initialData && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sold"
                name="sold"
                checked={formData.sold}
                onChange={handleInputChange}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label
                htmlFor="sold"
                className="ml-2 block text-sm text-gray-700"
              >
                Mark as Sold
              </label>
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description
          </label>
          <textarea
            name="description"
            id="description"
            required
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            style={{ minHeight: "6rem" }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 pt-6">
        {isSubmitting && (
          <div className="space-y-4">
            {currentStep === "uploading" && (
              <ProgressBar
                progress={uploadProgress}
                label="Uploading image..."
              />
            )}
            {currentStep === "saving" && (
              <ProgressBar
                progress={savingProgress}
                label="Saving artwork details..."
              />
            )}
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save Artwork"}
          </button>
        </div>
      </div>
    </form>
  );
}
