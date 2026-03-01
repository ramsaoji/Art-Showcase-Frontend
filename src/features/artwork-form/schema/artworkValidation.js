import * as z from "zod";

/**
 * Creates the Zod validation schema for the artwork form.
 * Conditionally extends based on admin privileges and edit vs. create mode.
 *
 * @param {boolean} isSuperAdmin - Whether the current user is a super admin.
 * @param {object|null} initialData - Existing artwork data (null = create mode).
 * @returns {z.ZodObject} The resolved Zod schema.
 */
export function createValidationSchema(isSuperAdmin, initialData) {
  let schema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    material: z.string().trim().min(1, "Material is required"),
    style: z.string().trim().min(1, "Style is required"),
    description: z.string().trim().min(1, "Description is required"),
    price: z.coerce
      .number({ invalid_type_error: "Price must be a number" })
      .positive("Price must be greater than 0"),
    year: z.coerce
      .number({ invalid_type_error: "Year must be a number" })
      .min(1900, "Year must be at least 1900")
      .max(new Date().getFullYear(), "Year cannot be in the future"),
    width: z.coerce
      .number({ invalid_type_error: "Width must be a number" })
      .positive("Width must be greater than 0"),
    height: z.coerce
      .number({ invalid_type_error: "Height must be a number" })
      .positive("Height must be greater than 0"),
    instagramReelLink: z.preprocess(
      (val) => (val === "" ? null : val),
      z.string().trim().url("Must be a valid URL").optional().nullable()
    ),
    youtubeVideoLink: z.preprocess(
      (val) => (val === "" ? null : val),
      z.string().trim().url("Must be a valid URL").optional().nullable()
    ),
    images: z.array(z.any()).min(1, "At least one image is required"),
    artistId: z.string().optional(),
    expiresAt: z.any().optional(),
    dimensions: z.string().optional(),
    status: z.string().optional().default("ACTIVE"),
    featured: z.boolean().optional().default(false),
    sold: z.boolean().optional().default(false),
  });

  // In create mode, require artistId when admin is adding on behalf of an artist
  if (isSuperAdmin && !initialData) {
    schema = schema.extend({
      artistId: z.string().min(1, "Artist is required"),
    });
  }

  // Admins can set an expiry date
  if (isSuperAdmin) {
    schema = schema.extend({
      expiresAt: z.coerce.date().nullable().optional(),
    });
  }

  return schema;
}
