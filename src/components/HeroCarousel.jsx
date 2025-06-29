import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPreviewUrl, getFullSizeUrl } from "../config/cloudinary";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import Loader from "./ui/Loader";
import { trpc } from "../utils/trpc"; // Adjust import path as needed
import Alert from "./Alert";
import { getFriendlyErrorMessage } from "../utils/formatters";

export default function HeroCarousel() {
  const imageRef = useRef(null);
  const [isTallImage, setIsTallImage] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [nextImagePreloaded, setNextImagePreloaded] = useState(false);
  const timerRef = useRef(null);

  // Use tRPC query to fetch artworks
  const {
    data: artworks = [],
    isLoading,
    error,
    refetch,
  } = trpc.artwork.getArtworksForHeroCarousel.useQuery();

  // Flatten the artworks structure to get a flat array of images with artwork metadata
  const images = useMemo(() => {
    const flattenedImages = [];
    artworks.forEach((artwork) => {
      if (artwork.images && Array.isArray(artwork.images)) {
        artwork.images.forEach((image) => {
          flattenedImages.push({
            ...image,
            title: artwork.title,
            artistName: artwork.artistName,
            artworkId: artwork.id,
          });
        });
      }
    });
    return flattenedImages;
  }, [artworks]);

  const handleImageLoad = () => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setIsTallImage(naturalHeight / naturalWidth > 1.25); // tweak ratio as needed
    }
  };

  // Preload next image when current image changes
  useEffect(() => {
    if (images.length > 0) {
      // Preload next image
      const nextIndex =
        currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1;
      const nextPublicId = images[nextIndex].cloudinary_public_id;

      if (nextPublicId && !imagesLoaded[nextIndex]) {
        const img = new Image();
        img.src = getPreviewUrl(nextPublicId);
        img.onload = () => {
          setNextImagePreloaded(true);
          setImagesLoaded((prev) => ({ ...prev, [nextIndex]: true }));
        };
      }

      // Set timer for carousel
      timerRef.current = setTimeout(() => {
        setCurrentImageIndex((prevIndex) =>
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
        setNextImagePreloaded(false);
      }, 5000);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [currentImageIndex, images, imagesLoaded]);

  // Show error alert if there is an error
  if (error) {
    return (
      <div className="relative h-[80vh] sm:h-[calc(100vh-5rem)] overflow-hidden flex items-center justify-center p-4 w-full">
        <div className="w-full max-w-md mx-auto">
          <Alert
            type="error"
            message={
              getFriendlyErrorMessage(error) ||
              "Failed to load carousel images."
            }
            onRetry={refetch}
          />
        </div>
      </div>
    );
  }

  // Fallback content when no images are available
  if (!isLoading && images.length === 0) {
    return (
      <div className="relative h-[80vh] sm:h-[calc(100vh-5rem)] overflow-hidden">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80"
          alt="Art gallery background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Enhanced gradient overlay with glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-indigo-900/40 to-purple-900/30 backdrop-blur-sm" />

        {/* Centered Hero Text */}
        <div className="absolute inset-0 z-20 flex items-center justify-center text-center px-4 sm:px-6">
          <div className="relative max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="p-8 sm:p-12"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="font-artistic text-[2.75rem] sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-2xl shadow-black/50 mb-4 sm:mb-8 leading-tight tracking-wide"
              >
                Welcome to{" "}
                <span className="italic block sm:inline text-white drop-shadow-2xl shadow-black/50">
                  Art Showcase
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="font-sans text-base sm:text-xl md:text-2xl text-white/90 drop-shadow-2xl shadow-black/50 mb-6 sm:mb-10 max-w-2xl mx-auto leading-relaxed tracking-wide"
              >
                Discover unique artworks from talented artists around the world
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <Link
                  to="/gallery"
                  className="inline-flex items-center px-6 py-3 sm:py-4 bg-black/40 backdrop-blur-md rounded-2xl text-white font-sans text-sm sm:text-lg font-semibold shadow-2xl shadow-black/20 transition-all duration-300 hover:bg-black/60 hover:shadow-2xl hover:shadow-black/30 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 border border-white/20 hover:border-white/40 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10">Explore Gallery</span>
                  <ArrowRightIcon className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[80vh] sm:min-h-[calc(100vh-5rem)] flex items-center justify-center ">
        {/* <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"> */}
        <Loader size="large" />
        {/* </div> */}
      </div>
    );
  }

  return (
    <div className="relative h-[80vh] sm:h-[calc(100vh-5rem)] overflow-hidden">
      {/* Enhanced gradient overlay with glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-indigo-900/30 to-purple-900/20 backdrop-blur-sm" />

      {/* Left/Right Arrow Navigation */}
      {images.length > 1 && (
        <>
          {/* Left Arrow */}
          <button
            aria-label="Previous image"
            onClick={() =>
              setCurrentImageIndex(
                currentImageIndex === 0
                  ? images.length - 1
                  : currentImageIndex - 1
              )
            }
            className="hidden lg:flex absolute left-6 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md border border-white/20 hover:scale-110 hover:border-white/30"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          {/* Right Arrow */}
          <button
            aria-label="Next image"
            onClick={() =>
              setCurrentImageIndex(
                currentImageIndex === images.length - 1
                  ? 0
                  : currentImageIndex + 1
              )
            }
            className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md border border-white/20 hover:scale-110 hover:border-white/30"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Image carousel */}
      <div className="relative h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {/* Enhanced blurred background with gradient overlay */}
            <div className="absolute inset-0">
              <img
                src={
                  images[currentImageIndex].cloudinary_public_id
                    ? getPreviewUrl(
                        images[currentImageIndex].cloudinary_public_id
                      )
                    : images[currentImageIndex].url
                }
                alt="blurred backdrop"
                className="absolute inset-0 w-full h-full object-cover blur-md scale-110"
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-pink-600/20 mix-blend-overlay" />
              <div className="absolute inset-0 bg-black/30" />
            </div>

            {/* Foreground Image with enhanced styling */}
            <picture className="relative z-10 flex items-center justify-center w-full h-full ">
              <source
                type="image/webp"
                srcSet={
                  images[currentImageIndex].cloudinary_public_id
                    ? `${getPreviewUrl(
                        images[currentImageIndex].cloudinary_public_id
                      )}&f=webp`
                    : images[currentImageIndex].url
                }
              />
              <div className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20 group-hover:ring-white/30 transition-all duration-300">
                <img
                  ref={imageRef}
                  onLoad={handleImageLoad}
                  src={
                    images[currentImageIndex].cloudinary_public_id
                      ? getPreviewUrl(
                          images[currentImageIndex].cloudinary_public_id
                        )
                      : images[currentImageIndex].url
                  }
                  alt={images[currentImageIndex].title}
                  className={`z-10 drop-shadow-xl 
                    w-screen h-screen object-cover 
                    xl:max-h-full xl:max-w-full xl:w-auto xl:h-auto 
                    ${isTallImage ? "object-contain" : "object-cover"}
                  `}
                  loading={currentImageIndex === 0 ? "eager" : "lazy"}
                />
                {/* Subtle glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 blur-xl -z-10 scale-110" />
              </div>
            </picture>

            {/* Dark overlay for better text visibility */}
            <div className="absolute inset-0 z-20 bg-black/30" />
          </motion.div>
        </AnimatePresence>

        {/* Enhanced Hero Content with glassmorphism */}
        <div className="absolute inset-0 z-30 flex items-center justify-center text-center px-4 sm:px-6">
          <div className="relative max-w-7xl mx-auto w-full flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="p-8 sm:p-10"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="font-artistic text-[2.75rem] sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white text-transparent drop-shadow-2xl shadow-black/50 mb-4 sm:mb-8 leading-tight tracking-wide"
              >
                Welcome to{" "}
                <span className="italic block sm:inline text-white drop-shadow-2xl shadow-black/50">
                  Art Showcase
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="font-sans text-base sm:text-xl md:text-2xl text-white/90 drop-shadow-2xl shadow-black/50 mb-6 sm:mb-10 max-w-2xl mx-auto leading-relaxed tracking-wide"
              >
                Discover unique artworks from talented artists around the world
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <Link
                  to="/gallery"
                  className="inline-flex items-center px-6 py-3 sm:py-4 bg-black/40 backdrop-blur-md rounded-2xl text-white font-sans text-sm sm:text-lg font-semibold shadow-2xl shadow-black/20 transition-all duration-300 hover:bg-black/60 hover:shadow-2xl hover:shadow-black/30 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 border border-white/20 hover:border-white/40 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10">Explore Gallery</span>
                  <ArrowRightIcon className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Enhanced Navigation dots */}
            <div className="flex space-x-2 sm:space-x-3">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none 
                    ${
                      index === currentImageIndex
                        ? "bg-white scale-110 shadow-lg shadow-white/25"
                        : "bg-white/40 scale-90 hover:scale-105 hover:bg-white/60"
                    }
                  `}
                >
                  <span className="sr-only">Go to slide {index + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Image details overlay with glassmorphism */}
        <div className="absolute bottom-0 right-0 z-30 p-2 md:p-4">
          <div className="max-w-xs sm:max-w-sm md:max-w-md">
            <motion.div
              key={`details-${currentImageIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-black/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-white/20 shadow-2xl shadow-black/50"
            >
              <div className="flex flex-col space-y-1 sm:space-y-2">
                <div>
                  <h3 className="text-xs sm:text-sm md:text-lg lg:text-xl font-artistic font-bold bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent tracking-wide leading-tight">
                    {images[currentImageIndex].title}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg font-sans text-white/90 mt-0.5 sm:mt-1">
                    By {images[currentImageIndex].artistName}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Enhanced Down Arrow Scroll Indicator */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [0, 12, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="absolute left-0 right-0 bottom-4 sm:bottom-6 z-30 flex flex-col items-center justify-center"
      >
        <div className="bg-black/40 backdrop-blur-md rounded-full p-2 sm:p-3 border border-white/20">
          <ChevronDownIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white/80 drop-shadow-lg" />
        </div>
        <span className="sr-only">Scroll down</span>
      </motion.div>
    </div>
  );
}
