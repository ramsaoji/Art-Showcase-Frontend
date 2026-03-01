import * as z from "zod";

/**
 * Purchase request form validation schema.
 * Validates buyer name, email, 10-digit phone, and address.
 */
export const purchaseRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .refine(
      (value) => !value || !/\.@/.test(value),
      "Email cannot have a dot right before @"
    ),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  address: z.string().min(1, "Address is required"),
});
