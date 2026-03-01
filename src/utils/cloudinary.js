import { Cloudinary } from "@cloudinary/url-gen";
import { quality, format } from "@cloudinary/url-gen/actions/delivery";

/** Shared Cloudinary instance configured from VITE_CLOUDINARY_CLOUD_NAME. */
export const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  },
  url: {
    secure: true,
  },
});

/**
 * Returns an optimized Cloudinary image URL.
 * @param {string} publicId - Cloudinary public_id.
 * @param {{width?: number, height?: number, quality?: string}} [options={}] - Transform options.
 * @returns {string}
 */
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const { width, height, quality: qualityValue } = options;

  let imageTransformation = cld
    .image(publicId)
    .delivery(quality(qualityValue || "auto"))
    .delivery(format("auto"));

  // Apply responsive sizing if provided
  if (width) {
    imageTransformation = imageTransformation.resize(`w_${width}`);
  }

  if (height) {
    imageTransformation = imageTransformation.resize(`h_${height}`);
  }

  return imageTransformation.toURL();
};

/**
 * Returns a thumbnail URL (~400px wide, eco quality).
 * @param {string} publicId
 * @returns {string}
 */
export const getThumbnailUrl = (publicId) => {
  return getOptimizedImageUrl(publicId, { width: 400, quality: "auto:eco" });
};

/**
 * Returns a medium-sized preview URL (~800px wide, good quality).
 * @param {string} publicId
 * @param {{width?: number, height?: number, quality?: string, format?: string}} [options={}]
 * @returns {string}
 */
export const getPreviewUrl = (publicId, options = {}) => {
  return getOptimizedImageUrl(publicId, {
    width: options.width || 800,
    quality: options.quality || "auto:good",
    format: options.format || "jpg",
    height: options.height,
  });
};

/**
 * Returns a full-size URL (best quality, optional dimensions).
 * @param {string} publicId
 * @param {{width?: number, height?: number, quality?: string, format?: string}} [options={}]
 * @returns {string}
 */
export const getFullSizeUrl = (publicId, options = {}) => {
  return getOptimizedImageUrl(publicId, {
    width: options.width,
    height: options.height,
    quality: options.quality || "auto:best",
    format: options.format,
  });
};
