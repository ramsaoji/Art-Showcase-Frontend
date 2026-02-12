import { useState, useEffect, useMemo } from "react";
import { getPreviewUrl, getFullSizeUrl } from "../config/cloudinary";

/**
 * Custom hook for optimized image loading with progressive enhancement
 *
 * @param {string} publicId - Cloudinary public ID of the image
 * @param {Object} options - Configuration options
 * @param {boolean} options.lazy - Whether to lazy load the image (default: true)
 * @param {number} options.quality - Image quality (1-100)
 * @param {string} options.format - Image format (auto, webp, etc.)
 * @param {number} options.width - Desired image width
 * @param {number} options.height - Desired image height
 * @returns {Object} Image loading state and URLs
 */
export default function useOptimizedImage(publicId, options = {}) {
  const { lazy = true, quality, format, width, height } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [highQualityLoaded, setHighQualityLoaded] = useState(false);

  // Memoize URL generation to avoid recalculating on every render (js-cache-function-results)
  const previewUrl = useMemo(
    () =>
      publicId
        ? getPreviewUrl(publicId, { width, height, quality: 10, format })
        : "",
    [publicId, width, height, format]
  );
  
  const fullSizeUrl = useMemo(
    () =>
      publicId
        ? getFullSizeUrl(publicId, { width, height, quality, format })
        : "",
    [publicId, width, height, quality, format]
  );

  // Preload high quality image when component mounts
  useEffect(() => {
    if (!publicId) {
      setIsLoading(false);
      return;
    }

    // Reset states when publicId changes
    setIsLoading(true);
    setIsError(false);
    setHighQualityLoaded(false);

    // Create new image object to preload high quality version
    const img = new Image();

    img.onload = () => {
      setHighQualityLoaded(true);
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsError(true);
      setIsLoading(false);
    };

    img.src = fullSizeUrl;

    return () => {
      // Clean up by removing event listeners
      img.onload = null;
      img.onerror = null;
    };
  }, [publicId, fullSizeUrl]);

  return {
    previewUrl,
    fullSizeUrl,
    isLoading,
    isError,
    highQualityLoaded,
    // Helper for generating srcSet for responsive images
    getSrcSet: (widths = [400, 600, 800, 1200]) => {
      if (!publicId) return "";

      return widths
        .map(
          (w) =>
            `${getFullSizeUrl(publicId, { width: w, quality, format })} ${w}w`
        )
        .join(", ");
    },
  };
}
