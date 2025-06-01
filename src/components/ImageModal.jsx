import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { formatPrice } from "../utils/formatters";

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
  }, [image?.url, image?.image]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

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
            <Dialog.Overlay className="fixed inset-0 bg-black/90 transition-opacity" />
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
            <div className="inline-block w-full max-w-6xl my-8 text-left align-middle transition-all transform">
              <div className="bg-white rounded-xl overflow-hidden shadow-xl">
                <div className="flex flex-col md:flex-row md:max-h-[90vh]">
                  <div className="relative flex-none h-[35vh] md:h-auto md:flex-1 bg-gray-100">
                    {isLoading && !hasError && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    )}

                    {hasError ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                        <PhotoIcon className="h-16 w-16" />
                        <p className="mt-2 text-sm">Image not available</p>
                      </div>
                    ) : (
                      <img
                        src={image?.url || image?.image}
                        alt={image?.title}
                        className={`w-full h-full object-contain transition-opacity duration-300 ${
                          isLoading ? "opacity-0" : "opacity-100"
                        }`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                      />
                    )}

                    {hasPrevious && (
                      <button
                        onClick={onPrevious}
                        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-gray-800 hover:text-gray-600 z-10 bg-white/80 rounded-full p-1.5 md:p-2 shadow-lg transition-all duration-200 hover:bg-white"
                      >
                        <ChevronLeftIcon className="h-6 w-6 md:h-8 md:w-8" />
                      </button>
                    )}

                    {hasNext && (
                      <button
                        onClick={onNext}
                        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-gray-800 hover:text-gray-600 z-10 bg-white/80 rounded-full p-1.5 md:p-2 shadow-lg transition-all duration-200 hover:bg-white"
                      >
                        <ChevronRightIcon className="h-6 w-6 md:h-8 md:w-8" />
                      </button>
                    )}
                  </div>

                  <div className="relative flex-none md:w-[400px] bg-white">
                    <div className="absolute right-2 top-2 z-10">
                      <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-all duration-200"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="p-4 md:p-6 overflow-y-auto max-h-[45vh] md:max-h-[90vh]">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 pr-8">
                        {image?.title}
                      </h2>
                      <p className="text-lg text-indigo-600 font-semibold mb-4">
                        {image?.price ? formatPrice(image.price) : ""}
                      </p>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">
                            Artist
                          </h3>
                          <p className="text-base text-gray-900">
                            {image?.artist}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500">
                            Description
                          </h3>
                          <p className="text-base text-gray-900">
                            {image?.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">
                              Style
                            </h3>
                            <p className="text-base text-gray-900">
                              {image?.style}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">
                              Material
                            </h3>
                            <p className="text-base text-gray-900">
                              {image?.material}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">
                              Dimensions
                            </h3>
                            <p className="text-base text-gray-900">
                              {image?.dimensions}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">
                              Year
                            </h3>
                            <p className="text-base text-gray-900">
                              {image?.year}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 pb-2">
                          <button className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200">
                            Contact About This Piece
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
