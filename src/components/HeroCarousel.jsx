import { useState, useEffect, useRef } from "react";
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
    data: images = [],
    isLoading,
    error,
    refetch,
  } = trpc.artwork.getArtworksForHeroCarousel.useQuery();

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

        {/* Hero Content */}
        {/* Gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10" />

        {/* Centered Hero Text */}
        <div className="absolute inset-0 z-20 flex items-center justify-center text-center px-4 sm:px-6">
          <div className="relative max-w-7xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-artistic text-[2.75rem] sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-xl mb-4 sm:mb-8 leading-tight tracking-wide"
            >
              Welcome to{" "}
              <span className="italic block sm:inline">Art Showcase</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="font-sans text-base sm:text-xl md:text-2xl text-white/90 drop-shadow-md mb-6 sm:mb-10 max-w-2xl mx-auto leading-relaxed tracking-wide"
            >
              Discover unique artworks from talented artists around the world
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link
                to="/gallery"
                className="inline-flex items-center px-6 sm:px-8 py-2.5 sm:py-3.5 border-2 border-white/20 backdrop-blur-sm rounded-full text-white font-sans text-base sm:text-lg font-medium hover:bg-white/10 transition-colors duration-300"
              >
                Explore Gallery
                <ArrowRightIcon className="ml-2 sm:ml-3 h-4 sm:h-5 w-4 sm:w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[80vh] sm:min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="relative h-[80vh] sm:h-[calc(100vh-5rem)] overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

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
            className="hidden lg:flex absolute left-2 lg:left-6 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 lg:p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            style={{ backdropFilter: "blur(2px)" }}
          >
            <ChevronLeftIcon className="h-6 w-6 sm:h-8 sm:w-8" />
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
            className="hidden lg:flex absolute right-2 lg:right-6 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 lg:p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            style={{ backdropFilter: "blur(2px)" }}
          >
            <ChevronRightIcon className="h-6 w-6 sm:h-8 sm:w-8" />
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
            {/* Blurred Background */}
            <img
              src={
                images[currentImageIndex].cloudinary_public_id
                  ? getPreviewUrl(
                      images[currentImageIndex].cloudinary_public_id
                    )
                  : images[currentImageIndex].url
              }
              alt="blurred backdrop"
              className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-90"
              aria-hidden="true"
            />

            {/* Foreground Image */}
            <picture className="relative z-10 flex items-center justify-center w-full h-full">
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
            </picture>
          </motion.div>
        </AnimatePresence>

        {/* Hero Content */}
        {/* Gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10" />

        {/* Centered Hero Text and Navigation Dots */}
        <div className="absolute inset-0 z-20 flex items-center justify-center text-center px-4 sm:px-6">
          <div className="relative max-w-7xl mx-auto w-full flex flex-col items-center justify-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-artistic text-[2.75rem] sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-xl mb-4 sm:mb-8 leading-tight tracking-wide"
            >
              Welcome to{" "}
              <span className="italic block sm:inline">Art Showcase</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="font-sans text-base sm:text-xl md:text-2xl text-white/90 drop-shadow-md mb-6 sm:mb-10 max-w-2xl mx-auto leading-relaxed tracking-wide"
            >
              Discover unique artworks from talented artists around the world
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link
                to="/gallery"
                className="inline-flex items-center px-6 sm:px-8 py-2.5 sm:py-3.5 border-2 border-white/20 backdrop-blur-sm rounded-full text-white font-sans text-base sm:text-lg font-medium hover:bg-white/10 transition-colors duration-300"
              >
                Explore Gallery
                <ArrowRightIcon className="ml-2 sm:ml-3 h-4 sm:h-5 w-4 sm:w-5" />
              </Link>
            </motion.div>

            {/* Navigation dots */}
            <div className="mt-8 sm:mt-10 flex space-x-2 sm:space-x-3">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 sm:w-3 h-2 sm:h-3 rounded-full transition-all duration-300 ${
                    index === currentImageIndex
                      ? "bg-white scale-100"
                      : "bg-white/50 scale-75 hover:scale-90 hover:bg-white/70"
                  }`}
                >
                  <span className="sr-only">Go to slide {index + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Image details overlay */}
        <div className="absolute bottom-0 inset-x-0 sm:right-0 sm:inset-x-auto z-20 p-4 sm:p-8 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
          <div className="max-w-7xl mx-auto">
            <motion.div
              key={`details-${currentImageIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-4"
            >
              <div>
                <h3 className="text-lg sm:text-2xl font-artistic font-bold text-white tracking-wide">
                  {images[currentImageIndex].title}
                </h3>
                <p className="text-sm sm:text-lg font-sans text-white/90 mt-1">
                  By {images[currentImageIndex].artistName}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Down Arrow Scroll Indicator */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [0, 12, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="absolute left-0 right-0 bottom-6 z-30 flex flex-col items-center justify-center"
      >
        <ChevronDownIcon className="h-8 w-8 text-white/80 drop-shadow-lg animate-bounce-slow" />
        <span className="sr-only">Scroll down</span>
      </motion.div>
    </div>
  );
}
