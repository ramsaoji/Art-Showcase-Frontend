/**
 * @file artistLimitsFields.config.js
 * Config-driven field definitions for the Artist Limits modal.
 *
 * Add a new limit by adding one object here — zero JSX changes needed.
 * Each entry matches the API key used by the backend mutation.
 */

/** @type {Array} */
export const ARTIST_LIMITS_CONFIG = [
  {
    key: "monthlyUploadLimit",
    label: "Monthly upload limit",
    description: "Max artworks this artist can upload per calendar month.",
    min: 1,
    max: 1000,
    defaultKey: "monthlyUpload",
  },
  {
    key: "aiDescriptionDailyLimit",
    label: "AI description daily limit",
    description: "Max AI-generated descriptions per day.",
    min: 1,
    max: 100,
    defaultKey: "aiDescriptionDaily",
  },
  {
    key: "imageUploadLimit",
    label: "Images per artwork",
    description: "Max images allowed per single artwork.",
    min: 1,
    max: 1000,
    defaultKey: "imageUpload",
  },
];
