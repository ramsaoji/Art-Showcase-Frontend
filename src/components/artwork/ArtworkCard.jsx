import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PhotoIcon from "@heroicons/react/24/outline/PhotoIcon";
import StarIcon from "@heroicons/react/24/outline/StarIcon";
import { formatPrice, formatLocalDateTime } from "@/utils/formatters";
import useOptimizedImage from "@/hooks/useOptimizedImage";
import useCarousel from "@/hooks/useCarousel";
import useSocialMediaModal from "@/hooks/useSocialMediaModal";
import ArtworkActions from "@/components/artwork/ArtworkActions";
import Badge from "@/components/artwork/Badge";
import StatusBadge from "@/components/artwork/StatusBadge";
import ArtworkMetaTag from "@/components/artwork/ArtworkMetaTag";
import CarouselDots from "@/components/artwork/CarouselDots";
import CarouselNavButton from "@/components/artwork/CarouselNavButton";
import { InstagramIcon, YouTubeIcon } from "@/components/artwork/SocialMediaIcons";
import { useAuth } from "@/contexts/AuthContext";
import PurchaseRequestModal from "@/features/purchase-request";
import PurchaseFooter from "@/components/artwork/PurchaseFooter";
import SocialMediaModal from "@/components/sections/SocialMediaModal";

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const imageFadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

