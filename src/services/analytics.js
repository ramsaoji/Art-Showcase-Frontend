import { logEvent } from "firebase/analytics";
import { analytics } from "../firebase/config";

// Helper function to safely log events
const safeLogEvent = async (eventName, eventParams = {}) => {
  try {
    const analyticsInstance = await analytics;
    if (analyticsInstance) {
      logEvent(analyticsInstance, eventName, eventParams);
    }
  } catch (error) {
    console.error("[Analytics] Error:", {
      event: eventName,
      error: error.message,
    });
  }
};

// Track page views
export const trackPageView = (pagePath) => {
  safeLogEvent("page_view", {
    page_path: pagePath,
    page_title: document.title,
  });
};

// Track artwork interactions
export const trackArtworkInteraction = (action, artworkId, artworkTitle) => {
  safeLogEvent("artwork_interaction", {
    action,
    artwork_id: artworkId,
    artwork_title: artworkTitle,
  });
};

// Track user actions
export const trackUserAction = (action, userId = null) => {
  safeLogEvent("user_action", { action, user_id: userId });
};

// Track form submissions
export const trackFormSubmission = (formType, formData = {}) => {
  safeLogEvent("form_submit", { form_type: formType, ...formData });
};

// Track likes
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
