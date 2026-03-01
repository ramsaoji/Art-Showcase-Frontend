import { logEvent } from "firebase/analytics";
import { analytics } from "@/lib/firebase";

/**
 * Safely logs a Firebase Analytics event.
 * @param {string} eventName - The analytics event name.
 * @param {Object} [eventParams={}] - Optional event parameters.
 */
const safeLogEvent = async (eventName, eventParams = {}) => {
  try {
    const analyticsInstance = await analytics;
    if (analyticsInstance) {
      logEvent(analyticsInstance, eventName, eventParams);
    }
  } catch (error) {
    // Analytics error silently handled
  }
};

// Track page views
/**
 * Tracks a page view event.
 * @param {string} pagePath - URL path.
 */
export const trackPageView = (pagePath) => {
  safeLogEvent("page_view", {
    page_path: pagePath,
    page_title: document.title,
  });
};

// Track artwork interactions
/**
 * Tracks artwork-related user interactions (view, delete, quick-view, etc.).
 * @param {string} action - Interaction type.
 * @param {string} artworkId - ID of the artwork.
 * @param {string} [artworkTitle] - Optional artwork title.
 */
export const trackArtworkInteraction = (action, artworkId, artworkTitle) => {
  safeLogEvent("artwork_interaction", {
    action,
    artwork_id: artworkId,
    artwork_title: artworkTitle,
  });
};

// Track user actions
/**
 * Tracks a generic user action event.
 * @param {string} action - Action identifier.
 * @param {string} [userId=null] - Optional user ID.
 */
export const trackUserAction = (action, userId = null) => {
  safeLogEvent("user_action", { action, user_id: userId });
};

// Track form submissions
/**
 * Tracks a form submission event.
 * @param {string} formType - Type of the form.
 * @param {Object} [formData={}] - Optional form data.
 */
export const trackFormSubmission = (formType, formData = {}) => {
  safeLogEvent("form_submit", { form_type: formType, ...formData });
};

// Track likes
/**
 * Tracks a like event.
 * @param {string} artworkId - ID of the artwork.
 * @param {string} artworkTitle - Title of the artwork.
 */
export const trackLike = (artworkId, artworkTitle) => {
  safeLogEvent("like_artwork", {
    artwork_id: artworkId,
    artwork_title: artworkTitle,
  });
};

// Track shares
export const trackShare = (artworkId, platform) => {
  safeLogEvent("share_artwork", {
    artwork_id: artworkId,
    share_platform: platform,
  });
};

// Track search
export const trackSearch = (searchTerm, resultCount) => {
  safeLogEvent("search", {
    search_term: searchTerm,
    result_count: resultCount,
  });
};

// Track filter usage
export const trackFilter = (filterType, filterValue) => {
  safeLogEvent("apply_filter", {
    filter_type: filterType,
    filter_value: filterValue,
  });
};

// Track artwork views
export const trackArtworkView = (artworkId, artworkTitle) => {
  safeLogEvent("view_artwork", {
    artwork_id: artworkId,
    artwork_title: artworkTitle,
  });
};

// Track errors
export const trackError = (errorMessage, componentName) => {
  safeLogEvent("error", {
    error_message: errorMessage,
    component: componentName,
  });
};
