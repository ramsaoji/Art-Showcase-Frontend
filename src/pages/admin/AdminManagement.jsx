import React, { useState } from "react";
import CarouselManagement from "./CarouselManagement";
import FeaturedArtworksManagement from "./FeaturedArtworksManagement";
import ArtistApprovals from "./ArtistApprovals";
import { motion, AnimatePresence } from "framer-motion";

const AdminManagement = () => {
  const [activeTab, setActiveTab] = useState("artist-approvals");

  return (
    <div className="relative min-h-screen bg-gray-50/50">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-64 left-1/2 transform -translate-x-1/3 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-64 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/10 to-transparent blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative container mx-auto px-4 sm:px-8 py-12"
      >
        <div className="text-center mb-12">
          <h1 className="text-5xl lg:text-6xl font-bold mb-4 font-artistic tracking-wide text-gray-900">
            Admin Management
          </h1>
          <p className="text-lg text-gray-600 font-sans">
            Manage artist approvals, the homepage carousel, and featured
            artworks.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-2 sm:gap-0 mb-4 relative">
          <div className="flex w-full sm:w-auto relative">
            <AnimatePresence>
              {activeTab === "artist-approvals" && (
                <motion.div
                  layoutId="admin-tab-pill"
                  className="absolute z-0 h-full w-full bg-white/60 rounded-xl"
                  style={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </AnimatePresence>
            <motion.button
              layout
              className={`relative z-10 px-6 py-2 font-sans font-semibold text-base transition-all duration-300 rounded-xl w-full sm:w-auto ${
                activeTab === "artist-approvals"
                  ? "text-indigo-700 font-bold shadow"
                  : "text-gray-500 hover:text-indigo-500"
              }`}
              onClick={() => setActiveTab("artist-approvals")}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              Artist Approvals
            </motion.button>
          </div>
          <div className="flex w-full sm:w-auto relative">
            <AnimatePresence>
              {activeTab === "carousel" && (
                <motion.div
                  layoutId="admin-tab-pill"
                  className="absolute z-0 h-full w-full bg-white/60 rounded-xl"
                  style={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </AnimatePresence>
            <motion.button
              layout
              className={`relative z-10 px-6 py-2 font-sans font-semibold text-base transition-all duration-300 rounded-xl w-full sm:w-auto ${
                activeTab === "carousel"
                  ? "text-indigo-700 font-bold shadow"
                  : "text-gray-500 hover:text-indigo-500"
              }`}
              onClick={() => setActiveTab("carousel")}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              Carousel
            </motion.button>
          </div>
          <div className="flex w-full sm:w-auto relative">
            <AnimatePresence>
              {activeTab === "featured" && (
                <motion.div
                  layoutId="admin-tab-pill"
                  className="absolute z-0 h-full w-full bg-white/60 rounded-xl"
                  style={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </AnimatePresence>
            <motion.button
              layout
              className={`relative z-10 px-6 py-2 font-sans font-semibold text-base transition-all duration-300 rounded-xl w-full sm:w-auto ${
                activeTab === "featured"
                  ? "text-indigo-700 font-bold shadow"
                  : "text-gray-500 hover:text-indigo-500"
              }`}
              onClick={() => setActiveTab("featured")}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              Featured Artworks
            </motion.button>
          </div>
        </div>

        <div className="mt-8 bg-white/80 backdrop-blur-xl shadow-xl rounded-2xl p-4 sm:p-6 md:p-8 border border-white/30 min-h-[400px]">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "artist-approvals" && (
              <motion.div
                key="artist-approvals"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <ArtistApprovals />
              </motion.div>
            )}
            {activeTab === "carousel" && (
              <motion.div
                key="carousel"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <CarouselManagement />
              </motion.div>
            )}
            {activeTab === "featured" && (
              <motion.div
                key="featured"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
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
