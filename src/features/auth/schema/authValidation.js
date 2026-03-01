import * as z from "zod";

/**
 * Shared email field schema with dot-before-@ guard.
 * Used across signup, login, and purchase request schemas.
 */
const emailField = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .refine(
    (value) => !value || !/\.@/.test(value),
    "Email cannot have a dot right before @"
  );

/**
 * Signup form validation schema.
 * Validates artist name, email, password with 8-char minimum,
 * and password confirmation match.
 */
export const signupSchema = z
  .object({
    artistName: z.string().min(1, "Artist name is required"),
    email: emailField,
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

/**
 * Login form validation schema.
 * Validates email format and non-empty password.
 */
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

/**
 * Change password form validation schema.
 * Validates current password, new password (8-char min),
 * confirmation match, and new ≠ current guard.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(1, "New password is required")
      .min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password cannot be the same as the current one.",
    path: ["newPassword"],
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords must match",
    path: ["confirmNewPassword"],
  });
