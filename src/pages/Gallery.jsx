import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PhotoIcon, PlusIcon } from "@heroicons/react/24/outline";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
// import { useAuth } from "../contexts/AuthContext";
import ImageModal from "../components/ImageModal";
import ArtworkActions from "../components/ArtworkActions";
import { formatPrice } from "../utils/formatters";
import { getOptimizedImageUrl } from "../config/cloudinary";

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
  // const { isAdmin } = useAuth();

  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);
      try {
        // Create a query to get artworks ordered by creation time
        const artworksQuery = query(
          collection(db, "artworks"),
          orderBy("createdAt", "desc")
        );

        // Get the documents
        const querySnapshot = await getDocs(artworksQuery);

        // Convert the documents to our format
        const artworks = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore Timestamp to JS Date
          createdAt: doc.data().createdAt?.toDate(),
        }));

        setImages(artworks);
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

  const handleDelete = (deletedId) => {
    setImages((prevImages) => prevImages.filter((img) => img.id !== deletedId));
    if (selectedImage?.id === deletedId) {
      setSelectedImage(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

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
        {/* {isAdmin && (
          <div className="mt-4 md:mt-0">
            <Link
              to="/add-artwork"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add New Artwork
            </Link>
          </div>
        )} */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
        {images.map((image) => (
          <div
            key={image.id}
            className="group bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl"
          >
            <div className="relative h-[300px] bg-gray-100 overflow-hidden">
              {imageErrors[image.id] ? (
                <div className="flex items-center justify-center h-full">
                  <PhotoIcon className="h-12 w-12 text-gray-400" />
                </div>
              ) : (
                <>
                  <img
                    src={
                      image.public_id
                        ? getOptimizedImageUrl(image.public_id)
                        : image.url
                    }
                    alt={image.title}
                    className={`w-full h-full object-cover object-center ${
                      image.sold ? "opacity-90" : ""
                    }`}
                    onError={(e) => {
                      console.error("Image failed to load:", e);
                      if (image.public_id && e.target.src !== image.url) {
                        e.target.src = image.url;
                      } else {
                        handleImageError(image.id);
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 sm:block hidden" />
                  {image.sold && (
                    <div className="absolute top-2 right-2 z-20">
                      <div className="inline-flex bg-white/90 text-red-600 border border-red-200 px-3 py-1 rounded-full text-xs font-medium shadow-sm ml-2">
                        Sold
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleImageClick(image);
                      }}
                      className="bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-black/60 transition-colors duration-200 sm:opacity-0 sm:group-hover:opacity-100 z-30"
                    >
                      Quick View
                    </button>
                  </div>
                  <Link
                    to={`/artwork/${image.id}`}
                    className="absolute inset-0 z-10"
                  >
                    <span className="sr-only">
                      View details for {image.title}
                    </span>
                  </Link>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/70 to-transparent sm:bg-none">
                    <p className="text-sm font-medium">{image.material}</p>
                    <p className="text-sm opacity-90">{image.dimensions}</p>
                  </div>
                </>
              )}
            </div>

            <Link to={`/artwork/${image.id}`} className="block p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors duration-300">
                    {image.title}
                  </h3>
                  <div className="mt-1 flex items-center">
                    <span className="text-sm font-medium text-gray-600">
                      By {image.artist}
                    </span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-sm text-gray-500">{image.year}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-lg font-bold text-indigo-600">
                    {formatPrice(image.price)}
                  </p>
                </div>
              </div>

              {image.description && (
                <div className="mt-3 mb-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {image.description}
                  </p>
                </div>
              )}

              <div className="flex flex-col space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {image.style}
                  </span>
                  {image.featured && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Featured
                    </span>
                  )}
                  {image.sold && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Sold
                    </span>
                  )}
                </div>
                <div className="flex justify-end">
                  <ArtworkActions
                    artworkId={image.id}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

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
