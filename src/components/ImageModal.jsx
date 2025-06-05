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
import { formatPrice } from "../utils/formatters";
import { getPreviewUrl, getFullSizeUrl } from "../config/cloudinary";
import { trackArtworkInteraction } from "../services/analytics";
import Badge from "./Badge";
import Loader from "./ui/Loader";

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

  // Reset loading and error states when image changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [image?.url, image?.public_id, image?.cloudinary_public_id]);

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
      const highQualityImg = new Image();
      highQualityImg.src = getHighQualityImageUrl();
      highQualityImg.onload = () => {
        setHighQualityLoaded(true);
      };
    } else {
      setHighQualityLoaded(false);
    }
  }, [isOpen, image]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50" onClose={onClose}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black/90 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
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
              className="inline-block w-full max-w-6xl my-4 sm:my-8 text-left align-middle transition-all transform"
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                <div className="flex flex-col md:flex-row md:max-h-[90vh]">
                  <div className="relative flex-none h-[35vh] sm:h-[40vh] md:h-auto md:flex-1 bg-gray-50/50">
                    {isLoading && !hasError && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader size="large" />
                      </div>
                    )}

                    {hasError ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 text-gray-400">
                        <PhotoIcon className="h-12 w-12 sm:h-16 sm:w-16" />
                        <p className="mt-2 text-sm font-sans">
                          Image not available
                        </p>
                      </div>
                    ) : (
                      <div className="relative h-full">
                        {/* Progressive image loading - first load preview, then high quality */}
                        <img
                          src={getPreviewImageUrl()}
                          alt={image?.title}
                          className={`w-full h-full object-contain transition-opacity duration-300 ${
                            isLoading
                              ? "opacity-0"
                              : highQualityLoaded
                              ? "opacity-0"
                              : "opacity-100"
                          } ${
                            image?.sold ? "opacity-90" : ""
                          } absolute inset-0`}
                          onLoad={handleImageLoad}
                          onError={handleImageError}
                        />

                        {/* High quality image that loads after preview */}
                        {!isLoading && !hasError && (
                          <img
                            src={getHighQualityImageUrl()}
                            alt={image?.title}
                            className={`w-full h-full object-contain transition-opacity duration-500 ${
                              highQualityLoaded ? "opacity-100" : "opacity-0"
                            } ${image?.sold ? "opacity-90" : ""}`}
                            onLoad={() => setHighQualityLoaded(true)}
                            onError={handleImageError}
                          />
                        )}
                        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-30 flex gap-2">
                          {image?.featured && (
                            <Badge type="featured" variant="overlay">
                              <span className="inline-flex items-center">
                                <StarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                                Featured
                              </span>
                            </Badge>
                          )}
                          {image?.sold && (
                            <Badge type="sold" variant="overlay">
                              Sold
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {hasPrevious && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onPrevious}
                        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-800 hover:text-gray-600 z-10 bg-white/80 backdrop-blur-sm rounded-full p-1.5 sm:p-2 shadow-lg transition-all duration-200 hover:bg-white"
                      >
                        <ChevronLeftIcon className="h-6 w-6 sm:h-8 sm:w-8" />
                      </motion.button>
                    )}

                    {hasNext && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onNext}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-800 hover:text-gray-600 z-10 bg-white/80 backdrop-blur-sm rounded-full p-1.5 sm:p-2 shadow-lg transition-all duration-200 hover:bg-white"
                      >
                        <ChevronRightIcon className="h-6 w-6 sm:h-8 sm:w-8" />
                      </motion.button>
                    )}
                  </div>

                  <div className="relative flex-none md:w-[400px] bg-white/95">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleClose}
                      className="absolute right-3 sm:right-4 top-3 sm:top-4 z-10 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 sm:p-2 transition-all duration-200"
                    >
                      <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </motion.button>

                    <div className="p-4 sm:p-6 overflow-y-auto max-h-[40vh] sm:max-h-[45vh] md:max-h-[90vh]">
                      <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-artistic text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 pr-10 sm:pr-12 tracking-wide"
                      >
                        {image?.title}
                      </motion.h2>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center justify-between mb-6"
                      >
                        <p className="font-artistic text-2xl text-indigo-600 font-bold tracking-wide">
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
                              {image?.artist}
                            </p>
                            <div className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                            Description
                          </h3>
                          <p className="text-base font-sans text-gray-700 leading-relaxed">
                            {image?.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                              Style
                            </h3>
                            <p className="text-base font-sans text-gray-700">
                              {image?.style}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                              Material
                            </h3>
                            <p className="text-base font-sans text-gray-700">
                              {image?.material}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                              Dimensions
                            </h3>
                            <p className="text-base font-sans text-gray-700">
                              {image?.dimensions}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-sans font-medium text-gray-500 mb-1">
                              Year
                            </h3>
                            <p className="text-base font-sans text-gray-700">
                              {image?.year}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
