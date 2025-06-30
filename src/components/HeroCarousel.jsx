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
import { trpc } from "../utils/trpc";
import Alert from "./Alert";
import { getFriendlyErrorMessage } from "../utils/formatters";
import useMediaQuery from "../hooks/useMediaQuery";

const CarouselIndicators = ({
  slides,
  currentSlideIndex,
  setCurrentSlideIndex,
  resetTimer,
}) => {
  if (slides.length <= 1) {
    return null;
  }
  return (
    <div className="flex space-x-2 sm:space-x-3 pointer-events-auto">
      {slides.map((_, index) => (
        <button
          key={index}
          onClick={() => {
            if (index !== currentSlideIndex) {
              setCurrentSlideIndex(index);
              resetTimer();
            }
          }}
          className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 focus:outline-none 
            ${
              index === currentSlideIndex
                ? "bg-white scale-110 shadow-lg shadow-white/25"
                : "bg-white/40 scale-90 hover:scale-105 hover:bg-white/60"
            }
          `}
        >
          <span className="sr-only">Go to slide {index + 1}</span>
        </button>
      ))}
    </div>
  );
};

export default function HeroCarousel() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [artworkLoaded, setArtworkLoaded] = useState(false);
  const timerRef = useRef(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Use tRPC query to fetch artworks
  const {
    data: artworks = [],
    isLoading,
    error,
    refetch,
  } = trpc.artwork.getArtworksForHeroCarousel.useQuery();

  // Create slides array with welcome slide + artwork slides
  const slides = useMemo(() => {
    const artworkSlides = [];
    artworks.forEach((artwork) => {
      if (artwork.images && Array.isArray(artwork.images)) {
        artwork.images.forEach((image) => {
          artworkSlides.push({
            type: "artwork",
            ...image,
            title: artwork.title,
            artistName: artwork.artistName,
            artworkId: artwork.id,
          });
        });
      }
    });

    // Add welcome slide at the beginning
    const welcomeSlide = {
      type: "welcome",
      title: "Welcome to Art Showcase",
      subtitle:
        "Discover unique artworks from talented artists around the world",
      backgroundImage:
        "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&q=80&w=2070",
    };

    return [welcomeSlide, ...artworkSlides];
  }, [artworks]);

  const handleNext = () => {
    setCurrentSlideIndex((prevIndex) =>
      prevIndex === slides.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prevIndex) =>
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
  };

  // Reset loading states when slide changes
  useEffect(() => {
    setBackgroundLoaded(false);
    setArtworkLoaded(false);
  }, [currentSlideIndex]);

  // Set timer for carousel
  useEffect(() => {
    if (slides.length > 1) {
      timerRef.current = setTimeout(handleNext, 5000);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentSlideIndex, slides.length]);

  const resetTimer = () => {
    clearTimeout(timerRef.current);
    if (slides.length > 1) {
      timerRef.current = setTimeout(handleNext, 5000);
    }
  };

  const currentSlide = slides[currentSlideIndex];

  // Preload both images simultaneously
  useEffect(() => {
    if (currentSlide) {
      // Preload background image
      const backgroundImg = new Image();
      backgroundImg.onload = () => setBackgroundLoaded(true);
      backgroundImg.onerror = () => setBackgroundLoaded(true);

      if (currentSlide.type === "welcome") {
        backgroundImg.src = currentSlide.backgroundImage;
        setBackgroundLoaded(true); // Instant load
        setArtworkLoaded(true);
      } else {
        const bgUrl = currentSlide.cloudinary_public_id
          ? getPreviewUrl(currentSlide.cloudinary_public_id)
          : currentSlide.url;

        backgroundImg.src = bgUrl;

        // Eager preload using <link rel="preload"> to prioritize
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = bgUrl;
        document.head.appendChild(link);

        const artworkImg = new Image();
        artworkImg.onload = () => setArtworkLoaded(true);
        artworkImg.onerror = () => setArtworkLoaded(true);
        artworkImg.src = currentSlide.cloudinary_public_id
          ? getFullSizeUrl(currentSlide.cloudinary_public_id)
          : currentSlide.url;
      }
    }
  }, [currentSlide]);

  useEffect(() => {
    const nextIndex = (currentSlideIndex + 1) % slides.length;
    const nextSlide = slides[nextIndex];

    if (nextSlide && nextSlide.type === "artwork") {
      const preload = new Image();
      preload.src = nextSlide.cloudinary_public_id
        ? getFullSizeUrl(nextSlide.cloudinary_public_id)
        : nextSlide.url;
    }
  }, [currentSlideIndex, slides]);

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
  if (!isLoading && slides.length <= 1) {
    return (
      <div className="relative h-[80vh] sm:h-[calc(100vh-5rem)] overflow-hidden">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&q=80&w=2070"
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
                className="font-artistic text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-2xl shadow-black/50 mb-4 sm:mb-8 leading-tight tracking-wide"
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
                className="font-sans text-lg sm:text-xl md:text-2xl text-white/90 drop-shadow-2xl shadow-black/50 mb-6 sm:mb-10 max-w-2xl mx-auto leading-relaxed tracking-wide"
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
                  className="inline-flex items-center px-8 py-4 sm:py-4 bg-black/40 backdrop-blur-md rounded-2xl text-white font-sans text-lg sm:text-lg font-semibold shadow-2xl shadow-black/20 transition-all duration-300 hover:bg-black/60 hover:shadow-2xl hover:shadow-black/30 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 border border-white/20 hover:border-white/40 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10">Explore Gallery</span>
                  <ArrowRightIcon className="ml-2 sm:ml-3 h-5 w-5 sm:h-5 sm:w-5 relative z-10" />
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
      <div className="min-h-[80vh] sm:min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="relative h-[80vh] sm:h-[calc(100vh-5rem)] overflow-hidden">
      {/* Background Image with smoother transitions */}
      <AnimatePresence mode="wait">
        <motion.img
          key={`bg-${currentSlideIndex}`}
          src={
            currentSlide.type === "welcome"
              ? currentSlide.backgroundImage
              : currentSlide.cloudinary_public_id
              ? getPreviewUrl(currentSlide.cloudinary_public_id)
              : currentSlide.url
          }
          alt="blurred backdrop"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1.05 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{
            duration: 0.6, // Faster
            ease: [0.42, 0, 0.58, 1], // Smoother (ease-in-out)
          }}
          className={`absolute inset-0 w-full h-full object-cover ${
            currentSlide.type === "welcome" ? "blur-sm" : "blur-md"
          }`}
          aria-hidden="true"
        />
      </AnimatePresence>

      {/* Enhanced gradient overlay with glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-indigo-900/30 to-purple-900/20 backdrop-blur-sm" />
      <div className="absolute inset-0 bg-black/30" />

      {/* Left/Right Arrow Navigation */}
      {slides.length > 1 && (
        <>
          {/* Left Arrow */}
          <button
            aria-label="Previous slide"
            onClick={() => {
              handlePrev();
              resetTimer();
            }}
            className="hidden xl:flex absolute left-6 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md border border-white/20 hover:scale-110 hover:border-white/30"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          {/* Right Arrow */}
          <button
            aria-label="Next slide"
            onClick={() => {
              handleNext();
              resetTimer();
            }}
            className="hidden xl:flex absolute right-6 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md border border-white/20 hover:scale-110 hover:border-white/30"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Combined container for image and text */}
      <div className="relative h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {currentSlide.type === "artwork" ? (
            <motion.div
              key={`artwork-content-${currentSlideIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full mx-auto xl:grid xl:grid-cols-2 xl:items-stretch xl:gap-x-12 xl:mx-28 overflow-hidden"
            >
              {/* Image container for artwork slides */}
              <div className="relative h-full xl:h-auto xl:mx-16 2xl:mx-20 xl:self-center">
                <div className="relative w-full h-full xl:max-h-[75vh] 2xl:max-h-[80vh] xl:flex-shrink-0 flex items-center justify-center overflow-hidden xl:rounded-2xl xl:shadow-2xl xl:ring-1 xl:ring-white/20 xl:aspect-[3/4]">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`art-img-${
                        currentSlide.cloudinary_public_id || currentSlide.url
                      }`}
                      src={
                        currentSlide.cloudinary_public_id
                          ? getFullSizeUrl(currentSlide.cloudinary_public_id)
                          : currentSlide.url
                      }
                      alt={currentSlide.title}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="object-cover w-full h-full z-10"
                      loading="eager"
                      onLoad={() => setArtworkLoaded(true)}
                      onError={() => setArtworkLoaded(true)}
                    />
                  </AnimatePresence>

                  {/* Gradient glow behind the image */}
                  <div className="absolute inset-0 xl:rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 blur-xl -z-10 hidden xl:block" />

                  {/* Loader on top while image loads */}
                  {!artworkLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-20">
                      <Loader />
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Hero Content for artwork */}
              <div className="absolute inset-0 bg-black/40 xl:bg-transparent xl:static xl:min-w-0 z-30 flex items-center justify-center text-center xl:text-left px-4 sm:px-6 pointer-events-none h-full">
                <div className="relative w-full flex flex-col items-center xl:items-start justify-center h-full">
                  <div className="p-8 sm:p-10 w-full">
                    <AnimatePresence mode="wait">
                      <motion.h1
                        key={`title-${currentSlideIndex}`}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.95 }}
                        transition={{
                          duration: 0.7,
                          ease: [0.25, 0.1, 0.25, 1.0],
                        }}
                        className="font-artistic text-5xl sm:text-6xl md:text-7xl xl:text-6xl 2xl:text-7xl font-bold text-white drop-shadow-2xl shadow-black/50 mb-4 sm:mb-8 xl:mb-6 tracking-wide xl:leading-tight xl:break-words xl:hyphens-auto"
                        style={{
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                        }}
                      >
                        {currentSlide.title}
                      </motion.h1>
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      <motion.p
                        key={`subtitle-${currentSlideIndex}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          duration: 0.7,
                          ease: [0.25, 0.1, 0.25, 1.0],
                        }}
                        className="font-sans text-lg sm:text-xl md:text-2xl xl:text-3xl text-white/90 drop-shadow-2xl shadow-black/50 mb-6 sm:mb-10 max-w-2xl mx-auto xl:mx-0 leading-relaxed tracking-wide"
                      >
                        By {currentSlide.artistName}
                      </motion.p>
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`button-${currentSlideIndex}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          duration: 0.6,
                          delay: 0.2,
                          ease: [0.25, 0.1, 0.25, 1.0],
                        }}
                        className="pointer-events-auto"
                      >
                        <Link
                          to={`/artwork/${currentSlide.artworkId}`}
                          className="inline-flex items-center px-4 py-2 md:px-6 md:py-3 xl:px-8 xl:py-4 bg-black/40 backdrop-blur-md rounded-2xl text-white font-sans text-base md:text-lg xl:text-lg font-semibold shadow-2xl shadow-black/20 transition-all duration-300 hover:bg-black/60 hover:shadow-2xl hover:shadow-black/30 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 border border-white/20 hover:border-white/40 relative overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <span className="relative z-10">View Artwork</span>
                          <ArrowRightIcon className="ml-2 md:ml-3 h-4 w-4 md:h-5 md:w-5 relative z-10" />
                        </Link>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  {/* Navigation dots for artwork slides */}
                  <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 xl:static xl:transform-none xl:pl-10 xl:pb-10">
                    <CarouselIndicators
                      slides={slides}
                      currentSlideIndex={currentSlideIndex}
                      setCurrentSlideIndex={setCurrentSlideIndex}
                      resetTimer={resetTimer}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            currentSlide.type === "welcome" && (
              <div
                key={`welcome-content-${currentSlideIndex}`}
                className="absolute inset-0 z-30 flex items-center justify-center text-center px-4 sm:px-6 pointer-events-none"
              >
                <div className="relative max-w-7xl mx-auto w-full flex flex-col items-center justify-center h-full">
                  <div className="p-8 sm:p-10 w-full">
                    <AnimatePresence mode="wait">
                      <motion.h1
                        key={`title-${currentSlideIndex}`}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.95 }}
                        transition={{
                          duration: 0.7,
                          ease: [0.25, 0.1, 0.25, 1.0],
                        }}
                        className="font-artistic text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-bold text-white drop-shadow-2xl shadow-black/50 mb-4 sm:mb-8 tracking-wide"
                      >
                        Welcome to{" "}
                        <span className="italic block sm:inline text-white drop-shadow-2xl shadow-black/50">
                          Art Showcase
                        </span>
                      </motion.h1>
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      <motion.p
                        key={`subtitle-${currentSlideIndex}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          duration: 0.7,
                          ease: [0.25, 0.1, 0.25, 1.0],
                        }}
                        className="font-sans text-lg sm:text-xl md:text-2xl xl:text-3xl text-white/90 drop-shadow-2xl shadow-black/50 mb-6 sm:mb-10 max-w-2xl mx-auto leading-relaxed tracking-wide"
                      >
                        {currentSlide.subtitle}
                      </motion.p>
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`button-${currentSlideIndex}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          duration: 0.6,
                          delay: 0.2,
                          ease: [0.25, 0.1, 0.25, 1.0],
                        }}
                        className="pointer-events-auto"
                      >
                        <Link
                          to="/gallery"
                          className="inline-flex items-center px-4 py-2 md:px-6 md:py-3 xl:px-8 xl:py-4 bg-black/40 backdrop-blur-md rounded-2xl text-white font-sans text-base md:text-lg xl:text-lg font-semibold shadow-2xl shadow-black/20 transition-all duration-300 hover:bg-black/60 hover:shadow-2xl hover:shadow-black/30 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 border border-white/20 hover:border-white/40 relative overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <span className="relative z-10">Explore Gallery</span>
                          <ArrowRightIcon className="ml-2 md:ml-3 h-4 w-4 md:h-5 md:w-5 relative z-10" />
                        </Link>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2">
                    <CarouselIndicators
                      slides={slides}
                      currentSlideIndex={currentSlideIndex}
                      setCurrentSlideIndex={setCurrentSlideIndex}
                      resetTimer={resetTimer}
                    />
                  </div>
                </div>
              </div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced Down Arrow Scroll Indicator - only show when content is ready */}
      {currentSlide && (
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
      )}
    </div>
  );
}
