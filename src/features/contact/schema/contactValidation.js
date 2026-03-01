import * as z from "zod";

/**
 * Contact form validation schema.
 * Validates name, email (with dot-before-@ guard), and message.
 */
export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .refine(
      (value) => !value || !/\.@/.test(value),
      "Email cannot have a dot right before @"
    ),
  message: z.string().min(1, "Message is required"),
});
