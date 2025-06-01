import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/react";
import { quality } from "@cloudinary/url-gen/actions/delivery";
import { format } from "@cloudinary/url-gen/actions/delivery";
import sha1 from "crypto-js/sha1";

// Initialize Cloudinary instance
export const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  },
  url: {
    secure: true,
  },
});

// Function to generate signature for Cloudinary API calls
const generateSignature = (paramsToSign) => {
  return sha1(
    paramsToSign + import.meta.env.VITE_CLOUDINARY_API_SECRET
  ).toString();
};

// Function to upload image to Cloudinary
export const uploadImage = async (file) => {
  try {
    // Convert file to base64
    const base64Data = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

    // Create form data
    const formData = new FormData();
    formData.append("file", base64Data);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );
    formData.append("folder", "art-showcase");

    // Upload to Cloudinary using the upload API
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${
        import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
      }/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const result = await response.json();

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Failed to upload image");
  }
};

// Function to delete image from Cloudinary
export const deleteImage = async (publicId) => {
  if (!publicId) return;

  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${
    import.meta.env.VITE_CLOUDINARY_API_SECRET
  }`;
  const signature = sha1(paramsToSign).toString();

  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("signature", signature);
  formData.append("api_key", import.meta.env.VITE_CLOUDINARY_API_KEY);
  formData.append("timestamp", timestamp);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${
        import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
      }/image/destroy`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Cloudinary API Error:", errorData);
      throw new Error(
        errorData.error?.message || "Failed to delete image from Cloudinary"
      );
    }

    const result = await response.json();
    console.log("Cloudinary delete result:", result);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
};

// Helper function to get optimized image URL
export const getOptimizedImageUrl = (publicId) => {
  return cld
    .image(publicId)
    .delivery(quality("auto:best"))
    .delivery(format("auto"))
    .toURL();
};

export { AdvancedImage };
