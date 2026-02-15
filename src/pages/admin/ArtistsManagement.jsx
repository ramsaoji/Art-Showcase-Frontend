import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ArtistApprovals from "./ArtistApprovals";
import ArtistQuotaLimits from "./ArtistQuotaLimits";

const tabPillTransition = { type: "spring", stiffness: 500, damping: 30 };
const tabButtonTransition = { type: "spring", stiffness: 400, damping: 20 };

const tabContentMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.2, ease: "easeInOut" },
};

export default function ArtistsManagement() {
  const [subTab, setSubTab] = useState("approvals");

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-start items-stretch sm:items-center gap-2 sm:gap-1 mb-6 relative">
        <div className="flex w-full sm:w-auto relative">
          <AnimatePresence>
            {subTab === "approvals" && (
              <motion.div
                layoutId="artists-sub-tab-pill"
                className="absolute z-0 h-full w-full bg-indigo-50 rounded-xl border border-indigo-100"
                style={{ left: 0, right: 0, top: 0, bottom: 0 }}
                transition={tabPillTransition}
              />
            )}
          </AnimatePresence>
          <motion.button
            layout
            type="button"
            className={`relative z-10 px-5 py-2 font-sans font-semibold text-sm transition-all duration-300 rounded-xl w-full sm:w-auto border ${
              subTab === "approvals"
                ? "border-transparent text-indigo-700 font-bold shadow-sm"
                : "border-gray-200 text-gray-500 hover:text-indigo-500 hover:border-indigo-300 bg-white/50"
            }`}
            onClick={() => setSubTab("approvals")}
            whileTap={{ scale: 0.98 }}
            transition={tabButtonTransition}
          >
            Approvals
          </motion.button>
        </div>
        <div className="flex w-full sm:w-auto relative">
          <AnimatePresence>
            {subTab === "quota" && (
              <motion.div
                layoutId="artists-sub-tab-pill"
                className="absolute z-0 h-full w-full bg-indigo-50 rounded-xl border border-indigo-100"
                style={{ left: 0, right: 0, top: 0, bottom: 0 }}
                transition={tabPillTransition}
              />
            )}
          </AnimatePresence>
          <motion.button
            layout
            type="button"
            className={`relative z-10 px-5 py-2 font-sans font-semibold text-sm transition-all duration-300 rounded-xl w-full sm:w-auto border ${
              subTab === "quota"
                ? "border-transparent text-indigo-700 font-bold shadow-sm"
                : "border-gray-200 text-gray-500 hover:text-indigo-500 hover:border-indigo-300 bg-white/50"
            }`}
            onClick={() => setSubTab("quota")}
            whileTap={{ scale: 0.98 }}
            transition={tabButtonTransition}
          >
            Quota & limits
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {subTab === "approvals" && (
          <motion.div key="approvals" {...tabContentMotion}>
            <ArtistApprovals />
          </motion.div>
        )}
        {subTab === "quota" && (
          <motion.div key="quota" {...tabContentMotion}>
            <ArtistQuotaLimits />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
