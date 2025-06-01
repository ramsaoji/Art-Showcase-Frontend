import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ArtworkForm from "../components/ArtworkForm";

export default function AddArtwork() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    try {
      // Here you would typically make an API call to your backend
      // For now, we'll just simulate it and store in localStorage

      // Get existing artworks from localStorage
      const existingArtworks = JSON.parse(
        localStorage.getItem("artworks") || "[]"
      );

      // Create a new artwork object
      const newArtwork = {
        id: Date.now(), // Use timestamp as a simple unique ID
        title: formData.get("title"),
        artist: formData.get("artist"),
        price: parseFloat(formData.get("price")),
        description: formData.get("description"),
        dimensions: formData.get("dimensions"),
        material: formData.get("material"),
        style: formData.get("style"),
        year: parseInt(formData.get("year")),
      };

      // Handle image file
      const imageFile = formData.get("image");
      if (imageFile) {
        // In a real app, you would upload this to a server
        // For now, we'll use FileReader to convert it to a data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          newArtwork.url = reader.result;
          // Save to localStorage
          localStorage.setItem(
            "artworks",
            JSON.stringify([...existingArtworks, newArtwork])
          );
          // Navigate to the gallery page
          navigate("/gallery");
        };
        reader.readAsDataURL(imageFile);
      } else {
        // If no image, save without it
        localStorage.setItem(
          "artworks",
          JSON.stringify([...existingArtworks, newArtwork])
        );
        // Navigate to the gallery page
        navigate("/gallery");
      }
    } catch (err) {
      setError("Failed to save artwork. Please try again.");
      console.error("Error saving artwork:", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Add New Artwork
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the details below to add a new artwork to your gallery.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <ArtworkForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