const ArtworkCard = memo(function ArtworkCard({
  artwork,
  onDelete,
  onQuickView,
  priority = false,
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const cardRef = useRef(null);
  const imageRef = useRef(null);
  const descriptionRef = useRef(null);

  const { isSuperAdmin, isArtist, user } = useAuth();

  // Shared carousel hook (replaces manual state + auto-advance + nav handlers)
  const images =
    Array.isArray(artwork?.images) && artwork?.images.length > 0
      ? artwork.images
      : [];

  const { currentIndex, goTo, goPrev, goNext } = useCarousel(images, {
    autoAdvance: true,
    active: true,
  });

  // Shared social media modal hook (replaces duplicated state + handlers)
  const { socialMediaModal, openInstagramModal, openYouTubeModal, closeSocialMediaModal } =
    useSocialMediaModal();

  // Safe fallbacks for missing data
  const safeArtwork = useMemo(
    () => ({
      title: artwork.title || "Untitled",
      artist: artwork.artist || "Unknown Artist",
      year: artwork.year || "Year Unknown",
      price: artwork.price || 0,
      description: artwork.description || "",
      style: artwork.style || "Style Unknown",
      material: artwork.material || "Material Unknown",
      dimensions: artwork.dimensions || "Dimensions Unknown",
      ...artwork,
    }),
    [artwork]
  );

  // Get optimized URL for the current image only
  const currentImage = images[currentIndex] || {};
  const publicId = currentImage.public_id || currentImage.cloudinary_public_id || null;
  const imageState = useOptimizedImage(publicId, { width: 600, quality: 80 });

  // Check if description is truncated
  useEffect(() => {
    if (descriptionRef.current) {
      const el = descriptionRef.current;
      setIsDescriptionTruncated(el.scrollHeight > el.clientHeight);
    }
  }, [safeArtwork.title, safeArtwork.description]);

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
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const handleImageLoad = useCallback(() => setImageLoaded(true), []);

  const handleImageError = useCallback(
    (e) => {
      if (currentImage.url && e.target.src !== currentImage.url) {
        e.target.src = currentImage.url;
      } else {
        setImageError(true);
      }
    },
    [currentImage.url]
  );

  useEffect(() => {
    if (imageState.isError) setImageError(true);
  }, [imageState.isError]);

  // Reset image state when carousel index changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [currentIndex, publicId, currentImage.url]);

  // Memoized social media open handlers
  const handleInstagramModalOpen = useCallback(() => {
    if (!safeArtwork.instagramReelLink) return;
    openInstagramModal(safeArtwork.instagramReelLink, safeArtwork.title);
  }, [safeArtwork.instagramReelLink, safeArtwork.title, openInstagramModal]);

  const handleYoutubeModalOpen = useCallback(() => {
    if (!safeArtwork.youtubeVideoLink) return;
    openYouTubeModal(safeArtwork.youtubeVideoLink, safeArtwork.title);
  }, [safeArtwork.youtubeVideoLink, safeArtwork.title, openYouTubeModal]);

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
      {...cardVariants}
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

      {/* Status badge */}
      {artwork?.status && canSeeStatusBadge && (
        <div className="absolute top-4 right-4 z-10">
          <StatusBadge status={artwork.status} expiredBy={artwork.expiredBy} />
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
                    src={imageState.fullSizeUrl || currentImage.url || "placeholder.png"}
                    alt={safeArtwork.title}
                    {...imageFadeVariants}
                    className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-110"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    loading={priority ? "eager" : "lazy"}
                  />
                </AnimatePresence>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-100 transition-all duration-300" />

            {/* Carousel navigation — shared CarouselNavButton + CarouselDots */}
            {images.length > 1 && (
              <>
                <CarouselNavButton direction="prev" onClick={goPrev} size="sm" position="left-2 sm:left-4" />
                <CarouselNavButton direction="next" onClick={goNext} size="sm" position="right-2 sm:right-4" />
                {/* Dots sit above the Quick View / View Details overlay (~80px tall) */}
                <CarouselDots
                  images={images}
                  currentIndex={currentIndex}
                  onDotClick={goTo}
                  className="bottom-[70px] pointer-events-none [&>button]:pointer-events-auto"
                />
              </>
            )}
          </>
        )}

        {/* Overlay Action Buttons */}
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
              <Link to={`/artwork/${safeArtwork.id}`} className="block group/title">
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
                <span className="text-gray-600 flex-shrink-0 font-sans">{safeArtwork.year}</span>
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
            <ArtworkMetaTag title={safeArtwork.style}>{safeArtwork.style}</ArtworkMetaTag>
            <ArtworkMetaTag title={safeArtwork.material}>{safeArtwork.material}</ArtworkMetaTag>
            <ArtworkMetaTag title={safeArtwork.dimensions}>{safeArtwork.dimensions}</ArtworkMetaTag>

            {/* Instagram link — uses shared icon */}
            {safeArtwork.instagramReelLink && (
              <button
                onClick={handleInstagramModalOpen}
                className="px-3 py-1 text-sm font-sans font-medium bg-gradient-to-r from-pink-50/80 to-purple-50/80 text-pink-600 rounded-xl shadow-sm border border-pink-200/60 hover:border-pink-300/70 transition-all duration-200 hover:scale-105 flex items-center gap-1"
                title="View Instagram"
              >
                <InstagramIcon className="w-3 h-3" />
                Instagram
              </button>
            )}

            {/* YouTube link — uses shared icon */}
            {safeArtwork.youtubeVideoLink && (
              <button
                onClick={handleYoutubeModalOpen}
                className="px-3 py-1 text-sm font-sans font-medium bg-gradient-to-r from-red-50/80 to-orange-50/80 text-red-600 rounded-xl shadow-sm border border-red-200/60 hover:border-red-300/70 transition-all duration-200 hover:scale-105 flex items-center gap-1"
                title="Watch YouTube Video"
              >
                <YouTubeIcon className="w-3 h-3" />
                YouTube
              </button>
            )}

            {safeArtwork.createdAt && (
              <ArtworkMetaTag>Added: {formatLocalDateTime(safeArtwork.createdAt)}</ArtworkMetaTag>
            )}
            {safeArtwork.expiresAt && (isSuperAdmin || (isArtist && isOwner)) && (
              <ArtworkMetaTag className="bg-red-50/80 text-red-700 border-red-200/50">
                Expires: {formatLocalDateTime(safeArtwork.expiresAt)}
              </ArtworkMetaTag>
            )}
          </div>
        </div>
      </div>

      {/* Purchase Request Button — public users only */}
      {!user && (
        <PurchaseFooter
          sold={safeArtwork.sold}
          onRequest={() => setShowPurchaseModal(true)}
          className="border-t border-gray-200/50"
        />
      )}

      {/* Action Buttons — admin / artist owner */}
      {(isSuperAdmin || (isArtist && isOwner)) && (
        <div className="p-4 sm:p-6 border-t border-gray-200/50 flex-shrink-0 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-xl rounded-b-3xl">
          <div className={`flex ${isSuperAdmin ? "justify-center" : "justify-end"}`}>
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
          onClose={closeSocialMediaModal}
          type={socialMediaModal.type}
          url={socialMediaModal.url}
          title={socialMediaModal.title}
        />
      )}
    </motion.div>
  );
});

export default ArtworkCard;
