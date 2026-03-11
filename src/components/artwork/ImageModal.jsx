import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import XMarkIcon from "@heroicons/react/24/outline/XMarkIcon";
import PhotoIcon from "@heroicons/react/24/outline/PhotoIcon";
import StarIcon from "@heroicons/react/24/outline/StarIcon";
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import ShareIcon from "@heroicons/react/24/outline/ShareIcon";
import { useAuth } from "@/contexts/AuthContext";
import Badge from "@/components/artwork/Badge";
import StatusBadge from "@/components/artwork/StatusBadge";
import CarouselDots from "@/components/artwork/CarouselDots";
import CarouselNavButton from "@/components/artwork/CarouselNavButton";
import { InstagramIcon, YouTubeIcon } from "@/components/artwork/SocialMediaIcons";
import PurchaseFooter from "@/components/artwork/PurchaseFooter";
import { Skeleton } from "@/components/ui/skeleton";
import SocialMediaModal from "@/components/sections/SocialMediaModal";
import PurchaseRequestModal from "@/features/purchase-request";
import ArtworkActions from "@/components/artwork/ArtworkActions";
import Alert from "@/components/common/Alert";
import { formatPrice, formatLocalDateTime, resolveArtworkPricing } from "@/utils/formatters";
import DiscountPriceBadge from "@/components/artwork/DiscountPriceBadge";
import { getPreviewUrl, getFullSizeUrl } from "@/utils/cloudinary";
import { trackArtworkInteraction, trackShare } from "@/services/analytics";
import useMediaQuery from "@/hooks/useMediaQuery";
import useScrollLock from "@/hooks/useScrollLock";
import useSocialMediaModal from "@/hooks/useSocialMediaModal";

const modalVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
  transition: { duration: 0.4, ease: "easeOut" },
};

/**
 * ImageModal — Full-screen artwork viewer modal.
 * Displays a multi-image carousel with progressive image loading, metadata panel,
 * social media links, a full-screen overlay, and a purchase request action.
 *
 * @param {boolean} props.isOpen - Controls modal visibility.
 * @param {Function} props.onClose - Called when the modal requests to close.
 * @param {Object} props.image - Artwork object containing title, images, metadata, etc.
 * @param {Function} [props.onPrevious] - Navigate to the previous artwork.
 * @param {Function} [props.onNext] - Navigate to the next artwork.
 * @param {boolean} [props.hasPrevious] - Whether a previous artwork exists.
 * @param {boolean} [props.hasNext] - Whether a next artwork exists.
 */
