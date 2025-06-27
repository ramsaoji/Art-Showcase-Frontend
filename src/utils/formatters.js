export const formatPrice = (price) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export function formatLocalDateTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    // timeZoneName: "short",
  });
}

export function toDatetimeLocalValue(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const pad = (n) => n.toString().padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );
}

/**
 * Maps backend error codes/messages to user-friendly messages.
 * @param {any} err - The error object from backend (can be string, Error, or tRPC error).
 * @returns {string} User-friendly error message.
 */
export function getFriendlyErrorMessage(err) {
  if (!err) return "An unknown error occurred.";
  let message = typeof err === "string" ? err : err.message || "";

  // Check for tRPC error code
  const code = err?.data?.code || err?.code;
  if (code === "UNAUTHORIZED") {
    return "You must be logged in to perform this action.";
  }
  if (code === "FORBIDDEN") {
    return "You do not have permission to perform this action.";
  }
  if (code === "NOT_FOUND") {
    return "The requested resource was not found.";
  }
  if (code === "CONFLICT") {
    return "This email is already registered.";
  }
  if (code === "BAD_REQUEST") {
    // BAD_REQUEST is often used for validation or user input errors; fallback to message mapping
  }
  if (code === "INTERNAL_SERVER_ERROR") {
    return "The service is temporarily unavailable. Please try again later.";
  }

  // Try to parse JSON error arrays (Zod validation, etc.)
  try {
    if (
      typeof message === "string" &&
      message.startsWith("[") &&
      message.includes("code")
    ) {
      const parsed = JSON.parse(message);
      if (Array.isArray(parsed) && parsed[0]?.message) {
        // Return the first error message (or join all)
        return parsed.map((e) => e.message).join("\n");
      }
    }
  } catch {}

  // More specific error mappings
  if (
    /invalid credentials|wrong password|incorrect password|invalid email or password/i.test(
      message
    )
  ) {
    return "Incorrect email or password. Please try again.";
  }
  if (/email not verified|verify your email/i.test(message)) {
    return "Your email address is not verified. Please check your inbox or spam folder for a verification link.";
  }
  if (
    /account (disabled|inactive|not approved|pending approval)/i.test(message)
  ) {
    return "Your account is not active or not approved yet. Please contact support if you believe this is a mistake.";
  }
  if (/file too large|image too large|payload too large/i.test(message)) {
    return "The file or image is too large. Please upload a smaller file.";
  }
  if (
    /unsupported file type|invalid file type|invalid image type/i.test(message)
  ) {
    return "The file type is not supported. Please upload a valid image file (JPG, PNG, etc.).";
  }
  if (
    /server error|internal server error|service unavailable|maintenance/i.test(
      message
    )
  ) {
    return "The server is currently unavailable. Please try again later.";
  }
  if (/rate limit|too many requests|slow down/i.test(message)) {
    return "You are sending requests too quickly. Please wait a moment and try again.";
  }
  if (
    /expired token|invalid token|session expired|jwt expired/i.test(message)
  ) {
    return "Your session has expired. Please log in again.";
  }
  if (/password must contain|password too weak|weak password/i.test(message)) {
    return "Your password is too weak. Please use at least 8 characters, including uppercase, lowercase, and a number.";
  }
  if (
    /ai quota exceeded|ai description limit|ai limit reached/i.test(message)
  ) {
    return "You have reached your daily limit for AI-generated descriptions. Please try again tomorrow or contact support for more info.";
  }
  if (/contact support|please contact support/i.test(message)) {
    return "Something went wrong. Please contact support if this issue persists.";
  }

  // Existing known error patterns
  if (
    /unique constraint failed|already in use|user already exists/i.test(message)
  ) {
    return "This email is already registered.";
  }
  if (/invalid email/i.test(message)) {
    return "Please enter a valid email address.";
  }
  if (/invalid current password/i.test(message)) {
    return "The current password you entered is incorrect.";
  }
  if (/monthly upload limit reached/i.test(message)) {
    return "This artist has reached their monthly upload limit.";
  }
  if (/not found/i.test(message)) {
    return "The requested resource was not found.";
  }
  if (/network error|failed to fetch/i.test(message)) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return "You appear to be offline. Please check your internet connection.";
    }
    return "Could not connect to the server. Please try again later.";
  }
  if (/cloudinary/i.test(message)) {
    return "There was an issue with the image upload. Please try a different image or try again later.";
  }
  if (/permission denied|unauthorized|forbidden/i.test(message)) {
    return "You do not have permission to perform this action.";
  }
  if (/invalid phone/i.test(message)) {
    return "Please enter a valid phone number.";
  }
  // Add more mappings as needed

  // Even more user-friendly error mappings
  if (
    /payment required|payment failed|card declined|insufficient funds/i.test(
      message
    )
  ) {
    return "Payment failed. Please check your card details or try another payment method.";
  }
  if (
    /verification failed|invalid verification code|expired verification code/i.test(
      message
    )
  ) {
    return "Verification failed. Please check the code and try again, or request a new one.";
  }
  if (/email already verified/i.test(message)) {
    return "Your email is already verified. You can log in now.";
  }
  if (
    /account locked|too many failed attempts|temporarily locked/i.test(message)
  ) {
    return "Your account is temporarily locked due to too many failed attempts. Please try again later or reset your password.";
  }
  if (/file not found|missing file|no file uploaded/i.test(message)) {
    return "No file was uploaded or the file could not be found. Please try again.";
  }
  if (/timeout|request timed out|took too long/i.test(message)) {
    return "The request took too long. Please check your connection and try again.";
  }
  if (/invalid input|malformed|parse error/i.test(message)) {
    return "Some input was invalid or could not be processed. Please check your entries and try again.";
  }
  if (/maintenance|temporarily unavailable|try again later/i.test(message)) {
    return "The service is temporarily unavailable for maintenance. Please try again later.";
  }
  if (/resource limit|out of memory|quota exceeded/i.test(message)) {
    return "The system is temporarily overloaded. Please try again in a few minutes.";
  }
  if (/duplicate|already exists|already submitted/i.test(message)) {
    return "This item has already been submitted or exists. Please check your entries.";
  }
  if (/not authorized|not authenticated|login required/i.test(message)) {
    return "You must be logged in to perform this action.";
  }
  if (/invalid url|bad url|url not allowed/i.test(message)) {
    return "The URL you entered is invalid or not allowed.";
  }
  if (/unsupported operation|not implemented/i.test(message)) {
    return "This feature is not available yet. Please check back later.";
  }

  // Fallback
  return message || "An unexpected error occurred. Please try again later.";
}
