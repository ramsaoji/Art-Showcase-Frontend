import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
  StarIcon,
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

export default function ImageModal({
  isOpen,
  onClose,
  image,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { isSuperAdmin, isArtist, user } = useAuth();

  // Reset loading and error states when image changes
  useEffect(() => {
    if (image) {
      setIsLoading(true);
      setHasError(false);
      setHighQualityLoaded(false);
    }
  }, [image?.id, image?.public_id, image?.cloudinary_public_id]);

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
    if (image) {
      trackArtworkInteraction("artwork_close", image.id, image.title);
    }
    onClose();
  };

  // State for progressive image loading
  const [highQualityLoaded, setHighQualityLoaded] = useState(false);

  // Get preview (medium quality) image URL
  const getPreviewImageUrl = () => {
    if (!image) return "";
    const publicId = image.public_id || image.cloudinary_public_id;
    if (publicId) {
      return getPreviewUrl(publicId);
    }
    return image.url;
  };

  // Get full quality image URL
  const getHighQualityImageUrl = () => {
    if (!image) return "";
    const publicId = image.public_id || image.cloudinary_public_id;
    if (publicId) {
      return getFullSizeUrl(publicId);
    }
    return image.url;
  };

  // Preload high quality image when modal opens
  useEffect(() => {
    if (isOpen && image) {
      setHighQualityLoaded(false);
      const highQualityImg = new Image();
      highQualityImg.src = getHighQualityImageUrl();
      highQualityImg.onload = () => {
        setHighQualityLoaded(true);
      };
      highQualityImg.onerror = () => {
        // If high quality fails, keep using preview
        console.warn("High quality image failed to load, using preview");
      };
    } else {
      setHighQualityLoaded(false);
    }
  }, [isOpen, image?.id, image?.public_id, image?.cloudinary_public_id]);

  // Determine if the current user is the owner (artist) of this artwork
  const isOwner = user && image?.userId && user.id === image.userId;

  // Status badge visibility logic
  const canSeeStatusBadge =
    isSuperAdmin ||
    (isArtist && isOwner) ||
    (image?.status && image.status !== "ACTIVE");

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const handleImageModalClose = () => {
    // Don't close the image modal if purchase modal is open
    if (showPurchaseModal) {
      return;
    }
    handleClose();
  };

  return (
    <Transition.Root show={isOpen} as="div">
      <Dialog
        as="div"
        className="fixed inset-0 z-50"
        onClose={handleImageModalClose}
      >
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
            <Dialog.Overlay className="fixed inset-0 bg-black/90 backdrop-blur-sm transition-opacity" />
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative w-full max-w-7xl h-[85vh] sm:h-[90vh] flex flex-col md:flex-row bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border border-white/20"
            >
              {/* Image Section */}
              <div className="relative flex h-2/5 w-full items-center justify-center bg-gray-50/50 md:h-full md:flex-1">
                {isLoading && !hasError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader size="large" />
                  </div>
                )}

                {hasError ? (
                  <div className="flex flex-col items-center justify-center text-gray-400 p-8">
                    <PhotoIcon className="h-16 w-16 mb-4" />
                    <p className="text-lg font-sans">Image not available</p>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                    {/* Single image with progressive loading */}
                    <img
                      src={
                        highQualityLoaded
                          ? getHighQualityImageUrl()
                          : getPreviewImageUrl()
                      }
                      alt={image?.title}
                      className={`max-w-full max-h-full object-contain transition-opacity duration-500 ${
                        isLoading ? "opacity-0" : "opacity-100"
                      } ${image?.sold ? "opacity-90" : ""}`}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        width: "auto",
                        height: "auto",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                )}

                {/* Badges overlay */}
                <div className="absolute top-2 right-2 z-30 flex flex-row items-center gap-1 sm:top-4 sm:right-6 sm:gap-2 md:top-4 md:right-6 md:gap-2">
                  {image?.featured && (
                    <Badge type="featured" variant="overlay">
                      <span className="inline-flex items-center">
                        <StarIcon className="h-4 w-4 mr-1" />
                        Featured
                      </span>
                    </Badge>
                  )}
                  {image?.sold && (
                    <Badge type="sold" variant="overlay">
                      Sold
                    </Badge>
                  )}
                  {/* Status badge: only for allowed users */}
                  {image?.status && canSeeStatusBadge && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold font-sans
                        ${
                          image.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : ""
                        }
                        ${
                          image.status === "INACTIVE"
                            ? "bg-yellow-100 text-yellow-700"
                            : ""
                        }
                        ${
                          image.status === "EXPIRED"
                            ? "bg-red-100 text-red-700"
                            : ""
                        }
                      `}
                    >
                      {image.status === "EXPIRED"
                        ? image.expiredBy === "admin"
                          ? "Expired (admin)"
                          : image.expiredBy === "auto"
                          ? "Expired (auto)"
                          : "Expired"
                        : image.status.charAt(0) +
                          image.status.slice(1).toLowerCase()}
                    </span>
                  )}
                </div>

                {/* Navigation buttons */}
                {hasPrevious && (
                  <button
                    onClick={onPrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 m-2 w-10 h-10 flex items-center justify-center rounded-full aspect-square p-0 bg-white/90 text-gray-800 shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-white hover:text-gray-600 hover:shadow-xl sm:left-4 sm:m-4 md:left-4 md:m-4"
                  >
                    <ChevronLeftIcon className="h-5 w-5 sm:h-6 md:h-6" />
                  </button>
                )}

                {hasNext && (
                  <button
                    onClick={onNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 m-2 w-10 h-10 flex items-center justify-center rounded-full aspect-square p-0 bg-white/90 text-gray-800 shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-white hover:text-gray-600 hover:shadow-xl sm:right-4 sm:m-4 md:right-4 md:m-4"
                  >
                    <ChevronRightIcon className="h-5 w-5 sm:h-6 md:h-6" />
                  </button>
                )}
              </div>

              {/* Details Section */}
              <div className="relative h-3/5 w-full flex-shrink-0 bg-white/95 flex flex-col md:h-full md:w-80 lg:w-96 xl:w-[28rem]">
                {/* Close button */}
                <button
                  onClick={handleImageModalClose}
                  className="absolute right-2 top-2 z-10 w-10 h-10 flex items-center justify-center rounded-full aspect-square p-0 bg-gray-100 text-gray-500 transition-all duration-200 hover:bg-gray-200 hover:text-gray-700 hover:!translate-y-0 sm:right-4 sm:top-4 md:right-4 md:top-4"
                >
                  <XMarkIcon className="h-4 w-4 sm:h-5 md:h-5" />
                </button>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto overscroll-contain bg-white p-4 pr-12 sm:p-6 sm:pr-16 md:p-6 md:pr-16">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-artistic text-2xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 tracking-wide"
                  >
                    {image?.title}
                  </motion.h2>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                  >
                    <p className="font-artistic text-2xl md:text-2xl lg:text-3xl text-indigo-600 font-bold tracking-wide">
                      {image?.price ? formatPrice(image.price) : ""}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                        Artist
                      </h3>
                      <div className="relative group inline-block">
                        <p className="font-artistic text-lg text-indigo-600 group-hover:text-indigo-700 transition-colors">
                          {image?.artistName}
                        </p>
                        <div className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                      </div>
                    </div>

                    {image?.description && (
                      <div>
                        <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                          Description
                        </h3>
                        <p className="text-base font-sans text-gray-700 leading-relaxed">
                          {image.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {image?.style && (
                        <div>
                          <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                            Style
                          </h3>
                          <p className="text-base font-sans text-gray-700">
                            {image.style}
                          </p>
                        </div>
                      )}
                      {image?.material && (
                        <div>
                          <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                            Material
                          </h3>
                          <p className="text-base font-sans text-gray-700">
                            {image.material}
                          </p>
                        </div>
                      )}
                      {image?.dimensions && (
                        <div>
                          <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                            Dimensions
                          </h3>
                          <p className="text-base font-sans text-gray-700">
                            {image.dimensions}
                          </p>
                        </div>
                      )}
                      {image?.year && (
                        <div>
                          <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                            Year
                          </h3>
                          <p className="text-base font-sans text-gray-700">
                            {image.year}
                          </p>
                        </div>
                      )}
                      {image?.createdAt && (
                        <div>
                          <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                            Added
                          </h3>
                          <p className="text-base font-sans text-gray-700">
                            {formatLocalDateTime(image.createdAt)}
                          </p>
                        </div>
                      )}
                      {image?.expiresAt &&
                        (isSuperAdmin || (isArtist && isOwner)) && (
                          <div>
                            <h3 className="text-sm font-sans font-medium text-red-700 mb-1">
                              Expires
                            </h3>
                            <p className="text-base font-sans text-red-700">
                              {formatLocalDateTime(image.expiresAt)}
                            </p>
                          </div>
                        )}
                    </div>
                  </motion.div>
                </div>

                {/* Purchase Request Button - always at the bottom of details */}
                {!user &&
                  (!image?.sold ? (
                    <div className="flex justify-center sm:justify-end border-t border-gray-200 p-4">
                      <button
                        className="w-full rounded-xl bg-indigo-600 px-6 py-3 font-sans font-semibold text-white shadow transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        onClick={() => setShowPurchaseModal(true)}
                      >
                        Request to Purchase
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center sm:justify-end border-t border-gray-200 p-4">
                      <button
                        className="w-full rounded-xl bg-gray-400 px-6 py-3 font-sans font-semibold text-white shadow cursor-not-allowed opacity-80 sm:w-auto"
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
      <PurchaseRequestModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        artworkId={image?.id}
        artworkTitle={image?.title}
      />
    </Transition.Root>
  );
}
