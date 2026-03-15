import { useMemo, useState, useEffect, useRef, memo, useCallback } from "react";
import { motion } from "framer-motion";
import PhotoIcon from "@heroicons/react/24/outline/PhotoIcon";
import StarIcon from "@heroicons/react/24/outline/StarIcon";
import useOptimizedImage from "@/hooks/useOptimizedImage";
import { useAuth } from "@/contexts/AuthContext";
import { resolveArtworkPricing } from "@/utils/formatters";
import DiscountPriceBadge from "@/components/artwork/DiscountPriceBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { canViewArtworkInternals } from "@/lib/rbac";

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const MasonryArtworkCard = memo(function MasonryArtworkCard({
  artwork,
  onQuickView,
  priority = false,
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);
  const cardRef = useRef(null);

  const { user } = useAuth();

  const images = Array.isArray(artwork?.images) && artwork?.images.length > 0 ? artwork.images : [];
  const currentImage = images[0] || {};
  const publicId = currentImage.public_id || currentImage.cloudinary_public_id || null;
  const imageState = useOptimizedImage(publicId, { width: 600, quality: 80 });

  const safeArtwork = useMemo(
    () => ({
      title: artwork.title || "Untitled",
      artist: artwork.artistName || artwork.artist || "Unknown Artist",
      description: artwork.description || "",
      ...artwork,
    }),
    [artwork]
  );

  const { originalPrice, discountedPrice, discountPercent } = resolveArtworkPricing(safeArtwork);

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

  const isOwner = !!user && !!artwork?.userId && user.id === artwork.userId;
  const canViewInternalArtworkDetails = canViewArtworkInternals(
    user,
    artwork?.userId
  );

  const canSeeStatusBadge =
    canViewInternalArtworkDetails ||
    (artwork?.status && artwork.status !== "ACTIVE");

  return (
    <motion.div
      ref={cardRef}
      {...cardVariants}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gray-100"
      onClick={() => onQuickView?.(artwork)}
    >
      {/* Status Indicators & Tags */}
      <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 z-10 flex flex-wrap content-start gap-1 sm:gap-1.5 pointer-events-none">
        {safeArtwork.featured && (
          <div className="bg-black/30 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-medium font-sans px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm flex items-center shrink-0">
            <StarIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 text-amber-400 shrink-0" />
            Featured
          </div>
        )}
        {safeArtwork.sold && (
          <div className="bg-black/30 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-medium font-sans px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm flex items-center shrink-0">
            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-rose-500 mr-1 sm:mr-1.5 shrink-0"></span>
            Sold
          </div>
        )}
        {discountPercent > 0 && !safeArtwork.sold && (
          <div className="bg-black/30 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-medium font-sans px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm flex items-center shrink-0">
            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-rose-400 mr-1 sm:mr-1.5 shrink-0"></span>
            {discountPercent}% OFF
          </div>
        )}
        {artwork?.status && canSeeStatusBadge && (
          <div className="bg-black/30 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-medium font-sans px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm flex items-center whitespace-nowrap shrink-0">
            <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full mr-1 sm:mr-1.5 ${
              artwork.status === 'ACTIVE' ? 'bg-emerald-400' :
              artwork.status === 'INACTIVE' ? 'bg-amber-400' :
              'bg-rose-400'
            }`}></span>
            {artwork.status === "EXPIRED"
              ? (artwork.expiredBy === "admin" ? "Exp (admin)" : artwork.expiredBy === "auto" ? "Exp (auto)" : "Expired")
              : artwork.status.charAt(0) + artwork.status.slice(1).toLowerCase()}
          </div>
        )}
      </div>

      {/* Image area */}
      {images.length === 0 || imageError ? (
        <div className="flex items-center justify-center w-full bg-gray-300" style={{ aspectRatio: '4/3' }}>
          <PhotoIcon className="h-12 w-12 text-gray-400" />
        </div>
      ) : (
        /*
         * Strategy: let the image drive the card height naturally (masonry).
         * - `w-full h-auto` means portrait images render tall, landscape short.
         * - `minHeight` on the img prevents very wide images from collapsing
         *   to just a sliver, while never capping taller images — so masonry
         *   column variation is fully preserved.
         * - The loading skeleton uses `absolute inset-0` so it fills whatever
         *   space the img occupies (it gets the same min-height via CSS).
         */
        <div className="relative w-full overflow-hidden">
          {!isVisible ? (
            /* Before intersection: block placeholder holds space in flow */
            <Skeleton className="w-full rounded-none" style={{ minHeight: "180px" }} />
          ) : (
            <>
              <img
                src={imageState.fullSizeUrl || currentImage.url || "placeholder.png"}
                alt={safeArtwork.title}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading={priority ? "eager" : "lazy"}
                style={{ minHeight: '180px' }}
                className="w-full h-auto object-cover block transform transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {/* Loading pulse overlays the img while high-quality version is loading */}
              {!imageState.highQualityLoaded && (
                <Skeleton className="absolute inset-0 rounded-none" />
              )}
            </>
          )}
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none flex flex-col">

        {/* Top blur fade — covers badge area, no dark tint so badges stay readable */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-10" />

        {/* Bottom blur fade */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none z-10" />

        {/* Full overlay dark tint */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

        {/* Content — bottom-anchored so title/artist/price always stay
            visible regardless of card height. pt-10 ensures content
            never rides up into the badge row on tall cards. */}
        <div className="relative z-20 flex flex-col items-center justify-end w-full h-full px-3 sm:px-4 pt-10 sm:pt-12 pb-4 sm:pb-5 overflow-hidden">
          <div className="translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex flex-col items-center w-full">

            <h3 className="text-white font-bold text-lg sm:text-xl font-artistic drop-shadow-md text-center mb-0.5 sm:mb-1 w-full line-clamp-2 leading-tight">
              {safeArtwork.title}
            </h3>

            <p className="text-gray-200 font-medium text-xs sm:text-sm font-sans mb-1 sm:mb-1.5 truncate drop-shadow-sm text-center w-full">
              {safeArtwork.artist}
            </p>

            {originalPrice > 0 && (
              <div>
                <DiscountPriceBadge
                  originalPrice={originalPrice}
                  discountedPrice={discountedPrice}
                  discountPercent={discountPercent}
                  size="sm"
                  variant="light"
                  className="justify-center"
                  hideBadge={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default MasonryArtworkCard;
