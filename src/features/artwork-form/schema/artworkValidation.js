import * as z from "zod";

/**
 * Creates the Zod validation schema for the artwork form.
 * Conditionally extends based on admin privileges and edit vs. create mode.
 *
 * @param {boolean} canAssignArtwork - Whether the current user can create artwork for another artist.
 * @param {boolean} canManageArtworkStatus - Whether the current user can set expiry values.
 * @param {object|null} initialData - Existing artwork data (null = create mode).
 * @returns {z.ZodObject} The resolved Zod schema.
 */
export function createValidationSchema(
  canAssignArtwork,
  canManageArtworkStatus,
  initialData
) {
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
    discountPercent: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
      z.number({ invalid_type_error: "Discount must be a number" })
        .min(1, "Discount must be at least 1%")
        .max(99, "Discount cannot exceed 99%")
        .nullable()
        .optional()
    ),
    discountStartAt: z.any().optional().nullable(),
    discountEndAt: z.any().optional().nullable(),
  });

  // ─── Conditional extensions MUST happen before superRefine ────
  // Zod schema.extend() is not available on ZodEffects (returned by superRefine).

  // In create mode, require artistId when admin is adding on behalf of an artist
  if (canAssignArtwork && !initialData) {
    schema = schema.extend({
      artistId: z.string().min(1, "Artist is required"),
    });
  }

  // Admins can set an expiry date
  if (canManageArtworkStatus) {
    schema = schema.extend({
      expiresAt: z.coerce.date().nullable().optional(),
    });
  }

  // ─── Post-schema data validations ─────────────────────────────
  return schema.superRefine((data, ctx) => {
    if (data.discountStartAt && data.discountEndAt) {
      const start = new Date(data.discountStartAt);
      const end = new Date(data.discountEndAt);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["discountEndAt"],
          message: "Discount end date must be after the start date",
        });
      }
    }
  });
}
