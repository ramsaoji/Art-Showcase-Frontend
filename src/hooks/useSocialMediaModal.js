import { useState, useCallback } from "react";

/**
 * useSocialMediaModal
 * Shared state + handlers for the SocialMediaModal trigger pattern.
 * Extracted from ArtworkCard and ImageModal to eliminate two copies
 * of identical state management.
 *
 * @returns {{
 *   socialMediaModal: { isOpen, type, url, title },
 *   openInstagramModal: (url: string, artworkTitle: string) => void,
 *   openYouTubeModal: (url: string, artworkTitle: string) => void,
 *   closeSocialMediaModal: () => void,
 * }}
 */
const CLOSED_STATE = { isOpen: false, type: null, url: null, title: null };

export default function useSocialMediaModal() {
  const [socialMediaModal, setSocialMediaModal] = useState(CLOSED_STATE);

  const openInstagramModal = useCallback((url, artworkTitle) => {
    setSocialMediaModal({
      isOpen: true,
      type: "instagram",
      url,
      title: `Instagram - ${artworkTitle}`,
    });
  }, []);

  const openYouTubeModal = useCallback((url, artworkTitle) => {
    setSocialMediaModal({
      isOpen: true,
      type: "youtube",
      url,
      title: `YouTube Video - ${artworkTitle}`,
    });
  }, []);

  const closeSocialMediaModal = useCallback(() => {
    setSocialMediaModal(CLOSED_STATE);
  }, []);

  return {
    socialMediaModal,
    openInstagramModal,
    openYouTubeModal,
    closeSocialMediaModal,
  };
}
