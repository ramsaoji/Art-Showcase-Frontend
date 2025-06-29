import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Loader from "./ui/Loader";

export default function SocialMediaModal({
  isOpen,
  onClose,
  type,
  url,
  title = "Social Media Content",
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsLoading(true);
    setError(null);
    onClose();
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^\/\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        // Enable autoplay for all YouTube videos
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1&mute=1`;
      }
    }
    return null;
  };

  const getInstagramEmbedUrl = (url) => {
    if (!url) return null;
    const patterns = [
      /instagram\.com\/p\/([^\/\n?#]+)/,
      /instagram\.com\/reel\/([^\/\n?#]+)/,
      /instagram\.com\/tv\/([^\/\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        // Add autoplay parameter for Instagram videos
        return `https://www.instagram.com/p/${match[1]}/embed/captioned/?autoplay=1`;
      }
    }
    return null;
  };

  const getEmbedUrl = () => {
    if (type === "youtube") return getYouTubeEmbedUrl(url);
    if (type === "instagram") return getInstagramEmbedUrl(url);
    return null;
  };

  const embedUrl = getEmbedUrl();

  // Determine if content is vertical (reel/short)
  const isVerticalContent = () => {
    if (type === "instagram") return true; // Instagram reels are always vertical
    if (type === "youtube") {
      return url.includes("/shorts/"); // YouTube shorts are vertical
    }
    return false;
  };

  const isVertical = isVerticalContent();

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setError("Failed to load content. Please try again or open in new tab.");
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 md:p-6 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`relative w-full mx-auto bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col ${
                  isVertical ? "max-w-sm" : "max-w-7xl"
                }`}
                style={{
                  height: "calc(100dvh - 5rem)",
                  minHeight: isVertical ? "400px" : "300px",
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-xl flex-shrink-0">
                  <Dialog.Title
                    className={`font-artistic font-bold text-gray-900 ${
                      isVertical ? "text-base" : "text-xl"
                    }`}
                  >
                    {title}
                  </Dialog.Title>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100/80 backdrop-blur-md text-gray-500 transition-all duration-200 hover:bg-gray-200 hover:text-gray-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-300 border border-gray-200/50"
                  >
                    <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </motion.button>
                </div>

                {/* Body */}
                <div className="relative bg-white flex-1 flex flex-col overflow-hidden">
                  {isLoading && (
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                      <Loader size="medium" />
                    </div>
                  )}

                  {embedUrl && !error && (
                    <div
                      className={`flex-1 relative bg-gradient-to-br from-gray-900/50 to-black/30 ${
                        isLoading ? "hidden" : ""
                      }`}
                    >
                      <iframe
                        src={embedUrl}
                        className="absolute top-0 left-0 w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={handleLoad}
                        onError={handleError}
                      />
                    </div>
                  )}

                  {error && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-6 gap-3 text-sm text-gray-700 bg-gradient-to-br from-red-50 to-white">
                      <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-lg">
                        <svg
                          className="w-8 h-8 text-red-500 mx-auto mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                        <p className="font-sans text-gray-700 mb-3 text-xs">
                          {error}
                        </p>
                        <motion.a
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 rounded-lg hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800 transition-all duration-300 font-sans font-semibold shadow-lg hover:shadow-xl text-xs"
                        >
                          Open in New Tab
                        </motion.a>
                      </div>
                    </div>
                  )}

                  {!embedUrl && !error && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-6 gap-3 text-sm text-gray-700 bg-gradient-to-br from-gray-50 to-white">
                      <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-lg">
                        <svg
                          className="w-8 h-8 text-gray-400 mx-auto mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                        <p className="font-sans text-gray-700 mb-3 text-xs">
                          Unable to embed this content.
                        </p>
                        <motion.a
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 rounded-lg hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800 transition-all duration-300 font-sans font-semibold shadow-lg hover:shadow-xl text-xs"
                        >
                          Open in New Tab
                        </motion.a>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
