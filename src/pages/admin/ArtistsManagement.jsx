import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ArtistApprovals from "./ArtistApprovals";
import ArtistQuotaLimits from "./ArtistQuotaLimits";
import AnimatedTabs from "@/components/common/AnimatedTabs";
import { subTabContentMotion } from "@/lib/motionConfigs";

const ARTISTS_SUB_TABS = [
  { id: "approvals", label: "Approvals" },
  { id: "quota", label: "Quota & limits" },
];

/**
 * ArtistsManagement Page
 * Admin sub-tab shell that composes the Approvals and Quota & Limits views
 * using animated tab switching. No form logic — pure layout orchestrator.
 */
export default function ArtistsManagement() {
  const [subTab, setSubTab] = useState("approvals");

  return (
    <div className="w-full">
      <AnimatedTabs
        tabs={ARTISTS_SUB_TABS}
        activeTab={subTab}
        onChange={setSubTab}
        layoutId="artists-sub-tab-pill"
        variant="inner"
      />

      <AnimatePresence mode="wait" initial={false}>
        {subTab === "approvals" && (
          <motion.div key="approvals" {...subTabContentMotion}>
            <ArtistApprovals />
          </motion.div>
        )}
        {subTab === "quota" && (
          <motion.div key="quota" {...subTabContentMotion}>
            <ArtistQuotaLimits />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
