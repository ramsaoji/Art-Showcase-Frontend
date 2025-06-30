import { Fragment, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
  StarIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { formatPrice, formatLocalDateTime } from "../utils/formatters";
import { getPreviewUrl, getFullSizeUrl } from "../config/cloudinary";
import { trackArtworkInteraction } from "../services/analytics";
import Badge from "./Badge";
import Loader from "./ui/Loader";
import { useAuth } from "../contexts/AuthContext";
import PurchaseRequestModal from "./PurchaseRequestModal";
import SocialMediaModal from "./SocialMediaModal";

export default function ImageModal({
  isOpen,
  onClose,
  image,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}) {
  // Multi-image carousel state (like ArtworkCard)
  const images =
    Array.isArray(image?.images) && image.images.length > 0 ? image.images : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { isSuperAdmin, isArtist, user } = useAuth();
  const [highQualityLoaded, setHighQualityLoaded] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [fullScreenImageOpen, setFullScreenImageOpen] = useState(false);
  const [showZoomHint, setShowZoomHint] = useState(false);
  const [socialMediaModal, setSocialMediaModal] = useState({
    isOpen: false,
    type: null,
    url: null,
    title: null,
  });
  const currentImage = images[currentIndex] || {};
  const autoTimer = useRef();

  // Debug logging
  console.log("ImageModal Debug:", {
    imagesLength: images.length,
    hasPrevious,
    hasNext,
    onPrevious: !!onPrevious,
    onNext: !!onNext,
    imageId: image?.id,
  });

  // Reset loading and error states when image or index changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setHighQualityLoaded(false);
  }, [image?.id]);

  // Show zoom hint temporarily when modal opens or image changes
  useEffect(() => {
    if (isOpen) {
      setShowZoomHint(true);
      const timer = setInterval(() => {
        setShowZoomHint((prev) => !prev);
      }, 3500); // Toggles every 3.5 seconds to create a "come and go" effect

      return () => clearInterval(timer);
    } else {
      setShowZoomHint(false);
    }
  }, [isOpen, image?.id]);

  // Progressive loading logic for current image
  const getPreviewImageUrl = () => {
    if (!currentImage) return "";
    const publicId =
      currentImage.public_id || currentImage.cloudinary_public_id;
    if (publicId) {
      return getPreviewUrl(publicId);
    }
    return currentImage.url;
  };
  const getHighQualityImageUrl = () => {
    if (!currentImage) return "";
    const publicId =
      currentImage.public_id || currentImage.cloudinary_public_id;
    if (publicId) {
      return getFullSizeUrl(publicId);
    }
    return currentImage.url;
  };

  useEffect(() => {
    if (isOpen && currentImage) {
      setHighQualityLoaded(false);
      const highQualityImg = new window.Image();
      highQualityImg.src = getHighQualityImageUrl();
      highQualityImg.onload = () => setHighQualityLoaded(true);
      highQualityImg.onerror = () => {
        // If high quality fails, keep using preview
        console.warn("High quality image failed to load, using preview");
      };
    } else {
      setHighQualityLoaded(false);
    }
  }, [isOpen, currentImage?.url, currentImage?.cloudinary_public_id]);

  // Carousel navigation handlers
  const goPrev = (e) => {
    e && e.stopPropagation();
    // Prioritize carousel navigation. If at the start, use artwork navigation.
    if (images.length > 1 && currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
    } else if (onPrevious && hasPrevious) {
      onPrevious();
    }
  };
  const goNext = (e) => {
    e && e.stopPropagation();
    // Prioritize carousel navigation. If at the end, use artwork navigation.
    if (images.length > 1 && currentIndex < images.length - 1) {
      setCurrentIndex((idx) => idx + 1);
    } else if (onNext && hasNext) {
      onNext();
    }
  };
  const goTo = (idx) => setCurrentIndex(idx);

  // Determine if navigation is possible
  const canGoPrev =
    (images.length > 1 && currentIndex > 0) || (hasPrevious && onPrevious);
  const canGoNext =
    (images.length > 1 && currentIndex < images.length - 1) ||
    (hasNext && onNext);

  // Reset index if image changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [image?.id]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    if (image) {
      trackArtworkInteraction("artwork_view", image.id, image.title);
    }
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    if (image) {
      trackArtworkInteraction("artwork_view_error", image.id, image.title);
    }
  };

  const handleClose = () => {
    // Only close if social media modal is not open
    if (!socialMediaModal.isOpen) {
      onClose();
    }
  };

  // Determine if the current user is the owner (artist) of this artwork
  const isOwner = user && image?.userId && user.id === image.userId;

  // Status badge visibility logic
  const canSeeStatusBadge =
    isSuperAdmin ||
    (isArtist && isOwner) ||
    (image?.status && image.status !== "ACTIVE");

  const handleImageModalClose = () => {
    // Don't close the image modal if purchase modal is open
    if (showPurchaseModal) {
      return;
    }
    handleClose();
  };

  // Auto-advance logic for carousel (like ArtworkCard)
  useEffect(() => {
    if (!isOpen || images.length <= 1) return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => {
      setCurrentIndex((idx) => (idx + 1) % images.length);
    }, 4000);
    return () => clearTimeout(autoTimer.current);
  }, [isOpen, currentIndex, images.length]);

  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleClose}>
          <div className="fixed inset-0 flex items-center justify-center p-4 md:p-6">
            <Transition.Child
              as="div"
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />
            </Transition.Child>

            <Transition.Child
              as="div"
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative w-full max-w-5xl flex flex-col xl:flex-row bg-transparent backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5"
                style={{
                  height: "calc(100dvh - 5rem)",
                }}
              >
                {/* Image Section */}
                <div className="relative flex h-2/5 sm:h-1/2 w-full items-center justify-center bg-gradient-to-br from-gray-900/50 to-black/30 md:h-2/3 xl:h-full xl:flex-[3]">
                  {isLoading && !hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                        <Loader size="large" />
                      </div>
                    </div>
                  )}

                  {hasError ? (
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
                    <div className="relative w-full h-full flex items-center justify-center p-0  overflow-hidden">
                      {/* Enhanced blurred background image with gradient overlay */}
                      <div className="absolute inset-0">
                        <img
                          src={getPreviewImageUrl()}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover blur-3xl scale-110"
                          aria-hidden="true"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/50 via-purple-600/40 to-pink-600/50 mix-blend-overlay" />
                        <div className="absolute inset-0 bg-black/50" />
                      </div>

                      {/* Multi-image carousel support */}
                      <div
                        className="relative z-10 w-full h-full flex items-center justify-center cursor-zoom-in group"
                        onClick={() => setFullScreenImageOpen(true)}
                      >
                        <div className="relative overflow-hidden  md:shadow-2xl md:ring-1 md:ring-white/20 group-hover:ring-white/30 transition-all duration-300 group-hover:scale-[1.02]">
                          <img
                            src={
                              highQualityLoaded
                                ? getHighQualityImageUrl()
                                : getPreviewImageUrl()
                            }
                            alt={image?.title}
                            className={`max-w-full max-h-full object-contain transition-all duration-500 ${
                              isLoading
                                ? "opacity-0 scale-95"
                                : "opacity-100 scale-100"
                            } ${image?.sold ? "opacity-90" : ""}`}
                            onLoad={() => {
                              setIsLoading(false);
                              setHasError(false);
                              if (image) {
                                trackArtworkInteraction(
                                  "artwork_view",
                                  image.id,
                                  image.title
                                );
                              }
                            }}
                            onError={() => {
                              setIsLoading(false);
                              setHasError(true);
                              if (image) {
                                trackArtworkInteraction(
                                  "artwork_view_error",
                                  image.id,
                                  image.title
                                );
                              }
                            }}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              width: "auto",
                              height: "auto",
                              objectFit: "contain",
                            }}
                          />
                          {/* Enhanced zoom indicator */}
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                              showZoomHint ? "opacity-100" : "opacity-0"
                            } group-hover:opacity-100`}
                          >
                            <div className="flex items-center space-x-2 rounded-full bg-black/30 px-3 py-1.5 text-white sm:space-x-2.5 sm:px-4 sm:py-2">
                              <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                              <span className="font-sans text-xs font-semibold sm:text-sm">
                                Click to expand
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Enhanced carousel dots */}
                      {images.length > 1 && (
                        <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 md:gap-3 z-20 bg-black/30 backdrop-blur-md rounded-full px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2">
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
                                goTo(idx);
                              }}
                              aria-label={`Go to image ${idx + 1}`}
                              type="button"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Enhanced badges overlay */}
                  <div className="absolute top-4 left-4 z-30 flex gap-2 flex-wrap max-w-[calc(100%-2rem)]">
                    {image?.featured && (
                      <Badge type="featured" animate withPing>
                        <span className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent font-semibold">
                          <StarIcon className="h-4 w-4 mr-1 text-white" />
                          <span className="truncate text-white">Featured</span>
                        </span>
                      </Badge>
                    )}
                    {image?.sold && (
                      <Badge type="sold" animate withPing>
                        <span className="truncate font-semibold">Sold</span>
                      </Badge>
                    )}
                  </div>

                  {/* Status badge */}
                  {image?.status && canSeeStatusBadge && (
                    <div className="absolute top-4 right-4 z-30">
                      <Badge
                        type={
                          image.status === "ACTIVE"
                            ? "active"
                            : image.status === "INACTIVE"
                            ? "inactive"
                            : image.status === "EXPIRED"
                            ? "expired"
                            : "default"
                        }
                        animate
                        withPing
                      >
                        {image.status === "EXPIRED"
                          ? image.expiredBy === "admin"
                            ? "Expired (admin)"
                            : image.expiredBy === "auto"
                            ? "Expired (auto)"
                            : "Expired"
                          : image.status.charAt(0) +
                            image.status.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                  )}

                  {/* Enhanced Navigation buttons for artwork/carousel */}
                  <>
                    {canGoPrev && (
                      <button
                        onClick={goPrev}
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 sm:p-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md border border-white/20 hover:scale-110 hover:border-white/30"
                        aria-label="Previous"
                      >
                        <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    )}
                    {canGoNext && (
                      <button
                        onClick={goNext}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 sm:p-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md border border-white/20 hover:scale-110 hover:border-white/30"
                        aria-label="Next"
                      >
                        <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    )}
                  </>
                </div>

                {/* Enhanced Details Section */}
                <div className="relative h-3/5 w-full flex-shrink-0 bg-gradient-to-br from-white via-white to-gray-50/80 backdrop-blur-xl flex flex-col md:h-1/3 xl:h-full xl:flex-[2] border-t xl:border-l xl:border-t-0 border-white/20">
                  {/* Enhanced close button */}
                  <button
                    onClick={handleImageModalClose}
                    className="absolute right-4 top-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100/80 backdrop-blur-md text-gray-500 transition-all duration-200 hover:bg-gray-200 hover:text-gray-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-300 border border-gray-200/50"
                  >
                    <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>

                  {/* Enhanced scrollable content */}
                  <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-artistic text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3 sm:mb-4 tracking-wide leading-tight"
                    >
                      {image?.title}
                    </motion.h2>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="mb-6 sm:mb-8"
                    >
                      <p className="font-artistic text-xl sm:text-2xl lg:text-2xl xl:text-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent font-bold tracking-wide">
                        {image?.price ? formatPrice(image.price) : ""}
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-6 sm:space-y-8"
                    >
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-3 sm:p-4 border border-indigo-100">
                        <h3 className="text-sm font-sans font-semibold text-indigo-700 mb-2 uppercase tracking-wide">
                          Artist
                        </h3>
                        <div className="relative group inline-block">
                          <p className="font-artistic text-lg sm:text-xl text-indigo-700 group-hover:text-indigo-800 transition-all duration-300 font-semibold">
                            {image?.artistName}
                          </p>
                          <div className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out rounded-full" />
                        </div>
                      </div>

                      {image?.description && (
                        <div className="bg-gray-50/80 rounded-2xl p-3 sm:p-4 border border-gray-200/50">
                          <h3 className="text-sm font-sans font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                            Description
                          </h3>
                          <p className="text-sm sm:text-base font-sans text-gray-700 leading-relaxed">
                            {image.description}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
                        {image?.style && (
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/60 hover:border-gray-300/70 transition-colors">
                            <h3 className="text-xs font-sans font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                              Style
                            </h3>
                            <p className="text-sm font-sans text-gray-800 font-medium">
                              {image.style}
                            </p>
                          </div>
                        )}
                        {image?.material && (
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/60 hover:border-gray-300/70 transition-colors">
                            <h3 className="text-xs font-sans font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                              Material
                            </h3>
                            <p className="text-sm font-sans text-gray-800 font-medium">
                              {image.material}
                            </p>
                          </div>
                        )}
                        {image?.dimensions && (
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/60 hover:border-gray-300/70 transition-colors">
                            <h3 className="text-xs font-sans font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                              Dimensions
                            </h3>
                            <p className="text-sm font-sans text-gray-800 font-medium">
                              {image.dimensions}
                            </p>
                          </div>
                        )}
                        {image?.year && (
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/60 hover:border-gray-300/70 transition-colors">
                            <h3 className="text-xs font-sans font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                              Year
                            </h3>
                            <p className="text-sm font-sans text-gray-800 font-medium">
                              {image.year}
                            </p>
                          </div>
                        )}
                        {/* Instagram Link */}
                        {image?.instagramReelLink && (
                          <div
                            onClick={() =>
                              setSocialMediaModal({
                                isOpen: true,
                                type: "instagram",
                                url: image.instagramReelLink,
                                title: `Instagram - ${image.title}`,
                              })
                            }
                            className="bg-gradient-to-r from-pink-50/80 to-purple-50/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-pink-200/60 hover:border-pink-300/70 transition-all duration-200 cursor-pointer hover:shadow-lg sm:col-span-1 col-span-1"
                          >
                            <h3 className="text-xs font-sans font-semibold text-pink-700 mb-2 uppercase tracking-wider flex items-center">
                              <svg
                                className="w-4 h-4 mr-1 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                              </svg>
                              <span className="">Instagram</span>
                            </h3>
                            <div className="text-sm font-sans text-pink-600 hover:text-pink-800 font-medium underline hover:no-underline transition-all duration-200 break-words leading-relaxed">
                              View on Instagram
                            </div>
                          </div>
                        )}

                        {/* YouTube Video Link */}
                        {image?.youtubeVideoLink && (
                          <div
                            onClick={() =>
                              setSocialMediaModal({
                                isOpen: true,
                                type: "youtube",
                                url: image.youtubeVideoLink,
                                title: `YouTube Video - ${image.title}`,
                              })
                            }
                            className="bg-gradient-to-r from-red-50/80 to-orange-50/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-red-200/60 hover:border-red-300/70 transition-all duration-200 cursor-pointer hover:shadow-lg sm:col-span-1 col-span-1"
                          >
                            <h3 className="text-xs font-sans font-semibold text-red-700 mb-2 uppercase tracking-wider flex items-center">
                              <svg
                                className="w-4 h-4 mr-1 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                              </svg>
                              <span className="">YouTube Video</span>
                            </h3>
                            <div className="text-sm font-sans text-red-600 hover:text-red-800 font-medium underline hover:no-underline transition-all duration-200 break-words leading-relaxed">
                              Watch on YouTube
                            </div>
                          </div>
                        )}
                        {image?.createdAt && (
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/60 hover:border-gray-300/70 transition-colors">
                            <h3 className="text-xs font-sans font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                              Added
                            </h3>
                            <p className="text-sm font-sans text-gray-800 font-medium">
                              {formatLocalDateTime(image.createdAt)}
                            </p>
                          </div>
                        )}
                        {image?.expiresAt &&
                          (isSuperAdmin || (isArtist && isOwner)) && (
                            <div className="bg-red-50/80 rounded-xl p-3 sm:p-4 border border-red-200/50">
                              <h3 className="text-xs font-sans font-semibold text-red-700 mb-2 uppercase tracking-wider">
                                Expires
                              </h3>
                              <p className="text-sm font-sans text-red-700 font-medium">
                                {formatLocalDateTime(image.expiresAt)}
                              </p>
                            </div>
                          )}
                      </div>
                    </motion.div>
                  </div>

                  {/* Enhanced Purchase Request Button */}
                  {!user &&
                    (!image?.sold ? (
                      <div className="flex justify-end border-t border-gray-200/50 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4">
                        <button
                          className="w-full sm:w-auto max-w-60 px-4 sm:px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white font-sans font-semibold shadow-lg hover:shadow-xl hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                          onClick={() => setShowPurchaseModal(true)}
                        >
                          Request to Purchase
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end border-t border-gray-200/50 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4">
                        <button
                          className="w-full rounded-xl bg-gradient-to-r from-gray-400 to-gray-500 px-4 sm:px-6 py-2 font-sans font-semibold text-white shadow-lg cursor-not-allowed opacity-80 sm:w-auto"
                          disabled
                        >
                          Artwork Sold
                        </button>
                      </div>
                    ))}
                </div>
              </motion.div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <PurchaseRequestModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        artworkId={image?.id}
        artworkTitle={image?.title}
      />

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

            {/* Navigation arrows - unified logic */}
            <>
              {canGoPrev && (
                <button
                  onClick={goPrev}
                  className="absolute left-2 sm:left-4 md:left-6 top-1/2 transform -translate-y-1/2 z-[110] w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all duration-300 cursor-pointer border border-white/20 hover:border-white/40 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Previous"
                >
                  <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </button>
              )}
              {canGoNext && (
                <button
                  onClick={goNext}
                  className="absolute right-2 sm:right-4 md:right-6 top-1/2 transform -translate-y-1/2 z-[110] w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all duration-300 cursor-pointer border border-white/20 hover:border-white/40 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Next"
                >
                  <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </button>
              )}
            </>
            {/* Image container */}
            <div className="relative w-full h-full flex items-center justify-center p-8">
              {/* Blurred background image with gradient overlay - same as main section */}
              <div className="absolute inset-0 w-full h-full">
                <img
                  src={getPreviewImageUrl()}
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

              {/* Main image */}
              <img
                src={
                  currentImage.cloudinary_public_id
                    ? getFullSizeUrl(currentImage.cloudinary_public_id)
                    : currentImage.url
                }
                alt={image?.title}
                className="relative z-10 max-w-[85vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-lg md:shadow-2xl shadow-black/50"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Navigation indicators - only show if multiple images */}
              {images && images.length > 1 && (
                <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 md:gap-3 z-20 bg-black/40 backdrop-blur-md rounded-full px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2">
                  {images.map((img, index) => {
                    const isActive = index === currentIndex;
                    return (
                      <button
                        key={img.id}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 focus:outline-none  ${
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
    </>
  );
}
