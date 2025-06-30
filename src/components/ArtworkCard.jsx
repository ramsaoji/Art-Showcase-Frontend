import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhotoIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
// import { format } from "date-fns";
import { formatPrice, formatLocalDateTime } from "../utils/formatters";
// import { getThumbnailUrl } from "../config/cloudinary";
import useOptimizedImage from "../hooks/useOptimizedImage";
import ArtworkActions from "./ArtworkActions";
import Badge from "./Badge";
import { useAuth } from "../contexts/AuthContext";
import PurchaseRequestModal from "./PurchaseRequestModal";
import SocialMediaModal from "./SocialMediaModal";

export default function ArtworkCard({
  artwork,
  onDelete,
  onQuickView,
  priority = false,
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const cardRef = useRef(null);
  const imageRef = useRef(null);
  const descriptionRef = useRef(null);
  const { isSuperAdmin, isArtist, user } = useAuth();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [socialMediaModal, setSocialMediaModal] = useState({
    isOpen: false,
    type: null,
    url: null,
    title: null,
  });

  // Multi-image carousel state
  const images =
    Array.isArray(artwork?.images) && artwork?.images.length > 0
      ? artwork.images
      : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoTimer = useRef();

  // Get optimized URLs for the current image only
  const currentImage = images[currentIndex] || {};
  const imageState = useOptimizedImage(
    currentImage.cloudinary_public_id || null,
    {
      width: 600,
      quality: 80,
    }
  );

  // Auto-advance logic
  useEffect(() => {
    if (images.length <= 1) return;
    autoTimer.current && clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => {
      setCurrentIndex((idx) => (idx + 1) % images.length);
    }, 4000);
    return () => clearTimeout(autoTimer.current);
  }, [currentIndex, images.length]);

  // Manual navigation
  const goTo = (idx) => {
    if (idx === currentIndex) return;
    clearTimeout(autoTimer.current);
    setCurrentIndex(idx);
  };
  const goPrev = (e) => {
    e && e.stopPropagation();
    clearTimeout(autoTimer.current);
    setCurrentIndex((idx) => (idx - 1 + images.length) % images.length);
  };
  const goNext = (e) => {
    e && e.stopPropagation();
    clearTimeout(autoTimer.current);
    setCurrentIndex((idx) => (idx + 1) % images.length);
  };

  // Check if text is truncated
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);

  useEffect(() => {
    // Check if description is truncated
    if (descriptionRef.current) {
      const element = descriptionRef.current;
      setIsDescriptionTruncated(element.scrollHeight > element.clientHeight);
    }
  }, [artwork?.title, artwork?.description]);

  // Intersection Observer for lazy loading - only if not priority
  useEffect(() => {
    if (priority) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "200px",
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
    // Try to fallback to the original URL if the optimized image fails
    if (currentImage.url && e.target.src !== currentImage.url) {
      e.target.src = currentImage.url;
    } else {
      setImageError(true);
    }
  };

  useEffect(() => {
    if (imageState.isError) {
      setImageError(true);
    }
  }, [imageState.isError]);

  // Reset image loading state when current image changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [currentIndex, currentImage.cloudinary_public_id, currentImage.url]);

  // Safe fallbacks for missing data
  const safeArtwork = {
    title: artwork.title || "Untitled",
    artist: artwork.artist || "Unknown Artist",
    year: artwork.year || "Year Unknown",
    price: artwork.price || 0,
    description: artwork.description || "",
    style: artwork.style || "Style Unknown",
    material: artwork.material || "Material Unknown",
    dimensions: artwork.dimensions || "Dimensions Unknown",
    ...artwork,
  };

  // Determine if the current user is the owner (artist) of this artwork
  const isOwner = user && artwork?.userId && user.id === artwork.userId;

  // Status badge visibility logic
  const canSeeStatusBadge =
    isSuperAdmin ||
    (isArtist && isOwner) ||
    (artwork?.status && artwork.status !== "ACTIVE");

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`group relative bg-gradient-to-br from-white/90 via-white/95 to-gray-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 ring-1 ring-white/10 hover:shadow-3xl hover:shadow-indigo-500/10 transition-all duration-500 
        h-[680px] flex flex-col justify-between overflow-hidden`}
    >
      {/* Status Indicators */}
      <div className="absolute top-4 left-4 z-[5] flex gap-2 flex-wrap max-w-[calc(100%-2rem)]">
        {safeArtwork.featured && (
          <Badge type="featured" animate withPing>
            <span className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent font-semibold">
              <StarIcon className="h-4 w-4 mr-1 text-white" />
              <span className="truncate text-white">Featured</span>
            </span>
          </Badge>
        )}
        {safeArtwork.sold && (
          <Badge type="sold" animate withPing>
            <span className="truncate font-semibold">Sold</span>
          </Badge>
        )}
      </div>

      {/* Add status badge */}
      {artwork?.status && canSeeStatusBadge && (
        <div className="absolute top-4 right-4 z-10">
          <Badge
            type={
              artwork.status === "ACTIVE"
                ? "active"
                : artwork.status === "INACTIVE"
                ? "inactive"
                : artwork.status === "EXPIRED"
                ? "expired"
                : "default"
            }
            animate
            withPing
          >
            {artwork.status === "EXPIRED"
              ? artwork.expiredBy === "admin"
                ? "Expired (admin)"
                : artwork.expiredBy === "auto"
                ? "Expired (auto)"
                : "Expired"
              : artwork.status.charAt(0) +
                artwork.status.slice(1).toLowerCase()}
          </Badge>
        </div>
      )}

      {/* Image Container */}
      <div
        ref={imageRef}
        className="relative h-[320px] rounded-t-3xl overflow-hidden bg-gradient-to-br from-gray-900/50 to-black/30 flex-shrink-0 group"
      >
        {images.length === 0 || imageError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Image not available</p>
            </div>
          </div>
        ) : (
          <>
            {/* Loading placeholder */}
            {!imageState.highQualityLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center z-10">
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4">
                  <PhotoIcon className="h-12 w-12 text-gray-300" />
                </div>
              </div>
            )}
            {/* Only load image when in viewport */}
            {isVisible && (
              <div className="relative w-full h-full overflow-hidden">
                <AnimatePresence>
                  <motion.img
                    key={currentIndex}
                    src={
                      imageState.fullSizeUrl ||
                      currentImage.url ||
                      "placeholder.png"
                    }
                    alt={safeArtwork.title}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-110"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    loading={priority ? "eager" : "lazy"}
                  />
                </AnimatePresence>
              </div>
            )}
            {/* Enhanced gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-100 transition-all duration-300" />
            {/* Carousel arrows */}
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md border border-white/20 hover:scale-110 hover:border-white/30"
                  onClick={goPrev}
                  tabIndex={0}
                  aria-label="Previous image"
                  type="button"
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md border border-white/20 hover:scale-110 hover:border-white/30"
                  onClick={goNext}
                  tabIndex={0}
                  aria-label="Next image"
                  type="button"
                >
                  <ChevronRightIcon className="h-6 w-6" />
                </button>
                {/* Enhanced dots indicator */}
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1 z-20 bg-black/30 backdrop-blur-md rounded-full px-3 py-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        idx === currentIndex
                          ? "bg-white scale-110 shadow-lg shadow-white/25"
                          : "bg-white/50 scale-90 hover:scale-105 hover:bg-white/70"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        goTo(idx);
                      }}
                      aria-label={`Go to image ${idx + 1}`}
                      type="button"
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
        {/* Overlay Content */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end opacity-100 transition-all duration-300 pointer-events-none">
          <div className="flex gap-2 justify-center flex-wrap pointer-events-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                onQuickView?.(artwork);
              }}
              className="flex-1 min-w-[120px] max-w-[140px] px-4 py-2 text-sm font-sans font-medium text-white bg-white/20 backdrop-blur-md rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Quick View
            </motion.button>
            <motion.div
              className="flex-1 min-w-[120px] max-w-[140px]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to={`/artwork/${safeArtwork.id}`}
                className="block w-full h-full px-4 py-2 text-sm font-sans font-medium text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 backdrop-blur-md rounded-xl hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800 transition-all duration-300 text-center shadow-lg hover:shadow-xl"
              >
                View Details
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className={`relative p-6 flex-grow bg-gradient-to-br from-white via-white to-gray-50/80 backdrop-blur-xl overflow-auto ${
          !isSuperAdmin && "rounded-b-3xl"
        }`}
      >
        <div className="relative h-full flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <Link
                to={`/artwork/${safeArtwork.id}`}
                className="block group/title"
              >
                <h3
                  className="font-artistic text-2xl font-bold text-left bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-wide group-hover/title:from-indigo-600 group-hover/title:to-indigo-700 transition-all duration-300 leading-tight truncate whitespace-nowrap overflow-hidden"
                  title={safeArtwork.title}
                >
                  {safeArtwork.title}
                </h3>
              </Link>
              <div className="mt-2 flex items-center text-base font-sans flex-wrap gap-1">
                <div className="relative group">
                  <span className="font-artistic text-lg bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 bg-clip-text text-transparent group-hover:from-indigo-700 group-hover:via-indigo-800 group-hover:to-indigo-900 transition-all duration-300 break-words">
                    {safeArtwork.artistName ||
                      safeArtwork.artist ||
                      safeArtwork.artistEmail ||
                      "Unknown Artist"}
                    {safeArtwork.artistEmail && (
                      <span className="text-gray-500 text-sm font-sans ml-2">
                        ({safeArtwork.artistEmail})
                      </span>
                    )}
                  </span>
                  <div className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                </div>
                <span className="mx-2 text-gray-300 flex-shrink-0">•</span>
                <span className="text-gray-600 flex-shrink-0 font-sans">
                  {safeArtwork.year}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <p className="font-artistic text-2xl font-bold bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 bg-clip-text text-transparent tracking-wide text-right">
                {formatPrice(safeArtwork.price)}
              </p>
            </div>
          </div>

          {safeArtwork.description && (
            <div className="mb-4 text-left">
              <p
                ref={descriptionRef}
                className={`font-sans text-base text-gray-600 leading-relaxed ${
                  showFullDescription ? "" : "line-clamp-3"
                }`}
              >
                {safeArtwork.description}
              </p>
              {isDescriptionTruncated && !showFullDescription && (
                <button
                  onClick={() => setShowFullDescription(true)}
                  className="text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent hover:from-indigo-700 hover:to-indigo-800 mt-1 font-sans font-medium transition-all duration-300"
                >
                  Read more
                </button>
              )}
              {showFullDescription && isDescriptionTruncated && (
                <button
                  onClick={() => setShowFullDescription(false)}
                  className="text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent hover:from-indigo-700 hover:to-indigo-800 mt-1 font-sans font-medium transition-all duration-300"
                >
                  Read less
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pb-4 mt-auto">
            <span
              className="px-3 py-1 text-sm font-sans font-medium bg-white/60 backdrop-blur-sm text-gray-800 rounded-xl shadow-sm border border-gray-200/60 hover:border-gray-300/70 transition-colors"
              title={safeArtwork.style}
            >
              {safeArtwork.style}
            </span>
            <span
              className="px-3 py-1 text-sm font-sans font-medium bg-white/60 backdrop-blur-sm text-gray-800 rounded-xl shadow-sm border border-gray-200/60 hover:border-gray-300/70 transition-colors"
              title={safeArtwork.material}
            >
              {safeArtwork.material}
            </span>
            <span
              className="px-3 py-1 text-sm font-sans font-medium bg-white/60 backdrop-blur-sm text-gray-800 rounded-xl shadow-sm border border-gray-200/60 hover:border-gray-300/70 transition-colors"
              title={safeArtwork.dimensions}
            >
              {safeArtwork.dimensions}
            </span>
            {/* Instagram Link */}
            {safeArtwork.instagramReelLink && (
              <button
                onClick={() =>
                  setSocialMediaModal({
                    isOpen: true,
                    type: "instagram",
                    url: safeArtwork.instagramReelLink,
                    title: `Instagram - ${safeArtwork.title}`,
                  })
                }
                className="px-3 py-1 text-sm font-sans font-medium bg-gradient-to-r from-pink-50/80 to-purple-50/80 text-pink-600 rounded-xl shadow-sm border border-pink-200/60 hover:border-pink-300/70 transition-all duration-200 hover:scale-105 flex items-center gap-1"
                title="View Instagram"
              >
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                Instagram
              </button>
            )}
            {/* YouTube Video Link */}
            {safeArtwork.youtubeVideoLink && (
              <button
                onClick={() =>
                  setSocialMediaModal({
                    isOpen: true,
                    type: "youtube",
                    url: safeArtwork.youtubeVideoLink,
                    title: `YouTube Video - ${safeArtwork.title}`,
                  })
                }
                className="px-3 py-1 text-sm font-sans font-medium bg-gradient-to-r from-red-50/80 to-orange-50/80 text-red-600 rounded-xl shadow-sm border border-red-200/60 hover:border-red-300/70 transition-all duration-200 hover:scale-105 flex items-center gap-1"
                title="Watch YouTube Video"
              >
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                YouTube
              </button>
            )}
            {safeArtwork.createdAt && (
              <span className="px-3 py-1 text-sm font-sans font-medium bg-white/60 backdrop-blur-sm text-gray-800 rounded-xl shadow-sm border border-gray-200/60 hover:border-gray-300/70 transition-colors">
                Added: {formatLocalDateTime(safeArtwork.createdAt)}
              </span>
            )}
            {/* Expiry date for super admin or owner */}
            {safeArtwork.expiresAt &&
              (isSuperAdmin || (isArtist && isOwner)) && (
                <span className="px-3 py-1 text-sm font-sans font-medium bg-red-50/80 text-red-700 rounded-xl shadow-sm border border-red-200/50">
                  Expires: {formatLocalDateTime(safeArtwork.expiresAt)}
                </span>
              )}
          </div>
        </div>
      </div>

      {/* Purchase Request Button - only for public (not authenticated) users */}
      {!user && (
        <div className="border-t border-gray-200/50 px-4 py-4 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-xl flex flex-col items-end">
          {!safeArtwork.sold ? (
            <button
              className="w-full sm:w-auto max-w-60 px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white font-sans font-semibold shadow-lg hover:shadow-xl hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => setShowPurchaseModal(true)}
            >
              Request to Purchase
            </button>
          ) : (
            <button
              className="w-full sm:w-auto max-w-60 px-6 py-2 rounded-xl bg-gradient-to-r from-gray-400 to-gray-500 text-white font-sans font-semibold shadow-lg cursor-not-allowed opacity-80"
              disabled
            >
              Artwork Sold
            </button>
          )}
        </div>
      )}

      {/* Action Buttons - Fixed position at bottom */}
      {(isSuperAdmin || (isArtist && isOwner)) && (
        <div className="p-4 sm:p-6 border-t border-gray-200/50 flex-shrink-0 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-xl rounded-b-3xl">
          <div className="flex justify-end">
            <ArtworkActions
              artworkId={safeArtwork.id}
              onDelete={onDelete}
              artwork={safeArtwork}
            />
          </div>
        </div>
      )}

      {showPurchaseModal && (
        <PurchaseRequestModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          artworkId={artwork?.id}
          artworkTitle={safeArtwork.title}
        />
      )}

      {socialMediaModal.isOpen && (
        <SocialMediaModal
          isOpen={socialMediaModal.isOpen}
          onClose={() =>
            setSocialMediaModal({
              isOpen: false,
              type: null,
              url: null,
              title: null,
            })
          }
          type={socialMediaModal.type}
          url={socialMediaModal.url}
          title={socialMediaModal.title}
        />
      )}
    </motion.div>
  );
}
