import React, { useState, useEffect } from "react";
import useScrollLock from "@/hooks/useScrollLock";
import { motion } from "framer-motion";

import Loader from "@/components/common/Loader";

// shadcn components
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Embed URL helpers ────────────────────────────────────────────────────────

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  /youtube\.com\/shorts\/([^\/\n?#]+)/,
];

const INSTAGRAM_PATTERNS = [
  /instagram\.com\/p\/([^\/\n?#]+)/,
  /instagram\.com\/reel\/([^\/\n?#]+)/,
  /instagram\.com\/tv\/([^\/\n?#]+)/,
];

const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      // autoplay + mute for YouTube (browser autoplay policy requires mute)
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1&mute=1`;
    }
  }
  return null;
};

const getInstagramEmbedUrl = (url) => {
  if (!url) return null;
  for (const pattern of INSTAGRAM_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.instagram.com/p/${match[1]}/embed/captioned/?autoplay=1`;
    }
  }
  return null;
};

// ─── Animation config ─────────────────────────────────────────────────────────

const innerMotion = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
  transition: { duration: 0.4, ease: "easeOut" },
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SocialMediaModal Component
 * Displays an embedded YouTube or Instagram video in a fullscreen-style modal.
 * No form or Zod schema — lives in components/ as a generic shared display modal.
 *
 * @param {boolean} props.isOpen - Controls modal visibility.
 * @param {Function} props.onClose - Callback triggered when modal closes.
 * @param {"youtube"|"instagram"} props.type - Type of embed to render.
 * @param {string} props.url - The original URL to embed or fall back to.
 * @param {string} [props.title="Social Media Content"] - Display title in the modal header.
 */
export default function SocialMediaModal({
  isOpen,
  onClose,
  type,
  url,
  title = "Social Media Content",
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  useScrollLock(isOpen);

  // Reset loading + error state each time the modal opens
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

  const getEmbedUrl = () => {
    if (type === "youtube") return getYouTubeEmbedUrl(url);
    if (type === "instagram") return getInstagramEmbedUrl(url);
    return null;
  };

  const embedUrl = getEmbedUrl();

  // Instagram reels are always vertical; YouTube Shorts use a /shorts/ path segment
  const isVertical = type === "instagram" || url?.includes("/shorts/");

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setError("Failed to load content. Please try again or open in a new tab.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden flex flex-col border-white/20 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl z-[70] [&>button]:hidden"
        style={{
          maxWidth: isVertical ? "24rem" : "90vw",
          width: "100%",
          height: "calc(100dvh - 5rem)",
          minHeight: isVertical ? "400px" : "300px",
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex flex-row items-center gap-3 px-4 py-3 border-b border-gray-200/50 bg-gradient-to-r from-white/90 to-gray-50/90">
          <DialogTitle
            className={`flex-1 font-artistic font-bold text-gray-900 leading-tight ${isVertical ? "text-base" : "text-xl"}`}
          >
            {title}
          </DialogTitle>
          <DialogClose className="flex-shrink-0 rounded-full bg-gray-100/80 backdrop-blur-md p-1.5 text-gray-500 transition-all duration-200 hover:bg-gray-200 hover:text-gray-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-300">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Body — embed or fallback states */}
        <motion.div {...innerMotion} className="relative flex-1 flex flex-col overflow-hidden">

          {/* Loading state */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
              <Loader size="medium" />
            </div>
          )}

          {/* Embed iframe */}
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
                title={title}
              />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-6 gap-3 bg-gradient-to-br from-red-50 to-white">
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-lg">
                <svg className="w-8 h-8 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="font-sans text-gray-700 mb-3 text-xs">{error}</p>
                <OpenInNewTabLink url={url} />
              </div>
            </div>
          )}

          {/* URL not embeddable state */}
          {!embedUrl && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-6 gap-3 bg-gradient-to-br from-gray-50 to-white">
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-lg">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <p className="font-sans text-gray-700 mb-3 text-xs">Unable to embed this content.</p>
                <OpenInNewTabLink url={url} />
              </div>
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Private sub-component ────────────────────────────────────────────────────

/**
 * OpenInNewTabLink — fallback CTA when iframe cannot embed the content.
 * @param {string} props.url - URL to open externally.
 */
function OpenInNewTabLink({ url }) {
  return (
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
  );
}
