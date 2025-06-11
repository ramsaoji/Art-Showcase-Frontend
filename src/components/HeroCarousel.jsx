import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPreviewUrl, getFullSizeUrl } from "../config/cloudinary";
import { Link } from "react-router-dom";
import { ArrowRightIcon, PhotoIcon } from "@heroicons/react/24/outline";
import Loader from "./ui/Loader";
import { trpc } from "../utils/trpc"; // Adjust import path as needed

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

  // Handle error state
  if (error) {
    console.error("Error loading featured images:", error);
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

        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 backdrop-blur-[2px]" />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center px-4 sm:px-6 text-center z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
              <PhotoIcon className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-artistic text-[3rem] sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 sm:mb-8 leading-tight tracking-wide"
          >
            Welcome to{" "}
            <span className="italic block sm:inline">Art Showcase</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-sans text-lg sm:text-xl md:text-2xl text-white/90 mb-6 sm:mb-10 max-w-2xl leading-relaxed tracking-wide"
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
              className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-3.5 border-2 border-white/20 backdrop-blur-sm rounded-full text-white font-sans text-base sm:text-lg font-medium hover:bg-white/10 transition-colors duration-300"
            >
              Explore Gallery
              <ArrowRightIcon className="ml-2 sm:ml-3 h-4 sm:h-5 w-4 sm:w-5" />
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="relative h-[80vh] sm:h-[calc(100vh-5rem)] overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

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
                className={`max-h-full max-w-full z-10 drop-shadow-xl ${
                  isTallImage ? "object-contain" : "object-cover"
                }`}
                loading={currentImageIndex === 0 ? "eager" : "lazy"}
              />
            </picture>
          </motion.div>
        </AnimatePresence>

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

        {/* <div className="absolute inset-0 z-20 flex flex-col justify-center sm:justify-center md:justify-center px-4 sm:px-6">
          <div className="relative mx-auto max-w-7xl -mt-16 sm:mt-0">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-artistic text-[2.75rem] sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 sm:mb-8 leading-tight tracking-wide"
            >
              Welcome to{" "}
              <span className="italic block sm:inline">Art Showcase</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="font-sans text-base sm:text-xl md:text-2xl text-white/90 mb-6 sm:mb-10 max-w-2xl leading-relaxed tracking-wide"
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
        </div> */}

        {/* Navigation dots */}
        <div className="absolute bottom-14 sm:bottom-24 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2 sm:space-x-3">
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
                  By {images[currentImageIndex].artist}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
