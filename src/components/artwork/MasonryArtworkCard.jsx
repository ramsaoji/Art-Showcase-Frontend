import { useMemo, useState, useEffect, useRef, memo, useCallback } from "react";
import { motion } from "framer-motion";
import PhotoIcon from "@heroicons/react/24/outline/PhotoIcon";
import StarIcon from "@heroicons/react/24/outline/StarIcon";
import useOptimizedImage from "@/hooks/useOptimizedImage";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/utils/formatters";

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

  const { isSuperAdmin, isArtist, user } = useAuth();

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

      {images.length === 0 || imageError ? (
        <div className="flex items-center justify-center aspect-[3/4] w-full">
           <PhotoIcon className="h-12 w-12 text-gray-400" />
        </div>
      ) : (
        <>
          {!imageState.highQualityLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          {isVisible && (
            <img
              src={imageState.fullSizeUrl || currentImage.url || "placeholder.png"}
              alt={safeArtwork.title}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading={priority ? "eager" : "lazy"}
              className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )}
        </>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-2 sm:p-4 pointer-events-none overflow-hidden">
        <div className="translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex flex-col items-center justify-center w-full h-full max-h-full">
          <div className="flex flex-col items-center justify-center shrink min-h-0 w-full overflow-hidden">
            <h3 className="text-white font-bold text-lg sm:text-xl truncate px-2 font-artistic drop-shadow-md text-center mb-0.5 sm:mb-1 w-full shrink-0">
              {safeArtwork.title}
            </h3>
            
            <p className="text-gray-200 font-medium text-xs sm:text-sm font-sans mb-1.5 sm:mb-2 truncate drop-shadow-sm text-center w-full shrink-0">
              {safeArtwork.artist}
            </p>
            
            {safeArtwork.price > 0 && (
              <div className="mb-0 sm:mb-2 shrink-0 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] sm:text-xs font-bold font-sans px-3 py-1 sm:px-4 sm:py-1 rounded-full shadow-sm">
                {formatPrice(safeArtwork.price)}
              </div>
            )}
            
            {safeArtwork.description && (
               <div className="hidden sm:flex mt-1 sm:mt-2 w-full justify-center shrink min-h-0 overflow-hidden">
                 <p className="text-gray-300 text-[10px] sm:text-xs line-clamp-2 font-sans drop-shadow-sm text-center max-w-[95%]">
                   {safeArtwork.description}
                 </p>
               </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default MasonryArtworkCard;
