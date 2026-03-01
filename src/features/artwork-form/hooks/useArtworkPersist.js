import { useMemo, useEffect, useRef } from "react";
import { toDatetimeLocalValue } from "@/utils/formatters";

/**
 * Manages localStorage persistence for the artwork form (create mode only).
 * Handles saving/restoring form text data, dimensions, artist selection,
 * and the image-presence flag across page refreshes.
 *
 * @param {object} params
 * @param {string} params.userId - Current user's ID, used to namespace storage keys.
 * @param {boolean} params.isSuperAdmin - Whether the current user is a super admin.
 * @param {object|null} params.initialData - Null in create mode; persistence is disabled in edit mode.
 * @returns {object} Persistence utilities.
 */
export function useArtworkPersist({ userId, isSuperAdmin, initialData }) {
  const isEditMode = !!initialData;

  // ─── Namespaced localStorage keys ─────────────────────────────────────────
  const FORM_DATA_KEY = `artwork_form_data_${userId}`;
  const DIMENSIONS_KEY = `artwork_dimensions_${userId}`;
  const ARTIST_ID_KEY = `artwork_artist_id_${userId}`;
  const IMAGE_FLAG_KEY = `artwork_form_has_image_${userId}`;

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Returns the default expiresAt for admin create mode (30 days from now). */
  const getDefaultExpiresAt = () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return toDatetimeLocalValue(future);
  };

  /**
   * Derives the initial form values.
   * In edit mode: maps from initialData.
   * In create mode: restores from localStorage, or falls back to defaults.
   */
  const getInitialFormData = () => {
    if (isEditMode) {
      let width = "", height = "";
      if (initialData.dimensions) {
        const match = initialData.dimensions.match(/(\d+(?:\.\d+)?)cm × (\d+(?:\.\d+)?)cm/);
        if (match) { width = match[1]; height = match[2]; }
      }
      return {
        title: initialData.title || "",
        material: initialData.material || "",
        style: initialData.style || "",
        description: initialData.description || "",
        price: initialData.price || "",
        year: initialData.year || new Date().getFullYear(),
        featured: initialData.featured || false,
        sold: initialData.sold || false,
        instagramReelLink: initialData.instagramReelLink || "",
        youtubeVideoLink: initialData.youtubeVideoLink || "",
        artistId: "",
        width,
        height,
        dimensions: initialData.dimensions || "",
        expiresAt: initialData.expiresAt
          ? toDatetimeLocalValue(new Date(initialData.expiresAt))
          : "",
        status: initialData.status || "ACTIVE",
        images: initialData.images || [],
      };
    }

    // Create mode: attempt to restore from localStorage
    const savedData = localStorage.getItem(FORM_DATA_KEY);
    const savedArtistId = localStorage.getItem(ARTIST_ID_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const { image, imageFile, imagePreview, ...clean } = parsed;
        return {
          ...clean,
          artistId: savedArtistId || clean.artistId || "",
          status: parsed.status || "ACTIVE",
          ...(isSuperAdmin && {
            expiresAt: parsed.expiresAt ? toDatetimeLocalValue(parsed.expiresAt) : "",
          }),
          images: [],
        };
      } catch {
        // Silently fall through to defaults
      }
    }

    return {
      title: "",
      material: "",
      style: "",
      description: "",
      price: "",
      year: new Date().getFullYear(),
      featured: false,
      sold: false,
      instagramReelLink: "",
      youtubeVideoLink: "",
      artistId: savedArtistId || "",
      width: "",
      height: "",
      dimensions: "",
      status: "ACTIVE",
      ...(isSuperAdmin && { expiresAt: getDefaultExpiresAt() }),
      images: [],
    };
  };

  /** Derives initial dimension inputs from initialData or localStorage. */
  const getInitialDimensions = () => {
    if (initialData?.dimensions) {
      const match = initialData.dimensions.match(/(\d+(?:\.\d+)?)cm × (\d+(?:\.\d+)?)cm/);
      if (match) return { width: match[1], height: match[2] };
    }
    const saved = localStorage.getItem(DIMENSIONS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fall through */ }
    }
    return { width: "", height: "" };
  };

  /**
   * Checks whether there is saved form data (text) but no image (lost on refresh).
   * Only returns true if there was previously a selected image AND there is
   * meaningful text content in the form.
   */
  const checkHasFormDataButNoImage = () => {
    if (isEditMode) return false;
    if (localStorage.getItem(IMAGE_FLAG_KEY) !== "true") return false;
    const saved = localStorage.getItem(FORM_DATA_KEY);
    if (!saved) return false;
    try {
      const parsed = JSON.parse(saved);
      return !!(
        parsed.title || parsed.material || parsed.style || parsed.description ||
        parsed.price || (parsed.year && parsed.year !== new Date().getFullYear())
      );
    } catch {
      return false;
    }
  };

  /**
   * Persists current form data to localStorage (create mode only).
   * Should be called from a useEffect watching watchedValues.
   */
  const persist = ({ watchedValues, dimensionInputs, artistId }) => {
    if (isEditMode) return;
    const { image, imageFile, imagePreview, ...clean } = {
      ...watchedValues,
      artistId: watchedValues.artistId || artistId,
    };
    localStorage.setItem(FORM_DATA_KEY, JSON.stringify(clean));
    localStorage.setItem(DIMENSIONS_KEY, JSON.stringify(dimensionInputs));
    if (isSuperAdmin && artistId) {
      localStorage.setItem(ARTIST_ID_KEY, artistId);
    }
  };

  /** Clears all persisted form state from localStorage. */
  const clearPersisted = () => {
    localStorage.removeItem(FORM_DATA_KEY);
    localStorage.removeItem(DIMENSIONS_KEY);
    localStorage.removeItem(ARTIST_ID_KEY);
    localStorage.removeItem(IMAGE_FLAG_KEY);
  };

  /** Sets the image presence flag (called when images are added). */
  const markImagePresent = () => localStorage.setItem(IMAGE_FLAG_KEY, "true");

  /** Clears the image presence flag (called when all images are removed). */
  const clearImageFlag = () => localStorage.removeItem(IMAGE_FLAG_KEY);

  /** Returns the persisted artist ID (for admin create mode restore on mount). */
  const getPersistedArtistId = () => localStorage.getItem(ARTIST_ID_KEY) || "";

  return {
    ARTIST_ID_KEY,
    getInitialFormData,
    getInitialDimensions,
    checkHasFormDataButNoImage,
    getDefaultExpiresAt,
    persist,
    clearPersisted,
    markImagePresent,
    clearImageFlag,
    getPersistedArtistId,
  };
}
