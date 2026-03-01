import React, { useState } from "react";
import CarouselManagement from "./CarouselManagement";
import FeaturedArtworksManagement from "./FeaturedArtworksManagement";
import ArtistsManagement from "./ArtistsManagement";
import { motion, AnimatePresence } from "framer-motion";
import PageBackground from "@/components/common/PageBackground";
import PageHeader from "@/components/common/PageHeader";
import AnimatedTabs from "@/components/common/AnimatedTabs";
import { containerMotion, tabContentMotion } from "@/lib/motionConfigs";

const ADMIN_TABS = [
  { id: "artist-approvals", label: "Artists" },
  { id: "carousel", label: "Carousel" },
  { id: "featured", label: "Featured Artworks" },
];

const AdminManagement = () => {
  const [activeTab, setActiveTab] = useState("artist-approvals");

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
          tabs={ADMIN_TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
          layoutId="admin-tab-pill"
          variant="outer"
        />

        <div className="mt-8 bg-white/80 backdrop-blur-xl shadow-xl rounded-2xl p-4 sm:p-6 md:p-8 border border-white/30 min-h-[400px]">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "artist-approvals" && (
              <motion.div key="artist-approvals" {...tabContentMotion}>
                <ArtistsManagement />
              </motion.div>
            )}
            {activeTab === "carousel" && (
              <motion.div key="carousel" {...tabContentMotion}>
                <CarouselManagement />
              </motion.div>
            )}
            {activeTab === "featured" && (
              <motion.div key="featured" {...tabContentMotion}>
                <FeaturedArtworksManagement />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminManagement;
