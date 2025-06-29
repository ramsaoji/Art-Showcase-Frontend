import { Cloudinary } from "@cloudinary/url-gen";
import { quality } from "@cloudinary/url-gen/actions/delivery";
import { format } from "@cloudinary/url-gen/actions/delivery";

// Initialize Cloudinary instance
export const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  },
  url: {
    secure: true,
  },
});

// Helper function to get optimized image URL with improved settings
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

// Helper function to get thumbnail URL (smaller, optimized for lists)
export const getThumbnailUrl = (publicId) => {
  return getOptimizedImageUrl(publicId, { width: 400, quality: "auto:eco" });
};

// Helper function to get preview URL (medium size, good quality)
export const getPreviewUrl = (publicId, options = {}) => {
  return getOptimizedImageUrl(publicId, {
    width: options.width || 800,
    quality: options.quality || "auto:good",
    format: options.format || "jpg",
    height: options.height,
  });
};

// Helper function to get full size URL (high quality)
export const getFullSizeUrl = (publicId, options = {}) => {
  return getOptimizedImageUrl(publicId, {
    width: options.width,
    height: options.height,
    quality: options.quality || "auto:best",
    format: options.format,
  });
};
