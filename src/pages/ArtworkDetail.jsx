import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { trpc } from "../utils/trpc";
import {
  ShareIcon,
  PhotoIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

import { motion } from "framer-motion";
import { getFullSizeUrl } from "../config/cloudinary";
import {
  formatPrice,
  formatLocalDateTime,
  getFriendlyErrorMessage,
} from "../utils/formatters";
import Alert from "../components/Alert";
import Badge from "../components/Badge";
import Loader from "../components/ui/Loader";
import { trackArtworkView, trackShare } from "../services/analytics";
import { useAuth } from "../contexts/AuthContext";
import PurchaseRequestModal from "../components/PurchaseRequestModal";
import useOptimizedImage from "../hooks/useOptimizedImage";
import ImageModal from "../components/ImageModal";
import SocialMediaModal from "../components/SocialMediaModal";

export default function ArtworkDetail() {
  const { id } = useParams();
  const [showShareToast, setShowShareToast] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isSuperAdmin, isArtist, user } = useAuth();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [fullScreenImageOpen, setFullScreenImageOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [socialMediaModal, setSocialMediaModal] = useState({
    isOpen: false,
    type: null,
    url: null,
    title: null,
  });

  // Use tRPC query to fetch artworks
  const {
    data: artwork,
    isLoading: artworkLoading,
    error,
    refetch,
  } = trpc.artwork.getArtworkById.useQuery({ id }, { enabled: !!id });

  useEffect(() => {
    if (artwork) {
      trackArtworkView(artwork.id, artwork.title);
    }
  }, [artwork]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.share({
        title: artwork?.title,
        text: `Check out "${artwork?.title}" by ${artwork?.artist}`,
        url: shareUrl,
      });
      // Track successful share
      trackShare(artwork.id, "native_share");
    } catch (error) {
      // Fallback to clipboard copy if native share is not supported
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
        // Track clipboard share
        trackShare(artwork.id, "clipboard");
      } catch (clipboardError) {
        console.error("Failed to copy to clipboard:", clipboardError);
      }
    }
  };

  // Determine if the current user is the owner (artist) of this artwork
  const isOwner = user && artwork?.userId && user.id === artwork.userId;

  // Determine if purchase buttons should be shown
  const showPurchaseButtons = !user && !isOwner;

  // Status badge visibility logic
  const canSeeStatusBadge =
    isSuperAdmin ||
    (isArtist && isOwner) ||
    (artwork?.status && artwork.status !== "ACTIVE");

  // Multi-image support
  const images =
    Array.isArray(artwork?.images) && artwork?.images.length > 0
      ? artwork.images
      : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  // Only call the hook for the current image
  const currentImage = images[currentIndex] || {};
  const imageState = useOptimizedImage(
    currentImage.cloudinary_public_id || null,
    {
      lazy: false,
      width: 900,
      quality: 90,
    }
  );
  // Carousel auto-advance
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setTimeout(() => {
      setCurrentIndex((idx) => (idx + 1) % images.length);
    }, 4000);
    return () => clearTimeout(timer);
  }, [currentIndex, images.length]);
  // Reset index if images change
  useEffect(() => {
    setCurrentIndex(0);
  }, [artwork?.id]);

  useEffect(() => {
    setIsLoading(true);
  }, [currentImage.cloudinary_public_id, currentImage.url]);

  if (artworkLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50">
        {/* <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl"> */}
        <Loader size="large" />
        {/* </div> */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-xl mx-auto w-full">
          <Alert
            type="error"
            message={
              getFriendlyErrorMessage(error) ||
              "Could not load artwork details. Please try again."
            }
            onRetry={refetch}
          />
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-xl mx-auto w-full">
          <Alert
            type="warning"
            message="Artwork not found. The artwork might have been removed or is no longer available."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-5rem)] bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-transparent backdrop-blur-xl rounded-3xl shadow-lg md:shadow-2xl border border-white/20 overflow-hidden md:ring-1 ring-white/10 min-h-[85vh]"
        >
          <div className="flex flex-col xl:flex-row h-full min-h-[85vh]">
            {/* Enhanced Image Section */}
            <div className="relative flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900/50 to-black/30 min-h-[50vh] xl:min-h-[60vh]">
              {images.length === 0 || imageError ? (
                <div className="flex flex-col items-center justify-center text-gray-300 p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                  <PhotoIcon className="h-16 w-16 mb-4 text-gray-400" />
                  <p className="text-lg font-sans text-gray-300">
                    Image not available
                  </p>
                  <p className="text-sm font-sans text-gray-400 mt-2">
                    Please try again later
                  </p>
                </div>
              ) : (
                <div
                  className="relative w-full h-full flex items-center justify-center select-none overflow-hidden"
                  style={{ minHeight: "inherit" }}
                >
                  {/* Enhanced blurred background image with gradient overlay */}
                  <div className="absolute inset-0 w-full h-full">
                    <img
                      src={
                        currentImage.cloudinary_public_id
                          ? imageState.previewUrl
                          : currentImage.url
                      }
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover md:blur-3xl blur-xl scale-110"
                      aria-hidden="true"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/50 via-purple-600/40 to-pink-600/50 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-black/50" />
                  </div>

                  {/* Enhanced carousel arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 sm:p-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md border border-white/20 hover:scale-110 hover:border-white/30"
                        onClick={() =>
                          setCurrentIndex(
                            (idx) => (idx - 1 + images.length) % images.length
                          )
                        }
                        aria-label="Previous image"
                        type="button"
                      >
                        <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 sm:p-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md border border-white/20 hover:scale-110 hover:border-white/30"
                        onClick={() =>
                          setCurrentIndex((idx) => (idx + 1) % images.length)
                        }
                        aria-label="Next image"
                        type="button"
                      >
                        <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </>
                  )}

                  {/* Enhanced dots indicator */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 md:gap-3 z-20 bg-black/40 backdrop-blur-md rounded-full px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 focus:outline-none 
                            ${
                              idx === currentIndex
                                ? "bg-white scale-110 shadow-lg shadow-white/25"
                                : "bg-white/40 scale-90 hover:scale-105 hover:bg-white/60"
                            }
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentIndex(idx);
                          }}
                          aria-label={`Go to image ${idx + 1}`}
                          type="button"
                        />
                      ))}
                    </div>
                  )}

                  {/* Enhanced progressive image loading */}
                  <div
                    className="relative z-10 w-full h-full flex items-center justify-center cursor-zoom-in group"
                    onClick={() => {
                      setFullScreenImageOpen(true);
                    }}
                  >
                    <div className="relative overflow-hidden shadow-lg md:shadow-2xl md:ring-1 md:ring-white/20 group-hover:ring-white/30 transition-all duration-300 group-hover:scale-[1.02]">
                      <img
                        src={
                          currentImage.cloudinary_public_id
                            ? getFullSizeUrl(currentImage.cloudinary_public_id)
                            : currentImage.url
                        }
                        alt={artwork.title}
                        className={`max-w-full max-h-full object-contain transition-all duration-500 ${
                          isLoading
                            ? "opacity-0 scale-95"
                            : "opacity-100 scale-100"
                        } ${artwork.sold ? "opacity-90" : ""}`}
                        onLoad={() => setIsLoading(false)}
                        onError={(e) => {
                          setIsLoading(false);
                          if (e.target.src !== currentImage.url) {
                            e.target.src = currentImage.url;
                          } else {
                            setImageError(true);
                          }
                        }}
                        style={{
                          zIndex: 2,
                          display: imageError ? "none" : "block",
                        }}
                      />
                      {/* Subtle zoom indicator */}
                      <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <MagnifyingGlassIcon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                          <PhotoIcon className="h-16 w-16 text-gray-300" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced badges overlay */}
                  <div className="absolute top-4 left-4 z-30 flex gap-2 flex-wrap max-w-[calc(100%-2rem)]">
                    {artwork?.featured && (
                      <Badge type="featured" animate withPing>
                        <span className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent font-semibold">
                          <StarIcon className="h-4 w-4 mr-1 text-white" />
                          <span className="truncate text-white">Featured</span>
                        </span>
                      </Badge>
                    )}
                    {artwork?.sold && (
                      <Badge type="sold" animate withPing>
                        <span className="truncate font-semibold">Sold</span>
                      </Badge>
                    )}
                  </div>

                  {/* Status badge */}
                  {artwork?.status && canSeeStatusBadge && (
                    <div className="absolute top-4 right-4 z-30">
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
                </div>
              )}
            </div>

            {/* Enhanced Details Section */}
            <div className="relative flex-shrink-0 w-full xl:w-[32rem] bg-gradient-to-br from-white via-white to-gray-50/80 backdrop-blur-xl p-4 sm:p-6 xl:p-8 flex flex-col border-l border-white/20">
              {/* Enhanced header with title and share button */}
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-artistic text-xl sm:text-2xl xl:text-3xl 2xl:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-wide leading-tight pr-4"
                >
                  {artwork?.title}
                </motion.h1>
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="flex-shrink-0 p-2 sm:p-3 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100/80 backdrop-blur-sm transition-all duration-200 border border-gray-200/50 hover:border-gray-300/70"
                  title="Share artwork"
                >
                  <ShareIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </motion.button>
              </div>

              {/* Enhanced Artist section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6 sm:mb-8"
              >
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-3 sm:p-4 border border-indigo-100">
                  <h3 className="text-sm font-sans font-semibold text-indigo-700 mb-2 uppercase tracking-wide">
                    Artist
                  </h3>
                  <div className="relative group inline-block">
                    <p className="font-artistic text-lg sm:text-xl text-indigo-700 group-hover:text-indigo-800 transition-all duration-300 font-semibold">
                      {artwork?.artistName}
                    </p>
                    <div className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out rounded-full" />
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Price */}
              {artwork?.price && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mb-6 sm:mb-8"
                >
                  <p className="font-artistic text-xl sm:text-2xl xl:text-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent font-bold tracking-wide">
                    {formatPrice(artwork.price)}
                  </p>
                </motion.div>
              )}

              {/* Enhanced scrollable content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-6 sm:space-y-8"
                >
                  {/* Enhanced Description */}
                  {artwork?.description && (
                    <div className="bg-gray-50/80 rounded-2xl p-3 sm:p-4 border border-gray-200/50">
                      <h3 className="text-sm font-sans font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                        Description
                      </h3>
                      <p className="text-sm sm:text-base font-sans text-gray-700 leading-relaxed">
                        {artwork.description}
                      </p>
                    </div>
                  )}

                  {/* Enhanced Details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {artwork?.style && (
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/60 hover:border-gray-300/70 transition-colors">
                        <h3 className="text-xs font-sans font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                          Style
                        </h3>
                        <p className="text-sm font-sans text-gray-800 font-medium">
                          {artwork.style}
                        </p>
                      </div>
                    )}

                    {artwork?.material && (
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/60 hover:border-gray-300/70 transition-colors">
                        <h3 className="text-xs font-sans font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                          Material
                        </h3>
                        <p className="text-sm font-sans text-gray-800 font-medium">
                          {artwork.material}
                        </p>
                      </div>
                    )}

                    {artwork?.dimensions && (
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/60 hover:border-gray-300/70 transition-colors">
                        <h3 className="text-xs font-sans font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                          Dimensions
                        </h3>
                        <p className="text-sm font-sans text-gray-800 font-medium">
                          {artwork.dimensions}
                        </p>
                      </div>
                    )}

                    {/* Year */}
                    {artwork?.year && (
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/60 hover:border-gray-300/70 transition-colors">
                        <h3 className="text-xs font-sans font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                          Year
                        </h3>
                        <p className="text-sm font-sans text-gray-800 font-medium">
                          {artwork.year}
                        </p>
                      </div>
                    )}

                    {/* Instagram Link */}
                    {artwork?.instagramReelLink && (
                      <div
                        onClick={() =>
                          setSocialMediaModal({
                            isOpen: true,
                            type: "instagram",
                            url: artwork.instagramReelLink,
                            title: `Instagram - ${artwork.title}`,
                          })
                        }
                        className="bg-gradient-to-r from-pink-50/80 to-purple-50/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-pink-200/60 hover:border-pink-300/70 transition-all duration-200 cursor-pointer hover:shadow-lg"
                      >
                        <h3 className="text-xs font-sans font-semibold text-pink-700 mb-2 uppercase tracking-wider flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                          Instagram
                        </h3>
                        <div className="text-sm font-sans text-pink-600 hover:text-pink-800 font-medium underline hover:no-underline transition-all duration-200 ">
                          View on Instagram
                        </div>
                      </div>
                    )}

                    {/* YouTube Video Link */}
                    {artwork?.youtubeVideoLink && (
                      <div
                        onClick={() =>
                          setSocialMediaModal({
                            isOpen: true,
                            type: "youtube",
                            url: artwork.youtubeVideoLink,
                            title: `YouTube Video - ${artwork.title}`,
                          })
                        }
                        className="bg-gradient-to-r from-red-50/80 to-orange-50/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-red-200/60 hover:border-red-300/70 transition-all duration-200 cursor-pointer hover:shadow-lg"
                      >
                        <h3 className="text-xs font-sans font-semibold text-red-700 mb-2 uppercase tracking-wider flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                          YouTube Video
                        </h3>
                        <div className="text-sm font-sans text-red-600 hover:text-red-800 font-medium underline hover:no-underline transition-all duration-200 ">
                          Watch on YouTube
                        </div>
                      </div>
                    )}

                    {artwork?.createdAt && (
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/60 hover:border-gray-300/70 transition-colors">
                        <h3 className="text-xs font-sans font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                          Added
                        </h3>
                        <p className="text-sm font-sans text-gray-800 font-medium">
                          {formatLocalDateTime(artwork.createdAt)}
                        </p>
                      </div>
                    )}

                    {/* Enhanced Expiry date for super admin or owner */}
                    {artwork?.expiresAt &&
                      (isSuperAdmin || (isArtist && isOwner)) && (
                        <div className="bg-red-50/80 rounded-xl p-3 sm:p-4 border border-red-200/50">
                          <h3 className="text-xs font-sans font-semibold text-red-700 mb-2 uppercase tracking-wider">
                            Expires
                          </h3>
                          <p className="text-sm font-sans text-red-700 font-medium">
                            {formatLocalDateTime(artwork.expiresAt)}
                          </p>
                        </div>
                      )}
                  </div>
                </motion.div>
              </div>

              {/* Enhanced Purchase Request Button */}
              {showPurchaseButtons &&
                (!artwork?.sold ? (
                  <div className="flex sm:justify-start border-t border-gray-200/50 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-xl py-3 sm:py-4 mt-4 sm:mt-6">
                    <button
                      className="w-full sm:w-auto max-w-60 px-4 sm:px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white font-sans font-semibold shadow-lg hover:shadow-xl hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                      onClick={() => setShowPurchaseModal(true)}
                    >
                      Request to Purchase
                    </button>
                  </div>
                ) : (
                  <div className="flex sm:justify-start border-t border-gray-200/50 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-xl py-3 sm:py-4 mt-4 sm:mt-6">
                    <button
                      className="w-full max-w-60 rounded-xl bg-gradient-to-r from-gray-400 to-gray-500 px-4 sm:px-6 py-2 font-sans font-semibold text-white shadow-lg cursor-not-allowed opacity-80 sm:w-auto"
                      disabled
                    >
                      Artwork Sold
                    </button>
                  </div>
                ))}

              {/* Enhanced Back to gallery link */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`pt-4 sm:pt-6 border-t border-gray-200/50 ${
                  showPurchaseButtons ? "" : "mt-4 sm:mt-6"
                }`}
              >
                <Link
                  to="/gallery"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-sans font-medium transition-all duration-200 hover:scale-105"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Gallery
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Share Toast */}
      {showShareToast && (
        <Alert
          type="success"
          message="Link copied to clipboard!"
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 shadow-lg z-50"
          animate={true}
        />
      )}

      <PurchaseRequestModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        artworkId={artwork?.id}
        artworkTitle={artwork?.title}
      />

      {/* Enhanced Full-Screen Image Overlay */}
      {fullScreenImageOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-black/95 via-black/98 to-gray-900/95 backdrop-blur-lg">
            {/* Enhanced close button */}
            <button
              onClick={() => setFullScreenImageOpen(false)}
              className="absolute top-6 right-6 z-[110] w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all duration-300 cursor-pointer border border-white/20 hover:border-white/40 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ cursor: "pointer" }}
            >
              <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Navigation arrows - only show if multiple images */}
            {images && images.length > 1 && (
              <>
                {/* Previous arrow */}
                <button
                  onClick={() => {
                    setCurrentIndex(
                      (idx) => (idx - 1 + images.length) % images.length
                    );
                  }}
                  className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 z-[110] w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all duration-300 cursor-pointer border border-white/20 hover:border-white/40 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>

                {/* Next arrow */}
                <button
                  onClick={() => {
                    setCurrentIndex((idx) => (idx + 1) % images.length);
                  }}
                  className="absolute right-4 sm:right-6 top-1/2 transform -translate-y-1/2 z-[110] w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all duration-300 cursor-pointer border border-white/20 hover:border-white/40 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </>
            )}
            {/* Image container */}
            <div className="relative w-full h-full flex items-center justify-center p-8">
              {/* Blurred background image with gradient overlay - same as main section */}
              <div className="absolute inset-0 w-full h-full">
                <img
                  src={
                    currentImage.cloudinary_public_id
                      ? imageState.previewUrl
                      : currentImage.url
                  }
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover md:blur-3xl blur-xl scale-110"
                  aria-hidden="true"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-pink-600/30 mix-blend-overlay" />
                <div className="absolute inset-0 bg-black/40" />
              </div>

              {/* Main image */}
              <img
                src={
                  currentImage.cloudinary_public_id
                    ? getFullSizeUrl(currentImage.cloudinary_public_id)
                    : currentImage.url
                }
                alt={artwork?.title}
                className="relative z-10 max-w-[85vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-lg md:shadow-2xl shadow-black/50"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Navigation indicators - only show if multiple images */}
              {images && images.length > 1 && (
                <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 z-20 bg-black/40 backdrop-blur-md rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                  {images.map((img, index) => {
                    const isActive = index === currentIndex;
                    return (
                      <button
                        key={img.id}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 focus:outline-none  ${
                          isActive
                            ? "bg-white scale-110 shadow-lg shadow-white/25"
                            : "bg-white/40 scale-90 hover:scale-105 hover:bg-white/60"
                        }`}
                      />
                    );
                  })}
                </div>
              )}

              {/* Image counter - only show if multiple images */}
              {images && images.length > 1 && (
                <div className="absolute top-6 left-6 z-[110] px-4 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-sm font-medium border border-white/20">
                  {currentIndex + 1} / {images.length}
                </div>
              )}
              {/* Click outside to close */}
              <div
                className="absolute inset-0 -z-10"
                onClick={() => setFullScreenImageOpen(false)}
              />
            </div>
          </div>,
          document.body
        )}

      {/* Image Modal for full-size viewing */}
      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        image={{ ...artwork, images }}
      />

      {/* Social Media Modal */}
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
    </div>
  );
}