export default function ImageModal({
  isOpen,
  onClose,
  image: propImage,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}) {
  const [localImage, setLocalImage] = useState(propImage);

  useEffect(() => {
    setLocalImage(propImage);
  }, [propImage]);

  const image = localImage;

  // Multi-image carousel state
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
  const [showShareToast, setShowShareToast] = useState(false);

  // Shared social media modal hook — replaces duplicated state + handlers
  const { socialMediaModal, openInstagramModal, openYouTubeModal, closeSocialMediaModal } =
    useSocialMediaModal();

  const currentImage = images[currentIndex] || {};
  const autoTimer = useRef();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Lock background scrolling when either the main modal or fullscreen overlay is open
  useScrollLock(isOpen || fullScreenImageOpen);

  // Reset loading / error states when artwork changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setHighQualityLoaded(false);
  }, [image?.id]);

  // Show zoom hint temporarily when modal opens / artwork changes
  useEffect(() => {
    if (isOpen) {
      setShowZoomHint(true);
      const timer = setInterval(() => {
        setShowZoomHint((prev) => !prev);
      }, 3500);
      return () => clearInterval(timer);
    } else {
      setShowZoomHint(false);
    }
  }, [isOpen, image?.id]);

  // Progressive loading for current image
  const getPreviewImageUrl = () => {
    if (!currentImage) return "";
    const publicId = currentImage.public_id || currentImage.cloudinary_public_id;
    return publicId ? getPreviewUrl(publicId) : currentImage.url;
  };

  const getHighQualityImageUrl = () => {
    if (!currentImage) return "";
    const publicId = currentImage.public_id || currentImage.cloudinary_public_id;
    return publicId ? getFullSizeUrl(publicId) : currentImage.url;
  };

  useEffect(() => {
    if (isOpen && currentImage) {
      setHighQualityLoaded(false);
      const highQualityImg = new window.Image();
      highQualityImg.src = getHighQualityImageUrl();
      highQualityImg.onload = () => setHighQualityLoaded(true);
    } else {
      setHighQualityLoaded(false);
    }
  }, [isOpen, currentImage?.url, currentImage?.cloudinary_public_id]);

  // ImageModal has unique navigation: carousel index within an artwork,
  // falling back to inter-artwork navigation at carousel boundaries.
  const goPrev = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      if (images.length > 1 && currentIndex > 0) {
        setCurrentIndex((idx) => idx - 1);
      } else if (onPrevious && hasPrevious) {
        onPrevious();
      }
    },
    [images.length, currentIndex, onPrevious, hasPrevious]
  );

  const goNext = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      if (images.length > 1 && currentIndex < images.length - 1) {
        setCurrentIndex((idx) => idx + 1);
      } else if (onNext && hasNext) {
        onNext();
      }
    },
    [images.length, currentIndex, onNext, hasNext]
  );

  const goTo = useCallback((idx) => setCurrentIndex(idx), []);

  const canGoPrev =
    (images.length > 1 && currentIndex > 0) || (hasPrevious && onPrevious);
  const canGoNext =
    (images.length > 1 && currentIndex < images.length - 1) || (hasNext && onNext);

  // Reset carousel index when artwork changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [image?.id]);

  // Auto-advance
  useEffect(() => {
    if (!isOpen || images.length <= 1) return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => {
      setCurrentIndex((idx) => (idx + 1) % images.length);
    }, 4000);
    return () => clearTimeout(autoTimer.current);
  }, [isOpen, currentIndex, images.length]);

  // ── Esc key handler (Phase 3 — accessibility) ──────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (fullScreenImageOpen) {
          setFullScreenImageOpen(false);
        } else if (!socialMediaModal.isOpen && !showPurchaseModal) {
          onClose();
        }
      }
      if (e.key === "ArrowLeft" && canGoPrev) goPrev();
      if (e.key === "ArrowRight" && canGoNext) goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, fullScreenImageOpen, socialMediaModal.isOpen, showPurchaseModal, onClose, canGoPrev, canGoNext, goPrev, goNext]);

  const handleClose = () => {
    if (!socialMediaModal.isOpen) onClose();
  };

  const handleImageModalClose = () => {
    if (!showPurchaseModal) handleClose();
  };

  // Share handler — mirrors ArtworkDetail exactly, links to /artwork/:id
  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/artwork/${image?.id}`;
    try {
      await navigator.share({
        title: image?.title,
        text: `Check out "${image?.title}" by ${image?.artistName}`,
        url: shareUrl,
      });
      trackShare(image.id, "native_share");
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
        trackShare(image.id, "clipboard");
      } catch {
        // clipboard failed silently
      }
    }
  }, [image?.id, image?.title, image?.artistName]);

  // Determine if the current user is the owner (artist) of this artwork
  const isOwner = user && image?.userId && user.id === image.userId;

  // Status badge visibility logic
  const canSeeStatusBadge =
    isSuperAdmin ||
    (isArtist && isOwner) ||
    (image?.status && image.status !== "ACTIVE");

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
              role="dialog"
              aria-modal="true"
              aria-label={image?.title ? `Artwork: ${image.title}` : "Artwork viewer"}
              onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
            >
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                aria-hidden="true"
                onMouseDown={handleClose}
              />

              {/* Modal panel */}
              <motion.div
                key="panel"
                {...modalVariants}
                className="relative w-full max-w-5xl min-w-[320px] sm:min-w-[480px] md:min-w-[600px] lg:min-w-[700px] flex flex-col xl:flex-row bg-transparent backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5"
                style={{ height: "calc(100dvh - 5rem)" }}
              >
                  {/* Image Section */}
                <div className="relative flex h-2/5 sm:h-1/2 w-full min-w-[220px] sm:min-w-[320px] md:min-w-[400px] lg:min-w-[500px] min-h-[220px] sm:min-h-[320px] md:min-h-[400px] lg:min-h-[500px] items-center justify-center flex-[3_3_0%] bg-gradient-to-br from-gray-900/50 to-black/30 md:h-2/3 xl:h-full relative overflow-hidden">
                  {isLoading && !hasError && (
                    <div className="absolute inset-0 z-20 w-full h-full p-0">
                      <Skeleton className="w-full h-full opacity-60 rounded-none bg-indigo-50/10" />
                    </div>
                  )}

                  {hasError ? (
                    <div className="flex flex-col items-center justify-center text-gray-300 p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                      <PhotoIcon className="h-16 w-16 mb-4 text-gray-400" />
                      <p className="text-lg font-sans text-gray-300">Image not available</p>
                      <p className="text-sm font-sans text-gray-400 mt-2">Please try again later</p>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center p-0 overflow-hidden">
                      {/* Blurred background with gradient overlay */}
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
                        <div className="relative overflow-hidden md:shadow-2xl md:ring-1 md:ring-white/20 group-hover:ring-white/30 transition-all duration-300 group-hover:scale-[1.02]">
                          <img
                            src={highQualityLoaded ? getHighQualityImageUrl() : getPreviewImageUrl()}
                            alt={image?.title}
                            className={`max-w-full max-h-full object-contain transition-all duration-500 ${
                              isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"
                            } ${image?.sold ? "opacity-90" : ""}`}
                            onLoad={() => {
                              setIsLoading(false);
                              setHasError(false);
                              if (image) trackArtworkInteraction("artwork_view", image.id, image.title);
                            }}
                            onError={() => {
                              setIsLoading(false);
                              setHasError(true);
                              if (image) trackArtworkInteraction("artwork_view_error", image.id, image.title);
                            }}
                            style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", objectFit: "contain" }}
                          />
                          {/* Zoom hint */}
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                              showZoomHint ? "opacity-100" : "opacity-0"
                            } group-hover:opacity-100`}
                          >
                            <div className="flex items-center space-x-2 rounded-full bg-black/30 px-3 py-1.5 text-white sm:space-x-2.5 sm:px-4 sm:py-2">
                              <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                              <span className="font-sans text-xs font-semibold sm:text-sm">Click to expand</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Shared CarouselDots */}
                      <CarouselDots
                        images={images}
                        currentIndex={currentIndex}
                        onDotClick={goTo}
                      />
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

                  {/* Status badge — shared StatusBadge (replaces inline status→Badge mapping) */}
                  {image?.status && canSeeStatusBadge && (
                    <div className="absolute top-4 right-4 z-30">
                      <StatusBadge status={image.status} expiredBy={image.expiredBy} />
                    </div>
                  )}

                  {/* Navigation buttons — shared CarouselNavButton */}
                  {canGoPrev && (
                    <CarouselNavButton direction="prev" onClick={goPrev} size="md" position="left-2 sm:left-4" className="z-30" />
                  )}
                  {canGoNext && (
                    <CarouselNavButton direction="next" onClick={goNext} size="md" position="right-2 sm:right-4" className="z-30" />
                  )}
                </div>

                {/* Details Section */}
                <div className="relative h-3/5 w-full flex-shrink-0 flex-[2_2_0%] bg-gradient-to-br from-white via-white to-gray-50/80 backdrop-blur-xl flex flex-col md:h-1/3 xl:h-full xl:border-l xl:border-t-0 border-t border-white/20">
                  {/* Header row: close button + share button */}
                  <div className="flex items-center justify-between px-4 py-2 sm:px-6 sm:py-2 flex-shrink-0">
                    {/* Share button */}
                    <button
                      type="button"
                      onClick={handleShare}
                      className="flex items-center justify-center rounded-full text-gray-400 hover:text-indigo-500 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 h-8 w-8 sm:h-9 sm:w-9 bg-white transition-all duration-200 hover:scale-105"
                      title="Share artwork"
                    >
                      <ShareIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>

                    {/* Close button */}
                    <button
                      onClick={handleImageModalClose}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100/80 backdrop-blur-md text-gray-500 transition-all duration-200 hover:bg-gray-200 hover:text-gray-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-300 border border-gray-200/50"
                      aria-label="Close modal"
                    >
                      <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-4 sm:px-6 sm:pt-4 sm:pb-6">
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
                      {image?.price && (() => {
                        const { originalPrice, discountedPrice, discountPercent } = resolveArtworkPricing(image);
                        return (
                          <DiscountPriceBadge
                            originalPrice={originalPrice}
                            discountedPrice={discountedPrice}
                            discountPercent={discountPercent}
                            size="lg"
                          />
                        );
                      })()}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-6 sm:space-y-8"
                    >
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-3 sm:p-4 border border-indigo-100">
                        <h3 className="text-sm font-sans font-semibold text-indigo-700 mb-2 uppercase tracking-wide">Artist</h3>
                        <div className="relative group inline-block">
                          <p className="font-artistic text-lg sm:text-xl text-indigo-700 group-hover:text-indigo-800 transition-all duration-300 font-semibold">
                            {image?.artistName}
                          </p>
                          <div className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out rounded-full" />
                        </div>
                      </div>

                      {image?.description && (
                        <div className="bg-gray-50/80 rounded-2xl p-3 sm:p-4 border border-gray-200/50">
                          <h3 className="text-sm font-sans font-semibold text-gray-700 mb-2 uppercase tracking-wide">Description</h3>
                          <p className="text-sm sm:text-base font-sans text-gray-700 leading-relaxed">{image.description}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
                        {image?.style && (
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/60 hover:border-gray-300/70 transition-colors">
                            <h3 className="text-xs font-sans font-semibold text-gray-600 mb-2 uppercase tracking-wider">Style</h3>
                            <p className="text-sm font-sans text-gray-800 font-medium">{image.style}</p>
                          </div>
                        )}
                        {image?.material && (
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/60 hover:border-gray-300/70 transition-colors">
                            <h3 className="text-xs font-sans font-semibold text-gray-600 mb-2 uppercase tracking-wider">Material</h3>
                            <p className="text-sm font-sans text-gray-800 font-medium">{image.material}</p>
                          </div>
                        )}
                        {image?.dimensions && (
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/60 hover:border-gray-300/70 transition-colors">
                            <h3 className="text-xs font-sans font-semibold text-gray-600 mb-2 uppercase tracking-wider">Dimensions</h3>
                            <p className="text-sm font-sans text-gray-800 font-medium">{image.dimensions}</p>
                          </div>
                        )}
                        {image?.year && (
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/60 hover:border-gray-300/70 transition-colors">
                            <h3 className="text-xs font-sans font-semibold text-gray-600 mb-2 uppercase tracking-wider">Year</h3>
                            <p className="text-sm font-sans text-gray-800 font-medium">{image.year}</p>
                          </div>
                        )}

                        {/* Instagram link — shared icon */}
                        {image?.instagramReelLink && (
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => openInstagramModal(image.instagramReelLink, image.title)}
                            onKeyDown={(e) => e.key === "Enter" && openInstagramModal(image.instagramReelLink, image.title)}
                            className="bg-gradient-to-r from-pink-50/80 to-purple-50/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-pink-200/60 hover:border-pink-300/70 transition-all duration-200 cursor-pointer hover:shadow-lg sm:col-span-1 col-span-1"
                          >
                            <h3 className="text-xs font-sans font-semibold text-pink-700 mb-2 uppercase tracking-wider flex items-center">
                              <InstagramIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                              <span>Instagram</span>
                            </h3>
                            <div className="text-sm font-sans text-pink-600 hover:text-pink-800 font-medium underline hover:no-underline transition-all duration-200 break-words leading-relaxed">
                              View on Instagram
                            </div>
                          </div>
                        )}

                        {/* YouTube link — shared icon */}
                        {image?.youtubeVideoLink && (
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => openYouTubeModal(image.youtubeVideoLink, image.title)}
                            onKeyDown={(e) => e.key === "Enter" && openYouTubeModal(image.youtubeVideoLink, image.title)}
                            className="bg-gradient-to-r from-red-50/80 to-orange-50/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-red-200/60 hover:border-red-300/70 transition-all duration-200 cursor-pointer hover:shadow-lg sm:col-span-1 col-span-1"
                          >
                            <h3 className="text-xs font-sans font-semibold text-red-700 mb-2 uppercase tracking-wider flex items-center">
                              <YouTubeIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                              <span>YouTube Video</span>
                            </h3>
                            <div className="text-sm font-sans text-red-600 hover:text-red-800 font-medium underline hover:no-underline transition-all duration-200 break-words leading-relaxed">
                              Watch on YouTube
                            </div>
                          </div>
                        )}

                        {image?.createdAt && (
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/60 hover:border-gray-300/70 transition-colors">
                            <h3 className="text-xs font-sans font-semibold text-gray-600 mb-2 uppercase tracking-wider">Added</h3>
                            <p className="text-sm font-sans text-gray-800 font-medium">{formatLocalDateTime(image.createdAt)}</p>
                          </div>
                        )}
                        {image?.expiresAt && (isSuperAdmin || (isArtist && isOwner)) && (
                          <div className="bg-red-50/80 rounded-xl p-3 sm:p-4 border border-red-200/50">
                            <h3 className="text-xs font-sans font-semibold text-red-700 mb-2 uppercase tracking-wider">Expires</h3>
                            <p className="text-sm font-sans text-red-700 font-medium">{formatLocalDateTime(image.expiresAt)}</p>
                          </div>
                        )}

                        {(isSuperAdmin || (isArtist && isOwner)) && image?.discountPercent > 0 && (
                          <>
                            {image?.discountStartAt && (
                              <div className="bg-emerald-50/80 rounded-xl p-3 sm:p-4 border border-emerald-200/50">
                                <h3 className="text-xs font-sans font-semibold text-emerald-700 mb-2 uppercase tracking-wider">Disc Starts</h3>
                                <p className="text-sm font-sans text-emerald-700 font-medium">{formatLocalDateTime(image.discountStartAt)}</p>
                              </div>
                            )}
                            {image?.discountEndAt && (
                              <div className="bg-red-50/80 rounded-xl p-3 sm:p-4 border border-red-200/50">
                                <h3 className="text-xs font-sans font-semibold text-red-700 mb-2 uppercase tracking-wider">Disc Ends</h3>
                                <p className="text-sm font-sans text-red-700 font-medium">{formatLocalDateTime(image.discountEndAt)}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  {/* Purchase Request Footer — public users only */}
                  {!user && (
                    <PurchaseFooter
                      sold={image?.sold}
                      onRequest={() => setShowPurchaseModal(true)}
                    />
                  )}

                  {/* ArtworkActions — admin / artist owner */}
                  {(isSuperAdmin || (isArtist && isOwner)) && (
                    <div className="px-4 pb-4 sm:px-6 sm:pb-5 border-t border-gray-100/80 pt-3 flex-shrink-0 bg-gradient-to-r from-white/90 to-gray-50/90">
                      <ArtworkActions
                        artworkId={image?.id}
                        artwork={image}
                        onDelete={handleImageModalClose}
                        onUpdate={(updatedData) => setLocalImage(prev => ({ ...prev, ...updatedData }))}
                        className="w-full justify-between"
                        buttonClassName="flex-1"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <PurchaseRequestModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        artworkId={image?.id}
        artworkTitle={image?.title}
      />

      {socialMediaModal.isOpen && (
        <SocialMediaModal
          isOpen={socialMediaModal.isOpen}
          onClose={closeSocialMediaModal}
          type={socialMediaModal.type}
          url={socialMediaModal.url}
          title={socialMediaModal.title}
        />
      )}

      {/* Share toast — "Link copied to clipboard!" */}
      {showShareToast && createPortal(
        <Alert
          type="success"
          message="Link copied to clipboard!"
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 shadow-lg z-[200]"
          animate={true}
        />,
        document.body
      )}

      {/* Full-Screen Image Overlay */}
      {fullScreenImageOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-black/95 via-black/98 to-gray-900/95 backdrop-blur-lg"
            role="dialog"
            aria-modal="true"
            aria-label="Full screen image view"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setFullScreenImageOpen(false); }}
          >
            {/* Close button */}
            <button
              onClick={() => setFullScreenImageOpen(false)}
              className="absolute top-6 right-6 z-[110] w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all duration-300 cursor-pointer border border-white/20 hover:border-white/40 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Close full screen view"
            >
              <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Nav buttons — shared CarouselNavButton, positioned away from screen edge */}
            {canGoPrev && (
              <CarouselNavButton
                direction="prev"
                onClick={goPrev}
                size="lg"
                position="left-6 md:left-12"
                className="z-[110] bg-black/60 hover:bg-black/80"
              />
            )}
            {canGoNext && (
              <CarouselNavButton
                direction="next"
                onClick={goNext}
                size="lg"
                position="right-6 md:right-12"
                className="z-[110] bg-black/60 hover:bg-black/80"
              />
            )}

            {/* Image container */}
            <div className="relative w-full h-full flex items-center justify-center p-8">
              {/* Blurred background */}
              <div className="absolute inset-0 w-full h-full">
                <img
                  src={getPreviewImageUrl()}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover md:blur-3xl blur-xl scale-110"
                  aria-hidden="true"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
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

              {/* Shared CarouselDots */}
              <CarouselDots
                images={images}
                currentIndex={currentIndex}
                onDotClick={(idx) => setCurrentIndex(idx)}
              />

              {/* Image counter */}
              {images && images.length > 1 && (
                <div className="absolute top-6 left-6 z-[110] px-4 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-sm font-medium border border-white/20">
                  {currentIndex + 1} / {images.length}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
