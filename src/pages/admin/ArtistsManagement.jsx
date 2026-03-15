import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ArtistApprovals from "./ArtistApprovals";
import ArtistQuotaLimits from "./ArtistQuotaLimits";
import AnimatedTabs from "@/components/common/AnimatedTabs";
import { subTabContentMotion } from "@/lib/motionConfigs";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/lib/rbac";

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
  const { can } = useAuth();
  const canReviewArtistAccounts =
    can(PERMISSIONS.ARTIST_APPROVE) ||
    can(PERMISSIONS.USER_STATE_MANAGE) ||
    can(PERMISSIONS.USER_DELETE_ANY);
  const canManageArtistQuotas = can(PERMISSIONS.ARTIST_QUOTA_MANAGE);
  const availableTabs = useMemo(
    () =>
      ARTISTS_SUB_TABS.filter((tab) => {
        if (tab.id === "approvals") {
          return canReviewArtistAccounts;
        }

        if (tab.id === "quota") {
          return canManageArtistQuotas;
        }

        return false;
      }),
    [canManageArtistQuotas, canReviewArtistAccounts]
  );
  const [subTab, setSubTab] = useState("approvals");

  useEffect(() => {
    if (!availableTabs.some((tab) => tab.id === subTab) && availableTabs[0]) {
      setSubTab(availableTabs[0].id);
    }
  }, [availableTabs, subTab]);

  return (
    <div className="w-full">
      <AnimatedTabs
        tabs={availableTabs}
        activeTab={subTab}
        onChange={setSubTab}
        layoutId="artists-sub-tab-pill"
        variant="inner"
      />

      <AnimatePresence mode="wait" initial={false}>
        {subTab === "approvals" && canReviewArtistAccounts && (
          <motion.div key="approvals" {...subTabContentMotion}>
            <ArtistApprovals />
          </motion.div>
        )}
        {subTab === "quota" && canManageArtistQuotas && (
          <motion.div key="quota" {...subTabContentMotion}>
            <ArtistQuotaLimits />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
