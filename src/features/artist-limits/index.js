/**
 * Public barrel for the artist-limits feature module.
 * Consumers import via:
 *   import ArtistLimitsModal from "@/features/artist-limits";
 *
 * Re-exporting ARTIST_LIMITS_CONFIG allows consumers that need the config
 * for defaults/validation to access it without reaching into internals.
 */
export { default } from "./ArtistLimitsModal";
export { ARTIST_LIMITS_CONFIG } from "./config/artistLimitsFields.config";
