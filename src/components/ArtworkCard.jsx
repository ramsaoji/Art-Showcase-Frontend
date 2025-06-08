import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PhotoIcon, StarIcon } from "@heroicons/react/24/outline";
import { formatPrice } from "../utils/formatters";
import { getThumbnailUrl } from "../config/cloudinary";
import useOptimizedImage from "../hooks/useOptimizedImage";
import ArtworkActions from "./ArtworkActions";
import Badge from "./Badge";
import { useAuth } from "../contexts/AuthContext";

export default function ArtworkCard({
  artwork,
  onDelete,
  onQuickView,
  priority = false,
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(priority); // If priority is true, consider it visible immediately
  const cardRef = useRef(null);
  const imageRef = useRef(null);
  const { isAdmin } = useAuth();

  // Use our custom hook for optimized image loading
  const {
    previewUrl,
    fullSizeUrl,
    isLoading,
    isError,
    highQualityLoaded,
    getSrcSet,
  } = useOptimizedImage(artwork.cloudinary_public_id, {
    lazy: !priority, // Don't lazy load priority images
    width: 600,
    quality: 80,
  });

  // Intersection Observer for lazy loading - only if not priority
  useEffect(() => {
    // Skip if this is a priority image
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "200px", // Start loading when within 200px of viewport
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.disconnect();
      }
    };
  }, [priority]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = (e) => {
    // Try fallback to original URL if available
    if (artwork.url && e.target.src !== artwork.url) {
      e.target.src = artwork.url;
    } else {
      setImageError(true);
    }
  };

  // Update imageError state if our hook reports an error
  useEffect(() => {
    if (isError) {
      setImageError(true);
    }
  }, [isError]);

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`group relative bg-white rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_25px_rgba(67,56,202,0.15)] transition-all duration-300 
        min-h-[650px] ${isAdmin ? "min-h-[720px]" : ""} 
        flex flex-col justify-between`}
    >
      {/* Status Indicators */}
      <div className="absolute top-4 left-4 z-[5] flex gap-2">
        {artwork.featured && (
          <Badge type="featured" animate withPing>
            <span className="inline-flex items-center">
              <StarIcon className="h-4 w-4 mr-1" />
              Featured
            </span>
          </Badge>
        )}
        {artwork.sold && (
          <Badge type="sold" animate withPing>
            Sold
          </Badge>
        )}
      </div>

      {/* Image Container */}
      <div
        ref={imageRef}
        className="relative h-[320px] rounded-t-2xl overflow-hidden bg-white flex-shrink-0"
      >
        {imageError ? (
          <div className="flex items-center justify-center h-full">
            <PhotoIcon className="h-12 w-12 text-gray-400" />
          </div>
        ) : (
          <>
            {/* Loading placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                <PhotoIcon className="h-12 w-12 text-gray-300" />
              </div>
            )}

            {/* Only load image when in viewport */}
            {isVisible && (
              <picture>
                {/* WebP format for browsers that support it */}
                <source
                  type="image/webp"
                  srcSet={getSrcSet([300, 600, 900])}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />

                {/* Low quality image placeholder while loading */}
                {!highQualityLoaded && previewUrl && (
                  <img
                    src={previewUrl}
                    alt={artwork.title}
                    className="absolute inset-0 h-full w-full object-cover blur-sm transition-opacity duration-300"
                    style={{ opacity: highQualityLoaded ? 0 : 0.8 }}
                  />
                )}

                {/* Main image */}
                <img
                  ref={imageRef}
                  src={fullSizeUrl || artwork.url}
                  alt={artwork.title}
                  className={`w-full h-full object-cover transform transition-all duration-700 group-hover:scale-110 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  loading={priority ? "eager" : "lazy"}
                />
              </picture>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
          </>
        )}

        {/* Overlay Content */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex gap-2 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                onQuickView?.(artwork);
              }}
              className="flex-1 px-4 py-2 text-sm font-sans font-medium text-white bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors max-w-[140px] shadow-lg"
            >
              Quick View
            </motion.button>
            <Link
              to={`/artwork/${artwork.id}`}
              className="flex-1 px-4 py-2 text-sm font-sans font-medium text-white bg-indigo-500/80 backdrop-blur-sm rounded-lg hover:bg-indigo-600/80 transition-colors text-center max-w-[140px] shadow-lg"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className={`relative p-6 flex-grow bg-white overflow-y-auto ${
          !isAdmin && "rounded-b-2xl"
        }`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-b from-indigo-50/50 via-white to-white pointer-events-none ${
            !isAdmin && "rounded-b-2xl"
          }`}
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Link to={`/artwork/${artwork.id}`} className="block group/title">
                <h3 className="font-artistic text-2xl font-bold text-gray-900 tracking-wide group-hover/title:text-indigo-600 transition-colors">
                  {artwork.title}
                </h3>
              </Link>
              <div className="mt-2 flex items-center text-base font-sans">
                <div className="relative group">
                  <span className="font-artistic text-lg text-indigo-600 group-hover:text-indigo-700 transition-colors">
                    {artwork.artist}
                  </span>
                  <div className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                </div>
                <span className="mx-2 text-gray-300">•</span>
                <span className="text-gray-600">{artwork.year}</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <p className="font-artistic text-2xl font-bold text-indigo-600 tracking-wide">
                {formatPrice(artwork.price)}
              </p>
            </div>
          </div>

          {artwork.description && (
            <p className="mt-4 font-sans text-base text-gray-600 leading-relaxed line-clamp-3">
              {artwork.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-5">
            <span className="px-3 py-1 text-sm font-sans font-medium bg-white text-gray-800 rounded-full shadow-sm border border-gray-100">
              {artwork.style}
            </span>
            <span className="px-3 py-1 text-sm font-sans font-medium bg-white text-gray-800 rounded-full shadow-sm border border-gray-100">
              {artwork.material}
            </span>
            <span className="px-3 py-1 text-sm font-sans font-medium bg-white text-gray-800 rounded-full shadow-sm border border-gray-100">
              {artwork.dimensions}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons - Fixed position at bottom */}
      {isAdmin && (
        <div className="p-6 border-t border-gray-100 flex-shrink-0 bg-white rounded-b-2xl">
          <div className="flex justify-end">
            <ArtworkActions artworkId={artwork.id} onDelete={onDelete} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
