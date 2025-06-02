import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  PhotoIcon,
  PlusIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  StarIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { collection, query, orderBy, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
// import { useAuth } from "../contexts/AuthContext";
import ImageModal from "../components/ImageModal";
import ArtworkActions from "../components/ArtworkActions";
import { formatPrice } from "../utils/formatters";
import { getOptimizedImageUrl } from "../config/cloudinary";
import ArtworkCard from "../components/ArtworkCard";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Dialog } from "@headlessui/react";

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
  const [searchParams] = useSearchParams();
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState({
    material: "all",
    availability: "all",
    featured: "all",
  });
  const [materials, setMaterials] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  // const { isAdmin } = useAuth();

  // Handle URL parameters
  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam === "featured") {
      setFilters((prev) => ({ ...prev, featured: "featured" }));
    }
  }, [searchParams]);

  // Load artworks and extract unique filters
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
          createdAt: doc.data().createdAt?.toDate(),
        }));

        setImages(artworks);
        setFilteredImages(artworks);

        // Extract unique materials
        const uniqueMaterials = [
          ...new Set(artworks.map((art) => art.material)),
        ].filter(Boolean);

        setMaterials(uniqueMaterials);
      } catch (error) {
        console.error("Error loading artworks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, []);

  // Apply sorting and filtering
  useEffect(() => {
    let result = [...images];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (img) =>
          img.title?.toLowerCase().includes(query) ||
          img.artist?.toLowerCase().includes(query) ||
          img.description?.toLowerCase().includes(query) ||
          img.style?.toLowerCase().includes(query) ||
          img.material?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.material !== "all") {
      result = result.filter((img) => img.material === filters.material);
    }
    if (filters.availability !== "all") {
      if (filters.availability === "available") {
        result = result.filter((img) => !img.sold);
      } else if (filters.availability === "sold") {
        result = result.filter((img) => img.sold);
      }
    }
    if (filters.featured !== "all") {
      result = result.filter(
        (img) => img.featured === (filters.featured === "featured")
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.createdAt - a.createdAt;
        case "oldest":
          return a.createdAt - b.createdAt;
        case "price-high":
          return b.price - a.price;
        case "price-low":
          return a.price - b.price;
        case "year-new":
          return b.year - a.year;
        case "year-old":
          return a.year - b.year;
        default:
          return 0;
      }
    });

    setFilteredImages(result);
  }, [images, filters, sortBy, searchQuery]);

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleImageError = (imageId) => {
    setImageErrors((prev) => ({ ...prev, [imageId]: true }));
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
    <div className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-96 left-1/2 transform -translate-x-1/2">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-100/30 to-purple-100/30 blur-3xl" />
        </div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
          <div className="w-96 h-96 rounded-full bg-gradient-to-br from-indigo-100/20 to-purple-100/20 blur-3xl" />
        </div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h1 className="font-artistic text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-wide">
            Art Gallery
          </h1>
          <p className="font-sans text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Discover our curated collection of exceptional artworks from
            talented artists around the world
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, artist, style, or material..."
                className="w-full pl-12 pr-4 py-4 text-base font-sans rounded-full bg-white/80 border border-gray-200 focus:border-indigo-400 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 transition-all duration-300 shadow-sm hover:shadow-md"
              />
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters and Sort Section */}
        <div className="mb-12">
          {/* Search Results Count */}
          {searchQuery.trim() && (
            <div className="mb-6 text-center">
              <p className="text-base sm:text-lg font-sans tracking-wide">
                <span className="font-medium text-gray-900">
                  Found {filteredImages.length}{" "}
                  {filteredImages.length === 1 ? "artwork" : "artworks"}
                </span>{" "}
                <span className="text-gray-600">for</span>{" "}
                <span className="font-medium text-indigo-600">
                  "{searchQuery}"
                </span>
              </p>
            </div>
          )}

          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="w-full flex items-center justify-center px-4 py-3 rounded-full bg-indigo-600 text-white font-sans text-base font-medium hover:bg-indigo-700 transition-colors"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters & Sort
            </button>
          </div>

          {/* Mobile Filters Dialog */}
          <Transition.Root show={isMobileFiltersOpen} as={Fragment}>
            <Dialog
              as="div"
              className="relative z-50 lg:hidden"
              onClose={setIsMobileFiltersOpen}
            >
              <Transition.Child
                as={Fragment}
                enter="transition-opacity ease-linear duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity ease-linear duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
              </Transition.Child>

              <div className="fixed inset-0 z-50 flex">
                <Transition.Child
                  as={Fragment}
                  enter="transition ease-in-out duration-300 transform"
                  enterFrom="translate-y-full"
                  enterTo="translate-y-0"
                  leave="transition ease-in-out duration-300 transform"
                  leaveFrom="translate-y-0"
                  leaveTo="translate-y-full"
                >
                  <Dialog.Panel className="relative flex flex-col w-full h-[90vh] mt-auto bg-white rounded-t-3xl px-4 pb-4">
                    <div className="flex items-center justify-between py-4 border-b border-gray-200">
                      <Dialog.Title className="text-lg font-sans font-semibold text-gray-900">
                        Filters & Sort
                      </Dialog.Title>
                      <button
                        type="button"
                        className="p-2 -m-2 text-gray-400 hover:text-gray-500"
                        onClick={() => setIsMobileFiltersOpen(false)}
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="flex-1 py-6 overflow-y-auto">
                      {/* Sort Options */}
                      <div className="mb-8">
                        <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">
                          Sort by
                        </h3>
                        <div className="space-y-3">
                          {[
                            { value: "newest", label: "Newest First" },
                            { value: "oldest", label: "Oldest First" },
                            {
                              value: "price-high",
                              label: "Price: High to Low",
                            },
                            { value: "price-low", label: "Price: Low to High" },
                            {
                              value: "year-new",
                              label: "Year: Newest to Oldest",
                            },
                            {
                              value: "year-old",
                              label: "Year: Oldest to Newest",
                            },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setSortBy(option.value)}
                              className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm ${
                                sortBy === option.value
                                  ? "bg-indigo-50 text-indigo-600 font-medium"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Featured Filter */}
                      <div className="mb-8">
                        <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">
                          Featured Status
                        </h3>
                        <div className="space-y-3">
                          {[
                            { value: "all", label: "All Artworks" },
                            { value: "featured", label: "Featured Only" },
                            { value: "non-featured", label: "Non-Featured" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() =>
                                setFilters((prev) => ({
                                  ...prev,
                                  featured: option.value,
                                }))
                              }
                              className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm ${
                                filters.featured === option.value
                                  ? "bg-indigo-50 text-indigo-600 font-medium"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Material Filter */}
                      <div className="mb-8">
                        <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">
                          Material
                        </h3>
                        <div className="space-y-3">
                          <button
                            onClick={() =>
                              setFilters((prev) => ({
                                ...prev,
                                material: "all",
                              }))
                            }
                            className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm ${
                              filters.material === "all"
                                ? "bg-indigo-50 text-indigo-600 font-medium"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            All Materials
                          </button>
                          {materials.map((material) => (
                            <button
                              key={material}
                              onClick={() =>
                                setFilters((prev) => ({ ...prev, material }))
                              }
                              className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm ${
                                filters.material === material
                                  ? "bg-indigo-50 text-indigo-600 font-medium"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {material}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Availability Filter */}
                      <div className="mb-8">
                        <h3 className="text-sm font-sans font-semibold text-gray-900 mb-4">
                          Availability
                        </h3>
                        <div className="space-y-3">
                          {[
                            { value: "all", label: "All" },
                            { value: "available", label: "Available" },
                            { value: "sold", label: "Sold" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() =>
                                setFilters((prev) => ({
                                  ...prev,
                                  availability: option.value,
                                }))
                              }
                              className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-sm ${
                                filters.availability === option.value
                                  ? "bg-indigo-50 text-indigo-600 font-medium"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reset Filters */}
                      {(filters.material !== "all" ||
                        filters.availability !== "all" ||
                        filters.featured !== "all") && (
                        <div className="mb-4">
                          <button
                            onClick={() =>
                              setFilters({
                                material: "all",
                                availability: "all",
                                featured: "all",
                              })
                            }
                            className="w-full text-center px-4 py-2.5 rounded-xl text-sm font-sans text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
                          >
                            Reset All Filters
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        className="w-full flex items-center justify-center px-4 py-3 rounded-full bg-indigo-600 text-white font-sans text-base font-medium hover:bg-indigo-700 transition-colors"
                        onClick={() => setIsMobileFiltersOpen(false)}
                      >
                        Apply Filters
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </Dialog>
          </Transition.Root>

          {/* Desktop Filters */}
          <div className="hidden lg:flex flex-wrap items-center justify-between gap-4 mb-6">
            {/* Combined Filter Dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                <FunnelIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Filters</span>
                {(filters.material !== "all" ||
                  filters.availability !== "all" ||
                  filters.featured !== "all") && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-indigo-100 text-indigo-800">
                    {Object.values(filters).filter((f) => f !== "all").length}
                  </span>
                )}
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute left-0 z-50 mt-2 w-72 origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100">
                  {/* Featured Filter Section */}
                  <div className="p-4">
                    <h3 className="text-sm font-sans font-semibold text-gray-900 mb-3">
                      Featured Status
                    </h3>
                    <div className="space-y-2">
                      {[
                        { value: "all", label: "All Artworks" },
                        { value: "featured", label: "Featured Only" },
                        { value: "non-featured", label: "Non-Featured" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              featured: option.value,
                            }))
                          }
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans ${
                            filters.featured === option.value
                              ? "bg-indigo-50 text-indigo-600 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="flex-grow">{option.label}</span>
                            {filters.featured === option.value && (
                              <svg
                                className="h-5 w-5 text-indigo-600"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Material Filter Section */}
                  <div className="p-4">
                    <h3 className="text-sm font-sans font-semibold text-gray-900 mb-3">
                      Material
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, material: "all" }))
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans ${
                          filters.material === "all"
                            ? "bg-indigo-50 text-indigo-600 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="flex-grow">All Materials</span>
                          {filters.material === "all" && (
                            <svg
                              className="h-5 w-5 text-indigo-600"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                      {materials.map((material) => (
                        <button
                          key={material}
                          onClick={() =>
                            setFilters((prev) => ({ ...prev, material }))
                          }
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans ${
                            filters.material === material
                              ? "bg-indigo-50 text-indigo-600 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="flex-grow">{material}</span>
                            {filters.material === material && (
                              <svg
                                className="h-5 w-5 text-indigo-600"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Availability Filter Section */}
                  <div className="p-4">
                    <h3 className="text-sm font-sans font-semibold text-gray-900 mb-3">
                      Availability
                    </h3>
                    <div className="space-y-2">
                      {[
                        { value: "all", label: "All" },
                        { value: "available", label: "Available" },
                        { value: "sold", label: "Sold" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              availability: option.value,
                            }))
                          }
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans ${
                            filters.availability === option.value
                              ? "bg-indigo-50 text-indigo-600 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="flex-grow">{option.label}</span>
                            {filters.availability === option.value && (
                              <svg
                                className="h-5 w-5 text-indigo-600"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reset Filters */}
                  {(filters.material !== "all" ||
                    filters.availability !== "all" ||
                    filters.featured !== "all") && (
                    <div className="p-4">
                      <button
                        onClick={() =>
                          setFilters({
                            material: "all",
                            availability: "all",
                            featured: "all",
                          })
                        }
                        className="w-full text-center px-3 py-2 rounded-lg text-sm font-sans text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  )}
                </Menu.Items>
              </Transition>
            </Menu>

            {/* Sort Dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-sans font-medium tracking-wide bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                <ArrowsUpDownIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Sort by:</span>{" "}
                {sortBy
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-2">
                    {[
                      { value: "newest", label: "Newest First" },
                      { value: "oldest", label: "Oldest First" },
                      { value: "price-high", label: "Price: High to Low" },
                      { value: "price-low", label: "Price: Low to High" },
                      { value: "year-new", label: "Year: Newest to Oldest" },
                      { value: "year-old", label: "Year: Oldest to Newest" },
                    ].map((option) => (
                      <Menu.Item key={option.value}>
                        {({ active }) => (
                          <button
                            onClick={() => setSortBy(option.value)}
                            className={`${
                              active
                                ? "bg-gray-50 text-indigo-600"
                                : "text-gray-700"
                            } ${
                              sortBy === option.value ? "font-medium" : ""
                            } block w-full px-4 py-2.5 text-sm text-left font-sans`}
                          >
                            {option.label}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>

          {/* Active Filters Display */}
          {(filters.material !== "all" ||
            filters.availability !== "all" ||
            filters.featured !== "all") && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {filters.featured !== "all" && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700">
                  <span className="mr-1">Featured:</span>{" "}
                  <span className="font-semibold">
                    {filters.featured === "featured"
                      ? "Featured Only"
                      : "Non-Featured"}
                  </span>
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, featured: "all" }))
                    }
                    className="ml-2 hover:text-indigo-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.material !== "all" && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700">
                  <span className="mr-1">Material:</span>{" "}
                  <span className="font-semibold">{filters.material}</span>
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, material: "all" }))
                    }
                    className="ml-2 hover:text-indigo-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.availability !== "all" && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-sans font-medium tracking-wide bg-indigo-50 text-indigo-700">
                  <span className="mr-1">Status:</span>{" "}
                  <span className="font-semibold">
                    {filters.availability === "available"
                      ? "Available"
                      : "Sold"}
                  </span>
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, availability: "all" }))
                    }
                    className="ml-2 hover:text-indigo-900"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={() =>
                  setFilters({
                    material: "all",
                    availability: "all",
                    featured: "all",
                  })
                }
                className="text-sm font-sans font-medium tracking-wide text-gray-500 hover:text-indigo-600 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
          {filteredImages.map((image) => (
            <ArtworkCard
              key={image.id}
              artwork={image}
              onDelete={handleDelete}
              onQuickView={handleImageClick}
            />
          ))}
        </div>

        {filteredImages.length === 0 && (
          <div className="text-center py-16 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
            <PhotoIcon className="mx-auto h-16 w-16 text-gray-400/80" />
            <h3 className="mt-4 text-xl sm:text-2xl font-artistic font-bold tracking-wide text-gray-900">
              No Artworks Found
            </h3>
            <p className="mt-3 text-base sm:text-lg font-sans tracking-wide leading-relaxed text-gray-600 max-w-md mx-auto">
              {searchQuery.trim() ? (
                <>
                  No artworks match your search{" "}
                  <span className="font-medium text-indigo-600">
                    "{searchQuery}"
                  </span>
                  <br />
                  Try different keywords or{" "}
                </>
              ) : (
                "No artworks match the selected filters. Try "
              )}
              <button
                onClick={() => {
                  setFilters({
                    material: "all",
                    availability: "all",
                    featured: "all",
                  });
                  setSearchQuery("");
                }}
                className="inline-flex font-medium text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                clear all filters
              </button>
            </p>
          </div>
        )}
      </div>

      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        image={selectedImage || {}}
        onPrevious={() => {
          const currentIndex = filteredImages.findIndex(
            (img) => img.id === selectedImage?.id
          );
          if (currentIndex > 0) {
            setSelectedImage(filteredImages[currentIndex - 1]);
          }
        }}
        onNext={() => {
          const currentIndex = filteredImages.findIndex(
            (img) => img.id === selectedImage?.id
          );
          if (currentIndex < filteredImages.length - 1) {
            setSelectedImage(filteredImages[currentIndex + 1]);
          }
        }}
        hasPrevious={
          selectedImage &&
          filteredImages.findIndex((img) => img.id === selectedImage.id) > 0
        }
        hasNext={
          selectedImage &&
          filteredImages.findIndex((img) => img.id === selectedImage.id) <
            filteredImages.length - 1
        }
      />
    </div>
  );
}
