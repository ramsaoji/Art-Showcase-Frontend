import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PhotoIcon, PlusIcon } from "@heroicons/react/24/outline";
import ImageModal from "../components/ImageModal";

// Generate more detailed artwork data
const generateImages = (start, count) => {
  const styles = [
    "Abstract",
    "Impressionist",
    "Modern",
    "Contemporary",
    "Minimalist",
  ];
  const materials = [
    "Oil on Canvas",
    "Acrylic",
    "Digital Art",
    "Mixed Media",
    "Watercolor",
  ];
  const descriptions = [
    "A stunning piece that captures the essence of modern expression through bold colors and dynamic forms.",
    "An elegant composition that explores the relationship between light and shadow in contemporary spaces.",
    "A powerful artwork that challenges traditional perspectives with innovative techniques.",
    "A mesmerizing piece that blends traditional methods with contemporary vision.",
    "An evocative work that draws viewers into a world of color and emotion.",
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: start + i,
    url: `https://picsum.photos/seed/${start + i}/800/600`,
    title: `${styles[i % styles.length]} ${materials[i % materials.length]} #${
      start + i
    }`,
    artist: `Artist ${((start + i) % 10) + 1}`,
    description: descriptions[i % descriptions.length],
    price: Math.floor(Math.random() * 4000 + 1000),
    dimensions: `${30 + (i % 3) * 10}x${40 + (i % 3) * 10} cm`,
    style: styles[i % styles.length],
    material: materials[i % materials.length],
    year: 2024 - (i % 3),
  }));
};

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const loadImages = () => {
      setLoading(true);
      try {
        // Load user-uploaded artworks from localStorage
        const userArtworks = JSON.parse(
          localStorage.getItem("artworks") || "[]"
        );

        // Generate some demo artworks
        const demoArtworks = generateImages(1, 6);

        // Combine user artworks with demo artworks
        setImages([...userArtworks, ...demoArtworks]);
      } catch (error) {
        console.error("Error loading artworks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, []);

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleImageError = (imageId) => {
    setImageErrors((prev) => ({ ...prev, [imageId]: true }));
  };

  const handlePrevious = () => {
    const currentIndex = images.findIndex(
      (img) => img.id === selectedImage?.id
    );
    if (currentIndex > 0) {
      setSelectedImage(images[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    const currentIndex = images.findIndex(
      (img) => img.id === selectedImage?.id
    );
    if (currentIndex < images.length - 1) {
      setSelectedImage(images[currentIndex + 1]);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Art Gallery
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Browse through our collection of exceptional artworks
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            to="/add-artwork"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add New Artwork
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {images.map((image) => (
            <div
              key={image.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div
                onClick={() => handleImageClick(image)}
                className="relative cursor-pointer group aspect-w-4 aspect-h-3"
              >
                {imageErrors[image.id] ? (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                    <PhotoIcon className="h-16 w-16" />
                    <p className="mt-2 text-sm">Image not available</p>
                  </div>
                ) : (
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => handleImageError(image.id)}
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-50 px-4 py-2 rounded-full text-sm sm:text-base">
                    View Details
                  </span>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 line-clamp-1">
                  {image.title}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base mb-4 line-clamp-2">
                  {image.description}
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-xs sm:text-sm text-gray-500">
                    <p>By {image.artist}</p>
                    <p>{image.dimensions}</p>
                  </div>
                  <span className="text-base sm:text-lg font-bold text-indigo-600">
                    {formatPrice(image.price)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        image={selectedImage || {}}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={
          selectedImage &&
          images.findIndex((img) => img.id === selectedImage.id) > 0
        }
        hasNext={
          selectedImage &&
          images.findIndex((img) => img.id === selectedImage.id) <
            images.length - 1
        }
      />
    </div>
  );
}
