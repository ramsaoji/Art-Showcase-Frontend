/**
 * filterUtils.js — Shared constants and pure utility functions for gallery filters.
 * Private to the gallery-filters feature module.
 */

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "discount-high", label: "Discount: High to Low" },
  { value: "discount-low", label: "Discount: Low to High" },
  { value: "year-new", label: "Year: Newest to Oldest" },
  { value: "year-old", label: "Year: Oldest to Newest" },
  { value: "artist-az", label: "Artist: A to Z" },
  { value: "artist-za", label: "Artist: Z to A" },
];

export const FEATURED_OPTIONS = [
  { value: "all", label: "All Artworks" },
  { value: "featured", label: "Featured Only" },
  { value: "non-featured", label: "Non-Featured" },
];

export const DISCOUNT_OPTIONS = [
  { value: "all", label: "All Artworks" },
  { value: "discounted", label: "Discounted" },
  { value: "non-discounted", label: "Non-Discounted" },
];

export const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "EXPIRED", label: "Expired" },
];

export const AVAILABILITY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "sold", label: "Sold" },
];

/**
 * Masks an email address for privacy display.
 * e.g. "john.doe@example.com" → "j***.e@example.com"
 *
 * @param {string} email - Raw email address.
 * @returns {string} Masked email string.
 */
export function maskEmail(email) {
  if (typeof email !== "string" || !email.includes("@")) return email;
  const [user, domain] = email.split("@");
  if (user.length <= 1) return `*@${domain}`;
  if (user.length === 2) return `${user[0]}*@${domain}`;
  return `${user[0]}${"*".repeat(user.length - 2)}${user[user.length - 1]}@${domain}`;
}

/**
 * Masks the email portion inside a label of the form "Name (email@example.com)".
 *
 * @param {string} label - Display label potentially containing an email in parentheses.
 * @returns {string} Label with email masked.
 */
export function maskEmailInLabel(label) {
  if (typeof label !== "string") return label;
  const match = label.match(/^(.*)\s+\(([^)]+)\)$/);
  if (match) {
    const name = match[1];
    const email = match[2];
    return `${name} (${maskEmail(email)})`;
  }
  return label;
}
