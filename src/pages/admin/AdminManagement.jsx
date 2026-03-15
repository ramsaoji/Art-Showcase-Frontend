import React, { useEffect, useState } from "react";
import CarouselManagement from "./CarouselManagement";
import FeaturedArtworksManagement from "./FeaturedArtworksManagement";
import ArtistsManagement from "./ArtistsManagement";
import ActivityLogs from "./ActivityLogs";
import { motion, AnimatePresence } from "framer-motion";
import PageBackground from "@/components/common/PageBackground";
import PageHeader from "@/components/common/PageHeader";
import AnimatedTabs from "@/components/common/AnimatedTabs";
import { containerMotion, tabContentMotion } from "@/lib/motionConfigs";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/lib/rbac";

const ADMIN_TABS = [
  { id: "artist-approvals", label: "Artists" },
  { id: "carousel",         label: "Carousel" },
  { id: "featured",         label: "Featured Artworks" },
  { id: "activity-logs",    label: "Activity Logs" },
];

const AdminManagement = () => {
  const { can } = useAuth();
  const canManageArtists =
    can(PERMISSIONS.ARTIST_APPROVE) ||
    can(PERMISSIONS.ARTIST_QUOTA_MANAGE) ||
    can(PERMISSIONS.USER_STATE_MANAGE) ||
    can(PERMISSIONS.USER_DELETE_ANY);
  const canManageCarousel = can(PERMISSIONS.CAROUSEL_MANAGE);
  const canManageFeatured = can(PERMISSIONS.ARTWORK_FEATURE_MANAGE);
  const canReadAuditLogs = can(PERMISSIONS.AUDIT_READ_ANY);
  const availableTabs = ADMIN_TABS.filter((tab) => {
    if (tab.id === "artist-approvals") {
      return canManageArtists;
    }
    if (tab.id === "carousel") {
      return canManageCarousel;
    }
    if (tab.id === "featured") {
      return canManageFeatured;
    }
    if (tab.id === "activity-logs") {
      return canReadAuditLogs;
    }
    return false;
  });
  const [activeTab, setActiveTab] = useState("artist-approvals");

  useEffect(() => {
    if (!availableTabs.some((tab) => tab.id === activeTab) && availableTabs[0]) {
      setActiveTab(availableTabs[0].id);
    }
  }, [activeTab, availableTabs]);

  return (
    <div className="relative min-h-screen bg-gray-50/50">
      <PageBackground variant="purple" />

      <motion.div
        {...containerMotion}
        className="relative container mx-auto px-4 sm:px-8 py-12"
      >
        <PageHeader
          title="Admin Management"
          subtitle="Manage artists, the homepage carousel, and featured artworks."
        />

        <AnimatedTabs
          tabs={availableTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          layoutId="admin-tab-pill"
          variant="outer"
        />

        <div className="mt-8 bg-white/80 backdrop-blur-xl shadow-xl rounded-2xl p-4 sm:p-6 md:p-8 border border-white/30 min-h-[400px]">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "artist-approvals" && canManageArtists && (
              <motion.div key="artist-approvals" {...tabContentMotion}>
                <ArtistsManagement />
              </motion.div>
            )}
            {activeTab === "carousel" && canManageCarousel && (
              <motion.div key="carousel" {...tabContentMotion}>
                <CarouselManagement />
              </motion.div>
            )}
            {activeTab === "featured" && canManageFeatured && (
              <motion.div key="featured" {...tabContentMotion}>
                <FeaturedArtworksManagement />
              </motion.div>
            )}
            {activeTab === "activity-logs" && canReadAuditLogs && (
              <motion.div key="activity-logs" {...tabContentMotion}>
                <ActivityLogs />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminManagement;
